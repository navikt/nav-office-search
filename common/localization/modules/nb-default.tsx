import React from 'react';

export const localeModuleNb = {
    documentTitle: 'Søk opp NAV-kontor - nav.no',
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
    postnrResultNone: (postnrOgPoststed: string, adresseQuery: string) => (
        <>
            {`Ingen NAV-kontor funnet for `}
            <strong>{postnrOgPoststed}</strong>
            {adresseQuery && ` med gatenavn ${adresseQuery}`}
        </>
    ),
    postnrResultOne: (postnrOgPoststed: string) => (
        <>
            {'NAV-kontor for '}
            <strong>{postnrOgPoststed}</strong>
            {':'}
        </>
    ),
    postnrResultMany: (
        numHits: string,
        postnrOgPoststed: string,
        postnr: string
    ) => (
        <>
            {`${numHits} kontorer dekker `}
            <strong>{postnrOgPoststed}</strong>
            {`. Du kan legge til gatenavn og husnummer for å spisse søket, f.eks. ${postnr} Eksempelgata 12`}
        </>
    ),
    postnrResultPostbox: (
        postnr: string,
        kommuneNavn: string,
        numHits: string
    ) => (
        <>
            {`${postnr} er et postnummer for postbokser i `}
            <strong>{kommuneNavn}</strong>
            {` kommune. Kommunens NAV-kontor${
                Number(numHits) > 1 ? 'er' : ''
            }:`}
        </>
    ),
    postnrResultServiceBox: (
        postnr: string,
        kommuneNavn: string,
        numHits: string
    ) => (
        <>
            {`${postnr} er et servicepostnummer i `}
            <strong>{kommuneNavn}</strong>
            {` kommune. Kommunens NAV-kontor${
                Number(numHits) > 1 ? 'er' : ''
            }:`}
        </>
    ),
    postnrResultBydeler: (
        postnr: string,
        kommuneNavn: string,
        numHits: string
    ) => (
        <>
            {'Fant ingen kontor spesifikt tilknyttet '}
            <strong>{postnr}</strong>
            {' i '}
            <strong>{kommuneNavn}</strong>
            {` kommune. ${
                Number(numHits) > 1 ? 'Alle k' : 'K'
            }ommunens NAV-kontor${Number(numHits) > 1 ? 'er' : ''}:`}
        </>
    ),
    nameResultNone: (input: string) => `Ingen resultater for "${input}"`,
    nameResultFound: (input: string, numHits: string) =>
        `Søkeresultat for "${input}" (${numHits}):`,
};
