import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { createUpstreamFakes, originsFromEnv, toUpstreamRequest, type UpstreamRequest } from './fakes';

const { answer } = createUpstreamFakes(originsFromEnv());

/** What the fakes were asked, in order. Tests clear it when they start caring. */
export const upstreamCalls: UpstreamRequest[] = [];

/**
 * The fakes for tests that run server code in-process, on the origins in the environment (the unit project's env in
 * vitest.config.ts). Tests answer differently with upstreams.use(). A request nothing answers is a network error.
 */
export const upstreams = setupServer(
	http.all('*', async ({ request }) => {
		const upstream = await toUpstreamRequest(request);
		upstreamCalls.push(upstream);
		return answer(upstream) ?? HttpResponse.error();
	}),
);
