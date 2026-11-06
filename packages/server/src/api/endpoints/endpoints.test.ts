import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import recordedAdresser from '../../../../../test/fixtures/upstream/office-search-api/adresse.json';
import { upstreamCalls, upstreams } from '../../../../../test/upstream/mswServer';
import type { SearchResultProps } from '../../../../common/types/results';
import { loadData } from '../../data/data';
import { geoidSearchHandler } from './geoid/geoidSearchHandler';
import { isAliveHandler } from './isAlive/isAliveHandler';
import { isReadyHandler } from './isReady/isReadyHandler';
import { loginStatusHandler } from './loginstatus/loginStatusHandler';
import { addressSearchHandler } from './search/addressSearchHandler';
import { nameSearchHandler } from './search/nameSearchHandler';
import { searchHandler } from './search/searchHandler';

const API = process.env.API_ORIGIN;
const NAVNO = process.env.VITE_NAVNO_ORIGIN;

// The access token, base64-encoded. nav-office-search-api never checks it.
const AUTHORIZATION = 'Bearer YXp1cmUtdG9rZW4=';

const upstreamUrls = () => upstreamCalls.map(({ method, url }) => `${method} ${url}`);

const officeNames = (body: SearchResultProps) =>
	body.type === 'postnr' ? body.officeInfo.map(({ name }) => name) : [];

const error = (messageId: string) => ({ type: 'error', messageId });

beforeAll(async () => {
	upstreams.listen();
	await loadData();
});

beforeEach(() => {
	upstreamCalls.length = 0;
});

afterEach(() => {
	upstreams.resetHandlers();
});

afterAll(() => {
	upstreams.close();
});

describe('searchHandler', () => {
	test('answers a postnummer from the loaded data', async () => {
		const response = await searchHandler('4737');

		expect(response).toEqual({
			status: 200,
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
						url: `${NAVNO}/kontor/nav-evje-og-hornnes`,
						geoId: '4219',
						enhetNr: '0937',
						hitString: '',
					},
				],
			},
		});
		expect(upstreamUrls()).toEqual([]);
		expect(await searchHandler(' 4737 ')).toEqual(response);
	});

	test.each(['9170', '8099'])('finds Nav Tromsø for %s, on Svalbard and Jan Mayen', async (postnr) => {
		expect(officeNames((await searchHandler(postnr)).body)).toEqual(['Nav Tromsø']);
	});

	test('looks up the bydeler of a postnummer in a kommune with bydeler, and their offices', async () => {
		const { status, body } = await searchHandler('0354');

		expect(status).toBe(200);
		expect(officeNames(body)).toEqual(['Nav Frogner', 'Nav St. Hanshaugen']);
		expect(upstreamUrls()).toEqual([
			`GET ${API}/bydel?postnummer=0354`,
			`GET ${API}/geoid?id=030105`,
			`GET ${API}/geoid?id=030104`,
		]);
		expect(upstreamCalls.map(({ headers }) => headers.authorization)).toEqual([
			AUTHORIZATION,
			AUTHORIZATION,
			AUTHORIZATION,
		]);
	});

	test('answers without offices when the postnummer has no bydel', async () => {
		const { status, body } = await searchHandler('1001');

		expect([status, officeNames(body)]).toEqual([200, []]);
	});

	test('answers without offices when the bydel search fails (bug)', async () => {
		upstreams.use(http.get(`${API}/bydel`, () => HttpResponse.json({ error: 'PDL is down' }, { status: 502 })));

		const { status, body } = await searchHandler('0150');

		expect([status, officeNames(body)]).toEqual([200, []]);
	});

	test('answers 404 for an unknown postnummer', async () => {
		expect(await searchHandler('0000')).toEqual({ status: 404, body: error('errorInvalidPostnr') });
	});

	test('answers a name with hits like the name search, without asking upstream', async () => {
		const response = await searchHandler('oslo');

		expect(response).toEqual(await nameSearchHandler('oslo'));
		expect(response.body.type).toBe('name');
		expect(upstreamUrls()).toEqual([]);
	});

	test('falls back to an address search when no names match', async () => {
		const response = await searchHandler('storgata 1');

		expect(response.body.type).toBe('adresse');
		expect(upstreamUrls()).toEqual([`GET ${API}/adresse?queryString=storgata%201`]);
	});

	test.each([undefined, '', ' '])('answers 400 for the query %j', async (query) => {
		expect(await searchHandler(query)).toEqual({ status: 400, body: error('errorMissingQuery') });
	});
});

describe('nameSearchHandler', () => {
	test('groups the offices under the names that match', async () => {
		const { status, body } = await nameSearchHandler('frogner');

		expect(status).toBe(200);
		expect(body).toMatchObject({
			type: 'name',
			input: 'frogner',
			hits: [
				{ name: 'Frogner', officeHits: [{ name: 'Nav Frogner', hitString: 'Frogner' }] },
				{ name: 'FROGNER', officeHits: [{ name: 'Nav Lillestrøm', hitString: 'FROGNER' }] },
			],
		});
	});

	test('ignores a "nav " prefix, but keeps the input as written', async () => {
		const withPrefix = await nameSearchHandler('nav oslo');
		const withoutPrefix = await nameSearchHandler('oslo');

		expect(withPrefix.body).toEqual({ ...withoutPrefix.body, input: 'nav oslo' });
	});

	test('answers no hits, without trying addresses', async () => {
		expect(await nameSearchHandler('xyzzy')).toEqual({
			status: 200,
			body: { type: 'name', input: 'xyzzy', hits: [] },
		});
		expect(upstreamUrls()).toEqual([]);
	});

	test.each([undefined, '', ' '])('answers 400 for the query %j', async (query) => {
		expect(await nameSearchHandler(query)).toEqual({ status: 400, body: error('errorMissingQuery') });
	});
});

describe('addressSearchHandler', () => {
	test('passes on what nav-office-search-api found', async () => {
		expect(await addressSearchHandler('storgata 1')).toEqual({
			status: 200,
			body: {
				type: 'adresse',
				adresseQuery: 'storgata 1',
				adresser: recordedAdresser['storgata 1'].body.adresser,
				totalHits: 412,
			},
		});
		expect(upstreamUrls()).toEqual([`GET ${API}/adresse?queryString=storgata%201`]);
		expect(upstreamCalls[0].headers.authorization).toBe(AUTHORIZATION);
	});

	test('answers an empty result when nothing is found', async () => {
		expect(await addressSearchHandler('ukjent adresse 1')).toEqual({
			status: 200,
			body: { type: 'adresse', adresseQuery: 'ukjent adresse 1', adresser: [], totalHits: 0 },
		});
	});

	test.each([503, 400])('passes on status %i from nav-office-search-api (bug)', async (status) => {
		upstreams.use(http.get(`${API}/adresse`, () => HttpResponse.json({ error: 'Upstream error' }, { status })));

		expect(await addressSearchHandler('storgata 1')).toEqual({ status, body: error('errorServerError') });
	});

	test('answers 500 when nav-office-search-api is unreachable', async () => {
		upstreams.use(http.get(`${API}/adresse`, () => HttpResponse.error()));

		expect(await addressSearchHandler('storgata 1')).toEqual({ status: 500, body: error('errorServerError') });
	});

	test.each([undefined, '', ' '])('answers 400 for the query %j, without asking upstream', async (query) => {
		expect(await addressSearchHandler(query)).toEqual({ status: 400, body: error('errorMissingQuery') });
		expect(upstreamUrls()).toEqual([]);
	});
});

describe('geoidSearchHandler', () => {
	test('answers the office for a geografisk id as a postnummer result', async () => {
		const expected = {
			status: 200,
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
						url: `${NAVNO}/kontor/nav-gamle-oslo`,
						geoId: '030101',
						enhetNr: '0316',
						hitString: '',
					},
				],
			},
		};

		expect(await geoidSearchHandler('030101')).toEqual(expected);
		expect(upstreamUrls()).toEqual([`GET ${API}/geoid?id=030101`]);
		expect(await geoidSearchHandler(' 030101 ')).toEqual(expected);
	});

	test("passes on nav-office-search-api's 404 for an id without an office, like Jan Mayen (bug)", async () => {
		expect(await geoidSearchHandler('2211')).toEqual({ status: 404, body: error('errorServerError') });
	});

	test.each([undefined, '', ' '])('answers 400 for the id %j, without asking upstream', async (id) => {
		expect(await geoidSearchHandler(id)).toEqual({ status: 400, body: error('errorInvalidQuery') });
		expect(upstreamUrls()).toEqual([]);
	});
});

describe('loginStatusHandler', () => {
	test('asks the login session endpoint with the cookies it got', async () => {
		const cookie = 'io.nais.wonderwall.session=abc; other=1';

		expect(await loginStatusHandler(cookie)).toEqual({ status: 200, body: { isUserLoggedIn: true } });
		expect(upstreamCalls.map(({ url, headers }) => [url, headers.cookie])).toEqual([
			[process.env.LOGIN_SESSION_API_URL, cookie],
		]);
	});

	test('answers false without a session, and sends no cookie header', async () => {
		expect(await loginStatusHandler(undefined)).toEqual({ status: 200, body: { isUserLoggedIn: false } });
		expect(upstreamCalls[0].headers.cookie).toBeUndefined();
	});

	test('answers false when the login session endpoint is unreachable', async () => {
		upstreams.use(http.get(`${process.env.LOGIN_SESSION_API_URL}`, () => HttpResponse.error()));

		expect(await loginStatusHandler('a=b')).toEqual({ status: 200, body: { isUserLoggedIn: false } });
	});
});

test('the probes answer', () => {
	expect(isAliveHandler()).toEqual({ status: 200, body: 'I am alive!' });
	expect(isReadyHandler()).toEqual({ status: 200, body: { message: 'I am ready!' } });
});
