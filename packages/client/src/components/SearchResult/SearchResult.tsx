import React from 'react';
import { Adresse, SearchResultProps } from '../../../../common/types/results';
import { SearchResultPostnr } from './SearchResultPostnr/SearchResultPostnr';
import { SearchResultName } from './SearchResultName/SearchResultName';
import { SearchResultAdresse } from './SearchResultAdresse/SearchResultAdresse';

type Props = {
    searchResult: SearchResultProps;
    onAddressSelect: (adresse: Adresse) => void;
};

export const SearchResult = ({ searchResult, onAddressSelect }: Props) => {
    if (searchResult.type === 'postnr') {
        return <SearchResultPostnr result={searchResult} />;
    }

    if (searchResult.type === 'name') {
        return <SearchResultName result={searchResult} />;
    }

    if (searchResult.type === 'adresse') {
        return <SearchResultAdresse result={searchResult} onAddressSelect={onAddressSelect} />;
    }

    return null;
};
