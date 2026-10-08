import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { type MockInstance, vi } from 'vitest';
import type { SearchResultProps } from '../../../../common/types/results';

export type ApiEndpoint = 'search' | 'search/name' | 'search/address' | 'geoid' | 'loginstatus';

export type Reply = {
	status?: number;
	/** Omit for an empty body */
	json?: SearchResultProps | { isUserLoggedIn: boolean };
};

const apiPrefix = '/finn-nav-kontor/api/';

export const server = setupServer(
	http.get(`*${apiPrefix}loginstatus`, () => HttpResponse.json({ isUserLoggedIn: false })),
);

/**
 * Replies to every GET of the endpoint until the test ends; the latest call for an endpoint wins.
 * Pass a pending promise (e.g. from Promise.withResolvers) to hold requests in flight.
 */
export const mockApi = (endpoint: ApiEndpoint, reply: Reply | Promise<Reply>) => {
	server.use(
		http.get(`*${apiPrefix}${endpoint}`, async () => {
			const { status = 200, json } = await reply;
			return json === undefined ? new HttpResponse(null, { status }) : HttpResponse.json(json, { status });
		}),
	);
};

// The request log is a pass-through spy on fetch; msw still answers. msw's own lifecycle events fire
// asynchronously, and its copy of the request stops seeing the client's abort once GC collects undici's
// WeakRef link to it. The spy sees each call synchronously, with the client's own signal.
let fetchSpy: MockInstance<typeof fetch>;

/** Call before each test, after server.listen(). restoreMocks removes the spy after the test. */
export const logRequests = () => {
	fetchSpy = vi.spyOn(globalThis, 'fetch');
};

const loggedRequests = () =>
	fetchSpy.mock.calls.map(([input, init], index) => {
		const url = new URL(input instanceof Request ? input.url : input.toString());
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
