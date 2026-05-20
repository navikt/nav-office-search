import React from 'react';

export const localeModuleNn = {
    documentTitle: 'Søk opp Nav-kontor - nav.no',
    pageTitle: 'Søk opp Nav-kontor',
    breadcrumb1: 'Kontakt oss',
    breadcrumb2: 'Søk opp Nav-kontor',
    ingressLine1:
        'Manglar du elektronisk ID? Eller skal du finne Nav-kontor på vegne av nokon andre?',
    ingressLine2:
        'Då kan du søke opp Nav-kontor ved hjelp av postnummer eller stad/by.',
    inputLabel: 'Skriv inn eit postnummer eller stadnamn:',
    inputSubmit: 'Søk',
    errorMissingQuery: 'Manglar søke-streng',
    errorInvalidQuery: 'Feil i søke-streng',
    errorInvalidPostnr: 'Postnummeret finns ikkje',
    errorServerError: 'Ukjent server-feil',
    errorInvalidResult: 'Server-feil: Feil i søke-resultatet',
    errorInputValidationLength:
        'Skriv inn minst to bokstavar eller eit postnummer',
    errorInputValidationPostnr: 'Postnummer-søk må vere fire siffer',
    errorInputValidationName: 'Søket inneheld ugyldige teikn',
    nameResultHeader: 'Søkeresultat for ',
    postnrResultNone: (postnrOgPoststed: string, adresseQuery: string) => (
        <>
            {`Ingen Nav-kontor funne for `}
            <strong>{postnrOgPoststed}</strong>
            {adresseQuery && ` med gatenamn ${adresseQuery}`}
        </>
    ),
    postnrResultOne: (postnrOgPoststed: string) => (
        <>
            {'Nav-kontor for '}
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
            {`${numHits} kontor dekker `}
            <strong>{postnrOgPoststed}</strong>
            {`. Du kan legge til gatenamn og husnummer for å spisse søket, t.d. ${postnr} Eksempelgata 12`}
        </>
    ),
    postnrResultPostbox: (
        postnr: string,
        kommuneNavn: string,
        numHits: string
    ) => (
        <>
            {`${postnr} er eit postnummer for postboksar i `}
            <strong>{kommuneNavn}</strong>
            {` kommune. Kommunens Nav-kontor${
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
            {`${postnr} er eit servicepostnummer i `}
            <strong>{kommuneNavn}</strong>
            {` kommune. Kommunens Nav-kontor${
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
            {'Fant ingen kontor spesifikt knytta til '}
            <strong>{postnr}</strong>
            {' i '}
            <strong>{kommuneNavn}</strong>
            {` kommune. ${
                Number(numHits) > 1 ? 'Alle k' : 'K'
            }ommunens Nav-kontor${Number(numHits) > 1 ? 'er' : ''}:`}
        </>
    ),
    nameResultNone: (input: string) => `Ingen resultat for "${input}"`,
    nameResultFound: (input: string, numHits: string) =>
        `Søkeresultat for "${input}" (${numHits}):`,
};
