import React from 'react';

export const localeModuleNb = {
    documentTitle: 'Finn Nav-kontor - nav.no',
    pageTitle: 'Finn Nav-kontor',
    ingressLine1: 'Finn ut hvilket kontor du tilhører, eller søk i listen over alle Nav-kontor.',
    ingressLine2: 'Du finner ditt Nav-kontor under personopplysninger på Min Side.',
    loginButtonText: 'Logg inn og se ditt Nav-kontor',
    loggedInButtonText: 'Se ditt Nav-kontor',
    searchSectionTitle: 'Søk opp Nav-kontor',
    searchSectionBody: 'Søket gir best resultater hvis du skriver hele adressen.',
    inputLabel: 'Skriv inn adresse, postnummer eller sted/by',
    errorMissingQuery: 'Mangler søke-streng',
    errorInvalidQuery: 'Feil i søke-streng',
    errorInvalidPostnr: 'Postnummeret finnes ikke',
    errorServerError: 'Ukjent server-feil',
    errorInvalidResult: 'Server-feil: Feil i søke-resultatet',
    errorInputValidationLength: 'Skriv inn minst to bokstaver eller et postnummer',
    errorInputValidationPostnr: 'Postnummer-søk må være fire siffer',
    errorInputValidationName: 'Søket inneholder ugyldige tegn',
    searchLoading: 'Søker...',
    addressSuggestionsAvailable: (numHits: string) =>
        `${numHits} adresseforslag tilgjengelig. Bruk piltastene for å velge.`,
    addressSuggestionsLabel: 'Adresseforslag',
    addressSuggestionSelected: (address: string) => `Adresse valgt: ${address}`,
    addressSuggestionsRefine: (visibleHits: string, totalHits: string) =>
        `Viser ${visibleHits} av ${totalHits} adresseforslag. Skriv mer av adressen for å avgrense søket.`,
    postnrResultNone: (postnrOgPoststed: string) => (
        <>
            {`Ingen Nav-kontor funnet for `}
            <strong>{postnrOgPoststed}</strong>
        </>
    ),
    postnrResultOne: (postnrOgPoststed: string) => (
        <>
            {'Nav-kontor for '}
            <strong>{postnrOgPoststed}</strong>
            {':'}
        </>
    ),
    postnrResultMany: (numHits: string, postnrOgPoststed: string) => (
        <>
            {`${numHits} kontorer dekker `}
            <strong>{postnrOgPoststed}</strong>
        </>
    ),
    postnrResultPostbox: (postnr: string, kommuneNavn: string, numHits: string) => (
        <>
            {`${postnr} er et postnummer for postbokser i `}
            <strong>{kommuneNavn}</strong>
            {` kommune. Kommunens Nav-kontor${Number(numHits) > 1 ? 'er' : ''}:`}
        </>
    ),
    postnrResultServiceBox: (postnr: string, kommuneNavn: string, numHits: string) => (
        <>
            {`${postnr} er et servicepostnummer i `}
            <strong>{kommuneNavn}</strong>
            {` kommune. Kommunens Nav-kontor${Number(numHits) > 1 ? 'er' : ''}:`}
        </>
    ),
    postnrResultBydeler: (postnr: string, kommuneNavn: string, numHits: string) => (
        <>
            {'Fant ingen kontor spesifikt tilknyttet '}
            <strong>{postnr}</strong>
            {' i '}
            <strong>{kommuneNavn}</strong>
            {` kommune. ${
                Number(numHits) > 1 ? 'Alle k' : 'K'
            }ommunens Nav-kontor${Number(numHits) > 1 ? 'er' : ''}:`}
        </>
    ),
    nameResultNone: (input: string) => `Ingen resultater for "${input}"`,
    nameResultFound: (input: string, numHits: string) => (
        <>
            {`${numHits} treff for "`}
            <strong>{input}</strong>
            {'":'}
        </>
    ),
};
