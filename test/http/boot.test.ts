import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { API, BASE, launchServer, startServer, type TestServer } from './harness.ts';
import { on, routeOf, type StubRequest } from './stub.ts';
import { AUTHORIZATION, json, NOT_FOUND_HTML, ORIGINS, ROUTES } from './upstreams.ts';

const API_HOST = new URL(ORIGINS.api).host;

const countBy = (requests: StubRequest[], key: (request: StubRequest) => string) => {
	const counts: Record<string, number> = {};
	for (const request of requests) {
		counts[key(request)] = (counts[key(request)] ?? 0) + 1;
	}
	return counts;
};

// One line per distinct request, sorted, so the order the server sends them in doesn't matter
const requestLines = (requests: StubRequest[]) =>
	Object.entries(countBy(requests, ({ method, url }) => `${method} ${url}`))
		.sort(([a], [b]) => (a < b ? -1 : 1))
		.map(([line, count]) => (count > 1 ? `${line} ×${count}` : line))
		.join('\n') + '\n';

// The moduler adds its own version to the decorator parameters, and Dependabot bumps it
const DECORATOR_PARAMS = {
	context: 'privatperson',
	language: 'nb',
	availableLanguages: JSON.stringify([
		{ locale: 'nb', handleInApp: true },
		{ locale: 'nn', handleInApp: true },
		{ locale: 'en', handleInApp: true },
	]),
	decoratorModulerVersion: expect.any(String),
	decoratorModulerEntryPoint: 'ssr',
};

const withParams = (requests: StubRequest[]) =>
	requests.map((request) => [routeOf(request), Object.fromEntries(request.query)]);

const deferred = () => {
	let resolve = () => {};
	const promise = new Promise<void>((done) => (resolve = done));
	return { promise, resolve };
};

describe('a normal boot', () => {
	let server: TestServer;
	let boot: StubRequest[];

	beforeAll(async () => {
		server = await startServer();
		boot = [...server.stub.requests];
	});

	afterAll(() => server?.stop());

	test('the probes answer', async () => {
		const mediaType = (response: Response) => response.headers.get('content-type')?.split(';')[0];

		const alive = await server.fetch(`${API}/internal/isAlive`);
		expect([alive.status, mediaType(alive), await alive.text()]).toEqual([200, 'text/html', 'I am alive!']);

		const ready = await server.fetch(`${API}/internal/isReady`);
		expect([ready.status, mediaType(ready), await ready.json()]).toEqual([
			200,
			'application/json',
			{ message: 'I am ready!' },
		]);
	});

	test('loads the reference data with exactly these requests', async () => {
		expect(server.stub.unexpected).toEqual([]);
		await expect(requestLines(boot)).toMatchFileSnapshot('__goldens__/boot-requests.txt');
	});

	test('fetches each source once, then looks up the offices one at a time', () => {
		expect(countBy(boot, routeOf)).toEqual({
			[ROUTES.xp]: 1,
			[ROUTES.ssbClassification]: 1,
			[ROUTES.ssbVersion]: 1,
			[ROUTES.token]: 1,
			[ROUTES.bring]: 1,
			[ROUTES.geoid]: 393,
			[ROUTES.notFoundPage]: 1,
		});
	});

	test('looks up an office per bydel, and per kommune without bydeler', () => {
		const ids = boot.filter((request) => routeOf(request) === ROUTES.geoid).map(({ query }) => query.get('id'));

		// Oslo is looked up per bydel; SSB's "Uoppgitt" bydeler are skipped
		expect(ids).not.toContain('0301');
		expect(ids).toContain('030101');
		expect(ids).not.toContain('030199');
		// Svalbard (2100) as itself, and Jan Mayen (2211) as Svalbard
		expect(ids.filter((id) => id === '2100')).toHaveLength(2);
		expect(ids).not.toContain('2211');
		// The fixture register is from before 2024, when Tromsø was 5401
		expect(ids).toContain('5401');
		// Bug: the register's trailing newline becomes a row without kommunenr, looked up without an id
		expect(ids.filter((id) => id === null)).toHaveLength(1);
	});

	test('gets one client-credentials token from Azure and sends it base64-encoded to nav-office-search-api', () => {
		const [token] = boot.filter((request) => routeOf(request) === ROUTES.token);
		expect(token.headers['content-type']).toBe('application/x-www-form-urlencoded');
		expect(token.body).toBe(
			'grant_type=client_credentials&client_id=azure-client-id&client_secret=azure-client-secret&scope=api%3A%2F%2Fapi-client-id%2F.default',
		);

		const apiRequests = boot.filter(({ host }) => host === API_HOST);
		expect(new Set(apiRequests.map(({ headers }) => headers.authorization))).toEqual(new Set([AUTHORIZATION]));
	});

	test('asks for JSON from everything except bring and the 404 page', () => {
		const accepts = countBy(boot, (request) => `${routeOf(request)} accept: ${request.headers.accept}`);
		expect(Object.keys(accepts).sort()).toEqual(
			[
				`${ROUTES.xp} accept: application/json`,
				`${ROUTES.ssbClassification} accept: application/json`,
				`${ROUTES.ssbVersion} accept: application/json`,
				`${ROUTES.token} accept: application/json`,
				`${ROUTES.bring} accept: */*`,
				`${ROUTES.geoid} accept: application/json`,
				`${ROUTES.notFoundPage} accept: */*`,
			].sort(),
		);
	});

	test('fetches the decorator from www.nav.no for the first page', async () => {
		server.stub.reset();
		const page = await server.fetch(BASE);
		await page.text();

		expect(page.status).toBe(200);
		expect(withParams(server.stub.requests)).toEqual([
			['GET www.nav.no/dekoratoren/api/version', {}],
			['GET www.nav.no/dekoratoren/ssr', DECORATOR_PARAMS],
		]);
	});

	test('serves the nav.no 404 page it fetched at startup for unknown paths', async () => {
		const response = await server.fetch(`${BASE}/finnes-ikke`);
		expect([response.status, await response.text()]).toEqual([404, NOT_FOUND_HTML]);
	});
});

test("doesn't listen until the reference data has loaded, so the probes are refused meanwhile", async () => {
	const xpRequested = deferred();
	const xpReleased = deferred();
	const launched = await launchServer({
		overrides: [
			on(ROUTES.xp, async () => {
				xpRequested.resolve();
				await xpReleased.promise;
				return undefined;
			}),
		],
	});

	try {
		await xpRequested.promise;
		await expect(fetch(`${launched.origin}${API}/internal/isAlive`)).rejects.toThrow('fetch failed');
	} finally {
		xpReleased.resolve();
		await (await launched.ready).stop();
	}
});

describe('startup failures', () => {
	test.each([
		['XP fails', on(ROUTES.xp, () => json({ message: 'Internal Server Error' }, 500)), 'Failed to load office urls!'],
		['XP is unreachable', on(ROUTES.xp, () => Response.error()), 'Error loading office URLs: '],
		[
			'the SSB classification fails',
			on(ROUTES.ssbClassification, () => json({ error: 'Internal Server Error' }, 500)),
			'Failed to load bydeler from SSB and no previously cached data exists!',
		],
		[
			"SSB's current version fails",
			on(ROUTES.ssbVersion, () => json({ error: 'Internal Server Error' }, 500)),
			'Failed to load bydeler from SSB and no previously cached data exists!',
		],
		[
			'the postnummerregister fails',
			on(ROUTES.bring, () => new Response('', { status: 503 })),
			'Failed to fetch from postnr-register and no previously cached data exists!',
		],
	])('exits with code 1 when %s', async (_, override, message) => {
		const error = await startServer({ overrides: [override] }).then(
			() => new Error('started'),
			(e: Error) => e,
		);

		expect(error.message).toContain('exited with code 1 before it was ready');
		expect(error.message).toContain(message);
	});

	test('with nav-office-search-api down, it becomes ready without a single office (bug)', async () => {
		const server = await startServer({
			overrides: [({ host }) => (host === API_HOST ? json({ error: 'Internal server error' }, 500) : undefined)],
		});
		try {
			expect((await server.fetch(`${API}/internal/isReady`)).status).toBe(200);
			expect(await (await server.fetch(`${API}/data/kommuner`)).json()).toEqual([]);
			expect(await (await server.fetch(`${API}/data/bydeler`)).json()).toEqual([]);

			const poststeder = (await (await server.fetch(`${API}/data/poststeder`)).json()) as { officeInfo: unknown[] }[];
			expect(poststeder).toHaveLength(5137);
			expect(poststeder.filter(({ officeInfo }) => officeInfo.length > 0)).toEqual([]);
		} finally {
			await server.stop();
		}
	});

	test('with the token endpoint down, it asks for a token before every lookup and finds no offices (bug)', async () => {
		const server = await startServer({
			overrides: [on(ROUTES.token, () => json({ error: 'invalid_client' }, 401))],
		});
		try {
			const routes = countBy(server.stub.requests, routeOf);
			// A normal boot's 393 lookups, plus Oslo, Bergen, Stavanger and Trondheim: with every bydel failed, they
			// count as kommuner without bydeler
			expect(routes[ROUTES.token]).toBe(397);
			expect(routes[ROUTES.geoid]).toBeUndefined();
			expect(await (await server.fetch(`${API}/data/kommuner`)).json()).toEqual([]);
		} finally {
			await server.stop();
		}
	});

	test('without the nav.no 404 page, unknown paths get a plain "Not found"', async () => {
		const server = await startServer({ overrides: [on(ROUTES.notFoundPage, () => new Response('', { status: 503 }))] });
		try {
			const response = await server.fetch(`${BASE}/finnes-ikke`);
			expect([response.status, await response.text()]).toEqual([404, 'Not found']);
		} finally {
			await server.stop();
		}
	});
});

test('in NAIS, it fetches the decorator through service discovery and says which app is asking', async () => {
	const server = await startServer({
		env: { NAIS_CLUSTER_NAME: 'prod-gcp', NAIS_APP_NAME: 'nav-office-search', NAIS_NAMESPACE: 'navno' },
	});
	try {
		server.stub.reset();
		await (await server.fetch(BASE)).text();

		expect(withParams(server.stub.requests)).toEqual([
			['GET nav-dekoratoren.personbruker/api/version', {}],
			['GET nav-dekoratoren.personbruker/ssr', { ...DECORATOR_PARAMS, teamName: 'nav-office-search.navno' }],
		]);
	} finally {
		await server.stop();
	}
});

test('SIGTERM closes the server and exits with code 0', async () => {
	const server = await startServer();

	expect(await server.stop()).toEqual({ code: 0, signal: null });
	expect(server.output()).toContain('Server shutting down');
	expect(server.output()).toContain('Shutdown complete!');
});
