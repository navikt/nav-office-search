export type SearchHitProps = {
    kontorNavn: string;
    enhetNr: string;
    status: string;
    hitString: string;
};

export type PostnrSearchResult = {
    type: 'postnr';
    hits: SearchHitProps[];
    postnr: string;
    poststed: string;
    kategori: string;
};

export type NameSearchResult = {
    type: 'name';
    hits: SearchHitProps[];
    input: string;
};

export type SearchResultProps = PostnrSearchResult | NameSearchResult;
