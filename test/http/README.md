# HTTP characterization suite (temporary)

Black-box tests against the built server. They pin today's HTTP behaviour, bugs included (marked "bug"), so that
changes to the server's runtime, framework and data loading show up as failing tests. A PR that changes behaviour on
purpose updates the expectations here and lists the change.

This suite is temporary. It's meant to be deleted once the same assurances exist in other forms, such as in-process
tests of the app and contract tests for the upstream fixtures. Until then it stays separate from the other tests:

- Nothing outside `test/http/` imports from it.
- It has its own Vitest config, and isn't a project in the root `vitest.config.ts`, so `pnpm test` never runs it.
- New behaviour gets tested next to its code, not here.

## Running

- `pnpm test:http` builds the app (`pretest:http` in `package.json`), then runs the suite.
- `pnpm exec vitest run --config test/http/vitest.config.ts` runs it against the existing build.
- `pnpm test:http -u` rewrites the golden files after an intended change. Review their diff before committing.

CI runs it in `pr-checks.yml` only (`post-build-commands`), never in the deploy workflows: those run `pnpm test`
between their build and the Docker build, and this suite rebuilds.

## How it works

| File                         | What it does                                                                                                                                                                                                                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `harness.ts`                 | Starts the build in `dist/` with `node --import preload.ts`, with a prod-like env and fake credentials. Waits for `isReady`; `stop()` sends SIGTERM. `request()` makes plain `node:http` requests, for headers `fetch()` changes (it adds `Cache-Control: no-cache` to conditional requests). |
| `preload.ts`                 | Runs in the server process. Sends every fetch to a non-loopback host to the stub.                                                                                                                                                                                                             |
| `stub.ts`                    | An HTTP server in the test process that records every request. Tests override answers per route with `on(ROUTES.…, () => response)`; `Response.error()` resets the connection. Requests nothing answers get a 599.                                                                            |
| `upstreams.ts`               | The fakes of every upstream (`test/upstream/fakes.ts`, which offline development uses too and stays when this suite goes) on the origins the harness configures the server with.                                                                                                              |
| `html.ts`                    | Parses pages (jsdom) and normalizes them for the goldens: attributes sorted, comments dropped, and CSS-module hashes, asset hashes and `useId` ids made stable, so only differences a user could notice show up.                                                                              |
| `boot.test.ts`               | Startup requests, startup failures, the decorator in and outside NAIS, shutdown.                                                                                                                                                                                                              |
| `api.test.ts`                | The `/api` routes.                                                                                                                                                                                                                                                                            |
| `metrics.test.ts`            | The Prometheus metrics.                                                                                                                                                                                                                                                                       |
| `pages.test.ts`              | The locale pages, the decorator in them, and failing to find the build.                                                                                                                                                                                                                       |
| `static.test.ts`             | The favicon, script and stylesheet.                                                                                                                                                                                                                                                           |
| `framework-defaults.test.ts` | Everything Hono does by default: content types, conditional requests, ranges, compression, routing, methods, query decoding. When the framework changes, this is the file that should change; the others pin the app's own behaviour.                                                         |
| `__goldens__/`               | Larger expected outputs: the startup requests, name searches, data dumps and pages. Not formatted by oxfmt.                                                                                                                                                                                   |

## Removing it

Delete `test/http/`, the `pretest:http` and `test:http` scripts and the `@types/jsdom` devDependency in `package.json`,
and `post-build-commands` in `.github/workflows/pr-checks.yml`.
