# Copilot instructions for nav-office-search

## Repository overview

This is a single TypeScript package for the Nav office search application:

- `client/`: Vite and React frontend with SSR and hydration.
- `server/`: Hono frackend: SSR hosting of the page, and an API that forwards the search to nav-office-search-api.
- `shared/`: Shared types, validation, normalization, and localization.
- `test/`: Upstream fixtures and fakes, and the offline development mocks.

`pnpm build` writes the client and the server's own code to `dist/`. The image has `dist/`, `package.json` and production `node_modules`.

Run commands from the repository root and use the pnpm version pinned in `package.json`.

## Common commands

| Task                                 | Command                                     |
| ------------------------------------ | ------------------------------------------- |
| Install dependencies                 | `corepack enable && pnpm install`           |
| Start development server             | `pnpm dev`                                  |
| Build and run local production (SSR) | `pnpm prod-local`                           |
| Run all tests (client and server)    | `pnpm test`                                 |
| Run a targeted test                  | `pnpm test --testNamePattern "<test name>"` |
| Format check, lint and type-check    | `pnpm lint`                                 |
| Build client and server to `dist/`   | `pnpm build`                                |

`pnpm dev` is Vite with `@hono/vite-dev-server`: server and client code both go through Vite (`server/dev.ts`), and pages are server-rendered there too. An edit in `client/` hot-reloads, and an edit in `server/` takes effect on the next request. `pnpm prod-local` runs the real build.

The build needs no environment variables. The server gets its configuration at runtime: from `.nais/config.yml` and `.nais/vars-*.yml` in a cluster, and from `.env.development` locally. `server/env.ts` validates it when the server starts, so a misconfigured pod crashes before it takes traffic. Import `env` from there rather than reading `process.env`. A new variable goes in its schema, `.nais/config.yml` and `.nais/vars-*.yml`, `.env.development`, and the `server` project's `env` in `vitest.config.ts`.

Dependency installation uses GitHub Packages for `@navikt/*` packages and requires configured npm authentication. The `minimumReleaseAge` quarantine for newly published packages is configured in `pnpm-workspace.yaml`.

## Implementation guidelines

- Put behavior shared by client and server in `shared/`.
- Imports carry their file extension. Use `./` for files in the same directory or below it, and the package imports in `package.json` (`#client/*`, `#server/*`, `#shared/*`, `#test/*`) for everything else.
- Use `import type` for type-only imports, and TypeScript that compiles by erasing types (no enums or parameter properties). `verbatimModuleSyntax` and `erasableSyntaxOnly` enforce this. Only `server/main.ts` and `server/dev.ts` import client code, and `server/dev.ts` is the only server code that imports Vite.
- Use the discriminated search result types in `shared/types/results.ts`. They are what nav-office-search-api's `/search` answers (its `server/search/results.ts`), so the two change together. UI-facing fetch failures are represented as `{ type: 'error' }`, optionally with `messageId` or `aborted`.
- Add localization keys to `shared/localization/modules/nb-default.tsx` first, then add the same key to `en.tsx` and `nn.tsx`. `shared/localization/types.ts` derives `LocaleModule` and `LocaleStringId` from the Bokmål module, and the locale-module map type-checks all locales. `LocaleProvider` sets Aksel's locale as well, so its built-in strings follow the page. The page title and description live in `shared/localization/meta.ts`, because the server renders them into the meta tags and must not load the locale modules' JSX.
- Keep client API URLs in `client/urls.ts` and external server URLs in `server/urls.ts`. Client URLs are relative to the host and `BASE_PATH` (`shared/basePath.ts`); do not hard-code app-local `/api` URLs in client code. Put URL parts together with `ufo` (`joinURL`, `withTrailingSlash`, `withoutBase`), never with template literals or `+`: an origin from the environment may end with a slash, and a path from an upstream may not start with one.
- API handlers in `server/api/endpoints` take plain values and return `{ status, body }`. `server/api/api.ts` is the only API code that knows about Hono, and the search route goes through `observeSearch` there. Test handlers in-process with `installUpstreams()` from `test/upstream/upstreams.ts` (see `endpoints.test.ts`), and routes, pages, static files and errors through `createApp` and `app.request()` (see `app.test.ts`).
- Client-facing API errors should use `apiErrorResponse` (`server/api/apiResponse.ts`).
- Outbound requests use a corgi client from `upstreamClient()` in `server/utils/upstream.ts`, which is `@navikt/navno-server`'s `createUpstreamClient` with this app's registry: it gives each request a timeout, and counts and times it in the metrics. It throws `HttpError` for a non-2xx answer, as corgi does. Check what the server reads of an upstream's answer with a schema (`transform: schema(…)`, as `server/external/auth.ts` does); the search's answer is passed on unread. Log a failed request with `failureOf(e)` from `@navikt/navno-server/upstream`, never the error itself: an `HttpError`'s message and URL have the query, which can be what someone searched for.
- The search box's state is a reducer, `client/components/SearchForm/searchFormState.ts`: what's below the field is one `Results` union (nothing, a spinner, offices, or address suggestions), with the live region's status and the error beside it. Add a transition there, with a test in `searchFormState.test.ts`, rather than another `useState`. Requests go through `createSearchApi()` (`client/utils/searchApi.ts`), and debouncing through `useDebouncedCallback`.
- Use Aksel components and current `--ax-*` design tokens. Preserve existing keyboard interaction, focus management, semantic HTML, and ARIA behavior when changing the search UI.
- The page is built in `server/site/ssr/document.ts` with `frame()` from `@itsy/html`; there is no `index.html`. It finds the client's files through the Vite manifest in production.
- The server build keeps dependencies external, apart from Aksel and zod (see `vite.config.ts`), so what the server and the app import at runtime must be in `dependencies`: the image gets `pnpm install --prod`. The page hydrates strictly, so what the server and the client's first render produce must match; browser-only values belong in effects.
- When updating React, keep `react` and `react-dom` in `package.json` aligned.

## Important behavior

- The server mounts site and API routes under `BASE_PATH` (`shared/basePath.ts`).
- Every search is one request, `GET {basePath}/api/search?query=`. `searchHandler` forwards it to nav-office-search-api's `/search` with the token, and passes the status and body on as they are, error answers included. Without an answer to pass on it answers `errorServerError` itself: 504 after a timeout, 502 otherwise. The token is an Entra ID token from Texas, NAIS's token service (`server/external/auth.ts`, `NAIS_TOKEN_ENDPOINT`). Texas keeps the token, so it is asked for every search and nothing is kept here; without a token the search answers that 502. What a query is (a postnummer, a name or an address) and which offices it finds is decided in the API. An address suggestion carries its office (`officeInfo`, or null when its area has none), so picking one makes no request.
- The server holds no data: it loads nothing at startup and runs nothing on a schedule. Search logic and the data it reads belong in nav-office-search-api, not here.
- In production, `server/main.ts` reads the client build's manifest and renders the app once for every locale before anything else (`server/site/ssr/prerender.ts`), so a broken build exits at boot and never takes traffic. That markup is kept, since a page is the same for everyone. A page request only takes the decorator and builds the document around the markup (`htmlRenderer.ts`); `@navikt/nav-dekoratoren-moduler` keeps the decorator and fetches it again when a new version is out, so there is no page cache here.
- An unknown path, and a request Hono refuses, gets a plain-text 404 (`server/utils/errorHandlers.ts`). The server is started with `serve()` from `@navikt/navno-server` (`server/main.ts`), which has the team's keep-alive (15 s) and its shutdown on SIGTERM and SIGINT; the package's `docs/graceful-shutdown.md` says what it does and why. Don't add signal handlers, sleeps or timeouts of the app's own. It finds the build through the `#dist/*` package import, so it doesn't matter where the server is started from. Vite is a devDependency, imported only in `server/dev.ts`.
- The probes and the Prometheus metrics are `internal()` from `@navikt/navno-server`, mounted in `server/app.ts` at `/internal` (`/alive`, `/ready`, `/metrics`): outside the base path, so only NAIS reaches them (`.nais/config.yml`). The metrics are defined in `server/metrics/metrics.ts` with the `nav_office_search_` prefix. New outbound requests are counted by `upstreamClient()` under the name it is given, and new search routes go through `observeSearch`, which counts a search by its status alone: what it found is counted in nav-office-search-api, and alerted on there. Keep label values to small fixed sets.
- `pnpm dev` and `pnpm prod-local` run offline: `test/mocks/dev.ts` is loaded with `--import` and makes corgi's `mockFetch` the global `fetch`, answering the server's outbound requests with the fakes in `test/upstream/fakes.ts`. Anything they don't know, like the decorator, goes to the network, and `MOCKS=false` turns the mocks off. The search is faked from a recording of the API's answers to a set of queries; requests to localhost are never faked, so `API_ORIGIN=http://localhost:3003 pnpm dev` searches in nav-office-search-api's own `pnpm dev`. Nothing from `test/` is in the image.

## Validation and deployment

- Use the smallest relevant Vitest test while developing (`pnpm test -t '<name>'`, or `--project client` / `--project server`). The root `vitest.config.ts` runs two projects: `client` (jsdom, `client/`) and `server` (node, `server/`, `shared/` and `vite-plugins/`). Test files sit next to the code they test, except the client UI tests in `client/__tests__`. Import test APIs explicitly from `vitest`; globals are not enabled. The one `tsconfig.json` only type-checks everything, tests included; Vite does the building. It has both the DOM and Node types, so it won't stop the client from using `process` or the server from using `document`.
- Client tests answer the `/api/*` endpoints with corgi's `mockFetch` (`mockApi`, which also takes a pending promise such as `Promise.withResolvers<Reply>().promise` to hold a request in flight, and the `apiRequests()` log in `client/__tests__/support/api.ts`), typed fixture builders in `support/fixtures.ts`, and fake timers with the real 500 ms debounce. Drive the UI with `userEvent`, not `fireEvent`. Unmocked API requests fail the test.
- `test/fixtures/upstream/` holds nav-office-search-api's recorded answers to `/search` (see its README). Don't put values computed by this app in there.
- `test/upstream/fakes.ts` fakes every upstream, the search from that recording. Node loads it directly in development, so it can only import built-ins and use TypeScript Node can strip.
- Format touched files with oxfmt (`pnpm format`, check with `pnpm format:check`). Linting is oxlint (`oxlint.config.ts`), type-aware through `oxlint-tsgolint`; `pnpm lint` is `oxfmt --check`, `oxlint` and `tsc`. An exception to a rule goes in the config with its reason, or at a single site as `// oxlint-disable-next-line <rule> -- <reason>`. The pre-commit hook runs `lint-staged`, which formats staged files with oxfmt and lints the JS and TS among them with oxlint, while the pre-push hook runs `pnpm lint`.
- Run `pnpm lint`, `pnpm test`, and `pnpm build` for changes that affect runtime, SSR, or build behavior.
- CI uses the shared reusable workflows in `navikt/navno-ci`; the build runs `pnpm build`, `pnpm lint`, and `pnpm test`. Pull requests run `pr-checks.yml`. The image has `dist/`, `package.json` and production `node_modules` (`Dockerfile`). A push to `main` deploys to production via `build-deploy-prod.yml` and creates a release that records the image for `rollback.prod.yml`. `base-image-refresh.yml` rebuilds and redeploys prod weekly.
- NAIS template variables, including `basePath` and the origins the server reads, live in `.nais/vars-*.yml` (`test/nais.test.ts` checks them); the workflows pass only `image`.

## Generated and local files

- Do not edit `dist/`; it is generated by `pnpm build`. That includes the `.br` and `.gz` files `vite-plugins/precompressAssets.ts` writes next to scripts and stylesheets of 1 KB or more, which `server/site/site.ts` serves through `serveStatic`'s `precompressed` option. Everything else is compressed on the fly by `compress()` in `server/app.ts`, which only does gzip and deflate.
- `.env.development` is tracked and has no real secrets. `pnpm dev` and `pnpm start` pass it to Node with `--env-file`; variables already in the environment win.
- Never commit secrets.
