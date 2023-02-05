import { LocaleStringId } from '../../src-common/localization/types';
import { OfficeInfo, Poststed } from './data';

export type SearchResultPostnrProps = {
    type: 'postnr';
    adresseQuery?: string;
    withAllBydeler?: boolean;
    error?: undefined;
} & Poststed;

export type NameHit = { name: string; officeHits: OfficeInfo[] };

export type SearchResultNameProps = {
    type: 'name';
    hits: NameHit[];
    input: string;
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
    | SearchResultErrorProps;
