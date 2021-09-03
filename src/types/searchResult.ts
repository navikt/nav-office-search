import { LocaleStringId } from '../localization/LocaleString';
import { PostnrKategori } from './postnr';

export type OfficeHitProps = {
    kontorNavn: string;
    enhetNr: string;
    status: string;
    adressenavn: string;
    error?: undefined;
};

export type SearchResultPostnrProps = {
    type: 'postnr';
    hits: OfficeHitProps[];
    postnr: string;
    poststed: string;
    kommune: string;
    kategori: PostnrKategori;
    adresseQuery?: string;
    error?: undefined;
};

export type SearchResultNameProps = {
    type: 'name';
    nameHits: { name: string; officeHits: OfficeHitProps[] }[];
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
