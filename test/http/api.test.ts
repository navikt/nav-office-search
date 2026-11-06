import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import recordedAdresser from '../fixtures/upstream/office-search-api/adresse.json';
import { API, startServer, type TestServer } from './harness';
import { on } from './stub';
import { AUTHORIZATION, json, NOT_FOUND_HTML, ORIGINS, ROUTES } from './upstreams';

let server: TestServer;

beforeAll(async () => {
	server = await startServer();
});

afterAll(() => server?.stop());

beforeEach(() => server.stub.reset());

afterEach(() => expect(server.stub.unexpected).toEqual([]));

// The media type only: its parameters are the framework's (framework-defaults.test.ts)
const get = async (path: string, init?: RequestInit) => {
	const response = await server.fetch(path, init);
	const type = response.headers.get('content-type')?.split(';')[0];
	const text = await response.text();
	return { status: response.status, type, body: type === 'application/json' ? JSON.parse(text) : text };
};

const search = (route: string, query: string) => get(`${API}/${route}?query=${encodeURIComponent(query)}`);

// What the server sent upstream while handling the request
const upstreamCalls = () => server.stub.requests.map(({ method, url }) => `${method} ${url}`);

const jsonLines = (values: unknown[]) => values.map((value) => JSON.stringify(value)).join('\n') + '\n';

const officeNames = (offices: { name: string }[]) => offices.map(({ name }) => name);

describe('/api/search with a postnummer', () => {
	test('answers from the loaded data', async () => {
		const result = await search('search', '4737');

		expect(result).toEqual({
			status: 200,
			type: 'application/json',
			body: {
				type: 'postnr',
				postnr: '4737',
				poststed: 'HORNNES',
				poststedNormalized: 'hornnes',
				kommuneNavn: 'EVJE OG HORNNES',
				kommunenr: '4219',
				kategori: 'G',
				officeInfo: [
					{
						name: 'Nav Evje og Hornnes',
						url: 'https://www.nav.no/kontor/nav-evje-og-hornnes',
						geoId: '4219',
						enhetNr: '0937',
						hitString: '',
					},
				],
			},
		});
		expect(upstreamCalls()).toEqual([]);
		expect(await search('search', ' 4737 ')).toEqual(result);
	});

	test('finds Nav Tromsø for Svalbard and Jan Mayen', async () => {
		expect(officeNames((await search('search', '9170')).body.officeInfo)).toEqual(['Nav Tromsø']);
		expect(officeNames((await search('search', '8099')).body.officeInfo)).toEqual(['Nav Tromsø']);
	});

	test('looks up the bydeler of a postnummer in a kommune with bydeler, and their offices', async () => {
		const { status, body } = await search('search', '0354');

		expect(status).toBe(200);
		expect(body.officeInfo).toEqual([
			{
				name: 'Nav Frogner',
				url: 'https://www.nav.no/kontor/nav-frogner',
				geoId: '030105',
				enhetNr: '0312',
				hitString: '',
			},
			{
				name: 'Nav St. Hanshaugen',
				url: 'https://www.nav.no/kontor/nav-st.hanshaugen',
				geoId: '030104',
				enhetNr: '0313',
				hitString: '',
			},
		]);
		expect(upstreamCalls()).toEqual([
			`GET ${ORIGINS.api}/bydel?postnummer=0354`,
			`GET ${ORIGINS.api}/geoid?id=030105`,
			`GET ${ORIGINS.api}/geoid?id=030104`,
		]);
		expect(server.stub.requests.map(({ headers }) => headers.authorization)).toEqual([
			AUTHORIZATION,
			AUTHORIZATION,
			AUTHORIZATION,
		]);
	});

	test('answers without offices when the postnummer has no bydel', async () => {
		const { status, body } = await search('search', '1001');

		expect([status, body.kommunenr, body.officeInfo]).toEqual([200, '0301', []]);
		expect(upstreamCalls()).toEqual([`GET ${ORIGINS.api}/bydel?postnummer=1001`]);
	});

	test('answers without offices when the bydel search fails (bug)', async () => {
		server.stub.override(on(ROUTES.bydel, () => json({ error: 'PDL is down' }, 502)));

		const { status, body } = await search('search', '0150');

		expect([status, body.officeInfo]).toEqual([200, []]);
	});

	test('answers 404 for an unknown postnummer', async () => {
		expect(await search('search', '0000')).toEqual({
			status: 404,
			type: 'application/json',
			body: { type: 'error', messageId: 'errorInvalidPostnr' },
		});
	});
});

describe('/api/search/name', () => {
	// Golden file name → query
	test.each([
		['oslo', 'oslo'],
		['nav-oslo', 'nav oslo'],
		['frogner', 'frogner'],
		['tromso', 'Tromsø'],
		['aas', 'ås'],
		['st-hanshaugen', 'st. hanshaugen'],
		['a', 'a'],
		['xyzzy', 'xyzzy'],
		// Bug: office names aren't normalized before matching, so this misses Nav Unjárga
		['unjarga', 'unjarga'],
	])('%s', async (golden, query) => {
		const { status, body } = await search('search/name', query);

		expect(status).toBe(200);
		expect(body.type).toBe('name');
		expect(body.input).toBe(query);
		await expect(jsonLines(body.hits)).toMatchFileSnapshot(`__goldens__/name-search/${golden}.jsonl`);
		expect(upstreamCalls()).toEqual([]);
	});

	test.each(['', ' '])('answers 400 for the query %j', async (query) => {
		expect(await search('search/name', query)).toEqual({
			status: 400,
			type: 'application/json',
			body: { type: 'error', messageId: 'errorMissingQuery' },
		});
	});
});

describe('/api/search dispatch', () => {
	test('answers a name with hits like /api/search/name', async () => {
		expect(await search('search', 'oslo')).toEqual(await search('search/name', 'oslo'));
	});

	test('falls back to an address search when no names match', async () => {
		expect((await search('search', 'storgata 1')).body).toEqual((await search('search/address', 'storgata 1')).body);
	});

	test.each([
		['without a query', ''],
		['with a blank query', '?query=%20'],
		['with the query twice', '?query=4737&query=0150'],
	])('answers 400 %s', async (_, queryString) => {
		expect(await get(`${API}/search${queryString}`)).toEqual({
			status: 400,
			type: 'application/json',
			body: { type: 'error', messageId: 'errorMissingQuery' },
		});
	});
});

describe('/api/search/address', () => {
	test('passes on what nav-office-search-api found', async () => {
		const { status, body } = await search('search/address', 'storgata 1');

		expect(status).toBe(200);
		expect(body).toEqual({
			type: 'adresse',
			adresseQuery: 'storgata 1',
			adresser: recordedAdresser['storgata 1'].body.adresser,
			totalHits: 412,
		});
		expect(upstreamCalls()).toEqual([`GET ${ORIGINS.api}/adresse?queryString=storgata%201`]);
		expect(server.stub.requests[0].headers.authorization).toBe(AUTHORIZATION);
	});

	test('answers an empty result when nothing is found', async () => {
		expect((await search('search/address', 'ukjent adresse 1')).body).toEqual({
			type: 'adresse',
			adresseQuery: 'ukjent adresse 1',
			adresser: [],
			totalHits: 0,
		});
	});

	test.each([
		['503 when nav-office-search-api answers 503', 503],
		['400 when nav-office-search-api answers 400 (bug)', 400],
	])('answers %s', async (_, status) => {
		server.stub.override(on(ROUTES.adresse, () => json({ error: 'Upstream error' }, status)));

		expect(await search('search/address', 'storgata 1')).toEqual({
			status,
			type: 'application/json',
			body: { type: 'error', messageId: 'errorServerError' },
		});
	});

	test("passes on nav-office-search-api's 400 for a query it rejects (bug)", async () => {
		expect(await search('search/address', '???')).toEqual({
			status: 400,
			type: 'application/json',
			body: { type: 'error', messageId: 'errorServerError' },
		});
	});

	test('answers 400 without a query, without asking nav-office-search-api', async () => {
		expect((await get(`${API}/search/address`)).body).toEqual({ type: 'error', messageId: 'errorMissingQuery' });
		expect(upstreamCalls()).toEqual([]);
	});
});

describe('/api/geoid', () => {
	test('answers the office for a geografisk id as a postnummer result', async () => {
		expect(await get(`${API}/geoid?id=030101`)).toEqual({
			status: 200,
			type: 'application/json',
			body: {
				type: 'postnr',
				postnr: '',
				poststed: 'Nav Gamle Oslo',
				poststedNormalized: '',
				kommuneNavn: '',
				kommunenr: '030101',
				kategori: 'G',
				officeInfo: [
					{
						name: 'Nav Gamle Oslo',
						url: 'https://www.nav.no/kontor/nav-gamle-oslo',
						geoId: '030101',
						enhetNr: '0316',
						hitString: '',
					},
				],
			},
		});
		expect(upstreamCalls()).toEqual([`GET ${ORIGINS.api}/geoid?id=030101`]);
	});

	test("passes on nav-office-search-api's 404 for an id without an office, like Jan Mayen", async () => {
		expect(await get(`${API}/geoid?id=2211`)).toEqual({
			status: 404,
			type: 'application/json',
			body: { type: 'error', messageId: 'errorServerError' },
		});
	});

	test.each(['', '?id=', '?id=%20'])('answers 400 for %j', async (queryString) => {
		expect(await get(`${API}/geoid${queryString}`)).toEqual({
			status: 400,
			type: 'application/json',
			body: { type: 'error', messageId: 'errorInvalidQuery' },
		});
		expect(upstreamCalls()).toEqual([]);
	});
});

describe('/api/loginstatus', () => {
	test('asks the login session endpoint with the cookies it got', async () => {
		const cookie = 'io.nais.wonderwall.session=abc; other=1';

		expect((await get(`${API}/loginstatus`, { headers: { cookie } })).body).toEqual({ isUserLoggedIn: true });
		expect(upstreamCalls()).toEqual([`GET ${ORIGINS.loginSession}`]);
		expect(server.stub.requests[0].headers.cookie).toBe(cookie);
	});

	test('answers false without a session', async () => {
		expect(await get(`${API}/loginstatus`)).toEqual({
			status: 200,
			type: 'application/json',
			body: { isUserLoggedIn: false },
		});
		expect(server.stub.requests[0].headers.cookie).toBeUndefined();
	});

	test('answers false when the login session endpoint is unreachable', async () => {
		server.stub.override(on(ROUTES.loginSession, () => Response.error()));

		expect(await get(`${API}/loginstatus`)).toEqual({
			status: 200,
			type: 'application/json',
			body: { isUserLoggedIn: false },
		});
	});
});

describe('/api/data', () => {
	test.each(['kommuner', 'bydeler'])('%s', async (dataset) => {
		const { status, body } = await get(`${API}/data/${dataset}`);

		expect(status).toBe(200);
		await expect(jsonLines(body)).toMatchFileSnapshot(`__goldens__/data/${dataset}.jsonl`);
	});

	test('poststeder', async () => {
		type Office = { geoId: string; enhetNr: string };
		type Poststed = Record<string, string | undefined> & { kommunenr: string; officeInfo: Office[] };
		const { status, body } = await get(`${API}/data/poststeder`);
		const kommuner: { kommunenr: string; officeInfo?: Office }[] = (await get(`${API}/data/kommuner`)).body;
		const poststeder: Poststed[] = body;

		expect(status).toBe(200);
		// Every poststed has its kommune's office (in the kommuner golden), so this golden only names it
		const officeOf = new Map(kommuner.map(({ kommunenr, officeInfo }) => [kommunenr, officeInfo]));
		const withOtherOffices = poststeder.filter(({ kommunenr, officeInfo }) => {
			const office = officeOf.get(kommunenr);
			return JSON.stringify(officeInfo) !== JSON.stringify(office ? [office] : []);
		});
		expect(withOtherOffices).toEqual([]);
		// Bug: the register's trailing newline
		expect(poststeder.at(-1)).toEqual({ postnr: '', poststedNormalized: '', officeInfo: [] });

		const fields = ['postnr', 'poststed', 'poststedNormalized', 'kommuneNavn', 'kommunenr', 'kategori'];
		const lines = poststeder.map((poststed) =>
			[...fields.map((field) => poststed[field] ?? ''), poststed.officeInfo.map(({ geoId }) => geoId).join(',')].join(
				'\t',
			),
		);
		await expect([[...fields, 'officeInfo'].join('\t'), ...lines].join('\n') + '\n').toMatchFileSnapshot(
			'__goldens__/data/poststeder.tsv',
		);
	});
});

test('answers unknown API paths with the nav.no 404 page (bug)', async () => {
	expect(await get(`${API}/finnes-ikke`)).toEqual({
		status: 404,
		type: 'text/html',
		body: NOT_FOUND_HTML,
	});
});
