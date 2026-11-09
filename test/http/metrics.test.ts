import { afterAll, beforeAll, expect, test } from 'vitest';
import { API, BASE, startServer, type TestServer } from './harness.ts';
import { on } from './stub.ts';
import { json, ROUTES } from './upstreams.ts';

// One server for the whole file: the counts below build on each other, in test order
let server: TestServer;

beforeAll(async () => {
	server = await startServer();
});

afterAll(() => server?.stop());

const PREFIX = 'nav_office_search_';

const scrape = async () => (await server.fetch(`${API}/internal/metrics`)).text();

/** One metric's samples, named without the prefix, e.g. { 'data_loads_total{outcome="success"}': 1 } */
const samples = (text: string, metric: string) =>
	Object.fromEntries(
		text
			.split('\n')
			.filter((line) => line.startsWith(`${PREFIX}${metric}{`) || line.startsWith(`${PREFIX}${metric} `))
			.map((line) => {
				const space = line.lastIndexOf(' ');
				return [line.slice(PREFIX.length, space), Number(line.slice(space + 1))];
			}),
	);

const visit = async (path: string) => {
	await (await server.fetch(path)).text();
};

test('serves the app metrics and the Node.js defaults as Prometheus text', async () => {
	const response = await server.fetch(`${API}/internal/metrics`);
	const text = await response.text();

	expect(response.status).toBe(200);
	// The exact header is in framework-defaults.test.ts
	expect(response.headers.get('content-type')).toMatch(/^text\/plain;.*\bversion=0\.0\.4\b/);
	expect(text.split('\n').filter((line) => line.startsWith(`# TYPE ${PREFIX}`))).toEqual([
		'# TYPE nav_office_search_search_requests_total counter',
		'# TYPE nav_office_search_search_request_duration_seconds histogram',
		'# TYPE nav_office_search_upstream_requests_total counter',
		'# TYPE nav_office_search_upstream_request_duration_seconds histogram',
		'# TYPE nav_office_search_page_renders_total counter',
		'# TYPE nav_office_search_data_loads_total counter',
		'# TYPE nav_office_search_data_load_duration_seconds gauge',
		'# TYPE nav_office_search_data_last_success_timestamp_seconds gauge',
		'# TYPE nav_office_search_reference_data_entries gauge',
		'# TYPE nav_office_search_reference_data_without_office gauge',
	]);
	expect(text).toMatch(/^nodejs_eventloop_lag_seconds /m);
	expect(text).toMatch(/^process_cpu_seconds_total /m);
});

test('counts the startup data load, what it found and the requests it made', async () => {
	const text = await scrape();

	expect(samples(text, 'data_loads_total')).toEqual({ 'data_loads_total{outcome="success"}': 1 });
	expect(samples(text, 'data_load_duration_seconds').data_load_duration_seconds).toBeGreaterThan(0);
	expect(
		Date.now() / 1000 - samples(text, 'data_last_success_timestamp_seconds').data_last_success_timestamp_seconds,
	).toBeLessThan(60);
	expect(samples(text, 'reference_data_entries')).toEqual({
		// Including the register's empty last row (bug)
		'reference_data_entries{dataset="postnr_register"}': 5137,
		'reference_data_entries{dataset="kommuner"}': 357,
		'reference_data_entries{dataset="poststeder"}': 5137,
		'reference_data_entries{dataset="bydeler"}': 37,
		'reference_data_entries{dataset="office_urls"}': 425,
	});
	expect(samples(text, 'reference_data_without_office')).toEqual({
		'reference_data_without_office{dataset="kommuner"}': 1,
		'reference_data_without_office{dataset="poststeder"}': 2,
		'reference_data_without_office{dataset="bydeler"}': 1,
	});
	expect(samples(text, 'upstream_requests_total')).toEqual({
		'upstream_requests_total{upstream="xp",status="2xx"}': 1,
		'upstream_requests_total{upstream="ssb",status="2xx"}': 2,
		'upstream_requests_total{upstream="azure-token",status="2xx"}': 1,
		'upstream_requests_total{upstream="office-search-api/geoid",status="2xx"}': 390,
		// Two ids without an office, and the register's empty last row
		'upstream_requests_total{upstream="office-search-api/geoid",status="4xx"}': 3,
		'upstream_requests_total{upstream="bring",status="2xx"}': 1,
	});
});

test('counts and times each search by route and outcome, and the upstream requests they made', async () => {
	await visit(`${API}/search?query=4737`);
	await visit(`${API}/search?query=1001`);
	await visit(`${API}/search?query=0000`);
	await visit(`${API}/search/name?query=oslo`);
	await visit(`${API}/search/name?query=xyzzy`);
	await visit(`${API}/search/address?query=storgata%201`);
	await visit(`${API}/geoid?id=030101`);
	await visit(`${API}/geoid`);
	server.stub.override(on(ROUTES.adresse, () => json({ error: 'PDL is down' }, 503)));
	await visit(`${API}/search/address?query=storgata%201`);

	const text = await scrape();

	expect(samples(text, 'search_requests_total')).toEqual({
		'search_requests_total{route="search",outcome="hits"}': 1,
		'search_requests_total{route="search",outcome="empty"}': 1,
		'search_requests_total{route="search",outcome="invalid"}': 1,
		'search_requests_total{route="search/name",outcome="hits"}': 1,
		'search_requests_total{route="search/name",outcome="empty"}': 1,
		'search_requests_total{route="search/address",outcome="hits"}': 1,
		'search_requests_total{route="search/address",outcome="error"}': 1,
		'search_requests_total{route="geoid",outcome="hits"}': 1,
		'search_requests_total{route="geoid",outcome="invalid"}': 1,
	});
	expect(samples(text, 'search_request_duration_seconds_count')).toEqual({
		'search_request_duration_seconds_count{route="search"}': 3,
		'search_request_duration_seconds_count{route="search/name"}': 2,
		'search_request_duration_seconds_count{route="search/address"}': 2,
		'search_request_duration_seconds_count{route="geoid"}': 2,
	});
	expect(samples(text, 'upstream_requests_total')).toMatchObject({
		'upstream_requests_total{upstream="office-search-api/geoid",status="2xx"}': 391,
		'upstream_requests_total{upstream="office-search-api/bydel",status="2xx"}': 1,
		'upstream_requests_total{upstream="office-search-api/adresse",status="2xx"}': 1,
		'upstream_requests_total{upstream="office-search-api/adresse",status="5xx"}': 1,
	});
});

test('counts login status checks as login-session requests, not as searches', async () => {
	const before = await scrape();
	await visit(`${API}/loginstatus`);
	const after = await scrape();

	expect(samples(after, 'upstream_requests_total')).toMatchObject({
		'upstream_requests_total{upstream="login-session",status="4xx"}': 1,
	});
	expect(samples(after, 'search_requests_total')).toEqual(samples(before, 'search_requests_total'));
});

test('counts page renders by locale, but not the ones served from the page cache', async () => {
	await visit(BASE);
	await visit(BASE);
	await visit(`${BASE}/nn`);

	expect(samples(await scrape(), 'page_renders_total')).toEqual({
		'page_renders_total{locale="nb",outcome="ssr"}': 1,
		'page_renders_total{locale="nn",outcome="ssr"}': 1,
	});
});

test('the page cache holds a page per locale, whatever the query string says', async () => {
	await visit(`${BASE}/en`);
	await visit(BASE);
	await visit(`${BASE}/nn`);
	await visit(`${BASE}/en`);
	await visit(`${BASE}/en?query=string`);

	expect(samples(await scrape(), 'page_renders_total')).toEqual({
		'page_renders_total{locale="nb",outcome="ssr"}': 1,
		'page_renders_total{locale="nn",outcome="ssr"}': 1,
		'page_renders_total{locale="en",outcome="ssr"}': 1,
	});
});
