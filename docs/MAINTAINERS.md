# Maintainer Guide

This guide is for engineers maintaining the Shade frontend, especially engineers who are still learning the
project and its tools. It explains how the application starts, where code belongs, how the files work together,
and how to check a change before sharing it.

## Start Here

Shade is a React single-page application built with TypeScript and Vite. It is the browser UI for a personal
home-library FastAPI backend. The application includes the shared shell, runtime configuration, connection flow,
typed OpenAPI + React Query server state, diagnostics, and the full V1 product surface (Home, About, Dashboard,
Books, create/edit/delete/reading/checkout, Loans check-in, Shelves, Wishlists, Collections, covers, scanning,
bulk selection/move, CI, container preview, and versioned release packing). Product routes use dedicated page
components; `RoutePlaceholder.tsx` exists only as an unused helper.

When `docs/tickets/` holds only `.gitkeep`, no sequenced feature ticket is open -- ask which work to take next
rather than inventing a follow-on feature. Prefer ticket presence under `docs/tickets/` over `docs/ToDo.md` when
judging what is still open (the checklist can lag).

The most useful commands are:

```sh
nvm use
corepack enable
make install
make run
```

`make run` starts the local development server. Before considering a change complete, run:

```sh
make check
```

This command is the canonical local and CI quality gate. It runs linting, type checking, generated OpenAPI drift
checking, Vitest with enforced coverage thresholds, Playwright browser/accessibility tests, a production build, and
the main-entry bundle-size check. GitHub Actions runs the same gate for pull requests and pushes to `main`.

Stack highlights: React 19, TypeScript 6 (strict), Vite 8, React Router 7, TanStack React Query 5, Vitest with
jsdom, Playwright + axe, Yarn 4.18.0 via Corepack, and Node.js 26.7.0. There is no Next.js, Tailwind, component
library, or form library.

## How the Application Works

The browser follows this path when it loads the application:

```text
index.html
  -> /config.js (sets window.__SHADE_CONFIG__)
  -> src/main.tsx
       -> readApiToken() (fail fast when missing)
       -> readRuntimeConfig()
            -> on failure: RuntimeConfigScreen (retry)
            -> on success:
                 createDiagnosticReporter(runtime diagnostics + APP_VERSION from package.json)
                 RootErrorBoundary (reports redacted render failures)
                   -> AppProviders (shared DiagnosticReporter)
                        -> NotificationsProvider
                        -> QueryClientProvider (createQueryClient())
                        -> ConnectionProvider (createApiClient + onRequestFailure, token, GET /health)
                             -> RouterProvider(router from src/routes/routes.tsx)
                                  -> AppShell (layout route)
                                       -> feature route pages via Outlet
       -> src/index.css
            -> src/styles/tokens.css
            -> src/styles/base.css
            -> src/styles/shell.css
            -> src/styles/components.css
```

`index.html` creates the `#root` mount point, loads `/config.js`, then loads `src/main.tsx`. When runtime config is
valid, the bootstrap module creates a `DiagnosticReporter`, then renders `RouterProvider` inside `RootErrorBoundary`
and `AppProviders` in `StrictMode`. Missing or malformed config shows `RuntimeConfigScreen` instead of the shell.

`AppShell` owns document title updates (`{route title}` plus an em dash and ` Shade`), skip link, primary navigation
(Dashboard link; Collection `DrawerNavMenu` Browse/Manage/Collections/Wishlists; Circulation `DrawerNavMenu` Loans
only; brand link to Home `/`), the main `Outlet`, footer (`Release` from `package.json` `version` via `APP_VERSION`,
plus API version from public `GET /version` when available), and heading focus after client-side navigations. Feature
routes under `src/features/*/routes/` own product UI. See `docs/AGENTS.md` for the full route and feature inventory.

Vite handles the development server and production bundling. TypeScript checks the code but does not create
JavaScript files itself; Vite performs that transformation during development and builds. The CSS import order is
intentional: later layers use tokens and defaults declared by earlier layers.

## Backend Contract (Maintainer Notes)

The backend is a separate repository. Default local API base is `http://127.0.0.1:8000` with **no** `/api` prefix.
Treat these as complementary sources of truth:

- `docs/technical-reference/openapi.json`: paths, methods, status codes, request/response schemas, enums, nullability
  (OpenAPI 3.1; LibraryV2; currently `info.version` `0.2.11`)
- `docs/technical-reference/API-for-FE.md`: behavioral guidance OpenAPI does not fully express (auth, CORS, lifecycle
  rules, covers **200** image bytes / multipart semantics, SQL backup handling)

Authentication uses a shared Bearer token (`Authorization: Bearer <API_SECRET_KEY>`) plus
`Library-Username: shade` on protected requests. There are no user accounts.
Missing or invalid credentials return `403` (describe generically as "API access was rejected"). The token is read
from the repository-root `.env` file as `VITE_API_SECRET_KEY` and injected at dev-server and build time (embedded in
JS bundles). Missing or blank env values throw at bootstrap. Confirmed `403` shows a page-level error without clearing
the query cache or redirecting to a settings screen.

Never simulate lifecycle operations with a generic `PATCH`. Use the dedicated endpoints (create, edit, delete,
restore, checkout, check-in, mark-read, bulk shelf move, cover upload/delete, ISBN lookup). Authenticated SQL backup
(`GET /backup`) is an API-host concern, not a SPA caller. Prefer regenerating `src/api/generated/openapi.ts`
with `yarn api:generate` rather than hand-editing it.

## Project Structure

The summaries below cover every project-owned file outside `docs/`. Generated directories such as
`node_modules/`, `dist/`, `coverage/`, `.vite/`, `.yarn/`, and `.git/` are intentionally omitted because tools
recreate them. Prefer `docs/AGENTS.md` for the exhaustive inventory when editing a specific module.

### Browser Application

- `index.html`: Vite's HTML entrypoint. Defines page metadata, creates `#root`, loads `/config.js`, then
  `src/main.tsx`.
- `public/config.js`: Runtime config assigned to `window.__SHADE_CONFIG__` (`apiBaseUrl`, optional
  `diagnostics: { enabled, endpoint }`). Not bundled; edit for local or deployed environments. Diagnostics default
  disabled. Application release comes from `package.json` `version` (`APP_VERSION`), not runtime config.
- `src/main.tsx`: Browser bootstrap. Calls `readApiToken()` (throws when missing), reads runtime config, either mounts
  `RuntimeConfigScreen` or creates `createDiagnosticReporter` then mounts `RootErrorBoundary` -> `AppProviders` ->
  `RouterProvider` in `StrictMode`, and imports global CSS.
- `src/AppProviders.tsx`: Application-wide providers. Wraps `NotificationsProvider`, `QueryClientProvider`
  (`createQueryClient()`), and `ConnectionProvider` (requires validated `runtimeConfig` and shared
  `diagnosticReporter`).
- `src/RootErrorBoundary.tsx`: Class error boundary with a recoverable fallback (retry and return home); reports
  redacted render failures through the diagnostic reporter.
- `src/vite-env.d.ts`: Adds Vite client, asset, `__APP_VERSION__`, and `window.__SHADE_CONFIG__` declarations to
  TypeScript. It has no runtime behavior.

### Runtime Configuration and Diagnostics

- `src/config/appVersion.ts`: Exports `APP_VERSION` from `package.json` `version`.
- `src/config/runtimeConfig.ts`: Validates and normalizes `apiBaseUrl` and optional `diagnostics`; throws
  `RuntimeConfigError`.
- `src/config/runtimeConfigState.ts`: `readRuntimeConfig()` returns `{ config, error }` without throwing.
- `src/config/RuntimeConfigScreen.tsx`: Blocking UI when config is missing or invalid, with retry.
- `src/config/apiToken.ts`: `readApiToken()` from `VITE_API_SECRET_KEY`; throws at bootstrap when missing/blank.
- `src/diagnostics/diagnosticReporter.ts`: Allowlisted/redacted API and render failure reporting; defaults disabled
  via `public/config.js`.

### API Layer

- `src/api/generated/openapi.ts`: Generated OpenAPI types. Do not hand-edit; use `yarn api:generate` /
  `yarn api:check`.
- `src/api/apiTypes.ts`: Exported schema aliases for books, loans, dashboard reports, shelves, categories,
  wishlists, collections, bulk shelf move, covers (`cover_image_path` filename only), health, version, and errors.
- `src/api/apiClient.ts`: `createApiClient` with Bearer and `Library-Username: shade` injection, timeout, abort,
  JSON helpers, authenticated `get` / `request` for non-JSON bodies (covers, backup verification), `403` handling,
  and optional `onRequestFailure` diagnostics.
- `src/api/apiErrors.ts` / `apiRedaction.ts` / `requestFields.ts` / `dateTime.ts` / `queryKeys.ts` / `guid.ts` /
  `bookIdentity.ts` / `enumDisplay.ts`: Shared error mapping, redaction, request pickers, date normalizers, React
  Query keys, GUID helpers, and safe enum display.
- `src/api/api.ts`: `createApi` aggregates typed helpers (`books`, `loans`, `dashboard`, `shelves`, `categories`,
  `wishlists`, `collections`, `health`, `version`) plus the underlying `client`.
- Typed route helpers and React Query hooks live beside each domain (`booksApi` / `booksQueries`, `loansApi` /
  `loansQueries`, `dashboardApi` / `dashboardQueries`, `shelvesApi` / `shelvesQueries`, `categoriesApi` /
  `categoriesQueries`, `wishlistsApi` / `wishlistsQueries`, `collectionsApi` / `collectionsQueries`,
  `healthApi`, `versionApi`). Books helpers include list filters, infinite lists, bulk `moveToShelf`, and cover
  get/upload/remove.

### Routing and Layout

- `src/routes/routeMetadata.ts`: Path, document-title fragment, and heading metadata for every registered route.
- `src/routes/routes.tsx`: `createBrowserRouter` configuration. `AppShell` is the parent layout. Registered paths
  include `/`, `/about`, `/dashboard`, `/books`, `/books/new`, `/books/:bookId`, `/books/:bookId/edit`,
  `/books/:bookId/delete`, `/books/:bookId/mark-read`, `/books/:bookId/reading`, `/collection/manage`,
  `/collections`, `/wishlists`, `/shelves`, `/loans`, `/admin/deleted`, `/checkout` and `/checkin` (compatibility
  redirects), and `*` (not found).
- `src/routes/LegacyCheckoutRedirect.tsx` / `LegacyCheckinRedirect.tsx`: Compatibility redirects only (not product
  pages).
- `src/routes/RoutePlaceholder.tsx`: Unused helper (`h1` with `tabIndex={-1}`); keep only if a future ticket needs a
  temporary placeholder.
- `src/routes/NotFoundPage.tsx`: Not-found message plus a link home (`/`).
- `src/routes/createMemoryRouter.ts`: Exports `createTestRouter` for tests.
- `src/layout/AppShell.tsx` / `DrawerNavMenu.tsx`: Application frame and accessible drawer menus for Collection and
  Circulation.

### Feature Modules

Route ownership under `src/features/*/routes/`. Product domains include:

- `home` / `about`: discovery Home and library About + Catalog Guide
- `dashboard`: summary, breakdowns, incomplete-metadata healing, deep links into Books
- `books`: collection browse/filters/bulk move, detail, create/edit/delete, reading, covers, checkout dialog
- `collection`: Manage Collection hub
- `collections` / `wishlists`: curated lists and unshelved wishlist flows (including move-to-shelf)
- `shelves`: shelf catalog CRUD and `by_shelf` counts
- `loans`: check-in and loan history
- `scanning`: camera (create only) and hardware collection ISBN jump
- `connection`: reachability and API client ownership

See `docs/AGENTS.md` for file-level ownership, mutation rules, and non-negotiables.

### Shared Components

Import shared UI from `src/components/index.ts` rather than deep paths when writing application or feature code.

- `Alert`: Status alert; `error` uses `role="alert"`, other variants use `role="status"`.
- `AppLink`: React Router `Link` wrapper with optional visual variants.
- `Button`: Primary, secondary, and danger button styles.
- `ConfirmationDialog`: Modal confirmation dialog on the native `<dialog>` element, with labelled description, focus
  trap, Escape cancel, and focus restoration.
- `EmptyState`: Empty-content section with optional supporting text and action slot.
- `Field`: Labelled control wrapper that wires `id`, help text, and error associations.
- `LoadingState`: Polite live-region loading indicator.
- `QueryErrorState`: Shared query error alert with optional Retry (hidden on `403`).
- `NotificationsProvider` / `useNotifications`: Toast-style notifications with dismiss actions.

These components apply the class names defined in `src/styles/components.css`.

### Styles

- `src/index.css`: Global CSS entrypoint imported by `src/main.tsx`. It imports all style layers in order.
- `src/styles/tokens.css`: Design tokens for typography, spacing, sizing, colors, borders, focus, shadows, and
  motion.
- `src/styles/base.css`: Element defaults and accessibility foundations, including box sizing, controls, links,
  focus visibility, page typography, skip links, and reduced motion.
- `src/styles/shell.css`: Application-frame classes for header, navigation, main content, footer, route pages, and
  responsive layouts.
- `src/styles/components.css`: Shared class-based primitives plus dashboard, collections, and book-cover layout
  classes. They use BEM-like naming and are referenced by shared and feature components.

When adding a style, first decide its scope:

- A reusable value belongs in `tokens.css`.
- A default for an HTML element belongs in `base.css`.
- Page-frame or navigation layout belongs in `shell.css`.
- A reusable UI pattern belongs in `components.css`.
- A feature-specific style can live near that feature when it is not shared.

Keep the import order in `src/index.css`. Later layers rely on variables and defaults from earlier layers.

### Tests

- Colocated `*.test.ts` / `*.test.tsx` under `src/` cover components, API helpers, React Query hooks, and feature
  routes.
- `e2e/` holds Playwright journeys and axe accessibility checks (`yarn test:e2e`; included in `make check`).
- `scripts/contractSmoke.test.ts`: Checked-in OpenAPI path/type smoke when live backend comparison is unavailable.
- `scripts/productionBuildTokenInspection.test.ts`: Production build with source maps; fails if `.env` is copied into
  `dist/` or the release tarball. Embedded build-time tokens in hashed JS are expected.
- `scripts/packRelease.test.ts` / `scripts/productionLikeHost.test.ts`: Versioned tarball packing, checksum/manifest
  agreement, forbidden-member rejection, and production-like host header/CORS/backup checks.
- `src/test/setup.ts` / `src/test/renderAppTree.tsx`: Global Vitest setup and shared render helpers.

Vitest discovers files named `*.test.ts` or `*.test.tsx`. Keep a component test near its component when practical.
Prefer queries that reflect how a user or assistive technology finds an element, such as `getByRole()`. Route tests
should use `createTestRouter` / `renderAppTree` and must not mutate `window.history` across cases.

The test flow is:

```text
yarn test
  -> Vitest reads vite.config.ts
  -> jsdom supplies browser APIs
  -> src/test/setup.ts installs shared matchers
  -> colocated *.test.tsx / *.test.ts files render through Testing Library
```

### Package and Command Files

- `package.json`: Package metadata, Node and Yarn requirements, scripts (including `api:generate` / `api:check`),
  runtime dependencies, and development dependencies. Add or remove packages with Yarn so this file and the lockfile
  stay synchronized.
- `yarn.lock`: Records exact dependency resolutions for repeatable installs. Yarn generates this file; do not edit
  it by hand.
- `Makefile`: Provides short, consistent wrappers around Yarn commands. For example, `make run` calls `yarn dev`,
  `make check` calls `yarn check`, and `make pack` writes the versioned production tarball.
- `.nvmrc`: Pins the project's Node.js version. `nvm use` reads this file.
- `.yarnrc.yml`: Configures Yarn to install packages into `node_modules/` rather than use Plug'n'Play.

The available commands are:

- `make install`: Installs the exact locked dependencies. It fails if `package.json` and `yarn.lock` disagree.
- `make run`: Starts Vite's development server with hot reloading.
- `make preview`: Serves an existing production build locally.
- `make lint`: Checks code with ESLint and treats warnings as failures.
- `make typecheck`: Checks application and tooling TypeScript.
- `make test`: Runs the test suite once.
- `yarn test:watch`: Runs Vitest in watch mode during development.
- `yarn test:e2e`: Runs Playwright browser journeys under `e2e/`.
- `yarn test:coverage`: Runs Vitest with V8 coverage and enforced global thresholds.
- `make build`: Type-checks and creates the optimized `dist/` output.
- `make bundle-check`: Checks the built main JavaScript entry against the 120 kB gzip warning budget and 150 kB hard
  failure budget.
- `make container-build` / `container-run` / `container-stop` / `container-clean`: Podman/Compose-oriented nginx
  preview image (`ci/Containerfile`); not production.
- `make pack`: Type-checks, builds `dist/`, and writes `ci/artifacts/shade-frontend-<package.json version>.tar.gz`
  plus SHA-256 and manifest sidecars. Opt-in; packing is not a default CI upload.
- `make check`: Runs linting, type checking, generated OpenAPI drift checking, Vitest with coverage, Playwright
  browser/accessibility tests, the production build, and the bundle-size gate.
- `yarn api:generate`: Regenerates `src/api/generated/openapi.ts` from `docs/technical-reference/openapi.json`.
- `yarn api:check`: Regenerates types and fails if the generated file differs from git.

`make check` currently type-checks twice: once directly and once as part of the build command. This is redundant,
but it is expected behavior rather than a failure.

### Runtime configuration, CORS, and token

Runtime configuration lives in `public/config.js` as `window.__SHADE_CONFIG__` (`apiBaseUrl` and optional
diagnostic-reporting configuration). Application release comes from `package.json` `version` (`APP_VERSION`), not
runtime config. The Bearer token lives in the repository-root `.env` as `VITE_API_SECRET_KEY` and is injected at
dev-server and build time. Copy `.env.example` to `.env`, set the value to match the backend `API_SECRET_KEY`, and
restart after changes. Release artifacts must not include the `.env` file itself -- only built static assets under
`dist/`. Hashed JavaScript in those assets contains the build-time token; that is the accepted shared-secret design.

Local API access:

- Default: keep `apiBaseUrl` pointed at the backend (for example `http://127.0.0.1:8000`). The backend allows the
  Vite origins `http://localhost:5173` and `http://127.0.0.1:5173`.
- Optional same-origin proxy: set `apiBaseUrl` to the Vite origin and start with `SHADE_API_PROXY=1`
  (`SHADE_API_PROXY_TARGET` defaults to `http://127.0.0.1:8000`).

Cross-origin production requests may send `Authorization`, `Content-Type`, and `Library-Username`. Cookies and
credentialed CORS are not used.

Production connectivity is a release blocker until one arrangement is chosen and verified:

- Exact frontend origin (scheme, hostname, port; no path or trailing slash) in backend `CORS_ORIGINS`, or
- A deployment-managed same-origin reverse proxy.

Verification must cover authenticated requests and browser preflights (CORS/Bearer or same-origin proxy).
Production-like host checks may still exercise authenticated `GET /backup` as API connectivity (not a SPA product
flow). See also `README.md` and `docs/technical-reference/API-for-FE.md`.

Production host security is owned by the deployment environment rather than this frontend repository. Before release,
the production host must:

- Serve the extracted tarball and production API traffic over HTTPS.
- Apply a restrictive Content Security Policy compatible with the frontend's static assets, configured API origin,
  and camera access used by the ISBN scanner.
- Apply appropriate browser security headers, including HSTS where applicable.
- Provide SPA fallback routing to `index.html` for client-side routes.
- Revalidate `index.html` and `config.js` while allowing long-lived immutable caching for hashed `/assets/`.
- Serve deployment-managed runtime configuration with the intended production values.
- Restrict network access because the baked browser Bearer token is a shared secret.
- Provide atomic install, rollback, process/service supervision, and health checks.
- Retain and verify the tarball checksum and release manifest.

These are deployment requirements, not frontend implementations. `make pack` produces the versioned archive under
`ci/artifacts/`; the deployment repository owns concrete static-server, TLS, CSP/security-header, Ansible, systemd,
and rollback configuration. Production verification must confirm these controls rather than treating a successful
frontend build as evidence that they are present. See `README.md` for artifact names and the smoke checklist, and
`docs/AGENTS.md` for the evergreen browser-support matrix.

`scripts/productionBuildTokenInspection.test.ts` builds with a dummy `VITE_API_SECRET_KEY` and asserts the
repository-root `.env` file is not copied into `dist/` or the packed tarball (embedded build-time token in JS
bundles is expected). `scripts/packRelease.test.ts` and `scripts/productionLikeHost.test.ts` cover deterministic
archives, forbidden members, SPA fallback, cache headers, CORS/Bearer access, and authenticated `/backup`
connectivity (API host verification, not a browser product download).

### Build, TypeScript, and Lint Configuration

- `vite.config.ts`: Shared Vite and Vitest configuration. Enables React, jsdom tests, global test setup, and an
  optional same-origin API proxy when `SHADE_API_PROXY=1` (optional `SHADE_API_PROXY_TARGET`).
- `eslint.config.js`: Flat ESLint configuration for TypeScript and React Hooks. It ignores generated directories
  and treats warnings as failures through the package script.
- `tsconfig.json`: TypeScript solution file that references the application and Node/tooling configurations.
- `tsconfig.app.json`: Strict browser and React type checking for `src/`. It includes Vite, Vitest, and jest-dom
  types and emits no files.
- `tsconfig.node.json`: Strict Node-side type checking for `vite.config.ts` and `scripts/**/*.ts`. It emits no files.

The production build follows this path:

```text
make build
  -> yarn build
       -> tsc -b
            -> tsconfig.app.json
            -> tsconfig.node.json
       -> vite build
            -> follows imports from index.html and src/main.tsx
            -> writes dist/
```

### Repository and Contributor Files

- `README.md`: Provides the shortest setup, development, quality-check, and build instructions. Keep it concise;
  put deeper maintenance guidance in this file.
- `.gitignore`: Prevents generated output, dependencies, local settings, secrets, databases, and operating-system
  files from being tracked.
- `.gitattributes`: Keeps text files checked out with LF endings and marks common binary file types.
- `.cursor/rules/documentation-style.mdc`: Defines writing and formatting rules for documentation created with
  Cursor.
- `.cursor/rules/grep-tool.mdc`: Records the project's text-search tooling requirement for Cursor.
- `.cursor/rules/readonly-git.mdc`: Restricts Git mutations performed through Cursor.
- `.cursor/rules/scope.mdc`: Defines which related Shade repositories Cursor may read and where it may write.

The `.cursor` files guide AI-assisted development. They do not become part of the browser application or
production build.

When you need product or contract detail, start with:

- `docs/tickets/` for the current feature ticket and acceptance criteria (when open).
- `docs/ToDo.md` for a human checklist (may lag).
- `docs/product-docs/UI_DESIGN_NOTES.MD` when visual design is in question.
- `docs/technical-reference/openapi.json` and `docs/technical-reference/API-for-FE.md` for the backend contract.
- `docs/AGENTS.md` for the LLM-oriented twin of this guide, including scanner, browser-support, and
  testing / manual-verification matrices.
- `docs/full-project-context.md` for the slim always-on ChatGPT pack (not required when this file or `docs/AGENTS.md`
  is already loaded).

## Making a Change Safely

Use this general workflow:

1. Read the nearby implementation and tests before editing.
2. Make the smallest change that fully solves the problem.
3. Add or update a test for behavior that changed.
4. Run the focused test while working, using `yarn test:watch` if helpful.
5. Run `make check` before handing off the change.
6. Review the changed files and confirm that generated output and secrets are not included.

Some failures point to different kinds of problems:

- A lint failure usually means the code violates a style or React correctness rule.
- A type-check failure means TypeScript cannot prove that values are being used safely.
- A test failure means observed behavior no longer matches an expectation.
- A build failure means Vite could not create the production application, even if earlier checks passed.

Do not silence a check without understanding it. If a rule appears wrong for a situation, ask another maintainer
before disabling it.

## Project Conventions

- Use the Node and Yarn versions declared by the repository.
- Use Yarn rather than npm, and do not edit `yarn.lock` manually.
- Keep TypeScript strict. Avoid `any` unless there is a documented, unavoidable reason.
- Use extensionless relative TypeScript imports. Prefer single quotes, no semicolons, and trailing commas where
  supported.
- Prefer semantic HTML before adding ARIA attributes.
- Preserve landmarks, visible keyboard focus, labels linked to errors, skip link, dialog focus restoration,
  document title plus heading focus on route change, no color-only status, usable 320px viewports, 44-pixel
  control targets, and reduced-motion behavior.
- Write tests around user-visible behavior instead of component implementation details.
- Use existing design tokens and shared component classes before creating duplicates.
- Import shared components from `src/components/index.ts`.
- Use BEM-like names for shared CSS: `.component`, `.component__element`, and `.component--modifier`.
- Keep global CSS imports in `src/index.css`, which is imported once by `src/main.tsx`.
- Keep feature UI behind the existing `src/features/*/routes/` ownership; extend implemented pages rather than
  inventing a parallel tree.
- Reuse the typed client, query keys, mutation invalidation, and redaction helpers; do not introduce a second
  state store, component library, CSS framework, or form library unless a product need explicitly requires it.
- Keep forms, scanner, and dialogs local; keep connection state application-wide; invalidate affected queries after
  mutations. There is no realtime API.
- Prefer dedicated lifecycle endpoints; never simulate restore, checkout, check-in, initial mark-read, bulk shelf
  move, or cover upload/delete with generic `PATCH`.
- Never commit the API token, put it in URLs, log Authorization headers, render API text as HTML, or upload SQL
  backup contents to telemetry. The build-time injection into JavaScript bundles is the accepted shared-secret
  design; do not invent a second authentication model.
- Do not commit `node_modules/`, `dist/`, `ci/artifacts/`, `coverage/`, local databases, or secret files.
- Update this guide when adding, removing, or significantly changing project files or development workflows.

## When Adding New Architecture

Prefer extending the existing shell, connection, server-state, and feature-route patterns before inventing parallel
ones. New UI should reuse `queryKeys`, typed API helpers, `enumDisplayValue`, shared loading/empty/alert/link
primitives, and existing feature ownership under `src/features/*/routes/`. When introducing a new pattern:

1. Keep its first use small and understandable.
2. Choose names that describe product concepts, not vague technical categories.
3. Document how data enters, changes within, and leaves the new module.
4. Add tests at the level where behavior can be observed reliably.
5. Update the project structure and interaction diagrams in this guide (and `docs/AGENTS.md`).

If a change affects the product's intended behavior, consult the requirements in `docs/` and keep the
implementation, tests, and documentation consistent. When no ticket is open under `docs/tickets/`, ask which work
to take next rather than inventing a follow-on feature.
