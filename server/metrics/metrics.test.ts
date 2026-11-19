import { beforeEach, describe, expect, test } from 'vitest';
import { observeSearch, registry, searchRequests } from './metrics.ts';

beforeEach(() => {
	registry.resetMetrics();
});

describe('observeSearch', () => {
	const counts = async () => (await searchRequests.get()).values.map(({ labels, value }) => [labels.outcome, value]);

	test.each([
		[200, 'ok'],
		[400, 'invalid'],
		[404, 'invalid'],
		[500, 'error'],
		[503, 'error'],
	])('returns the response, and counts a %i as %s', async (status, outcome) => {
		const response = { status, body: { type: 'error', messageId: 'errorServerError' } };

		await expect(observeSearch(async () => response)).resolves.toBe(response);

		expect(await counts()).toEqual([[outcome, 1]]);
	});

	test('counts by the status alone, whatever the answer is', async () => {
		await observeSearch(async () => ({ status: 200, body: { type: 'postnr', officeInfo: [] } }));
		await observeSearch(async () => ({ status: 200, body: { type: 'one the API adds later' } }));

		expect(await counts()).toEqual([['ok', 2]]);
	});

	test('records a failed search as an error, and rethrows it', async () => {
		const failure = new Error('search failed');

		await expect(observeSearch(() => Promise.reject(failure))).rejects.toBe(failure);

		expect(await counts()).toEqual([['error', 1]]);
	});
});
