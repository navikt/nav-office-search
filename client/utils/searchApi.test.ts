import { httpError } from '@itsy/corgi/testing';
import { isAbortError } from '@itsy/corgi';
import { describe, expect, test } from 'vitest';
import { apiRequests, http, mockApi, wasAborted } from '#client/__tests__/support/api.ts';
import {
	errorResult,
	geoidResult,
	nameHit,
	nameResult,
	offices,
	postnrResult,
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
	test('asks each endpoint, with the query URL-encoded', async () => {
		const api = createSearchApi();
		mockApi('search', { json: postnrResult() });
		mockApi('search/name', { json: nameResult('nav oslo', []) });
		mockApi('search/address', { status: 400 });
		mockApi('geoid', { status: 404 });

		await api.postnr('4737');
		await api.name('nav oslo');
		await rejectionOf(api.address('storgata 1, oslo'));
		await rejectionOf(api.office('030101'));

		expect(apiRequests()).toEqual([
			'search?query=4737',
			'search/name?query=nav+oslo',
			'search/address?query=storgata+1%2C+oslo',
			'geoid?id=030101',
		]);
	});

	test('cancels the request in flight when a new one starts', async () => {
		const api = createSearchApi();
		mockApi('search/name', Promise.withResolvers<never>().promise);
		const result = nameResult('oslo', [nameHit('OSLO', [offices.alna])]);

		const first = rejectionOf(api.name('oslo'));
		await Promise.resolve();
		mockApi('search/name', { json: result });

		expect(await api.name('oslo')).toEqual(result);
		expect(isAbortError(await first)).toBe(true);
	});

	test('cancels a search in flight for an office lookup, since an address was picked instead', async () => {
		const api = createSearchApi();
		mockApi('search/address', Promise.withResolvers<never>().promise);
		const office = geoidResult('030101', offices.alna);
		mockApi('geoid', { json: office });

		const search = rejectionOf(api.address('storgata 1'));
		await Promise.resolve();

		expect(await api.office('030101')).toEqual(office);
		expect(isAbortError(await search)).toBe(true);
	});

	test('cancel() stops the request in flight with an AbortError', async () => {
		const api = createSearchApi();
		mockApi('search/address', Promise.withResolvers<never>().promise);

		const search = rejectionOf(api.address('storgata 1'));
		await Promise.resolve();
		api.cancel();

		expect(isAbortError(await search)).toBe(true);
		expect(wasAborted('search/address?query=storgata+1')).toBe(true);
	});

	test("one form's API never cancels another's", async () => {
		http.get('/finn-nav-kontor/api/search/name', { json: nameResult('oslo', []), delay: 10 });

		const results = await Promise.all([createSearchApi().name('oslo'), createSearchApi().name('oslo')]);

		expect(results.map(({ type }) => type)).toEqual(['name', 'name']);
	});
});

describe('errorMessageOf', () => {
	test("is the API's own message when it has one", () => {
		expect(errorMessageOf(httpError(404, errorResult('errorInvalidPostnr')))).toBe('errorInvalidPostnr');
	});

	test.each([
		['a 500 without a body', { status: 500 }],
		["the nav.no 404 page, for an API path that doesn't exist", { status: 404, text: '<h1>Fant ikke siden</h1>' }],
		["a 200 that isn't JSON", { text: '<h1>Hei</h1>', headers: { 'content-type': 'text/html' } }],
	] as const)('is a server error for %s', async (_, reply) => {
		http.get('/finn-nav-kontor/api/search/name', reply);

		expect(errorMessageOf(await rejectionOf(createSearchApi().name('oslo')))).toBe('errorServerError');
	});
});
