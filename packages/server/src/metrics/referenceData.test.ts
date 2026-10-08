import { describe, expect, test } from 'vitest';
import { type Kommune, type OfficeInfo, type Poststed, PostnrKategori } from '../../../common/types/data';
import type { PostnrRegisterItem } from '../data/postnrRegister';
import { kommunerWithoutOffice, poststederWithoutOffice } from './referenceData';

const tromso: OfficeInfo = { name: 'Nav Tromsø', enhetNr: '1902', geoId: '5501', url: '', hitString: '' };

const row = (postnr: string, kommunenr: string): PostnrRegisterItem => ({
	postnr,
	poststed: '',
	kommunenr,
	kommune: '',
	kategori: PostnrKategori.Gateadresser,
});

const kommune = (kommunenr: string, extra: Partial<Kommune> = {}): Kommune => ({
	kommunenr,
	kommuneNavn: '',
	kommuneNavnNormalized: '',
	...extra,
});

const poststed = (postnr: string, kommunenr: string, officeInfo: OfficeInfo[]): Poststed => ({
	postnr,
	poststed: '',
	poststedNormalized: '',
	kommuneNavn: '',
	kommunenr,
	kategori: PostnrKategori.Gateadresser,
	officeInfo,
});

describe('kommunerWithoutOffice', () => {
	test('lists register kommuner the load left out, like Svalbard and Jan Mayen before the fix', () => {
		const register = [
			row('9008', '5501'),
			row('9170', '2100'),
			row('9171', '2100'),
			row('8099', '2211'),
			row('0150', '0301'),
		];
		const loaded = [kommune('5501', { officeInfo: tromso }), kommune('0301', { bydeler: [] })];

		expect(kommunerWithoutOffice(register, loaded)).toEqual(['2100', '2211']);
	});

	test("ignores the register's phantom row without kommunenr", () => {
		const phantom = { postnr: '' } as unknown as PostnrRegisterItem;

		expect(kommunerWithoutOffice([row('9008', '5501'), phantom], [kommune('5501', { officeInfo: tromso })])).toEqual(
			[],
		);
	});
});

describe('poststederWithoutOffice', () => {
	test('lists poststeder without offices, except in kommuner with bydeler', () => {
		const poststeder = [
			poststed('9008', '5501', [tromso]),
			poststed('9170', '2100', []),
			poststed('0150', '0301', []),
			poststed('', undefined as unknown as string, []),
		];

		expect(poststederWithoutOffice(poststeder, (kommunenr) => kommunenr === '0301')).toEqual(['9170']);
	});
});
