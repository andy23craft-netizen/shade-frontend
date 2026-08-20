# Shade Frontend -- Master Implementation Context

Slim always-on prompt for ChatGPT (or any chat without automatic
repository access).

This document is the complete always-on operating context for those
chats. It stands on its own for operating rules, non-negotiables, and
the dated codebase baseline. Start from this file alone. Do not treat
`docs/AGENTS.md` (or any other agents guide) as required reading -- this
pack does not depend on it. Attach the on-demand docs listed in section 8
only when the current ticket needs them; do not re-synthesize those
sources here. A user's explicit request takes precedence over general
guidance here.

Source of truth for API schemas, behavioral API notes, product
requirements, and plans lives in the docs listed in section 8.

Context pack version: 2026-08-20. Refresh this prompt when operating
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
  - this master context (capture modes, camera/hardware support, and the manual device checklist)

If test/workflow/accessibility baseline behavior is relevant:
  - this master context (coverage floors, Playwright scope, and manual-gate ownership)
  - preserve the existing Vitest / Testing Library / renderAppTree and Playwright e2e architecture;
    do not invent a parallel fake-API stack

If Podman (FEAT-15 complete) or release artifacts (FEAT-16 complete):
  - README.md (local development, deployed-development image, deployed-production tarball)

If browser-support or production-host security baselines are needed:
  - this master context (evergreen smoke matrix and blocker policy)
  - README.md / docs/MAINTAINERS.md for the documented production-host security boundary
  - bundle-budget and CI facts in this master context (FEAT-14 complete)

If later product tickets (FEAT-26 through FEAT-27):
  - the current ticket
  - docs/technical-reference/openapi.json and API-for-FE.md when the ticket touches new API surfaces
  - docs/product-docs/UI_DESIGN_NOTES.MD when layout or visual design is in question

Do not paste PRODUCT_REQS.* or a re-synthesized API dump by default. Prefer the checked-in OpenAPI file over
paraphrasing schemas into chat.
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
lazy-loaded from `/books/new` only), hardware collection ISBN jump via
`useCollectionIsbnJump` on `/dashboard`, `/books`, and `/loans`, Yarn 4
(`yarn@4.18.0` via Corepack), Node.js 26.7.0, ESLint (flat), Vitest,
Testing Library, jsdom, Playwright (`@playwright/test` +
`@axe-core/playwright`; `yarn test:e2e`; included in `make check`),
Vitest V8 coverage with enforced global floors (statements 87%, branches
80%, functions 92%, lines 87%), Make. Native ESM (`"type": "module"`).
No Next.js, Tailwind, component library, or form library.

**Backend:** Separate project. Authoritative for API behavior. Default
local base: `http://127.0.0.1:8000` (no `/api` prefix). In-repo
contract: `docs/technical-reference/openapi.json` (schemas) plus
`docs/technical-reference/API-for-FE.md` (behavior). Live OpenAPI:
`/docs` and `/openapi.json` on the running API.

**Known baseline (as of 2026-08-20 -- verify before editing):**

-   MVP product UI is shipped: application shell and shared primitives;
    runtime config and build-time Bearer auth; typed OpenAPI + React Query
    server state; book create with ISBN lookup and camera/hardware
    scanning on `/books/new`; hardware collection ISBN jump on
    `/dashboard`, `/books`, and `/loans` (`useCollectionIsbnJump`);
    checkout on book details via `CheckoutDialog` (`/checkout` is a
    compatibility redirect); check-in on `/loans` (`CheckinForm`) and
    loan history (`/checkin` is a compatibility redirect); reading
    flows; edit/delete/restore;
    About homepage at `/` with dashboard metrics at `/dashboard`;
    diagnostics; shelves catalog CRUD; infinite scroll on
    `/books` and `/loans`; API contract sync (regenerated OpenAPI types for wishlist / dashboard-report and
    Collections paths; `booksApi` / query keys for `author` / `title` /
    `category` / `isbn`, used by the `/books` collection browse UI for
    category / author / title and URL-backed `?isbn=` from hardware
    collection jump or deep link; collection
    `sortBy=shelf`; checkout `412` `display_only` refetch/messaging on
    `CheckoutDialog` without alternate-copy offers). Dashboard reports on `/dashboard`: summary
    plus breakdowns and incomplete-metadata healing
    (`dashboardApi`, `useDashboardBreakdowns`, `useDashboardIncompleteMetadata`, `useInfiniteIncompleteMetadataBooks`;
    Basic Stats and Healing Metadata drawers). Wishlists: `/wishlists` via Collection drawer;
    memberships join catalog with `GET /books/{id}` (not `GET /books`);
    add creates an unshelved catalog row (`POST /books` omitting
    `shelf_name`) then `POST /wishlists/{id}/books`; **412** shelf/
    wishlist exclusivity. Shelves: `GET` /
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
    `useLoan`, Check In on `/loans?bookId=`) remain in place.
    `booksApi.list({ isbn })` / `useInfiniteBooks({ isbn })` power the
    collection ISBN filter and collection jump (checkout no longer uses
    them). Remaining tickets are `FEAT-26` through `FEAT-27` under
    `docs/tickets/`. FEAT-13 workflow and accessibility testing, FEAT-14 CI packaging, FEAT-15 Podman deployed
    development, FEAT-16 versioned release artifacts, FEAT-17 About homepage, FEAT-18 collection category / author /
    title filters, FEAT-19 wishlists, FEAT-20 dashboard reports, FEAT-21 display-only checkout alternate-copy UX,
    FEAT-22 check-in consolidation onto `/loans`, FEAT-23 checkout consolidation onto book details, FEAT-24
    hardware ISBN scan on Dashboard / Books / Loans, and FEAT-25 remove browser backup page are complete (those
    ticket files are removed).
    Prefer ticket presence under `docs/tickets/` over `docs/ToDo.md` when judging what is still open. Prefer dedicated
    lifecycle endpoints; never simulate restore, checkout, check-in, or initial mark-read with generic `PATCH`. Do not
    invent undocumented routes, realtime channels, or lifecycle shortcuts.
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
    create/detail/loans `h1` `tabIndex={-1}`); skip-link, visible
    focus, field-linked errors, dialog focus trapping/restoration,
    no-color-only status, reduced-motion behavior, 320px layout, and
    long-content wrapping (`overflow-wrap: anywhere` / `min-width: 0` in
    `components.css`) were audited/hardened. Firefox desktop manual
    smoke passed at mobile/tablet/desktop widths. Additional Edge/Safari
    verification is documented as pending/unavailable rather than
    assumed to pass; Chrome was not tested locally; iOS/Android are
    blocked. Unavailable environments are recorded rather than assumed
    to pass; browser-specific failures before release are blockers.
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
    exercises books list, add book, book detail, and loans
    (`e2e/accessibility.spec.ts`). Automated axe supplements keyboard,
    responsive-layout, and assistive-technology review; it does not
    replace them. The documented coverage thresholds are enforced rather
    than treated as advisory (statements 87%, branches 80%, functions
    92%, lines 87%). A change is release-ready when `make check` passes,
    coverage stays above those floors, relevant manual gates are done
    when the change affects a manual-only surface, and no known critical
    or serious accessibility regression remains.
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
    `/dashboard`; Dashboard is a direct primary-nav link and About is
    reachable via the brand link only. Primary navigation redesign
    (merged without a standalone ticket): `DrawerNavMenu` drawers for
    Collection (Browse → `/books`, Manage → `/collection/manage`,
    Wishlists → `/wishlists`) and Circulation (originally Check Out and
    Loans; FEAT-23 later left Loans only); flat About, Shelves, and
    admin/settings header links removed. Collection maintenance (Add
    Book, Shelves, Deleted Books) lives on `/collection/manage`
    (`ManageCollectionPage`). FEAT-18 collection filters and FEAT-19
    wishlists are complete (ticket files removed). FEAT-20 dashboard
    breakdowns and incomplete-metadata healing are complete (ticket file
    removed).
    FEAT-21 display-only checkout alternate-copy UX is complete (ticket file removed): it shipped
    substitutes via `isbn` and `author`+`title` list filters (`displayOnlyAlternatives` /
    `checkoutEligibility`) after a **412** or selected/deep-linked `display_only` book. FEAT-23 later
    retired `/checkout`, ISBN Find, and that alternate-copy chooser; display-only **412** still
    refetches and messages on `CheckoutDialog` without offering substitutes. FEAT-22 check-in
    consolidation onto `/loans` is complete (ticket file removed): `CheckinForm` on `LoansPage`; detail Check In
    links to `/loans?bookId=`; Circulation drawer was Check Out and Loans only at that time; `/checkin` is
    `LegacyCheckinRedirect`. FEAT-23 checkout consolidation onto book details is complete (ticket file
    removed): `CheckoutDialog` on `BookDetailsPage`; eligible "Check Out" is a button that opens the
    dialog; `/books/:bookId?checkout=1` opens it then replace-clears the search flag; Circulation
    drawer is Loans only; `/checkout` is `LegacyCheckoutRedirect` (bare path to `/books`; `?bookId=`
    to `/books/{id}?checkout=1`); borrower and notes only (`checked_out_at` / `due_at` computed
    client-side via `dueAtOneYearFrom`); **412** display-only does not offer alternate copies. Do not
    restore `CheckoutPage`, Circulation Check Out nav, or FEAT-21 alternate-copy offers. FEAT-24
    hardware ISBN scan on Dashboard / Books / Loans is complete (ticket file removed):
    `useCollectionIsbnJump` on `/dashboard`, `/books`, and `/loans` (hardware wedge with
    `ignoreEditableTargets` / `preventDefaultWhenConsumed`; compact via `compactIsbnForListFilter`;
    prefetch `GET /books?isbn=`; open sole match at `/books/{id}`, otherwise `/books?isbn=`);
    `BooksPage` parses URL `isbn`, shows Clear ISBN, and auto-opens a unique filtered match.
    Camera and create-path hardware remain on `/books/new` only. Playwright coverage in
    `e2e/isbn-collection-jump.spec.ts`. FEAT-25 remove browser backup page is complete (ticket file
    removed): `/admin/backup`, `BackupLibraryPage`, and `backupApi` are gone; Manage Collection links
    Add Book, Shelves, and Deleted Books only; Catalog Guide restore-deleted only; `GET /backup` remains
    an API-host concern. Remaining product follow-ons are FEAT-26 through FEAT-27.
    Do not implement those future tickets early.
-   About `/` via `AboutPage` + `CatalogGuide` (library background,
    Charles Leewright dedication, lending policy, and accessible
    card-catalog How to Use dialog with in-app workflow links). Does
    not call `GET /dashboard` or any other API. Reach About via the
    brand link; it is not a separate primary-nav item.
-   Primary navigation via `AppShell` + `DrawerNavMenu`: Dashboard
    link; Collection drawer (Browse, Manage, Wishlists); Circulation
    drawer (Loans only -- no Check Out or Check In). `/collection/manage`
    (`ManageCollectionPage`) links Add Book, Shelves, and Deleted Books only.
-   Dashboard `/dashboard` via `DashboardPage`: summary metrics (`useDashboard` / `GET /dashboard`) for Collection,
    Circulation, and Reading Record; catalog breakdowns (`useDashboardBreakdowns` / `GET /dashboard/breakdowns`);
    incomplete-metadata healing (`useDashboardIncompleteMetadata`, `useInfiniteIncompleteMetadataBooks` /
    `GET /dashboard/incomplete-metadata` and `/books`). Five card-catalog drawers (summary I--III, Basic Stats IV,
    Healing Metadata V). `useCollectionIsbnJump` for hardware wedge jump to a unique book or `/books?isbn=`.
    Display API numbers only; null averages as "Not enough data"; inconsistent read/unread
    totals show a contract warning without recalculation; do not recalculate metrics from `GET /books`. Unified Refresh
    refetches summary and report queries; offline/paused and stale status; drawer-level `QueryErrorState` recovery;
    drawer-level errors do not blank summary drawers. Basic Stats shows totals plus category and creation-year buckets
    (API `by_shelf` is not rendered). Styles in `src/styles/components.css` (`.dashboard-page`,
    `.dashboard-drawer-bank`, `.dashboard-drawer`, `.dashboard-metric`, `.dashboard-breakdowns`, `.dashboard-healing`).
-   Edit/delete/restore: `/books/:bookId/edit` via `EditBookPage`
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
    / `booksApi.restore`). Authenticated SQL dumps (`GET /backup`) are an
    API-host concern (no SPA caller); never inspect/log/cache/upload dump
    contents. Prefer dedicated delete/restore endpoints; never simulate
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
        `BookUpdate` / `BookRead` / `BookList`, lookup, loan,
        `DashboardSummary` / `DashboardBreakdowns` / `DashboardCountBucket` /
        `DashboardIncompleteMetadata`, health, version, `ShelfCreate` /
        `ShelfUpdate` / `ShelfRead`, `WishlistCreate` / `WishlistUpdate` /
        `WishlistRead` / `WishlistList`, `WishlistBookCreate` /
        `WishlistBookRead` / `WishlistBookList` / `WishlistBookStatus`,
        validation/error schemas, enums). Book payloads use `shelf_name`
        (string); there is no hard-coded `Shelf` enum. Generated
        `openapi.ts` also includes Collections schemas; do not add
        `apiTypes` aliases or product helpers until FEAT-27.
        `src/api/enumDisplay.ts` (`enumDisplayValue`)
    -   `src/api/apiCallOptions.ts` shared optional `AbortSignal`
        options for typed helpers
    -   `src/api/apiClient.ts` (`createApiClient`: Bearer and
        `Library-Username: shade` on authenticated requests, timeouts,
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
        `infiniteList({ bookId?, take })`, `detail(id)`),
        dashboard (`all`, `breakdowns()`, `incompleteMetadata()`,
        `incompleteMetadataBooks({ field?, skip?, take? })`), version, and
        shelves (`all`, `list()` unpaginated). Wishlists: `all`, `list()`
        unpaginated, `books(wishlistId)`. Blank/whitespace `isbn` / `author`
        / `title` / `category` / incomplete-metadata `field` are omitted from
        keys (trimmed when present).
    -   `src/api/api.ts` `createApi` aggregates typed helpers: `books`,
        `loans`, `shelves`, `dashboard`, `health`, `version`,
        `wishlists`, plus the underlying `client`. Generated OpenAPI types
        also include Collections paths; product helpers for those wait for
        FEAT-27.
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
    -   `dashboardApi.get` (`GET /dashboard`); `getBreakdowns`
        (`GET /dashboard/breakdowns`); `getIncompleteMetadata`
        (`GET /dashboard/incomplete-metadata`); `listIncompleteMetadataBooks`
        (`GET /dashboard/incomplete-metadata/books`; omit blank `field`; send
        `skip`/`take` together), `healthApi.get` (public), `versionApi.get`
        (public `GET /version`; footer API release string via `useVersion` --
        not a health probe)
    -   Colocated helper tests cover happy paths, edge cases (lookup
        `found: false`, mark-read `{}`, omitted check-in body, `409`
        bodies, checkout `412` display-only), large-library timing, and
        `apiClient` Bearer / `Library-Username` / public / `403` / `404` / `409` / `412` /
        both `422` shapes / `5xx` / network / timeout / cancellation /
        invalid JSON / binary backup / `204`
    -   `scripts/contractSmoke.test.ts` OpenAPI path/type smoke
        (includes `/shelves`, `/shelves/{shelf_id}`, `/version`,
        `/backup`, wishlist paths including membership DELETE,
        Collections paths, dashboard-report paths, and existing
        lifecycle routes)
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
        `useBook`, `useBookLookup` (query), `useLookupBook` (lookup
        mutation for wishlist add), plus mutations (including
        `useCreateBook`, `useUpdateBook`, `useDeleteBook`,
        `useRestoreBook`, `useCheckoutBook`, `useCheckinBook`, and
        `useMarkBookRead`) that write returned `BookRead` into the
        detail cache (except delete) and invalidate lists (including
        `include_deleted` via `['books']` prefix), detail, dashboard,
        and loans on checkout/check-in
    -   `src/api/loansQueries.ts` / `dashboardQueries.ts` /
        `shelvesQueries.ts`: `useLoans` (optional `{ bookId, enabled }`),
        `useInfiniteLoans` (optional `{ bookId, enabled }`; batch size
        30 via shared config), `useLoan(id)` (disabled when falsy),
        `useDashboard`, `useDashboardBreakdowns`, `useDashboardIncompleteMetadata`,
        `useInfiniteIncompleteMetadataBooks({ field?, enabled? })` (batch size
        30 via shared config), `useShelves({ enabled? })`, plus
        `useCreateShelf` / `useUpdateShelf` / `useDeleteShelf` that
        invalidate `queryKeys.shelves.all` (and books/dashboard when a
        rename includes `common_name`)
    -   `src/api/wishlistsApi.ts` / `wishlistsQueries.ts`: `list` /
        `create` (**201**) / `update` / `remove` (**204**) / `listBooks` /
        `addBook`; optional `skip`/`take` together; documented fields only.
        Hooks: `useWishlists`, `useWishlistBooks` (disabled when id is
        empty), `useCreateWishlist`, `useUpdateWishlist`,
        `useDeleteWishlist`, `useAddWishlistBook`. Create/update/delete
        invalidate `queryKeys.wishlists.all`; add invalidates that
        wishlist's books key. Add-to-wishlist creates an unshelved catalog
        row (`useCreateBook`, omit `shelf_name`) then `useAddWishlistBook`.
        **412** shelf/wishlist exclusivity is surfaced honestly. OpenAPI
        already documents membership
        `DELETE /wishlists/{wishlist_id}/books/{wishlist_book_id}`; no
        `removeBook` helper until FEAT-26.
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
        `title` \| `creationDate` \| `shelf`), sort and
        category/text/ISBN-filter URL parsing (`parseIsbnParam` via
        `compactIsbnForListFilter`), labels, category filter values, and
        page flattening helper
    -   `src/features/books/components/BooksListControls.tsx`: labelled
        category / author / title filter controls plus sort selects for
        `BooksPage` (including Shelf); author/title drafts apply
        explicitly and can be cleared independently of sort state. ISBN
        filter is URL/hardware-driven (status + Clear ISBN on
        `BooksPage`), not a typed control here.
    -   `src/features/loans/loansListModel.ts`: re-exports shared
        infinite-scroll constants and loan page flattening helper
-   Live product UI (do not revert to placeholders):
    -   `/` -- `AboutPage` + `CatalogGuide`: library background,
        dedication, lending policy, and accessible card-catalog-style
        How to Use dialog with in-app workflow links. Does not call
        `GET /dashboard` or any other API.
    -   `/dashboard` -- `DashboardPage`: five card-catalog drawers (summary I--III, Basic Stats IV, Healing Metadata
        V); summary metrics via `useDashboard`; Basic Stats via `useDashboardBreakdowns` (totals plus category and
        creation-year buckets; API `by_shelf` is not rendered); Healing Metadata via `useDashboardIncompleteMetadata`
        and `useInfiniteIncompleteMetadataBooks` (per-field counts, field filter, infinite-scroll cleanup list with
        detail/edit links). `useCollectionIsbnJump` for hardware wedge jump. Display API numbers only; null averages
        as "Not enough data"; inconsistency warning without recalculation; do not recalculate metrics from
        `GET /books`. Unified Refresh refetches summary and report queries; offline/stale status; drawer-level
        `QueryErrorState` recovery; drawer-level errors do not blank summary drawers. Styles in
        `src/styles/components.css`.
    -   `/collection/manage` -- `ManageCollectionPage`: collection
        maintenance hub with links to Add Book (`/books/new`), Shelves
        (`/shelves`), and Deleted Books (`/admin/deleted`) only.
        Colocated `ManageCollectionPage.test.tsx` asserts those links
        and the absence of any Backup Library affordance.
    -   `/books` -- `BooksPage` via
        `useInfiniteBooks({ category, author, title, isbn, sortBy, sortOrder })`
        with URL-backed category / author / title / ISBN filters and sort
        (`category`, `author`, `title`, `isbn`, `sortBy`, `sortOrder`);
        `useCollectionIsbnJump` for hardware wedge navigation; sort
        controls include Author, Title, Date added, and Shelf (default
        author ascending); author/title drafts apply explicitly and can
        be cleared independently of sort; active `?isbn=` shows a polite
        Clear ISBN status; when an ISBN filter resolves to exactly one
        book, replace-navigate to detail; filtered empty state ("No
        books match these filters.") stays distinct from the unfiltered
        empty library state; loading, error+retry, unfiltered empty
        state linking to `/books/new`, list rows to detail with
        `enumDisplayValue`, Title Case `shelf_name` via
        `formatShelfCommonNameForDisplay`, Read/Unread state, and rating
        (`N / 5`, or an em dash when null); bottom next-page loading and
        retry affordances (infinite scroll, ratings, shelf sort, catalog
        filters, ISBN jump)
    -   `/books/:bookId` -- `BookDetailsPage` via `useBook`; loading,
        not-found / error recovery, safe enum display, including Title
        Case `shelf_name`, `is_read`, `completion_date`, `rating`, and
        `review`; "Edit Book" links to `/books/:bookId/edit` when
        active; "Check Out" is a button that opens `CheckoutDialog` when
        `isCheckoutEligible` (active and `available`); deep link
        `?checkout=1` opens that dialog then replace-clears the search
        flag; "Check In" links to
        `/loans?bookId=` when active and check-in eligible via
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
        lookup path (never calls `POST /books` from scanner success);
        hardware listening is disabled while the camera UI is open or
        lookup is fetching.
    -   `/checkout` -- `LegacyCheckoutRedirect` only: replace-navigates
        `/checkout?bookId=` to `/books/{id}?checkout=1` and bare
        `/checkout` to `/books`. Not a product page
        (`routeMetadata.checkout` is path-only). Product checkout is
        `CheckoutDialog` on `BookDetailsPage` (`checkoutModel`,
        `checkoutEligibility`, `useCheckoutBook`): native `<dialog>`
        with borrower and notes only (`checked_out_at` and `due_at`
        computed client-side via `dueAtOneYearFrom`); Field-linked
        `422`; `404`/`409`/`412` stale-state refetch with preserved
        borrower/notes (`412` for `display_only`, without alternate-copy
        offers); in-flight disable; success closes the dialog and stays
        on detail. Soft-deleted / non-`available` books (including
        `display_only`) do not get a Check Out button. `CheckoutPage`,
        ISBN Find, checkout camera/hardware capture, and
        `displayOnlyAlternatives` are gone. Never simulate checkout with
        generic `PATCH`.
    -   `/checkin` -- `LegacyCheckinRedirect` only: replace-navigates to
        `/loans` and forwards the current search string. Not a product
        page (`routeMetadata.checkin` is path-only).
    -   `/loans` -- `LoansPage` + `CheckinForm` + `loanTemporal` +
        `useCollectionIsbnJump` (infinite scroll, complete):
        `useInfiniteLoans()` plus unpaginated `useBooks()` joins; active
        vs returned sections from `returned_at` nullability; due/overdue
        labels via `getLoanDueState` / `displayLoanDate`; durable
        `Book {id}` fallback when the book is missing; empty / loading /
        retryable error states; bottom next-page loading and retry
        affordances; explicit empty active and returned sections.
        Eligible Active Loans rows offer Check In (`?bookId=`), which
        mounts `CheckinForm` (`checkinModel`, `checkinEligibility`,
        `useCheckinBook`); blank return time omits body;
        `ConfirmationDialog`; Field-linked **422**; **404** / **409**
        stale-state refetch; success clears `bookId` and stays on
        `/loans`. In-page loan/book when Check In is opened from Active
        Loans; otherwise `useLoans({ bookId })` plus `useBooks()` cache,
        with `useBook(bookId)` only on cache miss. Targeted queries are
        not mounted when `bookId` is unset. `CheckinPage` is gone.
    -   `/shelves` -- `ShelvesPage` + `shelfDisplay` / `shelfFormModel`
        (complete): catalog via `useShelves` with create /
        edit / delete through `useCreateShelf` / `useUpdateShelf` /
        `useDeleteShelf`; Title Case names; system-shelf labelling and
        protection for `unknown` / `removed` (no rename/delete; metadata
        edits allowed); `ConfirmationDialog` for delete; Field-linked
        **422** plus **400** / **404** / **409** mapping; loading /
        `QueryErrorState` / empty states. Book forms do not create or
        edit shelves.
    -   `/wishlists` -- `WishlistsPage` + `AddWishlistBookControl` /
        `wishlistFormModel` / `wishlistDisplay` (complete): `useWishlists`
        plus nested `useWishlistBooks`; membership catalog join via
        `useBook` / `GET /books/{id}` (not `useBooks()` / `GET /books`,
        which omits unshelved rows) with durable `Book {id}` fallback;
        create form with Field-linked **422**; add via
        `AddWishlistBookControl` (`POST /books` omitting `shelf_name`,
        then `useAddWishlistBook`; optional ISBN lookup via
        `useLookupBook`); permanent delete via `ConfirmationDialog` +
        `useDeleteWishlist` (memberships removed, catalog books remain).
        Status via `enumDisplayValue`. No membership remove/edit.
        Collection `/books` has no add-to-wishlist control.
    -   `/admin/deleted` -- `DeletedBooksPage` (complete):
        `useBooks({ includeDeleted: true })` filtered to non-null
        `deletion_date`; restore via `ConfirmationDialog` +
        `useRestoreBook` / `booksApi.restore`; empty / loading /
        retryable error states; `404`/`409` restore messaging with
        refetch.
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
    `GET /books?isbn=`); used by lookup, create, scanner capture,
    collection jump, and `/books` ISBN list filtering. Not used by
    checkout.
    Colocated `BookForm.test.tsx` /
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
        (lazy-loaded from `NewBookPage` via `React.lazy` / `Suspense`),
        `isbnCameraCapture` helpers
        (secure-context / getUserMedia capability checks, Bookland
        EAN-13 filter, decode hints, scan timeout),
        `IsbnScannerParser` + `useHardwareIsbnScanner` (keyboard-wedge
        capture with Enter terminator, inter-key timeout, checksum via
        `isbn.ts`; optional `ignoreEditableTargets` and
        `preventDefaultWhenConsumed` for collection-jump pages),
        `useCollectionIsbnJump` (shared hardware jump for `/dashboard`,
        `/books`, and `/loans`: compact via `compactIsbnForListFilter`,
        prefetch `GET /books?isbn=`, open sole match at `/books/{id}`,
        otherwise navigate to `/books?isbn=`; failed prefetch does not
        navigate; never creates, checks out, or calls lookup)
    -   Camera uses `@zxing/browser` (`BrowserMultiFormatReader`) +
        `@zxing/library`; permission requested only after the explicit
        "Scan ISBN" action; unsupported / insecure / permission /
        timeout paths keep manual ISBN entry usable
    -   Successful create-path camera or hardware captures call the
        book-create lookup handoff on `/books/new` (fill lookup ISBN,
        start `useBookLookup`); hardware listening is disabled while the
        camera UI is open or lookup is fetching. Collection-jump
        captures open a unique match or filter `/books?isbn=`. There is
        no checkout capture surface. Camera remains `/books/new` only.
    -   Camera: Bookland EAN-13 (`978` / `979`) only; secure context
        required; current Chrome / Firefox / Safari / Edge and iOS /
        Android evergreen browsers supported; insecure non-loopback
        `http:` and missing `getUserMedia` unsupported. Hardware:
        Enter-terminated ISBN-10 / ISBN-13 wedges supported; no Enter
        terminator unsupported. On Dashboard / Books / Loans, collection
        jump ignores editable targets so ordinary typing is not
        swallowed. Typed ISBN stays available on `/books/new` on failure.
        Manual checks: desktop Chrome/Safari/Firefox, Android Chrome,
        iOS Safari HTTPS, multi-camera switch, wedge Enter (create lookup
        and collection jump), permission denial, timeout, and UPC
        rejection.
    -   Colocated scanning tests plus `NewBookPage` handoff tests for
        camera and hardware captures; `BooksPage` / `DashboardPage` /
        `LoansPage` / `useCollectionIsbnJump` tests; Playwright
        `e2e/isbn-collection-jump.spec.ts`
-   Registered product routes (all live -- do not revert to placeholders
    or rebuild the typed client / hooks): `/`, `/dashboard`, `/books`,
    `/collection/manage`, `/books/new`, `/books/:bookId`,
    `/books/:bookId/mark-read`, `/books/:bookId/reading`,
    `/books/:bookId/edit`, `/books/:bookId/delete`, `/checkout`
    (`LegacyCheckoutRedirect`), `/checkin` (`LegacyCheckinRedirect` to
    `/loans`), `/loans`, `/wishlists`, `/shelves`, `/admin/deleted`,
    and `*` (`NotFoundPage`). `RoutePlaceholder.tsx`
    remains only as an unused helper.
-   Shared UI under `src/components/` (Alert, AppLink, Button,
    ConfirmationDialog, EmptyState, Field, LoadingState, Notifications,
    QueryErrorState) re-exports from `src/components/index.ts`.
    `QueryErrorState` uses `formatApiQueryError`; hides Retry on `403`
    and shows `.env` / rebuild guidance for unauthorized errors. Books
    list/detail, create/edit form, shelves catalog, wishlists, scanner
    capture, checkout, check-in, loan history, mark-read, reading edit,
    delete/restore admin, and dashboard already use
    these primitives.
-   CSS layers: `tokens` -\> `base` -\> `shell` -\> `components` via
    `src/index.css` (plain CSS; BEM-like component classes). Shell
    includes `.drawer-nav-menu` drawer panels for Collection and
    Circulation. Footer shows `Release` from `package.json` `version` via
    `APP_VERSION`, plus API version from public `GET /version` /
    `useVersion` when available. Dashboard layout classes (`.dashboard-page`, `.dashboard-drawer-bank`,
    `.dashboard-drawer`, `.dashboard-metric`, `.dashboard-breakdowns`, `.dashboard-healing`) and long-content wrapping
    live in `components.css`.
-   Local setup: copy `.env.example` to `.env` and set
    `VITE_API_SECRET_KEY` to match the backend `API_SECRET_KEY`; restart
    the dev server after changing `.env`. Optional same-origin proxy:
    `SHADE_API_PROXY=1 make run` (optional `SHADE_API_PROXY_TARGET`).
    The proxy forwards `/health`, `/books`, `/loans`, `/dashboard`,
    `/backup`, `/docs`, `/redoc`, `/openapi.json`, and `/wishlists` (not
    `/shelves`, `/version`, or `/collections`). Playwright Chromium must
    be installed once per machine
    (`yarn playwright install --with-deps chromium`) before
    `yarn test:e2e` / `make check`. Production build inspection:
    `scripts/productionBuildTokenInspection.test.ts` asserts `.env` is
    not copied into `dist/` or the release tarball and that
    `VITE_API_SECRET_KEY` is embedded in generated JS bundles.

Typed transport/query/redaction, browse/detail, create/lookup,
scanner capture on `/books/new`, hardware collection ISBN jump on
`/dashboard` / `/books` / `/loans`, checkout on book details via
`CheckoutDialog` (display-only **412** messaging without alternate
copies; `/checkout` is a compatibility redirect), check-in and loan
history, reading tracking (mark-read + reading edit),
edit/delete/restore, API contract sync (`author` / `title` /
`category` / `isbn` list filters used by `/books`, `sortBy=shelf`,
checkout `412` display-only messaging without alternate copies),
collection category / author / title / ISBN filter UI, About
homepage, dashboard (summary plus breakdown / incomplete-metadata reports), wishlists, operational/browser hardening,
shelves catalog writes, and infinite scroll on `/books` and `/loans` are done. Do not rebuild the typed client,
invent parallel hooks, or replace `AboutPage` / `CatalogGuide` / `DashboardPage` / `NewBookPage` /
`BookForm` / `bookEditModel` /
`EditBookPage` / `DeleteBookPage` / `DeletedBooksPage` /
`isbn.ts` / `src/features/scanning/` /
`useCollectionIsbnJump` /
`CheckoutDialog` / `checkoutModel` / `checkoutEligibility`
(borrower and notes only; `412` handling without alternate copies;
`/checkout` is `LegacyCheckoutRedirect` only) / `CheckinForm` / `checkinModel` / `checkinEligibility` /
`LoansPage` / `loanTemporal` / `MarkReadPage` / `markReadModel` /
`ReadingEditPage` / `readingEditModel` / `ShelvesPage` / `shelfDisplay`
/ `shelfFormModel` / `shelvesApi` / `useShelves` / write mutations /
`WishlistsPage` / `AddWishlistBookControl` / `wishlistFormModel` /
`wishlistDisplay` / `wishlistsApi` / `wishlistsQueries` /
`useInfiniteBooks` / `useInfiniteLoans` / `useInfiniteScrollTrigger` /
`booksListModel` / `BooksListControls` / `AppShell` / `DrawerNavMenu` /
`ManageCollectionPage`. FEAT-14 CI packaging is
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
-   Protected requests also send `Library-Username: shade` (injected by
    `apiClient` with the Bearer token)
-   Public `GET /health` and `GET /version` omit both headers
    (`authenticated: false`)
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
  Backup (ops)    `GET /backup` (API host / cron; no SPA caller)

### Known backend limitations (frontend compensations)

-   Validate ISBN-10 check digits (backend does not do this correctly).
-   Send normalized `YYYY-MM-DD` dates and UTC ISO 8601 timestamps.
-   Do not send `null` for required DB fields (title, authors, category,
    shelf_name on create, is_read, status).
-   Load shelves from `GET /shelves` for book placement; send selected
    `common_name` as `shelf_name` (never Title Case display strings).
    Collection create on `/books/new` requires an explicit shelf.
    Wishlist-only catalog rows omit `shelf_name` on `POST /books`. Manage
    the catalog on `/shelves` with documented `POST` / `PATCH` / `DELETE`
    (do not invent shelf CRUD on Add/Edit Book).
-   Prevent blank title, authors, borrower, and (on create) unselected
    shelf.
-   Prevent deletion of on-loan books (backend allows it; frontend must
    not).
-   Do not use PATCH for checkout/check-in/restore/mark-read.
-   Render unknown enum values safely (`enumDisplayValue` or
    equivalent).

### Server state

Use TanStack React Query for books, book detail, loans, shelves,
wishlists, and dashboard. Keep forms/scanner/dialogs local. Keep the
runtime connection state application-wide. Invalidate affected queries
after mutations. Reuse existing `useBooks` / `useInfiniteBooks` /
`useBook` / `useBookLookup` / `useLookupBook` / `useCreateBook` /
`useCheckoutBook` / `useCheckinBook` / `useMarkBookRead` / `useUpdateBook`
/ `useDeleteBook` / `useRestoreBook` / `useLoans` / `useInfiniteLoans` /
`useLoan` / `useShelves` / `useCreateShelf` / `useUpdateShelf` /
`useDeleteShelf` / `useWishlists` / `useWishlistBooks` /
`useCreateWishlist` / `useUpdateWishlist` / `useDeleteWishlist` /
`useAddWishlistBook` / `useDashboard` / `useDashboardBreakdowns` /
`useDashboardIncompleteMetadata` / `useInfiniteIncompleteMetadataBooks`,
`queryKeys`, and mutation invalidation -- do not invent a parallel cache stack. There is no realtime API.

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

### Product sequencing

Product intent, sequencing, and acceptance criteria live under `docs/`.
When deciding what to build next, prefer the current ticket, then the
product requirements docs. Do not implement future tickets prematurely.

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
    Leave `/admin/deleted` under `DeletedBooksPage`. Do not revive
    `/admin/backup`, `BackupLibraryPage`, or `backupApi`; never inspect,
    log, cache, or upload SQL dump contents. Leave About under `AboutPage` / `CatalogGuide` at `/` (brand link
    only; not a separate primary-nav item). Leave primary navigation under
    `AppShell` / `DrawerNavMenu` (Dashboard link; Collection Browse/
    Manage/Wishlists and Circulation Loans only). Leave `/collection/manage`
    under `ManageCollectionPage` (Add Book, Shelves, Deleted Books only).
    Leave dashboard under `DashboardPage` at `/dashboard` (`useDashboard` /
    `useDashboardBreakdowns` / `useDashboardIncompleteMetadata` /
    `useInfiniteIncompleteMetadataBooks`; display API stats only; null averages as
    "Not enough data"; do not recalculate from `GET /books`). Leave reading flows under
    `MarkReadPage` / `markReadModel` / `ReadingEditPage` / `readingEditModel`. Leave
    wishlists under `WishlistsPage` / `AddWishlistBookControl` /
    `wishlistFormModel` / `wishlistDisplay` / `wishlistsApi` /
    `wishlistsQueries` (`/wishlists` owns catalog CRUD and add;
    memberships via `useBook` / `GET /books/{id}`; add via unshelved
    create then membership; no add-from-collection or membership
    remove/edit). Leave scanner code under `src/features/scanning/`:
    camera lazy-loaded from `/books/new` only; create-path hardware on
    `NewBookPage`; collection jump via `useCollectionIsbnJump` on
    `/dashboard`, `/books`, and `/loans` (unique match opens detail;
    otherwise `/books?isbn=`; never creates or checks out from scan
    success alone; there is no checkout capture surface). Leave checkout under `CheckoutDialog` / `checkoutModel` /
    `checkoutEligibility` on `BookDetailsPage` (borrower and notes only; timestamps computed
    client-side; `412` `display_only` refetch/messaging without alternate copies; `/checkout` is
    `LegacyCheckoutRedirect` only). Do not restore `CheckoutPage`, ISBN Find, camera capture on
    checkout, or FEAT-21 alternate-copy offers. Leave check-in and loan
    history under `CheckinForm` / `checkinModel` / `checkinEligibility` /
    `LoansPage` / `loanTemporal` (check-in on `/loans`; `/checkin` is
    `LegacyCheckinRedirect` only). Leave shelves under
    `ShelvesPage` /
    `shelfDisplay` / `shelfFormModel` / `shelvesApi` / `useShelves` /
    write mutations (`/shelves` owns create/edit/delete with system-shelf
    protection; book forms use API-fed pickers with `shelf_name`, never
    shelf CRUD on Add/Edit Book). Leave infinite scroll and catalog filters under
    `useInfiniteBooks` / `useInfiniteLoans` / `useInfiniteScrollTrigger`
    / `booksListModel` / `BooksListControls` (URL-backed category /
    author / title / ISBN plus sort; do not regress those controls). Preserve
    the completed FEAT-13 test architecture: existing Vitest / Testing
    Library / `renderAppTree` coverage plus Playwright `e2e/` with the
    shared stateful mock API and axe helper. Browser journeys and
    automated accessibility suites are part of `make check`; do not
    remove them from the quality gate or invent a parallel fake-API
    stack. FEAT-14 CI packaging is complete: keep
    `.github/workflows/check.yml` and `scripts/checkBundleSize.mjs` in
    the canonical gate; do not add secret-bearing CI artifacts. FEAT-15
    Podman is complete: keep `ci/Containerfile`, `ci/nginx.conf`,
    `ci/container-entrypoint.sh`, `.containerignore`, and Make
    `container-*` targets; do not add containerized Vite/HMR or a
    Compose file in this repo. FEAT-16 release artifacts are complete:
    keep `scripts/packRelease.ts`, Make `pack`, gitignored
    `ci/artifacts/`, and the production-like host inspection tests; do
    not upload secret-bearing archives from default CI. Do not pull
    FEAT-26 or FEAT-27 product work into unrelated changes. Never
    simulate restore, checkout, check-in, or initial mark-read with
    generic `PATCH`.
-   Prefer regenerating `src/api/generated/openapi.ts` over hand-editing
    it.
-   Reuse the typed client, query keys, mutation invalidation,
    and redaction helpers; do not invent a parallel transport or cache
    stack.

------------------------------------------------------------------------

## 5. Scope (short)

**In scope for MVP:** dashboard (summary plus breakdown / incomplete-metadata
reports), active books with category / author / title / ISBN filtering and
URL-backed sorting, detail, manual/ISBN/camera/scanner add flows, hardware ISBN
collection jump on Dashboard / Books / Loans, edit, checkout on book
details (display-only **412** messaging without alternate-copy offers), check-in,
loan history, shelves catalog, reading tracking, soft delete/restore, deleted
admin, authenticated SQL backup at the API host (not a browser download), runtime API config, CI, Podman preview,
versioned production artifacts, About homepage with the dashboard at
`/dashboard`, and wishlists. Ticketed follow-ons (implement only when working
that ticket): wishlist move-to-shelf (FEAT-26) and curated Collections
(FEAT-27).

**Out of scope unless explicitly requested:** UPC, true multi-library
tenancy, cover images, overdue notifications, Goodreads/StoryGraph, user
accounts/roles, realtime sync, loan CRUD, mark-unread, remote
Ansible/systemd/TLS/rollback orchestration, and replacing the
single-value `Category` enum with a many-to-many / data-driven taxonomy
(`docs/product-docs/CATEGORY_NOTES.md` is future-architecture notes, not
a ticket). Collection browse (`BooksPage`) and loan history
(`LoansPage`) use infinite scroll with backend pagination; other callers
still fetch unpaginated full lists when needed.

Do not expand a ticket into out-of-scope features. Do not implement
future tickets prematurely.

FEAT-13 workflow and accessibility tests, FEAT-14 CI packaging,
FEAT-15 Podman deployed development, FEAT-16 versioned release
artifacts, FEAT-17 About homepage, FEAT-18 collection filters,
FEAT-19 wishlists, FEAT-20 dashboard reports, FEAT-21 display-only
checkout alternate-copy UX, FEAT-22 check-in consolidation onto
`/loans`, FEAT-23 checkout consolidation onto book details, FEAT-24
hardware ISBN scan on Dashboard / Books / Loans, and FEAT-25 remove
browser backup page are complete. Remaining tickets begin with
`FEAT-26` and continue through `FEAT-27` under
`docs/tickets/`. When no current ticket is supplied, do not guess which
remaining ticket to implement; ask for the next ticket. The supplied
ticket's acceptance criteria are authoritative unless they contradict the
backend contract or established architecture.

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
                `loansApi.ts`, `shelvesApi.ts`, `wishlistsApi.ts`, `dashboardApi.ts`, `healthApi.ts`, `versionApi.ts`, `versionQueries.ts`, `queryClient.ts`, `booksQueries.ts`, `loansQueries.ts`, `shelvesQueries.ts`, `wishlistsQueries.ts`, `dashboardQueries.ts`

  Diagnostics   `src/diagnostics/diagnosticReporter.ts` plus `RootErrorBoundary`, `AppProviders`, `ConnectionProvider`, and `apiClient` integration

  Connection    `src/features/connection/*` (provider, build-time token, health reachability)

  Infinite      `src/features/shared/infiniteScrollConfig.ts`, `src/hooks/useInfiniteScrollTrigger.ts`
  scroll        

  Routing /     `src/routes/*` (including `LegacyCheckoutRedirect.tsx`
  shell         and `LegacyCheckinRedirect.tsx`), `src/layout/AppShell.tsx`
                (brand link to About plus "est. 2026"; Dashboard link;
                Collection and Circulation `DrawerNavMenu` drawers --
                Circulation is Loans only; footer shows
                `Release ${APP_VERSION}` plus API version from
                `useVersion` / `GET /version` when available),
                `src/layout/DrawerNavMenu.tsx`

  Feature       `src/features/{about,collection,dashboard,books,loans,shelves,wishlists,connection,scanning,shared}/`
  routes        (scanning is a feature module, not a top-level route)

  Books UI      `src/features/books/routes/{BooksPage,BookDetailsPage,NewBookPage,EditBookPage,bookEditModel,DeleteBookPage,DeletedBooksPage,MarkReadPage,markReadModel,ReadingEditPage,readingEditModel}.{tsx,ts}`,
                `src/features/books/components/{BookForm,bookFormDefaults,bookFormModel,BooksListControls}.{tsx,ts}`, `src/features/books/booksListModel.ts` (sort: `author` \| `title` \| `creationDate` \| `shelf`; URL-backed category / author / title / ISBN filters),
                `src/features/books/utils/isbn.ts` (`compactIsbnForListFilter` for
                `GET /books?isbn=` list filters and collection jump; not used by checkout)

  Shelves UI    `src/features/shelves/routes/ShelvesPage.tsx`, `shelfDisplay.ts`, `shelfFormModel.ts` (catalog CRUD complete)

  Wishlists UI  `src/features/wishlists/routes/WishlistsPage.tsx`, `src/features/wishlists/components/AddWishlistBookControl.tsx`,
                `wishlistFormModel.ts`, `wishlistDisplay.ts` (`/wishlists` complete; no membership remove/`removeBook`
                until FEAT-26)

  About UI      `src/features/about/routes/AboutPage.tsx`, `src/features/about/components/CatalogGuide.tsx` (`/` homepage)

  Collection    `src/features/collection/routes/ManageCollectionPage.tsx` (`/collection/manage` hub;
                colocated `ManageCollectionPage.test.tsx` asserts Add Book / Shelves / Deleted Books
                only -- no Backup Library)

  Dashboard UI  `src/features/dashboard/routes/DashboardPage.tsx` (`/dashboard`; summary, breakdowns,
                incomplete-metadata healing, collection ISBN jump)

  Loans UI      `src/features/loans/components/CheckoutDialog.tsx`,
                `checkoutModel.ts`, `checkoutEligibility.ts` (checkout on
                `BookDetailsPage`; borrower and notes only; `412`
                display-only refetch/messaging without alternate copies);
                `src/features/loans/components/CheckinForm.tsx`, `checkinModel.ts`,
                `checkinEligibility.ts`, `LoansPage.tsx`, `loanTemporal.ts`,
                `loansListModel.ts` (check-in on `/loans`; infinite scroll +
                collection ISBN jump); `src/routes/LegacyCheckoutRedirect.tsx`
                (`/checkout` → `/books` or `/books/{id}?checkout=1`);
                `src/routes/LegacyCheckinRedirect.tsx` (`/checkin` → `/loans`)

  Scanning      `src/features/scanning/{IsbnCameraScanner,isbnCameraCapture,isbnScannerParser,useHardwareIsbnScanner,useCollectionIsbnJump}.{tsx,ts}` (lazy camera from `NewBookPage`; collection jump on Dashboard / Books / Loans)

  Shared UI     `src/components/*` (import via `index.ts`; includes `QueryErrorState`)

  Styles        `src/index.css`, `src/styles/{tokens,base,shell,components}.css` (`.drawer-nav-menu` in
                `shell.css`; `.dashboard-page`, `.dashboard-drawer-bank`, `.dashboard-drawer`, `.dashboard-metric`,
                `.dashboard-breakdowns`, `.dashboard-healing`, and long-content wrap in `components.css`)

  Tests helpers `src/test/setup.ts`, `src/test/renderAppTree.tsx` (diagnostic reporter; dashboard report
                route mocks; empty wishlists)

  Browser e2e   `playwright.config.ts`, `e2e/{accessibility,book.creation,dashboard.smoke,isbn-collection-jump,library.lifecycle}.spec.ts`,
                `e2e/support/{mockApi,accessibility}.ts` (FEAT-13 complete; `yarn test:e2e`; included in
                `make check`). `mockApi` covers health, version, shelves, books, loans, dashboard summary,
                lookup, and lifecycle mutations; no wishlist, Collections, dashboard-report, or `/backup`
                fixtures yet (extend when a ticket needs them; SQL backup remains API-host-only)

  Tooling       `package.json`, `Makefile`, `vite.config.ts`, `eslint.config.js`, `tsconfig*.json`, `.env.example`,
                `.github/workflows/check.yml`, `scripts/checkBundleSize.mjs`, `scripts/packRelease.ts`,
                `ci/{Containerfile,nginx.conf,container-entrypoint.sh}`, `.containerignore`
                (FEAT-15 image `shade-frontend`; FEAT-16 `make pack` tarball)

  Contract smoke `scripts/contractSmoke.test.ts` (includes `/shelves`, `/version`, `/backup`, wishlist
                membership DELETE, Collections paths, dashboard-report paths, and lifecycle routes)
  --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Feature route ownership (all complete unless noted): books list/detail;
infinite scroll on `/books` and `/loans`; new book create/lookup; ISBN
scanner capture on `/books/new`; hardware collection ISBN jump on
`/dashboard`, `/books`, and `/loans` (`useCollectionIsbnJump`); checkout
on book details via `CheckoutDialog` (display-only **412** without
alternate copies; `/checkout` is `LegacyCheckoutRedirect`); check-in/loans;
reading tracking (`MarkReadPage` / `markReadModel` /
`ReadingEditPage` / `readingEditModel`); edit/delete/restore
(`EditBookPage` / `bookEditModel` / `DeleteBookPage` /
`DeletedBooksPage`); API contract sync (list
filters including ISBN, shelf sort, checkout `412` without alternate
copies); About `/` (`AboutPage` + `CatalogGuide`); dashboard `/dashboard`
(`DashboardPage` with summary, breakdown, and incomplete-metadata reports);
operational/browser hardening (runtime diagnostics, cross-route
accessibility/responsive hardening, browser-support documentation,
performance/contract re-check, and production-host security ownership
notes); shelves catalog (`ShelvesPage` / `shelfDisplay` / `shelfFormModel`);
wishlists (`WishlistsPage` / `AddWishlistBookControl` / `wishlistFormModel` /
`wishlistDisplay` / `wishlistsApi` / `wishlistsQueries`); FEAT-13
workflow/accessibility quality-gate coverage (Vitest coverage thresholds,
Playwright journeys, axe checks, and `make check` integration); FEAT-14 CI
packaging (`.github/workflows/check.yml` and `scripts/checkBundleSize.mjs`);
FEAT-15 Podman deployed-development image (`ci/Containerfile`, Make
`container-*` targets); FEAT-16 versioned release tarball
(`scripts/packRelease.ts`, Make `pack`); FEAT-17 About homepage (`AboutPage`
at `/`, dashboard at `/dashboard`, drawer primary nav via `DrawerNavMenu`);
FEAT-18 collection filters (`BooksPage` / `BooksListControls` /
`booksListModel` URL-backed category / author / title plus sort); FEAT-19
wishlists (`WishlistsPage` at `/wishlists`, Collection-drawer link,
unshelved `POST /books` then add); FEAT-20 dashboard reports (breakdowns and
incomplete-metadata healing on `/dashboard`); FEAT-21 display-only checkout
alternate-copy UX (later retired with FEAT-23; **412** messaging remains on
`CheckoutDialog`); FEAT-22 check-in on `/loans` (`CheckinForm`; `/checkin` is
`LegacyCheckinRedirect`); FEAT-23 checkout on book details (`CheckoutDialog`;
`/checkout` is `LegacyCheckoutRedirect`; Circulation is Loans only); FEAT-24
hardware ISBN scan on Dashboard / Books / Loans (`useCollectionIsbnJump`,
URL `?isbn=`); FEAT-25 remove browser backup page (`/admin/backup` /
`BackupLibraryPage` / `backupApi` removed; backups are API-host only). Primary
navigation redesign (`ManageCollectionPage` at
`/collection/manage`) shipped without a standalone ticket. Remaining tickets:
FEAT-26 wishlist move-to-shelf, FEAT-27 curated Collections.

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

  Future category taxonomy notes  `docs/product-docs/CATEGORY_NOTES.md`
  (not a ticket; do not implement
  unless explicitly requested)

  Product requirements (source)   `docs/product-docs/PRODUCT_REQS.V1.md`,
                                  `docs/product-docs/PRODUCT_REQS.V2.*.md`

  Feature tickets                 Remaining current tickets under
                                  `docs/tickets/`: `FEAT-26_...` through
                                  `FEAT-27_...`; FEAT-13 through FEAT-25
                                  are complete (those ticket files are
                                  removed)

  Bundle budget / CI              Recorded in this master context.
                                  `scripts/checkBundleSize.mjs` (warn
                                  120 kB gzip, fail 150 kB).
                                  `.github/workflows/check.yml` runs
                                  `make check` (FEAT-14 complete)

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
baseline. It does not require `docs/AGENTS.md` or any other agents guide.

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
