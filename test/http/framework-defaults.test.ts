import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { API, BASE, CLIENT_DIR, startServer, type TestServer } from './harness.ts';
import { NOT_FOUND_HTML } from './upstreams.ts';

/*
 * What the server does because Hono does it by default, kept here so that a framework change only changes this file.
 * The other files pin the app's own behaviour.
 */

let server: TestServer;

beforeAll(async () => {
	server = await startServer();
});

afterAll(() => server?.stop());

const { file, css } = JSON.parse(readFileSync(join(CLIENT_DIR, '.vite/manifest.json'), 'utf-8'))[
	'client/main-client.tsx'
];
const SCRIPT = `${BASE}/${file}`;
const STYLESHEET = `${BASE}/${css[0]}`;

// Responses of each kind
const PAGE = `${BASE}/en`;
const JSON_RESPONSE = `${API}/search/name?query=oslo`;
const SMALL_JSON_RESPONSE = `${API}/loginstatus`;
const NOT_FOUND = `${BASE}/finnes-ikke`;
const FAVICON = `${BASE}/favicon.ico`;

test('sends these content types', async () => {
	const types: Record<string, string | undefined> = {};
	for (const path of [PAGE, JSON_RESPONSE, `${API}/internal/isAlive`, NOT_FOUND, SCRIPT, STYLESHEET, FAVICON]) {
		types[path] = (await server.request(path)).headers['content-type'];
	}
	types.metrics = (await server.request(`${API}/internal/metrics`)).headers['content-type'];

	expect(types).toEqual({
		[PAGE]: 'text/html; charset=UTF-8',
		[JSON_RESPONSE]: 'application/json',
		[`${API}/internal/isAlive`]: 'text/html; charset=UTF-8',
		[NOT_FOUND]: 'text/html; charset=UTF-8',
		[SCRIPT]: 'text/javascript; charset=utf-8',
		[STYLESHEET]: 'text/css; charset=utf-8',
		[FAVICON]: 'image/x-icon',
		// The registry's value, passed through unchanged
		metrics: 'text/plain; version=0.0.4; charset=utf-8',
	});
});

describe('caching', () => {
	test.each([
		['pages', PAGE],
		['JSON', JSON_RESPONSE],
		['static files', SCRIPT],
		['the 404 page', NOT_FOUND],
	])('sends no ETag with %s', async (_, path) => {
		expect((await server.request(path)).headers.etag).toBeUndefined();
	});

	test('sends static files with Last-Modified, but answers If-Modified-Since in full', async () => {
		const { headers, body } = await server.request(SCRIPT);
		expect(headers['last-modified']).toBeDefined();

		const revalidated = await server.request(SCRIPT, {
			headers: { 'if-modified-since': headers['last-modified'] as string },
		});
		expect([revalidated.status, revalidated.body.length]).toEqual([200, body.length]);
	});

	test('answers ranges of static files', async () => {
		const { status, headers, body } = await server.request(SCRIPT, { headers: { range: 'bytes=0-9' } });

		expect([status, headers['accept-ranges'], body.length]).toEqual([206, 'bytes', 10]);
		expect(headers['content-range']).toMatch(/^bytes 0-9\/\d+$/);
	});
});

describe('compression', () => {
	test.each([
		['br, gzip', 'gzip'],
		['gzip, deflate', 'gzip'],
		['deflate', 'deflate'],
		['identity', undefined],
	])('Accept-Encoding: %s, for pages, JSON and the favicon', async (acceptEncoding, encoding) => {
		for (const path of [PAGE, JSON_RESPONSE, FAVICON]) {
			const { headers } = await server.request(path, { headers: { 'accept-encoding': acceptEncoding } });
			expect([path, headers['content-encoding'], headers.vary]).toEqual([path, encoding, 'Accept-Encoding']);
		}
	});

	// The threshold of 1 KB only applies to a response that has a Content-Length by then, and these don't
	test('compresses small responses too', async () => {
		const { headers, body } = await server.request(SMALL_JSON_RESPONSE, { headers: { 'accept-encoding': 'br, gzip' } });

		expect([headers['content-encoding'], headers.vary, gunzipSync(body).toString()]).toEqual([
			'gzip',
			'Accept-Encoding',
			'{"isUserLoggedIn":false}',
		]);
	});
});

describe('routing', () => {
	const expectTheNotFoundPage = async (path: string, method = 'GET') => {
		const { status, body } = await server.request(path, { method });
		expect([method, path, status, body.toString()]).toEqual([method, path, 404, NOT_FOUND_HTML]);
	};

	test.each([
		'/FINN-NAV-KONTOR',
		`${BASE}/NN`,
		`${BASE}/En/`,
		`${API}/SEARCH?query=4737`,
		`${API}/Search/Name/?query=oslo`,
	])('matches case-sensitively, so %s is not found', (path) => expectTheNotFoundPage(path));

	test('matches API routes with or without a trailing slash', async () => {
		for (const path of [`${API}/search/?query=4737`, `${API}/search/name/?query=oslo`, `${API}/internal/isReady/`]) {
			expect([path, (await server.request(path)).status]).toEqual([path, 200]);
		}
	});

	test('answers HEAD like GET, without the body and its length', async () => {
		for (const path of [PAGE, JSON_RESPONSE, `${API}/internal/isAlive`]) {
			const get = await server.request(path);
			const { status, headers, body } = await server.request(path, { method: 'HEAD' });
			expect([path, status, headers['content-type'], headers['content-length'], body.length]).toEqual([
				path,
				200,
				get.headers['content-type'],
				undefined,
				0,
			]);
		}
	});

	test.each(['OPTIONS', 'POST', 'PUT', 'DELETE'])('answers %s with the 404 page', async (method) => {
		// Having it in the page cache makes no difference
		await server.request(`${BASE}/nn`);

		for (const path of [`${API}/search?query=4737`, `${API}/internal/isAlive`, `${BASE}/nn`, SCRIPT]) {
			await expectTheNotFoundPage(path, method);
		}
	});

	test('treats /assets as any other unknown path', () => expectTheNotFoundPage(`${BASE}/assets`));
});

describe('query strings', () => {
	// Both fall through to an address search, which echoes the query as decoded
	test.each([
		['+ as a space', '?query=a+b', 'a b'],
		['malformed percent-encoding as it is', '?query=%E0%A4%A', '%E0%A4%A'],
	])('decodes %s', async (_, queryString, decoded) => {
		const { status, body } = await server.request(`${API}/search${queryString}`);

		expect([status, JSON.parse(body.toString()).adresseQuery]).toEqual([200, decoded]);
	});
});
