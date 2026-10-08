import type { LocaleStringId } from '../../../../common/localization/types';
import { type OfficeInfo, PostnrKategori } from '../../../../common/types/data';
import type {
	Adresse,
	NameHit,
	SearchResultAdresseProps,
	SearchResultErrorProps,
	SearchResultNameProps,
	SearchResultPostnrProps,
} from '../../../../common/types/results';

const office = (name: string, enhetNr: string, geoId: string, hitString = ''): OfficeInfo => ({
	name,
	url: `https://www.nav.no/kontor/${name.toLowerCase().replaceAll(' ', '-')}`,
	geoId,
	enhetNr,
	hitString,
});

export const offices = {
	evjeOgHornnes: office('Nav Evje og Hornnes', '0937', '4219'),
	testkontor: office('Nav Testkontor', '1234', '1234'),
	alna: office('Nav Alna', '0326', '030112'),
	bjerke: office('Nav Bjerke', '0330', '030109'),
	frogner: office('Nav Frogner', '0312', '030105'),
	kristiansand: office('Nav Kristiansand', '1001', '4204'),
	nordreFollo: office('Nav Nordre Follo', '0213', '3207'),
} satisfies Record<string, OfficeInfo>;

/** GET /api/search?query=<postnr> */
export const postnrResult = (overrides: Partial<SearchResultPostnrProps> = {}): SearchResultPostnrProps => ({
	type: 'postnr',
	postnr: '4737',
	poststed: 'HORNNES',
	poststedNormalized: 'hornnes',
	kommuneNavn: 'EVJE OG HORNNES',
	kommunenr: '4219',
	kategori: PostnrKategori.Gateadresser,
	officeInfo: [offices.evjeOgHornnes],
	...overrides,
});

export const osloPostnrResult = (
	postnr: string,
	kategori: PostnrKategori,
	officeInfo: OfficeInfo[] = [offices.alna, offices.bjerke, offices.frogner],
): SearchResultPostnrProps =>
	postnrResult({
		postnr,
		poststed: 'OSLO',
		poststedNormalized: 'oslo',
		kommuneNavn: 'OSLO',
		kommunenr: '0301',
		kategori,
		officeInfo,
	});

/** GET /api/search/name?query=… */
export const nameResult = (input: string, hits: NameHit[] = []): SearchResultNameProps => ({
	type: 'name',
	hits,
	input,
});

export const nameHit = (name: string, officeHits: OfficeInfo[]): NameHit => ({
	name,
	officeHits: officeHits.map((hit) => ({ ...hit, hitString: name })),
});

export const adresse = (overrides: Partial<Adresse> = {}): Adresse => ({
	adressenavn: 'Storgata',
	husnummer: 1,
	husbokstav: null,
	postnummer: '0184',
	poststed: 'OSLO',
	kommunenummer: '0301',
	bydelsnummer: '030102',
	...overrides,
});

/** Storgata 1, Storgata 2, … in 0184 OSLO */
export const storgataAdresser = (count: number): Adresse[] =>
	Array.from({ length: count }, (_, index) => adresse({ husnummer: index + 1 }));

/** GET /api/search/address?query=… */
export const addressResult = (
	adresseQuery: string,
	adresser: Adresse[],
	totalHits = adresser.length,
): SearchResultAdresseProps => ({
	type: 'adresse',
	adresseQuery,
	adresser,
	totalHits,
});

/** GET /api/geoid?id=… — mirrors geoidSearchHandler, which wraps a single office in a postnr-shaped result */
export const geoidResult = (geoId: string, officeInfo: OfficeInfo): SearchResultPostnrProps => ({
	type: 'postnr',
	postnr: '',
	poststed: officeInfo.name,
	poststedNormalized: '',
	kommuneNavn: '',
	kommunenr: geoId,
	kategori: PostnrKategori.Gateadresser,
	officeInfo: [{ ...officeInfo, geoId, hitString: '' }],
});

/** Error body from apiErrorResponse() */
export const errorResult = (messageId: LocaleStringId): SearchResultErrorProps => ({
	type: 'error',
	messageId,
});
