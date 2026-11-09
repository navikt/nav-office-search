# Copilot instructions for nav-office-search

## Repository overview

This is a single TypeScript package for the Nav office search application:

- `client/`: Vite and React frontend with SSR and hydration.
- `server/`: Hono frackend, API routes, external-service integration, data loading, and SSR hosting.
- `shared/`: Shared types, validation, normalization, and localization.
- `test/`: Upstream fixtures and fakes, the offline development mocks, and the temporary HTTP suite.

`pnpm build` writes the client and the server's own code to `dist/`. The image has `dist/`, `package.json` and production `node_modules`.

Run commands from the repository root and use the pnpm version pinned in `package.json`.

## Common commands

| Task                                 | Command                                     |
| ------------------------------------ | ------------------------------------------- |
| Install dependencies                 | `corepack enable && pnpm install`           |
| Start development server             | `pnpm dev`                                  |
| Build and run local production (SSR) | `pnpm prod-local`                           |
| Run all tests (client and server)    | `pnpm test`                                 |
| Build, then run the HTTP suite       | `pnpm test:http`                            |
| Run a targeted test                  | `pnpm test --testNamePattern "<test name>"` |
| Lint and type-check                  | `pnpm lint`                                 |
| Build client and server to `dist/`   | `pnpm build`                                |

`pnpm dev` is Vite with `@hono/vite-dev-server`: server and client code both go through Vite (`server/dev.ts`), and pages are server-rendered there too. An edit in `client/` hot-reloads, and an edit in `server/` takes effect on the next request. `pnpm prod-local` runs the real build.

The build needs no environment variables. The server gets its configuration at runtime: from `.nais/config.yml` and `.nais/vars-*.yml` in a cluster, and from `.env.development` locally. `server/env.ts` validates it when the server starts, so a misconfigured pod crashes before it takes traffic. Import `env` from there rather than reading `process.env`. A new variable goes in its schema, `.nais/config.yml` and `.nais/vars-*.yml`, `.env.development`, and the `server` project's `env` in `vitest.config.ts`.

Dependency installation uses GitHub Packages for `@navikt/*` packages and requires configured npm authentication. The `minimumReleaseAge` quarantine for newly published packages is configured in `pnpm-workspace.yaml`.

## Implementation guidelines

- Put behavior shared by client and server in `shared/`.
- Imports carry their file extension. Use `./` for files in the same directory or below it, and the package imports in `package.json` (`#client/*`, `#server/*`, `#shared/*`, `#test/*`) for everything else.
- Use `import type` for type-only imports, and TypeScript that compiles by erasing types (no enums or parameter properties). `verbatimModuleSyntax` and `erasableSyntaxOnly` enforce this. Only `server/main.ts` and `server/dev.ts` import client code, and `server/dev.ts` is the only server code that imports Vite.
- Use the discriminated search result types in `shared/types/results.ts`. UI-facing fetch failures are represented as `{ type: 'error' }`, optionally with `messageId` or `aborted`.
- Add localization keys to `shared/localization/modules/nb-default.tsx` first, then add the same key to `en.tsx` and `nn.tsx`. `shared/localization/types.ts` derives `LocaleModule` and `LocaleStringId` from the Bokmål module, and the locale-module map type-checks all locales. `LocaleProvider` sets Aksel's locale as well, so its built-in strings follow the page. The page title and description live in `shared/localization/meta.ts`, because the server renders them into the meta tags and must not load the locale modules' JSX.
- Keep client API URLs in `client/urls.ts` and external server URLs in `server/urls.ts`. Client URLs are relative to the host and `BASE_PATH` (`shared/basePath.ts`); do not hard-code app-local `/api` URLs in client code.
- API handlers in `server/api/endpoints` take plain values and return `{ status, body }`. `server/api/api.ts` is the only API code that knows about Hono, and search routes go through `observeSearch` there. Test handlers in-process with `test/upstream/mswServer.ts` (see `endpoints.test.ts`), and routes, pages, static files and errors through `createApp` and `app.request()` (see `app.test.ts`).
- Client-facing API errors should use `apiErrorResponse`. Use `fetchErrorResponse` only for failures from server-side external requests.
- Use Aksel components and current `--ax-*` design tokens. Preserve existing keyboard interaction, focus management, semantic HTML, and ARIA behavior when changing the search UI.
- The page is built in `server/site/ssr/document.ts` with `frame()` from `@itsy/html`; there is no `index.html`. It finds the client's files through the Vite manifest in production.
- The server build keeps dependencies external, apart from Aksel and zod (see `vite.config.ts`), so what the server and the app import at runtime must be in `dependencies`: the image gets `pnpm install --prod`. The page hydrates strictly, so what the server and the client's first render produce must match; browser-only values belong in effects.
- When updating React, keep `react` and `react-dom` in `package.json` aligned.

## Important behavior

- The server mounts site and API routes under `BASE_PATH` (`shared/basePath.ts`).
- Four-digit queries go to `/api/search`, which dispatches to the postnummer handler. Other text goes to `/api/search/name` and falls back to `/api/search/address` when there are no name hits; selecting an address resolves offices through `/api/geoid`.
- The initial reference-data load must resolve before routes are registered. A rejected initial load must fail startup; successful loads are refreshed daily.
- In production, `server/main.ts` reads the client build's manifest and renders every locale before anything else (`server/site/ssr/selfCheck.ts`), so a broken build exits at boot and never takes traffic. It finds the build through the `#dist/*` package import, so it doesn't matter where the server is started from. Vite is a devDependency, imported only in `server/dev.ts`.
- Prometheus metrics are served at `{basePath}/api/internal/metrics` and scraped by NAIS (`spec.prometheus`). They are defined in `server/metrics/metrics.ts` with the `nav_office_search_` prefix. Wrap new outbound requests in `observeUpstream` (`fetchJson` already does) and new search routes in `observeSearch`, and keep label values to small fixed sets.
- `pnpm dev` and `pnpm prod-local` run offline: `test/mocks/dev.ts` is loaded with `--import` and answers the server's outbound requests with MSW, using the fakes in `test/upstream/fakes.ts`. Anything they don't know, like the decorator, goes to the network, and `MOCKS=false` turns the mocks off. Nothing from `test/` is in the image.

## Validation and deployment

- Use the smallest relevant Vitest test while developing (`pnpm test -t '<name>'`, or `--project client` / `--project server`). The root `vitest.config.ts` runs two projects: `client` (jsdom, `client/`) and `server` (node, `server/`, `shared/` and `vite-plugins/`). Test files sit next to the code they test, except the client UI tests in `client/__tests__`. Import test APIs explicitly from `vitest`; globals are not enabled. The one `tsconfig.json` only type-checks everything, tests included; Vite does the building. It has both the DOM and Node types, so it won't stop the client from using `process` or the server from using `document`.
- Client tests use msw handlers for the `/api/*` endpoints (`mockApi`, which also takes a pending promise such as `Promise.withResolvers<Reply>().promise` to hold a request in flight, and the `apiRequests()` log in `client/__tests__/support/msw.ts`), typed fixture builders in `support/fixtures.ts`, and fake timers with the real 500 ms debounce. Drive the UI with `userEvent`, not `fireEvent`. Unmocked API requests fail the test.
- `test/fixtures/upstream/` holds the upstream services' responses in their own wire format (see its README). Don't put values computed by this app in there.
- `test/upstream/fakes.ts` fakes every upstream from those fixtures. Node loads it directly in development, so it can only import built-ins and use TypeScript Node can strip.
- `test/http/` is a temporary black-box suite against the built server (see its README). It has its own Vitest config and is not part of `pnpm test`; `pnpm test:http` builds first. Don't import from it or add tests for new behaviour there. The framework's own defaults are pinned only in its `framework-defaults.test.ts`. When a change alters behaviour it pins on purpose, update its expectations (`pnpm test:http -u` rewrites the golden files) and list the change in the PR.
- Format touched files with oxfmt (`pnpm format`, check with `pnpm format:check`). The pre-commit hook runs `lint-staged`, which formats staged files with oxfmt, while the pre-push hook runs `pnpm lint`.
- Run `pnpm lint`, `pnpm test`, and `pnpm build` for changes that affect runtime, SSR, or build behavior.
- CI uses the shared reusable workflows in `navikt/navno-ci`; the build runs `pnpm build`, `pnpm lint`, and `pnpm test`. Pull requests run `pr-checks.yml`, which also runs `pnpm test:http`. The image has `dist/`, `package.json` and production `node_modules` (`Dockerfile`). A push to `main` deploys to production via `build-deploy-prod.yml` and creates a release that records the image for `rollback.prod.yml`. `base-image-refresh.yml` rebuilds and redeploys prod weekly.
- NAIS template variables, including `basePath` and the origins the server reads, live in `.nais/vars-*.yml` (`test/nais.test.ts` checks them); the workflows pass only `image`.

## Generated and local files

- Do not edit `dist/`; it is generated by `pnpm build`. That includes the `.br` and `.gz` files `vite-plugins/precompressAssets.ts` writes next to scripts and stylesheets of 1 KB or more, which `server/site/site.ts` serves through `serveStatic`'s `precompressed` option. Everything else is compressed on the fly by `compress()` in `server/app.ts`, which only does gzip and deflate.
- `.env.development` is tracked and has no real secrets. `pnpm dev` and `pnpm start` pass it to Node with `--env-file`; variables already in the environment win.
- Never commit secrets.
