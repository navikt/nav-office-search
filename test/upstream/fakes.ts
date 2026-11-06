import { readFileSync } from 'node:fs';

/*
 * Fakes of every service the server calls, answering from test/fixtures/upstream/ in each service's own wire format.
 * Offline development (test/mocks/dev.ts) and in-process tests (mswServer.ts) run on these. Node loads this file
 * directly in development, so it can only import built-ins, and only use TypeScript that Node can strip.
 */

export type UpstreamRequest = {
	method: string;
	/** The URL the server asked for */
	url: string;
	host: string;
	path: string;
	query: URLSearchParams;
	headers: Record<string, string | undefined>;
	body: string;
};

export type UpstreamOrigins = {
	navno: string;
	xp: string;
	api: string;
	tokenEndpoint: string;
	loginSession: string;
	/** The decorator's base URLs to fake */
	decorators: string[];
};

/** The origins the server gets from its environment. The decorator isn't among them, so it isn't faked. */
export const originsFromEnv = (): UpstreamOrigins => ({
	navno: process.env.VITE_NAVNO_ORIGIN,
	xp: process.env.VITE_XP_ORIGIN,
	api: process.env.API_ORIGIN,
	tokenEndpoint: process.env.AZURE_OPENID_CONFIG_TOKEN_ENDPOINT,
	loginSession: process.env.LOGIN_SESSION_API_URL ?? 'https://login.test/oauth2/session',
	decorators: [],
});

export const toUpstreamRequest = async (request: Request): Promise<UpstreamRequest> => {
	const url = new URL(request.url);
	return {
		method: request.method,
		url: url.href,
		host: url.host,
		path: url.pathname,
		query: url.searchParams,
		headers: Object.fromEntries(request.headers),
		body: await request.clone().text(),
	};
};

/** Method, host and path, e.g. 'GET www.nav.no/404' */
export const routeOf = ({ method, host, path }: UpstreamRequest) => `${method} ${host}${path}`;

/** The route of a method and URL. A trailing slash on the URL doesn't count. */
export const routeTo = (method: string, url: string) => {
	const { host, pathname } = new URL(url);
	return `${method} ${host}${pathname.replace(/\/$/, '')}`;
};

export const ACCESS_TOKEN = 'azure-token';

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
const geoid = ({ query }: UpstreamRequest) => {
	const id = single(query, 'id');
	if (id === undefined) {
		return new Response("Invalid request - 'id' parameter is required", {
			status: 400,
			headers: { 'content-type': 'text/html; charset=utf-8' },
		});
	}
	return offices[id] ? json(offices[id]) : json({ message: `No office info found for geoid ${id}` }, 404);
};

const adresse = ({ query }: UpstreamRequest) => {
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

const bydel = ({ query }: UpstreamRequest) => {
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
const loginSession = ({ headers }: UpstreamRequest) =>
	headers.cookie?.includes('io.nais.wonderwall.session=')
		? json({ session: { active: true } })
		: json({ error: 'unauthenticated' }, 401);

export const createUpstreamFakes = (origins: UpstreamOrigins) => {
	/** What the server calls, for overrides and assertions */
	const routes = {
		xp: routeTo('GET', `${origins.xp}/_/service/no.nav.navno/officeInfo`),
		ssbClassification: 'GET data.ssb.no/api/klass/v1/classifications/103',
		ssbVersion: 'GET data.ssb.no/api/klass/v1/versions/1168',
		bring: 'GET www.bring.no/postnummerregister-ansi.txt',
		token: routeTo('POST', origins.tokenEndpoint),
		geoid: routeTo('GET', `${origins.api}/geoid`),
		adresse: routeTo('GET', `${origins.api}/adresse`),
		bydel: routeTo('GET', `${origins.api}/bydel`),
		loginSession: routeTo('GET', origins.loginSession),
		notFoundPage: routeTo('GET', `${origins.navno}/404`),
	};

	const fakes: Record<string, (request: UpstreamRequest) => Response> = {
		[routes.xp]: () => file('xp/office-info.json', 'application/json'),
		[routes.ssbClassification]: () => file('ssb/classification-103.json', 'application/json'),
		[routes.ssbVersion]: () => file('ssb/version.json', 'application/json'),
		[routes.bring]: () => file('bring/postnummerregister-ansi.txt', 'text/plain'),
		[routes.token]: () =>
			json({ token_type: 'Bearer', expires_in: 3599, ext_expires_in: 3599, access_token: ACCESS_TOKEN }),
		[routes.geoid]: geoid,
		[routes.adresse]: adresse,
		[routes.bydel]: bydel,
		[routes.loginSession]: loginSession,
		[routes.notFoundPage]: () =>
			new Response(NOT_FOUND_HTML, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } }),
	};
	for (const decorator of origins.decorators) {
		fakes[routeTo('GET', `${decorator}/ssr`)] = () => json(DECORATOR);
		fakes[routeTo('GET', `${decorator}/api/version`)] = () => json({ latestVersion: DECORATOR.versionId });
	}

	/** undefined for what isn't faked */
	const answer = (request: UpstreamRequest): Response | undefined => fakes[routeOf(request)]?.(request);

	return { routes, answer };
};
