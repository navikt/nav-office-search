import * as React from 'react';
import type { Adresse, SearchResultProps } from '#shared/types/results.ts';
import { SearchResultPostnr } from './SearchResultPostnr/SearchResultPostnr.tsx';
import { SearchResultName } from './SearchResultName/SearchResultName.tsx';
import { SearchResultAdresse } from './SearchResultAdresse/SearchResultAdresse.tsx';

type Props = {
	searchResult: SearchResultProps;
	onAddressSelect: (adresse: Adresse) => void;
	onAddressMouseEnter: (index: number) => void;
	activeAddressIndex: number | null;
	addressListboxId: string;
	addressSuggestionsLabel: string;
	addressResultInput?: string | null;
};

export const SearchResult = React.memo(function SearchResult({
	searchResult,
	onAddressSelect,
	onAddressMouseEnter,
	activeAddressIndex,
	addressListboxId,
	addressSuggestionsLabel,
	addressResultInput,
}: Props) {
	if (searchResult.type === 'postnr') {
		return <SearchResultPostnr result={searchResult} resultInput={addressResultInput} />;
	}

	if (searchResult.type === 'name') {
		return <SearchResultName result={searchResult} />;
	}

	if (searchResult.type === 'adresse') {
		return (
			<SearchResultAdresse
				result={searchResult}
				onAddressSelect={onAddressSelect}
				onAddressMouseEnter={onAddressMouseEnter}
				activeIndex={activeAddressIndex}
				listboxId={addressListboxId}
				listboxLabel={addressSuggestionsLabel}
			/>
		);
	}

	return null;
});
