import { tmpdir } from 'node:os';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { BASE, startServer, type TestServer } from './harness';
import { normalizeHtml, parseHtml } from './html';
import { on, routeOf } from './stub';
import { DECORATOR, json, NOT_FOUND_HTML, ROUTES } from './upstreams';

const PAGES = { nb: BASE, nn: `${BASE}/nn`, en: `${BASE}/en` };

const mediaType = (response: Response) => response.headers.get('content-type')?.split(';')[0];

// What the moduler puts in the page: its head assets, the header, and the footer and scripts, in page order
const decoratorParts = (document: Document) => {
	const main = document.getElementById('maincontent');
	const afterMain = [...document.body.children].slice([...document.body.children].indexOf(main as Element) + 1);
	return [document.head.lastElementChild, document.body.firstElementChild, ...afterMain]
		.map((element) => normalizeHtml(element as Element).trim())
		.map((html) => html.replace(/decoratorModulerVersion=[^&"]+/, 'decoratorModulerVersion=*'));
};

describe('the pages', () => {
	let server: TestServer;

	beforeAll(async () => {
		server = await startServer();
	});

	afterAll(() => server?.stop());

	test.each([
		[BASE, 'nb'],
		[`${BASE}/`, 'nb'],
		[`${BASE}?utm_source=test`, 'nb'],
		[`${BASE}/nn`, 'nn'],
		[`${BASE}/nn/`, 'nn'],
		[`${BASE}/en`, 'en'],
		[`${BASE}/en/`, 'en'],
	])('%s is the %s page', async (path, locale) => {
		const response = await server.fetch(path);

		expect([response.status, mediaType(response)]).toEqual([200, 'text/html']);
		expect(parseHtml(await response.text()).documentElement.lang).toBe(locale);
	});

	test.each([`${BASE}/nb`, `${BASE}/nn/x`, `${BASE}/index.html`, '/'])('%s is not found', async (path) => {
		const response = await server.fetch(path);

		expect([response.status, await response.text()]).toEqual([404, NOT_FOUND_HTML]);
	});

	test.each(Object.entries(PAGES))('%s', async (locale, path) => {
		const html = await (await server.fetch(path)).text();

		await expect(normalizeHtml(parseHtml(html))).toMatchFileSnapshot(`__goldens__/pages/${locale}.html`);
	});

	test('has the decorator where the moduler puts it: last in head, first in body, and last in body', async () => {
		const document = parseHtml(await (await server.fetch(BASE)).text());

		expect(decoratorParts(document)).toEqual([
			'<link data-stub="decorator-head-assets" href="https://decorator.test/client.css" rel="stylesheet">',
			'<div data-stub="decorator-header"></div>',
			'<div data-stub="decorator-footer"></div>',
			'<script data-stub="decorator-scripts" src="https://decorator.test/client.js"></script>',
		]);
	});
});

test('asks the decorator once per locale, with its language', async () => {
	const server = await startServer();
	try {
		server.stub.reset();
		for (const path of [...Object.values(PAGES), ...Object.values(PAGES)]) {
			await (await server.fetch(path)).text();
		}

		expect(server.stub.requests.map((request) => [routeOf(request), request.query.get('language')])).toEqual([
			[ROUTES.decoratorVersion, null],
			[ROUTES.decoratorSsr, 'nb'],
			[ROUTES.decoratorSsr, 'nn'],
			[ROUTES.decoratorSsr, 'en'],
		]);
	} finally {
		await server.stop();
	}
});

test('falls back to client-side decorator placeholders after trying the decorator four times', async () => {
	const server = await startServer({
		overrides: [on(ROUTES.decoratorSsr, () => json({ error: 'Internal Server Error' }, 500))],
	});
	try {
		server.stub.reset();
		const response = await server.fetch(BASE);
		const document = parseHtml(await response.text());

		expect(response.status).toBe(200);
		expect(server.stub.requests.filter((request) => routeOf(request) === ROUTES.decoratorSsr)).toHaveLength(4);
		expect(document.getElementById('maincontent')?.children).not.toHaveLength(0);
		expect(decoratorParts(document)).toEqual([
			'<link href="https://www.nav.no/dekoratoren/csr/css/client.css" rel="stylesheet">',
			'<div id="decorator-header"></div>',
			'<div id="decorator-footer"></div>',
			'<div data-src="https://www.nav.no/dekoratoren/csr?context=privatperson&language=nb&availableLanguages=%5B%7B%22locale%22%3A%22nb%22%2C%22handleInApp%22%3Atrue%7D%2C%7B%22locale%22%3A%22nn%22%2C%22handleInApp%22%3Atrue%7D%2C%7B%22locale%22%3A%22en%22%2C%22handleInApp%22%3Atrue%7D%5D&decoratorModulerVersion=*&decoratorModulerEntryPoint=ssr" id="decorator-env"></div>',
			'<script defer src="https://www.nav.no/dekoratoren/csr/client.js"></script>',
		]);
	} finally {
		await server.stop();
	}
});

test("strips </link> from the decorator's markup", async () => {
	const server = await startServer({
		overrides: [
			on(ROUTES.decoratorSsr, () =>
				json({ ...DECORATOR, headAssets: '<link rel="stylesheet" href="https://decorator.test/client.css"></link>' }),
			),
		],
	});
	try {
		const html = await (await server.fetch(BASE)).text();

		expect(html).toContain('<link rel="stylesheet" href="https://decorator.test/client.css"></head>');
		expect(html).not.toContain('</link>');
	} finally {
		await server.stop();
	}
});

test('started from another directory, it finds neither its template nor its files, and pages answer an empty 500 (bug)', async () => {
	const server = await startServer({ cwd: tmpdir() });
	try {
		const page = await server.fetch(BASE);
		expect([page.status, await page.text()]).toEqual([500, '']);

		const favicon = await server.fetch(`${BASE}/favicon.ico`);
		expect([favicon.status, await favicon.text()]).toEqual([404, NOT_FOUND_HTML]);
	} finally {
		await server.stop();
	}
});

test('with ENV=localhost, / redirects to the base path', async () => {
	const server = await startServer({ env: { ENV: 'localhost' } });
	try {
		const response = await server.fetch('/');
		await response.text();

		expect([response.status, response.headers.get('location')]).toEqual([302, BASE]);
	} finally {
		await server.stop();
	}
});
