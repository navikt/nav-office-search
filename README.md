# Søk opp NAV-kontor

![Deploy-to-prod](https://github.com/navikt/nav-office-search/workflows/Deploy-to-prod/badge.svg) <br>
![Deploy-to-dev](https://github.com/navikt/nav-office-search/workflows/Deploy-to-dev/badge.svg) <br>

Web-app for å søke etter NAV-kontor med postnummer eller by/stedsnavn.

Avhengig av [nav-office-search-api](https://github.com/navikt/nav-office-search-api) for proxy mot TPS og norg-tjenester i FSS (ved lokal kjøring benyttes mocks).

## Lokal utvikling

Kjører lokalt på [http://localhost:3005](http://localhost:3005)

#### Start i development mode:

`npm run dev`

#### Start i production mode:

`npm run prod-local`

#### Start dekoratøren:

`npm run decorator`

Benytter prod-dekoratøren dersom denne ikke kjører lokalt

## Deploy til dev-miljø

[Deploy to dev action](https://github.com/navikt/nav-office-search/actions/workflows/deploy.dev.yml) -> Run workflow -> Velg branch -> Run workflow

Ingress for dev-miljø: https://www.dev.nav.no/sok-nav-kontor

## Prodsetting

- Lag en PR til master, og merge inn etter godkjenning
- Lag en release på master med versjon-bump, beskrivende tittel og oppsummering av endringene dine
- Publiser release'en for å starte deploy til prod

# Henvendelser

Spørsmål knyttet til koden eller prosjektet kan rettes mot https://github.com/orgs/navikt/teams/personbruker

## For NAV-ansatte

Interne henvendelser kan sendes via Slack i kanalen #team-personbruker
