import { readFileSync } from 'node:fs';
import { routeOf, type StubRequest } from './stub';

/*
 * Fakes of every service the server calls, answering from test/fixtures/upstream/ in each service's own wire
 * format. They match on the origins below, which harness.ts configures the server with. Anything else gets
 * undefined, and the stub answers it with a 599.
 */

export const ORIGINS = {
	// VITE_APP_ORIGIN, VITE_NAVNO_ORIGIN and VITE_XP_ORIGIN, as in prod
	navno: 'https://www.nav.no',
	api: 'https://nav-office-search-api.prod-fss-pub.nais.io',
	tokenEndpoint: 'https://login.microsoftonline.com/test-tenant/oauth2/v2.0/token',
	loginSession: 'https://login.nav.no/oauth2/session',
	// Where nav-dekoratoren-moduler fetches the decorator: ENV=prod outside NAIS, and the service inside it
	decorator: 'https://www.nav.no/dekoratoren',
	decoratorService: 'http://nav-dekoratoren.personbruker',
};

export const ACCESS_TOKEN = 'azure-token';

/** What the server sends nav-office-search-api: ACCESS_TOKEN, base64-encoded. The backend never checks it. */
export const AUTHORIZATION = 'Bearer YXp1cmUtdG9rZW4=';

export const NOT_FOUND_HTML = '<!doctype html><html><body><h1 data-stub="nav-404">Fant ikke siden</h1></body></html>';

export const DECORATOR = {
	headAssets: '<link rel="stylesheet" href="https://decorator.test/client.css" data-stub="decorator-head-assets" />',
	header: '<div data-stub="decorator-header"></div>',
	footer: '<div data-stub="decorator-footer"></div>',
	scripts: '<script src="https://decorator.test/client.js" data-stub="decorator-scripts"></script>',
	versionId: 'stub-version',
};

const fixture = (path: string) => readFileSync(new URL(`../fixtures/upstream/${path}`, import.meta.url));

const fixtureJson = <T>(path: string): T => JSON.parse(fixture(path).toString('utf-8'));

type Recorded = Record<string, { status: number; body: unknown }>;

const offices = fixtureJson<Record<string, { enhetNr: string; navn: string }>>('office-search-api/geoid.json');
const adresser = fixtureJson<Recorded>('office-search-api/adresse.json');
const bydeler = fixtureJson<Recorded>('office-search-api/bydel.json');

/** What Express' res.send(object) sends, as nav-office-search-api does */
export const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

const file = (path: string, contentType: string) =>
	new Response(fixture(path), { headers: { 'content-type': contentType } });

// Express gives a repeated parameter as an array, which the backend's handlers reject like a missing one
const single = (query: URLSearchParams, name: string) => {
	const values = query.getAll(name);
	return values.length === 1 ? values[0] : undefined;
};

// nav-office-search-api, mirroring its handlers (src/handlers/ in that repo). Ids, queries and postnumre without a
// recording get what the backend answers for ones it doesn't know.
const geoid = ({ query }: StubRequest) => {
	const id = single(query, 'id');
	if (id === undefined) {
		return new Response("Invalid request - 'id' parameter is required", {
			status: 400,
			headers: { 'content-type': 'text/html; charset=utf-8' },
		});
	}
	return offices[id] ? json(offices[id]) : json({ message: `No office info found for geoid ${id}` }, 404);
};

const adresse = ({ query }: StubRequest) => {
	const queryString = single(query, 'queryString');
	if (!queryString?.trim()) {
		return json({ error: 'Query string is required and must be a non-empty string' }, 400);
	}
	const recorded = adresser[queryString];
	if (recorded) {
		return json(recorded.body, recorded.status);
	}
	if (queryString.length > 150) {
		return json({ error: 'Query string exceeds maximum length of 150 characters' }, 400);
	}
	if (!queryString.replace(/[^\p{L}\p{N}\s.,-]/gu, '').trim()) {
		return json({ error: 'Query string is empty or invalid' }, 400);
	}
	return json({ totalHits: 0, adresser: [] });
};

const bydel = ({ query }: StubRequest) => {
	const postnummer = single(query, 'postnummer');
	if (!postnummer?.trim()) {
		return json({ error: 'Postnummer is required' }, 400);
	}
	const recorded = bydeler[postnummer];
	if (recorded) {
		return json(recorded.body, recorded.status);
	}
	return /^\d{4}$/.test(postnummer.trim()) ? json({ bydeler: [] }) : json({ error: 'Invalid postnummer' }, 400);
};

// Wonderwall's session endpoint: 200 with a session cookie, 401 without
const loginSession = ({ headers }: StubRequest) =>
	headers.cookie?.includes('io.nais.wonderwall.session=')
		? json({ session: { active: true } })
		: json({ error: 'unauthenticated' }, 401);

// Host and path, without a trailing slash
const at = (url: string) => {
	const { host, pathname } = new URL(url);
	return `${host}${pathname.replace(/\/$/, '')}`;
};

/** What the server calls, as routeOf() gives them, for on() overrides and assertions */
export const ROUTES = {
	xp: `GET ${at(ORIGINS.navno)}/_/service/no.nav.navno/officeInfo`,
	ssbClassification: 'GET data.ssb.no/api/klass/v1/classifications/103',
	ssbVersion: 'GET data.ssb.no/api/klass/v1/versions/1168',
	bring: 'GET www.bring.no/postnummerregister-ansi.txt',
	token: `POST ${at(ORIGINS.tokenEndpoint)}`,
	geoid: `GET ${at(ORIGINS.api)}/geoid`,
	adresse: `GET ${at(ORIGINS.api)}/adresse`,
	bydel: `GET ${at(ORIGINS.api)}/bydel`,
	loginSession: `GET ${at(ORIGINS.loginSession)}`,
	notFoundPage: `GET ${at(ORIGINS.navno)}/404`,
	// The decorator outside NAIS; in NAIS, the same paths on ORIGINS.decoratorService
	decoratorSsr: `GET ${at(ORIGINS.decorator)}/ssr`,
	decoratorVersion: `GET ${at(ORIGINS.decorator)}/api/version`,
};

const decorator = (base: string) => ({
	[`GET ${at(base)}/ssr`]: () => json(DECORATOR),
	[`GET ${at(base)}/api/version`]: () => json({ latestVersion: DECORATOR.versionId }),
});

const fakes: Record<string, (request: StubRequest) => Response> = {
	[ROUTES.xp]: () => file('xp/office-info.json', 'application/json'),
	[ROUTES.ssbClassification]: () => file('ssb/classification-103.json', 'application/json'),
	[ROUTES.ssbVersion]: () => file('ssb/version.json', 'application/json'),
	[ROUTES.bring]: () => file('bring/postnummerregister-ansi.txt', 'text/plain'),
	[ROUTES.token]: () =>
		json({ token_type: 'Bearer', expires_in: 3599, ext_expires_in: 3599, access_token: ACCESS_TOKEN }),
	[ROUTES.geoid]: geoid,
	[ROUTES.adresse]: adresse,
	[ROUTES.bydel]: bydel,
	[ROUTES.loginSession]: loginSession,
	[ROUTES.notFoundPage]: () =>
		new Response(NOT_FOUND_HTML, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } }),
	...decorator(ORIGINS.decorator),
	...decorator(ORIGINS.decoratorService),
};

export const fakeUpstream = (request: StubRequest): Response | undefined => fakes[routeOf(request)]?.(request);
