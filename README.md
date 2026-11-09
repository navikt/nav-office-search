# Søk opp NAV-kontor

Web-app for å søke etter Nav-kontor med postnummer, by/stedsnavn eller adresse.

Avhengig av [nav-office-search-api](https://github.com/navikt/nav-office-search-api) for proxy mot PDL og norg-tjenester i FSS (ved lokal kjøring benyttes mocks).

## Struktur

```
nav-office-search/
├── client/          # Vite/React-frontend (SSR + klient)
├── server/          # Hono-server (frackend, API-proxy, SSR-hosting)
├── shared/          # Delt kode: typer, lokalisering, validering
├── test/            # Fixtures, mocks og HTTP-tester
├── vite-plugins/    # Vite-plugins for bygget
└── vite.config.ts   # Bygger klient og server til dist/
```

## Lokal utvikling

### Installere pnpm

Dette prosjektet bruker **pnpm** som package manager. Node.js kommer med Corepack som automatisk bruker riktig pnpm-versjon:

```bash
corepack enable
```

Corepack leser `packageManager`-feltet i `package.json` og installerer riktig versjon automatisk.

**Merk:** Når Corepack er aktivert, vil `npm`-kommandoer ikke fungere.

Kjører lokalt på [http://localhost:3005/finn-nav-kontor](http://localhost:3005/finn-nav-kontor)

#### Start i development mode:

`pnpm dev`

Vite kjører både server og klient, og siden rendres på serveren også her. En endring i `client/` byttes inn uten å laste siden, og en endring i `server/` gjelder fra neste forespørsel. Alle eksterne tjenester unntatt dekoratøren er mocket fra `test/fixtures/upstream/`, og dekoratøren hentes fra www.nav.no. Sett `MOCKS=false` for å slå mockene av.

#### Start i production mode:

`pnpm prod-local`

Bygger til `dist/` og kjører det, mot de samme mockene. Imaget inneholder `dist/`, `package.json` og `node_modules` med produksjonsavhengigheter.

### Formatering

Koden formateres med [oxfmt](https://oxc.rs/docs/guide/usage/formatter) (`pnpm format`, sjekk med `pnpm format:check`). Pre-commit-hooken formaterer stagede filer automatisk.

Commits som kun endrer formatering ligger i `.git-blame-ignore-revs`. GitHub hopper over dem i blame automatisk; lokalt må det slås på én gang:

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

### Tester

`pnpm test` kjører klient- og servertestene.

`pnpm test:http` bygger appen og kjører midlertidige HTTP-tester mot den bygde serveren, med alle eksterne tjenester erstattet av fixtures. De låser dagens oppførsel mens serveren bygges om, og kjøres bare i PR-sjekkene. Se [test/http/README.md](test/http/README.md).

## Metrikker

Appen eksponerer Prometheus-metrikker på `/finn-nav-kontor/api/internal/metrics`, som NAIS skraper. De viktigste:

- `nav_office_search_search_requests_total{route, outcome}`: søk per endepunkt, med utfall `hits`, `empty` (gyldig søk uten treff), `invalid` (4xx) eller `error` (5xx). Varighet i `nav_office_search_search_request_duration_seconds`.
- `nav_office_search_upstream_requests_total{upstream, status}`: kall mot nav-office-search-api, XP, SSB, Bring, Azure og innloggingsstatus, per statusklasse eller `network_error`. Varighet i `nav_office_search_upstream_request_duration_seconds`.
- `nav_office_search_reference_data_without_office{dataset}`: kommuner, bydeler og postnumre som siste datalasting ikke fant Nav-kontor for. Bør være 0 for kommuner; hvilke det gjelder står i loggen ("No office found for …").
- `nav_office_search_data_loads_total{outcome}`, `nav_office_search_data_last_success_timestamp_seconds` og `nav_office_search_data_load_duration_seconds`: oppstart og daglig oppfrisking av referansedata.
- `nav_office_search_page_renders_total{locale, outcome}`: sidevisninger rendret på server (`ssr`), med fallback til klient (`csr_fallback`) eller med feil.

I tillegg kommer standardmetrikkene for Node.js-prosessen (`nodejs_*`, `process_*`).

## Konfigurasjon

Bygget trenger ingen miljøvariabler. Serveren får konfigurasjonen sin når den kjører: fra `.nais/config.yml` og `.nais/vars-*.yml` i podden, og fra `.env.development` lokalt. [server/env.ts](server/env.ts) sjekker den ved oppstart, så en feilkonfigurert pod krasjer før den får trafikk.

## Deploy til dev-miljø

[Deploy to dev action](https://github.com/navikt/nav-office-search/actions/workflows/deploy.dev.yml) -> Run workflow -> Velg branch -> Run workflow

Ingress for dev-miljø: https://www.ansatt.dev.nav.no/finn-nav-kontor

## Prodsetting

Lag en PR til main, og merge inn etter godkjenning (En automatisk release vil oppstå ved deploy til main)

Prod bygges og deployes på nytt hver søndag kveld ([Refresh base image](https://github.com/navikt/nav-office-search/actions/workflows/base-image-refresh.yml)), slik at imaget får siste versjon av base-imaget.

CI bruker felles workflows fra [navno-ci](https://github.com/navikt/navno-ci).

## Rollback

[Roll back prod](https://github.com/navikt/nav-office-search/actions/workflows/rollback.prod.yml) -> Run workflow. Uten release-tag rulles det tilbake til releasen før den nyeste; oppgi en tag for å gå lenger tilbake.

Neste push til main deployer main igjen, så revert eller fiks på main før noe annet merges.

# Henvendelser

Spørsmål knyttet til koden eller prosjektet kan rettes mot https://github.com/orgs/navikt/teams/navno

## For NAV-ansatte

Interne henvendelser kan sendes via Slack i kanalen #team-navno
