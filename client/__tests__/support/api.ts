import { mockFetch } from '@itsy/corgi/testing';
import { type MockInstance, vi } from 'vitest';
import type { SearchResultProps } from '#shared/types/results.ts';

export type ApiEndpoint = 'search' | 'search/name' | 'search/address' | 'geoid' | 'loginstatus';

export type Reply = {
	status?: number;
	/** Omit for an empty body */
	json?: SearchResultProps | { isUserLoggedIn: boolean };
};

const apiPrefix = '/finn-nav-kontor/api/';

/** The API, as corgi's fake fetch. vitest.setup.ts installs it, and resets it after each test. */
export const http = mockFetch();

/** What every test starts with: nobody is logged in */
export const answerLoginStatus = () => {
	http.get(`${apiPrefix}loginstatus`, { json: { isUserLoggedIn: false } });
};

/**
 * Replies to every GET of the endpoint until the test ends; the latest call for an endpoint wins.
 * Pass a pending promise (e.g. from Promise.withResolvers) to hold requests in flight.
 */
export const mockApi = (endpoint: ApiEndpoint, reply: Reply | Promise<Reply>) => {
	http.get(`${apiPrefix}${endpoint}`, async () => {
		const { status = 200, json } = await reply;
		return json === undefined ? { status } : { json, status };
	});
};

// The request log is a pass-through spy on fetch, in front of the fake: it sees each call as it's made, with the
// client's own signal, and whether it has settled
let fetchSpy: MockInstance<typeof fetch>;

/** Call before each test, after the fake is installed. restoreMocks removes the spy after the test. */
export const logRequests = () => {
	fetchSpy = vi.spyOn(globalThis, 'fetch');
};

const loggedRequests = () =>
	fetchSpy.mock.calls.map(([input, init], index) => {
		const url = new URL(input instanceof Request ? input.url : input.toString(), location.href);
		return {
			request: `${url.pathname.replace(apiPrefix, '')}${url.search}`,
			signal: init?.signal,
			settled: fetchSpy.mock.settledResults[index]?.type !== 'incomplete',
		};
	});

/** Search requests in order (login status excluded), as "endpoint?query" with the client's own encoding */
export const apiRequests = () =>
	loggedRequests()
		.map(({ request }) => request)
		.filter((request) => !request.startsWith('loginstatus'));

export const wasAborted = (request: string) => {
	const logged = loggedRequests().findLast((entry) => entry.request === request);
	if (!logged) {
		throw new Error(`No request logged for ${request}`);
	}
	return logged.signal?.aborted ?? false;
};

/** True once every login status request so far has settled (StrictMode sends two) */
export const isLoginStatusAnswered = () => {
	const loginStatus = loggedRequests().filter(({ request }) => request.startsWith('loginstatus'));
	return loginStatus.length > 0 && loginStatus.every(({ settled }) => settled);
};
