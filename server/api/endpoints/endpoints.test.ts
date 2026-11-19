import { networkError } from '@itsy/corgi/testing';
import { logger } from '@navikt/navno-logger';
import { afterEach, describe, expect, test, vi } from 'vitest';
import recorded from '#test/fixtures/upstream/office-search-api/search.json' with { type: 'json' };
import { installUpstreams } from '#test/upstream/upstreams.ts';
import { isAliveHandler } from './isAlive/isAliveHandler.ts';
import { isReadyHandler } from './isReady/isReadyHandler.ts';
import { loginStatusHandler } from './loginstatus/loginStatusHandler.ts';
import { searchHandler } from './search/searchHandler.ts';
import { env } from '#server/env.ts';

const SEARCH = `${env.API_ORIGIN}/search`;

// The token the fake Texas hands out. nav-office-search-api never checks it.
const AUTHORIZATION = 'Bearer texas-token';

const { upstreams, calls: upstreamCalls } = installUpstreams();

// What nav-office-search-api was asked. The token requests to Texas, one before each search, aren't among them.
const searches = () => upstreamCalls().filter(({ url }) => url.startsWith(SEARCH));

const error = (messageId: string) => ({ type: 'error', messageId });

// Everything the server logged, as one string per call
const logged = (level: 'info' | 'warn' | 'error') =>
	vi
		.mocked(logger[level])
		.mock.calls.map((args) =>
			JSON.stringify(args, (_, value) => (value instanceof Error ? `${value.name}: ${value.message}` : value)),
		);

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('searchHandler', () => {
	test.each([
		['a postnummer', '4737', 'postnr'],
		['a name', 'oslo', 'name'],
		['an address', 'storgata 1', 'adresse'],
	] as const)("passes on nav-office-search-api's answer to %s", async (_, query, type) => {
		const response = await searchHandler(query);

		expect(response).toEqual(recorded[query]);
		expect(response.body.type).toBe(type);
	});

	test('asks with the query as it was typed, and with the token', async () => {
		const query = ' Ole B. Bergers veg 5, Jevnaker ';

		await searchHandler(query);

		expect(
			searches().map((call) => [call.method, call.path, call.query.get('query'), call.headers.authorization]),
		).toEqual([['GET', '/search', query, AUTHORIZATION]]);
		expect(searches()[0].headers.accept).toBe('application/json');
	});

	test.each([
		['an unknown postnummer', '0000', 404, 'errorInvalidPostnr'],
		['a query with nothing to search for', '???', 400, 'errorInvalidQuery'],
		['an empty query', ' ', 400, 'errorMissingQuery'],
	])("passes on the API's answer to %s, with its status", async (_, query, status, messageId) => {
		vi.spyOn(logger, 'error');

		expect(await searchHandler(query)).toEqual({ status, body: error(messageId) });
		expect(logged('error')).toEqual([]);
	});

	test('asks without a query when it got none, and passes on the answer to that', async () => {
		expect(await searchHandler(undefined)).toEqual({ status: 400, body: error('errorMissingQuery') });
		expect(searches().map(({ url }) => url)).toEqual([SEARCH]);
	});

	test.each([500, 502, 504])("passes on the API's own %i, and logs the status", async (status) => {
		vi.spyOn(logger, 'error');
		upstreams.get(SEARCH, { json: error('errorServerError'), status });

		expect(await searchHandler('storgata 1')).toEqual({ status, body: error('errorServerError') });
		expect(logged('error')).toEqual([JSON.stringify(['Search failed', { status }])]);
	});

	test('answers 502 when nav-office-search-api is unreachable', async () => {
		upstreams.get(SEARCH, networkError());

		expect(await searchHandler('storgata 1')).toEqual({ status: 502, body: error('errorServerError') });
	});

	test("answers 502 when the answer isn't JSON, like an ingress with no pod to ask", async () => {
		upstreams.get(SEARCH, { text: '<html><h1>503 Service Temporarily Unavailable</h1></html>', status: 503 });

		expect(await searchHandler('storgata 1')).toEqual({ status: 502, body: error('errorServerError') });
	});

	test('answers 504 after 5 seconds without an answer', async () => {
		vi.useFakeTimers();
		upstreams.get(SEARCH, { hang: true });

		const response = searchHandler('storgata 1');
		await vi.advanceTimersByTimeAsync(5000);

		expect(await response).toEqual({ status: 504, body: error('errorServerError') });
	});

	test('answers 502 without a token, and never asks the API', async () => {
		upstreams.post(env.NAIS_TOKEN_ENDPOINT, { json: { error: 'invalid_request' }, status: 400 });

		expect(await searchHandler('4737')).toEqual({ status: 502, body: error('errorServerError') });
		expect(searches()).toEqual([]);
	});

	test.each([
		['an unreachable API', networkError()],
		["an answer that isn't JSON", { text: 'Bad Gateway', status: 502 }],
	] as const)('logs %s without the query', async (_, reply) => {
		vi.spyOn(logger, 'error');
		upstreams.get(SEARCH, reply);

		await searchHandler('storgata 1');

		expect(logged('error')).toHaveLength(1);
		expect(logged('error')[0]).toContain('Search failed');
		expect(logged('error')[0]).not.toMatch(/storgata/i);
	});
});

describe('loginStatusHandler', () => {
	test('asks the login session endpoint with the cookies it got', async () => {
		const cookie = 'io.nais.wonderwall.session=abc; other=1';

		expect(await loginStatusHandler(cookie)).toEqual({ status: 200, body: { isUserLoggedIn: true } });
		expect(upstreamCalls().map(({ url, headers }) => [url, headers.cookie])).toEqual([
			[env.LOGIN_SESSION_API_URL, cookie],
		]);
	});

	test('answers false without a session, and sends no cookie header', async () => {
		expect(await loginStatusHandler(undefined)).toEqual({ status: 200, body: { isUserLoggedIn: false } });
		expect(upstreamCalls()[0].headers.cookie).toBeUndefined();
	});

	test('answers false when the login session endpoint is unreachable', async () => {
		upstreams.get(env.LOGIN_SESSION_API_URL, networkError());

		expect(await loginStatusHandler('a=b')).toEqual({ status: 200, body: { isUserLoggedIn: false } });
	});
});

test('the probes answer', () => {
	expect(isAliveHandler()).toEqual({ status: 200, body: 'I am alive!' });
	expect(isReadyHandler()).toEqual({ status: 200, body: { message: 'I am ready!' } });
});
