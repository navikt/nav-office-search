import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { API, BASE, CLIENT_DIR, startServer, type TestServer } from './harness';
import { parseHtml } from './html';
import { NOT_FOUND_HTML } from './upstreams';

/*
 * What the server does because Express does it by default, kept here so that a framework change only changes this
 * file. The other files pin the app's own behaviour.
 */

let server: TestServer;

beforeAll(async () => {
	server = await startServer();
});

afterAll(() => server?.stop());

const builtPage = readFileSync(join(CLIENT_DIR, 'index.html'), 'utf-8');
const SCRIPT = builtPage.match(/src="([^"]+\.js)"/)?.[1] ?? 'missing';
const STYLESHEET = builtPage.match(/href="([^"]+\.css)"/)?.[1] ?? 'missing';

// Responses of each kind, over 1 KB unless noted
const PAGE = `${BASE}/en`;
const JSON_RESPONSE = `${API}/search/name?query=oslo`;
const SMALL_JSON_RESPONSE = `${API}/loginstatus`;
const NOT_FOUND = `${BASE}/finnes-ikke`;
const FAVICON = `${BASE}/favicon.ico`;

test('says X-Powered-By: Express', async () => {
	for (const path of [PAGE, JSON_RESPONSE, SCRIPT, NOT_FOUND]) {
		expect([path, (await server.request(path)).headers['x-powered-by']]).toEqual([path, 'Express']);
	}
});

test('sends these content types', async () => {
	const types: Record<string, string | undefined> = {};
	for (const path of [PAGE, JSON_RESPONSE, `${API}/internal/isAlive`, NOT_FOUND, SCRIPT, STYLESHEET, FAVICON]) {
		types[path] = (await server.request(path)).headers['content-type'];
	}
	types.metrics = (await server.request(`${API}/internal/metrics`)).headers['content-type'];

	expect(types).toEqual({
		[PAGE]: 'text/html; charset=utf-8',
		[JSON_RESPONSE]: 'application/json; charset=utf-8',
		[`${API}/internal/isAlive`]: 'text/html; charset=utf-8',
		[NOT_FOUND]: 'text/html; charset=utf-8',
		[SCRIPT]: 'text/javascript; charset=utf-8',
		[STYLESHEET]: 'text/css; charset=utf-8',
		[FAVICON]: 'image/vnd.microsoft.icon',
		// The registry's 'text/plain; version=0.0.4; charset=utf-8', with the charset moved first
		metrics: 'text/plain; charset=utf-8; version=0.0.4',
	});
});

describe('caching', () => {
	test.each([
		['pages', PAGE],
		['JSON', JSON_RESPONSE],
		['static files', SCRIPT],
	])('sends weak ETags with %s, and 304 when If-None-Match matches', async (_, path) => {
		const { headers } = await server.request(path);
		expect(headers.etag).toMatch(/^W\/"[\w+/=-]+"$/);

		const revalidated = await server.request(path, { headers: { 'if-none-match': headers.etag as string } });
		expect([revalidated.status, revalidated.body.length]).toEqual([304, 0]);
	});

	test('sends a weak ETag with the 404 page too, but never 304 for it', async () => {
		const { headers } = await server.request(NOT_FOUND);
		expect(headers.etag).toMatch(/^W\/"[\w+/=-]+"$/);

		const revalidated = await server.request(NOT_FOUND, { headers: { 'if-none-match': headers.etag as string } });
		expect(revalidated.status).toBe(404);
	});

	test('sends static files with Last-Modified, and 304 when If-Modified-Since is that', async () => {
		const { headers } = await server.request(SCRIPT);
		expect(headers['last-modified']).toBeDefined();

		const revalidated = await server.request(SCRIPT, {
			headers: { 'if-modified-since': headers['last-modified'] as string },
		});
		expect(revalidated.status).toBe(304);
	});

	test('answers ranges of static files', async () => {
		const { status, headers, body } = await server.request(SCRIPT, { headers: { range: 'bytes=0-9' } });

		expect([status, headers['accept-ranges'], body.length]).toEqual([206, 'bytes', 10]);
		expect(headers['content-range']).toMatch(/^bytes 0-9\/\d+$/);
	});
});

describe('compression', () => {
	test.each([
		['br, gzip', 'br'],
		['gzip, deflate', 'gzip'],
		['deflate', 'deflate'],
		['identity', undefined],
	])('Accept-Encoding: %s, for pages, JSON and static files', async (acceptEncoding, encoding) => {
		for (const path of [PAGE, JSON_RESPONSE, SCRIPT, FAVICON]) {
			const { headers } = await server.request(path, { headers: { 'accept-encoding': acceptEncoding } });
			expect([path, headers['content-encoding'], headers.vary]).toEqual([path, encoding, 'Accept-Encoding']);
		}
	});

	test('leaves responses under 1 KB alone, and still says Vary', async () => {
		const { headers, body } = await server.request(SMALL_JSON_RESPONSE, { headers: { 'accept-encoding': 'br, gzip' } });

		expect([headers['content-encoding'], headers['content-length'], headers.vary, body.length]).toEqual([
			undefined,
			'24',
			'Accept-Encoding',
			24,
		]);
	});
});

describe('routing', () => {
	test.each([
		['/FINN-NAV-KONTOR', 'nb'],
		[`${BASE}/NN`, 'nn'],
		[`${BASE}/En/`, 'en'],
	])('matches pages case-insensitively: %s is the %s page', async (path, locale) => {
		const response = await server.fetch(path);

		expect(response.status).toBe(200);
		expect(parseHtml(await response.text()).documentElement.lang).toBe(locale);
	});

	test('matches API routes case-insensitively, with or without a trailing slash', async () => {
		for (const path of [`${API}/SEARCH?query=4737`, `${API}/search/?query=4737`, `${API}/Search/Name/?query=oslo`]) {
			expect([path, (await server.request(path)).status]).toEqual([path, 200]);
		}
	});

	test('answers HEAD like GET, without the body', async () => {
		for (const path of [PAGE, JSON_RESPONSE, `${API}/internal/isAlive`]) {
			const get = await server.request(path);
			const head = await server.request(path, { method: 'HEAD' });
			expect([path, head.status, head.headers['content-length'], head.body.length]).toEqual([
				path,
				200,
				`${get.body.length}`,
				0,
			]);
		}
	});

	test.each([
		['an API route', `${API}/search?query=4737`],
		['a probe', `${API}/internal/isAlive`],
		['a page that is not in the page cache', `${BASE}/nn?options=1`],
	])('answers OPTIONS for %s with the methods it has', async (_, path) => {
		const { status, headers, body } = await server.request(path, { method: 'OPTIONS' });

		expect([status, headers.allow, headers['content-type'], body.toString()]).toEqual([
			200,
			'GET, HEAD',
			'text/plain',
			'GET, HEAD',
		]);
	});

	test.each(['POST', 'PUT', 'DELETE'])('answers %s with the 404 page', async (method) => {
		for (const path of [`${API}/search?query=4737`, `${API}/internal/isAlive`, `${BASE}/nn?${method}=1`]) {
			const { status, body } = await server.request(path, { method });
			expect([path, status, body.toString()]).toEqual([path, 404, NOT_FOUND_HTML]);
		}
	});

	test('answers any method with a page from the page cache (bug)', async () => {
		const path = `${BASE}/nn?cached=1`;
		await server.request(path);

		for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS']) {
			const { status, body } = await server.request(path, { method });
			expect([method, status, parseHtml(body.toString()).documentElement.lang]).toEqual([method, 200, 'nn']);
		}
	});

	test('redirects /assets to /assets/', async () => {
		const { status, headers, body } = await server.request(`${BASE}/assets`);

		expect([status, headers.location, headers['content-type']]).toEqual([
			301,
			`${BASE}/assets/`,
			'text/html; charset=UTF-8',
		]);
		expect(headers['content-security-policy']).toBe("default-src 'none'");
		expect(body.toString()).toContain(`Redirecting to ${BASE}/assets/`);
	});
});

describe('query strings', () => {
	// Both fall through to an address search, which echoes the query as decoded
	test.each([
		['+ as a space', '?query=a+b', 'a b'],
		['malformed percent-encoding leniently', '?query=%E0%A4%A', '�%A'],
	])('decodes %s', async (_, queryString, decoded) => {
		const { status, body } = await server.request(`${API}/search${queryString}`);

		expect([status, JSON.parse(body.toString()).adresseQuery]).toEqual([200, decoded]);
	});
});
