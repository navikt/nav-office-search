import { mockFetch, networkError } from '@itsy/corgi/testing';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { createUpstreamFakes, fromMockCall, originsFromEnv } from './fakes.ts';

const { answer } = createUpstreamFakes(originsFromEnv());

/**
 * The fakes as the test file's fetch, for tests that run server code in-process, on the origins in the environment
 * (the server project's env in vitest.config.ts). A request the fakes don't know is a network error.
 *
 * A test answers differently with upstreams.get(url, reply) and the like, until it ends. calls() is what the
 * upstreams were asked during the test, in order.
 */
export const installUpstreams = () => {
	const upstreams = mockFetch();
	const answerWithFakes = () => upstreams.any((call) => answer(fromMockCall(call)) ?? networkError());
	let restore = () => {};

	beforeAll(() => {
		answerWithFakes();
		restore = upstreams.install();
	});
	beforeEach(() => {
		upstreams.resetCalls();
	});
	afterEach(() => {
		upstreams.reset();
		answerWithFakes();
	});
	afterAll(() => {
		restore();
	});

	return { upstreams, calls: () => upstreams.calls.map(fromMockCall) };
};
