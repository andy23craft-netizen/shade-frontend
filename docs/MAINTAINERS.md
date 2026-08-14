# Maintainer Guide

This guide is for engineers maintaining the Shade frontend, especially engineers who are still learning the
project and its tools. It explains how the application starts, where code belongs, how the files work together,
and how to check a change before sharing it.

## Start Here

Shade is a React single-page application built with TypeScript and Vite. It is the browser UI for a personal
home-library FastAPI backend. The shared shell, runtime configuration, connection flow, typed API client, and
React Query server-state layer are in place (FEAT-01 through FEAT-03). Most feature routes still render
placeholders; product UI begins with FEAT-04 (active collection and book details).

Remaining tickets are `FEAT-04` through `FEAT-16` under `docs/tickets/`. Broader delivery planning lives in
`docs/product-docs/PLAN.md`. Ticket completion status is tracked in `docs/ToDo.md`.

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

This command runs linting, type checking, tests, and a production build. Running it locally catches many common
problems before code review or continuous integration.

Stack highlights: React 19, TypeScript 6 (strict), Vite 8, React Router 7, TanStack React Query 5, Vitest with
jsdom, Yarn 4.18.0 via Corepack, and Node.js 26.7.0. There is no Next.js, Tailwind, component library, or form
library.

## How the Application Works

The browser follows this path when it loads the application:

```text
index.html
  -> /config.js (sets window.__SHADE_CONFIG__)
  -> src/main.tsx
       -> readApiToken()
       -> readRuntimeConfig()
            -> on failure: RuntimeConfigScreen (retry)
            -> on success:
                 RootErrorBoundary
                   -> AppProviders
                        -> NotificationsProvider
                        -> QueryClientProvider (createQueryClient())
                        -> ConnectionProvider (createApiClient, env token, GET /health)
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
valid, the bootstrap module renders `RouterProvider` inside `RootErrorBoundary` and `AppProviders` in `StrictMode`.
Missing or malformed config shows `RuntimeConfigScreen` instead of the shell.

`AppShell` owns document title updates (`{route title}` plus an em dash and ` Shade`), skip link, primary and
admin navigation, the main `Outlet`, footer (runtime release identifier), and heading focus after client-side
navigations. Feature routes under `src/features/*/routes/` render product UI or placeholders per ticket.

Vite handles the development server and production bundling. TypeScript checks the code but does not create
JavaScript files itself; Vite performs that transformation during development and builds. The CSS import order is
intentional: later layers use tokens and defaults declared by earlier layers.

## Backend Contract (Maintainer Notes)

The backend is a separate repository. Default local API base is `http://127.0.0.1:8000` with **no** `/api` prefix.
Treat these as complementary sources of truth:

- `docs/technical-reference/openapi.json`: paths, methods, status codes, request/response schemas, enums, nullability
- `docs/technical-reference/API-for-FE.md`: behavioral guidance OpenAPI does not fully express

Authentication uses a shared Bearer token (`Authorization: Bearer <API_SECRET_KEY>`). There are no user accounts.
Missing or invalid credentials return `403` (describe generically as "API access was rejected"). The token is read
from the repository-root `.env` file as `VITE_API_SECRET_KEY` and injected at dev-server and build time (embedded in
JS bundles). Missing or blank env values throw at bootstrap. Confirmed `403` shows a page-level error without clearing
the query cache or redirecting to a settings screen.

Never simulate lifecycle operations with a generic `PATCH`. Use the dedicated endpoints (create, edit, delete,
restore, checkout, check-in, mark-read, ISBN lookup, backup). Prefer regenerating `src/api/generated/openapi.ts`
with `yarn api:generate` rather than hand-editing it.

## Project Structure

The summaries below cover every project-owned file outside `docs/`. Generated directories such as
`node_modules/`, `dist/`, `coverage/`, `.vite/`, `.yarn/`, and `.git/` are intentionally omitted because tools
recreate them.

### Browser Application

- `index.html`: Vite's HTML entrypoint. Defines page metadata, creates `#root`, loads `/config.js`, then
  `src/main.tsx`.
- `public/config.js`: Runtime config assigned to `window.__SHADE_CONFIG__` (`apiBaseUrl`, `release`). Not bundled;
  edit for local or deployed environments.
- `src/main.tsx`: Browser bootstrap. Reads runtime config, either mounts `RuntimeConfigScreen` or
  `RootErrorBoundary` -> `AppProviders` -> `RouterProvider` in `StrictMode`, and imports global CSS.
- `src/AppProviders.tsx`: Application-wide providers. Wraps `NotificationsProvider`, `QueryClientProvider`
  (`createQueryClient()`), and `ConnectionProvider` (requires validated `runtimeConfig`). Subscribes
  `subscribeQueryClientToConnectionInvalidation` so forgotten or rejected tokens clear the query cache.
- `src/RootErrorBoundary.tsx`: Class error boundary with a recoverable fallback (retry and return home).
- `src/vite-env.d.ts`: Adds Vite client and asset declarations to TypeScript. It has no runtime behavior.

### Runtime Configuration

- `src/config/runtimeConfig.ts`: Validates and normalizes `apiBaseUrl` and `release`; throws `RuntimeConfigError`.
- `src/config/runtimeConfigState.ts`: `readRuntimeConfig()` returns `{ config, error }` without throwing.
- `src/config/RuntimeConfigScreen.tsx`: Blocking UI when config is missing or invalid, with retry.

### API Layer

- `src/api/generated/openapi.ts`: Generated OpenAPI types. Do not hand-edit; use `yarn api:generate` /
  `yarn api:check`.
- `src/api/apiTypes.ts`: Exported schema aliases (`BookCreate` / `BookUpdate` / `BookRead` / `BookList`, lookup, loan,
  dashboard, health, validation/error schemas, enums).
- `src/api/enumDisplay.ts`: `enumDisplayValue` for known vs unknown enum strings with a neutral fallback.
- `src/api/apiCallOptions.ts`: Shared optional `AbortSignal` options type used by typed route helpers.
- `src/api/apiClient.ts`: `createApiClient` with Bearer injection, path joining at the configured base URL (no `/api`
  prefix), timeout (default 10s), caller `AbortSignal`, `get` / `request` / `getJson` / `requestJson`, empty `204`
  handling, invalid-JSON errors, and `403` via `onUnauthorized`.
- `src/api/apiErrors.ts`: `ApiError` kinds (`unreachable`, `timeout`, `cancelled`, `unauthorized`, `validation`,
  `invalid_response`, `server`, `http`), optional `detail` / `correlationId` / `fieldErrors`, and
  `mapValidationFieldErrors` for FastAPI `422 detail[]`. `correlationId` stays unset until the backend documents a
  safe source (do not invent a header or body field).
- `src/api/apiRedaction.ts`: Safe diagnostic projection and assertions so API/error logs never retain headers, tokens,
  borrower names, notes, reviews, ISBN drafts, backup contents, or full bodies.
- `src/api/requestFields.ts` / `dateTime.ts`: Documented request-field picking for typed helpers and reusable
  `YYYY-MM-DD` / UTC ISO 8601 normalizers for later form tickets.
- `src/api/queryKeys.ts`: Shared React Query keys for books, loans, and dashboard.
- `src/api/api.ts`: `createApi` aggregates typed helpers (`books`, `loans`, `dashboard`, `health`, `backup`) plus the
  underlying `client`.
- `src/api/booksApi.ts`: `list` (optional `includeDeleted`), `create`, `lookup`, `get`, `update`, `remove`, `restore`,
  `checkout`, `checkin` (optional body), `markRead` (defaults to `{}`). Helpers accept optional `AbortSignal` and
  serialize only documented request fields.
- `src/api/loansApi.ts`: `list()` (`GET /loans`).
- `src/api/dashboardApi.ts`: `get()` (`GET /dashboard`).
- `src/api/healthApi.ts`: `get()` public (`GET /health`, `authenticated: false`).
- `src/api/backupApi.ts`: `get()` returns `{ blob, filename }` for authenticated `/backup`, parsing UTF-8
  `Content-Disposition` (`filename*=UTF-8''...`) with a `backup.sql` fallback when the header is missing or malformed.
- `src/api/queryClient.ts`: `createQueryClient()` sets `staleTime` 30s, `refetchOnWindowFocus`,
  `refetchOnReconnect`, query retry that skips validation / auth / cancelled / invalid-response errors, and
  `mutations.retry: false`.
- `src/api/booksQueries.ts`: `useBooks`, `useBook`, `useBookLookup`, plus mutations that write returned `BookRead`
  into the detail cache and invalidate per PLAN.md 7.5 (lists, detail, dashboard, and loans on checkout/check-in).
- `src/api/loansQueries.ts` / `dashboardQueries.ts`: `useLoans` and `useDashboard` using the same keys mutations
  invalidate.

### Routing and Layout

- `src/routes/routeMetadata.ts`: Path, document-title fragment, and heading metadata for every registered route.
- `src/routes/routes.tsx`: `createBrowserRouter` configuration. `AppShell` is the parent layout. Registered paths
  are `/`, `/books`, `/books/new`, `/books/:bookId`, `/books/:bookId/edit`, `/checkout`, `/checkin`, `/loans`,
  `/admin/deleted`, `/admin/backup`, and `*` (not found).
- `src/routes/RoutePlaceholder.tsx`: Minimal route body used by unfinished feature pages (`h1` with `tabIndex={-1}`).
- `src/routes/NotFoundPage.tsx`: Not-found message plus a link back to the dashboard.
- `src/routes/createMemoryRouter.ts`: Exports `createTestRouter` for tests; builds a memory router from `routeConfig`.
- `src/layout/AppShell.tsx`: Application frame with skip link, header, primary navigation, admin/settings group,
  `Outlet` main region, footer (including runtime release identifier), document title, and heading focus on location
  change.

### Feature Modules

Route ownership under `src/features/*/routes/`. Implemented product UI vs placeholders:

Implemented: books list/detail/create, checkout, check-in, and loans (see `docs/AGENTS.md` for the current inventory).

Connection feature (FEAT-02 + FEAT-05 better auth):

- `src/config/apiToken.ts`: `readApiToken()` from `VITE_API_SECRET_KEY`; throws at bootstrap when missing/blank.
- `src/features/connection/connectionTypes.ts`: Connection status union (`checking`, `connected`, `unauthorized`,
  `unreachable`).
- `src/features/connection/connectionToken.ts`: Env-sourced token accessor for `createApiClient`.
- `src/features/connection/connectionApi.ts`: Public `GET /health` reachability check.
- `src/features/connection/ConnectionContext.ts` / `useConnection.ts`: Context value and hook.
- `src/features/connection/ConnectionProvider.tsx`: Owns status, `apiClient`, and unauthorized handling without cache
  clears.

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
- `src/styles/components.css`: Shared class-based primitives for buttons, links, forms, alerts, status views,
  dialogs, and notifications. They use BEM-like naming and are referenced by the shared component modules.

When adding a style, first decide its scope:

- A reusable value belongs in `tokens.css`.
- A default for an HTML element belongs in `base.css`.
- Page-frame or navigation layout belongs in `shell.css`.
- A reusable UI pattern belongs in `components.css`.
- A feature-specific style can live near that feature once feature modules gain real UI.

Keep the import order in `src/index.css`. Later layers rely on variables and defaults from earlier layers.

### Tests

- `src/App.test.tsx`: Document title and heading-focus behavior for client-side navigations via `renderAppTree`.
- `src/RootErrorBoundary.test.tsx`: Recoverable root error-boundary fallback.
- `src/layout/AppShell.test.tsx`: Landmarks, navigation labels, footer release identifier, current-page state, and
  not-found recovery.
- `src/components/SharedState.test.tsx`: Field associations plus alert, loading, and empty-state semantics.
- `src/components/ConfirmationDialog.test.tsx`: Dialog labelling, focus, Escape, confirm, and restoration.
- `src/components/Notifications.test.tsx`: Live-region roles, dismissal, and provider hook usage.
- `src/config/runtimeConfig.test.ts` / `runtimeConfigState.test.ts`: Config validation and read helpers.
- `src/api/apiClient.test.ts`: Bearer injection, public requests, `403`, `404`, `409`, both `422` detail shapes,
  `5xx`, network failure, timeout, cancellation, invalid JSON, binary backup success, and `204`.
- `src/api/apiErrors.test.ts` / `apiTypes.test.ts` / `api.test.ts` / `apiRedaction.test.ts`: Error, schema alias,
  `createApi`, and redaction coverage.
- `src/api/booksApi.test.ts` / `booksApi.conflicts.test.ts` / `booksApi.largeLibrary.test.ts` /
  `loansApi.test.ts` / `dashboardApi.test.ts` / `healthApi.test.ts` / `backupApi.test.ts`: Typed route helper coverage including conflict bodies and a large-list timing guard.
- `src/api/requestFields.test.ts` / `dateTime.test.ts`: Request-field picking and date/time normalizer coverage.
- `src/api/queryClient.test.ts` / `queryInvalidation.test.ts` / `booksQueries.test.tsx` /
  `serverStateQueries.test.tsx` / `queryStaleGuard.test.tsx`: Query client defaults, connection-invalidation
  subscription, books/loans/dashboard hooks, detail-cache writes, and abort/stale overwrite guards.
- `scripts/contractSmoke.test.ts`: Checked-in OpenAPI path/type smoke when live backend comparison is unavailable.
- `docs/baselines/FEAT-03_performance.md`: Large-library and bundle-size expectations for FEAT-12 / FEAT-14.
- `src/features/connection/ConnectionProvider.test.tsx` / `ConnectionScreen.test.tsx` /
  `connectionToken.test.ts`: Connection lifecycle and UI.
- `src/test/setup.ts`: Global Vitest setup that installs jest-dom matchers for every test.
- `src/test/renderAppTree.tsx`: Shared helpers (`renderAppTree`, `renderWithProviders`, `mockReachableApi`,
  `testRuntimeConfig`) that mount under `AppProviders` with a mocked reachable API.
- `scripts/productionBuildTokenInspection.test.ts`: Production build with source maps; fails if known test tokens
  appear in artifacts.

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
  and `make check` calls `yarn check`.
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
- `make build`: Type-checks and creates the optimized `dist/` output.
- `make check`: Runs linting, type checking, tests, and the production build.
- `yarn api:generate`: Regenerates `src/api/generated/openapi.ts` from `docs/technical-reference/openapi.json`.
- `yarn api:check`: Regenerates types and fails if the generated file differs from git.

`make check` currently type-checks twice: once directly and once as part of the build command. This is redundant,
but it is expected behavior rather than a failure.

### Runtime configuration, CORS, and token

Runtime configuration lives in `public/config.js` as `window.__SHADE_CONFIG__` (`apiBaseUrl`, `release`). The Bearer
token lives in the repository-root `.env` as `VITE_API_SECRET_KEY` and is injected at dev-server and build time. Copy
`.env.example` to `.env`, set the value to match the backend `API_SECRET_KEY`, and restart after changes. Release
artifacts must not include the `.env` file itself — only built static assets under `dist/`.

Local API access:

- Default: keep `apiBaseUrl` pointed at the backend (for example `http://127.0.0.1:8000`). The backend allows the
  Vite origins `http://localhost:5173` and `http://127.0.0.1:5173`.
- Optional same-origin proxy: set `apiBaseUrl` to the Vite origin and start with `SHADE_API_PROXY=1`
  (`SHADE_API_PROXY_TARGET` defaults to `http://127.0.0.1:8000`).

Cross-origin production requests may send `Authorization` and `Content-Type`. Cookies and credentialed CORS are not
used. Frontend JavaScript may read the exposed backup `Content-Disposition` filename.

Production connectivity remains a release blocker until one arrangement is chosen and verified:

- Exact frontend origin (scheme, hostname, port; no path or trailing slash) in backend `CORS_ORIGINS`, or
- A deployment-managed same-origin reverse proxy.

Verification must cover authenticated requests, browser preflights, and JavaScript access to the backup
`Content-Disposition` filename. See also `README.md` and `docs/technical-reference/API-for-FE.md`.

`scripts/productionBuildTokenInspection.test.ts` builds with a dummy `VITE_API_SECRET_KEY` and asserts the repository-root
`.env` file is not copied into `dist/` (embedded build-time token in JS bundles is expected).

### Build, TypeScript, and Lint Configuration

- `vite.config.ts`: Shared Vite and Vitest configuration. Enables React, jsdom tests, global test setup, and an
  optional same-origin API proxy when `SHADE_API_PROXY=1` (optional `SHADE_API_PROXY_TARGET`).
- `eslint.config.js`: Flat ESLint configuration for TypeScript and React Hooks. It ignores generated directories
  and treats warnings as failures through the package script.
- `tsconfig.json`: TypeScript solution file that references the application and Node/tooling configurations.
- `tsconfig.app.json`: Strict browser and React type checking for `src/`. It includes Vite, Vitest, and jest-dom
  types and emits no files.
- `tsconfig.node.json`: Strict Node-side type checking for `vite.config.ts`. It emits no files.

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

When you need product or ticket detail, start with:

- `docs/tickets/` for the current feature ticket and acceptance criteria (`FEAT-04` through `FEAT-16`).
- `docs/ToDo.md` for ticket completion status.
- `docs/product-docs/PLAN.md` for the overall frontend roadmap.
- `docs/product-docs/UI_DESIGN_NOTES.MD` when visual design is in question.
- `docs/technical-reference/openapi.json` and `docs/technical-reference/API-for-FE.md` for the backend contract.
- `docs/baselines/FEAT-03_performance.md` for large-library and bundle-size baselines.
- `docs/AGENTS.md` for the LLM-oriented twin of this guide.

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
- Keep feature UI behind the existing `src/features/*/routes/` ownership; replace placeholders when a ticket owns
  that route rather than inventing a parallel tree.
- Reuse the FEAT-03 typed client, query keys, mutation invalidation, and redaction helpers; do not introduce a second
  state store, component library, CSS framework, or form library unless a ticket explicitly requires it.
- Keep forms, scanner, and dialogs local; keep connection state application-wide; invalidate affected queries after
  mutations. There is no realtime API.
- Never commit the API token, compile it into JS, put it in URLs, log Authorization headers, render API text as HTML,
  or upload SQL backup contents to telemetry.
- Do not commit `node_modules/`, `dist/`, `coverage/`, local databases, or secret files.
- Update this guide when adding, removing, or significantly changing project files or development workflows.

## When Adding New Architecture

Prefer completing the next ticket (currently FEAT-04) on the existing shell, connection, and server-state patterns
before inventing parallel ones. New feature UI should replace the owned `RoutePlaceholder` pages and reuse
`useBooks` / `useBook`, `queryKeys`, `enumDisplayValue`, and shared loading/empty/alert/link primitives. When
introducing a new pattern:

1. Keep its first use small and understandable.
2. Choose names that describe product concepts, not vague technical categories.
3. Document how data enters, changes within, and leaves the new module.
4. Add tests at the level where behavior can be observed reliably.
5. Update the project structure and interaction diagrams in this guide (and `docs/AGENTS.md`).

If a change affects the product's intended behavior, consult the requirements in `docs/` and keep the
implementation, tests, and documentation consistent.
