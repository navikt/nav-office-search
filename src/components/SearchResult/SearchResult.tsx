import React from 'react';
import { SearchResultProps } from '../../types/searchResult';
import { SearchResultPostnr } from './SearchResultPostnr/SearchResultPostnr';
import { SearchResultName } from './SearchResultName/SearchResultName';

type Props = {
    searchResult: SearchResultProps;
};

export const SearchResult = ({ searchResult }: Props) => {
    if (searchResult.type === 'postnr') {
        return <SearchResultPostnr result={searchResult} />;
    }

    if (searchResult.type === 'name') {
        return <SearchResultName result={searchResult} />;
    }

    return null;
};
