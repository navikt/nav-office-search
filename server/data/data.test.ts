import { readFileSync } from 'node:fs';
import { logger } from '@navikt/navno-logger';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { env } from '#server/env.ts';
import { installUpstreams } from '#test/upstream/upstreams.ts';

const { upstreams, calls } = installUpstreams();

const GEOID = `${env.API_ORIGIN}/geoid`;
const XP = `${env.XP_ORIGIN}/_/service/no.nav.navno/officeInfo`;
const REGISTER = 'https://www.bring.no/postnummerregister-ansi.txt';

const fixture = (path: string) =>
	JSON.parse(readFileSync(new URL(`../../test/fixtures/upstream/${path}`, import.meta.url), 'utf-8'));

// A fresh server's data per test: nothing loaded, and fresh metrics
const fresh = async () => {
	vi.resetModules();
	return {
		...(await import('./data.ts')),
		kommuner: await import('./kommuner.ts'),
		bydeler: await import('./bydeler.ts'),
		officeUrls: await import('./officeUrls.ts'),
		register: await import('./postnrRegister.ts'),
		metrics: await import('#server/metrics/metrics.ts'),
	};
};

let server: Awaited<ReturnType<typeof fresh>>;

beforeEach(async () => {
	server = await fresh();
});

afterEach(() => {
	vi.restoreAllMocks();
});

const logged = (level: 'info' | 'warn' | 'error') => vi.mocked(logger[level]).mock.calls;

// What a counter has counted, without the series that are still 0
const counted = async (counter: 'dataRejections' | 'dataLoads') =>
	(await server.metrics[counter].get()).values
		.filter(({ value }) => value > 0)
		.map(({ labels, value }) => ({ ...labels, value }));

const sizes = () => ({
	officeUrls: server.officeUrls.getOfficeUrlCount(),
	bydeler: server.bydeler.getBydelerArray().length,
	register: server.register.getPostnrRegister().length,
	kommuner: server.kommuner.getKommunerArray().length,
});

// What the fixtures hold
const LOADED = { officeUrls: 425, bydeler: 37, register: 5136, kommuner: 357 };

test('counts no refusals from the start, per dataset', async () => {
	expect(
		(await server.metrics.dataRejections.get()).values.map(({ labels, value }) => [labels.dataset, value]),
	).toEqual([
		['office_urls', 0],
		['bydeler', 0],
		['postnr_register', 0],
		['kommuner', 0],
	]);
});

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
		expect(await counted('dataLoads')).toEqual([{ outcome: 'success', value: 1 }]);
	});

	test('looks offices up by kommunenr and bydelsnr only', async () => {
		await server.loadData();

		const geoids = calls().filter(({ path }) => path === '/geoid');
		expect(geoids.length).toBeGreaterThan(300);
		expect(geoids.filter(({ query }) => !query.get('id'))).toEqual([]);
	});

	test('fails when a source fails, with nothing to keep', async () => {
		upstreams.get(REGISTER, { status: 503 });

		await expect(server.loadData()).rejects.toMatchObject({
			message: 'Failed to load the postnr register from bring',
			cause: expect.objectContaining({ status: 503 }),
		});
		expect(await counted('dataLoads')).toEqual([{ outcome: 'failure', value: 1 }]);
	});

	test.each([
		['bring answers with something else', REGISTER, { text: '<!doctype html><h1>Vedlikehold</h1>' }, 'postnr_register'],
		['XP has no offices', XP, { json: { offices: [] } }, 'office_urls'],
	] as const)('fails when %s, with the sizes', async (_, url, reply, dataset) => {
		upstreams.get(url, reply);

		await expect(server.loadData()).rejects.toMatchObject({
			message: expect.stringMatching(/^Too little reference data to start with: /),
			dataset,
			size: 0,
			current: 0,
		});
		expect(await counted('dataRejections')).toEqual([{ dataset, value: 1 }]);
	});

	test('fails without offices when nav-office-search-api fails, after one error for all the lookups', async () => {
		vi.spyOn(logger, 'error');
		upstreams.get(GEOID, { status: 500 });

		await expect(server.loadData()).rejects.toMatchObject({ dataset: 'bydeler', size: 0, floor: 15 });
		expect(logged('error')).toEqual([
			['Looking up offices failed', { dataset: 'bydeler', failed: 38 }, { status: 500 }],
		]);
	});
});

describe('a refresh', () => {
	beforeEach(async () => {
		await server.loadData();
		vi.spyOn(logger, 'error');
	});

	test('keeps the kommuner and bydeler it has when every office lookup fails, and counts that', async () => {
		const kommuner = server.kommuner.getKommunerArray();
		upstreams.get(GEOID, { status: 500 });

		await server.loadData();

		expect(sizes()).toEqual(LOADED);
		expect(server.kommuner.getKommunerArray()).toBe(kommuner);
		expect(logged('error')).toContainEqual([
			'Refused new reference data - keeping current data',
			{ dataset: 'kommuner', size: 4, current: 357, floor: 150 },
		]);
		expect(await counted('dataRejections')).toEqual([
			{ dataset: 'bydeler', value: 1 },
			{ dataset: 'kommuner', value: 1 },
		]);
	});

	test('keeps what it has when a source fails, and logs which', async () => {
		upstreams.get(REGISTER, { status: 503 });

		await server.loadData();

		expect(sizes()).toEqual(LOADED);
		expect(logged('error')).toEqual([
			['Failed to load reference data - keeping current data', { dataset: 'postnr_register' }, { status: 503 }],
		]);
	});

	describe('of the office URLs', () => {
		type Office = { enhetNr: string };
		// Offices that no kommune or bydel in the fixtures is served by, so the lookups don't notice them gone
		const norg: Record<string, Office> = fixture('office-search-api/geoid.json');
		const inUse = new Set(Object.values(norg).map(({ enhetNr }) => enhetNr));
		const { offices }: { offices: Office[] } = fixture('xp/office-info.json');
		const unused = offices.map(({ enhetNr }) => enhetNr).filter((enhetNr) => !inUse.has(enhetNr));
		const without = (count: number) => {
			const gone = new Set(unused.slice(0, count));
			return { json: { offices: offices.filter(({ enhetNr }) => !gone.has(enhetNr)) } };
		};

		test('has enough offices nobody uses to test with', () => {
			expect(unused.length).toBeGreaterThanOrEqual(50);
		});

		test('takes up to 10 % fewer', async () => {
			upstreams.get(XP, without(40));

			await server.loadData();

			expect(server.officeUrls.getOfficeUrlCount()).toBe(385);
			expect(await counted('dataRejections')).toEqual([]);
		});

		test('refuses more than 10 % fewer', async () => {
			upstreams.get(XP, without(50));

			await server.loadData();

			expect(server.officeUrls.getOfficeUrlCount()).toBe(425);
			expect(await counted('dataRejections')).toEqual([{ dataset: 'office_urls', value: 1 }]);
		});
	});

	test('that keeps some data counts as partial, and leaves the time of the last success', async () => {
		const lastSuccess = (await server.metrics.dataLastSuccess.get()).values[0].value;
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(Date.now() + 86_400_000);
		upstreams.get(REGISTER, { status: 503 });

		await server.loadData();
		vi.useRealTimers();

		expect(await counted('dataLoads')).toEqual([
			{ outcome: 'success', value: 1 },
			{ outcome: 'partial', value: 1 },
		]);
		expect((await server.metrics.dataLastSuccess.get()).values[0].value).toBe(lastSuccess);
	});
});
