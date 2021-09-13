# NAV-kontor søk for åpne sider

React/[Next.js](https://nextjs.org/) applikasjon for å søke opp NAV-kontor etter postnummer eller stedsnavn.

Avhengig av [nav-office-search-api](https://github.com/navikt/nav-office-search-api) for proxy mot TPS og norg-tjenester i FSS (ved lokal kjøring benyttes mocks).

![Deploy-to-prod](https://github.com/navikt/nav-office-search/workflows/Deploy-to-prod/badge.svg) <br>
![Deploy-to-dev](https://github.com/navikt/nav-office-search/workflows/Deploy-to-dev/badge.svg) <br>

## Lokal kjøring

Kjører lokalt på [http://localhost:3005](http://localhost:3005)

Dekoratøren kan startes lokalt med `docker-compose up`

#### Development mode:

Kjør `npm run dev`

#### Production mode:

Kopier først innhold fra .env.development til .env.local

Kjør så `npm run start-clean`

## Deploy til dev-miljø

-   Generer en personal access token på Github med repo-tilgang (husk SSO)
-   Opprett fila .github-token og legg tokenet inn i denne
-   Push branchen din til Github og kjør `npm run deploy-dev`

#### Alternativt:

[Actions](https://github.com/navikt/nav-office-search/actions) -> Velg workflow -> Run workflow -> Velg branch -> Run workflow

## Prodsetting

- Lag en PR til master, og merge inn etter godkjenning
- Lag en release på master med versjon-bump, beskrivende tittel og oppsummering av endringene dine
- Publiser release'en for å starte deploy til prod

# Henvendelser

Spørsmål knyttet til koden eller prosjektet kan rettes mot https://github.com/orgs/navikt/teams/personbruker

## For NAV-ansatte

Interne henvendelser kan sendes via Slack i kanalen #team-personbruker
