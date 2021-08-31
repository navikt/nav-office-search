export type SearchHitProps = {
    kontorNavn: string;
    enhetNr: string;
    status: string;
    hitString: string;
};

export type PostnrResult = {
    type: 'postnr';
    hits: SearchHitProps[];
    postnr: string;
    poststed: string;
    postnrType: string;
};

export type NameSearchResult = {
    type: 'name';
    hits: SearchHitProps[];
    input: string;
};

export type SearchResultProps = PostnrResult | NameSearchResult;
