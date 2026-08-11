# Agents.md: LLM Project Context

Use this document as baseline context when working on the Shade frontend in a fresh LLM chat. Inspect the current
repository before making changes because the code may have changed since this document was written. A user's
explicit request takes precedence over general guidance here.

## Project Summary

Shade is a browser UI for a personal home-library FastAPI backend. Planned capabilities include:

- Viewing collection, borrowing, and reading metrics on a dashboard.
- Adding books through ISBN entry or barcode scanning.
- Checking books out to borrowers and checking them back in.
- Tracking reading completion, ratings, and notes.
- Soft-deleting and restoring books while preserving history.
- Sending a shared Bearer token with backend API requests (no user accounts).

**Completed:** FEAT-01 (application shell and shared UI) and FEAT-02 (runtime configuration and connection). Both
ticket files were removed; remaining tickets are `FEAT-03` through `FEAT-16` under `docs/tickets/`. `docs/ToDo.md`
marks FEAT-01 and FEAT-02 complete.

**In progress:** FEAT-03 (typed API and server state). Already present: OpenAPI generation, schema aliases, enum
display helpers, the shared API client shell, error types, `createApi` with typed route helpers for books, loans,
dashboard, health, protected, and backup (text-only), React Query mounted under `AppProviders`,
`subscribeQueryClientToConnectionInvalidation`, and partial books query/mutation hooks. Remaining work includes query
client defaults, wiring invalidation into bootstrap, backup blob + filename metadata, fuller mutations and the PLAN.md
7.5 invalidation matrix, restoring full `apiClient` tests, request shaping, error/correlation/redaction completion, and
routing connection health/protected through typed helpers. Product feature workflows belong to FEAT-04+.

Product intent, sequencing, and acceptance criteria live under `docs/`. Prefer the current ticket, then
`docs/product-docs/PLAN.md`, then the product requirements docs when deciding what to build next.

## Technology

- React 19
- TypeScript 6 in strict mode
- Vite 8
- React Router 7 (`react-router-dom`), integrated in `src/main.tsx`
- TanStack React Query 5 (`QueryClientProvider` mounted under `AppProviders`; client defaults and full invalidation
  wiring are FEAT-03 remaining work)
- `openapi-typescript` for generating `src/api/generated/openapi.ts` from the checked-in OpenAPI document
- Vitest with jsdom
- Testing Library and jest-dom
- ESLint flat configuration
- Yarn 4 through Corepack (`yarn@4.18.0` in `package.json`)
- Node.js 26.7.0
- Make command wrappers

The package uses native ECMAScript modules through `"type": "module"`. No Next.js, Tailwind, component library, or form
library.

## Backend Contract

The backend is a separate repository. Default local API base is `http://127.0.0.1:8000` with **no** `/api` prefix.
Treat these as complementary sources of truth:

- `docs/technical-reference/openapi.json`: paths, methods, status codes, request/response schemas, enums, nullability
  (OpenAPI 3.1; LibraryV2). Prefer generating or fixture-checking TypeScript models from this file.
- `docs/technical-reference/API-for-FE.md`: behavioral guidance OpenAPI does not fully express (auth, CORS, error
  meanings, lifecycle rules, ISBN quirks, backup download, FE vs API ownership).

Compare with a running backend `/openapi.json` before locking transport types; record drift as a blocker rather than
inventing frontend semantics. Do not invent backend behavior from product docs alone.

### Authority when sources disagree

1. Current repository contents
2. Current ticket and its acceptance criteria
3. Running backend `/openapi.json`, when relevant
4. Checked-in `docs/technical-reference/openapi.json`
5. `docs/technical-reference/API-for-FE.md`
6. This document and other planning docs

### Authentication

- Shared Bearer token: `Authorization: Bearer <API_SECRET_KEY>`
- No login, logout, user accounts, sessions, or roles
- Missing or invalid credentials return `403`; describe generically as "API access was rejected"
- Token is runtime-only: memory plus `sessionStorage`, with an explicit forget action
- Never commit, bundle, put in URLs, log, or send the token to analytics
- Confirmed `403` clears the active token and returns the user to connection setup

### Lifecycle endpoints (never simulate with generic PATCH)

| Operation     | Endpoint                        |
| ------------- | ------------------------------- |
| Create        | `POST /books`                   |
| Edit metadata | `PATCH /books/{id}`             |
| Delete        | `DELETE /books/{id}`            |
| Restore       | `POST /books/{id}/restore`      |
| Checkout      | `POST /books/{id}/checkout`     |
| Check-in      | `POST /books/{id}/checkin`      |
| Mark read     | `POST /books/{id}/mark-read`    |
| ISBN lookup   | `GET /books/lookup?isbn={isbn}` |
| Backup        | `GET /backup`                   |

### Frontend compensations for known backend limits

- Validate ISBN-10 check digits (backend does not do this correctly).
- Send normalized `YYYY-MM-DD` dates and UTC ISO 8601 timestamps.
- Do not send `null` for required DB fields (title, authors, category, shelf, is_read, status).
- Prevent blank title, authors, and borrower.
- Prevent deletion of on-loan books (backend allows it; frontend must not).
- Render unknown enum values safely (see `enumDisplayValue`).
- Display API-provided dashboard statistics; do not recalculate business metrics. If an average is `null`, show
  something like "Not enough data" -- do not invent zero.

### Scope

**In scope for MVP:** dashboard, active books, detail, manual/ISBN/camera/scanner add flows, edit, checkout, check-in,
loan history, reading tracking, soft delete/restore, deleted admin, authenticated SQL backup, runtime API config, CI,
Podman preview, versioned production artifacts.

**Out of scope unless explicitly requested:** UPC, multi-library/copies, wish lists, catalog search/filter/sort,
backend pagination, cover images, overdue notifications, Goodreads/StoryGraph, user accounts/roles, realtime sync,
loan CRUD, mark-unread, remote Ansible/systemd/TLS/rollback orchestration.

Do not expand a ticket into out-of-scope features. Do not implement future tickets prematurely.

## Agent Operating Rules

- Work only inside the frontend repository.
- The related backend and orchestrator repositories may be read when cross-project context is necessary.
- Do not mutate Git state. Do not stage, unstage, commit, check out, push, pull, add, remove, or delete through
  Git. Ask before stashing or unstashing.
- Use read-only Git commands only when needed to understand the working tree or history.
- Do not overwrite or revert unrelated user changes.
- Use Yarn rather than npm.
- Do not edit `yarn.lock` manually; update dependencies through Yarn.
- Keep secrets, local databases, dependencies, coverage, and build output untracked.
- Make focused changes and avoid unrelated refactoring.
- Add or update tests when behavior changes.
- Run checks appropriate to the change. Prefer the complete `make check` quality gate before handoff.
- Treat the existing implementation and requirements as evidence, not assumptions. Call out conflicts or unclear
  requirements instead of silently inventing behavior.
- Do not casually replace Yarn, Make, Vitest, or the existing quality gate. Extend `make check` rather than replace it.

When writing Markdown:

- Use straight quotation marks and apostrophes.
- Use `...` instead of the ellipsis character.
- Use `--` instead of an em dash and `-` instead of an en dash.
- Follow "e.g.," and "i.e.," with a comma.
- Keep lines at or below 120 characters, excluding Markdown tables.
- End files with a newline.

## Runtime Architecture

The browser startup and styling flow is:

```text
index.html
  -> /config.js (sets window.__SHADE_CONFIG__)
  -> src/main.tsx
       -> readRuntimeConfig()
            -> on failure: RuntimeConfigScreen (retry)
            -> on success:
                 RootErrorBoundary
                   -> AppProviders
                        -> NotificationsProvider
                        -> QueryClientProvider (createQueryClient())
                        -> ConnectionProvider (createApiClient, token, health/protected)
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
navigations. `/settings/connection` mounts `ConnectionScreen`. Other feature pages under `src/features/*/routes/`
still render `RoutePlaceholder`; product UI arrives in later tickets.

TypeScript checks source code but emits no JavaScript. Vite transforms modules during development and creates the
production bundle. The CSS import order is intentional: later layers use tokens and defaults declared by earlier
layers.

## Project Structure

This inventory covers every project-owned file outside `docs/`. Do not assume generated or dependency directories
are source code. In particular, omit `node_modules/`, `dist/`, `coverage/`, `.vite/`, `.yarn/`, and `.git/` from
normal code changes. Prefer regenerating `src/api/generated/openapi.ts` with `yarn api:generate` rather than
hand-editing it.

### Browser Application

- `index.html`: Vite's HTML entrypoint. Defines page metadata, creates `#root`, loads `/config.js`, then
  `src/main.tsx`.
- `public/config.js`: Runtime config assigned to `window.__SHADE_CONFIG__` (`apiBaseUrl`, `release`). Not bundled;
  edit for local or deployed environments.
- `src/main.tsx`: Browser bootstrap. Reads runtime config, either mounts `RuntimeConfigScreen` or
  `RootErrorBoundary` -> `AppProviders` -> `RouterProvider` in `StrictMode`, and imports global CSS.
- `src/AppProviders.tsx`: Application-wide providers. Wraps `NotificationsProvider`, `QueryClientProvider`
  (`createQueryClient()`), and `ConnectionProvider` (requires validated `runtimeConfig`). Does not yet subscribe
  `subscribeQueryClientToConnectionInvalidation`.
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
  dashboard, health/protected, validation/error schemas, enums).
- `src/api/enumDisplay.ts`: `enumDisplayValue` for known vs unknown enum strings with a neutral fallback.
- `src/api/apiClient.ts`: `createApiClient` with Bearer injection, path joining at the configured base URL (no `/api`
  prefix), timeout (default 10s), caller `AbortSignal`, `get` / `request` / `getJson` / `requestJson`, empty `204`
  handling, invalid-JSON errors, and `403` via `onUnauthorized`.
- `src/api/apiErrors.ts`: `ApiError` kinds (`unreachable`, `timeout`, `cancelled`, `unauthorized`, `validation`,
  `invalid_response`, `server`, `http`), optional `detail` / `correlationId` / `fieldErrors`, and
  `mapValidationFieldErrors` for FastAPI `422 detail[]`. Correlation ID is modeled but not yet populated from
  responses.
- `src/api/api.ts`: `createApi` aggregates typed helpers (`books`, `loans`, `dashboard`, `health`, `protected`,
  `backup`) plus the underlying `client`.
- `src/api/booksApi.ts`: `list` (optional `includeDeleted`), `create`, `lookup`, `get`, `update`, `remove`, `restore`,
  `checkout`, `checkin` (optional body), `markRead`.
- `src/api/loansApi.ts`: `list()` (`GET /loans`).
- `src/api/dashboardApi.ts`: `get()` (`GET /dashboard`).
- `src/api/healthApi.ts`: `get()` public (`GET /health`, `authenticated: false`).
- `src/api/protectedApi.ts`: `get()` (`GET /protected`).
- `src/api/backupApi.ts`: `get()` returns SQL as text only; blob + safe `Content-Disposition` filename metadata is
  still FEAT-03 remaining work.
- `src/api/queryClient.ts`: `createQueryClient()` returns a bare `QueryClient` (no stale/retry/focus defaults yet).
- `src/api/queryInvalidation.ts`: `subscribeQueryClientToConnectionInvalidation` clears the query cache when
  connection invalidation fires; unit-tested but not yet subscribed from `AppProviders`.
- `src/api/booksQueries.ts`: Partial hooks -- `useBooks`, `useBook`, `useBookLookup`, `useCreateBook` (create only
  invalidates `['books']`). Remaining mutations and the PLAN.md 7.5 invalidation matrix are unfinished.

### Routing and Layout

- `src/routes/routeMetadata.ts`: Path, document-title fragment, and heading metadata for every registered route.
- `src/routes/routes.tsx`: `createBrowserRouter` configuration. `AppShell` is the parent layout. Registered paths
  are `/`, `/books`, `/books/new`, `/books/:bookId`, `/books/:bookId/edit`, `/checkout`, `/checkin`, `/loans`,
  `/admin/deleted`, `/admin/backup`, `/settings/connection`, and `*` (not found).
- `src/routes/RoutePlaceholder.tsx`: Minimal route body used by unfinished feature pages (`h1` with `tabIndex={-1}`).
- `src/routes/NotFoundPage.tsx`: Not-found message plus a link back to the dashboard.
- `src/routes/createMemoryRouter.ts`: Exports `createTestRouter` for tests; builds a memory router from `routeConfig`.
- `src/layout/AppShell.tsx`: Application frame with skip link, header, primary navigation, admin/settings group,
  `Outlet` main region, footer (including runtime release identifier), document title, and heading focus on location
  change.

### Feature Modules

Thin route wrappers under `src/features/*/routes/` own paths for later tickets. Most still render `RoutePlaceholder`:

- `src/features/dashboard/routes/DashboardPage.tsx` (`/`, FEAT-11)
- `src/features/books/routes/BooksPage.tsx` (`/books`, FEAT-04)
- `src/features/books/routes/NewBookPage.tsx` (`/books/new`, FEAT-05)
- `src/features/books/routes/BookDetailsPage.tsx` (`/books/:bookId`, FEAT-04)
- `src/features/books/routes/EditBookPage.tsx` (`/books/:bookId/edit`, FEAT-10)
- `src/features/books/routes/DeletedBooksPage.tsx` (`/admin/deleted`, FEAT-10)
- `src/features/books/routes/BackupLibraryPage.tsx` (`/admin/backup`, FEAT-10)
- `src/features/loans/routes/CheckoutPage.tsx` (`/checkout`, FEAT-07)
- `src/features/loans/routes/CheckinPage.tsx` (`/checkin`, FEAT-08)
- `src/features/loans/routes/LoansPage.tsx` (`/loans`, FEAT-08)
- `src/features/connection/routes/ConnectionPage.tsx` (`/settings/connection`, FEAT-02; mounts `ConnectionScreen`)

Connection feature (FEAT-02, complete; extend carefully during FEAT-03):

- `src/features/connection/connectionTypes.ts`: Connection status union (`checking`, `setup_required`, `connected`,
  `unauthorized`, `unreachable`).
- `src/features/connection/connectionToken.ts`: In-memory current token accessors.
- `src/features/connection/connectionStorage.ts`: `sessionStorage` load/save/clear helpers.
- `src/features/connection/connectionApi.ts`: Ad hoc `GET /health` and `GET /protected` fetches (prefer typed
  `healthApi` / `protectedApi` once FEAT-03 finishes that swap).
- `src/features/connection/connectionInvalidation.ts`: `subscribeToConnectionInvalidation` /
  `notifyConnectionInvalidated` seam for clearing cached protected data when the token is forgotten or rejected.
- `src/features/connection/ConnectionContext.ts` / `useConnection.ts`: Context value and hook.
- `src/features/connection/ConnectionProvider.tsx`: Owns status, token lifecycle, `apiClient`, connect / retry /
  forget, and unauthorized handling.
- `src/features/connection/ConnectionScreen.tsx`: Connection settings UI.

### Shared Components

Import shared UI from `src/components/index.ts` rather than deep paths when writing application or feature code.

- `src/components/Alert.tsx`: Status alert; `error` uses `role="alert"`, other variants use `role="status"`.
- `src/components/AppLink.tsx`: React Router `Link` wrapper with optional visual variants.
- `src/components/Button.tsx`: Button primitive with `primary`, `secondary`, and `danger` variants.
- `src/components/ConfirmationDialog.tsx`: Modal confirmation dialog on the native `<dialog>` element, with labelled
  description, focus trap, Escape cancel, and focus restoration.
- `src/components/EmptyState.tsx`: Empty-content section with optional supporting text and action slot.
- `src/components/Field.tsx`: Labelled control wrapper that wires `id`, help text, and error associations.
- `src/components/LoadingState.tsx`: Polite live-region loading indicator.
- `src/components/Notifications.tsx`: `NotificationsProvider` and dismissible toast list (per-item live roles).
- `src/components/NotificationsContext.ts`: Notification types and React context.
- `src/components/useNotifications.ts`: Hook that reads the notifications context (throws outside the provider).
- `src/components/index.ts`: Barrel re-exports for the shared components and notifications API.

These components apply the class names defined in `src/styles/components.css`. Live route pages still use placeholders
except connection settings, so most primitives are exercised by tests and ready for feature tickets rather than by
product workflows.

### Styling

- `src/index.css`: Global CSS entrypoint imported by `src/main.tsx`. It imports all style layers in order.
- `src/styles/tokens.css`: Design tokens for typography, spacing, sizing, colors, borders, focus, shadows, and
  motion.
- `src/styles/base.css`: Element defaults and accessibility foundations, including box sizing, controls, links,
  focus visibility, page typography, skip links, and reduced motion.
- `src/styles/shell.css`: Application-frame classes for header, navigation, main content, footer, route pages, and
  responsive layouts.
- `src/styles/components.css`: Shared class-based primitives for buttons, links, forms, alerts, status views,
  dialogs, and notifications. They use BEM-like naming and are referenced by the shared component modules.

Choose the CSS layer based on responsibility:

- Shared values belong in `tokens.css`.
- HTML element defaults belong in `base.css`.
- Application frame and navigation layout belong in `shell.css`.
- Reusable UI patterns belong in `components.css`.
- Feature-specific styles may be colocated once feature modules gain real UI.

Preserve the import order in `src/index.css`: tokens, base, shell, components.

### Tests

- `src/App.test.tsx`: Document title and heading-focus behavior for client-side navigations via `renderAppTree`.
- `src/RootErrorBoundary.test.tsx`: Recoverable root error-boundary fallback.
- `src/layout/AppShell.test.tsx`: Landmarks, navigation labels, footer release identifier, current-page state, and
  not-found recovery.
- `src/components/SharedState.test.tsx`: Field associations plus alert, loading, and empty-state semantics.
- `src/components/ConfirmationDialog.test.tsx`: Dialog labelling, focus, Escape, confirm, and restoration.
- `src/components/Notifications.test.tsx`: Live-region roles, dismissal, and provider hook usage.
- `src/config/runtimeConfig.test.ts` / `runtimeConfigState.test.ts`: Config validation and read helpers.
- `src/api/apiClient.test.ts`: Currently duplicates a books `list()` mock and no longer covers Bearer / public /
  `403` / timeout / invalid JSON / `204` client behavior (restore/extend as part of FEAT-03).
- `src/api/apiErrors.test.ts` / `apiTypes.test.ts` / `api.test.ts`: Error, schema alias, and `createApi` coverage.
- `src/api/booksApi.test.ts` / `loansApi.test.ts` / `dashboardApi.test.ts` / `healthApi.test.ts` /
  `protectedApi.test.ts` / `backupApi.test.ts`: Happy-path typed route helper coverage.
- `src/api/queryClient.test.ts` / `queryInvalidation.test.ts` / `booksQueries.test.tsx`: Query client factory,
  connection-invalidation subscription, and partial books hooks.
- `src/features/connection/ConnectionProvider.test.tsx` / `ConnectionScreen.test.tsx` /
  `connectionToken.test.ts`: Connection lifecycle and UI.
- `src/test/setup.ts`: Global Vitest setup that installs jest-dom matchers for every test.
- `src/test/renderAppTree.tsx`: Shared helpers (`renderAppTree`, `renderWithProviders`, `mockReachableApi`,
  `testRuntimeConfig`) that mount under `AppProviders` with a mocked reachable API.
- `scripts/productionBuildTokenInspection.test.ts`: Production build with source maps; fails if known test tokens
  appear in artifacts.

Tests use a jsdom browser simulation (except the Node-environment production-build inspection). Prefer semantic
Testing Library queries such as `getByRole()` and test user-visible behavior instead of implementation details.
Route tests should use `createTestRouter` / `renderAppTree` and must not mutate `window.history` across cases.

The test flow is:

```text
yarn test
  -> Vitest reads vite.config.ts
  -> jsdom supplies browser APIs
  -> src/test/setup.ts installs shared matchers
  -> colocated *.test.tsx / *.test.ts files render through Testing Library
```

### Dependencies and Commands

- `package.json`: Package metadata, Node and Yarn requirements, scripts (including `api:generate` / `api:check`),
  runtime dependencies, and development dependencies.
- `yarn.lock`: Yarn-generated exact dependency resolutions and checksums. Never edit it manually.
- `Makefile`: Stable wrappers around Yarn scripts for installation, development, checks, tests, and builds.
- `.nvmrc`: Exact Node.js version used by `nvm use`.
- `.yarnrc.yml`: Configures Yarn to use the `node_modules` linker instead of Plug'n'Play.

### Build, Type Checking, and Linting

- `vite.config.ts`: Shared Vite and Vitest configuration. Enables React, jsdom tests, global test setup, and an
  optional same-origin API proxy when `SHADE_API_PROXY=1` (optional `SHADE_API_PROXY_TARGET`).
- `eslint.config.js`: Flat ESLint configuration for TypeScript and React Hooks. It ignores generated directories
  and treats warnings as failures through the package script.
- `tsconfig.json`: TypeScript solution file that references the application and Node/tooling configurations.
- `tsconfig.app.json`: Strict browser and React type checking for `src/`. It includes Vite, Vitest, and jest-dom
  types and emits no files.
- `tsconfig.node.json`: Strict Node-side type checking for `vite.config.ts`. It emits no files.

### Repository Guidance

- `README.md`: Concise human onboarding for prerequisites, setup, development, local CORS-or-proxy options,
  `sessionStorage` token limits, production connectivity release blocker, checks, and production builds.
- `.gitignore`: Excludes dependencies, generated output, secrets, local data, editor files, and OS metadata.
- `.gitattributes`: Normalizes text files to LF line endings and marks common binary extensions.
- `.cursor/rules/documentation-style.mdc`: Markdown punctuation, line-length, and newline rules for Cursor.
- `.cursor/rules/grep-tool.mdc`: Requires `grep` rather than the `rg` shell command in this environment.
- `.cursor/rules/readonly-git.mdc`: Prohibits Cursor from changing Git state.
- `.cursor/rules/scope.mdc`: Defines allowed repository read/write boundaries and related Shade repositories.

The `.cursor` rules control AI-assisted work. They are not loaded by the application or included in builds.

Useful documents under `docs/` (not inventoried file-by-file here):

- `docs/tickets/FEAT-*.md`: Sequenced implementation tickets with acceptance criteria (`FEAT-03` through `FEAT-16`;
  FEAT-01 and FEAT-02 are complete and their ticket files are gone).
- `docs/ToDo.md`: Human checklist of ticket completion status.
- `docs/product-docs/PLAN.md`: Frontend production roadmap.
- `docs/product-docs/PRODUCT_REQS.*.md`: Product requirements drafts and notes.
- `docs/product-docs/UI_DESIGN_NOTES.MD`: UI and design decisions; consult when visual design is in question.
- `docs/technical-reference/openapi.json`: Authoritative backend OpenAPI 3.1 schemas (see Backend Contract).
- `docs/technical-reference/API-for-FE.md`: Behavioral API guidance complementary to `openapi.json`.
- `docs/technical-reference/bash-reference.md`: Shell command reference notes for maintainers.
- `docs/MAINTAINERS.md`: Human-oriented maintainer guide parallel to this file.

## Development Commands

Initial setup:

```sh
nvm use
corepack enable
make install
```

Common commands:

- `make install`: Runs `yarn install --immutable`; fails when the manifest and lockfile disagree.
- `make run`: Starts the Vite development server with hot reloading.
- `make preview`: Serves an existing production build.
- `make lint`: Runs ESLint with zero warnings allowed.
- `make typecheck`: Runs TypeScript build mode across both TypeScript configurations.
- `make test`: Runs all Vitest tests once.
- `yarn test:watch`: Runs Vitest in watch mode during development.
- `make build`: Type-checks and writes an optimized application to `dist/`.
- `make check`: Runs lint, type checking, tests, and a production build.
- `yarn api:generate`: Regenerates `src/api/generated/openapi.ts` from `docs/technical-reference/openapi.json`.
- `yarn api:check`: Regenerates types and fails if the generated file differs from git.

`make check` currently performs type checking twice because `make build` also type-checks. This is expected.

Local API connectivity: by default `public/config.js` points at `http://127.0.0.1:8000` and the backend allows the
Vite origins, so no proxy is required. Optional same-origin proxy: set `apiBaseUrl` to the Vite origin and run
`SHADE_API_PROXY=1 make run` (optional `SHADE_API_PROXY_TARGET`).

The build flow is:

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

## Implementation Conventions

- Keep TypeScript strict and avoid `any` unless an unavoidable boundary is documented.
- Prefer semantic HTML. Add ARIA only when native semantics cannot express the behavior.
- Preserve visible keyboard focus, 44-pixel control targets, and reduced-motion support.
- Reuse design tokens and existing shared CSS classes before adding new values or primitives.
- Shared CSS follows `.component`, `.component__element`, and `.component--modifier` naming.
- Import global CSS once through `src/index.css`; do not scatter global imports across components.
- Import shared components from `src/components/index.ts`.
- Colocate component tests using `*.test.tsx` (and colocated `*.test.ts` for non-UI modules).
- Use extensionless relative TypeScript imports, matching current source style.
- Follow the existing TypeScript style: single quotes, no semicolons, and trailing commas where supported.
- Keep feature UI behind the existing `src/features/*/routes/` ownership; replace placeholders when a ticket owns that
  route rather than inventing a parallel tree.
- Extend the existing API client, generated types, query helpers, and connection-invalidation seam during FEAT-03; do
  not introduce a second state store, component library, CSS framework, or form library unless a ticket explicitly
  requires it.
- Finish FEAT-03 server-state work on the existing React Query mount: configure `createQueryClient` defaults, subscribe
  `subscribeQueryClientToConnectionInvalidation` from bootstrap (for example under `AppProviders`), and complete
  mutations/invalidation per PLAN.md section 7.5.
- For API-dependent work, treat `docs/technical-reference/openapi.json` as the schema source of truth and
  `docs/technical-reference/API-for-FE.md` as behavioral guidance.
- Prefer product-domain names over vague folders such as `helpers` or `misc`.
- Never commit the API token, compile it into JS, put it in URLs, log Authorization headers, render API text as HTML,
  or upload SQL backup contents to telemetry.

## Change Workflow

1. Inspect the relevant source, tests, configuration, and current working tree.
2. Identify the smallest complete change and any behavior that requires a test.
3. Implement without modifying unrelated work.
4. Run focused tests or checks while iterating.
5. Run `make check` when proportionate to the change.
6. Review the final diff for correctness, accidental generated files, secrets, and stale documentation.
7. Report changed files, verification performed, and any remaining uncertainty.

If a new file, command, dependency, architecture pattern, or runtime flow is introduced, update this context so the
next fresh chat does not begin with stale assumptions.
