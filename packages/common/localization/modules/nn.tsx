import React from 'react';

export const localeModuleNn = {
    documentTitle: 'Finn Nav-kontor - nav.no',
    pageTitle: 'Finn Nav-kontor',
    ingressLine1: 'Finn ut kva kontor du tilhøyrer, eller søk i lista over alle Nav-kontor.',
    ingressLine2: 'Du finn Nav-kontoret ditt under personopplysningar på Min Side.',
    loginButtonText: 'Logg inn og sjå ditt Nav-kontor',
    loggedInButtonText: 'Sjå ditt Nav-kontor',
    searchSectionTitle: 'Søk opp Nav-kontor',
    searchSectionBody: 'Søket gir best resultat dersom du skriv heile adressa.',
    inputLabel: 'Skriv inn adresse, postnummer eller stad/by',
    errorMissingQuery: 'Manglar søke-streng',
    errorInvalidQuery: 'Feil i søke-streng',
    errorInvalidPostnr: 'Postnummeret finns ikkje',
    errorServerError: 'Ukjent server-feil',
    errorInvalidResult: 'Server-feil: Feil i søke-resultatet',
    errorInputValidationLength: 'Skriv inn minst to bokstavar eller eit postnummer',
    errorInputValidationPostnr: 'Postnummer-søk må vere fire siffer',
    errorInputValidationName: 'Søket inneheld ugyldige teikn',
    searchLoading: 'Søker...',
    addressSuggestionsAvailable: (numHits: string) =>
        `${numHits} adresseforslag tilgjengeleg. Bruk piltastane for å velje.`,
    addressSuggestionsLabel: 'Adresseforslag',
    addressSuggestionSelected: (address: string) => `Adresse valt: ${address}`,
    addressSuggestionsRefine: (visibleHits: string, totalHits: string) =>
        `Viser ${visibleHits} av ${totalHits} adresseforslag. Skriv meir av adressa for å avgrense søket.`,
    postnrResultNone: (postnrOgPoststed: string) => (
        <>
            {`Ingen Nav-kontor funne for `}
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
            {`${numHits} kontor dekker `}
            <strong>{postnrOgPoststed}</strong>
        </>
    ),
    postnrResultPostbox: (postnr: string, kommuneNavn: string, numHits: string) => (
        <>
            {`${postnr} er eit postnummer for postboksar i `}
            <strong>{kommuneNavn}</strong>
            {` kommune. Kommunens Nav-kontor${Number(numHits) > 1 ? 'er' : ''}:`}
        </>
    ),
    postnrResultServiceBox: (postnr: string, kommuneNavn: string, numHits: string) => (
        <>
            {`${postnr} er eit servicepostnummer i `}
            <strong>{kommuneNavn}</strong>
            {` kommune. Kommunens Nav-kontor${Number(numHits) > 1 ? 'er' : ''}:`}
        </>
    ),
    postnrResultBydeler: (postnr: string, kommuneNavn: string, numHits: string) => (
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
    nameResultFound: (input: string, numHits: string) => (
        <>
            {`${numHits} treff for "`}
            <strong>{input}</strong>
            {'":'}
        </>
    ),
};
