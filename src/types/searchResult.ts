import { LocaleStringId } from '../localization/LocaleString';
import { PostnrKategori } from './postnr';

export type OfficeInfo = {
    kontorNavn: string;
    enhetNr: string;
    status: string;
    adressenavn: string;
    error?: undefined;
};

export type SearchResultPostnrProps = {
    type: 'postnr';
    hits: OfficeInfo[];
    postnr: string;
    poststed: string;
    kommune: string;
    kategori: PostnrKategori;
    adresseQuery?: string;
    error?: undefined;
};

export type NameHit = { name: string; officeHits: OfficeInfo[] };

export type SearchResultNameProps = {
    type: 'name';
    nameHits: NameHit[];
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
