import { isHttpError, isTimeoutError } from '@itsy/corgi';
import { isValidationError, schema } from '@itsy/corgi/schema';
import { httpError, mockFetch, networkError } from '@itsy/corgi/testing';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { registry, upstreamDuration, upstreamRequests } from '#server/metrics/metrics.ts';
import { failureOf, upstreamClient } from './upstream.ts';

const http = mockFetch();
let restore = () => {};

beforeAll(() => {
	restore = http.install();
});

beforeEach(() => {
	registry.resetMetrics();
});

afterEach(() => {
	http.reset();
	vi.useRealTimers();
});

afterAll(() => {
	restore();
});

const SESSION = 'https://login.test/session';

const requestCounts = async () =>
	(await upstreamRequests.get()).values.map(({ labels, value }) => ({ ...labels, value }));

const timedCount = async () =>
	(await upstreamDuration.get()).values.find(({ metricName }) => metricName?.endsWith('_count'))?.value;

const rejectionOf = async (promise: Promise<unknown>) => {
	try {
		await promise;
	} catch (e) {
		return e;
	}
	throw new Error('resolved');
};

describe('upstreamClient', () => {
	test('counts and times each request under the upstream it was made for', async () => {
		http.get(SESSION, { json: { session: { active: true } } });
		http.get('https://login.test/missing', { status: 404 });
		const login = upstreamClient('login-session', { timeout: 1000 });

		expect(await login.get(SESSION)).toEqual({ session: { active: true } });
		await expect(login.get('https://login.test/missing')).rejects.toSatisfy(isHttpError);

		expect(await requestCounts()).toEqual([
			{ upstream: 'login-session', status: '2xx', value: 1 },
			{ upstream: 'login-session', status: '4xx', value: 1 },
		]);
		expect(await timedCount()).toBe(2);
	});

	test('counts a network error', async () => {
		http.get(SESSION, networkError());

		await expect(upstreamClient('login-session', { timeout: 1000 }).get(SESSION)).rejects.toThrow('fetch failed');
		expect(await requestCounts()).toEqual([{ upstream: 'login-session', status: 'network_error', value: 1 }]);
	});

	test('gives up on an upstream that takes longer than its timeout, and counts that', async () => {
		vi.useFakeTimers();
		http.get(SESSION, { hang: true });

		const failure = rejectionOf(upstreamClient('login-session', { timeout: 5000 }).get(SESSION));
		await vi.advanceTimersByTimeAsync(4999);
		expect(await requestCounts()).toEqual([]);
		await vi.advanceTimersByTimeAsync(1);

		expect(isTimeoutError(await failure)).toBe(true);
		expect(await requestCounts()).toEqual([{ upstream: 'login-session', status: 'timeout', value: 1 }]);
	});

	test('throws when an answer fails its schema', async () => {
		http.get(SESSION, { json: { session: 'none' } });

		const failure = await rejectionOf(
			upstreamClient('login-session', { timeout: 1000 }).get(SESSION, {
				transform: schema(z.object({ session: z.object({ active: z.boolean() }) })),
			}),
		);

		expect(isValidationError(failure)).toBe(true);
		// The request itself went fine
		expect(await requestCounts()).toEqual([{ upstream: 'login-session', status: '2xx', value: 1 }]);
	});
});

describe('failureOf', () => {
	test('gives only the status of an HttpError, whose message and URL have the query', () => {
		const error = httpError(
			503,
			{ type: 'error', messageId: 'errorServerError' },
			{ url: 'https://api.test/search?query=storgata+1' },
		);

		expect(failureOf(error)).toEqual({ status: 503 });
	});

	test('gives where and why an answer failed its schema', async () => {
		const failure = await rejectionOf(
			schema(z.object({ adresser: z.array(z.object({ postnummer: z.string() })) }))({
				adresser: [{ postnummer: 150 }],
			}),
		);

		expect(failureOf(failure)).toEqual({
			issues: ['adresser.0.postnummer: Invalid input: expected string, received number'],
		});
	});

	test('passes other errors on, for the logger to show', () => {
		const error = new TypeError('fetch failed');

		expect(failureOf(error)).toBe(error);
		expect(failureOf('oops')).toEqual({ error: 'oops' });
	});
});
