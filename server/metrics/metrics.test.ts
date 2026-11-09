import { beforeEach, describe, expect, test } from 'vitest';
import {
	classifySearchResponse,
	observeSearch,
	observeUpstream,
	registry,
	searchDuration,
	searchRequests,
	upstreamForUrl,
	upstreamRequests,
	upstreamDuration,
} from './metrics.ts';

beforeEach(() => {
	registry.resetMetrics();
});

describe('classifySearchResponse', () => {
	const office = { name: 'Nav Tromsø' };

	test.each([
		['postnr with offices', 200, { type: 'postnr', officeInfo: [office] }, 'hits'],
		['postnr without offices', 200, { type: 'postnr', officeInfo: [] }, 'empty'],
		['name with hits', 200, { type: 'name', hits: [{ name: 'OSLO', officeHits: [office] }] }, 'hits'],
		['name without hits', 200, { type: 'name', hits: [] }, 'empty'],
		['address with hits', 200, { type: 'adresse', adresser: [{}], totalHits: 1 }, 'hits'],
		['address without hits', 200, { type: 'adresse', adresser: [], totalHits: 0 }, 'empty'],
		['unknown postnr', 404, { type: 'error', messageId: 'errorInvalidPostnr' }, 'invalid'],
		['missing query', 400, { type: 'error', messageId: 'errorMissingQuery' }, 'invalid'],
		['server error', 500, { type: 'error', messageId: 'errorServerError' }, 'error'],
		['upstream 503 passed through', 503, undefined, 'error'],
		['200 with an unexpected body', 200, 'oops', 'error'],
	] as const)('%s → %s', (_, status, body, expected) => {
		expect(classifySearchResponse(status, body)).toBe(expected);
	});
});

describe('observeSearch', () => {
	const timedCounts = async () =>
		(await searchDuration.get()).values
			.filter(({ metricName }) => metricName?.endsWith('_count'))
			.map(({ labels, value }) => [labels.route, value]);

	test('returns the response, and records its outcome and the duration', async () => {
		const response = { status: 200, body: { type: 'postnr', officeInfo: [{ name: 'Nav Tromsø' }] } };

		await expect(observeSearch('search', async () => response)).resolves.toBe(response);
		await observeSearch('geoid', async () => ({ status: 400, body: { type: 'error' } }));

		expect((await searchRequests.get()).values).toEqual([
			expect.objectContaining({ labels: { route: 'search', outcome: 'hits' }, value: 1 }),
			expect.objectContaining({ labels: { route: 'geoid', outcome: 'invalid' }, value: 1 }),
		]);
		expect(await timedCounts()).toEqual([
			['search', 1],
			['geoid', 1],
		]);
	});

	test('records a failed search as an error, and rethrows it', async () => {
		const failure = new Error('search failed');

		await expect(observeSearch('search/name', () => Promise.reject(failure))).rejects.toBe(failure);

		expect((await searchRequests.get()).values).toEqual([
			expect.objectContaining({ labels: { route: 'search/name', outcome: 'error' }, value: 1 }),
		]);
		expect(await timedCounts()).toEqual([['search/name', 1]]);
	});
});

describe('upstreamForUrl', () => {
	test.each([
		['https://nav-office-search-api.prod-fss-pub.nais.io/geoid?id=2100', 'office-search-api/geoid'],
		['https://nav-office-search-api.prod-fss-pub.nais.io/adresse?queryString=storgata', 'office-search-api/adresse'],
		['https://nav-office-search-api.prod-fss-pub.nais.io/bydel?postnummer=0150', 'office-search-api/bydel'],
		['https://www.nav.no/_/service/no.nav.navno/officeInfo', 'xp'],
		['https://data.ssb.no/api/klass/v1/classifications/103', 'ssb'],
		['https://data.ssb.no/api/klass/v1/versions/1168', 'ssb'],
		['https://login.microsoftonline.com/62366534-1ec3-4962-8869-9b5535279d0b/oauth2/v2.0/token', 'azure-token'],
		['https://example.com/geoidx', 'other'],
	])('%s → %s', (url, expected) => {
		expect(upstreamForUrl(url)).toBe(expected);
	});
});

describe('observeUpstream', () => {
	test('records the status class and the duration', async () => {
		await observeUpstream('bring', async () => new Response('', { status: 200 }));
		await observeUpstream('office-search-api/geoid', async () => new Response('', { status: 404 }));

		expect((await upstreamRequests.get()).values).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ labels: { upstream: 'bring', status: '2xx' }, value: 1 }),
				expect.objectContaining({ labels: { upstream: 'office-search-api/geoid', status: '4xx' }, value: 1 }),
			]),
		);
		const counts = (await upstreamDuration.get()).values.filter(({ metricName }) => metricName?.endsWith('_count'));
		expect(counts.map(({ labels, value }) => [labels.upstream, value])).toEqual(
			expect.arrayContaining([
				['bring', 1],
				['office-search-api/geoid', 1],
			]),
		);
	});

	test('records network errors and rethrows them', async () => {
		const failure = new TypeError('fetch failed');

		await expect(observeUpstream('ssb', () => Promise.reject(failure))).rejects.toBe(failure);
		expect((await upstreamRequests.get()).values).toEqual([
			expect.objectContaining({ labels: { upstream: 'ssb', status: 'network_error' }, value: 1 }),
		]);
	});
});
