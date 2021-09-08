import React from 'react';

export type LocaleStringId =
    | 'pageTitle'
    | 'ingressLine1'
    | 'ingressLine2'
    | 'inputLabel'
    | 'inputSubmit'
    | 'errorMissingQuery'
    | 'errorInvalidQuery'
    | 'errorInvalidPostnr'
    | 'errorServerError'
    | 'errorInvalidResult'
    | 'errorClientSideValidation'
    | 'nameResultHeader'
    | 'postnrResultNone'
    | 'postnrResultOne'
    | 'postnrResultMany'
    | 'postnrResultPostbox'
    | 'postnrResultServiceBox'
    | 'nameResultNone'
    | 'nameResultFound';

export const localeNb: {
    [key in LocaleStringId]: string | ((...args: string[]) => React.ReactNode);
} = {
    pageTitle: 'Søk opp NAV-kontor',
    ingressLine1:
        'Mangler du elektronisk ID? Eller skal du finne NAV-kontor på vegne av noen andre?',
    ingressLine2:
        'Da kan du søke opp NAV-kontor ved hjelp av postnummer eller sted/by.',
    inputLabel: 'Skriv inn et postnummer eller stedsnavn:',
    inputSubmit: 'Søk',
    errorMissingQuery: 'Mangler søke-streng',
    errorInvalidQuery: 'Feil i søke-streng',
    errorInvalidPostnr: 'Postnummeret finnes ikke',
    errorServerError: 'Server-feil',
    errorInvalidResult: 'Feil i søke-resultatet',
    errorClientSideValidation:
        'Skriv inn minst to bokstaver eller et postnummer (fire siffer)',
    nameResultHeader: 'Søkeresultat for ',
    postnrResultNone: (postnrOgPoststed, adresseQuery) => (
        <>
            {`Ingen NAV-kontor funnet for `}
            <strong>{postnrOgPoststed}</strong>
            {adresseQuery && ` med gatenavn ${adresseQuery}`}
        </>
    ),
    postnrResultOne: (postnrOgPoststed) => (
        <>
            {'NAV-kontor for '}
            <strong>{postnrOgPoststed}</strong>
            {':'}
        </>
    ),
    postnrResultMany: (numHits, postnrOgPoststed, postnr) => (
        <>
            {`${numHits} kontorer dekker `}
            <strong>{postnrOgPoststed}</strong>
            {`. Du kan legge til et gatenavn for å filtrere søket, f.eks. ${postnr} Eksempelgata`}
        </>
    ),
    postnrResultPostbox: (postnr, kommuneNavn) => (
        <>
            {`${postnr} er et postnummer for postbokser i `}
            <strong>{kommuneNavn}</strong>
            {` kommune. Kommunens NAV-kontor:`}
        </>
    ),
    postnrResultServiceBox: (postnr, kommuneNavn) => (
        <>
            {`${postnr} er et servicepostnummer i `}
            <strong>{kommuneNavn}</strong>
            {` kommune. Kommunens NAV-kontor:`}
        </>
    ),
    nameResultNone: (input) => `Ingen resultater for "${input}"`,
    nameResultFound: (input, numHits) =>
        `Søkeresultat for "${input}" (${numHits}):`,
};
