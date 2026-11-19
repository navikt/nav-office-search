import { readFileSync } from 'node:fs';
import type { MockCall } from '@itsy/corgi/testing';

/*
 * Fakes of every service the server calls, each answering in its own wire format. Offline development
 * (test/mocks/dev.ts) and in-process tests (upstreams.ts) run on these. Node loads this file directly in development,
 * so it can only import built-ins, and only use TypeScript that Node can strip.
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

/** A request corgi's mockFetch got. The server always asks for absolute URLs. */
export const fromMockCall = (call: MockCall): UpstreamRequest => {
	const url = new URL(call.url);
	return {
		method: call.method,
		url: url.href,
		host: url.host,
		path: url.pathname,
		query: url.searchParams,
		headers: Object.fromEntries(call.headers),
		body: call.body ?? '',
	};
};

// Method, host and path, e.g. 'GET login.nav.no/oauth2/session'
const routeOf = ({ method, host, path }: UpstreamRequest) => `${method} ${host}${path}`;

// The route of a method and URL. A trailing slash on the URL doesn't count.
const routeTo = (method: string, url: string) => {
	const { host, pathname } = new URL(url);
	return `${method} ${host}${pathname.replace(/\/$/, '')}`;
};

type Recorded = Record<string, { status: number; body: unknown }>;

// What nav-office-search-api answered each query with, when the recording was made
const searches: Recorded = JSON.parse(
	readFileSync(new URL('../fixtures/upstream/office-search-api/search.json', import.meta.url), 'utf-8'),
);

// What Hono's c.json() sends, as nav-office-search-api does
const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

// nav-office-search-api's /search. A query without a recording gets what the API answers when it finds nothing: an
// unknown postnummer, or no addresses. Like the API, it counts a repeated query as a missing one.
const search = ({ query }: UpstreamRequest) => {
	const queries = query.getAll('query');
	const asked = queries.length === 1 ? queries[0] : undefined;

	if (!asked?.trim()) {
		return json({ type: 'error', messageId: 'errorMissingQuery' }, 400);
	}
	if (Object.hasOwn(searches, asked)) {
		return json(searches[asked].body, searches[asked].status);
	}
	return /^\d{4}$/.test(asked.trim())
		? json({ type: 'error', messageId: 'errorInvalidPostnr' }, 404)
		: json({ type: 'adresse', adresseQuery: asked, adresser: [], totalHits: 0 });
};

// Wonderwall's session endpoint: 200 with a session cookie, 401 without
const loginSession = ({ headers }: UpstreamRequest) =>
	headers.cookie?.includes('io.nais.wonderwall.session=')
		? json({ session: { active: true } })
		: json({ error: 'unauthenticated' }, 401);

/**
 * The fakes, on the origins the server gets from its environment: what they answer a request with, or undefined for
 * one they don't know. The decorator isn't in the environment, so it isn't faked.
 */
export const createUpstreamFakes = () => {
	const env = process.env as Record<string, string>;

	const fakes: Record<string, (request: UpstreamRequest) => Response> = {
		[routeTo('POST', env.NAIS_TOKEN_ENDPOINT)]: () =>
			json({ access_token: 'texas-token', expires_in: 3599, token_type: 'Bearer' }),
		[routeTo('GET', `${env.API_ORIGIN}/search`)]: search,
		[routeTo('GET', env.LOGIN_SESSION_API_URL)]: loginSession,
	};

	return (request: UpstreamRequest): Response | undefined => fakes[routeOf(request)]?.(request);
};
