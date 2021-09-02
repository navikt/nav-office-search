import { LocaleStringId } from '../localization/LocaleString';
import { PostnrKategori } from './postnr';

export type SearchHitProps = {
    kontorNavn: string;
    enhetNr: string;
    status: string;
    adressenavn?: string;
    error?: undefined;
};

export type SearchResultPostnrProps = {
    type: 'postnr';
    hits: SearchHitProps[];
    postnr: string;
    poststed: string;
    kategori: PostnrKategori;
    showAdresse?: boolean;
    error?: undefined;
};

export type SearchResultNameProps = {
    type: 'name';
    hits: SearchHitProps[];
    input: string;
    error?: undefined;
};

export type SearchResultErrorProps = {
    type: 'error';
    messageId: LocaleStringId;
};

export type SearchResultProps =
    | SearchResultPostnrProps
    | SearchResultNameProps
    | SearchResultErrorProps;
