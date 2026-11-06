import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { HTTPException } from 'hono/http-exception';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { upstreamCalls, upstreams } from '../../../test/upstream/mswServer';
import type { AppLocale } from '../../common/localization/types';
import { createApp } from './app';
import { loadData } from './data/data';
import { getBydelerArray } from './data/bydeler';
import { getKommunerArray } from './data/kommuner';
import { getPoststedArray } from './data/poststeder';
import { pageRenders, registry, searchDuration, searchRequests } from './metrics/metrics';

const BASE = process.env.VITE_APP_BASEPATH;
const API = `${BASE}/api`;
const NOT_FOUND_HTML = '<h1>Fant ikke siden</h1>';
const SCRIPT = 'console.log("hei");\n'.repeat(100);

// The parent holds what must stay out of reach, and clientDir a built client
const buildDir = mkdtempSync(join(tmpdir(), 'nav-office-search-'));
const clientDir = join(buildDir, 'client');
mkdirSync(join(clientDir, 'assets'), { recursive: true });
writeFileSync(join(buildDir, 'secret.txt'), 'hemmelig');
writeFileSync(join(clientDir, 'index.html'), '<!-- the template -->');
writeFileSync(join(clientDir, 'favicon.ico'), 'ikon');
writeFileSync(join(clientDir, 'assets', 'index-abc.js'), SCRIPT);

const fakePage = (locale: AppLocale, url?: string) => `<html lang="${locale}">${url}</html>`;

const appWith = (render: (locale: AppLocale, url?: string) => Promise<string> = async (...args) => fakePage(...args)) =>
	createApp({ site: { render, clientDir }, notFoundHtml: NOT_FOUND_HTML });

const app = appWith();

const mediaType = (response: Response) => response.headers.get('content-type')?.split(';')[0];

const expectTheNotFoundPage = async (response: Response) => {
	expect([response.status, mediaType(response), await response.text()]).toEqual([404, 'text/html', NOT_FOUND_HTML]);
};

beforeAll(async () => {
	upstreams.listen();
	await loadData();
});

beforeEach(() => {
	upstreamCalls.length = 0;
	registry.resetMetrics();
});

afterEach(() => {
	upstreams.resetHandlers();
	vi.unstubAllEnvs();
});

afterAll(() => {
	upstreams.close();
	rmSync(buildDir, { recursive: true });
});

describe('the API', () => {
	test.each([
		['/search?query=4737', { type: 'postnr', postnr: '4737' }],
		['/search?query=oslo', { type: 'name' }],
		['/search/?query=4737', { type: 'postnr', postnr: '4737' }],
		['/search/name?query=oslo', { type: 'name' }],
		// The search route would fall back to an address search here
		['/search/name?query=ingen+treff', { type: 'name', hits: [] }],
		['/search/address?query=storgata%201', { type: 'adresse', adresseQuery: 'storgata 1' }],
		['/search/address?query=storgata+1', { type: 'adresse', adresseQuery: 'storgata 1' }],
		['/geoid?id=030101', { type: 'postnr', kommunenr: '030101' }],
		['/loginstatus', { isUserLoggedIn: false }],
		['/internal/isReady', { message: 'I am ready!' }],
	])('%s answers JSON', async (path, expected) => {
		const response = await app.request(`${API}${path}`);

		expect([response.status, mediaType(response)]).toEqual([200, 'application/json']);
		expect(await response.json()).toMatchObject(expected);
	});

	test('isAlive answers HTML, as a string body does', async () => {
		const response = await app.request(`${API}/internal/isAlive`);

		expect([response.status, mediaType(response), await response.text()]).toEqual([200, 'text/html', 'I am alive!']);
	});

	test.each([
		['/data/kommuner', getKommunerArray],
		['/data/poststeder', getPoststedArray],
		['/data/bydeler', getBydelerArray],
	])('%s dumps the loaded data', async (path, loaded) => {
		const response = await app.request(`${API}${path}`);

		expect([response.status, mediaType(response)]).toEqual([200, 'application/json']);
		expect(loaded().length).toBeGreaterThan(0);
		expect(await response.json()).toEqual(JSON.parse(JSON.stringify(loaded())));
	});

	test.each([
		['/search?query=4737&query=0150', 'errorMissingQuery'],
		['/search/name?query=oslo&query=bergen', 'errorMissingQuery'],
		['/search/address?query=a&query=b', 'errorMissingQuery'],
		['/geoid?id=030101&id=030102', 'errorInvalidQuery'],
	])('%s counts a repeated parameter as a missing one', async (path, messageId) => {
		const response = await app.request(`${API}${path}`);

		expect([response.status, await response.json()]).toEqual([400, { type: 'error', messageId }]);
	});

	test('passes the status on from the handler', async () => {
		expect((await app.request(`${API}/search?query=0000`)).status).toBe(404);
	});

	test('forwards the cookie to the login session endpoint', async () => {
		const cookie = 'io.nais.wonderwall.session=abc; other=1';

		const response = await app.request(`${API}/loginstatus`, { headers: { cookie } });

		expect(await response.json()).toEqual({ isUserLoggedIn: true });
		expect(upstreamCalls.map(({ url, headers }) => [url, headers.cookie])).toEqual([
			[process.env.LOGIN_SESSION_API_URL, cookie],
		]);
	});
});

describe('metrics', () => {
	const searchCounts = async () =>
		(await searchRequests.get()).values.map(({ labels, value }) => ({ ...labels, value }));

	test('serves the registry in its own format', async () => {
		await app.request(`${API}/search?query=4737`);

		const response = await app.request(`${API}/internal/metrics`);
		const text = await response.text();

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe(registry.contentType);
		expect(text).toContain('nav_office_search_search_requests_total{route="search",outcome="hits"} 1');
		expect(text).toContain('nodejs_eventloop_lag_seconds');
	});

	test('counts each search route by outcome and times it, with or without a trailing slash', async () => {
		await app.request(`${API}/search?query=4737`);
		await app.request(`${API}/search/?query=1001`);
		await app.request(`${API}/search/name?query=oslo`);
		await app.request(`${API}/search/name/?query=oslo`);
		await app.request(`${API}/search/address`);
		await app.request(`${API}/geoid?id=030101`);

		expect(await searchCounts()).toEqual([
			{ route: 'search', outcome: 'hits', value: 1 },
			{ route: 'search', outcome: 'empty', value: 1 },
			{ route: 'search/name', outcome: 'hits', value: 2 },
			{ route: 'search/address', outcome: 'invalid', value: 1 },
			{ route: 'geoid', outcome: 'hits', value: 1 },
		]);
		const timed = (await searchDuration.get()).values.filter(({ metricName }) => metricName?.endsWith('_count'));
		expect(timed.reduce((sum, { value }) => sum + value, 0)).toBe(6);
	});

	test('counts only searches', async () => {
		await app.request(`${API}/loginstatus`);
		await app.request(`${API}/internal/isAlive`);
		await app.request(`${API}/data/bydeler`);
		await app.request(`${API}/finnes-ikke`);
		await app.request(`${BASE}/nn`);
		await app.request(`${API}/search?query=4737`, { method: 'POST' });

		expect(await searchCounts()).toEqual([]);
	});
});

describe('pages', () => {
	test.each([
		[BASE, 'nb'],
		[`${BASE}/`, 'nb'],
		[`${BASE}?a=1`, 'nb'],
		[`${BASE}/nn`, 'nn'],
		[`${BASE}/nn/`, 'nn'],
		[`${BASE}/en`, 'en'],
		[`${BASE}/en/?a=1&b=2`, 'en'],
	] as const)('%s renders the %s page, and tells the renderer the url', async (path, locale) => {
		const response = await app.request(path);

		expect([response.status, mediaType(response)]).toEqual([200, 'text/html']);
		expect(await response.text()).toBe(fakePage(locale, path));
	});

	test('a failing render answers an empty 500, and is logged and counted', async () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const failing = appWith(async () => {
			throw new Error('Rendering failed');
		});

		const response = await failing.request(`${BASE}/nn`);

		expect([response.status, await response.text()]).toEqual([500, '']);
		expect(consoleError).toHaveBeenCalledWith(`Server error on ${BASE}/nn: 500 Error: Rendering failed`);
		expect((await pageRenders.get()).values.map(({ labels, value }) => [labels, value])).toEqual([
			[{ locale: 'nn', outcome: 'error' }, 1],
		]);
	});

	test('an HTTP error under 500 answers the 404 page', async () => {
		const rejecting = appWith(async () => {
			throw new HTTPException(400);
		});

		await expectTheNotFoundPage(await rejecting.request(`${BASE}/nn`));
	});
});

describe('static files', () => {
	test.each([
		['an asset', `${BASE}/assets/index-abc.js`, 'text/javascript', SCRIPT],
		['the favicon', `${BASE}/favicon.ico`, 'image/x-icon', 'ikon'],
	])('serves %s, cacheable for a year', async (_, path, type, content) => {
		const response = await app.request(path);

		expect([response.status, mediaType(response), response.headers.get('cache-control')]).toEqual([
			200,
			type,
			'public, max-age=31536000',
		]);
		expect(await response.text()).toBe(content);
	});

	test.each(['finnes-ikke.js', '', 'index-abc.js/x'])('assets/%s is not found, and not cacheable', async (file) => {
		const response = await app.request(`${BASE}/assets/${file}`);

		expect(response.headers.get('cache-control')).toBeNull();
		await expectTheNotFoundPage(response);
	});

	test.each([
		'..%2fsecret.txt',
		'..%2f..%2fsecret.txt',
		'%2e%2e%2f%2e%2e%2fsecret.txt',
		'..%5c..%5csecret.txt',
		'..%2findex.html',
		'%',
	])('assets/%s stays inside the assets', async (file) => {
		await expectTheNotFoundPage(await app.request(`${BASE}/assets/${file}`));
	});

	test('are served only under the base path', async () => {
		await expectTheNotFoundPage(await app.request('/assets/index-abc.js'));
		await expectTheNotFoundPage(await app.request('/favicon.ico'));
	});
});

describe('everything else', () => {
	test.each([
		['an unknown page', `${BASE}/finnes-ikke`],
		['a path below a page', `${BASE}/nn/finnes-ikke`],
		['an unknown API path', `${API}/finnes-ikke`],
		['a data dump that does not exist', `${API}/data/finnes-ikke`],
		['outside the base path', '/finnes-ikke'],
		['the root', '/'],
		['a path that starts like the base path', `${BASE}-2`],
		['a path that only differs in case', `${BASE}/NN`],
	])('%s gets the 404 page', async (_, path) => {
		await expectTheNotFoundPage(await app.request(path));
	});

	test.each(['POST', 'PUT', 'DELETE', 'OPTIONS'])('%s gets the 404 page', async (method) => {
		for (const path of [`${API}/search?query=4737`, `${API}/internal/isAlive`, `${BASE}/nn`, `${BASE}/favicon.ico`]) {
			await expectTheNotFoundPage(await app.request(path, { method }));
		}
	});

	test('running locally, the root redirects to the base path', async () => {
		vi.stubEnv('ENV', 'localhost');

		const response = await appWith().request('/');

		expect([response.status, response.headers.get('location')]).toEqual([302, BASE]);
	});

	test('compresses for clients that accept it, and says it varies', async () => {
		const compressed = await app.request(`${BASE}/nn`, { headers: { 'accept-encoding': 'br, gzip' } });
		const plain = await app.request(`${BASE}/nn`);

		expect([compressed.headers.get('content-encoding'), compressed.headers.get('vary')]).toEqual([
			'gzip',
			'Accept-Encoding',
		]);
		expect(gunzipSync(await compressed.bytes()).toString()).toBe(fakePage('nn', `${BASE}/nn`));
		expect([plain.headers.get('content-encoding'), plain.headers.get('vary')]).toEqual([null, 'Accept-Encoding']);
	});
});
