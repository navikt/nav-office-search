import { logger } from '@navikt/navno-logger';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { env } from '#server/env.ts';
import { installUpstreams } from '#test/upstream/upstreams.ts';

const { upstreams, calls } = installUpstreams();

// A fresh load per test, without data from the one before
let loadData: () => Promise<void>;

beforeEach(async () => {
	vi.resetModules();
	({ loadData } = await import('./data.ts'));
});

afterEach(() => {
	vi.restoreAllMocks();
});

const logged = (level: 'warn' | 'error') => vi.mocked(logger[level]).mock.calls;

test('a load of what the fixtures have logs no errors, and one warning per dataset with areas without an office', async () => {
	vi.spyOn(logger, 'warn');
	vi.spyOn(logger, 'error');

	await loadData();

	expect(logged('error')).toEqual([]);
	expect(logged('warn')).toEqual([
		['No office found', { dataset: 'kommuner', count: 1, numbers: [expect.any(String)] }],
		['No office found', { dataset: 'poststeder', count: 2, numbers: [expect.any(String), expect.any(String)] }],
		['No office found', { dataset: 'bydeler', count: 1, numbers: [expect.any(String)] }],
	]);
});

test("the register's last line break makes a row without a kommunenr (bug), which isn't looked up", async () => {
	await loadData();

	const geoids = calls().filter(({ path }) => path === '/geoid');
	expect(geoids.length).toBeGreaterThan(300);
	expect(geoids.filter(({ query }) => !query.get('id'))).toEqual([]);
});

test('with nav-office-search-api failing, logs one error per dataset, not one per lookup', async () => {
	vi.spyOn(logger, 'error');
	upstreams.get(`${env.API_ORIGIN}/geoid`, { status: 500 });

	await loadData();

	expect(logged('error')).toEqual([
		['Looking up offices failed', { dataset: 'bydeler', failed: 38 }, { status: 500 }],
		// Oslo, Bergen, Stavanger and Trondheim too: without a single bydel, they count as kommuner without bydeler
		['Looking up offices failed', { dataset: 'kommuner', failed: 358 }, { status: 500 }],
	]);
});
