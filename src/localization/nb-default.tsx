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
    | 'errorInputValidationLength'
    | 'errorInputValidationPostnr'
    | 'errorInputValidationName'
    | 'nameResultHeader'
    | 'postnrResultNone'
    | 'postnrResultOne'
    | 'postnrResultMany'
    | 'postnrResultPostbox'
    | 'postnrResultServiceBox'
    | 'nameResultNone'
    | 'nameResultFound'
    | 'breadcrumb1'
    | 'breadcrumb2';

export type LocaleModule = typeof localeModuleNb;

export const localeModuleNb: {
    [key in LocaleStringId]: string | ((...args: string[]) => React.ReactNode);
} = {
    pageTitle: 'Søk opp NAV-kontor',
    breadcrumb1: 'Kontakt oss',
    breadcrumb2: 'Søk opp NAV-kontor',
    ingressLine1:
        'Mangler du elektronisk ID? Eller skal du finne NAV-kontor på vegne av noen andre?',
    ingressLine2:
        'Da kan du søke opp NAV-kontor ved hjelp av postnummer eller sted/by.',
    inputLabel: 'Skriv inn et postnummer eller stedsnavn:',
    inputSubmit: 'Søk',
    errorMissingQuery: 'Mangler søke-streng',
    errorInvalidQuery: 'Feil i søke-streng',
    errorInvalidPostnr: 'Postnummeret finnes ikke',
    errorServerError: 'Ukjent server-feil',
    errorInvalidResult: 'Server-feil: Feil i søke-resultatet',
    errorInputValidationLength:
        'Skriv inn minst to bokstaver eller et postnummer',
    errorInputValidationPostnr: 'Postnummer-søk må være fire siffer',
    errorInputValidationName: 'Søket inneholder ugyldige tegn',
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
            {`. Du kan legge til et gatenavn for å spisse søket, f.eks. ${postnr} Eksempelgata`}
        </>
    ),
    postnrResultPostbox: (postnr, kommuneNavn, numHits) => (
        <>
            {`${postnr} er et postnummer for postbokser i `}
            <strong>{kommuneNavn}</strong>
            {` kommune. Kommunens NAV-kontor${
                Number(numHits) > 1 ? 'er' : ''
            }:`}
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
