# Copilot instructions for nav-office-search

## Repository overview

This is a TypeScript pnpm workspace for the Nav office search application:

- `packages/client`: Vite and Preact frontend with SSR and hydration.
- `packages/server`: Express frackend, API routes, external-service integration, data loading, and SSR hosting.
- `packages/common`: Shared types, validation, normalization, and localization.

Run commands from the repository root and use the pnpm version pinned in `package.json`.

## Common commands

| Task                                 | Command                                     |
| ------------------------------------ | ------------------------------------------- |
| Install dependencies                 | `corepack enable && pnpm install`           |
| Start development server             | `pnpm dev`                                  |
| Build and run local production (SSR) | `pnpm build && pnpm prod-local`             |
| Start local decorator                | `pnpm decorator`                            |
| Run all tests (client and unit)      | `pnpm test`                                 |
| Run a targeted test                  | `pnpm test --testNamePattern "<test name>"` |
| Lint and type-check                  | `pnpm lint`                                 |
| Build client, SSR bundle, and server | `pnpm build`                                |

The development server uses client-side rendering because Vite development SSR is disabled. Use local production mode to verify SSR or hydration changes.

`packages/client/vite.config.ts` loads production build variables from a repository-root `.env`, which CI also generates. Set `VITE_APP_ORIGIN`, `VITE_APP_BASEPATH`, `VITE_XP_ORIGIN`, and `VITE_NAVNO_ORIGIN` before building locally; missing values can produce incorrect asset and API URLs without failing the build.

Dependency installation uses GitHub Packages for `@navikt/*` packages and requires configured npm authentication. Shared dependency versions (`catalog:`) and the `minimumReleaseAge` quarantine for newly published packages are configured in `pnpm-workspace.yaml`.

## Implementation guidelines

- Put behavior shared by client and server in `packages/common`.
- Import shared code through relative paths such as `../../common/types/results`; both client and server compile `packages/common` directly, and the server does not depend on the `nav-office-search-common` package name.
- Use the discriminated search result types in `packages/common/types/results.ts`. UI-facing fetch failures are represented as `{ type: 'error' }`, optionally with `messageId` or `aborted`.
- Add localization keys to `packages/common/localization/modules/nb-default.tsx` first, then add the same key to `en.tsx` and `nn.tsx`. `packages/common/localization/types.ts` derives `LocaleModule` and `LocaleStringId` from the Bokmål module, and the locale-module map type-checks all locales.
- Keep client API URLs in `packages/client/src/urls.ts` and external server URLs in `packages/server/src/urls.ts`. Respect `VITE_APP_ORIGIN` and `VITE_APP_BASEPATH`; do not hard-code app-local `/api` URLs in client code.
- Client-facing API errors should use `apiErrorResponse`. Use `fetchErrorResponse` only for failures from server-side external requests.
- Use Aksel components and current `--ax-*` design tokens. Preserve existing keyboard interaction, focus management, semantic HTML, and ARIA behavior when changing the search UI.
- Remember that the client is Preact-based despite React-compatible imports. Preserve the Preact Vite preset, React/Preact dependency deduplication, `ssr.noExternal`, and basepath configuration in `packages/client/vite.config.ts`.
- When updating React, keep the catalog version in `pnpm-workspace.yaml`, `react-dom` in `packages/client/package.json`, and the `react-x` version in `eslint.config.js` aligned.

## Important behavior

- The server mounts site and API routes under `VITE_APP_BASEPATH`.
- Four-digit queries go to `/api/search`, which dispatches to the postnummer handler. Other text goes to `/api/search/name` and falls back to `/api/search/address` when there are no name hits; selecting an address resolves offices through `/api/geoid`.
- The initial reference-data load must resolve before routes are registered. A rejected initial load must fail startup; successful loads are refreshed daily.
- Prometheus metrics are served at `{basePath}/api/internal/metrics` and scraped by NAIS (`spec.prometheus`). They are defined in `packages/server/src/metrics/metrics.ts` with the `nav_office_search_` prefix. Wrap new outbound requests in `observeUpstream` (`fetchJson` already does), and keep label values to small fixed sets.
- When `ENV=localhost`, requests made through `fetchJson` use the sandbox in `packages/server/src/_mock/fetchMock.ts`; unmatched requests fall back to the network. Direct `fetch` calls are not mocked.

## Validation and deployment

- Use the smallest relevant Vitest test while developing (`pnpm test -t '<name>'`, or `--project client` / `--project unit`). The root `vitest.config.ts` runs two projects: `client` (jsdom, `packages/client/vitest.config.ts`) and `unit` (node, `packages/common/**/*.test.ts` and `packages/server/src/**/*.test.ts`). Test files sit next to the code they test, except the client UI tests in `packages/client/src/__tests__`. Import test APIs explicitly from `vitest`; globals are not enabled. Test files outside the client are type-checked by `tsconfig.test.json` and excluded from the package tsconfigs, so the server build never emits them.
- Client tests use msw handlers for the `/api/*` endpoints (`mockApi`, which also takes a pending promise such as `Promise.withResolvers<Reply>().promise` to hold a request in flight, and the `apiRequests()` log in `src/__tests__/support/msw.ts`), typed fixture builders in `support/fixtures.ts`, and fake timers with the real 500 ms debounce. Drive the UI with `userEvent`, not `fireEvent`. Unmocked API requests fail the test.
- `test/fixtures/upstream/` holds the upstream services' responses in their own wire format (see its README). Don't put values computed by this app in there.
- Format touched files with oxfmt (`pnpm format`, check with `pnpm format:check`). The pre-commit hook runs `lint-staged`, which formats staged files with oxfmt, while the pre-push hook runs `pnpm lint`.
- Run `pnpm lint`, `pnpm test`, and `pnpm build` for changes that cross package boundaries or affect runtime, SSR, or build behavior.
- CI uses the shared reusable workflows in `navikt/navno-ci`; the build runs `pnpm build`, `pnpm lint`, and `pnpm test`. Pull requests run `pr-checks.yml`. A push to `main` deploys to production via `build-deploy-prod.yml` and creates a release that records the image for `rollback.prod.yml`. `base-image-refresh.yml` rebuilds and redeploys prod weekly.
- NAIS template variables, including `basePath`, live in `.nais/vars-*.yml`; the workflows pass only `image`.

## Generated and local files

- Do not edit `packages/server/frontendDist`; it is generated by the client build.
- `packages/server/.env.development` and `.env.local-prod` are tracked sources copied to the generated, gitignored `packages/server/.env` by `pnpm dev` and `pnpm prod-local`.
- `packages/client/.env.development` is read by the Vite development server. Production client builds read the repository-root `.env`, not `packages/client/.env.local-prod`.
- Do not edit or commit generated `.env` files.
- Never commit secrets.
