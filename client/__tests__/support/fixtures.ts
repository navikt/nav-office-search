import type { LocaleStringId } from '#shared/localization/types.ts';
import { type OfficeInfo, PostnrKategori } from '#shared/types/data.ts';
import type {
	Adresse,
	NameHit,
	SearchResultAdresseProps,
	SearchResultErrorProps,
	SearchResultNameProps,
	SearchResultPostnrProps,
} from '#shared/types/results.ts';

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
	grunerlokka: office('Nav Grünerløkka', '0315', '030102'),
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

/** GET /api/search?query=<a name> */
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
	officeInfo: offices.grunerlokka,
	...overrides,
});

/** Storgata 1, Storgata 2, … in 0184 OSLO, where the office is Nav Grünerløkka */
export const storgataAdresser = (count: number): Adresse[] =>
	Array.from({ length: count }, (_, index) => adresse({ husnummer: index + 1 }));

/** GET /api/search?query=<what no name matches> */
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

/** The body of an error answer */
export const errorResult = (messageId: LocaleStringId): SearchResultErrorProps => ({
	type: 'error',
	messageId,
});
