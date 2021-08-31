import React from 'react';
import { SearchResultProps } from '../../types/searchResult';
import { SearchResultPostnr } from './SearchResultPostnr/SearchResultPostnr';

type Props = {
    searchResult: SearchResultProps;
};

export const SearchResult = ({ searchResult }: Props) => {
    if (searchResult.type === 'postnr') {
        return <SearchResultPostnr result={searchResult} />;
    }

    return null;
};
