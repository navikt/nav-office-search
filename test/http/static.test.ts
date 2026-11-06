import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { BASE, CLIENT_DIR, startServer, type TestServer } from './harness';
import { parseHtml } from './html';
import { NOT_FOUND_HTML } from './upstreams';

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

test('serves them from the build, cacheable for a year', async () => {
	for (const path of files) {
		const { status, headers, body } = await server.request(path);

		expect([path, status, headers['cache-control']]).toEqual([path, 200, 'public, max-age=31536000']);
		expect(body.equals(readFileSync(join(CLIENT_DIR, path.slice(BASE.length))))).toBe(true);
	}
});

test.each([
	`${BASE}/assets/finnes-ikke.js`,
	`${BASE}/assets/`,
	`${BASE}/assets/%`,
	// packages/server/package.json, from frontendDist/client/assets
	`${BASE}/assets/..%2f..%2f..%2fpackage.json`,
	`${BASE}/assets/%2e%2e/%2e%2e/%2e%2e/package.json`,
	`${BASE}/favicon.ico/x`,
])('%s is not found', async (path) => {
	const { status, body } = await server.request(path);

	expect([status, body.toString()]).toEqual([404, NOT_FOUND_HTML]);
});
