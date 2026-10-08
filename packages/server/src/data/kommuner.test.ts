import { beforeEach, describe, expect, test, vi } from 'vitest';
import { PostnrKategori } from '../../../common/types/data';
import { fetchOfficeInfoByGeoId } from '../external/officeInfo';
import { fetchErrorResponse } from '../utils/fetch';
import { buildKommuneDictionary, getKommune } from './kommuner';
import { getPoststed, loadPoststederData } from './poststeder';
import type { PostnrRegisterItem } from './postnrRegister';

vi.mock('../external/officeInfo', () => ({ fetchOfficeInfoByGeoId: vi.fn() }));

// What nav-office-search-api's /geoid answers today (checked against dev on 2026-10-08):
// NORG maps Svalbard (2100) to Nav Tromsø, doesn't know Jan Mayen (2211), and Tromsø has been 5501 since 2024.
const norg: Record<string, { navn: string; enhetNr: string }> = {
	'2100': { navn: 'Nav Tromsø', enhetNr: '1902' },
	'5501': { navn: 'Nav Tromsø', enhetNr: '1902' },
};

const register: PostnrRegisterItem[] = [
	{
		postnr: '9170',
		poststed: 'LONGYEARBYEN',
		kommunenr: '2100',
		kommune: 'SVALBARD',
		kategori: PostnrKategori.Gateadresser,
	},
	{
		postnr: '8099',
		poststed: 'JAN MAYEN',
		kommunenr: '2211',
		kommune: 'JAN MAYEN',
		kategori: PostnrKategori.Gateadresser,
	},
	{ postnr: '9008', poststed: 'TROMSØ', kommunenr: '5501', kommune: 'TROMSØ', kategori: PostnrKategori.Gateadresser },
];

beforeEach(() => {
	vi.mocked(fetchOfficeInfoByGeoId).mockImplementation(async (geoId) => {
		const office = norg[geoId];
		return office
			? { name: office.navn, enhetNr: office.enhetNr, geoId, url: '', hitString: '' }
			: fetchErrorResponse(404, `No office info found for geoid ${geoId}`);
	});
	vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

describe.each([
	['2100', 'SVALBARD', '9170'],
	['2211', 'JAN MAYEN', '8099'],
	['5501', 'TROMSØ', '9008'],
])('kommune %s (%s)', (kommunenr, kommuneNavn, postnr) => {
	test('is served by Nav Tromsø', async () => {
		await buildKommuneDictionary(register);

		expect(getKommune(kommunenr)).toMatchObject({ kommuneNavn, officeInfo: { enhetNr: '1902', name: 'Nav Tromsø' } });
	});

	test(`postnr ${postnr} gets Nav Tromsø`, async () => {
		await buildKommuneDictionary(register);
		await loadPoststederData(register);

		expect((await getPoststed(postnr))?.officeInfo).toMatchObject([{ enhetNr: '1902', name: 'Nav Tromsø' }]);
	});
});
