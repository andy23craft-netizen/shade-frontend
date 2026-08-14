# Agents.md: LLM Project Context

Use this document as the self-contained baseline context when working on the Shade frontend in a fresh LLM chat. It
covers operating rules, the backend contract, architecture, and the current codebase inventory (baseline as of
2026-08-13 -- verify against the repository before editing). This file is complete for that baseline on its own: do
not treat other prompt packs or parallel LLM guides as required reading before starting. Attach product tickets,
OpenAPI, and other `docs/` references only when the current task needs them. Inspect the current repository before
making changes because the code may have changed since this document was written. A user's explicit request takes
precedence over general guidance here.

## Project Summary

Shade is a browser UI for a personal home-library FastAPI backend. Planned capabilities include:

- Viewing collection, borrowing, and reading metrics on a dashboard.
- Adding books through ISBN entry or barcode scanning.
- Checking books out to borrowers and checking them back in.
- Tracking reading completion, ratings, and notes.
- Soft-deleting and restoring books while preserving history.
- Sending a shared Bearer token with backend API requests (no user accounts).

**Completed:** FEAT-01 (application shell and shared UI), FEAT-02 (runtime configuration and connection), FEAT-03
(typed API and server state), FEAT-04 (active collection and book details), FEAT-05 (book form and creation), FEAT-06
(ISBN camera and hardware-scanner capture), and FEAT-07 (checkout workflow). Those ticket files were removed; remaining
tickets are `FEAT-08` through `FEAT-16` under `docs/tickets/`. Prefer ticket presence under `docs/tickets/` over
`docs/ToDo.md` when judging completion (the checklist can lag).

**Next / in progress:** FEAT-08 (check-in and loan history). CHORE-01 is complete (`loansApi.list({ bookId })`,
`loansApi.get` / `useLoan`, Check In deep-link `/checkin?bookId=...`, optional `booksApi.list({ isbn })` /
`useBooks({ isbn })`). `CheckinPage` / `checkinModel` and `LoansPage` are real WIP (not placeholders). Reuse FEAT-03
typed helpers (`booksApi.checkin`, `pickCheckinRequest`, `useCheckinBook`, `useLoans({ bookId })`, `useLoan`,
`dateTime.ts`) and FEAT-07 checkout patterns; never simulate check-in with generic `PATCH`. Remaining FEAT-08 work:
active-loan eligibility (not book `status` alone), `/checkin` without `bookId` selection, Field-linked `422`,
documented `409` messaging, and due/overdue loan-history presentation. Reading completion is FEAT-09;
edit/delete/restore is FEAT-10; dashboard metrics UI is FEAT-11. Do not pull those into FEAT-08.

FEAT-07 delivered `/checkout` via `CheckoutPage` and `checkoutModel` (`checkoutFormValuesToRequest`, borrower
blank/255 validation, omit blank optionals, UTC ISO `checked_out_at` / date-only `due_at`), wired to existing
`useCheckoutBook` / `booksApi.checkout` / `pickCheckoutRequest`. Eligible books only (`deletion_date === null` and
`status === 'available'`), `?bookId=` deep-link with refresh path, `ConfirmationDialog` before mutate, Field-linked
`422` error summaries, `404`/`409` stale-state refetch (books + loans) with preserved form input, and detail "Check Out"
when active and available. FEAT-08 WIP already has `/checkin` via `CheckinPage` + `checkinModel` (blank return time
omits body / supplied values as UTC ISO; `ConfirmationDialog`; `useCheckinBook`; success to detail; soft-deleted /
non-`on_loan` warnings; `404`/`409` refetch with preserved return time) and `/loans` via `LoansPage` (`useLoans` +
`useBooks` joins; active vs returned from `returned_at`; durable `Book {id}` fallback; empty / loading / retry).
FEAT-06 delivered `src/features/scanning/` with lazy-loaded `IsbnCameraScanner` (`@zxing/browser` + `@zxing/library`),
`isbnCameraCapture` helpers, `IsbnScannerParser` / `useHardwareIsbnScanner` keyboard-wedge capture, and handoff into
the existing FEAT-05 lookup path on `/books/new` (never calls `POST /books` from scanner success). Support matrix:
`docs/baselines/FEAT-06_scanner-support.md`. FEAT-05 delivered `/books/new` via shared `BookForm` / `bookFormDefaults`
/ `bookFormModel`. FEAT-04 delivered read-only browse/detail on `/books` and `/books/:bookId`. FEAT-03 delivered
OpenAPI generation, typed route helpers, React Query hooks (including `useCheckoutBook` / `useCheckinBook`), and
PLAN.md 7.5 invalidation.

Product intent, sequencing, and acceptance criteria live under `docs/`. Prefer the current ticket, then
`docs/product-docs/PLAN.md`, then the product requirements docs when deciding what to build next.

## Technology

- React 19
- TypeScript 6 in strict mode
- Vite 8
- React Router 7 (`react-router-dom`), integrated in `src/main.tsx`
- TanStack React Query 5 (`QueryClientProvider` mounted under `AppProviders` with configured client defaults,
  connection-invalidation subscription, books/loans/dashboard hooks, and mutation detail-cache writes)
- `openapi-typescript` for generating `src/api/generated/openapi.ts` from the checked-in OpenAPI document
- `@zxing/browser` + `@zxing/library` for camera ISBN decode (lazy-loaded from `/books/new`; not on the critical path
  for ordinary navigation)
- Vitest with jsdom
- Testing Library and jest-dom
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
- Missing or invalid credentials return `403`; describe generically as "API access was rejected"
- Token is runtime-only: memory plus `sessionStorage`, with an explicit forget action
- Never commit, bundle, put in URLs, log, or send the token to analytics
- Confirmed `403` clears the active token and returns the user to connection setup
- A browser-held shared token is inspectable by anyone with device access; that is an accepted risk for this trusted
  personal deployment and is not real multi-user authentication

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

**Out of scope unless explicitly requested:** UPC, multi-library/copies, wish lists, catalog search/filter/sort, backend
pagination, cover images, overdue notifications, Goodreads/StoryGraph, user accounts/roles, realtime sync, loan CRUD,
mark-unread, remote Ansible/systemd/TLS/rollback orchestration.

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

`AppShell` owns document title updates (`{route title}` plus an em dash and ` Shade`), skip link, primary and admin
navigation, the main `Outlet`, footer (runtime release identifier), and heading focus after client-side navigations.
Live product UI today: `/settings/connection` (`ConnectionScreen`), `/books` (`BooksPage`), `/books/:bookId`
(`BookDetailsPage`), `/books/new` (`NewBookPage` + `BookForm` / `bookFormModel` with ISBN lookup plus FEAT-06
camera/hardware scanner capture), `/checkout` (`CheckoutPage` + `checkoutModel` with confirmation and
`useCheckoutBook`), `/checkin` (`CheckinPage` + `checkinModel`, FEAT-08 WIP), and `/loans` (`LoansPage`, FEAT-08 WIP).
Do not revert check-in or loans to placeholders. Remaining unfinished routes under `src/features/*/routes/` still render
`RoutePlaceholder` until their owning tickets land (`/`, `/books/:bookId/edit`, `/admin/deleted`, `/admin/backup`).

TypeScript checks source code but emits no JavaScript. Vite transforms modules during development and creates the
production bundle. The CSS import order is intentional: later layers use tokens and defaults declared by earlier layers.

## Project Structure

This inventory covers every project-owned file outside `docs/`. Do not assume generated or dependency directories are
source code. In particular, omit `node_modules/`, `dist/`, `coverage/`, `.vite/`, `.yarn/`, and `.git/` from normal code
changes. Prefer regenerating `src/api/generated/openapi.ts` with `yarn api:generate` rather than hand-editing it.

### Browser Application

- `index.html`: Vite's HTML entrypoint. Defines page metadata, creates `#root`, loads `/config.js`, then `src/main.tsx`.
- `public/config.js`: Runtime config assigned to `window.__SHADE_CONFIG__` (`apiBaseUrl`, `release`). Not bundled; edit
  for local or deployed environments.
- `src/main.tsx`: Browser bootstrap. Reads runtime config, either mounts `RuntimeConfigScreen` or `RootErrorBoundary` ->
  `AppProviders` -> `RouterProvider` in `StrictMode`, and imports global CSS.
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

- `src/api/generated/openapi.ts`: Generated OpenAPI types. Do not hand-edit; use `yarn api:generate` / `yarn api:check`.
- `src/api/apiTypes.ts`: Exported schema aliases (`BookCreate` / `BookUpdate` / `BookRead` / `BookList`, lookup, loan,
  dashboard, health/protected, validation/error schemas, enums).
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
  `YYYY-MM-DD` / UTC ISO 8601 normalizers for later form tickets. Colocated unit tests cover both modules.
- `src/api/queryKeys.ts`: Shared React Query keys for books (`all`, `list({ includeDeleted, isbn? })`, `detail(id)`,
  `lookup(isbn)`), loans (`all`, `list(bookId?)`, `detail(id)`), and dashboard.
- `src/api/api.ts`: `createApi` aggregates typed helpers (`books`, `loans`, `dashboard`, `health`, `protected`,
  `backup`) plus the underlying `client`.
- `src/api/booksApi.ts`: `list` (optional `includeDeleted`, `isbn`; omit empty/`undefined` `isbn`), `create`, `lookup`,
  `get`, `update`, `remove`, `restore`, `checkout`, `checkin` (optional body), `markRead` (defaults to `{}`). Helpers
  accept optional `AbortSignal` and serialize only documented request fields.
- `src/api/loansApi.ts`: `list()` (`GET /loans`, optional `bookId` → `?book_id=...`; omit empty/`undefined`),
  `get(id)` (`GET /loans/{id}`).
- `src/api/dashboardApi.ts`: `get()` (`GET /dashboard`).
- `src/api/healthApi.ts`: `get()` public (`GET /health`, `authenticated: false`).
- `src/api/protectedApi.ts`: `get()` (`GET /protected`).
- `src/api/backupApi.ts`: `get()` returns `{ blob, filename }` for authenticated `/backup`, parsing UTF-8
  `Content-Disposition` (`filename*=UTF-8''...`) with a `backup.sql` fallback when the header is missing or malformed.
- `src/api/queryClient.ts`: `createQueryClient()` sets `staleTime` 30s, `refetchOnWindowFocus`, `refetchOnReconnect`,
  query retry that skips validation / auth / cancelled / invalid-response errors, and `mutations.retry: false`.
- `src/api/queryInvalidation.ts`: `subscribeQueryClientToConnectionInvalidation` clears the query cache when connection
  invalidation fires; subscribed from `AppProviders`.
- `src/api/booksQueries.ts`: `useBooks` (optional `{ includeDeleted, isbn }`), `useBook`, `useBookLookup`, plus
  mutations (including `useCreateBook`, `useCheckoutBook`, and `useCheckinBook`) that write returned `BookRead` into
  the detail cache and invalidate per PLAN.md 7.5 (lists including `include_deleted` via the `['books']` prefix,
  detail, dashboard, and loans on checkout/check-in).
- `src/api/loansQueries.ts` / `dashboardQueries.ts`: `useLoans` (optional `{ bookId }`), `useLoan(id)` (disabled when
  falsy), and `useDashboard` using the same keys mutations invalidate (`queryKeys.loans.list` / `detail` / `all`).

### Routing and Layout

- `src/routes/routeMetadata.ts`: Path, document-title fragment, and heading metadata for every registered route.
- `src/routes/routes.tsx`: `createBrowserRouter` configuration. `AppShell` is the parent layout. Registered paths are
  `/`, `/books`, `/books/new`, `/books/:bookId`, `/books/:bookId/edit`, `/checkout`, `/checkin`, `/loans`,
  `/admin/deleted`, `/admin/backup`, `/settings/connection`, and `*` (not found).
- `src/routes/RoutePlaceholder.tsx`: Minimal route body used by unfinished feature pages (`h1` with `tabIndex={-1}`).
- `src/routes/NotFoundPage.tsx`: Not-found message plus a link back to the dashboard.
- `src/routes/createMemoryRouter.ts`: Exports `createTestRouter` for tests; builds a memory router from `routeConfig`.
- `src/layout/AppShell.tsx`: Application frame with skip link, header, primary navigation, admin/settings group,
  `Outlet` main region, footer (including runtime release identifier), document title, and heading focus on location
  change.

### Feature Modules

Route ownership under `src/features/*/routes/`. Implemented product UI vs placeholders:

Implemented (do not revert to placeholders):

- `src/features/connection/routes/ConnectionPage.tsx` (`/settings/connection`, FEAT-02; mounts `ConnectionScreen`)
- `src/features/books/routes/BooksPage.tsx` (`/books`, FEAT-04): active collection via `useBooks`; loading, error+retry,
  empty state with link to `/books/new`, and list rows linking to detail with safe enum display
- `src/features/books/routes/BookDetailsPage.tsx` (`/books/:bookId`, FEAT-04): detail via `useBook`; loading,
  not-found / error recovery, and field presentation with safe enum display. "Check Out" links to
  `/checkout?bookId=` when active and available (FEAT-07). "Check In" links to `/checkin?bookId=...` when active and
  on loan (CHORE-01; FEAT-08 still needs active-loan presence, not `status` alone).
- `src/features/books/routes/NewBookPage.tsx` (`/books/new`, FEAT-05 + FEAT-06): mounts shared `BookForm`, optional
  ISBN lookup via `useBookLookup` (checksum-gated; apply draft without overwriting the typed ISBN; progress/cancel/retry
  and manual fallback), creates via `useCreateBook`, maps create `422` field errors into the form summary, disables
  controls while pending, and navigates to the new detail on success. FEAT-06 adds camera ("Scan ISBN") and hardware
  scanner capture that hands one ISBN into the same lookup path (never calls `POST /books` from scanner success);
  hardware listening is disabled while the camera UI is open or lookup is fetching
- `src/features/books/components/BookForm.tsx` / `bookFormDefaults.ts` / `bookFormModel.ts`: reusable create form model
  (title, authors, ISBN, publisher, publication date as text for year-only values, pages, category, shelf, tags,
  purchase fields, notes). Create UI omits status/read/loan/review; conversion always sends `status=available` and
  `is_read=false`. Client validation, Field-linked errors, error summary focus, tag normalization, and
  `formValuesToBookCreate` blank-optional-to-`null` conversion. Colocated `BookForm.test.tsx` /
  `bookFormModel.test.ts` cover gating, validation, conversion, and server error linking
- `src/features/books/utils/isbn.ts`: ISBN-10 / ISBN-13 checksum helpers used by lookup, create, and scanner capture;
  colocated unit tests
- `src/features/loans/routes/CheckoutPage.tsx` (`/checkout`, FEAT-07): eligible books via `useBooks`; `?bookId=`
  deep-link with refresh; confirmation via `ConfirmationDialog`; checkout via `useCheckoutBook`; Field-linked `422`
  summary; `404`/`409` stale-state refetch; success navigates to detail. Soft-deleted / non-`available` books are not
  offered. Detail page links here when active and available
- `src/features/loans/checkoutModel.ts`: borrower validation, optional datetime/date/notes, omit blanks, normalize
  supplied checkout timestamps; colocated `checkoutModel.test.ts`
- `src/features/loans/routes/CheckinPage.tsx` (`/checkin`, FEAT-08 WIP, not a placeholder): `?bookId=` deep-link via
  `useBook` + `useLoans({ bookId })`; blank return time omits body / supplied values as UTC ISO 8601;
  `ConfirmationDialog` before mutate; in-flight disable via `useCheckinBook`; success navigates to detail;
  soft-deleted / non-`on_loan` warning UI; `404`/`409` refetch with preserved return-time input. Still missing:
  eligible selection when `bookId` is absent, active-loan gating (not `status` alone), Field-linked `422`, and
  documented `409` detail messaging. Colocated `CheckinPage.test.tsx`
- `src/features/loans/checkinModel.ts`: blank return time → omitted body, supplied values as UTC ISO 8601, client
  validation; colocated `checkinModel.test.ts`
- `src/features/loans/routes/LoansPage.tsx` (`/loans`, FEAT-08 WIP, not a placeholder): `useLoans()` plus `useBooks()`
  joins; active vs returned sections from `returned_at` nullability; durable `Book {id}` fallback when the book is
  missing; empty / loading / retryable error states. Still missing: due/overdue presentation without color alone,
  safer malformed-timestamp handling for overdue logic, and clearer empty-active-section accessibility when only
  returned history exists. Colocated `LoansPage.test.tsx`

Scanning feature (FEAT-06, complete -- extend, do not replace):

- `src/features/scanning/IsbnCameraScanner.tsx`: Camera UI lazy-loaded from `NewBookPage` via `React.lazy` /
  `Suspense`. Uses `@zxing/browser` (`BrowserMultiFormatReader`) + `@zxing/library`. Permission requested only after
  the explicit "Scan ISBN" action; unsupported / insecure / permission / timeout paths keep manual ISBN entry usable
- `src/features/scanning/isbnCameraCapture.ts`: Secure-context / getUserMedia capability checks, Bookland EAN-13
  filter, decode hints, and scan timeout helpers
- `src/features/scanning/isbnScannerParser.ts` / `useHardwareIsbnScanner.ts`: Keyboard-wedge hardware capture with
  Enter terminator, inter-key timeout, and checksum via `isbn.ts`
- Support matrix and manual device checklist: `docs/baselines/FEAT-06_scanner-support.md`
- Colocated scanning tests plus `NewBookPage` handoff tests for camera and hardware captures

Still `RoutePlaceholder` (owned by later tickets):

- `src/features/dashboard/routes/DashboardPage.tsx` (`/`, FEAT-11)
- `src/features/books/routes/EditBookPage.tsx` (`/books/:bookId/edit`, FEAT-10)
- `src/features/books/routes/DeletedBooksPage.tsx` (`/admin/deleted`, FEAT-10)
- `src/features/books/routes/BackupLibraryPage.tsx` (`/admin/backup`, FEAT-10)

Finish `/checkin` and `/loans` against FEAT-08 acceptance criteria; do not revert them to placeholders or rebuild the
typed client / hooks.

Connection feature (FEAT-02, complete):

- `src/features/connection/connectionTypes.ts`: Connection status union (`checking`, `setup_required`, `connected`,
  `unauthorized`, `unreachable`).
- `src/features/connection/connectionToken.ts`: In-memory current token accessors.
- `src/features/connection/connectionStorage.ts`: `sessionStorage` load/save/clear helpers.
- `src/features/connection/connectionApi.ts`: Routes health/protected checks through typed `healthApi` /
  `protectedApi` while preserving FEAT-02 connection error mapping.
- `src/features/connection/connectionInvalidation.ts`: `subscribeToConnectionInvalidation` /
  `notifyConnectionInvalidated` seam for clearing cached protected data when the token is forgotten or rejected.
- `src/features/connection/ConnectionContext.ts` / `useConnection.ts`: Context value and hook.
- `src/features/connection/ConnectionProvider.tsx`: Owns status, token lifecycle, `apiClient`, connect / retry / forget,
  and unauthorized handling.
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

These components apply the class names defined in `src/styles/components.css`. Connection, books list/detail, create
form, scanner capture, checkout, check-in, and loan history already use them in product UI; remaining feature tickets
should keep reusing these primitives.

### Styling

- `src/index.css`: Global CSS entrypoint imported by `src/main.tsx`. It imports all style layers in order.
- `src/styles/tokens.css`: Design tokens for typography, spacing, sizing, colors, borders, focus, shadows, and motion.
- `src/styles/base.css`: Element defaults and accessibility foundations, including box sizing, controls, links, focus
  visibility, page typography, skip links, and reduced motion.
- `src/styles/shell.css`: Application-frame classes for header, navigation, main content, footer, route pages, and
  responsive layouts.
- `src/styles/components.css`: Shared class-based primitives for buttons, links, forms, alerts, status views, dialogs,
  and notifications. They use BEM-like naming and are referenced by the shared component modules.

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
- `src/api/apiClient.test.ts`: Bearer injection, public requests, `403`, `404`, `409`, both `422` detail shapes, `5xx`
  (including `500` / `502` / `504`), network failure, timeout, cancellation, invalid JSON, binary backup success, and
  `204`.
- `src/api/apiErrors.test.ts` / `apiTypes.test.ts` / `api.test.ts` / `apiRedaction.test.ts`: Error, schema alias,
  `createApi`, and redaction coverage.
- `src/api/booksApi.test.ts` / `booksApi.conflicts.test.ts` / `booksApi.largeLibrary.test.ts` / `loansApi.test.ts` /
  `dashboardApi.test.ts` / `healthApi.test.ts` / `protectedApi.test.ts` / `backupApi.test.ts`: Typed route helper
  coverage including lookup `found: false`, mark-read `{}`, omitted check-in body, restore/checkout/check-in `409`
  bodies, and a 2_000-item list timing guard.
- `src/api/requestFields.test.ts` / `dateTime.test.ts`: Request-field picking and date/time normalizer coverage.
- `src/api/queryClient.test.ts` / `queryInvalidation.test.ts` / `booksQueries.test.tsx` / `serverStateQueries.test.tsx`
  / `queryStaleGuard.test.tsx`: Query client defaults, connection-invalidation subscription, books/loans/dashboard
  hooks, detail-cache writes, and abort/stale overwrite guards.
- `scripts/contractSmoke.test.ts`: Checked-in OpenAPI path/type smoke when live backend comparison is unavailable.
- `docs/baselines/FEAT-03_performance.md`: Large-library and bundle-size expectations for FEAT-12 / FEAT-14.
- `src/features/connection/ConnectionProvider.test.tsx` / `ConnectionScreen.test.tsx` / `connectionToken.test.ts`:
  Connection lifecycle and UI.
- `src/features/books/routes/BooksPage.test.tsx` / `BookDetailsPage.test.tsx` / `NewBookPage.test.tsx`: Collection,
  detail, and create-route behavior (loading/error/empty, navigation, create success, lookup success / `found: false` /
  provider failure / checksum rejection, create `422` field mapping, camera and hardware scanner handoff into lookup)
- `src/features/loans/routes/CheckoutPage.test.tsx` / `checkoutModel.test.ts`: Checkout eligibility, confirmation,
  success navigation, client validation, field-mapped `422`, mutation `404`/`409`, network failure, and deep-link
  refresh
- `src/features/loans/routes/CheckinPage.test.tsx` / `checkinModel.test.ts`: Check-in deep-link, soft-delete /
  not-on-loan warnings, blank and supplied return time, confirmation, success navigation, generic mutation errors,
  pending disable, and form conversion (Field-linked `422` / documented `409` messaging still FEAT-08 remaining)
- `src/features/loans/routes/LoansPage.test.tsx`: Active vs returned sections, durable missing-book fallback, empty /
  loading / retryable error states (due/overdue presentation still FEAT-08 remaining)
- `src/features/books/components/BookForm.test.tsx` / `bookFormModel.test.ts`: Form field rendering, gated create
  controls, initial values, empty title/authors and ISBN rejection, submit payload shaping via `formValuesToBookCreate`,
  blank-optional-to-`null`, year-only `publication_date`, purchase-price number serialization, tags normalization,
  cancel, submitting disabled state, and linked server field errors
- `src/features/books/utils/isbn.test.ts`: ISBN-10 / ISBN-13 checksum acceptance and rejection cases
- `src/features/scanning/IsbnCameraScanner.test.tsx` / `isbnCameraCapture.test.ts` / `isbnScannerParser.test.ts` /
  `useHardwareIsbnScanner.test.ts`: Camera UI, capture helpers, keyboard-wedge parser, and hardware hook coverage
- `docs/baselines/FEAT-06_scanner-support.md`: Scanner support matrix and manual device checklist
- `src/test/setup.ts`: Global Vitest setup that installs jest-dom matchers for every test.
- `src/test/renderAppTree.tsx`: Shared helpers (`renderAppTree`, `renderWithProviders`, `mockReachableApi`,
  `testRuntimeConfig`) that mount under `AppProviders` with a mocked reachable API.
- `scripts/productionBuildTokenInspection.test.ts`: Production build with source maps; fails if known test tokens appear
  in artifacts.

Tests use a jsdom browser simulation (except the Node-environment production-build inspection). Prefer semantic Testing
Library queries such as `getByRole()` and test user-visible behavior instead of implementation details. Route tests
should use `createTestRouter` / `renderAppTree` and must not mutate `window.history` across cases.

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

- `vite.config.ts`: Shared Vite and Vitest configuration. Enables React, jsdom tests, global test setup, and an optional
  same-origin API proxy when `SHADE_API_PROXY=1` (optional `SHADE_API_PROXY_TARGET`).
- `eslint.config.js`: Flat ESLint configuration for TypeScript and React Hooks. It ignores generated directories and
  treats warnings as failures through the package script.
- `tsconfig.json`: TypeScript solution file that references the application and Node/tooling configurations.
- `tsconfig.app.json`: Strict browser and React type checking for `src/`. It includes Vite, Vitest, and jest-dom types
  and emits no files.
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

Useful documents under `docs/` when a task needs them. This file remains the self-contained LLM baseline; attach the
items below only when their contents are necessary for the current work. Do not require another prompt pack before
starting from this document.

- `docs/tickets/FEAT-*.md`: Sequenced implementation tickets with acceptance criteria (`FEAT-08` through `FEAT-16`;
  FEAT-01 through FEAT-07 are complete and their ticket files are gone).
- `docs/baselines/FEAT-03_performance.md`: Large-library and bundle-size baselines for later hardening tickets.
- `docs/baselines/FEAT-06_scanner-support.md`: Scanner support matrix and manual device checklist.
- `docs/ToDo.md`: Human checklist of ticket completion status (may lag ticket-file removal).
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
- Keep feature UI behind the existing `src/features/*/routes/` ownership; replace placeholders when a ticket owns that
  route rather than inventing a parallel tree. For FEAT-08, extend the existing `CheckinPage` / `checkinModel` /
  `LoansPage` against the ticket's remaining scope (active-loan eligibility, selection without `bookId`, Field-linked
  `422`, documented `409`, due/overdue history). Wire to existing `useCheckinBook` / `booksApi.checkin` /
  `pickCheckinRequest` / `useLoans` / `useLoan`. Reuse FEAT-07 checkout patterns and FEAT-03 cache invalidation; do not
  invent a second check-in client, simulate check-in with `PATCH`, or revert those pages to placeholders. Do not pull
  reading completion (FEAT-09) or edit/delete (FEAT-10) into FEAT-08. Leave scanner code under `src/features/scanning/`
  lazy-loaded from `/books/new`. Leave checkout under `CheckoutPage` / `checkoutModel`.
- Reuse the FEAT-03 typed client, query keys, mutation invalidation, and redaction helpers; do not introduce a second
  state store, component library, CSS framework, or form library unless a ticket explicitly requires it.
- Keep forms, scanner, and dialogs local; keep connection state application-wide; invalidate affected queries after
  mutations. There is no realtime API.
- For API-dependent work, treat `docs/technical-reference/openapi.json` as the schema source of truth and
  `docs/technical-reference/API-for-FE.md` as behavioral guidance. Prefer a running backend `/openapi.json` for drift
  checks when available; do not invent lifecycle behavior with generic `PATCH`.
- Prefer product-domain names over vague folders such as `helpers` or `misc`.
- Never commit the API token, compile it into JS, put it in URLs, log Authorization headers, render API text as HTML, or
  upload SQL backup contents to telemetry. SQL backups are sensitive.

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
