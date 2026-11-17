import type { LocaleStringId } from '#shared/localization/types.ts';
import type { OfficeInfo, Poststed } from './data.ts';

export type SearchResultPostnrProps = {
	type: 'postnr';
} & Poststed;

export type NameHit = { name: string; officeHits: OfficeInfo[] };

export type Adresse = {
	adressenavn: string;
	husnummer: number | null;
	husbokstav: string | null;
	postnummer: string;
	poststed: string;
	kommunenummer: string | null;
	bydelsnummer: string | null;
	/** The office of its bydel or, without a bydel, of its kommune. Null when that area has none. */
	officeInfo: OfficeInfo | null;
};

export type SearchResultNameProps = {
	type: 'name';
	hits: NameHit[];
	input: string;
};

export type SearchResultAdresseProps = {
	type: 'adresse';
	adresseQuery: string;
	adresser: Adresse[];
	totalHits: number;
};

export type SearchResultErrorProps = {
	type: 'error';
	messageId?: LocaleStringId;
};

export type SearchResultProps =
	| SearchResultPostnrProps
	| SearchResultNameProps
	| SearchResultAdresseProps
	| SearchResultErrorProps;
