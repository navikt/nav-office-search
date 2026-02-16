# NAV Office Search - Copilot Instructions

## Project Overview

Web application for searching Norwegian NAV (Labour and Welfare Administration) offices by postal code or place name. Uses server-side rendering (SSR) with Preact/React and an Express backend.

**Key dependency**: [nav-office-search-api](https://github.com/navikt/nav-office-search-api) provides proxied access to TPS and norg services. Local development uses mocks.

## Build, Test, and Lint Commands

### Development
```bash
pnpm dev              # Start in development mode (localhost:3005)
pnpm prod-local       # Start in production mode locally
pnpm decorator        # Start NAV decorator locally (optional, falls back to prod decorator)
```

### Build
```bash
pnpm build            # Full build: typecheck + client + SSR + server
pnpm typeCheck        # TypeScript type checking only
```

### Testing
```bash
pnpm test                 # Run all Jest tests
# Run single test: npx jest src/__tests__/OfficeSearch.test.tsx
```

### Linting
```bash
pnpm lint             # ESLint all files
```

### Pre-commit hooks (Husky)
- `pre-commit`: Prettier formatting via lint-staged
- `pre-push`: TypeScript type check + ESLint

## Architecture

### Workspace Structure
This is a **pnpm workspace** with two packages:
- **Root**: Frontend (Vite + Preact/React)
- **server/**: Backend (Express server)

Both packages must be built for production deployment.

### Frontend (Preact/React Compat)
- **Framework**: Uses Preact with React compatibility layer (`@preact/preset-vite`)
- **React modules** from `@navikt/ds-react` work via preact/compat
- **Entry points**:
  - `src/main-client.tsx`: Hydrates SSR content on client
  - `src/main-server.tsx`: Server-side rendering export
- **Routing**: Language switching handled by NAV decorator (`@navikt/nav-dekoratoren-moduler`)

### Backend (Express + SSR)
- **Port**: 3005
- **Base path**: Set via `VITE_APP_BASEPATH` env variable
- **Server entry**: `server/src/server.ts`
- **Routes**:
  - `server/src/api/registerApiRoutes.ts`: API endpoints under `/api`
  - `server/src/site/registerSiteRoutes.ts`: SSR routes for main app
- **SSR rendering**:
  - Production: `server/src/site/ssr/htmlRenderer.ts` → `prodRender()`
  - Development: Uses CSR (client-side rendering) due to Vite dev + preact/compat incompatibility
- **Data loading**: `server/src/data/data.ts` initializes and schedules data updates

### Shared Code
- **common/**: Shared between frontend and backend
  - `common/localization/`: i18n strings and types (`AppLocale` = 'nb' | 'nn' | 'en')
  - `common/decoratorParams.ts`: NAV decorator configuration
  - `common/validateInput.ts`: Input validation logic

### External Services
- **server/src/external/**: API clients for external services (TPS, norg)
- **server/src/_mock/**: Mock data for local development

## Key Conventions

### Localization
- Three locales: Norwegian Bokmål (`nb`), Norwegian Nynorsk (`nn`), English (`en`)
- Type: `AppLocale` from `common/localization/types.ts`
- Strings: `localeString(key, locale)` function from `common/localization/localeString.ts`
- Language switching updates URL, document title, and decorator params

### Styling
- **NAV Design System**: `@navikt/ds-react` components and `@navikt/ds-css` for styles
- **CSS Modules**: Component-specific styles (e.g., `OfficeSearch.module.css`)
- **Global styles**: `src/global.css` imported early for specificity
- **Prettier config**: 4-space indent, single quotes, trailing commas ES5

### Testing
- **Framework**: Jest with `ts-jest` preset
- **Environment**: jsdom
- **Mocking**: `jest-fetch-mock` for API calls, `identity-obj-proxy` for CSS modules
- **Test location**: `src/__tests__/`
- Mock `lodash.debounce` to run synchronously in tests

### Dependencies Version Constraints
Several packages are pinned to specific versions (see package.json `dependenciesComments`):
- `fetch-mock`: Locked to 11.1.5
- `express`: Locked to 5.x (server package)
- `@types/express`: Locked to 5.0.6 (server package)
- `@types/node`: Locked to 24.x range (server package)

Do not upgrade these without investigation.

### Code Quality
- **TypeScript**: Strict mode enabled
- **ESLint**: TypeScript + React rules, ignores build artifacts
- **React prop-types**: Disabled (using TypeScript instead)
- **Unused vars**: Warning for non-underscore prefixed vars

### Deployment
- **Container**: Dockerfile builds Node 24 Alpine image
- **NAIS**: `.nais/` contains Kubernetes deployment configs
- **Environments**:
  - Dev: https://www.ansatt.dev.nav.no/sok-nav-kontor
  - Prod: Auto-deploy on merge to main

### Environment Variables
- `.env.development`: Development mode settings
- `.env.local-prod`: Local production mode settings
- Server loads via `dotenv` package at startup
