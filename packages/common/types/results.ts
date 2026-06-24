import { LocaleStringId } from '../localization/types';
import { OfficeInfo, Poststed } from './data';

export type SearchResultPostnrProps = {
    type: 'postnr';
    withAllBydeler?: boolean;
    error?: undefined;
} & Poststed;

export type NameHit = { name: string; officeHits: OfficeInfo[] };

export type Adresse = {
    adressenavn: string;
    husnummer: number;
    husbokstav: string | null;
    postnummer: string;
    poststed: string;
    kommunenummer: string;
    bydelsnummer: string | null;
};

export type SearchResultNameProps = {
    type: 'name';
    hits: NameHit[];
    input: string;
    error?: undefined;
};

export type SearchResultAdresseProps = {
    type: 'adresse';
    adresseQuery: string;
    adresser: Adresse[];
    totalHits: number;
    error?: undefined;
};

export type SearchResultErrorProps = {
    type: 'error';
    aborted?: boolean;
    messageId?: LocaleStringId;
};

export type SearchResultProps =
    | SearchResultPostnrProps
    | SearchResultNameProps
    | SearchResultAdresseProps
    | SearchResultErrorProps;
