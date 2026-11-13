import { describe, expect, test } from 'vitest';
import { apiRequests, http, mockApi, wasAborted } from '#client/__tests__/support/api.ts';
import { nameHit, nameResult, offices } from '#client/__tests__/support/fixtures.ts';
import { abortSearchClient, fetchGeoidClient, fetchSearchClient } from './fetch.ts';

const serverError = { type: 'error', messageId: 'errorServerError' };
const aborted = { type: 'error', aborted: true };

describe('fetchSearchClient', () => {
	test('answers a cancelled search as aborted, not as an error', async () => {
		mockApi('search/name', Promise.withResolvers<never>().promise);

		const search = fetchSearchClient('oslo');
		await Promise.resolve();
		abortSearchClient();

		expect(await search).toEqual(aborted);
		expect(wasAborted('search/name?query=oslo')).toBe(true);
	});

	test('cancels the search in flight when a new one starts', async () => {
		const held = Promise.withResolvers<never>();
		mockApi('search/name', held.promise);
		const first = fetchSearchClient('oslo');
		await Promise.resolve();

		const result = nameResult('oslo', [nameHit('OSLO', [offices.alna])]);
		mockApi('search/name', { json: result });
		const second = fetchSearchClient('oslo');

		expect(await first).toEqual(aborted);
		expect(await second).toEqual(result);
	});

	test('can be cancelled while it falls back to an address search', async () => {
		mockApi('search/name', { json: nameResult('storgata 1', []) });
		mockApi('search/address', Promise.withResolvers<never>().promise);
		const addressSearchStarted = Promise.withResolvers<void>();

		const search = fetchSearchClient('storgata 1', { onAddressSearchStart: addressSearchStarted.resolve });
		await addressSearchStarted.promise;
		await Promise.resolve();
		abortSearchClient();

		expect(await search).toEqual(aborted);
		expect(wasAborted('search/address?query=storgata+1')).toBe(true);
	});

	test("passes the API's own error on, with what it says", async () => {
		mockApi('search', { status: 404, json: { type: 'error', messageId: 'errorInvalidPostnr' } });

		expect(await fetchSearchClient('0000')).toEqual({ type: 'error', messageId: 'errorInvalidPostnr' });
		expect(apiRequests()).toEqual(['search?query=0000']);
	});

	test.each([
		['a 500 without a body', { status: 500 }],
		["the nav.no 404 page, for an API path that doesn't exist", { status: 404, text: '<h1>Fant ikke siden</h1>' }],
		["a 200 that isn't JSON", { text: '<h1>Hei</h1>', headers: { 'content-type': 'text/html' } }],
	] as const)('answers %s as a server error', async (_, reply) => {
		http.get('/finn-nav-kontor/api/search/name', reply);

		expect(await fetchSearchClient('oslo')).toEqual(serverError);
	});
});

describe('fetchGeoidClient', () => {
	test('asks for the office of a kommunenr or bydelsnr', async () => {
		mockApi('geoid', { status: 404, json: { type: 'error', messageId: 'errorServerError' } });

		expect(await fetchGeoidClient('2211')).toEqual(serverError);
		expect(apiRequests()).toEqual(['geoid?id=2211']);
	});

	test('cancels the search in flight, since an address was picked instead', async () => {
		mockApi('search/name', Promise.withResolvers<never>().promise);
		const search = fetchSearchClient('oslo');
		await Promise.resolve();

		mockApi('geoid', { status: 404, json: { type: 'error', messageId: 'errorServerError' } });
		await fetchGeoidClient('2211');

		expect(await search).toEqual(aborted);
	});
});
