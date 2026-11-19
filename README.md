# Søk opp NAV-kontor

Web-app for å søke etter Nav-kontor med postnummer, by/stedsnavn eller adresse.

Selve søket gjøres av [nav-office-search-api](https://github.com/navikt/nav-office-search-api) i FSS, som også eier dataene det søker i (postnumre, kommuner, bydeler, kontorer og adresser). Denne appen er siden og en videresender: nettleseren gjør ett kall per søk, `GET /finn-nav-kontor/api/search?query=`, og serveren sender det videre til API-ets `/search` og svaret tilbake som det er. Ved lokal kjøring benyttes mocks.

## Struktur

```
nav-office-search/
├── client/          # Vite/React-frontend (SSR + klient)
├── server/          # Hono-server (frackend, API-proxy, SSR-hosting)
├── shared/          # Delt kode: typer, lokalisering, validering
├── test/            # Fixtures og mocks
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

Vite kjører både server og klient, og siden rendres på serveren også her. En endring i `client/` byttes inn uten å laste siden, og en endring i `server/` gjelder fra neste forespørsel. Alle eksterne tjenester unntatt dekoratøren er mocket, og dekoratøren hentes fra www.nav.no. Sett `MOCKS=false` for å slå mockene av.

Søket svares fra et opptak av API-ets svar på et utvalg søk, som `4737`, `0354`, `oslo`, `frogner`, `storgata 1` og `tamburveien 1a` ([test/fixtures/upstream/README.md](test/fixtures/upstream/README.md) har hele listen). Andre søk gir ukjent postnummer eller ingen treff.

For å søke i alt, start nav-office-search-api ved siden av (`pnpm dev` der, port 3003) og pek denne appen dit. Et API på localhost mockes ikke:

```bash
API_ORIGIN=http://localhost:3003 pnpm dev
```

#### Start i production mode:

`pnpm prod-local`

Bygger til `dist/` og kjører det, mot de samme mockene. Imaget inneholder `dist/`, `package.json` og `node_modules` med produksjonsavhengigheter.

### Formatering og linting

Koden formateres med [oxfmt](https://oxc.rs/docs/guide/usage/formatter) (`pnpm format`, sjekk med `pnpm format:check`) og lintes med [oxlint](https://oxc.rs/docs/guide/usage/linter). `pnpm lint` sjekker formatering, lint-regler og typer. Pre-commit-hooken formaterer og linter stagede filer automatisk.

Commits som kun endrer formatering ligger i `.git-blame-ignore-revs`. GitHub hopper over dem i blame automatisk; lokalt må det slås på én gang:

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

### Tester

`pnpm test` kjører klient- og servertestene.

## Metrikker

Appen eksponerer Prometheus-metrikker på `/internal/metrics`, som NAIS skraper. De viktigste:

- `nav_office_search_search_requests_total{outcome}`: søk etter utfall: `ok` (2xx, med eller uten treff), `invalid` (4xx) eller `error` (5xx). Om søkene finner noe, telles i nav-office-search-api (`nav_office_search_api_lookups_total{operation="search"}`).
- `nav_office_search_upstream_requests_total{upstream, status}`: kall mot nav-office-search-api, Texas (tokenet til API-et) og innloggingsstatus, per statusklasse, `timeout` eller `network_error`. Varighet i `nav_office_search_upstream_request_duration_seconds`.
- `nav_office_search_page_renders_total{locale, outcome}`: sider servert per språk: `ssr`, eller `error` når dokumentet ikke kunne settes sammen.

I tillegg kommer standardmetrikkene for Node.js-prosessen (`nodejs_*`, `process_*`).

Metrikkene for dataene søket bruker (lasting, kommuner uten kontor) og for PDL og NORG er nav-office-search-api sine (`nav_office_search_api_*`).

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
