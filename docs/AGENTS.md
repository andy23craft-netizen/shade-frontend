# Agents.md: LLM Project Context

Use this document as the complete baseline context when working on the Shade frontend in a fresh LLM chat. It covers
operating rules, the backend contract, architecture, and the current codebase inventory (baseline as of 2026-08-16 --
verify against the repository before editing). Start from this file alone for that baseline; it does not depend on any
other LLM prompt or agents guide (`docs/full-project-context.md` is a slim ChatGPT pack, not required here). Attach
product tickets, OpenAPI, and other `docs/` references only when the current task needs them. Inspect the current
repository before making changes because the code may have changed since this document was written. A user's explicit
request takes precedence over general guidance here.

## Project Summary

Shade is a browser UI for a personal home-library FastAPI backend. Shipped capabilities include:

- Application shell, shared UI primitives, runtime config, build-time Bearer auth, and typed OpenAPI + React Query
  server state (PLAN.md 7.5 invalidation).
- Dashboard metrics on `/` (`DashboardPage` / `useDashboard`); Collection, Circulation, and Reading Record from the
  API only (null averages as "Not enough data"; contract warnings without inventing totals).
- Active collection and book details (`/books`, `/books/:bookId`) with infinite scroll, shelf sort, Read/Unread, and
  ratings; category filter UI is deferred to FEAT-18.
- Book create/edit (`/books/new`, `/books/:bookId/edit`) via shared `BookForm` / `bookFormModel` / `bookEditModel`,
  ISBN lookup on create, and API-fed shelf pickers (`shelf_name`; create requires an explicit shelf).
- ISBN camera and hardware-scanner capture under `src/features/scanning/` (lazy-loaded from `/books/new` and
  `/checkout`; support matrix in `docs/baselines/FEAT-06_scanner-support.md`).
- Checkout, check-in, and loan history (`/checkout`, `/checkin`, `/loans`), including checkout Find-by-ISBN via
  `useBooks({ isbn })` (not lookup) and `412` `display_only` refetch/messaging (alternate-copy offers wait for
  FEAT-21).
- Reading completion and later edits (`/books/:bookId/mark-read`, `/books/:bookId/reading`); no mark-unread.
- Soft delete/restore, deleted admin, and authenticated SQL backup (`/books/:bookId/delete`, `/admin/deleted`,
  `/admin/backup`).
- Shelves catalog CRUD on `/shelves` (`shelvesApi` / `useShelves` / write mutations) with system-shelf protection
  (`unknown` / `removed`); book payloads use `shelf_name` (string; no hard-coded `Shelf` enum).
- Optional runtime-configured diagnostic reporting (`src/diagnostics/diagnosticReporter.ts`), heading focus and
  long-content hardening, and evergreen smoke in `docs/baselines/FEAT-12_browser-support.md`. Performance notes in
  `docs/baselines/FEAT-03_performance.md` (FEAT-14 owns future budget enforcement).
- Generated OpenAPI types already know wishlist and dashboard-report paths; `booksApi` accepts `author` / `title` /
  `category` list filters -- do not call those product APIs or ship those UIs until FEAT-19 / FEAT-20.

Prefer dedicated lifecycle endpoints; never simulate restore, checkout, check-in, or initial mark-read with generic
`PATCH`. Prefer ticket presence under `docs/tickets/` over `docs/ToDo.md` when judging what is still open (the
checklist can lag). Do not invent undocumented routes, realtime channels, or lifecycle shortcuts.

**Next / in progress:** `docs/tickets/FEAT-13_workflow-and-accessibility-tests.md` (automated accessibility checks,
browser-level journeys for MVP routes and lifecycle endpoints, mock/fixture coverage of the documented status matrix,
coverage thresholds, and folding those suites into `make check`). Scaffolding already present: `playwright.config.ts`,
`e2e/` (dashboard smoke, mock API helper, axe helper), and `yarn test:e2e` -- not yet part of `make check`. Reuse
existing typed helpers, page tests, redaction seams, and the checked-in scanner / browser-support baseline matrices.
Do not pull FEAT-14 CI packaging, FEAT-15 Podman, FEAT-16 release artifacts, or FEAT-17 through FEAT-21 product work
into FEAT-13. Product routes are fully implemented (no unfinished `RoutePlaceholder` feature pages remain). Later
tickets under `docs/tickets/`: About as homepage with relocated dashboard (FEAT-17), collection category filter UI
(FEAT-18), wishlists (FEAT-19), dashboard report surfaces (FEAT-20), and display-only checkout alternate-copy UX
(FEAT-21). Host-owned HTTPS/CSP / SPA fallback / production config notes live in `README.md` and `docs/MAINTAINERS.md`
(FEAT-16 owns rollout).

Notable shipped behaviors agents should preserve:

- Diagnostics: `createDiagnosticReporter` from `RuntimeConfig.diagnostics` + `release`, wired through
  `RootErrorBoundary`, `AppProviders`, `ConnectionProvider`, and `apiClient` `onRequestFailure`; allowlisted/redacted
  via `assertSafeApiDiagnostic`; defaults disabled in `public/config.js`; never invent a second telemetry transport or
  fabricate correlation IDs.
- Dashboard: explicit Refresh, offline/paused and stale status, `QueryErrorState` recovery; styles in
  `src/styles/components.css`. FEAT-17 will move About to `/` and relocate the dashboard.
- Edit: minimal `BookUpdate` patch (blank ISBN → `null`; never send `status`, reading fields, or loan-driving values);
  Field-linked `422`; `404` refetch; no-op rejection; deleted warning; shelves load gate.
- Delete/restore/backup: on-loan blocking via `status === 'on_loan'` or `findActiveLoan`; programmatic `<a download>`
  with always-`URL.revokeObjectURL`; never inspect/log/cache/upload dump contents.
- Checkout: eligible books only (`deletion_date === null` and `status === 'available'`); confirmation; Field-linked
  `422`; `404`/`409`/`412` stale-state refetch with preserved form input.
- Check-in / loans: eligibility via `findActiveLoan` / `isCheckinEligible` (not book `status` alone); blank return time
  omits body; active vs returned sections with due/overdue labels and durable `Book {id}` fallback.
- Reading: initial unread-to-read via `POST /books/{id}/mark-read` only; later edits via `PATCH`; collection cards show
  Read/Unread plus rating (`N / 5`, or an em dash when null).
- Shelves: Title Case `common_name` labels; `unknown` allowed on books; `removed` excluded except edit may surface
  current membership; Add/Edit Book block the page when shelves fail to load; no shelf CRUD on book forms.
- Scanning: hands one ISBN into create lookup or checkout Find; never creates or checks out from scan success alone.

Product intent, sequencing, and acceptance criteria live under `docs/`. Prefer the current ticket, then
`docs/product-docs/PLAN.md`, then the product requirements docs when deciding what to build next.

## Technology

- React 19
- TypeScript 6 in strict mode
- Vite 8
- React Router 7 (`react-router-dom`), integrated in `src/main.tsx`
- TanStack React Query 5 (`QueryClientProvider` mounted under `AppProviders` with configured client defaults,
  books/loans/dashboard hooks including infinite-list pagination, and mutation detail-cache writes)
- `openapi-typescript` for generating `src/api/generated/openapi.ts` from the checked-in OpenAPI document
- `@zxing/browser` + `@zxing/library` for camera ISBN decode (lazy-loaded from `/books/new` and `/checkout`; not on
  the critical path for ordinary navigation)
- Vitest with jsdom
- Testing Library and jest-dom
- Playwright (`@playwright/test`) with `@axe-core/playwright` for browser journeys and accessibility checks (FEAT-13;
  `yarn test:e2e`; not yet folded into `make check`)
- ESLint flat configuration
- Yarn 4 through Corepack (`yarn@4.18.0` in `package.json`)
- Node.js 26.7.0
- Make command wrappers

The package uses native ECMAScript modules through `"type": "module"`. No Next.js, Tailwind, component library, or form
library.

## Backend Contract

The backend is a separate repository. Default local API base is `http://127.0.0.1:8000` with **no** `/api` prefix. Treat
these as complementary sources of truth:

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
- Token comes from a repository-root `.env` file via `VITE_API_SECRET_KEY`; Vite injects it at dev-server and
  production build time into JS bundles (`.env` stays gitignored; `.env.example` is committed)
- Fail-fast bootstrap: `readApiToken()` in `src/main.tsx` throws before the app shell mounts when the variable is
  missing or blank
- No `sessionStorage`, no connection settings screen, and no runtime token entry
- Missing or invalid credentials return `403`; describe generically as "API access was rejected"
- On `403`, show a page-level error via `QueryErrorState` / `formatApiQueryError`; do not clear the query cache or
  loop back into loading
- Startup reachability uses public `GET /health` only; do not verify auth with `GET /protected`
- Never commit the token, put it in URLs, log Authorization headers, or send it to analytics
- A build-time token in JS bundles is inspectable by anyone with device or artifact access; that is an accepted risk
  for this trusted personal deployment and is not real multi-user authentication

### Lifecycle endpoints (never simulate with generic PATCH)

| Operation     | Endpoint                        |
|---------------|---------------------------------|
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
- Do not send `null` for required DB fields (title, authors, category, shelf_name on create, is_read, status).
- Load shelves from `GET /shelves` for book placement; send selected `common_name` as `shelf_name` (never Title Case
  display strings). Manage the catalog on `/shelves` with documented `POST` / `PATCH` / `DELETE` (do not invent shelf
  CRUD on Add/Edit Book).
- Prevent blank title, authors, borrower, and (on create) unselected shelf.
- Prevent deletion of on-loan books (backend allows it; frontend must not).
- Render unknown enum values safely (see `enumDisplayValue`).
- Display API-provided dashboard statistics; do not recalculate business metrics. If an average is `null`, show
  something like "Not enough data" -- do not invent zero.

### Scope

**In scope for MVP:** dashboard, active books, detail, manual/ISBN/camera/scanner add flows, edit, checkout, check-in,
loan history, reading tracking, soft delete/restore, deleted admin, authenticated SQL backup, runtime API config, CI,
Podman preview, versioned production artifacts. Ticketed follow-ons (implement only when working that ticket): About
homepage (FEAT-17), collection category filter UI (FEAT-18), wishlists (FEAT-19), dashboard reports / incomplete
metadata (FEAT-20), display-only alternate-copy checkout UX (FEAT-21).

**Out of scope unless explicitly requested:** UPC, true multi-library tenancy, cover images, overdue notifications,
Goodreads/StoryGraph, user accounts/roles, realtime sync, loan CRUD, mark-unread, remote Ansible/systemd/TLS/rollback
orchestration. Collection browse (`BooksPage`) and loan history (`LoansPage`) use infinite scroll with backend
pagination; other callers still fetch unpaginated full lists when needed.

Do not expand a ticket into out-of-scope features. Do not implement future tickets prematurely.

## Agent Operating Rules

- Work only inside the frontend repository.
- The related backend and orchestrator repositories may be read when cross-project context is necessary.
- Do not mutate Git state. Do not stage, unstage, commit, check out, push, pull, add, remove, or delete through Git. Ask
  before stashing or unstashing.
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
       -> readApiToken() (fail fast when missing)
       -> readRuntimeConfig()
            -> on failure: RuntimeConfigScreen (retry)
            -> on success:
                 createDiagnosticReporter(runtime diagnostics + release)
                 RootErrorBoundary (reports redacted render failures)
                   -> AppProviders (shared DiagnosticReporter)
                        -> NotificationsProvider
                        -> QueryClientProvider (createQueryClient())
                        -> ConnectionProvider (createApiClient + onRequestFailure reporter, token, GET /health)
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

`AppShell` owns document title updates (`{route title}` plus an em dash and ` Shade`), skip link, primary and admin
navigation (brand includes "est. 2026"), the main `Outlet`, footer (runtime release identifier), and heading focus
after client-side navigations.
Live product UI today: `/` (`DashboardPage` + `useDashboard`), `/books` (`BooksPage`, including Read/Unread
and rating on collection cards), `/books/:bookId` (`BookDetailsPage`, including reading-field display, gated Mark
Read / Edit Reading / Edit Book / Delete Book), `/books/new` (`NewBookPage` + `BookForm` / `bookFormModel` with ISBN
lookup plus camera/hardware scanner capture), `/books/:bookId/edit` (`EditBookPage` + `bookEditModel`),
`/books/:bookId/delete` (`DeleteBookPage`), `/books/:bookId/mark-read` (`MarkReadPage` + `markReadModel`),
`/books/:bookId/reading` (`ReadingEditPage` + `readingEditModel`), `/checkout` (`CheckoutPage` + `checkoutModel`
with ISBN Find via `useBooks({ isbn })`, confirmation, and `useCheckoutBook`), `/checkin` (`CheckinPage` +
`checkinModel` + `checkinEligibility`), `/loans` (`LoansPage` + `loanTemporal`), `/shelves` (`ShelvesPage` +
`useShelves` / write mutations), `/admin/deleted` (`DeletedBooksPage`), and `/admin/backup`
(`BackupLibraryPage`). No feature routes still render `RoutePlaceholder` (`RoutePlaceholder.tsx` remains only as an
unused helper).

TypeScript checks source code but emits no JavaScript. Vite transforms modules during development and creates the
production bundle. The CSS import order is intentional: later layers use tokens and defaults declared by earlier layers.

## Project Structure

This inventory covers every project-owned file outside `docs/`. Do not assume generated or dependency directories are
source code. In particular, omit `node_modules/`, `dist/`, `coverage/`, `.vite/`, `.yarn/`, and `.git/` from normal code
changes. Prefer regenerating `src/api/generated/openapi.ts` with `yarn api:generate` rather than hand-editing it.

### Browser Application

- `index.html`: Vite's HTML entrypoint. Defines page metadata, creates `#root`, loads `/config.js`, then `src/main.tsx`.
- `public/config.js`: Runtime config assigned to `window.__SHADE_CONFIG__` (`apiBaseUrl`, `release`, optional
  `diagnostics: { enabled, endpoint }`). Not bundled; edit for local or deployed environments. Diagnostics default to
  `enabled: false` / `endpoint: null` so reporting can be enabled or retargeted without rebuilding.
- `public/favicon.png`: Static favicon served as-is (not bundled).
- `src/main.tsx`: Browser bootstrap. Calls `readApiToken()` (throws when missing), reads runtime config, either mounts
  `RuntimeConfigScreen` or creates `createDiagnosticReporter` then mounts `RootErrorBoundary` -> `AppProviders` ->
  `RouterProvider` in `StrictMode`, and imports global CSS.
- `src/AppProviders.tsx`: Application-wide providers. Wraps `NotificationsProvider`, `QueryClientProvider`
  (`createQueryClient()`), and `ConnectionProvider` (requires validated `runtimeConfig` and shared
  `diagnosticReporter`).
- `src/RootErrorBoundary.tsx`: Class error boundary with a recoverable fallback (retry and return home); reports
  redacted render failures through `diagnosticReporter.reportRenderFailure()`.
- `src/vite-env.d.ts`: Adds Vite client, asset, and `window.__SHADE_CONFIG__` (`diagnostics?: unknown`) declarations
  to TypeScript. It has no runtime behavior.

### Runtime Configuration

- `src/config/runtimeConfig.ts`: Validates and normalizes `apiBaseUrl`, `release`, and optional `diagnostics`
  (`RuntimeDiagnosticConfig`: `enabled`, `endpoint`); throws `RuntimeConfigError`. Omitted `diagnostics` defaults to
  disabled with a null endpoint; when `enabled` is true, `endpoint` must be a valid HTTP(S) URL.
- `src/config/runtimeConfigState.ts`: `readRuntimeConfig()` returns `{ config, error }` without throwing.
- `src/config/RuntimeConfigScreen.tsx`: Blocking UI when config is missing or invalid, with retry.
- `src/config/apiToken.ts`: `readApiToken()` reads `import.meta.env.VITE_API_SECRET_KEY` (trimmed); throws
  `ApiTokenError` when missing or blank.

### Diagnostics (complete -- extend, do not replace)

- `src/diagnostics/diagnosticReporter.ts`: `createDiagnosticReporter({ config, release })` returns a
  `DiagnosticReporter` with `reportApiFailure` / `reportRenderFailure`. When disabled or endpoint is null, methods are
  no-ops. Enabled reporters POST allowlisted JSON (`api_request_failure` or `render_failure`) after
  `assertSafeApiDiagnostic`; fetch failures are swallowed so diagnostics never interfere with recovery. Do not invent
  a second telemetry transport or fabricate correlation IDs.
- `src/diagnostics/diagnosticReporter.test.ts`: Disabled/enabled reporting, redaction assertions, and failure
  isolation coverage.
- Wiring: `main.tsx` creates the reporter; `RootErrorBoundary` reports render failures; `ConnectionProvider` passes
  `onRequestFailure` into `createApiClient` so API failures call `reportApiFailure`; `renderAppTree` supplies a
  reporter in tests.

### API Layer

- `src/api/generated/openapi.ts`: Generated OpenAPI types. Do not hand-edit; use `yarn api:generate` / `yarn api:check`.
- `src/api/apiTypes.ts`: Exported schema aliases (`BookCreate` / `BookUpdate` / `BookRead` / `BookList`, lookup, loan,
  dashboard, health, `ShelfCreate` / `ShelfUpdate` / `ShelfRead`, validation/error schemas, enums). Book payloads use
  `shelf_name` (string); there is no hard-coded `Shelf` enum.
- `src/api/enumDisplay.ts`: `enumDisplayValue` for known vs unknown enum strings with a neutral fallback.
- `src/api/apiCallOptions.ts`: Shared optional `AbortSignal` options type used by typed route helpers.
- `src/api/apiClient.ts`: `createApiClient` with Bearer injection, path joining at the configured base URL (no `/api`
  prefix), timeout (default 10s), caller `AbortSignal`, `get` / `request` / `getJson` / `requestJson`, empty `204`
  handling, invalid-JSON errors, `403` via `onUnauthorized`, and optional `onRequestFailure` for allowlisted/redacted
  diagnostic reporting of request failures.
- `src/api/apiErrors.ts`: `ApiError` kinds (`unreachable`, `timeout`, `cancelled`, `unauthorized`, `validation`,
  `invalid_response`, `server`, `http`), optional `detail` / `correlationId` / `fieldErrors`,
  `mapValidationFieldErrors` for FastAPI `422 detail[]`, `formatApiQueryError` for page-level error messages
  (appends `Request ID:` only when `correlationId` is present), and `isUnauthorizedQueryError` for `403` handling.
  `correlationId` stays unset until the backend documents a safe source (do not invent a header or body field).
- `src/api/apiRedaction.ts`: Safe diagnostic projection and assertions so API/error logs never retain headers, tokens,
  borrower names, notes, reviews, ISBN drafts, backup contents, or full bodies.
- `src/api/requestFields.ts` / `dateTime.ts`: Documented request-field picking for typed helpers and reusable
  `YYYY-MM-DD` / UTC ISO 8601 normalizers used by form tickets. Colocated unit tests cover both modules.
- `src/api/queryKeys.ts`: Shared React Query keys for books (`all`,
  `list({ includeDeleted, isbn?, author?, title?, category?, skip?, take?, sortBy?, sortOrder? })`,
  `infiniteList({ includeDeleted, isbn?, author?, title?, category?, sortBy?, sortOrder?, take })`, `detail(id)`,
  `lookup(isbn)`), loans (`all`, `list(bookId?)`, `infiniteList({ bookId?, take })`, `detail(id)`), dashboard, and
  shelves (`all`, `list()` unpaginated). Blank/whitespace `isbn` / `author` / `title` / `category` are omitted from
  keys (trimmed when present).
- `src/api/api.ts`: `createApi` aggregates typed helpers (`books`, `loans`, `shelves`, `dashboard`, `health`, `backup`)
  plus the underlying `client`. No wishlist aggregate yet (generated OpenAPI types include wishlist and
  dashboard-report paths; product helpers wait for FEAT-19 / FEAT-20).
- `src/api/booksApi.ts`: `list` (optional `includeDeleted`, `isbn`, `author`, `title`, `category`, `skip`, `take`,
  `sortBy` including `shelf`, `sortOrder`; omit empty/whitespace `isbn` / `author` / `title` / `category`; send
  `skip`/`take` together when paginating), `create`, `lookup`, `get`, `update`, `remove`,
  `restore`, `checkout` (including documented **412** `Book is display only`), `checkin` (optional body), `markRead`
  (defaults to `{}`). Helpers accept optional `AbortSignal` and serialize only documented request fields (including
  `shelf_name`).
- `src/api/loansApi.ts`: `list()` (`GET /loans`, optional `bookId` → `?book_id=...`, optional `skip`/`take` together;
  omit empty/`undefined` `bookId` and omitted pagination params), `get(id)` (`GET /loans/{id}`).
- `src/api/shelvesApi.ts`: `list()` (`GET /shelves`) returns a plain `ShelfRead[]` array (no pagination params);
  `create` (`POST` → **201**), `update` (`PATCH` → **200**), and `remove` (`DELETE` → **204**) serialize only
  documented `ShelfCreate` / `ShelfUpdate` fields.
- `src/api/dashboardApi.ts`: `get()` (`GET /dashboard`).
- `src/api/healthApi.ts`: `get()` public (`GET /health`, `authenticated: false`).
- `src/api/backupApi.ts`: `get()` returns `{ blob, filename }` for authenticated `/backup`, parsing UTF-8
  `Content-Disposition` (`filename*=UTF-8''...`) with a `backup.sql` fallback when the header is missing or malformed.
- `src/api/queryClient.ts`: `createQueryClient()` sets `staleTime` 30s, `refetchOnWindowFocus`, `refetchOnReconnect`,
  query retry that skips validation / auth / cancelled / invalid-response errors, and `mutations.retry: false`.
- `src/api/booksQueries.ts`: `useBooks` (optional `{ includeDeleted, isbn, author, title, category, skip, take, sortBy,
  sortOrder, enabled }`), `useInfiniteBooks` (optional `{ includeDeleted, isbn, author, title, category, sortBy,
  sortOrder, enabled }`; batch size 30 via shared config),
  `useBook`, `useBookLookup`, plus mutations (including `useCreateBook`, `useUpdateBook`, `useDeleteBook`,
  `useRestoreBook`, `useCheckoutBook`, `useCheckinBook`, and `useMarkBookRead`) that write returned `BookRead` into the
  detail cache (except delete) and invalidate per PLAN.md 7.5 (lists including `include_deleted` via the `['books']`
  prefix, detail, dashboard, and loans on checkout/check-in).
- `src/api/loansQueries.ts` / `dashboardQueries.ts` / `shelvesQueries.ts`: `useLoans` (optional `{ bookId }`),
  `useInfiniteLoans` (optional `{ bookId, enabled }`; batch size 30 via shared config), `useLoan(id)` (disabled when
  falsy), `useDashboard`, `useShelves({ enabled? })`, plus `useCreateShelf` / `useUpdateShelf` / `useDeleteShelf`
  that invalidate `queryKeys.shelves.all` (and books/dashboard when a rename includes `common_name`).

### Routing and Layout

- `src/routes/routeMetadata.ts`: Path, document-title fragment, and heading metadata for every registered route.
- `src/routes/routes.tsx`: `createBrowserRouter` configuration. `AppShell` is the parent layout. Registered paths are
  `/`, `/books`, `/books/new`, `/books/:bookId`, `/books/:bookId/mark-read`, `/books/:bookId/reading`,
  `/books/:bookId/edit`, `/books/:bookId/delete`, `/checkout`, `/checkin`, `/loans`, `/shelves`, `/admin/deleted`,
  `/admin/backup`, and `*` (not found).
- `src/routes/RoutePlaceholder.tsx`: Minimal route-body helper (`h1` with `tabIndex={-1}`). Unused by current feature
  routes; keep only if a future ticket needs a temporary placeholder.
- `src/routes/NotFoundPage.tsx`: Not-found message plus a link back to the dashboard.
- `src/routes/createMemoryRouter.ts`: Exports `createTestRouter` for tests; builds a memory router from `routeConfig`.
- `src/layout/AppShell.tsx`: Application frame with skip link, header (brand name plus "est. 2026"), primary
  navigation (including Shelves), admin/settings group, `Outlet` main region, footer (including runtime release
  identifier), document title, and heading focus on location change.

### Feature Modules

Route ownership under `src/features/*/routes/`. Implemented product UI vs placeholders:

Implemented (do not revert to placeholders):

- `src/features/shared/infiniteScrollConfig.ts`: `INFINITE_SCROLL_BATCH_SIZE` (30) and
  `INFINITE_SCROLL_PREFETCH_ROWS` (5) shared by `/books` and `/loans`
- `src/hooks/useInfiniteScrollTrigger.ts`: shared `IntersectionObserver` hook for prefetching the next batch near the
  bottom of loaded rows; colocated `useInfiniteScrollTrigger.test.ts`
- `src/features/books/routes/BooksPage.tsx` (`/books`, infinite scroll + ratings): active collection
  via `useInfiniteBooks({ sortBy, sortOrder })` with URL search params (`sortBy`, `sortOrder` only); sort controls
  include Author, Title, Date added, and Shelf (default author ascending); category filter UI is deferred to FEAT-18;
  loading, error+retry, empty state with link to `/books/new`, and list rows linking to detail with safe enum display
  for category/status, Title Case `shelf_name` via `formatShelfCommonNameForDisplay`, Read/Unread state, and rating
  (`N / 5`, or an em dash when null); bottom next-page loading and retry affordances
- `src/features/books/routes/BookDetailsPage.tsx` (`/books/:bookId`): detail via `useBook`;
  loading, not-found / error recovery, and field presentation with safe enum display, including Title Case
  `shelf_name`, `is_read`, `completion_date`, `rating`, and `review`. "Edit Book" links to `/books/:bookId/edit` when
  active. "Check Out" links to `/checkout?bookId=` when active and available. "Check In" links to
  `/checkin?bookId=...` when active and check-in eligible via `isCheckinEligible` (active loan present, not deleted).
  "Mark Read" links to `/books/:bookId/mark-read` when active and unread. "Edit Reading" links to
  `/books/:bookId/reading` when active and already read. "Delete Book" links to `/books/:bookId/delete` when
  active and not on loan (`status !== 'on_loan'` and no `findActiveLoan`).
- `src/features/books/routes/EditBookPage.tsx` / `bookEditModel.ts` / `bookEditModel.test.ts`
  (`/books/:bookId/edit`): metadata edit via shared `BookForm` + `useUpdateBook` / `booksApi.update` + `useShelves`;
  populate with `bookFormValuesFromBook` (seeds `shelfId` from `shelf_name`); minimal patch via
  `bookFormValuesToUpdate` (blank ISBN → `null`; omit unchanged `shelf_name`; never send `status`, reading fields, or
  loan-driving values); reject no-op submits; Field-linked `422` / **400** shelf errors; `404` refetch with preserved
  form input; in-flight disable; success to detail; deleted-book warning UI; full-page shelves load/error gate before
  the form. Reading fields stay on mark-read / reading-edit flows.
- `src/features/books/routes/DeleteBookPage.tsx` (`/books/:bookId/delete`): soft delete via `useDeleteBook` /
  `booksApi.remove` with `ConfirmationDialog`; blocks when `status === 'on_loan'` or `findActiveLoan` is present;
  soft-deleted / not-found / loan-status error recovery; success navigates away from the deleted detail. Never
  simulate delete with generic `PATCH`.
- `src/features/books/routes/DeletedBooksPage.tsx` (`/admin/deleted`): `useBooks({ includeDeleted: true })`
  filtered to non-null `deletion_date`; restore via `ConfirmationDialog` + `useRestoreBook` / `booksApi.restore`;
  empty / loading / retryable error states; `404`/`409` restore messaging with refetch.
- `src/features/books/routes/BackupLibraryPage.tsx` (`/admin/backup`): authenticated SQL download via
  `backupApi.get` through `useConnection().apiClient`; programmatic `<a download>` with always-`URL.revokeObjectURL`;
  documented `403` / generation `500` / network failure messaging; never inspect, log, cache, or upload dump contents.
- `src/features/dashboard/routes/DashboardPage.tsx` (`/`): `useDashboard` metrics for Collection, Circulation,
  and Reading Record; null averages as "Not enough data"; API inconsistency warning without recalculation; Refresh
  plus offline/stale status; `QueryErrorState` recovery. Styles in `src/styles/components.css`.
- `src/features/books/routes/MarkReadPage.tsx` / `markReadModel.ts` (`/books/:bookId/mark-read`): initial
  unread-to-read via `useMarkBookRead` / `booksApi.markRead` / `pickMarkReadRequest`; optional
  date-only completion date, rating 1-5, and review; omit blanks; `ConfirmationDialog` before mutate; Field-linked
  `422`; `404` refetch with preserved form input; in-flight disable; success navigates to detail. Active unread books
  only; deleted / already-read warning UI. Never simulate this transition with generic `PATCH`.
- `src/features/books/routes/ReadingEditPage.tsx` / `readingEditModel.ts` / `readingEditModel.test.ts`
  (`/books/:bookId/reading`): later reading-field edits via `useUpdateBook` / `booksApi.update` /
  `pickBookUpdate`; populate from `BookRead`; send only changed `completion_date` / `rating` / `review` (blank →
  `null`); reject no-op submits; `ConfirmationDialog`; Field-linked `422`; `404` refetch with preserved form input;
  success to detail. Active already-read books only; deleted / unread warning UI. Does not offer mark-unread.
- `src/features/books/routes/NewBookPage.tsx` (`/books/new`): loads `useShelves` first
  (loading / full-page `QueryErrorState` without mounting `BookForm` on failure); mounts shared `BookForm` with shelves,
  optional ISBN lookup via `useBookLookup` (checksum-gated; apply draft without overwriting the typed ISBN;
  progress/cancel/retry and manual fallback), creates via `useCreateBook`, maps create `422` `shelf_name` and **400**
  shelf errors into the form summary, disables controls while pending, and navigates to the new detail on success.
  Camera ("Scan ISBN") and hardware scanner capture hands one ISBN into the same lookup path (never calls `POST /books`
  from scanner success); hardware listening is disabled while the camera UI is open or lookup is fetching
- `src/features/books/components/BookForm.tsx` / `bookFormDefaults.ts` / `bookFormModel.ts`: reusable create/edit form
  model (title, authors, ISBN, publisher, publication date as text for year-only values, pages, category, `shelfId`
  from `GET /shelves`, tags, purchase fields, notes). Create UI omits status/read/loan/review; create conversion always
  sends `status=available` and `is_read=false` and resolves `shelfId` → `shelf_name` (`common_name`); create defaults
  to empty shelf selection (explicit pick required, including `unknown`). Shelf options use Title Case labels; exclude
  `removed` except edit may surface current `removed` membership as a disabled selected option. No inline shelf CRUD.
  Edit conversion lives in `bookEditModel` (minimal patch; never status/reading/loan fields). Client validation,
  Field-linked errors, error summary focus, tag normalization, and `formValuesToBookCreate` blank-optional-to-`null`
  conversion. Submit label is "Save Book". Colocated `BookForm.test.tsx` / `bookFormModel.test.ts` cover gating,
  validation, conversion, and server error linking
- `src/features/shelves/shelfDisplay.ts`: Title Case `formatShelfCommonNameForDisplay`, assignable-shelf helpers
  (`unknown` allowed; `removed` excluded), system-shelf rename/delete guards, and id↔`common_name` lookup; colocated
  `shelfDisplay.test.ts`
- `src/features/shelves/shelfFormModel.ts`: create/edit form values, client validation, `ShelfCreate` /
  changed-fields `ShelfUpdate` conversion; colocated `shelfFormModel.test.ts`
- `src/features/shelves/routes/ShelvesPage.tsx` (`/shelves`): shelf catalog via `useShelves` with create /
  edit / delete through `useCreateShelf` / `useUpdateShelf` / `useDeleteShelf`; Title Case names; system-shelf
  labelling and protection for `unknown` / `removed` (no rename/delete; metadata edits allowed);
  `ConfirmationDialog` for delete; Field-linked **422** plus **400** / **404** / **409** mapping; loading /
  `QueryErrorState` / empty states. Book forms do not create or edit shelves.
- `src/features/books/booksListModel.ts`: `BOOKS_BATCH_SIZE` (from shared infinite-scroll config), sort types
  (`author` | `title` | `creationDate` | `shelf`), sort URL parsing/labels, and page flattening helper; colocated
  `booksListModel.test.ts`
- `src/features/books/components/BooksListControls.tsx`: labelled sort selects for `BooksPage` (includes Shelf)
- `src/features/books/utils/isbn.ts`: ISBN-10 / ISBN-13 checksum helpers plus `compactIsbnForListFilter` (punctuation
  strip only for `GET /books?isbn=`); used by lookup, create, scanner capture, and checkout ISBN Find; colocated unit
  tests
- `src/features/loans/routes/CheckoutPage.tsx` (`/checkout`, Find-by-ISBN): eligible books via
  `useBooks`; ISBN Find via checksum-gated `useBooks({ isbn })` with typed / camera / hardware handoff (lazy
  `IsbnCameraScanner`, same enablement pattern as `/books/new`); single-match auto-select via `?bookId=`, multi-match
  chooser, zero / ineligible messaging; `?bookId=` deep-link with refresh; confirmation via `ConfirmationDialog`;
  checkout via `useCheckoutBook`; Field-linked `422` summary; `404`/`409`/`412` stale-state refetch (`412` for
  `display_only`); success navigates to detail. Soft-deleted / non-`available` books (including `display_only`) are
  not offered. Detail page links here when active and available
- `src/features/loans/checkoutModel.ts`: borrower validation, optional datetime/date/notes, omit blanks, normalize
  supplied checkout timestamps; colocated `checkoutModel.test.ts`
- `src/features/loans/checkinEligibility.ts`: `findActiveLoan` and `isCheckinEligible` (active loan on a non-deleted
  book; eligibility is not book `status` alone); colocated `checkinEligibility.test.ts`
- `src/features/loans/checkinModel.ts`: blank return time → omitted body, supplied values as UTC ISO 8601, client
  validation; colocated `checkinModel.test.ts`
- `src/features/loans/loanTemporal.ts`: `displayLoanDate`, `getLoanDueState`, and `LoanDueState` for due/overdue
  presentation on loan history; colocated `loanTemporal.test.ts`
- `src/features/loans/routes/CheckinPage.tsx` (`/checkin`): `?bookId=` deep-link via `useBook` +
  `useLoans({ bookId })`; without `bookId`, lists eligible books via `useBooks` + `isCheckinEligible`; shows
  borrower / checked-out from `findActiveLoan`; blank return time omits body / supplied values as UTC ISO 8601;
  `ConfirmationDialog` before mutate; Field-linked `422`; documented `409` detail messaging (`Book is not checked out`);
  in-flight disable via `useCheckinBook`; success navigates to detail; soft-deleted / non-eligible warning UI;
  `404`/`409` refetch with preserved return-time input. Colocated `CheckinPage.test.tsx`
- `src/features/loans/loansListModel.ts`: re-exports shared infinite-scroll constants and loan page flattening helper
- `src/features/loans/routes/LoansPage.tsx` (`/loans`, infinite scroll): `useInfiniteLoans()` plus unpaginated
  `useBooks()` joins; active vs returned sections from `returned_at`; due/overdue labels via `loanTemporal`; durable
  `Book {id}` fallback when the book is missing; empty / loading / retryable error states; bottom next-page loading and
  retry affordances. Colocated `LoansPage.test.tsx`

Scanning feature (complete -- extend, do not replace):

- `src/features/scanning/IsbnCameraScanner.tsx`: Camera UI lazy-loaded from `NewBookPage` and `CheckoutPage` via
  `React.lazy` / `Suspense`. Uses `@zxing/browser` (`BrowserMultiFormatReader`) + `@zxing/library`. Permission
  requested only after the explicit "Scan ISBN" action; unsupported / insecure / permission / timeout paths keep
  manual ISBN entry usable
- `src/features/scanning/isbnCameraCapture.ts`: Secure-context / getUserMedia capability checks, Bookland EAN-13
  filter, decode hints, and scan timeout helpers
- `src/features/scanning/isbnScannerParser.ts` / `useHardwareIsbnScanner.ts`: Keyboard-wedge hardware capture with
  Enter terminator, inter-key timeout, and checksum via `isbn.ts`
- Support matrix and manual device checklist: `docs/baselines/FEAT-06_scanner-support.md`
- Colocated scanning tests plus `NewBookPage` / `CheckoutPage` handoff tests for camera and hardware captures

Connection feature (build-time Bearer auth, complete):

- `src/features/connection/connectionTypes.ts`: Connection status union (`checking`, `connected`, `unauthorized`,
  `unreachable`).
- `src/features/connection/connectionToken.ts`: Reads the build-time token once via `readApiToken()`;
  `getCurrentToken()` returns it for `createApiClient`.
- `src/features/connection/connectionApi.ts`: Public `GET /health` reachability check through typed `healthApi` with
  connection error mapping.
- `src/features/connection/ConnectionContext.ts` / `useConnection.ts`: Context value and hook (`status`, `apiBaseUrl`,
  `release`, `errorMessage`, `apiClient`).
- `src/features/connection/ConnectionProvider.tsx`: Owns status, `apiClient`, startup health verification,
  `onUnauthorized` page error state, and optional `diagnosticReporter` wired through `createApiClient`
  `onRequestFailure` (no connect / forget / retry / `hasToken`).

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
- `src/components/QueryErrorState.tsx`: Shared query error alert with `formatApiQueryError` messaging; hides Retry on
  `403` and shows `.env` / rebuild guidance for unauthorized errors.
- `src/components/Notifications.tsx`: `NotificationsProvider` and dismissible toast list (per-item live roles).
- `src/components/NotificationsContext.ts`: Notification types and React context.
- `src/components/useNotifications.ts`: Hook that reads the notifications context (throws outside the provider).
- `src/components/index.ts`: Barrel re-exports for the shared components and notifications API.

These components apply the class names defined in `src/styles/components.css`. Books list/detail, create/edit form,
scanner capture, checkout, check-in, loan history, mark-read, reading edit, delete/restore admin, backup download, and
dashboard already use them in product UI (including `QueryErrorState` for API errors); remaining feature tickets should
keep reusing these primitives.

### Styling

- `src/index.css`: Global CSS entrypoint imported by `src/main.tsx`. It imports all style layers in order.
- `src/styles/tokens.css`: Design tokens for typography, spacing, sizing, colors, borders, focus, shadows, and motion.
- `src/styles/base.css`: Element defaults and accessibility foundations, including box sizing, controls, links, focus
  visibility, page typography, skip links, and reduced motion.
- `src/styles/shell.css`: Application-frame classes for header, navigation, main content, footer, route pages, and
  responsive layouts.
- `src/styles/components.css`: Shared class-based primitives for buttons, links, forms, alerts, status views, dialogs,
  notifications, and dashboard layout (`.dashboard-page`, `.dashboard-section`, `.dashboard-metric`, and related). They
  use BEM-like naming and are referenced by the shared component modules and `DashboardPage`. Long-content
  wrapping (`overflow-wrap: anywhere`, `min-width: 0` on book/circulation cards and details) lives here.

Choose the CSS layer based on responsibility:

- Shared values belong in `tokens.css`.
- HTML element defaults belong in `base.css`.
- Application frame and navigation layout belong in `shell.css`.
- Reusable UI patterns belong in `components.css`.
- Feature-specific styles may be colocated once a feature needs styles that do not belong in the shared layers;
  dashboard styles currently live in `components.css`.

Preserve the import order in `src/index.css`: tokens, base, shell, components.

### Tests

- `src/App.test.tsx`: Document title and heading-focus behavior for client-side navigations via `renderAppTree`.
- `src/RootErrorBoundary.test.tsx`: Recoverable root error-boundary fallback and redacted render-failure reporting.
- `src/layout/AppShell.test.tsx`: Landmarks, navigation labels (including Shelves), footer release identifier,
  current-page state, and not-found recovery.
- `src/components/SharedState.test.tsx`: Field associations plus alert, loading, and empty-state semantics.
- `src/components/ConfirmationDialog.test.tsx`: Dialog labelling, focus, Escape, confirm, and restoration.
- `src/components/Notifications.test.tsx`: Live-region roles, dismissal, and provider hook usage.
- `src/config/runtimeConfig.test.ts` / `runtimeConfigState.test.ts`: Config validation (including optional
  diagnostics) and read helpers.
- `src/config/apiToken.test.ts`: `readApiToken()` missing, blank, and trimmed success cases.
- `src/diagnostics/diagnosticReporter.test.ts`: Disabled/enabled reporters, allowlisted payloads, redaction
  assertions, and swallowed transport failures.
- `src/api/apiClient.test.ts`: Bearer injection, public requests, `403`, `404`, `409`, both `422` detail shapes, `5xx`
  (including `500` / `502` / `504`), network failure, timeout, cancellation, invalid JSON, binary backup success,
  `204`, and `onRequestFailure` diagnostic hooks.
- `src/api/apiErrors.test.ts` / `apiTypes.test.ts` / `api.test.ts` / `apiRedaction.test.ts`: Error, schema alias,
  `createApi`, and redaction coverage.
- `src/api/booksApi.test.ts` / `booksApi.conflicts.test.ts` / `booksApi.largeLibrary.test.ts` / `loansApi.test.ts` /
  `dashboardApi.test.ts` / `healthApi.test.ts` / `backupApi.test.ts`: Typed route helper coverage including lookup
  coverage including lookup `found: false`, mark-read `{}`, omitted check-in body, restore/checkout/check-in `409`
  bodies, and a 2_000-item list timing guard.
- `src/api/requestFields.test.ts` / `dateTime.test.ts`: Request-field picking and date/time normalizer coverage.
- `src/api/queryClient.test.ts` / `booksQueries.test.tsx` / `serverStateQueries.test.tsx` / `queryStaleGuard.test.tsx`:
  Query client defaults, books/loans/dashboard hooks, detail-cache writes, and abort/stale overwrite guards.
- `src/api/queryKeys.test.ts`: Books/loans/dashboard/shelves key shape coverage including `author` / `title` /
  `category` omission of blank filters, `infiniteList` isolation, and shelves list isolation.
- `src/api/shelvesApi.test.ts` / `shelvesQueries.test.tsx`: `GET` / `POST` / `PATCH` / `DELETE /shelves` helpers and
  `useShelves` / write mutation hooks (including rename invalidation of books/dashboard).
- `scripts/contractSmoke.test.ts`: Checked-in OpenAPI path/type smoke when live backend comparison is unavailable
  (includes `/shelves`, `/shelves/{shelf_id}`, wishlist and dashboard-report paths plus existing lifecycle routes).
- `docs/baselines/FEAT-03_performance.md`: Large-library and bundle-size expectations; includes the recorded re-check
  (FEAT-14 owns future budget enforcement).
- `docs/baselines/FEAT-12_browser-support.md`: Evergreen browser/device smoke matrix and blocker policy.
- `src/features/connection/ConnectionProvider.test.tsx` / `connectionToken.test.ts`: Health startup check,
  unauthorized handling without cache clear, and build-time token wiring.
- `src/features/books/routes/BooksPage.test.tsx` / `BookDetailsPage.test.tsx` / `NewBookPage.test.tsx`: Collection
  infinite scroll (batch size 30, sort URL persistence, flattened pages, bottom loading/retry, Read/Unread and rating
  on cards, Title Case `shelf_name`), detail (including gated Mark Read / Edit Reading / Edit Book / Delete Book with
  active-loan gating, and soft-deleted action gating), and create-route behavior (shelves load gate / failure blocks
  form, loading/error/empty, navigation, create success with `shelf_name`, lookup success / `found: false` / provider
  failure / checksum rejection, create `422` field mapping, camera and hardware scanner handoff into lookup)
- `src/features/shelves/routes/ShelvesPage.test.tsx` / `shelfDisplay.test.ts` / `shelfFormModel.test.ts`: Shelves
  catalog loading/error/empty, Title Case labels, system-shelf badges and rename/delete guards, create/edit/delete
  flows with Field-linked errors and confirmation, plus display/assignable/form-model helper coverage
- `src/features/books/routes/EditBookPage.test.tsx` / `bookEditModel.test.ts`: Edit eligibility (active books only;
  deleted warning), populate-from-book, minimal changed-fields patch (blank ISBN → `null`; no status/reading/loan
  fields), no-op rejection, Field-linked `422`, mutation `404`, pending disable, and success navigation
- `src/features/books/routes/DeleteBookPage.test.tsx`: Delete confirmation, on-loan blocking via status and
  `findActiveLoan`, soft-deleted / not-found warnings, success navigation, and mutation error recovery
- `src/features/books/routes/DeletedBooksPage.test.tsx`: Deleted list filtering, empty state, restore confirmation,
  restore success / `404`/`409` messaging, and pending disable
- `src/features/books/routes/BackupLibraryPage.test.tsx`: Successful download filename handling, always-revoke object
  URL, and no download after `403` / generation `500` / network failure
- `src/features/dashboard/routes/DashboardPage.test.tsx`: API metric rendering, null-average "Not enough data",
  inconsistency warning without recalculation, Refresh / offline / stale status, and `QueryErrorState` recovery
- `src/features/books/routes/MarkReadPage.test.tsx` / `markReadModel.test.ts`: Mark-read eligibility (active unread
  only; deleted / already-read warnings), confirmation, success navigation, client validation, rating bounds, request
  conversion, Field-linked `422`, mutation `404`, pending disable, and form conversion
- `src/features/books/routes/ReadingEditPage.test.tsx` / `readingEditModel.test.ts`: Reading-edit eligibility (active
  already-read only; deleted / unread warnings), populate-from-book, changed-fields-only patch (including clearing
  fields to `null`), no-op rejection, confirmation, success navigation, Field-linked `422`, mutation `404`, and pending
  disable
- `src/features/loans/routes/CheckoutPage.test.tsx` / `checkoutModel.test.ts`: Checkout eligibility, confirmation,
  success navigation, client validation, field-mapped `422`, mutation `404`/`409`/`412` (display only), network
  failure, deep-link refresh (including `display_only`), and ISBN Find (typed single match, zero / ineligible matches,
  checksum / blank rejection, camera and hardware handoff into `useBooks({ isbn })`, checkout mutate unchanged after
  ISBN selection)
- `src/features/loans/routes/CheckinPage.test.tsx` / `checkinModel.test.ts` / `checkinEligibility.test.ts`:
  Check-in deep-link and eligible-book selection, active-loan eligibility (including status-independent cases),
  soft-delete / non-eligible warnings, blank and supplied return time, confirmation, success navigation, Field-linked
  `422`, documented `409` detail messaging, generic mutation errors, pending disable, and form conversion
- `src/features/loans/routes/LoansPage.test.tsx` / `loanTemporal.test.ts`: Infinite loan pagination into active vs
  returned sections, due/overdue labels, durable missing-book fallback, empty / loading / retryable error states,
  explicit empty active and returned sections, bottom loading/retry, and due-date display
- `src/features/books/components/BookForm.test.tsx` / `bookFormModel.test.ts`: Form field rendering, API-fed shelf
  options (Title Case labels; `removed` excluded; required shelf), gated create controls, initial values, empty
  title/authors and ISBN rejection, submit payload shaping via `formValuesToBookCreate` (`shelf_name`),
  blank-optional-to-`null`, year-only `publication_date`, purchase-price number serialization, tags normalization,
  cancel, submitting disabled state, and linked server field errors
- `src/features/books/utils/isbn.test.ts`: ISBN-10 / ISBN-13 checksum acceptance and rejection cases, plus
  `compactIsbnForListFilter` punctuation-only compaction
- `src/features/scanning/IsbnCameraScanner.test.tsx` / `isbnCameraCapture.test.ts` / `isbnScannerParser.test.ts` /
  `useHardwareIsbnScanner.test.ts`: Camera UI, capture helpers, keyboard-wedge parser, and hardware hook coverage
- `docs/baselines/FEAT-06_scanner-support.md`: Scanner support matrix and manual device checklist
- `playwright.config.ts`: Playwright browser-journey config (Chromium; local Vite webServer on `127.0.0.1:4173` with
  `VITE_API_SECRET_KEY`; HTML reporter; CI retries). FEAT-13 owns expanding coverage and folding into `make check`.
- `e2e/dashboard.smoke.spec.ts`: Dashboard browser smoke (heading/title, null-average copy, axe serious/critical
  gate) via mocked API
- `e2e/support/mockApi.ts`: Playwright route mock for `http://127.0.0.1:8000/**` (health + dashboard fixtures so far)
- `e2e/support/accessibility.ts`: `expectNoSeriousAccessibilityViolations` via `@axe-core/playwright`
- `src/test/setup.ts`: Global Vitest setup that installs jest-dom matchers for every test.
- `src/test/renderAppTree.tsx`: Shared helpers (`renderAppTree`, `renderWithProviders`, `mockReachableApi`,
  `testRuntimeConfig`) that mount under `AppProviders` with a mocked reachable API and a diagnostic reporter.
- `scripts/productionBuildTokenInspection.test.ts`: Production build env inspection; asserts `.env` is not copied into
  `dist/` and that `VITE_API_SECRET_KEY` is embedded in generated JS bundles.

Tests use a jsdom browser simulation for Vitest (except the Node-environment production-build inspection). Prefer
semantic Testing Library queries such as `getByRole()` and test user-visible behavior instead of implementation
details. Route tests should use `createTestRouter` / `renderAppTree` and must not mutate `window.history` across
cases. Browser journeys live under `e2e/` and run through Playwright (`yarn test:e2e`); keep mocks aligned with
OpenAPI / `API-for-FE.md` rather than inventing a second fake-API stack.

The test flow is:

```text
yarn test
  -> Vitest reads vite.config.ts
  -> jsdom supplies browser APIs
  -> src/test/setup.ts installs shared matchers
  -> colocated *.test.tsx / *.test.ts files render through Testing Library

yarn test:e2e
  -> Playwright reads playwright.config.ts
  -> starts Vite webServer (or reuses one outside CI)
  -> runs e2e/*.spec.ts against Chromium
```

### Dependencies and Commands

- `package.json`: Package metadata, Node and Yarn requirements, scripts (including `api:generate` / `api:check`),
  runtime dependencies, and development dependencies.
- `yarn.lock`: Yarn-generated exact dependency resolutions and checksums. Never edit it manually.
- `Makefile`: Stable wrappers around Yarn scripts for installation, development, checks, tests, and builds.
- `.nvmrc`: Exact Node.js version used by `nvm use`.
- `.yarnrc.yml`: Configures Yarn to use the `node_modules` linker instead of Plug'n'Play.

### Build, Type Checking, and Linting

- `vite.config.ts`: Shared Vite and Vitest configuration. Enables React, jsdom tests, global test setup, and an optional
  same-origin API proxy when `SHADE_API_PROXY=1` (optional `SHADE_API_PROXY_TARGET`).
- `eslint.config.js`: Flat ESLint configuration for TypeScript and React Hooks. It ignores generated directories and
  treats warnings as failures through the package script.
- `tsconfig.json`: TypeScript solution file that references the application and Node/tooling configurations.
- `tsconfig.app.json`: Strict browser and React type checking for `src/`. It includes Vite, Vitest, and jest-dom types
  and emits no files.
- `tsconfig.node.json`: Strict Node-side type checking for `vite.config.ts`. It emits no files.

### Repository Guidance

- `README.md`: Concise human onboarding for prerequisites, setup, development, local CORS-or-proxy options, `.env`
  token configuration, checks, and production builds. Also documents the production-host security boundary (HTTPS/CSP /
  SPA fallback / production config serving owned by deployment / FEAT-16).
- `.env.example`: Committed template for `VITE_API_SECRET_KEY`; copy to gitignored `.env` for local dev and builds.
- `.gitignore`: Excludes dependencies, generated output, secrets, local data, editor files, and OS metadata.
- `.gitattributes`: Normalizes text files to LF line endings and marks common binary extensions.
- `.cursor/rules/documentation-style.mdc`: Markdown punctuation, line-length, and newline rules for Cursor.
- `.cursor/rules/grep-tool.mdc`: Requires `grep` rather than the `rg` shell command in this environment.
- `.cursor/rules/readonly-git.mdc`: Prohibits Cursor from changing Git state.
- `.cursor/rules/scope.mdc`: Defines allowed repository read/write boundaries and related Shade repositories.

The `.cursor` rules control AI-assisted work. They are not loaded by the application or included in builds.

Useful documents under `docs/` when a task needs them. This file is the complete LLM baseline on its own; do not treat
another project prompt as required reading before starting. Attach the items below only when the current work requires
their contents (for example, the active ticket's acceptance criteria or the OpenAPI schemas for an API change).

- `docs/tickets/FEAT-13_workflow-and-accessibility-tests.md` through `FEAT-21_*.md`: Remaining sequenced implementation
  tickets with acceptance criteria. Prefer ticket presence under `docs/tickets/` over `docs/ToDo.md` when judging what
  is still open.
- `docs/baselines/FEAT-03_performance.md`: Large-library and bundle-size baselines (re-check recorded; FEAT-14
  owns future enforcement).
- `docs/baselines/FEAT-06_scanner-support.md`: Scanner support matrix and manual device checklist.
- `docs/baselines/FEAT-12_browser-support.md`: Evergreen browser/device smoke matrix (Firefox Pass; other targets
  pending/blocked/not tested as recorded).
- `docs/ToDo.md`: Human checklist of ticket completion status (may lag).
- `docs/product-docs/PLAN.md`: Frontend production roadmap.
- `docs/product-docs/PRODUCT_REQS.*.md`: Product requirements drafts and notes.
- `docs/product-docs/UI_DESIGN_NOTES.MD`: UI and design decisions; consult when visual design is in question.
- `docs/technical-reference/openapi.json`: Authoritative backend OpenAPI 3.1 schemas (see Backend Contract).
- `docs/technical-reference/API-for-FE.md`: Behavioral API guidance complementary to `openapi.json`.
- `docs/technical-reference/bash-reference.md`: Shell command reference notes for maintainers.
- `docs/MAINTAINERS.md`: Human-oriented maintainer guide (not required before starting from this document; may lag
  this baseline). Includes production-host security ownership notes.
- `docs/full-project-context.md`: Optional slim always-on pack for chats without repo access (not required when
  this file is already loaded).

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
- `yarn test:e2e`: Runs Playwright browser journeys under `e2e/` (not yet part of `make check`; FEAT-13).
- `yarn test:coverage`: Runs Vitest with V8 coverage (thresholds / CI folding are FEAT-13 / FEAT-14).
- `make build`: Type-checks and writes an optimized application to `dist/`.
- `make check`: Runs lint, type checking, tests, and a production build.
- `yarn api:generate`: Regenerates `src/api/generated/openapi.ts` from `docs/technical-reference/openapi.json`.
- `yarn api:check`: Regenerates types and fails if the generated file differs from git.

`make check` currently performs type checking twice because `make build` also type-checks. This is expected.

Local API connectivity: by default `public/config.js` points at `http://127.0.0.1:8000` and the backend allows the Vite
origins, so no proxy is required. Optional same-origin proxy: set `apiBaseUrl` to the Vite origin and run
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
- Preserve landmarks, visible keyboard focus, labels linked to errors, skip link, dialog focus restoration, document
  title plus heading focus on route change, no color-only status, usable 320px viewports, 44-pixel control targets, and
  reduced-motion support.
- Reuse design tokens and existing shared CSS classes before adding new values or primitives.
- Shared CSS follows `.component`, `.component__element`, and `.component--modifier` naming.
- Import global CSS once through `src/index.css`; do not scatter global imports across components.
- Import shared components from `src/components/index.ts`.
- Colocate component tests using `*.test.tsx` (and colocated `*.test.ts` for non-UI modules).
- Use extensionless relative TypeScript imports, matching current source style.
- Follow the existing TypeScript style: single quotes, no semicolons, and trailing commas where supported.
- Keep feature UI behind the existing `src/features/*/routes/` ownership; extend implemented pages rather than
  inventing a parallel tree. MVP product routes are complete -- do not revert them to
  placeholders. Leave diagnostics under `src/diagnostics/diagnosticReporter.ts` wired through `RootErrorBoundary` /
  `AppProviders` / `ConnectionProvider` / `apiClient` `onRequestFailure` and optional runtime config
  (`public/config.js` / `RuntimeConfig.diagnostics`); never fabricate correlation IDs, invent a second telemetry
  transport, or log denylisted fields. Leave edit under `EditBookPage` /
  `bookEditModel` (minimal `BookUpdate` patch; blank ISBN → `null`; never send `status=on_loan`, reading fields, or
  loan-driving values). Leave delete under `DeleteBookPage` (`useDeleteBook` / `booksApi.remove`; block when
  `status === 'on_loan'` or `findActiveLoan` is present). Leave `/admin/deleted` under `DeletedBooksPage` and
  `/admin/backup` under `BackupLibraryPage` (programmatic `<a download>`, always `URL.revokeObjectURL`; do not
  inspect, log, cache, or upload dump contents). Leave dashboard under `DashboardPage` / `useDashboard` (display
  API stats only; null averages as "Not enough data"). Leave reading flows under `MarkReadPage` / `markReadModel` /
  `ReadingEditPage` / `readingEditModel`. Leave scanner code under `src/features/scanning/` lazy-loaded from
  `/books/new` and `/checkout`. Leave checkout under `CheckoutPage` / `checkoutModel`, including ISBN Find via
  `useBooks({ isbn })` (not lookup) and existing `412` `display_only` handling. Leave check-in and loan history under
  `CheckinPage` / `checkinModel` / `checkinEligibility` / `LoansPage` / `loanTemporal`. Leave shelves under
  `ShelvesPage` / `shelfDisplay` / `shelfFormModel` / `shelvesApi` / `useShelves` / write mutations (`/shelves` owns
  create/edit/delete with system-shelf protection; book forms use API-fed pickers with `shelf_name`, never shelf CRUD
  on Add/Edit Book). For FEAT-13, extend existing Vitest / Testing Library / `renderAppTree` coverage and the
  Playwright `e2e/` scaffolding (`playwright.config.ts`, mock API, axe helper); fold accessibility and browser-journey
  suites into `make check` without inventing a parallel fake-API stack. Do not pull FEAT-14 CI packaging, FEAT-15
  Podman, FEAT-16 deployment-owned HTTPS/CSP, or FEAT-17 through FEAT-21 product work into FEAT-13. Never simulate
  restore, checkout, check-in, or initial mark-read with generic `PATCH`.
- Reuse the typed client, query keys, mutation invalidation, and redaction helpers; do not introduce a second
  state store, component library, CSS framework, or form library unless a ticket explicitly requires it.
- Keep forms, scanner, and dialogs local; keep connection state application-wide; invalidate affected queries after
  mutations. There is no realtime API.
- For API-dependent work, treat `docs/technical-reference/openapi.json` as the schema source of truth and
  `docs/technical-reference/API-for-FE.md` as behavioral guidance. Prefer a running backend `/openapi.json` for drift
  checks when available; do not invent lifecycle behavior with generic `PATCH`.
- Prefer product-domain names over vague folders such as `helpers` or `misc`.
- Never commit the API token (keep `.env` gitignored), put it in URLs, log Authorization headers, render API text as
  HTML, or upload SQL backup contents to telemetry. The token is injected at build time and appears in JS bundles by
  design. SQL backups are sensitive.

## Change Workflow

1. Inspect the relevant source, tests, configuration, and current working tree.
2. Identify the smallest complete change and any behavior that requires a test.
3. Implement without modifying unrelated work.
4. Run focused tests or checks while iterating.
5. Run `make check` when proportionate to the change.
6. Review the final diff for correctness, accidental generated files, secrets, and stale documentation.
7. Report changed files, verification performed, and any remaining uncertainty.

If a new file, command, dependency, architecture pattern, or runtime flow is introduced, update this context so the next
fresh chat does not begin with stale assumptions.
