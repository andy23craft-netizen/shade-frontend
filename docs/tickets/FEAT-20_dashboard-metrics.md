# FEAT-20 -- Dashboard breakdowns and incomplete-metadata healing

## Objective

Augment the existing FEAT-11 library dashboard (`/`) so it surfaces the backend's newer authenticated report
endpoints: catalog composition ("basic stats") via `GET /dashboard/breakdowns`, and a healing / cleanup section via
`GET /dashboard/incomplete-metadata` plus a drill-down list of books missing tracked fields via
`GET /dashboard/incomplete-metadata/books`.

Keep displaying API-provided numbers only -- never recalculate business totals, invent zero for null averages, or
synthesize incomplete counts from a client-side book dump. Preserve the existing Collection, Circulation, and Reading
Record summary sections from `GET /dashboard`.

## Dependencies

FEAT-11 dashboard summary UI is complete (`DashboardPage` + `useDashboard` / `dashboardApi.get`). Prefer landing
`docs/tickets/FEAT-10_update-api.md` first when that ticket is still open: it regenerates OpenAPI types (including
dashboard report schemas/paths) and updates `scripts/contractSmoke.test.ts`, while explicitly leaving dashboard-report
product UI to this ticket.

If FEAT-10 has not yet regenerated types or contract smoke, regenerate and extend smoke here as a prerequisite rather
than blocking. Reuse FEAT-03 typed client, query keys, PLAN.md 7.5 invalidation, shared components, and existing
dashboard layout/CSS. Do not invent a second metrics transport or recalculate aggregates from `GET /books`.

Do not pull FEAT-12 hardening, FEAT-13 journey automation, FEAT-14 CI, FEAT-15 Podman, FEAT-16 release artifacts,
FEAT-17 About/homepage routing, FEAT-18 collection filters, or FEAT-19 wishlists into this ticket.

## Contract references

Treat these as complementary:

- `../technical-reference/openapi.json` -- paths, methods, status codes, and schemas:
  - `GET /dashboard` -- existing `DashboardSummary` (keep current widgets).
  - `GET /dashboard/breakdowns` -- `DashboardBreakdowns` (`total_books`, `on_loan`, `by_category`, `by_shelf`,
    `by_creation_year`; bucket items are `DashboardCountBucket` `{ key, count }`).
  - `GET /dashboard/incomplete-metadata` -- `DashboardIncompleteMetadata` (`total_incomplete`, `missing_category`,
    `missing_shelf`, `missing_pages`, `missing_publisher`, `missing_year`, `missing_isbn`).
  - `GET /dashboard/incomplete-metadata/books` -- `BookList` with optional `field`, paired `skip` / `take`.
- `../technical-reference/API-for-FE.md` -- behavioral rules OpenAPI does not fully express:
  - Soft-deleted books are excluded from all dashboard counts and incomplete-metadata results; loan metrics use only
    loans tied to non-deleted books.
  - Breakdowns: `on_loan` matches summary `checked_out` (active books with stored `status=on_loan`). Category and
    shelf buckets use stored enum strings. Creation-year buckets come from `creation_date`. Zero-count buckets are
    omitted (response is built from existing grouped rows).
  - Incomplete metadata: category and shelf are "missing" when stored value is `unknown`. Publisher,
    `publication_date`, and `isbn13` are missing when `null` or blank; pages are missing when `null`.
  - `missing_year` means missing `publication_date`; do not confuse with breakdown creation-year buckets
    (`creation_date`).
  - `total_incomplete` counts distinct active books missing at least one tracked field -- it is **not** the sum of
    the per-field counts (a book can contribute to multiple field totals).
  - Incomplete books list returns full `BookRead` rows (including borrow stats). Optional `field` values:
    `category`, `shelf`, `pages`, `publisher`, `year`, `isbn`. Invalid or blank `field` → **400**. There is **no**
    `section` metadata field or query value (ignore any checklist wording that mentions "missing section").
  - Default incomplete-books order: `creation_date` DESC, then book `id` ASC. Paired `skip`/`take` when paginating;
    `total` is the unpaginated matching count.
  - All dashboard report routes are authenticated (Bearer); **403** is "API access was rejected".

Confirm against a representative running backend `/openapi.json` before locking transport types; record drift as a
blocker rather than inventing frontend semantics.

## Current baseline

Already in place and should be reused (not rebuilt):

- `/` via `DashboardPage` + `useDashboard` / `dashboardApi.get` (`GET /dashboard` only): Collection, Circulation, and
  Reading Record; null averages as "Not enough data"; read/unread contract warning without recalculation; Refresh;
  offline/paused and stale status; `QueryErrorState` recovery.
- Styles: `.dashboard-page`, `.dashboard-section`, `.dashboard-metric`, and related classes in
  `src/styles/components.css`.
- `queryKeys.dashboard.all` is `['dashboard']`; book lifecycle mutations invalidate that key (React Query prefix
  matching will also cover nested dashboard keys if they stay under `['dashboard', ...]`).
- `apiTypes` exports `DashboardSummary` / borrowing / reading aliases only -- no breakdown or incomplete-metadata
  aliases unless FEAT-10 already added them.
- Generated OpenAPI / contract smoke may already include the three report paths after FEAT-10; verify before editing.
  `dashboardApi` still exposes only `get()`.
- Shared UI: `Alert`, `AppLink`, `Button`, `EmptyState`, `LoadingState`, `QueryErrorState`, `enumDisplayValue` for
  unknown category/shelf keys in breakdown buckets.
- Book detail and edit routes already exist for healing follow-through (`/books/:bookId`, `/books/:bookId/edit`).

## Product intent

On `/`, an operator should be able to:

1. **See basic catalog stats** -- a new Dashboard section that shows API breakdown totals (`total_books`, `on_loan`)
   and composition lists by category, shelf, and creation year from `GET /dashboard/breakdowns`. Render each bucket's
   `key` and `count` as supplied; use `enumDisplayValue` (or equivalent) for category/shelf keys so unknown enums stay
   safe. Empty bucket arrays are valid (show an honest empty line, not invented zero rows for every enum).
2. **See healing / incomplete-metadata counts** -- a new section that shows `total_incomplete` and each
   `missing_*` field count from `GET /dashboard/incomplete-metadata`, with short copy that these are cleanup targets
   (category/shelf `unknown`, blank publisher/year/ISBN, null pages). Do not sum the field counts into a "corrected"
   total.
3. **Inspect books with missing info** -- within the healing section (or a clearly nested panel), list books from
   `GET /dashboard/incomplete-metadata/books`, optionally filtered by `field`. Each row should identify the book
   (title/authors at minimum) and link to detail and/or edit so missing fields can be fixed. Support pagination
   (paired `skip`/`take`, or infinite scroll matching the shared batch size) when `total` exceeds one page. Clearing
   the field filter lists all books missing at least one tracked field.
4. **Refresh and recover together** -- extend the existing Refresh / offline / stale / `QueryErrorState` patterns so
   summary, breakdowns, and incomplete-metadata queries remain usable; prefer one Refresh control that refetches all
   dashboard queries rather than three disconnected buttons.

Tone and layout: extend the existing numbered dashboard sections (I / II / III ...); do not turn `/` into a charting
library, card grid of sparklines, or a second admin page. Prefer definition lists / compact tables consistent with
current `.dashboard-metric` patterns.

## Remaining scope (file-level plan)

### 1. Contract lock (only if FEAT-10 left gaps)

Skip or no-op any row already completed by FEAT-10.

| File | Change |
| ---- | ------ |
| `src/api/generated/openapi.ts` | Regenerate with `yarn api:generate` if report paths/schemas are missing. Do not hand-edit. |
| `scripts/contractSmoke.test.ts` | Ensure expected paths include `/dashboard/breakdowns`, `/dashboard/incomplete-metadata`, and `/dashboard/incomplete-metadata/books`. |
| `src/api/apiTypes.ts` | Export aliases for `DashboardBreakdowns`, `DashboardCountBucket`, and `DashboardIncompleteMetadata` (and reuse existing `BookList` / `BookRead` for the books drill-down). |
| `src/api/apiTypes.test.ts` | Fixture coverage for breakdown bucket shapes and incomplete-metadata required fields (including that `total_incomplete` is an independent integer). |

### 2. Typed dashboard helpers and query keys

| File | Change |
| ---- | ------ |
| `src/api/dashboardApi.ts` | Keep `get()` for `GET /dashboard`. Add `getBreakdowns()`, `getIncompleteMetadata()`, and `listIncompleteMetadataBooks({ field?, skip?, take? })`. Omit `field` when `undefined` / blank / whitespace so the FE never triggers documented **400**. Send `skip`/`take` together when paginating (same rule as books/loans). Accept optional `AbortSignal` via `ApiCallOptions`. |
| `src/api/queryKeys.ts` | Nest under the existing dashboard prefix, e.g. keep `all: ['dashboard']` for summary (or `['dashboard', 'summary']` only if callers and invalidation are updated together), plus `breakdowns`, `incompleteMetadata`, and `incompleteMetadataBooks({ field?, skip?, take? })` / infinite variant. Prefer keys that still start with `['dashboard']` so existing mutation invalidation of `queryKeys.dashboard.all` continues to refresh report data. |
| `src/api/dashboardQueries.ts` | Add `useDashboardBreakdowns`, `useDashboardIncompleteMetadata`, and `useIncompleteMetadataBooks` / `useInfiniteIncompleteMetadataBooks` (pick one list pattern; prefer infinite scroll when lists can be long, matching shared `INFINITE_SCROLL_BATCH_SIZE`). Thread `enabled` where useful (e.g., delay the books query until the healing section is visible only if that keeps the page light -- default to fetching with the page). |
| `src/api/api.ts` | No structural change required if helpers stay on `createDashboardApi`; confirm `api.dashboard` still aggregates the expanded helper. |
| `src/api/dashboardApi.test.ts` | Cover: breakdowns and incomplete-metadata GETs; incomplete books with/without `field`; blank `field` omission; paired pagination params; existing summary `get()` still passes. |
| `src/api/serverStateQueries.test.tsx` (and/or colocated dashboard query tests) | Assert new hooks use the nested keys and call the matching helpers; optional: confirm invalidating `['dashboard']` marks report queries stale the same way as summary. |

Do not compute incomplete totals or breakdown buckets from `booksApi.list`.

### 3. Presentation helpers (optional, keep thin)

| File | Change |
| ---- | ------ |
| `src/features/dashboard/dashboardDisplay.ts` (new, if it keeps `DashboardPage` readable) | Pure helpers: incomplete-field labels (`category` → "Category", `year` → "Publication year", etc.), allowed `field` values for the filter control, and safe bucket-key display via `enumDisplayValue` where keys are category/shelf enums. Colocate `dashboardDisplay.test.ts`. |
| Avoid | Charting dependencies, CSV export, or client-side "heal all" mutations. |

### 4. `DashboardPage` -- basic stats and healing sections

| File | Change |
| ---- | ------ |
| `src/features/dashboard/routes/DashboardPage.tsx` | Keep sections I--III on `useDashboard` data. Add **Basic stats** (or equivalent heading) driven by `useDashboardBreakdowns`: show `total_books` / `on_loan` and the three bucket lists. Add **Healing metadata** (or "Incomplete metadata") driven by `useDashboardIncompleteMetadata` counts plus the incomplete-books list/filter. Wire Refresh to refetch summary + breakdowns + incomplete metadata (+ active books query). Preserve offline/paused, stale, contract-warning, and `QueryErrorState` behavior; if one report query fails while summary succeeds, show a section-level error with retry rather than blanking the whole page when summary data is already visible. Link incomplete book rows to `/books/:bookId` (and optionally Edit). When `total_incomplete === 0` and the unfiltered books list is empty, show a positive empty state (e.g., no cleanup needed) -- not the library-empty Add Book pattern. |
| `src/features/dashboard/routes/DashboardPage.test.tsx` | Cover: breakdown buckets render API keys/counts; omitted zero buckets are not invented; incomplete counts render without summing into `total_incomplete`; field filter updates the books query (`field=isbn` etc.); blank/all filter omits `field`; book rows link to detail; empty healing state; section-level error recovery; Refresh triggers the new queries; existing summary / null-average / inconsistency cases stay green. |
| `src/styles/components.css` | Extend dashboard BEM classes for bucket lists and healing rows (e.g., `.dashboard-buckets`, `.dashboard-healing-list`) so new sections wrap cleanly at 320px, keep 44px targets, and reuse tokens. No new CSS framework. |

### 5. Invalidation hygiene

| File | Change |
| ---- | ------ |
| `src/api/booksQueries.ts` | Confirm create/update/delete/restore/checkout/check-in/mark-read invalidation of `queryKeys.dashboard.all` still covers nested report keys via prefix matching. If keys were restructured away from the `['dashboard']` prefix, update invalidation explicitly -- prefer keeping the prefix. |
| Mutation tests | Only adjust if key shape changes require it; do not broaden invalidation into unrelated domains. |

### 6. Documentation (when the feature lands)

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Note dashboard report sections on `/` (breakdowns + incomplete metadata + books drill-down); update `dashboardApi` / `dashboardQueries` / `queryKeys` / `DashboardPage` inventory. Prefer ticket presence under `docs/tickets/` over `docs/ToDo.md` when judging completion. |
| `docs/ToDo.md` | Mark the "Augment `/dashboard` with: Dashboard reports" checklist item done when maintainers still use that file. |
| `docs/tickets/FEAT-10_update-api.md` | If still present: note that dashboard-report product UI moved to FEAT-20 (avoid conflicting "no incomplete-metadata UI" instructions). |

## Suggested section behavior

Exact copy is implementer-owned; keep it accurate:

1. **Basic stats** -- Total books and on loan from breakdowns (may duplicate summary figures; still display API values,
   do not reconcile client-side). Then three subsections or lists: By category, By shelf, By year added
   (`by_creation_year`).
2. **Healing metadata** -- "Books needing metadata" with `total_incomplete`, then per-field counts. Optional field
   filter: All | Category | Shelf | Pages | Publisher | Publication year | ISBN (request values:
   omit / `category` / `shelf` / `pages` / `publisher` / `year` / `isbn`).
3. **Books list** -- Title, authors, and a short hint of what is incomplete when easy from the row (optional; do not
   invent incompleteness client-side if not obvious). Link to detail/edit. Paginate or infinite-scroll.
4. Do not offer a "Missing section" filter -- the API has no such field.

## Acceptance criteria

- `/` still shows Collection, Circulation, and Reading Record from `GET /dashboard` with existing null-average and
  inconsistency behavior.
- `/` shows a basic-stats section from `GET /dashboard/breakdowns` (totals plus category, shelf, and creation-year
  buckets) without inventing zero-count buckets or recalculating totals from the book list.
- `/` shows a healing / incomplete-metadata section from `GET /dashboard/incomplete-metadata` with
  `total_incomplete` and each `missing_*` count, without treating the field counts as a summable total.
- Operators can list books with missing info via `GET /dashboard/incomplete-metadata/books`, optionally filter by
  documented `field` values, and open a book to fix metadata; blank/invalid filters are never sent.
- Soft-deleted books remain excluded (API contract); the FE does not add them back via `include_deleted`.
- Refresh / offline / error recovery cover the new queries without breaking summary UX.
- Colocated API and `DashboardPage` tests cover the new behavior; `make check` passes.
- `docs/AGENTS.md` (and ToDo as needed) reflect the augmented dashboard.

## Plan coverage

Extends Workstream 10 (read-only dashboard) beyond the original `GET /dashboard` summary to the backend's catalog
breakdown and incomplete-metadata report surface. Completes the product UI that `FEAT-10_update-api` deferred for
dashboard reports.

## Out of scope

- Recalculating dashboard metrics from `GET /books` or loan lists.
- Chart libraries, heatmaps, "on this day", weather/quote widgets, or other V2 vision dashboards from product drafts.
- A dedicated `/admin/healing` route (keep healing on `/` unless FEAT-17 later relocates the homepage).
- Wishlist UI, collection category filter UI, cover images, or automated bulk metadata fills.
- Inventing a `section` incomplete field or any query value not documented by the API.
- Changing auth, runtime config, connection bootstrap, or FEAT-12+ packaging/hardening work.
