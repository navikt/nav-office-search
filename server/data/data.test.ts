import { readFileSync } from 'node:fs';
import { logger } from '@navikt/navno-logger';
import type { Cron } from 'croner';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { env } from '#server/env.ts';
import { installUpstreams } from '#test/upstream/upstreams.ts';

const { upstreams, calls } = installUpstreams();

const GEOIDS = `${env.API_ORIGIN}/geoids`;
const XP = `${env.XP_ORIGIN}/_/service/no.nav.navno/officeInfo`;
const REGISTER = 'https://www.bring.no/postnummerregister-ansi.txt';

const fixture = (path: string) =>
	JSON.parse(readFileSync(new URL(`../../test/fixtures/upstream/${path}`, import.meta.url), 'utf-8'));

// A fresh server's data per test: nothing loaded, and fresh metrics
const fresh = async () => {
	vi.resetModules();
	return {
		...(await import('./data.ts')),
		geoid: await import('#server/api/endpoints/geoid/geoidSearchHandler.ts'),
		metrics: await import('#server/metrics/metrics.ts'),
	};
};

let server: Awaited<ReturnType<typeof fresh>>;

beforeEach(async () => {
	server = await fresh();
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

const logged = (level: 'info' | 'warn' | 'error') => vi.mocked(logger[level]).mock.calls;

// How many loads there have been, by outcome
const loads = async () =>
	Object.fromEntries((await server.metrics.dataLoads.get()).values.map(({ labels, value }) => [labels.outcome, value]));

const xpRequests = () => calls().filter(({ url }) => url.startsWith(XP));

const sizes = () => {
	const { offices, bydeler, kommuner, poststeder } = server.referenceData();
	return { offices: offices.size, bydeler: bydeler.length, kommuner: kommuner.length, poststeder: poststeder.size };
};

// What the fixtures hold
const LOADED = { offices: 389, bydeler: 37, kommuner: 357, poststeder: 5136 };

describe('a first load', () => {
	test('of what the fixtures have logs no errors, and one warning per dataset with areas without an office', async () => {
		vi.spyOn(logger, 'warn');
		vi.spyOn(logger, 'error');

		await server.loadData();

		expect(sizes()).toEqual(LOADED);
		expect(logged('error')).toEqual([]);
		expect(logged('warn')).toEqual([
			['No office found', { dataset: 'kommuner', count: 1, numbers: [expect.any(String)] }],
			['No office found', { dataset: 'poststeder', count: 2, numbers: [expect.any(String), expect.any(String)] }],
			['No office found', { dataset: 'bydeler', count: 1, numbers: [expect.any(String)] }],
		]);
		expect(await loads()).toEqual({ success: 1 });
	});

	test('records the size of each dataset, and how many areas have no office', async () => {
		await server.loadData();

		const byDataset = async (gauge: 'referenceDataEntries' | 'referenceDataWithoutOffice') =>
			Object.fromEntries(
				(await server.metrics[gauge].get()).values.map(({ labels, value }) => [labels.dataset, value]),
			);
		expect(await byDataset('referenceDataEntries')).toEqual({
			office_urls: 425,
			offices: 389,
			bydeler: 37,
			postnr_register: 5136,
			kommuner: 357,
			poststeder: 5136,
		});
		expect(await byDataset('referenceDataWithoutOffice')).toEqual({ kommuner: 1, poststeder: 2, bydeler: 1 });
	});

	test('asks nav-office-search-api for every office at once', async () => {
		await server.loadData();

		const api = calls().filter(({ url }) => url.startsWith(env.API_ORIGIN));
		expect(api.map(({ method, url }) => `${method} ${url}`)).toEqual([`GET ${GEOIDS}`]);
	});

	test.each([
		['bring fails', REGISTER, { status: 503 }, 'the postnr register from bring'],
		[
			'nav-office-search-api has no offices yet',
			GEOIDS,
			{ status: 503, json: { error: 'Office data is not loaded' } },
			'offices from nav-office-search-api',
		],
		[
			'nav-office-search-api fails',
			GEOIDS,
			{ status: 500, json: { error: 'Internal server error' } },
			'offices from nav-office-search-api',
		],
	] as const)('fails when %s, and says which source', async (_, url, reply, source) => {
		upstreams.get(url, reply);

		await expect(server.loadData()).rejects.toMatchObject({
			message: `Failed to load ${source}`,
			cause: expect.objectContaining({ status: reply.status }),
		});
		expect(() => server.referenceData()).toThrow('The reference data is not loaded');
		expect(await loads()).toEqual({ failure: 1 });
	});

	test.each([
		[
			'bring answers with something else',
			REGISTER,
			{ text: '<!doctype html><h1>Vedlikehold</h1>' },
			'poststeder',
			2500,
		],
		['XP has no offices', XP, { json: { offices: [] } }, 'offices', 200],
		['nav-office-search-api has no offices', GEOIDS, { json: {} }, 'offices', 200],
	] as const)('fails when %s, with the size and the floor', async (_, url, reply, dataset, floor) => {
		upstreams.get(url, reply);

		await expect(server.loadData()).rejects.toMatchObject({
			message: `Too little reference data: ${dataset}`,
			dataset,
			size: 0,
			floor,
		});
		expect(() => server.referenceData()).toThrow('The reference data is not loaded');
		expect(await loads()).toEqual({ failure: 1 });
	});

	test('leaves the areas of an office without a page on nav.no without an office, and logs the office', async () => {
		vi.spyOn(logger, 'error');
		const { offices }: { offices: { enhetNr: string }[] } = fixture('xp/office-info.json');
		// Nav Gamle Oslo, the office of bydel 030101
		upstreams.get(XP, { json: { offices: offices.filter(({ enhetNr }) => enhetNr !== '0316') } });

		await server.loadData();

		expect(server.referenceData().offices.has('030101')).toBe(false);
		expect(await server.geoid.geoidSearchHandler('030101')).toEqual({
			status: 404,
			body: { type: 'error', messageId: 'errorServerError' },
		});
		expect(logged('error')).toEqual([['Offices without a page in XP', { count: 1, enhetNr: ['0316'] }]]);
	});
});

describe('a refresh', () => {
	beforeEach(async () => {
		await server.loadData();
	});

	test('that fails keeps the data in use, and leaves the time of the last success', async () => {
		const inUse = server.referenceData();
		const lastSuccess = (await server.metrics.dataLastSuccess.get()).values[0].value;
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(Date.now() + 86_400_000);
		upstreams.get(REGISTER, { status: 503 });

		await expect(server.loadData()).rejects.toThrow('Failed to load the postnr register from bring');

		expect(server.referenceData()).toBe(inUse);
		expect(await loads()).toEqual({ success: 1, failure: 1 });
		expect((await server.metrics.dataLastSuccess.get()).values[0].value).toBe(lastSuccess);
	});

	test('that gets too little keeps the data in use', async () => {
		const inUse = server.referenceData();
		upstreams.get(XP, { json: { offices: [] } });

		await expect(server.loadData()).rejects.toThrow('Too little reference data: offices');

		expect(server.referenceData()).toBe(inUse);
		expect(sizes()).toEqual(LOADED);
	});

	// However many fewer than in use: a refresh is checked against the floors only, like a first load
	test('takes fewer offices, and the kommuner without them, as when kommuner merge', async () => {
		const norg: Record<string, unknown> = fixture('office-search-api/geoids.json');
		// Svalbard's office also serves Jan Mayen, so it stays: each kommunenr gone takes one kommune away
		const kommunenumre = Object.keys(norg).filter((geoId) => geoId.length === 4 && geoId !== '2100');
		const gone = new Set(kommunenumre.slice(0, 40));
		upstreams.get(GEOIDS, { json: Object.fromEntries(Object.entries(norg).filter(([geoId]) => !gone.has(geoId))) });

		await server.loadData();

		expect(sizes()).toEqual({ ...LOADED, offices: 349, kommuner: 317 });
		expect(await loads()).toEqual({ success: 2 });
	});
});

describe('the daily refresh', () => {
	let job: Cron | undefined;

	afterEach(() => {
		job?.stop();
		vi.unstubAllEnvs();
	});

	test("runs at 06:00 UTC, in summer as in winter, whatever the machine's time zone", () => {
		vi.stubEnv('TZ', 'Europe/Oslo');
		job = server.scheduleRefresh();

		expect(job.nextRun(new Date('2026-11-14T05:59:59Z'))).toEqual(new Date('2026-11-14T06:00:00Z'));
		expect(job.nextRun(new Date('2026-11-14T06:00:00Z'))).toEqual(new Date('2026-11-15T06:00:00Z'));
		expect(job.nextRun(new Date('2026-07-01T05:00:00Z'))).toEqual(new Date('2026-07-01T06:00:00Z'));
	});

	test('loads the data then', async () => {
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
		vi.setSystemTime(new Date('2026-11-14T05:59:59Z'));
		job = server.scheduleRefresh();

		await vi.advanceTimersByTimeAsync(999);
		expect(calls()).toEqual([]);

		await vi.advanceTimersByTimeAsync(1);
		vi.useRealTimers();
		await vi.waitFor(() => expect(sizes()).toEqual(LOADED));
		expect(xpRequests()).toHaveLength(1);
	});

	test('logs a refresh that fails, and keeps to the schedule', async () => {
		vi.spyOn(logger, 'error');
		upstreams.get(REGISTER, { status: 503 });
		job = server.scheduleRefresh();

		await job.trigger();

		expect(logged('error')).toEqual([
			['Refreshing data failed', expect.objectContaining({ message: 'Failed to load the postnr register from bring' })],
		]);
		expect(job.isRunning()).toBe(true);
	});
});
