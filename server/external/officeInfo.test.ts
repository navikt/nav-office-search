import { isHttpError } from '@itsy/corgi';
import { networkError } from '@itsy/corgi/testing';
import { logger } from '@navikt/navno-logger';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { fetchOfficePaths, type OfficePaths } from '#server/data/officeUrls.ts';
import { env } from '#server/env.ts';
import { installUpstreams } from '#test/upstream/upstreams.ts';
import { fetchOfficeInfoByGeoId, isGeoId, officeLookups } from './officeInfo.ts';

const { upstreams, calls } = installUpstreams();

const GEOID = `${env.API_ORIGIN}/geoid`;

const geoidRequests = () => calls().filter(({ path }) => path === '/geoid');

// The offices' pages, as a load has them
let officePaths: OfficePaths;

beforeAll(async () => {
	// The offices' pages
	officePaths = await fetchOfficePaths();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('isGeoId', () => {
	test.each(['0301', '030101', '5501', '460102'])('%j is a kommunenr or bydelsnr', (id) => {
		expect(isGeoId(id)).toBe(true);
	});

	test.each(['', '030', '03010', '0301010', '0301a', ' 0301', '0301 ', 'constructor', '__proto__', '+0301', '٠٣٠١'])(
		'%j is not',
		(id) => {
			expect(isGeoId(id)).toBe(false);
		},
	);
});

describe('fetchOfficeInfoByGeoId', () => {
	test('gives the office NORG has for the area, with its page on nav.no', async () => {
		expect(await fetchOfficeInfoByGeoId('030101', officePaths)).toEqual({
			name: 'Nav Gamle Oslo',
			url: `${env.NAVNO_ORIGIN}/kontor/nav-gamle-oslo`,
			geoId: '030101',
			enhetNr: '0316',
			hitString: '',
		});
	});

	test('gives null for an area NORG has no office for', async () => {
		expect(await fetchOfficeInfoByGeoId('2211', officePaths)).toBeNull();
		expect(geoidRequests()).toHaveLength(1);
	});

	test.each(['', 'undefined', 'constructor'])('gives null for the id %j, without asking', async (id) => {
		expect(await fetchOfficeInfoByGeoId(id, officePaths)).toBeNull();
		expect(calls()).toEqual([]);
	});

	test('throws when nav-office-search-api fails', async () => {
		upstreams.get(GEOID, { json: { error: 'Internal server error' }, status: 500 });

		await expect(fetchOfficeInfoByGeoId('030101', officePaths)).rejects.toSatisfy(isHttpError);
	});

	test('throws when nav-office-search-api is unreachable', async () => {
		upstreams.get(GEOID, networkError());

		await expect(fetchOfficeInfoByGeoId('030101', officePaths)).rejects.toThrow('fetch failed');
	});

	test("throws when nav-office-search-api's answer has no office", async () => {
		upstreams.get(GEOID, { json: { message: 'ok' } });

		await expect(fetchOfficeInfoByGeoId('030101', officePaths)).rejects.toThrow('expected string');
	});

	test("throws without a token from Azure AD, and doesn't ask", async () => {
		// One that hasn't got a token yet
		vi.resetModules();
		const { fetchOfficeInfoByGeoId: withoutToken } = await import('./officeInfo.ts');
		upstreams.post(env.AZURE_OPENID_CONFIG_TOKEN_ENDPOINT, { status: 503 });

		await expect(withoutToken('030101', officePaths)).rejects.toThrow('No token for nav-office-search-api');
		expect(geoidRequests()).toEqual([]);
	});

	test('throws for an office without a page in XP', async () => {
		upstreams.get(GEOID, { json: { enhetNr: '9999', navn: 'Nav Ukjent' } });

		await expect(fetchOfficeInfoByGeoId('030101', officePaths)).rejects.toMatchObject({
			message: 'No page in XP for the office',
			enhetNr: '9999',
		});
	});
});

describe('officeLookups', () => {
	test('leaves an area whose lookup failed without an office, and logs the failures once', async () => {
		const error = vi.spyOn(logger, 'error');
		upstreams.get(GEOID, ({ query }) => (query.get('id') === '030101' ? { status: 503 } : networkError()));
		const offices = officeLookups('bydeler', officePaths);

		expect(await offices.find('030101')).toBeNull();
		expect(await offices.find('030102')).toBeNull();
		expect(error).not.toHaveBeenCalled();

		offices.logFailures();
		expect(error.mock.calls).toEqual([
			['Looking up offices failed', { dataset: 'bydeler', failed: 2 }, { status: 503 }],
		]);
	});

	test('logs nothing for areas without an office', async () => {
		const error = vi.spyOn(logger, 'error');
		const offices = officeLookups('kommuner', officePaths);

		expect(await offices.find('2211')).toBeNull();
		expect(await offices.find('4219')).not.toBeNull();
		offices.logFailures();

		expect(error).not.toHaveBeenCalled();
	});
});
