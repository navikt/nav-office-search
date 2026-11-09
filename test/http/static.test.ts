import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { brotliDecompressSync, gunzipSync, inflateSync } from 'node:zlib';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { BASE, CLIENT_DIR, startServer, type TestServer } from './harness.ts';
import { parseHtml } from './html.ts';
import { NOT_FOUND_HTML } from './upstreams.ts';

let server: TestServer;
// The files the page refers to
let files: string[];

beforeAll(async () => {
	server = await startServer();
	const document = parseHtml(await (await server.fetch(BASE)).text());
	files = [...document.querySelectorAll('[src], link[href]')]
		.map((element) => element.getAttribute('src') ?? element.getAttribute('href') ?? '')
		.filter((url) => url.startsWith(`${BASE}/`));
});

afterAll(() => server?.stop());

test('the page refers to its favicon, script and stylesheet under the base path', () => {
	expect(files.map((path) => path.replace(/-[\w-]{8}\./, '-[hash].'))).toEqual([
		`${BASE}/favicon.ico`,
		`${BASE}/assets/index-[hash].js`,
		`${BASE}/assets/index-[hash].css`,
	]);
});

const built = (path: string) => readFileSync(join(CLIENT_DIR, path.slice(BASE.length)));

test('serves them from the build, the hashed ones cacheable for good and the favicon for a day', async () => {
	for (const path of files) {
		const { status, headers, body } = await server.request(path);
		const cacheControl = path.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=86400';

		expect([path, status, headers['cache-control']]).toEqual([path, 200, cacheControl]);
		expect(body.equals(built(path))).toBe(true);
	}
});

test.each([
	['br, gzip', 'br', brotliDecompressSync],
	['gzip, deflate', 'gzip', gunzipSync],
	['deflate', 'deflate', inflateSync],
	['identity', undefined, (body: Buffer) => body],
])('Accept-Encoding: %s gets the script and stylesheet as %s', async (acceptEncoding, encoding, decode) => {
	for (const path of files.filter((file) => file.includes('/assets/'))) {
		const { headers, body } = await server.request(path, { headers: { 'accept-encoding': acceptEncoding } });

		expect([path, headers['content-encoding'], headers.vary]).toEqual([path, encoding, 'Accept-Encoding']);
		expect(decode(body).equals(built(path))).toBe(true);
	}
});

test.each([
	`${BASE}/assets/finnes-ikke.js`,
	`${BASE}/assets/`,
	`${BASE}/assets/%`,
	// The repo's package.json, from dist/client/assets
	`${BASE}/assets/..%2f..%2f..%2fpackage.json`,
	`${BASE}/assets/%2e%2e/%2e%2e/%2e%2e/package.json`,
	`${BASE}/favicon.ico/x`,
])('%s is not found', async (path) => {
	const { status, body } = await server.request(path);

	expect([status, body.toString()]).toEqual([404, NOT_FOUND_HTML]);
});
