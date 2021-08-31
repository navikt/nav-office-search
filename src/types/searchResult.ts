import { PostnrKategori } from '../data/postnrRegister';

export type SearchHitProps = {
    kontorNavn: string;
    enhetNr: string;
    status: string;
    hitString?: string;
    error?: undefined;
};

export type PostnrSearchResult = {
    type: 'postnr';
    hits: SearchHitProps[];
    postnr: string;
    poststed: string;
    kategori: PostnrKategori;
    error?: undefined;
};

export type NameSearchResult = {
    type: 'name';
    hits: SearchHitProps[];
    input: string;
    error?: undefined;
};

export type SearchResultProps = PostnrSearchResult | NameSearchResult;
