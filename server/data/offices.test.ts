import { isHttpError, isTimeoutError } from '@itsy/corgi';
import { networkError } from '@itsy/corgi/testing';
import { isValidationError } from '@itsy/corgi/schema';
import { logger } from '@navikt/navno-logger';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { env } from '#server/env.ts';
import { installUpstreams } from '#test/upstream/upstreams.ts';
import {
	fetchNorgOffices,
	fetchOfficePaths,
	isGeoId,
	joinOffices,
	type NorgOffices,
	type OfficePaths,
} from './offices.ts';

const { upstreams, calls } = installUpstreams();

const GEOIDS = `${env.API_ORIGIN}/geoids`;

// The access token, base64-encoded. nav-office-search-api never checks it.
const AUTHORIZATION = 'Bearer YXp1cmUtdG9rZW4=';

const geoidsRequests = () => calls().filter(({ url }) => url === GEOIDS);

// The offices' pages, as a load has them
let officePaths: OfficePaths;

beforeAll(async () => {
	officePaths = await fetchOfficePaths();
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
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

describe('fetchOfficePaths', () => {
	test("gives each office's path on nav.no, by enhetNr", () => {
		expect(officePaths.size).toBe(425);
		expect(officePaths.get('0316')).toBe('/kontor/nav-gamle-oslo');
	});
});

describe('fetchNorgOffices', () => {
	test("gives the office NORG has for each kommune and bydel, in one request with Azure AD's token", async () => {
		const offices = await fetchNorgOffices();

		expect(Object.keys(offices)).toHaveLength(389);
		expect(offices['030101']).toEqual({ enhetNr: '0316', navn: 'Nav Gamle Oslo' });
		expect(offices['2100']).toEqual({ enhetNr: '1902', navn: 'Nav Tromsø' });
		expect(geoidsRequests().map(({ headers }) => headers.authorization)).toEqual([AUTHORIZATION]);
	});

	test('throws while nav-office-search-api has no offices yet', async () => {
		upstreams.get(GEOIDS, { status: 503, json: { error: 'Office data is not loaded' } });

		await expect(fetchNorgOffices()).rejects.toSatisfy((e) => isHttpError(e) && e.status === 503);
	});

	test('throws when nav-office-search-api fails', async () => {
		upstreams.get(GEOIDS, { status: 500, json: { error: 'Internal server error' } });

		await expect(fetchNorgOffices()).rejects.toSatisfy(isHttpError);
	});

	test('throws when nav-office-search-api is unreachable', async () => {
		upstreams.get(GEOIDS, networkError());

		await expect(fetchNorgOffices()).rejects.toThrow('fetch failed');
	});

	test('gives nav-office-search-api 30 s, as for the other reference data', async () => {
		vi.useFakeTimers();
		upstreams.get(GEOIDS, { hang: true });
		let settled = false;

		const failure = fetchNorgOffices()
			.catch((e: unknown) => e)
			.finally(() => {
				settled = true;
			});
		await vi.advanceTimersByTimeAsync(29_999);
		expect(settled).toBe(false);
		await vi.advanceTimersByTimeAsync(1);

		expect(isTimeoutError(await failure)).toBe(true);
	});

	test("throws when the answer isn't offices", async () => {
		upstreams.get(GEOIDS, { json: { '0301': { enhetNr: 315, navn: 'Nav Grünerløkka' } } });

		await expect(fetchNorgOffices()).rejects.toSatisfy(isValidationError);
	});

	test("throws without a token from Azure AD, and doesn't ask", async () => {
		// One that hasn't got a token yet
		vi.resetModules();
		const { fetchNorgOffices: withoutToken } = await import('./offices.ts');
		upstreams.post(env.AZURE_OPENID_CONFIG_TOKEN_ENDPOINT, { status: 503 });

		await expect(withoutToken()).rejects.toThrow('No token for nav-office-search-api');
		expect(geoidsRequests()).toEqual([]);
	});
});

describe('joinOffices', () => {
	const gamleOslo = { enhetNr: '0316', navn: 'Nav Gamle Oslo' };
	const norgOffices: NorgOffices = {
		'030101': gamleOslo,
		'030102': { enhetNr: '9998', navn: 'Nav Ny' },
		'030103': { enhetNr: '9999', navn: 'Nav Ukjent' },
		'030104': { enhetNr: '9999', navn: 'Nav Ukjent' },
	};

	test('gives the office of an area, with its page on nav.no', () => {
		const offices = joinOffices({ '030101': gamleOslo }, officePaths);

		expect([...offices]).toEqual([
			[
				'030101',
				{
					name: 'Nav Gamle Oslo',
					url: `${env.NAVNO_ORIGIN}/kontor/nav-gamle-oslo`,
					geoId: '030101',
					enhetNr: '0316',
					hitString: '',
				},
			],
		]);
	});

	test.each(['2211', '030199', '', 'constructor', '__proto__'])(
		'finds nothing for %j, which has no office',
		(geoId) => {
			expect(joinOffices(norgOffices, officePaths).get(geoId)).toBeUndefined();
		},
	);

	test('leaves out an office without a page in XP, so its areas have no office, and logs those offices once', () => {
		const error = vi.spyOn(logger, 'error');

		const offices = joinOffices(norgOffices, officePaths);

		expect([...offices.keys()]).toEqual(['030101']);
		expect(error.mock.calls).toEqual([['Offices without a page in XP', { count: 2, enhetNr: ['9998', '9999'] }]]);
	});

	test('logs nothing when every office has a page', () => {
		const error = vi.spyOn(logger, 'error');

		joinOffices({ '030101': gamleOslo }, officePaths);

		expect(error).not.toHaveBeenCalled();
	});
});
