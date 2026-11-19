import { httpError } from '@itsy/corgi/testing';
import { isAbortError } from '@itsy/corgi';
import { describe, expect, test } from 'vitest';
import { apiRequests, http, mockApi, wasAborted } from '#client/__tests__/support/api.ts';
import {
	addressResult,
	errorResult,
	nameHit,
	nameResult,
	offices,
	postnrResult,
	storgataAdresser,
} from '#client/__tests__/support/fixtures.ts';
import { createSearchApi, errorMessageOf } from './searchApi.ts';

const rejectionOf = async (promise: Promise<unknown>) => {
	try {
		await promise;
	} catch (e) {
		return e;
	}
	throw new Error('resolved');
};

describe('createSearchApi', () => {
	test('asks the one search endpoint whatever the query is, with the query URL-encoded', async () => {
		const api = createSearchApi();
		const addresses = addressResult('storgata 1, oslo', storgataAdresser(2));

		mockApi('search', { json: postnrResult() });
		expect(await api.search('4737')).toEqual(postnrResult());
		mockApi('search', { json: addresses });
		expect(await api.search('storgata 1, oslo')).toEqual(addresses);

		expect(apiRequests()).toEqual(['search?query=4737', 'search?query=storgata+1%2C+oslo']);
	});

	test('cancels the search in flight when a new one starts', async () => {
		const api = createSearchApi();
		mockApi('search', Promise.withResolvers<never>().promise);
		const result = nameResult('oslo', [nameHit('OSLO', [offices.alna])]);

		const first = rejectionOf(api.search('osl'));
		await Promise.resolve();
		mockApi('search', { json: result });

		expect(await api.search('oslo')).toEqual(result);
		expect(isAbortError(await first)).toBe(true);
		expect(wasAborted('search?query=osl')).toBe(true);
	});

	test('cancel() stops the search in flight with an AbortError', async () => {
		const api = createSearchApi();
		mockApi('search', Promise.withResolvers<never>().promise);

		const search = rejectionOf(api.search('storgata 1'));
		await Promise.resolve();
		api.cancel();

		expect(isAbortError(await search)).toBe(true);
		expect(wasAborted('search?query=storgata+1')).toBe(true);
	});

	test("one form's API never cancels another's", async () => {
		http.get('/finn-nav-kontor/api/search', { json: nameResult('oslo', []), delay: 10 });

		const results = await Promise.all([createSearchApi().search('oslo'), createSearchApi().search('oslo')]);

		expect(results.map(({ type }) => type)).toEqual(['name', 'name']);
	});
});

describe('errorMessageOf', () => {
	test("is the API's own message when it has one", () => {
		expect(errorMessageOf(httpError(404, errorResult('errorInvalidPostnr')))).toBe('errorInvalidPostnr');
	});

	test.each([
		['a 500 without a body', { status: 500 }],
		["a plain 404, for an API path that doesn't exist", { status: 404, text: 'Not found' }],
		["a 200 that isn't JSON", { text: '<h1>Hei</h1>', headers: { 'content-type': 'text/html' } }],
	] as const)('is a server error for %s', async (_, reply) => {
		http.get('/finn-nav-kontor/api/search', reply);

		expect(errorMessageOf(await rejectionOf(createSearchApi().search('oslo')))).toBe('errorServerError');
	});
});
