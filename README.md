# Søk opp NAV-kontor

Web-app for å søke etter Nav-kontor med postnummer, by/stedsnavn eller adresse.

Avhengig av [nav-office-search-api](https://github.com/navikt/nav-office-search-api) for proxy mot PDL og norg-tjenester i FSS (ved lokal kjøring benyttes mocks).

## Monorepo-struktur

```
nav-office-search/
├── packages/
│   ├── client/     # Vite/Preact-frontend (SSR + klient)
│   ├── server/     # Express-server (frackend, API-proxy, SSR-hosting)
│   └── common/     # Delt kode: typer, lokalisering, validering
├── package.json    # Root: monorepo-scripts og verktøy
└── pnpm-workspace.yaml
```

## Lokal utvikling

### Installere pnpm

Dette prosjektet bruker **pnpm** som package manager. Node.js kommer med Corepack som automatisk bruker riktig pnpm-versjon:

```bash
corepack enable
```

Corepack leser `packageManager`-feltet i `package.json` og installerer riktig versjon automatisk.

**Merk:** Når Corepack er aktivert, vil `npm`-kommandoer ikke fungere.

Kjører lokalt på [http://localhost:3005](http://localhost:3005)

#### Start i development mode:

`pnpm dev`

Starter både server og klient i watch-modus parallelt.

#### Start i production mode:

`pnpm prod-local`

#### Start dekoratøren lokalt:

`pnpm decorator`

Benytter prod-dekoratøren dersom den ikke kjører lokalt

### Formatering

Koden formateres med [oxfmt](https://oxc.rs/docs/guide/usage/formatter) (`pnpm format`, sjekk med `pnpm format:check`). Pre-commit-hooken formaterer stagede filer automatisk.

Commits som kun endrer formatering ligger i `.git-blame-ignore-revs`. GitHub hopper over dem i blame automatisk; lokalt må det slås på én gang:

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

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
