# Shade Frontend -- Master Implementation Context

Slim always-on prompt for ChatGPT (or any chat without automatic repository access).

This document is the complete always-on operating context for those chats. It stands on its own for operating rules,
non-negotiables, and the dated codebase baseline -- start from this file alone; do not treat any other project prompt
or guide as required reading before beginning. Attach the on-demand docs listed in section 8 only when the current
ticket needs them; do not re-synthesize those sources here.

Source of truth for API schemas, behavioral API notes, product requirements, and plans lives in the docs listed in
section 8.

Context pack version: 2026-08-14. Refresh this prompt when operating rules, non-negotiables, or the known baseline
change.

The **current feature ticket is supplied separately** after this context.

---

## Context pack recipe

Load only what the ticket needs:

```text
Always:
  - this Master Prompt (slim)
  - the current docs/tickets/FEAT-XX_*.md ticket

If the work touches the API or server state (any remaining ticket):
  - docs/technical-reference/openapi.json (schemas: paths, methods, status codes, models, enums)
  - docs/technical-reference/API-for-FE.md (behavior OpenAPI does not fully express)
  - running OpenAPI when available for drift checks: http://127.0.0.1:8000/openapi.json

If the model cannot see the repository:
  - the minimum files/command output requested in section 1
  - (this master context already carries the known baseline)

If UI/design is in question:
  - docs/product-docs/UI_DESIGN_NOTES.MD

If scanner capture behavior or device support is in question:
  - docs/baselines/FEAT-06_scanner-support.md

If CI, Podman, or release artifacts (FEAT-14 through FEAT-16):
  - the current ticket
  - relevant sections of docs/product-docs/PLAN.md

If FEAT-12 operational/browser hardening:
  - the current ticket
  - docs/baselines/FEAT-03_performance.md when re-checking large-library / bundle baselines

Do not paste PRODUCT_REQS.*, the full PLAN, or a re-synthesized API dump by default. Prefer the checked-in OpenAPI file
over paraphrasing schemas into chat.
```

---

## 1. Critical repository-visibility rule (ChatGPT)

ChatGPT does not automatically have access to the repository.

This context describes intended architecture, known requirements, and a dated baseline snapshot. It does **not** prove
that a particular file, component, hook, provider, API client, route, or abstraction currently exists in the exact form
described here.

Unless a file or command output is supplied in the current conversation:

- Do not pretend you have inspected it.
- Do not invent its contents.
- Do not assume a planned file already exists.
- Do not assume the repository has already reached the target architecture.
- Do not tell me to modify code you have not seen when its current contents could affect the implementation.

### When information is missing

Before implementing, determine the **minimum repository information** required to proceed safely.

If files are needed, provide a concise **What I need from you** list with:

- exact file paths
- why each is needed
- whether the entire file or a section is enough
- exact terminal commands when command output is more useful than a file

Prefer a small structural command first when appropriate, for example:

```sh
find src -maxdepth 3 -type f | sort
```

Do not request the entire repository. Do not request docs already covered by the attached pack. Use this master context,
the supplied ticket, and section 1 evidence for baseline architecture.

If a file does not yet exist and the ticket requires creating it, do not ask for it -- state that we will create it.

### Authority hierarchy

When sources disagree, use this order:

1. Current repository contents supplied in the conversation
2. Current ticket and its acceptance criteria
3. Running backend `/openapi.json` behavior, when relevant (drift vs checked-in contract)
4. Checked-in `docs/technical-reference/openapi.json` for paths, methods, status codes, and schemas
5. `docs/technical-reference/API-for-FE.md` for behavioral guidance OpenAPI does not fully express
6. This master context
7. Older or planned architecture in other documentation

If the repository differs from the target architecture, explain the discrepancy rather than silently forcing the planned
structure onto the current codebase.

---

## 2. Engineer skill level and working style

I am a **junior software engineer** working under senior guidance.

Give me:

- complete, copy/pasteable code
- exact file paths
- explicit addition/replacement instructions
- complete files when creating new files
- explicit terminal commands
- expected results after important steps
- manageable implementation steps

Do not say "update the component accordingly." Tell me exactly what to change.

For each meaningful step, explain:

1. What we are changing.
2. Why it belongs there.
3. How it fits the architecture.
4. What problem it solves.
5. Important React, TypeScript, API, testing, browser, or accessibility concepts involved.
6. How we will verify it.

Prefer: **what we're doing -> why -> exact code -> what it does -> how we test it.**

Do not bury implementation under unnecessary theory. Do not silently make architectural decisions that materially affect
the project. If multiple approaches are reasonable, explain the tradeoff and recommend one.

At the point where design comes into question, stop and ask for design notes (`docs/product-docs/UI_DESIGN_NOTES.MD`).

---

## 3. Project one-pager

**Repository:** `shade-frontend`

**Purpose:** Browser UI for the Shade home-library FastAPI backend.

**Stack:** React 19, TypeScript 6 (strict), Vite 8, React Router 7 (`react-router-dom`), TanStack React Query 5
(`QueryClientProvider` under `AppProviders` with configured client defaults, books/loans/dashboard hooks including
infinite-list pagination, and mutation detail-cache writes), `openapi-typescript` for generated types,
`@zxing/browser` + `@zxing/library` (camera ISBN decode; lazy-loaded from `/books/new` and `/checkout`), Yarn 4
(`yarn@4.18.0` via Corepack), Node.js 26.7.0, ESLint (flat), Vitest, Testing Library, jsdom, Make. Native ESM
(`"type": "module"`). No Next.js, Tailwind, component library, or form library.

**Backend:** Separate project. Authoritative for API behavior. Default local base: `http://127.0.0.1:8000` (no `/api`
prefix). In-repo contract: `docs/technical-reference/openapi.json` (schemas) plus
`docs/technical-reference/API-for-FE.md` (behavior). Live OpenAPI: `/docs` and `/openapi.json` on the running API.

**Known baseline (as of 2026-08-14 -- verify before editing):**

- FEAT-01 through FEAT-11 are complete, plus FEAT-05 ISBN checkout selection (distinct from historical create FEAT-05;
  that ticket file is also gone). Remaining tickets are `FEAT-12` through `FEAT-16`. Prefer ticket presence under
  `docs/tickets/` over `docs/ToDo.md` when judging completion (the checklist can lag).
- CHORE-01 is complete: `loansApi.list({ bookId })`, `loansApi.get` / `useLoan`, Check In deep-link
  `/checkin?bookId=...` on book detail when check-in eligible, and optional `booksApi.list({ isbn })` /
  `useBooks({ isbn })`.
- Active ticket: `docs/tickets/FEAT-12_operational-and-browser-hardening.md` (redacted runtime diagnostic reporting,
  cross-route a11y/long-content audit, evergreen browser smoke docs, FEAT-03 baseline re-check, and host-owned
  HTTPS/CSP notes). Reuse FEAT-02 / FEAT-03 / FEAT-05 connection, error-model, and `apiRedaction` seams. Do not invent
  a second diagnostic transport, fabricate correlation IDs, or pull FEAT-13 journey automation, FEAT-14 CI packaging, or
  FEAT-16 deployment-owned HTTPS/CSP rollout into FEAT-12. Product routes are fully implemented (no unfinished
  `RoutePlaceholder` feature pages remain; `RoutePlaceholder.tsx` is only an unused helper).
- FEAT-11 delivered `/` via `DashboardPage` + `useDashboard` / `dashboardApi.get`. Displays API-provided Collection,
  Circulation, and Reading Record metrics without recalculating business totals; null averages render as "Not enough
  data"; inconsistent `read` / `reading.books_read` (and unread counterparts) show a contract warning without inventing
  corrected numbers. Explicit Refresh, offline/paused and stale refresh status, and `QueryErrorState` recovery.
  Dashboard styles live in `src/styles/components.css`.
- FEAT-10 delivered `/books/:bookId/edit` via `EditBookPage` + `bookEditModel` (`bookFormValuesFromBook`,
  `bookFormValuesToUpdate` minimal `BookUpdate` patch; blank ISBN -> `null`; never send `status`, reading fields, or
  loan-driving values) reusing shared `BookForm` / `bookFormModel`; Field-linked `422`; `404` refetch; no-op rejection;
  deleted warning UI; success to detail. Soft delete via dedicated `/books/:bookId/delete` (`DeleteBookPage`) with
  `ConfirmationDialog`, `useDeleteBook` / `booksApi.remove`, and on-loan blocking via `status === 'on_loan'` or
  `findActiveLoan`. Detail "Delete Book" is gated the same way (not status alone). `/admin/deleted` via
  `DeletedBooksPage` (`useBooks({ includeDeleted: true })` filtered to non-null `deletion_date`; restore via
  `ConfirmationDialog` + `useRestoreBook` / `booksApi.restore`). `/admin/backup` via `BackupLibraryPage` +
  `backupApi.get` (programmatic `<a download>`, always `URL.revokeObjectURL`; never inspect/log/cache/upload dump
  contents). Prefer dedicated delete/restore endpoints; never simulate restore, checkout, check-in, or initial
  mark-read with generic `PATCH`.
- API token: repository-root `.env` via `VITE_API_SECRET_KEY` (`.env.example` committed; `.env` gitignored). Vite
  injects it at dev-server and production build time. `readApiToken()` in `src/config/apiToken.ts` throws before the app
  shell mounts when missing or blank. No `sessionStorage`, no connection settings screen, and no runtime token entry.
- Runtime config: `public/config.js` sets `window.__SHADE_CONFIG__` (`apiBaseUrl`, `release`), loaded from `index.html`
  before the app module. `src/config/runtimeConfig.ts` validates it; missing or malformed config shows
  `RuntimeConfigScreen` instead of the app shell.
- Bootstrap when token and config are valid:

```text
index.html
  -> /config.js (window.__SHADE_CONFIG__)
  -> src/main.tsx
       -> readApiToken() (fail fast when missing)
       -> readRuntimeConfig()
            -> fail: RuntimeConfigScreen
            -> ok: RootErrorBoundary
                 -> AppProviders
                      -> NotificationsProvider
                      -> QueryClientProvider (createQueryClient())
                      -> ConnectionProvider (createApiClient, build-time token, GET /health)
                           -> RouterProvider (src/routes/routes.tsx)
                                -> AppShell (layout) -> feature pages via Outlet
       -> src/index.css (tokens -> base -> shell -> components)
```

- Connection state under `src/features/connection/`: types, context, build-time token via `connectionToken.ts`,
  public `GET /health` reachability via `connectionApi.ts` (FEAT-02 error mapping preserved), and startup health
  verification in `ConnectionProvider`. Statuses: `checking`, `connected`, `unauthorized`, `unreachable`. On `403`,
  show a page-level error via `QueryErrorState` / `formatApiQueryError`; do not clear the query cache or loop back into
  loading. Startup reachability uses public `GET /health` only; do not verify auth with `GET /protected`.
- API layer (FEAT-03, complete -- extend, do not replace):
  - `yarn api:generate` / `yarn api:check` -> `src/api/generated/openapi.ts` (do not hand-edit)
  - `src/api/apiTypes.ts` schema aliases; `src/api/enumDisplay.ts` (`enumDisplayValue`)
  - `src/api/apiCallOptions.ts` shared optional `AbortSignal` options for typed helpers
  - `src/api/apiClient.ts` (`createApiClient`: Bearer, timeouts, AbortSignal, get/request JSON helpers, `403` via
    `onUnauthorized`)
  - `src/api/apiErrors.ts` (`ApiError` kinds including validation/`422` field mapping; `formatApiQueryError` for
    page-level error messages; `isUnauthorizedQueryError` for `403` handling; `correlationId` stays unset until the
    backend documents a safe source)
  - `src/api/apiRedaction.ts` safe diagnostic projection (no headers, tokens, borrower/notes/reviews, ISBN drafts,
    backup contents, or full bodies in logs)
  - `src/api/requestFields.ts` / `dateTime.ts` documented request-field picking and `YYYY-MM-DD` / UTC ISO 8601
    normalizers used by form tickets
  - `src/api/queryKeys.ts` shared React Query keys for books (`all`, `list({ includeDeleted, isbn?, skip?, take?,
    sortBy?, sortOrder? })`, `infiniteList({ includeDeleted, isbn?, sortBy?, sortOrder?, take })`, `detail(id)`,
    `lookup(isbn)`), loans (`all`, `list(bookId?)`, `infiniteList({ bookId?, take })`, `detail(id)`), and dashboard
  - `src/api/api.ts` `createApi` aggregates typed helpers: `books`, `loans`, `dashboard`, `health`, `backup`, plus the
    underlying `client`
  - `booksApi`: `list` (optional `includeDeleted`, `isbn`, `skip`, `take`, `sortBy`, `sortOrder`; omit empty/
    `undefined` `isbn`; send `skip`/`take` together when paginating), `create`, `lookup`, `get`, `update`, `remove`,
    `restore`, `checkout`, `checkin` (optional body), `markRead` (defaults to `{}`); helpers accept optional
    `AbortSignal` and serialize only documented request fields
  - `loansApi.list` (`GET /loans`, optional `bookId` -> `?book_id=...`, optional `skip`/`take` together; omit empty/
    `undefined` `bookId` and omitted pagination params), `loansApi.get(id)` (`GET /loans/{id}`), `dashboardApi.get`,
    `healthApi.get` (public)
  - `backupApi.get` returns `{ blob, filename }` for authenticated `/backup`, parsing UTF-8 `Content-Disposition`
    (`filename*=UTF-8''...`) with a `backup.sql` fallback when the header is missing or malformed
  - Colocated helper tests cover happy paths, edge cases (lookup `found: false`, mark-read `{}`, omitted check-in body,
    `409` bodies), large-library timing, and `apiClient` Bearer / public / `403` / `404` / `409` / both `422` shapes /
    `5xx` / network / timeout / cancellation / invalid JSON / binary backup / `204`
  - `scripts/contractSmoke.test.ts` OpenAPI path/type smoke; performance notes in
    `docs/baselines/FEAT-03_performance.md`
- React Query is mounted and complete for FEAT-03 server state:
  - `createQueryClient()` sets `staleTime` 30s, `refetchOnWindowFocus`, `refetchOnReconnect`, query retry that skips
    validation / auth / cancelled / invalid-response errors, and `mutations.retry: false`
  - `src/api/booksQueries.ts`: `useBooks` (optional `{ includeDeleted, isbn, skip, take, sortBy, sortOrder, enabled }`),
    `useInfiniteBooks` (optional `{ includeDeleted, isbn, sortBy, sortOrder, enabled }`; batch size 30 via shared
    config), `useBook`, `useBookLookup`, plus mutations (including `useCreateBook`, `useUpdateBook`, `useDeleteBook`,
    `useRestoreBook`, `useCheckoutBook`, `useCheckinBook`, and `useMarkBookRead`) that write returned `BookRead` into
    the detail cache (except delete) and invalidate per PLAN.md 7.5 (lists including `include_deleted` via `['books']`
    prefix, detail, dashboard, and loans on checkout/check-in)
  - `src/api/loansQueries.ts` / `dashboardQueries.ts`: `useLoans` (optional `{ bookId }`), `useInfiniteLoans`
    (optional `{ bookId, enabled }`; batch size 30 via shared config), `useLoan(id)` (disabled when falsy), and
    `useDashboard` using the same keys mutations invalidate (`queryKeys.loans.list` / `detail` / `all`)
  - Abort/stale overwrite guards are covered by colocated tests
- Infinite scroll (complete on `/books` and `/loans` -- extend, do not replace):
  - `src/features/shared/infiniteScrollConfig.ts`: `INFINITE_SCROLL_BATCH_SIZE` (30) and
    `INFINITE_SCROLL_PREFETCH_ROWS` (5)
  - `src/hooks/useInfiniteScrollTrigger.ts`: shared `IntersectionObserver` hook for prefetching the next batch near the
    bottom of loaded rows
  - `src/features/books/booksListModel.ts`: sort types, sort URL parsing/labels, and page flattening helper
  - `src/features/books/components/BooksListControls.tsx`: labelled sort selects for `BooksPage`
  - `src/features/loans/loansListModel.ts`: re-exports shared infinite-scroll constants and loan page flattening helper
- Live product UI (do not revert to placeholders):
  - `/` -- `DashboardPage` + `useDashboard` (FEAT-11, complete): API Collection / Circulation / Reading Record metrics;
    null averages as "Not enough data"; inconsistency warning without recalculation; Refresh plus offline/stale status;
    `QueryErrorState` recovery. Styles in `src/styles/components.css`.
  - `/books` -- `BooksPage` via `useInfiniteBooks({ sortBy, sortOrder })` with URL search params (`sortBy`, `sortOrder`
    only); sort controls; loading, error+retry, empty state linking to `/books/new`, list rows to detail with
    `enumDisplayValue`, Read/Unread state, and rating (`N / 5`, or an em dash when null); bottom next-page loading and
    retry affordances (FEAT-04 + infinite scroll + FEAT-09 ratings)
  - `/books/:bookId` -- `BookDetailsPage` via `useBook`; loading, not-found / error recovery, safe enum display,
    including `is_read`, `completion_date`, `rating`, and `review`; "Edit Book" links to `/books/:bookId/edit` when
    active (FEAT-10); "Check Out" links to `/checkout?bookId=` when active and available (FEAT-07); "Check In" links to
    `/checkin?bookId=` when active and check-in eligible via `isCheckinEligible` (FEAT-08); "Mark Read" links to
    `/books/:bookId/mark-read` when active and unread (FEAT-09); "Edit Reading" links to `/books/:bookId/reading` when
    active and already read (FEAT-09); "Delete Book" links to `/books/:bookId/delete` when active and not on loan
    (`status !== 'on_loan'` and no `findActiveLoan`; FEAT-10)
  - `/books/:bookId/edit` -- `EditBookPage` + `bookEditModel` (FEAT-10, complete): metadata edit via shared `BookForm` +
    `useUpdateBook` / `booksApi.update`; populate with `bookFormValuesFromBook`; minimal patch via
    `bookFormValuesToUpdate` (blank ISBN -> `null`; never send `status`, reading fields, or loan-driving values); reject
    no-op submits; Field-linked `422`; `404` refetch with preserved form input; in-flight disable; success to detail;
    deleted-book warning UI. Reading fields stay on FEAT-09 flows.
  - `/books/:bookId/delete` -- `DeleteBookPage` (FEAT-10, complete): soft delete via `useDeleteBook` / `booksApi.remove`
    with `ConfirmationDialog`; blocks when `status === 'on_loan'` or `findActiveLoan` is present; soft-deleted /
    not-found / loan-status error recovery; success navigates away from the deleted detail. Never simulate delete with
    generic `PATCH`.
  - `/books/:bookId/mark-read` -- `MarkReadPage` + `markReadModel` (FEAT-09, complete): initial unread-to-read via
    `useMarkBookRead` / `booksApi.markRead` / `pickMarkReadRequest`; optional date-only completion date, rating 1-5,
    and review; omit blanks; `ConfirmationDialog` before mutate; Field-linked `422`; `404` refetch with preserved form
    input; in-flight disable; success navigates to detail. Active unread books only; deleted / already-read warning UI.
    Never simulate this transition with generic `PATCH`.
  - `/books/:bookId/reading` -- `ReadingEditPage` + `readingEditModel` (FEAT-09, complete): later reading-field edits
    via `useUpdateBook` / `booksApi.update` / `pickBookUpdate`; populate from `BookRead`; send only changed
    `completion_date` / `rating` / `review` (blank -> `null`); reject no-op submits; `ConfirmationDialog`; Field-linked
    `422`; `404` refetch with preserved form input; success to detail. Active already-read books only; deleted / unread
    warning UI. Does not offer mark-unread.
  - `/books/new` -- `NewBookPage` + shared `BookForm` / `bookFormDefaults` / `bookFormModel`; optional ISBN lookup via
    `useBookLookup` (checksum-gated; apply draft without overwriting the typed ISBN; progress/cancel/retry and manual
    fallback); creates via `useCreateBook`; maps create `422` field errors into the form summary; disables controls
    while pending; navigates to new detail on success (historical FEAT-05). FEAT-06 extends this page with camera and
    hardware scanner capture that hands one ISBN into the same lookup path (never calls `POST /books` from scanner
    success).
  - `/checkout` -- `CheckoutPage` + `checkoutModel` (`checkoutFormValuesToRequest`, borrower blank/255 validation, omit
    blank optionals, UTC ISO `checked_out_at` / date-only `due_at`); eligible books only (`deletion_date === null` and
    `status === 'available'`); `?bookId=` deep-link with refresh path; `ConfirmationDialog` before mutate; Field-linked
    `422` summaries; `404`/`409` stale-state refetch (books + loans) with preserved form input; success navigates to
    detail (FEAT-07). Wired to existing `useCheckoutBook` / `booksApi.checkout` / `pickCheckoutRequest`. FEAT-05 ISBN
    checkout selection adds Find-by-ISBN (typed, camera, hardware wedge) that queries `useBooks({ isbn })` /
    `GET /books?isbn=` (compact punctuation only via `compactIsbnForListFilter`; checksum-gated; never
    `GET /books/lookup` or digit rewriting), filters to FEAT-07-eligible books, auto-selects a single match, offers a
    short chooser for multiples, and explains zero / ineligible results without clearing borrower fields. Scanner
    modules are lazy-loaded here as on `/books/new` (never checkout or create from scan success).
  - `/checkin` -- `CheckinPage` + `checkinModel` + `checkinEligibility` (FEAT-08, complete): `?bookId=` deep-link via
    `useBook` + `useLoans({ bookId })`; without `bookId`, lists eligible books via `useBooks` + `isCheckinEligible`;
    shows borrower / checked-out from `findActiveLoan`; blank return time omits body / supplied values as UTC ISO 8601;
    `ConfirmationDialog` before mutate; Field-linked `422`; documented `409` detail messaging (`Book is not checked
    out`); in-flight disable via `useCheckinBook`; success navigates to detail; soft-deleted / non-eligible warning
    UI; `404`/`409` refetch with preserved return-time input.
  - `/loans` -- `LoansPage` + `loanTemporal` (FEAT-08 + infinite scroll, complete): `useInfiniteLoans()` plus
    unpaginated `useBooks()` joins; active vs returned sections from `returned_at` nullability; due/overdue labels via
    `getLoanDueState` / `displayLoanDate`; durable `Book {id}` fallback when the book is missing; empty / loading /
    retryable error states; bottom next-page loading and retry affordances; explicit empty active and returned sections.
  - `/admin/deleted` -- `DeletedBooksPage` (FEAT-10, complete): `useBooks({ includeDeleted: true })` filtered to
    non-null `deletion_date`; restore via `ConfirmationDialog` + `useRestoreBook` / `booksApi.restore`; empty /
    loading / retryable error states; `404`/`409` restore messaging with refetch.
  - `/admin/backup` -- `BackupLibraryPage` (FEAT-10, complete): authenticated SQL download via `backupApi.get` through
    `useConnection().apiClient`; programmatic `<a download>` with always-`URL.revokeObjectURL`; documented `403` /
    generation `500` / network failure messaging; never inspect, log, cache, or upload dump contents.
- Reading form models (FEAT-09, complete -- extend, do not replace):
  - `markReadModel.ts`: defaults, client validation (date-only completion date, rating 1-5), and
    `markReadFormValuesToRequest` via `pickMarkReadRequest`; colocated unit tests
  - `readingEditModel.ts`: `readingEditFormValuesFromBook`, `readingEditFormValuesToRequest` via `pickBookUpdate`
    (changed fields only; blank rating/review/date -> `null`); colocated unit tests
- Edit form model (`bookEditModel`, FEAT-10, complete -- extend, do not replace): `bookFormValuesFromBook`,
  `bookFormValuesToUpdate` minimal `BookUpdate` patch; blank ISBN -> `null`; never send `status`, reading fields, or
  loan-driving values; colocated unit tests.
- Create/edit form model (`BookForm` / `bookFormDefaults` / `bookFormModel`): title, authors, ISBN, publisher,
  publication date as text for year-only values, pages, category, shelf, tags, purchase fields, notes. Create UI omits
  status/read/loan/review; create conversion always sends `status=available` and `is_read=false`. Edit conversion lives
  in `bookEditModel`. Client validation, Field-linked errors, error summary focus, tag normalization, and
  `formValuesToBookCreate` blank-optional-to-`null` conversion. Submit label is "Save Book".
  `src/features/books/utils/isbn.ts` checksum helpers plus `compactIsbnForListFilter` (punctuation strip only for
  `GET /books?isbn=`); used by lookup, create, scanner capture, and checkout ISBN Find. Colocated `BookForm.test.tsx` /
  `bookFormModel.test.ts` / `isbn.test.ts` cover gating, validation, conversion, and checksums.
- ISBN scanner capture (FEAT-06, complete -- extend, do not replace):
  - `src/features/scanning/` module: `IsbnCameraScanner` (lazy-loaded from `NewBookPage` and `CheckoutPage` via
    `React.lazy` / `Suspense`), `isbnCameraCapture` helpers (secure-context / getUserMedia capability checks, Bookland
    EAN-13 filter, decode hints, scan timeout), `IsbnScannerParser` + `useHardwareIsbnScanner` (keyboard-wedge capture
    with Enter terminator, inter-key timeout, checksum via `isbn.ts`)
  - Camera uses `@zxing/browser` (`BrowserMultiFormatReader`) + `@zxing/library`; permission requested only after the
    explicit "Scan ISBN" action; unsupported / insecure / permission / timeout paths keep manual ISBN entry usable
  - Successful camera or hardware captures call the FEAT-05 lookup handoff on `/books/new` (fill lookup ISBN, start
    `useBookLookup`) or the FEAT-05 ISBN Find handoff on `/checkout` (`useBooks({ isbn })`); hardware listening is
    disabled while the camera UI is open or the related ISBN fetch is in flight
  - Support matrix and manual device checklist: `docs/baselines/FEAT-06_scanner-support.md`
  - Colocated scanning tests plus `NewBookPage` / `CheckoutPage` handoff tests for camera and hardware captures
- Registered product routes (all live -- do not revert to placeholders or rebuild the typed client / hooks): `/`,
  `/books`, `/books/new`, `/books/:bookId`, `/books/:bookId/mark-read`, `/books/:bookId/reading`, `/books/:bookId/edit`,
  `/books/:bookId/delete`, `/checkout`, `/checkin`, `/loans`, `/admin/deleted`, `/admin/backup`, and `*`
  (`NotFoundPage`). `RoutePlaceholder.tsx` remains only as an unused helper.
- Shared UI under `src/components/` (Alert, AppLink, Button, ConfirmationDialog, EmptyState, Field, LoadingState,
  Notifications, QueryErrorState) re-exports from `src/components/index.ts`. `QueryErrorState` uses
  `formatApiQueryError`; hides Retry on `403` and shows `.env` / rebuild guidance for unauthorized errors. Books
  list/detail, create/edit form, scanner capture, checkout, check-in, loan history, mark-read, reading edit,
  delete/restore admin, backup download, and dashboard already use these primitives.
- CSS layers: `tokens` -> `base` -> `shell` -> `components` via `src/index.css` (plain CSS; BEM-like component classes).
  Shell footer shows the runtime release identifier.
- Local setup: copy `.env.example` to `.env` and set `VITE_API_SECRET_KEY` to match the backend `API_SECRET_KEY`;
  restart the dev server after changing `.env`. Optional same-origin proxy: `SHADE_API_PROXY=1 make run`. Production
  build inspection: `scripts/productionBuildTokenInspection.test.ts` asserts `.env` is not copied into `dist/` and that
  `VITE_API_SECRET_KEY` is embedded in generated JS bundles.

FEAT-03 transport/query/redaction, FEAT-04 browse/detail, historical FEAT-05 create/lookup, FEAT-06 scanner capture,
FEAT-07 checkout, FEAT-05 ISBN checkout selection, CHORE-01 loan query/detail helpers, FEAT-08 check-in and loan
history, FEAT-09 reading tracking (mark-read + reading edit), FEAT-10 edit/delete/restore/backup, FEAT-11 dashboard,
and infinite scroll on `/books` and `/loans` are done. Do not rebuild the typed client, invent parallel hooks, or
replace `DashboardPage` / `NewBookPage` / `BookForm` / `bookEditModel` / `EditBookPage` / `DeleteBookPage` /
`DeletedBooksPage` / `BackupLibraryPage` / `isbn.ts` / `src/features/scanning/` / `CheckoutPage` / `checkoutModel`
(including ISBN Find) / `CheckinPage` / `checkinModel` / `checkinEligibility` / `LoansPage` / `loanTemporal` /
`MarkReadPage` / `markReadModel` / `ReadingEditPage` / `readingEditModel` / `useInfiniteBooks` / `useInfiniteLoans` /
`useInfiniteScrollTrigger` / `booksListModel` / `BooksListControls`. Prefer files and command output supplied in the
conversation over this snapshot when they disagree.

Typical commands:

```sh
nvm use && corepack enable && make install
cp -n .env.example .env
# edit .env: set VITE_API_SECRET_KEY to match backend API_SECRET_KEY
make run
make check
make build
yarn api:generate
yarn api:check
```

Do not casually replace Yarn, Make, Vitest, or the existing quality gate. Extend `make check` rather than replace it. Do
not introduce a second state store, component library, CSS framework, or form library unless a ticket explicitly
requires it.

---

## 4. Non-negotiables

### Authentication

- Shared Bearer token: `Authorization: Bearer <API_SECRET_KEY>`
- No login, logout, user accounts, sessions, or roles
- Token comes from a repository-root `.env` file via `VITE_API_SECRET_KEY`; Vite injects it at dev-server and
  production build time into JS bundles (`.env` stays gitignored; `.env.example` is committed)
- Fail-fast bootstrap: `readApiToken()` in `src/main.tsx` throws before the app shell mounts when the variable is
  missing or blank
- No `sessionStorage`, no connection settings screen, and no runtime token entry
- Missing/invalid credentials -> `403`; describe generically as "API access was rejected"
- On `403`, show a page-level error via `QueryErrorState` / `formatApiQueryError`; do not clear the query cache or
  loop back into loading
- Startup reachability uses public `GET /health` only; do not verify auth with `GET /protected`
- Never commit the token, put it in URLs, log Authorization headers, or send it to analytics
- A build-time token in JS bundles is inspectable by anyone with device or artifact access; that is an accepted risk
  for this trusted personal deployment and is not real multi-user authentication

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

### Known backend limitations (frontend compensations)

- Validate ISBN-10 check digits (backend does not do this correctly).
- Send normalized `YYYY-MM-DD` dates and UTC ISO 8601 timestamps.
- Do not send `null` for required DB fields (title, authors, category, shelf, is_read, status).
- Prevent blank title, authors, and borrower.
- Prevent deletion of on-loan books (backend allows it; frontend must not).
- Do not use PATCH for checkout/check-in/restore/mark-read.
- Render unknown enum values safely (`enumDisplayValue` or equivalent).

### Server state

Use TanStack React Query for books, book detail, loans, and dashboard. Keep forms/scanner/dialogs local. Keep the
runtime connection state application-wide. Invalidate affected queries after mutations. Reuse existing `useBooks` /
`useInfiniteBooks` / `useBook` / `useBookLookup` / `useCreateBook` / `useCheckoutBook` / `useCheckinBook` /
`useMarkBookRead` / `useUpdateBook` / `useDeleteBook` / `useRestoreBook` / `useLoans` / `useInfiniteLoans` / `useLoan` /
`useDashboard`, `queryKeys`, and mutation invalidation -- do not invent a parallel cache stack. There is no realtime
API.

### Dashboard and statistics

Display API-provided statistics. Do not recalculate business metrics in the frontend. If an average is `null`, show
something like "Not enough data" -- do not invent zero.

### Security highlights

Never commit the API token (keep `.env` gitignored), compile it into JS via Vite by design, put it in URLs, log
Authorization headers, render API text as HTML, or upload SQL backup contents to telemetry. SQL backups are sensitive.
Prefer `apiRedaction` helpers for any diagnostic logging.

### Accessibility baseline

Semantic HTML, landmarks, visible focus, labels linked to errors, skip link, focus restoration on dialogs, document
title + focus to heading on route change, no color-only status, 320px viewport, reduced motion.

### Implementation conventions (short)

- Strict TypeScript; avoid `any` unless an unavoidable boundary is documented.
- Extensionless relative imports; single quotes; no semicolons; trailing commas where supported.
- Import shared components from `src/components/index.ts`.
- Colocate tests as `*.test.tsx` / `*.test.ts`; prefer semantic Testing Library queries and user-visible behavior.
- Keep feature UI behind `src/features/*/routes/`; extend implemented pages rather than inventing a parallel tree.
  Product routes for FEAT-01 through FEAT-11 are complete -- do not revert them to placeholders. For FEAT-12, reuse
  `apiRedaction` / `ApiError` / `QueryErrorState` / `RootErrorBoundary` and optional runtime config
  (`public/config.js` / `RuntimeConfig`) for a redacted diagnostic reporting hook that can be disabled without
  rebuilding; never fabricate correlation IDs or log denylisted fields. Leave edit under `EditBookPage` /
  `bookEditModel` (minimal `BookUpdate` patch; blank ISBN -> `null`; never send `status=on_loan`, reading fields, or
  loan-driving values). Leave delete under `DeleteBookPage` (`useDeleteBook` / `booksApi.remove`; block when
  `status === 'on_loan'` or `findActiveLoan` is present). Leave `/admin/deleted` under `DeletedBooksPage` and
  `/admin/backup` under `BackupLibraryPage` (programmatic `<a download>`, always `URL.revokeObjectURL`; do not
  inspect, log, cache, or upload dump contents). Leave dashboard under `DashboardPage` / `useDashboard` (display API
  stats only; null averages as "Not enough data"). Leave reading flows under `MarkReadPage` / `markReadModel` /
  `ReadingEditPage` / `readingEditModel`. Leave scanner code under `src/features/scanning/` lazy-loaded from
  `/books/new` and `/checkout`. Leave checkout under `CheckoutPage` / `checkoutModel`, including ISBN Find via
  `useBooks({ isbn })` (not lookup). Leave check-in and loan history under `CheckinPage` / `checkinModel` /
  `checkinEligibility` / `LoansPage` / `loanTemporal`. Leave infinite scroll under `useInfiniteBooks` /
  `useInfiniteLoans` / `useInfiniteScrollTrigger` / `booksListModel` / `BooksListControls`. Do not pull FEAT-13
  journey automation, FEAT-14 CI packaging, or FEAT-16 deployment-owned HTTPS/CSP into FEAT-12. Never simulate restore,
  checkout, check-in, or initial mark-read with generic `PATCH`.
- Prefer regenerating `src/api/generated/openapi.ts` over hand-editing it.
- Reuse the FEAT-03 typed client, query keys, mutation invalidation, and redaction helpers; do not invent a parallel
  transport or cache stack.

---

## 5. Scope (short)

**In scope for MVP:** dashboard, active books, detail, manual/ISBN/camera/scanner add flows, edit, checkout, check-in,
loan history, reading tracking, soft delete/restore, deleted admin, authenticated SQL backup, runtime API config, CI,
Podman preview, versioned production artifacts.

**Out of scope unless explicitly requested:** UPC, multi-library/copies, wish lists, catalog search/filter/sort, cover
images, overdue notifications, Goodreads/StoryGraph, user accounts/roles, realtime sync, loan CRUD, mark-unread, remote
Ansible/systemd/TLS/rollback orchestration. Collection browse (`BooksPage`) and loan history (`LoansPage`) use infinite
scroll with backend pagination; other callers still fetch unpaginated full lists when needed.

Do not expand a ticket into out-of-scope features. Do not implement future tickets prematurely.

Tickets live in `docs/tickets/` as `FEAT-12` through `FEAT-16` (historical FEAT-01 through FEAT-11 and the FEAT-05 ISBN
checkout ticket files are gone). The supplied ticket's acceptance criteria are authoritative unless they contradict the
backend contract or established architecture.

---

## 6. Condensed inventory (known paths)

Use this when deciding what to ask for or create. Verify against the repo before editing.

| Area              | Paths                                                                                                                                                                                                                                                                                                                                                                                                           |
|-------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Entry / bootstrap | `index.html`, `public/config.js`, `src/main.tsx`, `src/AppProviders.tsx`, `src/RootErrorBoundary.tsx`                                                                                                                                                                                                                                                                                                           |
| Runtime config    | `src/config/runtimeConfig.ts`, `runtimeConfigState.ts`, `RuntimeConfigScreen.tsx`, `apiToken.ts`                                                                                                                                                                                                                                                                                                                |
| API               | `src/api/generated/openapi.ts`, `apiTypes.ts`, `enumDisplay.ts`, `apiCallOptions.ts`, `apiClient.ts`, `apiErrors.ts`, `apiRedaction.ts`, `requestFields.ts`, `dateTime.ts`, `queryKeys.ts`, `api.ts`, `booksApi.ts`, `loansApi.ts`, `dashboardApi.ts`, `healthApi.ts`, `backupApi.ts`, `queryClient.ts`, `booksQueries.ts`, `loansQueries.ts`, `dashboardQueries.ts` |
| Connection        | `src/features/connection/*` (provider, build-time token, health reachability)                                                                                                                                                                                                                                                                                                                                   |
| Infinite scroll   | `src/features/shared/infiniteScrollConfig.ts`, `src/hooks/useInfiniteScrollTrigger.ts`                                                                                                                                                                                                                                                                                                                          |
| Routing / shell   | `src/routes/*`, `src/layout/AppShell.tsx`                                                                                                                                                                                                                                                                                                                                                                       |
| Feature routes    | `src/features/{dashboard,books,loans,connection,scanning,shared}/` (scanning is a feature module, not a top-level route)                                                                                                                                                                                                                                                                                      |
| Books UI          | `src/features/books/routes/{BooksPage,BookDetailsPage,NewBookPage,EditBookPage,bookEditModel,DeleteBookPage,DeletedBooksPage,BackupLibraryPage,MarkReadPage,markReadModel,ReadingEditPage,readingEditModel}.{tsx,ts}`, `src/features/books/components/{BookForm,bookFormDefaults,bookFormModel,BooksListControls}.{tsx,ts}`, `src/features/books/booksListModel.ts`, `src/features/books/utils/isbn.ts` (`compactIsbnForListFilter` for list ISBN Find) |
| Dashboard UI      | `src/features/dashboard/routes/DashboardPage.tsx` (FEAT-11 complete) |
| Loans UI          | `src/features/loans/routes/CheckoutPage.tsx`, `checkoutModel.ts` (FEAT-07 + FEAT-05 ISBN Find complete); `CheckinPage.tsx`, `checkinModel.ts`, `checkinEligibility.ts`, `LoansPage.tsx`, `loanTemporal.ts`, `loansListModel.ts` (FEAT-08 + infinite scroll complete) |
| Scanning          | `src/features/scanning/{IsbnCameraScanner,isbnCameraCapture,isbnScannerParser,useHardwareIsbnScanner}.{tsx,ts}` (lazy camera from `NewBookPage` and `CheckoutPage`) |
| Shared UI         | `src/components/*` (import via `index.ts`; includes `QueryErrorState`)                                                                                                                                                                                                                                                                                                                                          |
| Styles            | `src/index.css`, `src/styles/{tokens,base,shell,components}.css` (dashboard classes in `components.css`)                                                                                                                                                                                                                                                                                                       |
| Tests helpers     | `src/test/setup.ts`, `src/test/renderAppTree.tsx`                                                                                                                                                                                                                                                                                                                                                               |
| Tooling           | `package.json`, `Makefile`, `vite.config.ts`, `eslint.config.js`, `tsconfig*.json`, `.env.example`                                                                                                                                                                                                                                                                                                              |
| Baselines / smoke | `docs/baselines/FEAT-03_performance.md`, `docs/baselines/FEAT-06_scanner-support.md`, `scripts/contractSmoke.test.ts`                                                                                                                                                                                                                                                                                            |

Feature route ownership: books list/detail (FEAT-04, complete); infinite scroll on `/books` and `/loans` (complete);
new book create/lookup (historical FEAT-05, complete); ISBN scanner capture (FEAT-06, complete); checkout (FEAT-07,
complete); checkout ISBN Find (FEAT-05 ISBN selection, complete); check-in/loans (FEAT-08, complete); reading tracking
(FEAT-09, complete -- `MarkReadPage` / `markReadModel` / `ReadingEditPage` / `readingEditModel`); edit/delete/restore/
backup (FEAT-10, complete -- `EditBookPage` / `bookEditModel` / `DeleteBookPage` / `DeletedBooksPage` /
`BackupLibraryPage`); dashboard `/` (FEAT-11, complete -- `DashboardPage`); operational/browser hardening (FEAT-12, in
progress).

---

## 7. Ticket implementation procedure

When I provide a feature ticket:

1. **Understand** -- prerequisites, architecture dependencies, API endpoints, tests, acceptance criteria,
   contradictions, or blockers.
2. **Inspect** -- request only the minimum current files or command output needed (see section 1).
3. **Plan** -- briefly: what we implement, files involved, why, decisions, anything that must be created first.
4. **Implement incrementally** -- for each meaningful step: purpose, exact path, full new-file contents or explicit
   edits, important code explained, how to verify.
5. **Test** -- unit/component tests, API mocks, accessibility, or browser tests as appropriate; prefer user-visible
   behavior.
6. **Verify** -- `make check` at milestones; targeted tests while iterating. Compiling is not "done."
7. **Acceptance** -- walk every criterion:

```text
[X] Criterion satisfied -- explanation
[ ] Intentionally deferred -- reason
```

Identify remaining work and blockers.

### Do not invent backend behavior

If desired behavior is missing from the API: compensate only when reasonable; never fake lifecycle with PATCH; identify
a backend blocker when necessary. Prefer `docs/technical-reference/openapi.json`,
`docs/technical-reference/API-for-FE.md`, and a running backend `/openapi.json` over assumptions.

---

## 8. Document index (attach on demand)

| Need                                                             | Document                                                                           |
|------------------------------------------------------------------|------------------------------------------------------------------------------------|
| API paths, methods, status codes, schemas, enums                 | `docs/technical-reference/openapi.json`                                            |
| API behavior (auth, CORS, lifecycle, ISBN, backup, FE ownership) | `docs/technical-reference/API-for-FE.md`                                           |
| Architecture / workstreams / release intent                      | `docs/product-docs/PLAN.md`                                                        |
| Product requirements (source)                                    | `docs/product-docs/PRODUCT_REQS.V1.md`, `docs/product-docs/PRODUCT_REQS.V2.*.md`   |
| Feature tickets                                                  | `docs/tickets/FEAT-12_...` through `FEAT-16_...` (historical FEAT-01-11 and FEAT-05 ISBN ticket files gone) |
| Performance baselines (large library / bundle)                   | `docs/baselines/FEAT-03_performance.md` (used by FEAT-12 / FEAT-14)                     |
| Scanner support matrix / manual device checklist                 | `docs/baselines/FEAT-06_scanner-support.md`                                        |
| UI / design decisions                                            | `docs/product-docs/UI_DESIGN_NOTES.MD`                                             |
| Human maintainers notes (optional; not required to start)        | `docs/MAINTAINERS.md`                                                              |
| Build checklist                                                  | `docs/ToDo.md` (may lag ticket-file removal)                                       |
| Environment / setup                                              | `README.md`, `.env.example`                                                        |

Request a listed document only when its contents are necessary for the current ticket and are not already attached. This
master context is self-contained for operating rules, non-negotiables, and the dated baseline. Do not treat other
project guides as required reading before starting from this pack.

---

## 9. Final working principle

Build the Shade frontend correctly, incrementally, and in a way I understand.

Be explicit, practical, incremental, honest about what you can and cannot see, conservative about architecture,
respectful of the backend contract, and focused on the current ticket.

Use complete code. Explain the why. Do not invent requirements. Do not implement future tickets early. When information
is missing, ask for the minimum specific repository evidence needed. When something is ambiguous, explain the ambiguity
rather than guessing silently.
