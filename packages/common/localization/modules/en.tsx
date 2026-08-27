import React from 'react';
import { LocaleModule } from '../types';

export const localeModuleEn: LocaleModule = {
    documentTitle: 'Find Nav office - nav.no',
    pageTitle: 'Find Nav office',
    ingressLine1: 'Find out which office you belong to, or search the list of all Nav offices.',
    ingressLine2: 'You can find your Nav office under personal information on My Page.',
    loginButtonText: 'Log in to see your Nav office',
    loggedInButtonText: 'See your Nav office',
    searchSectionTitle: 'Search for a Nav office',
    searchSectionBody: 'The search works best if you enter the full address.',
    inputLabel: 'Enter address, post code or town/city',
    errorMissingQuery: 'Missing search query',
    errorInvalidQuery: 'Invalid search query',
    errorInvalidPostnr: 'The post code does not exist',
    errorServerError: 'Unknown server error',
    errorInvalidResult: 'Server error: invalid search result',
    errorInputValidationLength: 'Enter at least two letters or a valid post code',
    errorInputValidationPostnr: 'Post code search must be four digits',
    errorInputValidationName: 'Invalid characters in search',
    searchLoading: 'Searching...',
    addressSuggestionsAvailable: (numHits) =>
        `${numHits} address suggestions available. Use the arrow keys to choose.`,
    addressSuggestionsLabel: 'Address suggestions',
    addressSuggestionSelected: (address) => `Address selected: ${address}`,
    addressSuggestionsRefine: (visibleHits, totalHits) =>
        `Showing ${visibleHits} of ${totalHits} address suggestions. Enter more of the address to narrow the search.`,
    postnrResultNone: (postnrOgPoststed) => (
        <>
            {`No Nav office found for `}
            <strong>{postnrOgPoststed}</strong>
        </>
    ),
    postnrResultOne: (postnrOgPoststed) => (
        <>
            {'Nav office for '}
            <strong>{postnrOgPoststed}</strong>
            {':'}
        </>
    ),
    postnrResultMany: (numHits, postnrOgPoststed) => (
        <>
            {`${numHits} offices cover `}
            <strong>{postnrOgPoststed}</strong>
        </>
    ),
    postnrResultPostbox: (postnr, kommuneNavn, numHits) => (
        <>
            {`${postnr} is a post code for PO boxes in `}
            <strong>{kommuneNavn}</strong>
            {`. Nav office${Number(numHits) > 1 ? 's' : ''} for this town/city:`}
        </>
    ),
    postnrResultServiceBox: (postnr, kommuneNavn, numHits) => (
        <>
            {`${postnr} is a service post code in `}
            <strong>{kommuneNavn}</strong>
            {`. Nav office${Number(numHits) > 1 ? 's' : ''} for this town/city:`}
        </>
    ),
    postnrResultBydeler: (postnr, kommuneNavn, numHits) => (
        <>
            {'No specific office found for '}
            <strong>{postnr}</strong>
            {' in '}
            <strong>{kommuneNavn}</strong>
            {`. ${Number(numHits) > 1 ? 'All ' : ''}Nav office${
                Number(numHits) > 1 ? 's' : ''
            } for this town/city:`}
        </>
    ),
    nameResultNone: (input) => `No results for "${input}"`,
    nameResultFound: (input, numHits) => (
        <>
            {`${numHits} results for "`}
            <strong>{input}</strong>
            {'":'}
        </>
    ),
};
