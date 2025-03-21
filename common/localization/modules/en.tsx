import React from 'react';
import { LocaleModule } from '../types';

export const localeModuleEn: LocaleModule = {
    documentTitle: 'Find a Nav office - nav.no',
    pageTitle: 'Find a Nav office',
    breadcrumb1: 'Contact us',
    breadcrumb2: 'Find a Nav office',
    ingressLine1:
        'Do you not have electronic ID? Or are you trying to find the Nav office on behalf of someone else?',
    ingressLine2:
        'If so, you can find a Nav office using a post code or town/city.',
    inputLabel: 'Enter a post code or town/city:',
    inputSubmit: 'Search',
    errorMissingQuery: 'Missing search query',
    errorInvalidQuery: 'Invalid search query',
    errorInvalidPostnr: 'The post code does not exist',
    errorServerError: 'Unknown server error',
    errorInvalidResult: 'Server error: invalid search result',
    errorInputValidationLength:
        'Enter at least two letters or a valid post code',
    errorInputValidationPostnr: 'Post code search must be four digits',
    errorInputValidationName: 'Invalid characters in search',
    nameResultHeader: 'Search results for ',
    postnrResultNone: (postnrOgPoststed, adresseQuery) => (
        <>
            {`No Nav office found for `}
            <strong>{postnrOgPoststed}</strong>
            {adresseQuery && ` with street name ${adresseQuery}`}
        </>
    ),
    postnrResultOne: (postnrOgPoststed) => (
        <>
            {'Nav office for '}
            <strong>{postnrOgPoststed}</strong>
            {':'}
        </>
    ),
    postnrResultMany: (numHits, postnrOgPoststed, postnr) => (
        <>
            {`${numHits} offices cover `}
            <strong>{postnrOgPoststed}</strong>
            {`. You can add a street name and building number to narrow the search, e.g. ${postnr} Example-street 12`}
        </>
    ),
    postnrResultPostbox: (postnr, kommuneNavn, numHits) => (
        <>
            {`${postnr} is a post code for PO boxes in `}
            <strong>{kommuneNavn}</strong>
            {`. Nav office${
                Number(numHits) > 1 ? 's' : ''
            } for this town/city:`}
        </>
    ),
    postnrResultServiceBox: (postnr, kommuneNavn, numHits) => (
        <>
            {`${postnr} is a service post code in `}
            <strong>{kommuneNavn}</strong>
            {`. Nav office${
                Number(numHits) > 1 ? 's' : ''
            } for this town/city:`}
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
    nameResultFound: (input, numHits) =>
        `Search results for "${input}" (${numHits}):`,
};
