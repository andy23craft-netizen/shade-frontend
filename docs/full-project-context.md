# Shade Frontend -- Master Implementation Context

Slim always-on prompt for ChatGPT (or any chat without automatic
repository access).

This document is the complete always-on operating context for those
chats. It stands on its own for operating rules, non-negotiables, and
the dated codebase baseline -- start from this file alone. It does not
depend on any other LLM prompt or agents guide. Attach the on-demand
docs listed in section 8 only when the current ticket needs them; do
not re-synthesize those sources here.

Source of truth for API schemas, behavioral API notes, product
requirements, and plans lives in the docs listed in section 8.

Context pack version: 2026-08-17. Refresh this prompt when operating
rules, non-negotiables, or the known baseline change.

The **current feature ticket is supplied separately** after this
context.

------------------------------------------------------------------------

## Context pack recipe

Load only what the ticket needs:

``` text
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

If test/workflow/accessibility baseline behavior is relevant:
  - docs/baselines/FEAT-13_testing.md
  - docs/baselines/FEAT-06_scanner-support.md and
    docs/baselines/FEAT-12_browser-support.md when manual support matrices are relevant
  - preserve the existing Vitest / Testing Library / renderAppTree and Playwright e2e architecture;
    do not invent a parallel fake-API stack

If Podman (FEAT-15 complete) or release artifacts (FEAT-16 complete):
  - README.md (local development, deployed-development image, deployed-production tarball)
  - relevant sections of docs/product-docs/PLAN.md

If browser-support or production-host security baselines are needed:
  - docs/baselines/FEAT-12_browser-support.md
  - README.md / docs/MAINTAINERS.md for the documented production-host security boundary
  - bundle-budget and CI facts in this master context (FEAT-14 complete)

If later product tickets (FEAT-18 through FEAT-21):
  - the current ticket
  - docs/technical-reference/openapi.json and API-for-FE.md when the ticket touches new API surfaces
  - docs/product-docs/UI_DESIGN_NOTES.MD when layout or visual design is in question

Do not paste PRODUCT_REQS.*, the full PLAN, or a re-synthesized API dump by default. Prefer the checked-in OpenAPI file
over paraphrasing schemas into chat.
```

------------------------------------------------------------------------

## 1. Critical repository-visibility rule (ChatGPT)

ChatGPT does not automatically have access to the repository.

This context describes intended architecture, known requirements, and a
dated baseline snapshot. It does **not** prove that a particular file,
component, hook, provider, API client, route, or abstraction currently
exists in the exact form described here.

Unless a file or command output is supplied in the current conversation:

-   Do not pretend you have inspected it.
-   Do not invent its contents.
-   Do not assume a planned file already exists.
-   Do not assume the repository has already reached the target
    architecture.
-   Do not tell me to modify code you have not seen when its current
    contents could affect the implementation.

### When information is missing

Before implementing, determine the **minimum repository information**
required to proceed safely.

If files are needed, provide a concise **What I need from you** list
with:

-   exact file paths
-   why each is needed
-   whether the entire file or a section is enough
-   exact terminal commands when command output is more useful than a
    file

Prefer a small structural command first when appropriate, for example:

``` sh
find src -maxdepth 3 -type f | sort
```

Do not request the entire repository. Do not request docs already
covered by the attached pack. Use this master context, the supplied
ticket, and section 1 evidence for baseline architecture.

If a file does not yet exist and the ticket requires creating it, do not
ask for it -- state that we will create it.

### Authority hierarchy

When sources disagree, use this order:

1.  Current repository contents supplied in the conversation
2.  Current ticket and its acceptance criteria
3.  Running backend `/openapi.json` behavior, when relevant (drift vs
    checked-in contract)
4.  Checked-in `docs/technical-reference/openapi.json` for paths,
    methods, status codes, and schemas
5.  `docs/technical-reference/API-for-FE.md` for behavioral guidance
    OpenAPI does not fully express
6.  This master context
7.  Older or planned architecture in other documentation

If the repository differs from the target architecture, explain the
discrepancy rather than silently forcing the planned structure onto the
current codebase.

------------------------------------------------------------------------

## 2. Engineer skill level and working style

I am a **junior software engineer** working under senior guidance.

Give me:

-   complete, copy/pasteable code
-   exact file paths
-   explicit addition/replacement instructions
-   complete files when creating new files
-   explicit terminal commands
-   expected results after important steps
-   manageable implementation steps

Do not say "update the component accordingly." Tell me exactly what to
change.

For each meaningful step, explain:

1.  What we are changing.
2.  Why it belongs there.
3.  How it fits the architecture.
4.  What problem it solves.
5.  Important React, TypeScript, API, testing, browser, or accessibility
    concepts involved.
6.  How we will verify it.

Prefer: **what we're doing -\> why -\> exact code -\> what it does -\>
how we test it.**

Do not bury implementation under unnecessary theory. Do not silently
make architectural decisions that materially affect the project. If
multiple approaches are reasonable, explain the tradeoff and recommend
one.

At the point where design comes into question, stop and ask for design
notes (`docs/product-docs/UI_DESIGN_NOTES.MD`).

------------------------------------------------------------------------

## 3. Project one-pager

**Repository:** `shade-frontend`

**Purpose:** Browser UI for the Shade home-library FastAPI backend.

**Stack:** React 19, TypeScript 6 (strict), Vite 8, React Router 7
(`react-router-dom`), TanStack React Query 5 (`QueryClientProvider`
under `AppProviders` with configured client defaults,
books/loans/shelves/dashboard hooks including infinite-list pagination,
and mutation detail-cache writes), `openapi-typescript` for generated
types, `@zxing/browser` + `@zxing/library` (camera ISBN decode;
lazy-loaded from `/books/new` and `/checkout`), Yarn 4 (`yarn@4.18.0`
via Corepack), Node.js 26.7.0, ESLint (flat), Vitest, Testing Library,
jsdom, Playwright (`@playwright/test` + `@axe-core/playwright`;
`yarn test:e2e`; included in `make check`), Vitest V8 coverage with
enforced global floors (statements 87%, branches 80%, functions 92%,
lines 87%), Make. Native ESM (`"type": "module"`). No Next.js,
Tailwind, component library, or form library.

**Backend:** Separate project. Authoritative for API behavior. Default
local base: `http://127.0.0.1:8000` (no `/api` prefix). In-repo
contract: `docs/technical-reference/openapi.json` (schemas) plus
`docs/technical-reference/API-for-FE.md` (behavior). Live OpenAPI:
`/docs` and `/openapi.json` on the running API.

**Known baseline (as of 2026-08-17 -- verify before editing):**

-   MVP product UI is shipped: application shell and shared primitives;
    runtime config and build-time Bearer auth; typed OpenAPI + React Query
    server state; book create with ISBN lookup and camera/hardware
    scanning; checkout (with Find-by-ISBN via `useBooks({ isbn })`),
    check-in and loan history; reading flows; edit/delete/restore/backup;
    About homepage at `/` with dashboard metrics at `/dashboard`;
    diagnostics; shelves catalog CRUD; infinite scroll on
    `/books` and `/loans`; API contract sync (regenerated OpenAPI types
    for wishlist / dashboard-report paths; `booksApi` / query keys for
    `author` / `title` / `category`; collection `sortBy=shelf`; checkout
    `412` `display_only` refetch/messaging -- no alternate-copy offers,
    wishlist, or incomplete-metadata product UI). Shelves: `GET` /
    `POST` / `PATCH` / `DELETE /shelves` via `shelvesApi` (`list` /
    `create` / `update` / `remove`) and `useShelves` / `useCreateShelf` /
    `useUpdateShelf` / `useDeleteShelf`; book payloads use `shelf_name`
    (string; old `Shelf` enum removed); `/shelves` create/edit/delete UI
    with system-shelf protection (`unknown` / `removed` cannot be renamed
    or deleted; metadata edits allowed); Add/Edit Book shelf pickers fed
    by the API (`shelf_id` in memory, Title Case `common_name` labels,
    submit `shelf_name`; `unknown` allowed; `removed` excluded except
    edit may surface current `removed` membership; create requires an
    explicit shelf; Add/Edit Book block the page when shelves fail to
    load). Loan helpers (`loansApi.list({ bookId })`, `loansApi.get` /
    `useLoan`, Check In deep-link, `booksApi.list({ isbn })` /
    `useBooks({ isbn })`) remain in place. Remaining tickets are
    `FEAT-18` through `FEAT-21` under `docs/tickets/`. FEAT-13
    workflow and accessibility testing, FEAT-14 CI packaging, FEAT-15
    Podman deployed development, FEAT-16 versioned release artifacts,
    and FEAT-17 About homepage are complete (those ticket files are
    removed). Prefer ticket presence under `docs/tickets/` over
    `docs/ToDo.md` when judging what is still open.
-   Optional runtime-configured diagnostic reporting lives in
    `src/diagnostics/diagnosticReporter.ts`
    (`createDiagnosticReporter` from `RuntimeConfig.diagnostics` +
    `APP_VERSION` from `package.json` `version`), wired through
    `RootErrorBoundary` (render failures), `AppProviders`,
    `ConnectionProvider`, and `apiClient` `onRequestFailure` (API
    failures). Payloads are allowlisted/redacted via
    `assertSafeApiDiagnostic`; `public/config.js` defaults diagnostics
    to `enabled: false` / `endpoint: null` so reporting can be enabled
    or retargeted without rebuilding. Correlation IDs remain unset
    unless the backend supplies a documented safe source. Do not invent
    a second telemetry transport or fabricate correlation IDs.
-   Cross-route accessibility/responsive hardening: route changes update
    the document title and focus the page heading (including
    create/checkout/check-in `h1` `tabIndex={-1}`); skip-link, visible
    focus, field-linked errors, dialog focus trapping/restoration,
    no-color-only status, reduced-motion behavior, 320px layout, and
    long-content wrapping (`overflow-wrap: anywhere` / `min-width: 0` in
    `components.css`) were audited/hardened. Firefox desktop manual
    smoke passed at mobile/tablet/desktop widths. Additional Edge/Safari
    verification is documented as pending/unavailable rather than
    assumed to pass; Chrome was not tested locally; iOS/Android are
    blocked -- see `docs/baselines/FEAT-12_browser-support.md`.
-   Performance re-check: the 2,000-book typed-helper fixture completed
    in 6 ms and the 50-book paginated slice in 2 ms against the 250 ms
    practical budget. Production main JS measured 429.15 kB raw /
    124.98 kB gzip, above the 120 kB gzip soft-warning threshold but
    below the 150 kB hard-failure budget. Scanner code remains isolated
    in its lazy-loaded 481.64 kB / 126.53 kB gzip chunk. FEAT-14 shipped
    main-entry gzip enforcement via `scripts/checkBundleSize.mjs`
    (`yarn bundle:check` / `make bundle-check`, included in
    `make check`): warn above 120 kB, fail above 150 kB. Do not invent a
    second bundle-budget tool.
-   Live contract smoke compared the representative running backend
    OpenAPI with `docs/technical-reference/openapi.json`; path/schema
    sets matched and canonical JSON had no diff. The running API did not
    expose a documented request/correlation-ID header, so the frontend
    must not fabricate one.
-   Production-host ownership is documented in `README.md` and
    `docs/MAINTAINERS.md`: the frontend owns runtime config, safe
    diagnostics, and client behavior; the backend owns auth/CORS; the
    deployment environment owns HTTPS, TLS, restrictive CSP,
    HSTS/security headers, SPA fallback, production runtime-config
    serving, installation, and rollback. FEAT-16 shipped the versioned
    tarball and documented that handoff in `README.md`. Do not
    reimplement Ansible, systemd, or TLS in this repository.
-   FEAT-13 workflow and accessibility testing is complete. The quality
    gate now includes lint, strict type checking, generated OpenAPI
    drift checking (`yarn api:check`), the Vitest suite with enforced
    global coverage thresholds, Playwright browser journeys, automated
    axe accessibility checks, the production build, and main-entry
    bundle-size enforcement. `yarn test:e2e` remains available for
    targeted browser runs, and `make check` is the authoritative full
    local and CI gate. The completed Playwright baseline uses the
    existing `e2e/` support architecture, including the shared stateful
    mock API and axe helper; do not invent a parallel fake-API stack.
    Browser journeys cover manual book creation and the book lifecycle,
    including checkout, check-in, mark-read, delete, and restore through
    their dedicated endpoints. Automated accessibility coverage
    exercises critical application routes and administrative/check-in
    surfaces. The documented coverage thresholds are enforced rather
    than treated as advisory (statements 87%, branches 80%, functions
    92%, lines 87%). See `docs/baselines/FEAT-13_testing.md` for the
    completed testing baseline.
-   FEAT-14 continuous-integration quality pipeline is complete (ticket
    file removed). Shipped `.github/workflows/check.yml` for pull
    requests and pushes to `main` (Node from `.nvmrc`, Corepack/Yarn,
    immutable install, Playwright Chromium, dummy
    `VITE_API_SECRET_KEY=test-api-token`, canonical `make check`) and
    `scripts/checkBundleSize.mjs` as described above. The default
    workflow does not retain `dist/`, coverage, Playwright reports, or
    secrets as artifacts. Host-owned HTTPS/CSP, SPA fallback, and
    production configuration notes live in `README.md` and
    `docs/MAINTAINERS.md`.
-   FEAT-15 Podman compose/dev-deployment image is complete (ticket
    file removed). Shipped `ci/Containerfile` (runtime-only
    `nginx:1.31-alpine`, HTTP 8080, copies host-built `dist/`, no
    Node/Yarn/Vite stage, no `.env` COPY), `ci/nginx.conf` (SPA
    `try_files`, no-cache `index.html` / `config.js`, long-lived
    `/assets/`), `ci/container-entrypoint.sh` (start-time `config.js`
    from `SHADE_API_BASE_URL`, `SHADE_DIAGNOSTICS_ENABLED`,
    `SHADE_DIAGNOSTICS_ENDPOINT`), `.containerignore`, and Make
    `container-build` / `container-run` / `container-stop` /
    `container-clean` (image `shade-frontend`, tags `latest` and
    `package.json` `version`). This is deployed development (Compose
    with the backend), not host Vite and not production. `README.md`
    documents the three interaction paths. FEAT-16 versioned release
    artifacts are complete (ticket file removed). Shipped
    `scripts/packRelease.ts` / Make `pack` (`ci/artifacts/shade-frontend-<version>.tar.gz`
    plus SHA-256 and manifest), inspection tests, and the production
    tarball handoff in `README.md`. Production is not another Podman
    image. FEAT-17 About homepage is complete (ticket file removed):
    `/` is `AboutPage` + `CatalogGuide`; dashboard metrics live at
    `/dashboard`. FEAT-18 through FEAT-21 remain product follow-ons.
    Do not implement those future tickets early.
-   About `/` via `AboutPage` + `CatalogGuide` (library background,
    Charles Leewright dedication, lending policy, and accessible
    card-catalog How to Use dialog with in-app workflow links). Does
    not call `GET /dashboard` or any other API.
-   Dashboard `/dashboard` via `DashboardPage` + `useDashboard` /
    `dashboardApi.get`. Displays API-provided Collection, Circulation, and
    Reading Record metrics without recalculating business totals; null
    averages render as "Not enough data"; inconsistent `read` /
    `reading.books_read` (and unread counterparts) show a contract
    warning without inventing corrected numbers. Explicit Refresh,
    offline/paused and stale refresh status, and `QueryErrorState`
    recovery. Dashboard styles live in `src/styles/components.css`.
-   Edit/delete/restore/backup: `/books/:bookId/edit` via `EditBookPage`
    + `bookEditModel` (`bookFormValuesFromBook`,
    `bookFormValuesToUpdate` minimal `BookUpdate` patch; blank ISBN -\>
    `null`; never send `status`, reading fields, or loan-driving values)
    reusing shared `BookForm` / `bookFormModel`; Field-linked `422`;
    `404` refetch; no-op rejection; deleted warning UI; success to
    detail. Soft delete via dedicated `/books/:bookId/delete`
    (`DeleteBookPage`) with `ConfirmationDialog`, `useDeleteBook` /
    `booksApi.remove`, and on-loan blocking via `status === 'on_loan'`
    or `findActiveLoan`. Detail "Delete Book" is gated the same way
    (not status alone). `/admin/deleted` via `DeletedBooksPage`
    (`useBooks({ includeDeleted: true })` filtered to non-null
    `deletion_date`; restore via `ConfirmationDialog` + `useRestoreBook`
    / `booksApi.restore`). `/admin/backup` via `BackupLibraryPage` +
    `backupApi.get` (programmatic `<a download>`, always
    `URL.revokeObjectURL`; never inspect/log/cache/upload dump
    contents). Prefer dedicated delete/restore endpoints; never simulate
    restore, checkout, check-in, or initial mark-read with generic
    `PATCH`.

-   API token: repository-root `.env` via `VITE_API_SECRET_KEY`
    (`.env.example` committed; `.env` gitignored). Vite injects it at
    dev-server and production build time. `readApiToken()` in
    `src/config/apiToken.ts` throws before the app shell mounts when
    missing or blank. No `sessionStorage`, no connection settings
    screen, and no runtime token entry.
-   Runtime config: `public/config.js` sets `window.__SHADE_CONFIG__`
    (`apiBaseUrl`, optional `diagnostics`), loaded from `index.html`
    before the app module. Application release comes from
    `package.json` `version` via `APP_VERSION` (Vite `define`), not
    runtime config. `src/config/runtimeConfig.ts` validates config and
    defaults diagnostics disabled when omitted; missing or malformed
    required config shows `RuntimeConfigScreen` instead of the app
    shell. Diagnostic config is runtime-controlled so reporting can be
    enabled/disabled or pointed at an endpoint without rebuilding the
    frontend.
-   Bootstrap when token and config are valid:

``` text
index.html
  -> /config.js (window.__SHADE_CONFIG__)
  -> src/main.tsx
       -> readApiToken() (fail fast when missing)
       -> readRuntimeConfig()
            -> fail: RuntimeConfigScreen
            -> ok: createDiagnosticReporter(runtime diagnostics + APP_VERSION)
                 -> RootErrorBoundary (reports redacted render failures)
                      -> AppProviders (shared DiagnosticReporter)
                           -> NotificationsProvider
                           -> QueryClientProvider (createQueryClient())
                           -> ConnectionProvider (createApiClient + reporter, build-time token, GET /health)
                           -> RouterProvider (src/routes/routes.tsx)
                                -> AppShell (layout) -> feature pages via Outlet
       -> src/index.css (tokens -> base -> shell -> components)
```

-   Connection state under `src/features/connection/`: types, context,
    build-time token via `connectionToken.ts`, public `GET /health`
    reachability via `connectionApi.ts` (connection error mapping
    preserved), and startup health verification in `ConnectionProvider`.
    Context exposes `release: APP_VERSION` (not runtime config).
    Statuses: `checking`, `connected`, `unauthorized`, `unreachable`. On
    `403`, show a page-level error via `QueryErrorState` /
    `formatApiQueryError`; do not clear the query cache or loop back
    into loading. Startup reachability uses public `GET /health` only;
    do not verify auth with `GET /protected`.
-   API layer (complete -- extend, do not replace):
    -   `yarn api:generate` / `yarn api:check` -\>
        `src/api/generated/openapi.ts` (do not hand-edit)
    -   `src/api/apiTypes.ts` schema aliases (`BookCreate` /
        `BookUpdate` / `BookRead` / `BookList`, lookup, loan, dashboard,
        health, version, `ShelfCreate` / `ShelfUpdate` / `ShelfRead`,
        validation/error schemas, enums). Book payloads use
        `shelf_name` (string); there is no hard-coded `Shelf` enum.
        `src/api/enumDisplay.ts` (`enumDisplayValue`)
    -   `src/api/apiCallOptions.ts` shared optional `AbortSignal`
        options for typed helpers
    -   `src/api/apiClient.ts` (`createApiClient`: Bearer, timeouts,
        AbortSignal, get/request JSON helpers, `403` via
        `onUnauthorized`; reports allowlisted/redacted request failures
        through the shared optional diagnostic reporter)
    -   `src/api/apiErrors.ts` (`ApiError` kinds including
        validation/`422` field mapping; `formatApiQueryError` for
        page-level error messages; `isUnauthorizedQueryError` for `403`
        handling; `correlationId` stays unset until the backend
        documents a safe source)
    -   `src/api/apiRedaction.ts` safe diagnostic projection (no
        headers, tokens, borrower/notes/reviews, ISBN drafts, backup
        contents, or full bodies in logs)
    -   `src/api/requestFields.ts` / `dateTime.ts` documented
        request-field picking and `YYYY-MM-DD` / UTC ISO 8601
        normalizers used by form tickets
    -   `src/api/queryKeys.ts` shared React Query keys for books (`all`,
        `list({ includeDeleted, isbn?, author?, title?, category?,
        skip?, take?, sortBy?, sortOrder? })`,
        `infiniteList({ includeDeleted, isbn?, author?, title?,
        category?, sortBy?, sortOrder?, take })`, `detail(id)`,
        `lookup(isbn)`), loans (`all`, `list(bookId?)`,
        `infiniteList({ bookId?, take })`, `detail(id)`), dashboard,
        version, and shelves (`all`, `list()` unpaginated).
        Blank/whitespace `isbn` / `author` / `title` / `category` are
        omitted from keys (trimmed when present).
    -   `src/api/api.ts` `createApi` aggregates typed helpers: `books`,
        `loans`, `shelves`, `dashboard`, `health`, `version`, `backup`,
        plus the underlying `client`. No wishlist aggregate yet
        (generated OpenAPI types include wishlist and dashboard-report
        paths; product helpers wait for FEAT-19 / FEAT-20).
    -   `booksApi`: `list` (optional `includeDeleted`, `isbn`, `author`,
        `title`, `category`, `skip`, `take`, `sortBy` including `shelf`,
        `sortOrder`; omit empty/whitespace `isbn` / `author` / `title` /
        `category`; send `skip`/`take` together when paginating),
        `create`, `lookup`, `get`, `update`, `remove`, `restore`,
        `checkout` (including documented **412**
        `Book is display only`), `checkin` (optional body), `markRead`
        (defaults to `{}`); helpers accept optional `AbortSignal` and
        serialize only documented request fields (including
        `shelf_name`)
    -   `loansApi.list` (`GET /loans`, optional `bookId` -\>
        `?book_id=...`, optional `skip`/`take` together; omit empty/
        `undefined` `bookId` and omitted pagination params),
        `loansApi.get(id)` (`GET /loans/{id}`)
    -   `shelvesApi.list` (`GET /shelves`) returns a plain `ShelfRead[]`
        array (no pagination); `create` (`POST` -\> **201**), `update`
        (`PATCH` -\> **200**), and `remove` (`DELETE` -\> **204**)
        serialize only documented `ShelfCreate` / `ShelfUpdate` fields
    -   `dashboardApi.get`, `healthApi.get` (public), `versionApi.get`
        (public `GET /version`; footer API release string via
        `useVersion` -- not a health probe)
    -   `backupApi.get` returns `{ blob, filename }` for authenticated
        `/backup`, parsing UTF-8 `Content-Disposition`
        (`filename*=UTF-8''...`) with a `backup.sql` fallback when the
        header is missing or malformed
    -   Colocated helper tests cover happy paths, edge cases (lookup
        `found: false`, mark-read `{}`, omitted check-in body, `409`
        bodies, checkout `412` display-only), large-library timing, and
        `apiClient` Bearer / public / `403` / `404` / `409` / `412` /
        both `422` shapes / `5xx` / network / timeout / cancellation /
        invalid JSON / binary backup / `204`
    -   `scripts/contractSmoke.test.ts` OpenAPI path/type smoke
        (includes `/shelves`, `/shelves/{shelf_id}`, `/version`,
        wishlist and dashboard-report paths plus existing lifecycle
        routes)
-   React Query is mounted and complete for server state:
    -   `createQueryClient()` sets `staleTime` 30s,
        `refetchOnWindowFocus`, `refetchOnReconnect`, query retry that
        skips validation / auth / cancelled / invalid-response errors,
        and `mutations.retry: false`
    -   `src/api/booksQueries.ts`: `useBooks` (optional
        `{ includeDeleted, isbn, author, title, category, skip, take,
        sortBy, sortOrder, enabled }`), `useInfiniteBooks` (optional
        `{ includeDeleted, isbn, author, title, category, sortBy,
        sortOrder, enabled }`; batch size 30 via shared config),
        `useBook`, `useBookLookup`, plus mutations (including
        `useCreateBook`, `useUpdateBook`, `useDeleteBook`,
        `useRestoreBook`, `useCheckoutBook`, `useCheckinBook`, and
        `useMarkBookRead`) that write returned `BookRead` into the
        detail cache (except delete) and invalidate per PLAN.md 7.5
        (lists including `include_deleted` via `['books']` prefix,
        detail, dashboard, and loans on checkout/check-in)
    -   `src/api/loansQueries.ts` / `dashboardQueries.ts` /
        `shelvesQueries.ts`: `useLoans` (optional `{ bookId }`),
        `useInfiniteLoans` (optional `{ bookId, enabled }`; batch size
        30 via shared config), `useLoan(id)` (disabled when falsy),
        `useDashboard`, `useShelves({ enabled? })`, plus
        `useCreateShelf` / `useUpdateShelf` / `useDeleteShelf` that
        invalidate `queryKeys.shelves.all` (and books/dashboard when a
        rename includes `common_name`)
    -   Abort/stale overwrite guards are covered by colocated tests
-   Infinite scroll (complete on `/books` and `/loans` -- extend, do not
    replace):
    -   `src/features/shared/infiniteScrollConfig.ts`:
        `INFINITE_SCROLL_BATCH_SIZE` (30) and
        `INFINITE_SCROLL_PREFETCH_ROWS` (5)
    -   `src/hooks/useInfiniteScrollTrigger.ts`: shared
        `IntersectionObserver` hook for prefetching the next batch near
        the bottom of loaded rows
    -   `src/features/books/booksListModel.ts`: sort types (`author` \|
        `title` \| `creationDate` \| `shelf`), sort URL parsing/labels,
        and page flattening helper
    -   `src/features/books/components/BooksListControls.tsx`: labelled
        sort selects for `BooksPage` (includes Shelf)
    -   `src/features/loans/loansListModel.ts`: re-exports shared
        infinite-scroll constants and loan page flattening helper
-   Live product UI (do not revert to placeholders):
    -   `/` -- `AboutPage` + `CatalogGuide`: library background,
        dedication, lending policy, and accessible card-catalog-style
        How to Use dialog with in-app workflow links. Does not call
        `GET /dashboard` or any other API.
    -   `/dashboard` -- `DashboardPage` + `useDashboard`: API Collection
        / Circulation / Reading Record metrics; null averages as "Not
        enough data"; inconsistency warning without recalculation;
        Refresh plus offline/stale status; `QueryErrorState` recovery.
        Styles in `src/styles/components.css`.
    -   `/books` -- `BooksPage` via
        `useInfiniteBooks({ sortBy, sortOrder })` with URL search params
        (`sortBy`, `sortOrder` only); sort controls include Author,
        Title, Date added, and Shelf (default author ascending);
        category filter UI is deferred to FEAT-18; loading, error+retry,
        empty state linking to `/books/new`, list rows to detail with
        `enumDisplayValue`, Title Case `shelf_name` via
        `formatShelfCommonNameForDisplay`, Read/Unread state, and rating
        (`N / 5`, or an em dash when null); bottom next-page loading and
        retry affordances (infinite scroll, ratings, shelf sort)
    -   `/books/:bookId` -- `BookDetailsPage` via `useBook`; loading,
        not-found / error recovery, safe enum display, including Title
        Case `shelf_name`, `is_read`, `completion_date`, `rating`, and
        `review`; "Edit Book" links to `/books/:bookId/edit` when
        active; "Check Out" links to `/checkout?bookId=` when active
        and available (not `display_only`); "Check In" links to
        `/checkin?bookId=` when active and check-in eligible via
        `isCheckinEligible`; "Mark Read" links to
        `/books/:bookId/mark-read` when active and unread;
        "Edit Reading" links to `/books/:bookId/reading` when active and
        already read; "Delete Book" links to
        `/books/:bookId/delete` when active and not on loan
        (`status !== 'on_loan'` and no `findActiveLoan`)
    -   `/books/:bookId/edit` -- `EditBookPage` + `bookEditModel`
        (complete): metadata edit via shared
        `BookForm` + `useUpdateBook` / `booksApi.update` + `useShelves`;
        populate with `bookFormValuesFromBook` (seeds `shelfId` from
        `shelf_name`); minimal patch via `bookFormValuesToUpdate` (blank
        ISBN -\> `null`; omit unchanged `shelf_name`; never send
        `status`, reading fields, or loan-driving values); reject no-op
        submits; Field-linked `422` / **400** shelf errors; `404`
        refetch with preserved form input; in-flight disable; success to
        detail; deleted-book warning UI; full-page shelves load/error
        gate before the form. Reading fields stay on mark-read / reading-edit flows.
    -   `/books/:bookId/delete` -- `DeleteBookPage` (complete):
        soft delete via `useDeleteBook` / `booksApi.remove` with
        `ConfirmationDialog`; blocks when `status === 'on_loan'` or
        `findActiveLoan` is present; soft-deleted / not-found /
        loan-status error recovery; success navigates away from the
        deleted detail. Never simulate delete with generic `PATCH`.
    -   `/books/:bookId/mark-read` -- `MarkReadPage` + `markReadModel`
        (complete): initial unread-to-read via
        `useMarkBookRead` / `booksApi.markRead` / `pickMarkReadRequest`;
        optional date-only completion date, rating 1-5, and review; omit
        blanks; `ConfirmationDialog` before mutate; Field-linked `422`;
        `404` refetch with preserved form input; in-flight disable;
        success navigates to detail. Active unread books only; deleted /
        already-read warning UI. Never simulate this transition with
        generic `PATCH`.
    -   `/books/:bookId/reading` -- `ReadingEditPage` +
        `readingEditModel` (complete): later reading-field
        edits via `useUpdateBook` / `booksApi.update` /
        `pickBookUpdate`; populate from `BookRead`; send only changed
        `completion_date` / `rating` / `review` (blank -\> `null`);
        reject no-op submits; `ConfirmationDialog`; Field-linked `422`;
        `404` refetch with preserved form input; success to detail.
        Active already-read books only; deleted / unread warning UI.
        Does not offer mark-unread.
    -   `/books/new` -- `NewBookPage` + shared `BookForm` /
        `bookFormDefaults` / `bookFormModel`; loads `useShelves` first
        (loading / full-page `QueryErrorState` without mounting
        `BookForm` on failure); optional ISBN lookup via `useBookLookup`
        (checksum-gated; apply draft without overwriting the typed ISBN;
        progress/cancel/retry and manual fallback); creates via
        `useCreateBook`; maps create `422` `shelf_name` and **400**
        shelf errors into the form summary; disables controls while
        pending; navigates to new detail on success.
        Camera and hardware scanner capture hands one ISBN into the same
        lookup path (never calls `POST /books` from scanner success).
    -   `/checkout` -- `CheckoutPage` + `checkoutModel`
        (`checkoutFormValuesToRequest`, borrower blank/255 validation,
        omit blank optionals, UTC ISO `checked_out_at` / date-only
        `due_at`); eligible books only (`deletion_date === null` and
        `status === 'available'`); `?bookId=` deep-link with refresh
        path; `ConfirmationDialog` before mutate; Field-linked `422`
        summaries; `404`/`409`/`412` stale-state refetch (books + loans)
        with preserved form input (`412` surfaces `Book is display only`
        and points at Find by ISBN for another copy); success navigates
        to detail. Wired to existing `useCheckoutBook` /
        `booksApi.checkout` / `pickCheckoutRequest`. Soft-deleted /
        non-`available` books (including `display_only`) are not
        offered. Detail "Check Out" when active and available (not
        `display_only`). Find-by-ISBN (typed, camera, hardware wedge)
        queries `useBooks({ isbn })` / `GET /books?isbn=` (compact
        punctuation only via `compactIsbnForListFilter`; checksum-gated;
        never `GET /books/lookup` or digit rewriting), filters to
        checkout-eligible books, auto-selects a single match, offers a
        short chooser for multiples, and explains zero / ineligible
        results without clearing borrower fields. Scanner modules are
        lazy-loaded here as on `/books/new` (never checkout or create
        from scan success). Leave alternate-copy offer UX to FEAT-21.
    -   `/checkin` -- `CheckinPage` + `checkinModel` +
        `checkinEligibility` (complete): `?bookId=` deep-link
        via `useBook` + `useLoans({ bookId })`; without `bookId`, lists
        eligible books via `useBooks` + `isCheckinEligible`; shows
        borrower / checked-out from `findActiveLoan`; blank return time
        omits body / supplied values as UTC ISO 8601;
        `ConfirmationDialog` before mutate; Field-linked `422`;
        documented `409` detail messaging (`Book is not checked out`);
        in-flight disable via `useCheckinBook`; success navigates to
        detail; soft-deleted / non-eligible warning UI; `404`/`409`
        refetch with preserved return-time input.
    -   `/loans` -- `LoansPage` + `loanTemporal` (infinite
        scroll, complete): `useInfiniteLoans()` plus unpaginated
        `useBooks()` joins; active vs returned sections from
        `returned_at` nullability; due/overdue labels via
        `getLoanDueState` / `displayLoanDate`; durable `Book {id}`
        fallback when the book is missing; empty / loading / retryable
        error states; bottom next-page loading and retry affordances;
        explicit empty active and returned sections.
    -   `/shelves` -- `ShelvesPage` + `shelfDisplay` / `shelfFormModel`
        (complete): catalog via `useShelves` with create /
        edit / delete through `useCreateShelf` / `useUpdateShelf` /
        `useDeleteShelf`; Title Case names; system-shelf labelling and
        protection for `unknown` / `removed` (no rename/delete; metadata
        edits allowed); `ConfirmationDialog` for delete; Field-linked
        **422** plus **400** / **404** / **409** mapping; loading /
        `QueryErrorState` / empty states. Book forms do not create or
        edit shelves.
    -   `/admin/deleted` -- `DeletedBooksPage` (complete):
        `useBooks({ includeDeleted: true })` filtered to non-null
        `deletion_date`; restore via `ConfirmationDialog` +
        `useRestoreBook` / `booksApi.restore`; empty / loading /
        retryable error states; `404`/`409` restore messaging with
        refetch.
    -   `/admin/backup` -- `BackupLibraryPage` (complete):
        authenticated SQL download via `backupApi.get` through
        `useConnection().apiClient`; programmatic `<a download>` with
        always-`URL.revokeObjectURL`; documented `403` / generation
        `500` / network failure messaging; never inspect, log, cache, or
        upload dump contents.
-   Reading form models (complete -- extend, do not replace):
    -   `markReadModel.ts`: defaults, client validation (date-only
        completion date, rating 1-5), and `markReadFormValuesToRequest`
        via `pickMarkReadRequest`; colocated unit tests
    -   `readingEditModel.ts`: `readingEditFormValuesFromBook`,
        `readingEditFormValuesToRequest` via `pickBookUpdate` (changed
        fields only; blank rating/review/date -\> `null`); colocated
        unit tests
-   Edit form model (`bookEditModel`, complete --
    extend, do not replace): `bookFormValuesFromBook` (seeds `shelfId`
    from `shelf_name`), `bookFormValuesToUpdate` minimal `BookUpdate`
    patch; blank ISBN -\> `null`; omit unchanged `shelf_name`; never
    send `status`, reading fields, or loan-driving values; colocated
    unit tests.
-   Create/edit form model (`BookForm` / `bookFormDefaults` /
    `bookFormModel`): title, authors, ISBN, publisher, publication date
    as text for year-only values, pages, category, `shelfId` from
    `GET /shelves`, tags, purchase fields, notes. Create UI omits
    status/read/loan/review; create conversion always sends
    `status=available` and `is_read=false` and resolves `shelfId` -\>
    `shelf_name` (`common_name`); create defaults to empty shelf
    selection (explicit pick required, including `unknown`). Shelf
    options use Title Case labels; exclude `removed` except edit may
    surface current `removed` membership as a disabled selected option.
    No inline shelf CRUD. Edit conversion lives in `bookEditModel`.
    Client validation, Field-linked errors, error summary focus, tag
    normalization, and `formValuesToBookCreate`
    blank-optional-to-`null` conversion. Submit label is "Save Book".
    `src/features/books/utils/isbn.ts` checksum helpers plus
    `compactIsbnForListFilter` (punctuation strip only for
    `GET /books?isbn=`); used by lookup, create, scanner capture, and
    checkout ISBN Find. Colocated `BookForm.test.tsx` /
    `bookFormModel.test.ts` / `isbn.test.ts` cover gating, validation,
    conversion, and checksums.
-   Shelf helpers (complete -- extend, do not replace):
    -   `src/features/shelves/shelfDisplay.ts`: Title Case
        `formatShelfCommonNameForDisplay`, assignable-shelf helpers
        (`unknown` allowed; `removed` excluded), system-shelf
        rename/delete guards, and id-to-`common_name` lookup
    -   `src/features/shelves/shelfFormModel.ts`: create/edit form
        values, client validation, `ShelfCreate` / changed-fields
        `ShelfUpdate` conversion; colocated tests
-   ISBN scanner capture (complete -- extend, do not replace):
    -   `src/features/scanning/` module: `IsbnCameraScanner`
        (lazy-loaded from `NewBookPage` and `CheckoutPage` via
        `React.lazy` / `Suspense`), `isbnCameraCapture` helpers
        (secure-context / getUserMedia capability checks, Bookland
        EAN-13 filter, decode hints, scan timeout),
        `IsbnScannerParser` + `useHardwareIsbnScanner` (keyboard-wedge
        capture with Enter terminator, inter-key timeout, checksum via
        `isbn.ts`)
    -   Camera uses `@zxing/browser` (`BrowserMultiFormatReader`) +
        `@zxing/library`; permission requested only after the explicit
        "Scan ISBN" action; unsupported / insecure / permission /
        timeout paths keep manual ISBN entry usable
    -   Successful camera or hardware captures call the book-create
        lookup handoff on `/books/new` (fill lookup ISBN, start
        `useBookLookup`) or the Find-by-ISBN handoff on `/checkout`
        (`useBooks({ isbn })`); hardware listening is disabled while the
        camera UI is open or the related ISBN fetch is in flight
    -   Support matrix and manual device checklist:
        `docs/baselines/FEAT-06_scanner-support.md`
    -   Colocated scanning tests plus `NewBookPage` / `CheckoutPage`
        handoff tests for camera and hardware captures
-   Registered product routes (all live -- do not revert to placeholders
    or rebuild the typed client / hooks): `/`, `/books`, `/books/new`,
    `/books/:bookId`, `/books/:bookId/mark-read`,
    `/books/:bookId/reading`, `/books/:bookId/edit`,
    `/books/:bookId/delete`, `/checkout`, `/checkin`, `/loans`,
    `/shelves`, `/admin/deleted`, `/admin/backup`, and `*`
    (`NotFoundPage`). `RoutePlaceholder.tsx` remains only as an unused
    helper.
-   Shared UI under `src/components/` (Alert, AppLink, Button,
    ConfirmationDialog, EmptyState, Field, LoadingState, Notifications,
    QueryErrorState) re-exports from `src/components/index.ts`.
    `QueryErrorState` uses `formatApiQueryError`; hides Retry on `403`
    and shows `.env` / rebuild guidance for unauthorized errors. Books
    list/detail, create/edit form, shelves catalog, scanner capture,
    checkout, check-in, loan history, mark-read, reading edit,
    delete/restore admin, backup download, and dashboard already use
    these primitives.
-   CSS layers: `tokens` -\> `base` -\> `shell` -\> `components` via
    `src/index.css` (plain CSS; BEM-like component classes). Shell
    footer shows `Release` from `package.json` `version` via
    `APP_VERSION`, plus API version from public `GET /version` /
    `useVersion` when available. Long-content wrapping lives in
    `components.css`.
-   Local setup: copy `.env.example` to `.env` and set
    `VITE_API_SECRET_KEY` to match the backend `API_SECRET_KEY`; restart
    the dev server after changing `.env`. Optional same-origin proxy:
    `SHADE_API_PROXY=1 make run` (optional `SHADE_API_PROXY_TARGET`).
    The proxy forwards `/health`, `/books`, `/loans`, `/dashboard`,
    `/backup`, `/docs`, `/redoc`, and `/openapi.json` only (not
    `/shelves` or `/version`). Playwright Chromium must be installed
    once per machine (`yarn playwright install --with-deps chromium`)
    before `yarn test:e2e` / `make check`. Production build inspection:
    `scripts/productionBuildTokenInspection.test.ts` asserts `.env` is
    not copied into `dist/` or the release tarball and that
    `VITE_API_SECRET_KEY` is embedded in generated JS bundles.

Typed transport/query/redaction, browse/detail, create/lookup,
scanner capture, checkout (including Find-by-ISBN), check-in and loan
history, reading tracking (mark-read + reading edit),
edit/delete/restore/backup, API contract sync (`author` / `title` /
`category` list filters, `sortBy=shelf`, checkout `412` display-only
messaging), About homepage, dashboard, operational/browser
hardening, shelves catalog writes, and infinite scroll on `/books`
and `/loans` are done. Do not
rebuild the typed client, invent parallel hooks, or replace
`AboutPage` / `CatalogGuide` / `DashboardPage` / `NewBookPage` /
`BookForm` / `bookEditModel` /
`EditBookPage` / `DeleteBookPage` / `DeletedBooksPage` /
`BackupLibraryPage` / `isbn.ts` / `src/features/scanning/` /
`CheckoutPage` / `checkoutModel` (including ISBN Find and existing `412`
handling) / `CheckinPage` / `checkinModel` / `checkinEligibility` /
`LoansPage` / `loanTemporal` / `MarkReadPage` / `markReadModel` /
`ReadingEditPage` / `readingEditModel` / `ShelvesPage` / `shelfDisplay`
/ `shelfFormModel` / `shelvesApi` / `useShelves` / write mutations /
`useInfiniteBooks` / `useInfiniteLoans` / `useInfiniteScrollTrigger` /
`booksListModel` / `BooksListControls`. FEAT-14 CI packaging is
complete: keep `.github/workflows/check.yml` and
`scripts/checkBundleSize.mjs` in the canonical `make check` gate; do
not add secret-bearing CI artifacts. Prefer files and command output
supplied in the conversation over this snapshot when they disagree.

Typical commands:

``` sh
nvm use && corepack enable && make install
cp -n .env.example .env
# edit .env: set VITE_API_SECRET_KEY to match backend API_SECRET_KEY
yarn playwright install --with-deps chromium
make run
make check
make build
make bundle-check
make pack
yarn test:coverage
yarn test:e2e
yarn api:generate
yarn api:check
```

Do not casually replace Yarn, Make, Vitest, Playwright, or the existing
quality gate. Extend `make check` rather than replace it. Do not
introduce a second state store, component library, CSS framework, or
form library unless a ticket explicitly requires it.

------------------------------------------------------------------------

## 4. Non-negotiables

### Authentication

-   Shared Bearer token: `Authorization: Bearer <API_SECRET_KEY>`
-   No login, logout, user accounts, sessions, or roles
-   Token comes from a repository-root `.env` file via
    `VITE_API_SECRET_KEY`; Vite injects it at dev-server and production
    build time into JS bundles (`.env` stays gitignored; `.env.example`
    is committed)
-   Fail-fast bootstrap: `readApiToken()` in `src/main.tsx` throws
    before the app shell mounts when the variable is missing or blank
-   No `sessionStorage`, no connection settings screen, and no runtime
    token entry
-   Missing/invalid credentials -\> `403`; describe generically as "API
    access was rejected"
-   On `403`, show a page-level error via `QueryErrorState` /
    `formatApiQueryError`; do not clear the query cache or loop back
    into loading
-   Startup reachability uses public `GET /health` only; do not verify
    auth with `GET /protected`
-   Use public `GET /version` for the footer API release string only; do
    not treat it as a health probe
-   Never commit the token, put it in URLs, log Authorization headers,
    or send it to analytics
-   A build-time token in JS bundles is inspectable by anyone with
    device or artifact access; that is an accepted risk for this trusted
    personal deployment and is not real multi-user authentication

### Lifecycle endpoints (never simulate with generic PATCH)

  Operation       Endpoint
  --------------- ---------------------------------
  Create          `POST /books`
  Edit metadata   `PATCH /books/{id}`
  Delete          `DELETE /books/{id}`
  Restore         `POST /books/{id}/restore`
  Checkout        `POST /books/{id}/checkout`
  Check-in        `POST /books/{id}/checkin`
  Mark read       `POST /books/{id}/mark-read`
  ISBN lookup     `GET /books/lookup?isbn={isbn}`
  Backup          `GET /backup`

### Known backend limitations (frontend compensations)

-   Validate ISBN-10 check digits (backend does not do this correctly).
-   Send normalized `YYYY-MM-DD` dates and UTC ISO 8601 timestamps.
-   Do not send `null` for required DB fields (title, authors, category,
    shelf_name on create, is_read, status).
-   Load shelves from `GET /shelves` for book placement; send selected
    `common_name` as `shelf_name` (never Title Case display strings).
    Manage the catalog on `/shelves` with documented `POST` / `PATCH` /
    `DELETE` (do not invent shelf CRUD on Add/Edit Book).
-   Prevent blank title, authors, borrower, and (on create) unselected
    shelf.
-   Prevent deletion of on-loan books (backend allows it; frontend must
    not).
-   Do not use PATCH for checkout/check-in/restore/mark-read.
-   Render unknown enum values safely (`enumDisplayValue` or
    equivalent).

### Server state

Use TanStack React Query for books, book detail, loans, shelves, and
dashboard. Keep forms/scanner/dialogs local. Keep the runtime connection
state application-wide. Invalidate affected queries after mutations.
Reuse existing `useBooks` / `useInfiniteBooks` / `useBook` /
`useBookLookup` / `useCreateBook` / `useCheckoutBook` / `useCheckinBook`
/ `useMarkBookRead` / `useUpdateBook` / `useDeleteBook` /
`useRestoreBook` / `useLoans` / `useInfiniteLoans` / `useLoan` /
`useShelves` / `useCreateShelf` / `useUpdateShelf` / `useDeleteShelf` /
`useDashboard`, `queryKeys`, and mutation invalidation -- do not invent
a parallel cache stack. There is no realtime API.

### Dashboard and statistics

Display API-provided statistics. Do not recalculate business metrics in
the frontend. If an average is `null`, show something like "Not enough
data" -- do not invent zero.

### Security highlights

Never commit the API token (keep `.env` gitignored), compile it into JS
via Vite by design, put it in URLs, log Authorization headers, render
API text as HTML, or upload SQL backup contents to telemetry. SQL
backups are sensitive. Prefer `apiRedaction` helpers for any diagnostic
logging.

### Accessibility baseline

Semantic HTML, landmarks, visible focus, labels linked to errors, skip
link, focus restoration on dialogs, document title + focus to heading on
route change, no color-only status, 320px viewport, reduced motion.

FEAT-13 completed automated enforcement around that baseline:
Playwright + axe browser checks cover critical routes, and
browser-level journeys exercise representative creation and lifecycle
behavior against the shared stateful mock API. Keep these suites in
`make check`. The current Vitest global coverage floor is 87%
statements, 80% branches, 92% functions, and 87% lines; raising those
floors is fine when supported by the repository, but do not lower them
merely to make a ticket pass.

### Implementation conventions (short)

-   Strict TypeScript; avoid `any` unless an unavoidable boundary is
    documented.
-   Extensionless relative imports; single quotes; no semicolons;
    trailing commas where supported.
-   Import shared components from `src/components/index.ts`.
-   Colocate tests as `*.test.tsx` / `*.test.ts`; prefer semantic
    Testing Library queries and user-visible behavior.
-   Keep feature UI behind `src/features/*/routes/`; extend implemented
    pages rather than inventing a parallel tree. MVP product routes are
    complete -- do not revert them to placeholders. Leave diagnostics under
    `src/diagnostics/diagnosticReporter.ts` wired through
    `RootErrorBoundary` / `AppProviders` / `ConnectionProvider` /
    `apiClient` `onRequestFailure` and optional runtime config
    (`public/config.js` / `RuntimeConfig.diagnostics`); never fabricate
    correlation IDs, invent a second telemetry transport, or log
    denylisted fields. Preserve the route-heading focus, dialog,
    field-error, reduced-motion, 320px, and long-content accessibility
    baseline. Leave edit under `EditBookPage` / `bookEditModel` (minimal
    `BookUpdate` patch; blank ISBN -\> `null`; never send
    `status=on_loan`, reading fields, or loan-driving values). Leave
    delete under `DeleteBookPage` (`useDeleteBook` / `booksApi.remove`;
    block when `status === 'on_loan'` or `findActiveLoan` is present).
    Leave `/admin/deleted` under `DeletedBooksPage` and `/admin/backup`
    under `BackupLibraryPage` (programmatic `<a download>`, always
    `URL.revokeObjectURL`; do not inspect, log, cache, or upload dump
    contents). Leave About under `AboutPage` / `CatalogGuide` at `/`.
    Leave dashboard under `DashboardPage` / `useDashboard` at
    `/dashboard` (display API stats only; null averages as "Not
    enough data"). Leave reading flows under `MarkReadPage` /
    `markReadModel` / `ReadingEditPage` / `readingEditModel`. Leave
    scanner code under `src/features/scanning/` lazy-loaded from
    `/books/new` and `/checkout`. Leave checkout under `CheckoutPage` /
    `checkoutModel`,
    including ISBN Find via `useBooks({ isbn })` (not lookup) and
    existing `412` `display_only` handling. Leave check-in and loan
    history under `CheckinPage` / `checkinModel` / `checkinEligibility`
    / `LoansPage` / `loanTemporal`. Leave shelves under `ShelvesPage` /
    `shelfDisplay` / `shelfFormModel` / `shelvesApi` / `useShelves` /
    write mutations (`/shelves` owns create/edit/delete with system-shelf
    protection; book forms use API-fed pickers with `shelf_name`, never
    shelf CRUD on Add/Edit Book). Leave infinite scroll under
    `useInfiniteBooks` / `useInfiniteLoans` / `useInfiniteScrollTrigger`
    / `booksListModel` / `BooksListControls`. Preserve the completed
    FEAT-13 test architecture: existing Vitest / Testing Library /
    `renderAppTree` coverage plus Playwright `e2e/` with the shared
    stateful mock API and axe helper. Browser journeys and automated
    accessibility suites are part of `make check`; do not remove them
    from the quality gate or invent a parallel fake-API stack. FEAT-14
    CI packaging is complete: keep `.github/workflows/check.yml` and
    `scripts/checkBundleSize.mjs` in the canonical gate; do not add
    secret-bearing CI artifacts. FEAT-15 Podman is complete: keep
    `ci/Containerfile`, `ci/nginx.conf`, `ci/container-entrypoint.sh`,
    `.containerignore`, and Make `container-*` targets; do not add
    containerized Vite/HMR or a Compose file in this repo. FEAT-16
    release artifacts are complete: keep `scripts/packRelease.ts`, Make
    `pack`, gitignored `ci/artifacts/`, and the production-like host
    inspection tests; do not upload secret-bearing archives from
    default CI. Do not pull FEAT-18 through FEAT-21 product work into
    unrelated changes. Never simulate restore, checkout, check-in, or
    initial mark-read with generic `PATCH`.
-   Prefer regenerating `src/api/generated/openapi.ts` over hand-editing
    it.
-   Reuse the typed client, query keys, mutation invalidation,
    and redaction helpers; do not invent a parallel transport or cache
    stack.

------------------------------------------------------------------------

## 5. Scope (short)

**In scope for MVP:** dashboard, active books, detail,
manual/ISBN/camera/scanner add flows, edit, checkout, check-in, loan
history, shelves catalog, reading tracking, soft delete/restore, deleted
admin, authenticated SQL backup, runtime API config, CI, Podman preview,
versioned production artifacts, and About homepage with the dashboard at
`/dashboard`. Ticketed follow-ons (implement only when working that
ticket): collection category filter UI (FEAT-18), wishlists (FEAT-19),
dashboard reports / incomplete metadata (FEAT-20), display-only
alternate-copy checkout UX (FEAT-21).

**Out of scope unless explicitly requested:** UPC, true multi-library
tenancy, cover images, overdue notifications, Goodreads/StoryGraph, user
accounts/roles, realtime sync, loan CRUD, mark-unread, remote
Ansible/systemd/TLS/rollback orchestration. Collection browse
(`BooksPage`) and loan history (`LoansPage`) use infinite scroll with
backend pagination; other callers still fetch unpaginated full lists
when needed.

Do not expand a ticket into out-of-scope features. Do not implement
future tickets prematurely.

FEAT-13 workflow and accessibility tests, FEAT-14 CI packaging,
FEAT-15 Podman deployed development, FEAT-16 versioned release
artifacts, and FEAT-17 About homepage are complete. Remaining tickets
begin with `FEAT-18` and continue through `FEAT-21` under
`docs/tickets/`. When no current ticket is supplied, do not guess which
remaining ticket to implement; ask for the next ticket.
The supplied ticket's acceptance criteria are authoritative unless they
contradict the backend contract or established architecture.

------------------------------------------------------------------------

## 6. Condensed inventory (known paths)

Use this when deciding what to ask for or create. Verify against the
repo before editing.

  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  Area          Paths
  ------------- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  Entry /       `index.html`, `public/config.js`, `src/main.tsx`, `src/AppProviders.tsx`, `src/RootErrorBoundary.tsx`
  bootstrap     

  Runtime       `src/config/appVersion.ts` (`APP_VERSION` from
  config        `package.json`), `runtimeConfig.ts`,
                `runtimeConfigState.ts`, `RuntimeConfigScreen.tsx`,
                `apiToken.ts`; runtime config includes optional
                diagnostics (no runtime `release` field)

  API           `src/api/generated/openapi.ts`, `apiTypes.ts`, `enumDisplay.ts`, `apiCallOptions.ts`, `apiClient.ts`, `apiErrors.ts`, `apiRedaction.ts`, `requestFields.ts`, `dateTime.ts`, `queryKeys.ts`, `api.ts`, `booksApi.ts`,
                `loansApi.ts`, `shelvesApi.ts`, `dashboardApi.ts`, `healthApi.ts`, `versionApi.ts`, `versionQueries.ts`, `backupApi.ts`, `queryClient.ts`, `booksQueries.ts`, `loansQueries.ts`, `shelvesQueries.ts`, `dashboardQueries.ts`

  Diagnostics   `src/diagnostics/diagnosticReporter.ts` plus `RootErrorBoundary`, `AppProviders`, `ConnectionProvider`, and `apiClient` integration

  Connection    `src/features/connection/*` (provider, build-time token, health reachability)

  Infinite      `src/features/shared/infiniteScrollConfig.ts`, `src/hooks/useInfiniteScrollTrigger.ts`
  scroll        

  Routing /     `src/routes/*`, `src/layout/AppShell.tsx` (brand includes
  shell         "est. 2026"; primary nav includes Shelves; footer shows
                `Release ${APP_VERSION}` plus API version from
                `useVersion` / `GET /version` when available)

  Feature       `src/features/{about,dashboard,books,loans,shelves,connection,scanning,shared}/` (scanning is a feature module, not a top-level route)
  routes        

  Books UI      `src/features/books/routes/{BooksPage,BookDetailsPage,NewBookPage,EditBookPage,bookEditModel,DeleteBookPage,DeletedBooksPage,BackupLibraryPage,MarkReadPage,markReadModel,ReadingEditPage,readingEditModel}.{tsx,ts}`,
                `src/features/books/components/{BookForm,bookFormDefaults,bookFormModel,BooksListControls}.{tsx,ts}`, `src/features/books/booksListModel.ts` (sort: `author` \| `title` \| `creationDate` \| `shelf`),
                `src/features/books/utils/isbn.ts` (`compactIsbnForListFilter` for list ISBN Find)

  Shelves UI    `src/features/shelves/routes/ShelvesPage.tsx`, `shelfDisplay.ts`, `shelfFormModel.ts` (catalog CRUD complete)

  About UI      `src/features/about/routes/AboutPage.tsx`, `src/features/about/components/CatalogGuide.tsx` (`/` homepage)

  Dashboard UI  `src/features/dashboard/routes/DashboardPage.tsx` (`/dashboard`)

  Loans UI      `src/features/loans/routes/CheckoutPage.tsx`, `checkoutModel.ts` (Find-by-ISBN + `412` display-only complete); `CheckinPage.tsx`, `checkinModel.ts`, `checkinEligibility.ts`, `LoansPage.tsx`,
                `loanTemporal.ts`, `loansListModel.ts` (infinite scroll complete)

  Scanning      `src/features/scanning/{IsbnCameraScanner,isbnCameraCapture,isbnScannerParser,useHardwareIsbnScanner}.{tsx,ts}` (lazy camera from `NewBookPage` and `CheckoutPage`)

  Shared UI     `src/components/*` (import via `index.ts`; includes `QueryErrorState`)

  Styles        `src/index.css`, `src/styles/{tokens,base,shell,components}.css` (dashboard classes and
                long-content wrap in `components.css`)

  Tests helpers `src/test/setup.ts`, `src/test/renderAppTree.tsx` (includes diagnostic reporter)

  Browser e2e   `playwright.config.ts`, `e2e/{accessibility,book.creation,dashboard.smoke,library.lifecycle}.spec.ts`, `e2e/support/{mockApi,accessibility}.ts` (FEAT-13 complete; `yarn test:e2e`; included in `make check`)

  Tooling       `package.json`, `Makefile`, `vite.config.ts`, `eslint.config.js`, `tsconfig*.json`, `.env.example`,
                `.github/workflows/check.yml`, `scripts/checkBundleSize.mjs`, `scripts/packRelease.ts`,
                `ci/{Containerfile,nginx.conf,container-entrypoint.sh}`, `.containerignore`
                (FEAT-15 image `shade-frontend`; FEAT-16 `make pack` tarball)

  Baselines /   `docs/baselines/FEAT-06_scanner-support.md`, `docs/baselines/FEAT-12_browser-support.md`,
  smoke         `docs/baselines/FEAT-13_testing.md`, `scripts/contractSmoke.test.ts` 
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Feature route ownership (all complete unless noted): books list/detail;
infinite scroll on `/books` and `/loans`; new book create/lookup; ISBN
scanner capture; checkout including Find-by-ISBN; check-in/loans;
reading tracking (`MarkReadPage` / `markReadModel` /
`ReadingEditPage` / `readingEditModel`); edit/delete/restore/backup
(`EditBookPage` / `bookEditModel` / `DeleteBookPage` /
`DeletedBooksPage` / `BackupLibraryPage`); API contract sync (list
filters, shelf sort, checkout `412`); About `/` (`AboutPage` +
`CatalogGuide`); dashboard `/dashboard` (`DashboardPage`);
operational/browser hardening (runtime diagnostics, cross-route
accessibility/responsive hardening, browser-support documentation,
performance/contract re-check, and production-host security ownership
notes); shelves catalog (`ShelvesPage` / `shelfDisplay` /
`shelfFormModel`); FEAT-13 workflow/accessibility quality-gate coverage
(Vitest coverage thresholds, Playwright journeys, axe checks, and
`make check` integration); FEAT-14 CI packaging (`.github/workflows/check.yml`
and `scripts/checkBundleSize.mjs`); FEAT-15 Podman deployed-development
image (`ci/Containerfile`, Make `container-*` targets); FEAT-16
versioned release tarball (`scripts/packRelease.ts`, Make `pack`);
FEAT-17 About homepage (`AboutPage` at `/`, dashboard at `/dashboard`).
Remaining tickets begin with FEAT-18 (collection category filter UI).
Later product tickets: FEAT-19 wishlists, FEAT-20 dashboard reports,
FEAT-21 display-only alternate-copy UX.

------------------------------------------------------------------------

## 7. Ticket implementation procedure

When I provide a feature ticket:

1.  **Understand** -- prerequisites, architecture dependencies, API
    endpoints, tests, acceptance criteria, contradictions, or blockers.
2.  **Inspect** -- request only the minimum current files or command
    output needed (see section 1).
3.  **Plan** -- briefly: what we implement, files involved, why,
    decisions, anything that must be created first.
4.  **Implement incrementally** -- for each meaningful step: purpose,
    exact path, full new-file contents or explicit edits, important code
    explained, how to verify.
5.  **Test** -- unit/component tests, API mocks, accessibility, or
    browser tests as appropriate; prefer user-visible behavior.
6.  **Verify** -- `make check` at milestones; targeted tests while
    iterating. Compiling is not "done."
7.  **Acceptance** -- walk every criterion:

``` text
[X] Criterion satisfied -- explanation
[ ] Intentionally deferred -- reason
```

Identify remaining work and blockers.

### Do not invent backend behavior

If desired behavior is missing from the API: compensate only when
reasonable; never fake lifecycle with PATCH; identify a backend blocker
when necessary. Prefer `docs/technical-reference/openapi.json`,
`docs/technical-reference/API-for-FE.md`, and a running backend
`/openapi.json` over assumptions.

------------------------------------------------------------------------

## 8. Document index (attach on demand)

  -----------------------------------------------------------------------------
  Need                            Document
  ------------------------------- ---------------------------------------------
  API paths, methods, status      `docs/technical-reference/openapi.json`
  codes, schemas, enums           

  API behavior (auth, CORS,       `docs/technical-reference/API-for-FE.md`
  lifecycle, ISBN, backup, FE     
  ownership)                      

  Architecture / workstreams /    `docs/product-docs/PLAN.md`
  release intent                  

  Product requirements (source)   `docs/product-docs/PRODUCT_REQS.V1.md`,
                                  `docs/product-docs/PRODUCT_REQS.V2.*.md`

  Feature tickets                 Remaining current tickets under
                                  `docs/tickets/`: `FEAT-18_...` through
                                  `FEAT-21_...`; FEAT-13 through FEAT-17
                                  are complete (those ticket files are
                                  removed)

  Bundle budget / CI              Recorded in this master context.
                                  `scripts/checkBundleSize.mjs` (warn
                                  120 kB gzip, fail 150 kB).
                                  `.github/workflows/check.yml` runs
                                  `make check` (FEAT-14 complete)

  Scanner support matrix / manual `docs/baselines/FEAT-06_scanner-support.md`
  device checklist                

  Browser support / manual smoke  `docs/baselines/FEAT-12_browser-support.md`

  Workflow / accessibility tests  `docs/baselines/FEAT-13_testing.md`

  UI / design decisions           `docs/product-docs/UI_DESIGN_NOTES.MD`

  Human maintainers notes         `docs/MAINTAINERS.md`
  (optional; not required to      
  start)                          

  Build checklist                 `docs/ToDo.md` (may lag)

  Environment / setup             `README.md`, `.env.example`
  -----------------------------------------------------------------------------

Request a listed document only when its contents are necessary for the
current ticket and are not already attached. This master context is
self-contained for operating rules, non-negotiables, and the dated
baseline. Do not treat another project prompt or agents guide as
required reading.

------------------------------------------------------------------------

## 9. Final working principle

Build the Shade frontend correctly, incrementally, and in a way I
understand.

Be explicit, practical, incremental, honest about what you can and
cannot see, conservative about architecture, respectful of the backend
contract, and focused on the current ticket.

Use complete code. Explain the why. Do not invent requirements. Do not
implement future tickets early. When information is missing, ask for the
minimum specific repository evidence needed. When something is
ambiguous, explain the ambiguity rather than guessing silently.
