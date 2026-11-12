import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { brotliCompressSync, gunzipSync, gzipSync, inflateSync } from 'node:zlib';
import { logger } from '@navikt/navno-logger';
import { HTTPException } from 'hono/http-exception';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { upstreamCalls, upstreams } from '#test/upstream/mswServer.ts';
import { BASE_PATH } from '#shared/basePath.ts';
import type { AppLocale } from '#shared/localization/types.ts';
import { createApp } from './app.ts';
import { loadData } from './data/data.ts';
import { getBydelerArray } from './data/bydeler.ts';
import { getKommunerArray } from './data/kommuner.ts';
import { getPoststedArray } from './data/poststeder.ts';
import { pageRenders, registry, searchDuration, searchRequests } from './metrics/metrics.ts';
import type { HtmlRenderer } from './site/ssr/htmlRenderer.ts';
import { env } from '#server/env.ts';

const BASE = BASE_PATH;
const API = `${BASE}/api`;
const NOT_FOUND_HTML = '<h1>Fant ikke siden</h1>';
const SCRIPT = 'console.log("hei");\n'.repeat(100);
const SMALL_SCRIPT = 'console.log("hei");';
// What the build writes next to a script over 1 KB
const SCRIPT_BROTLI = brotliCompressSync(SCRIPT);
const SCRIPT_GZIP = gzipSync(SCRIPT);

// The parent holds what must stay out of reach, and clientDir a built client
const buildDir = mkdtempSync(join(tmpdir(), 'nav-office-search-'));
const clientDir = join(buildDir, 'client');
mkdirSync(join(clientDir, 'assets'), { recursive: true });
writeFileSync(join(buildDir, 'secret.txt'), 'hemmelig');
writeFileSync(join(clientDir, 'favicon.ico'), 'ikon');
writeFileSync(join(clientDir, 'assets', 'index-abc.js'), SCRIPT);
writeFileSync(join(clientDir, 'assets', 'index-abc.js.br'), SCRIPT_BROTLI);
writeFileSync(join(clientDir, 'assets', 'index-abc.js.gz'), SCRIPT_GZIP);
writeFileSync(join(clientDir, 'assets', 'small.js'), SMALL_SCRIPT);

const fakePage = (locale: AppLocale) => `<html lang="${locale}"></html>`;

const appWith = (render: HtmlRenderer = async (locale) => fakePage(locale)) =>
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
	vi.restoreAllMocks();
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
			[env.LOGIN_SESSION_API_URL, cookie],
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
	] as const)('%s renders the %s page', async (path, locale) => {
		const response = await app.request(path);

		expect([response.status, mediaType(response)]).toEqual([200, 'text/html']);
		expect(await response.text()).toBe(fakePage(locale));
	});

	test('hands the renderer what the server hands the request', async () => {
		const render = vi.fn(async () => '');
		const env = { vite: 'the dev server' };

		await appWith(render).request(`${BASE}/nn`, {}, env);

		expect(render.mock.calls).toEqual([['nn', env]]);
	});

	test('a failing render answers an empty 500, and is logged and counted', async () => {
		const error = vi.spyOn(logger, 'error');
		const failing = appWith(async () => {
			throw new Error('Rendering failed');
		});

		const response = await failing.request(`${BASE}/nn`);

		expect([response.status, await response.text()]).toEqual([500, '']);
		expect(error.mock.calls).toEqual([
			['Request failed', { method: 'GET', path: `${BASE}/nn`, status: 500 }, new Error('Rendering failed')],
		]);
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
	const ASSET = `${BASE}/assets/index-abc.js`;
	const FOR_GOOD = 'public, max-age=31536000, immutable';

	test.each([
		['an asset, cacheable for good', ASSET, 'text/javascript', SCRIPT, FOR_GOOD],
		['the favicon, cacheable for a day', `${BASE}/favicon.ico`, 'image/x-icon', 'ikon', 'public, max-age=86400'],
	])('serves %s', async (_, path, type, content, cacheControl) => {
		const response = await app.request(path);

		expect([response.status, mediaType(response), response.headers.get('cache-control')]).toEqual([
			200,
			type,
			cacheControl,
		]);
		expect(await response.text()).toBe(content);
	});

	test.each([
		['br, gzip', 'br', SCRIPT_BROTLI],
		// What browsers send
		['gzip, deflate, br, zstd', 'br', SCRIPT_BROTLI],
		['gzip, deflate', 'gzip', SCRIPT_GZIP],
		['br;q=0, gzip', 'gzip', SCRIPT_GZIP],
	])('Accept-Encoding: %s gets the %s file from the build', async (acceptEncoding, encoding, file) => {
		const response = await app.request(ASSET, { headers: { 'accept-encoding': acceptEncoding } });

		expect([
			response.status,
			mediaType(response),
			response.headers.get('content-encoding'),
			response.headers.get('vary'),
			response.headers.get('content-length'),
			response.headers.get('cache-control'),
		]).toEqual([200, 'text/javascript', encoding, 'Accept-Encoding', `${file.length}`, FOR_GOOD]);
		expect(Buffer.from(await response.bytes()).equals(file)).toBe(true);
	});

	test('Accept-Encoding: deflate has no file, so that one is compressed on the fly', async () => {
		const response = await app.request(ASSET, { headers: { 'accept-encoding': 'deflate' } });

		expect([response.headers.get('content-encoding'), response.headers.get('cache-control')]).toEqual([
			'deflate',
			FOR_GOOD,
		]);
		expect(inflateSync(await response.bytes()).toString()).toBe(SCRIPT);
	});

	test('without Accept-Encoding, gets the plain file and says it varies', async () => {
		const response = await app.request(ASSET);

		expect([
			response.headers.get('content-encoding'),
			response.headers.get('vary'),
			response.headers.get('content-length'),
		]).toEqual([null, 'Accept-Encoding', `${SCRIPT.length}`]);
		expect(await response.text()).toBe(SCRIPT);
	});

	test('HEAD describes the file a GET would get', async () => {
		const response = await app.request(ASSET, { method: 'HEAD', headers: { 'accept-encoding': 'br' } });

		expect([
			response.status,
			response.headers.get('content-encoding'),
			response.headers.get('content-length'),
			response.headers.get('cache-control'),
		]).toEqual([200, 'br', `${SCRIPT_BROTLI.length}`, FOR_GOOD]);
		expect(await response.text()).toBe('');
	});

	test('a small file stays as it is', async () => {
		const response = await app.request(`${BASE}/assets/small.js`, {
			headers: { 'accept-encoding': 'gzip, deflate, br, zstd' },
		});

		expect([response.headers.get('content-encoding'), response.headers.get('cache-control')]).toEqual([null, FOR_GOOD]);
		expect(await response.text()).toBe(SMALL_SCRIPT);
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
		'..%2ffavicon.ico',
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

	test('compresses for clients that accept it, and says it varies', async () => {
		const compressed = await app.request(`${BASE}/nn`, { headers: { 'accept-encoding': 'br, gzip' } });
		const plain = await app.request(`${BASE}/nn`);

		expect([compressed.headers.get('content-encoding'), compressed.headers.get('vary')]).toEqual([
			'gzip',
			'Accept-Encoding',
		]);
		expect(gunzipSync(await compressed.bytes()).toString()).toBe(fakePage('nn'));
		expect([plain.headers.get('content-encoding'), plain.headers.get('vary')]).toEqual([null, 'Accept-Encoding']);
	});
});
