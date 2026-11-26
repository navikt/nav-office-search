import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { brotliCompressSync, gunzipSync, gzipSync, inflateSync } from 'node:zlib';
import { networkError } from '@itsy/corgi/testing';
import { logger } from '@navikt/navno-logger';
import { HTTPException } from 'hono/http-exception';
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { installUpstreams } from '#test/upstream/upstreams.ts';
import { BASE_PATH } from '#shared/basePath.ts';
import type { AppLocale } from '#shared/localization/types.ts';
import { createApp } from './app.ts';
import { pageRenders, registry, searchRequests } from './metrics/metrics.ts';
import type { HtmlRenderer } from './site/ssr/htmlRenderer.ts';
import { env } from '#server/env.ts';

const BASE = BASE_PATH;
const API = `${BASE}/api`;
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
	createApp({ site: { render, clientDir } });

const app = appWith();

const mediaType = (response: Response) => response.headers.get('content-type')?.split(';')[0];

const expectNotFound = async (response: Response) => {
	expect([response.status, mediaType(response), await response.text()]).toEqual([404, 'text/plain', 'Not found']);
};

const { upstreams, calls: upstreamCalls } = installUpstreams();

beforeEach(() => {
	registry.resetMetrics();
});

afterEach(() => {
	vi.restoreAllMocks();
});

afterAll(() => {
	rmSync(buildDir, { recursive: true });
});

describe('the API', () => {
	test.each([
		['/search?query=4737', { type: 'postnr', postnr: '4737' }],
		['/search?query=oslo', { type: 'name', input: 'oslo' }],
		['/search/?query=4737', { type: 'postnr', postnr: '4737' }],
		['/search?query=storgata%201', { type: 'adresse', adresseQuery: 'storgata 1' }],
		['/search?query=storgata+1', { type: 'adresse', adresseQuery: 'storgata 1' }],
		['/loginstatus', { isUserLoggedIn: false }],
	])('%s answers JSON', async (path, expected) => {
		const response = await app.request(`${API}${path}`);

		expect([response.status, mediaType(response)]).toEqual([200, 'application/json']);
		expect(await response.json()).toMatchObject(expected);
	});

	test.each(['/internal/alive', '/internal/ready'])('%s answers the probe, outside the base path', async (path) => {
		const response = await app.request(path);

		expect([response.status, await response.text()]).toEqual([200, 'OK']);
		await expectNotFound(await app.request(`${BASE}${path}`));
	});

	test.each(['/search', '/search?query=4737&query=0150'])(
		'%s asks nav-office-search-api without a query: a repeated one counts as missing',
		async (path) => {
			const response = await app.request(`${API}${path}`);

			expect([response.status, await response.json()]).toEqual([
				400,
				{ type: 'error', messageId: 'errorMissingQuery' },
			]);
			expect(upstreamCalls().at(-1)?.url).toBe(`${env.API_ORIGIN}/search`);
		},
	);

	test('passes the status on from the handler', async () => {
		expect((await app.request(`${API}/search?query=0000`)).status).toBe(404);
	});

	test('forwards the cookie to the login session endpoint', async () => {
		const cookie = 'io.nais.wonderwall.session=abc; other=1';

		const response = await app.request(`${API}/loginstatus`, { headers: { cookie } });

		expect(await response.json()).toEqual({ isUserLoggedIn: true });
		expect(upstreamCalls().map(({ url, headers }) => [url, headers.cookie])).toEqual([
			[env.LOGIN_SESSION_API_URL, cookie],
		]);
	});
});

describe('metrics', () => {
	const searchCounts = async () =>
		(await searchRequests.get()).values.map(({ labels, value }) => ({ ...labels, value }));

	test('serves the registry in its own format', async () => {
		await app.request(`${API}/search?query=4737`);

		const response = await app.request('/internal/metrics');
		const text = await response.text();

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe(registry.contentType);
		expect(text).toContain('nav_office_search_search_requests_total{outcome="ok"} 1');
		expect(text).toContain('nodejs_eventloop_lag_seconds');
	});

	test('counts and times the requests a search makes, under the names the alert and the dashboards read', async () => {
		await app.request(`${API}/search?query=4737`);

		const text = await (await app.request('/internal/metrics')).text();

		for (const upstream of ['texas', 'office-search-api/search']) {
			expect(text).toContain(`nav_office_search_upstream_requests_total{upstream="${upstream}",status="2xx"} 1`);
			expect(text).toContain(`nav_office_search_upstream_request_duration_seconds_count{upstream="${upstream}"} 1`);
		}
	});

	test('counts each search by outcome, hits or not, with or without a trailing slash', async () => {
		await app.request(`${API}/search?query=4737`);
		await app.request(`${API}/search/?query=oslo`);
		await app.request(`${API}/search?query=storgata+1`);
		await app.request(`${API}/search?query=1001`);
		await app.request(`${API}/search?query=ukjent+adresse+1`);
		await app.request(`${API}/search?query=0000`);
		upstreams.get(`${env.API_ORIGIN}/search`, networkError());
		await app.request(`${API}/search?query=4737`);

		expect(await searchCounts()).toEqual([
			{ outcome: 'ok', value: 5 },
			{ outcome: 'invalid', value: 1 },
			{ outcome: 'error', value: 1 },
		]);
	});

	test('counts only searches', async () => {
		await app.request(`${API}/loginstatus`);
		await app.request('/internal/alive');
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
		const bindings = { vite: 'the dev server' };

		await appWith(render).request(`${BASE}/nn`, {}, bindings);

		expect(render.mock.calls).toEqual([['nn', bindings]]);
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

	test('an HTTP error under 500 answers a plain 404', async () => {
		const rejecting = appWith(async () => {
			throw new HTTPException(400);
		});

		await expectNotFound(await rejecting.request(`${BASE}/nn`));
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
		await expectNotFound(response);
	});

	test.each([
		'..%2fsecret.txt',
		'..%2f..%2fsecret.txt',
		'%2e%2e%2f%2e%2e%2fsecret.txt',
		'..%5c..%5csecret.txt',
		'..%2ffavicon.ico',
		'%',
	])('assets/%s stays inside the assets', async (file) => {
		await expectNotFound(await app.request(`${BASE}/assets/${file}`));
	});

	test('are served only under the base path', async () => {
		await expectNotFound(await app.request('/assets/index-abc.js'));
		await expectNotFound(await app.request('/favicon.ico'));
	});
});

describe('everything else', () => {
	test.each([
		['an unknown page', `${BASE}/finnes-ikke`],
		['a path below a page', `${BASE}/nn/finnes-ikke`],
		['an unknown API path', `${API}/finnes-ikke`],
		// These worked prior to the data-move to office-search-api
		['a data dump', `${API}/data/kommuner`],
		['outside the base path', '/finnes-ikke'],
		['the root', '/'],
		['a path that starts like the base path', `${BASE}-2`],
		['a path that only differs in case', `${BASE}/NN`],
	])('%s gets a plain 404', async (_, path) => {
		await expectNotFound(await app.request(path));
	});

	test.each(['POST', 'PUT', 'DELETE', 'OPTIONS'])('%s gets a plain 404', async (method) => {
		for (const path of [`${API}/search?query=4737`, '/internal/alive', `${BASE}/nn`, `${BASE}/favicon.ico`]) {
			await expectNotFound(await app.request(path, { method }));
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
