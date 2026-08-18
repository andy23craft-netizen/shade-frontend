# FEAT-20 -- Dashboard breakdowns and incomplete-metadata healing

## Objective

Augment the existing FEAT-11 library dashboard (`/dashboard`) so it surfaces the backend's newer authenticated report
endpoints: catalog composition ("basic stats") via `GET /dashboard/breakdowns`, and a healing / cleanup section via
`GET /dashboard/incomplete-metadata` plus a drill-down list of books missing tracked fields via
`GET /dashboard/incomplete-metadata/books`.

Keep displaying API-provided numbers only -- never recalculate business totals, invent zero for null averages, or
synthesize incomplete counts from a client-side book dump. Preserve the existing Collection, Circulation, and Reading
Record summary sections from `GET /dashboard`.

## Dependencies

FEAT-11 dashboard summary UI is complete (`DashboardPage` + `useDashboard` / `dashboardApi.get`). Prior API contract
sync already regenerated OpenAPI types and `scripts/contractSmoke.test.ts` for the three dashboard-report paths and
schemas; this ticket owns the typed helpers, query hooks, and product UI only. CHORE-01 shelves are complete --
breakdown `by_shelf` keys and incomplete `missing_shelf` use shelf `common_name` / membership on `unknown`, not a
hard-coded shelf enum. Book edit healing still uses API-fed shelf pickers from `GET /shelves`.

Reuse the typed client, query keys, PLAN.md 7.5 invalidation, shared components, and existing dashboard layout/CSS.
Do not invent a second metrics transport or recalculate aggregates from `GET /books`.

Do not pull journey automation, CI, Podman, release artifacts, FEAT-17 About/homepage routing, FEAT-18 collection
filters, or FEAT-19 wishlists into this ticket. FEAT-17 is complete: the dashboard lives at `/dashboard`; implement
the new sections on that route (not on `/`, which is the About homepage).

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
  - Breakdowns: `on_loan` matches summary `checked_out` (active books with stored `status=on_loan`). Category
    buckets use stored category strings. Shelf buckets use `shelves.common_name` via membership (not a shelf enum).
    Creation-year buckets come from `creation_date`. Zero-count buckets are omitted (response is built from existing
    grouped rows).
  - Incomplete metadata: category is "missing" when stored value is `unknown`. Shelf is "missing" when membership is
    on system shelf `unknown` (not `removed`). Publisher, `publication_date`, and `isbn13` are missing when `null` or
    blank; pages are missing when `null`.
  - Soft-delete moves book membership to `removed`; restore moves membership to `unknown` (prior shelf is not
    restored). Soft-deleted books stay out of all dashboard report counts.
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

- `/dashboard` via `DashboardPage` + `useDashboard` / `dashboardApi.get` (`GET /dashboard` only): Collection,
  Circulation, and Reading Record; null averages as "Not enough data"; read/unread contract warning without
  recalculation; Refresh; offline/paused and stale status; `QueryErrorState` recovery. `/` is the About homepage
  (`AboutPage`), not the dashboard.
- Styles: `.dashboard-page`, `.dashboard-section`, `.dashboard-metric`, and related classes in
  `src/styles/components.css`.
- `queryKeys.dashboard.all` is `['dashboard']`; book lifecycle mutations and shelf renames that change `common_name`
  invalidate dashboard keys (React Query prefix matching will also cover nested dashboard keys if they stay under
  `['dashboard', ...]`).
- Generated OpenAPI (`src/api/generated/openapi.ts`) and `scripts/contractSmoke.test.ts` already include
  `/dashboard/breakdowns`, `/dashboard/incomplete-metadata`, and `/dashboard/incomplete-metadata/books` plus
  `DashboardBreakdowns` / `DashboardCountBucket` / `DashboardIncompleteMetadata` schemas.
- `apiTypes` still exports only `DashboardSummary` / borrowing / reading aliases -- no breakdown or
  incomplete-metadata aliases yet.
- `dashboardApi` still exposes only `get()`; `dashboardQueries` only `useDashboard`.
- Shared UI: `Alert`, `AppLink`, `Button`, `EmptyState`, `LoadingState`, `QueryErrorState`, `enumDisplayValue` for
  unknown category keys; Title Case shelf labels via `formatShelfCommonNameForDisplay` for shelf bucket keys.
- Book detail and edit routes already exist for healing follow-through (`/books/:bookId`, `/books/:bookId/edit` with
  API-fed shelf pickers). Shelves catalog management remains `/shelves`.

## Product intent

On `/dashboard`, an operator should be able to:

1. **See basic catalog stats** -- a new Dashboard section that shows API breakdown totals (`total_books`, `on_loan`)
   and composition lists by category, shelf, and creation year from `GET /dashboard/breakdowns`. Render each bucket's
   `key` and `count` as supplied; use `enumDisplayValue` for category keys and Title Case
   `formatShelfCommonNameForDisplay` for shelf `common_name` keys so unknown values stay safe. Empty bucket arrays
   are valid (show an honest empty line, not invented zero rows for every enum/shelf).
2. **See healing / incomplete-metadata counts** -- a new section that shows `total_incomplete` and each
   `missing_*` field count from `GET /dashboard/incomplete-metadata`, with short copy that these are cleanup targets
   (category `unknown`, shelf membership on `unknown`, blank publisher/year/ISBN, null pages). Do not sum the field
   counts into a "corrected" total.
3. **Inspect books with missing info** -- within the healing section (or a clearly nested panel), list books from
   `GET /dashboard/incomplete-metadata/books`, optionally filtered by `field`. Each row should identify the book
   (title/authors at minimum) and link to detail and/or edit so missing fields can be fixed. Support pagination
   (paired `skip`/`take`, or infinite scroll matching the shared batch size) when `total` exceeds one page. Clearing
   the field filter lists all books missing at least one tracked field.
4. **Refresh and recover together** -- extend the existing Refresh / offline / stale / `QueryErrorState` patterns so
   summary, breakdowns, and incomplete-metadata queries remain usable; prefer one Refresh control that refetches all
   dashboard queries rather than three disconnected buttons.

Tone and layout: extend the existing numbered dashboard sections (I / II / III ...); do not turn the dashboard into a
charting library, card grid of sparklines, or a second admin page. Prefer definition lists / compact tables
consistent with current `.dashboard-metric` patterns.

## Remaining scope (file-level plan)

### 1. Schema aliases

| File | Change |
| ---- | ------ |
| `src/api/apiTypes.ts` | Export aliases for `DashboardBreakdowns`, `DashboardCountBucket`, and `DashboardIncompleteMetadata` (and reuse existing `BookList` / `BookRead` for the books drill-down). |
| `src/api/apiTypes.test.ts` | Fixture coverage for breakdown bucket shapes and incomplete-metadata required fields (including that `total_incomplete` is an independent integer). |

Regenerate OpenAPI / extend contract smoke only if those paths/schemas regress; they are already present.

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
| `src/features/dashboard/dashboardDisplay.ts` (new, if it keeps `DashboardPage` readable) | Pure helpers: incomplete-field labels (`category` → "Category", `shelf` → "Shelf", `year` → "Publication year", etc.), allowed `field` values for the filter control, safe category bucket-key display via `enumDisplayValue`, and shelf bucket labels via `formatShelfCommonNameForDisplay`. Colocate `dashboardDisplay.test.ts`. |
| Avoid | Charting dependencies, CSV export, or client-side "heal all" mutations. |

### 4. `DashboardPage` -- basic stats and healing sections

| File | Change |
| ---- | ------ |
| `src/features/dashboard/routes/DashboardPage.tsx` | Keep sections I--III on `useDashboard` data. Add **Basic stats** (or equivalent heading) driven by `useDashboardBreakdowns`: show `total_books` / `on_loan` and the three bucket lists (Title Case shelf keys). Add **Healing metadata** (or "Incomplete metadata") driven by `useDashboardIncompleteMetadata` counts plus the incomplete-books list/filter. Wire Refresh to refetch summary + breakdowns + incomplete metadata (+ active books query). Preserve offline/paused, stale, contract-warning, and `QueryErrorState` behavior; if one report query fails while summary succeeds, show a section-level error with retry rather than blanking the whole page when summary data is already visible. Link incomplete book rows to `/books/:bookId` (and optionally Edit, which already uses shelf pickers). When `total_incomplete === 0` and the unfiltered books list is empty, show a positive empty state (e.g., no cleanup needed) -- not the library-empty Add Book pattern. Implement on `/dashboard` only. |
| `src/features/dashboard/routes/DashboardPage.test.tsx` | Cover: breakdown buckets render API keys/counts; omitted zero buckets are not invented; incomplete counts render without summing into `total_incomplete`; field filter updates the books query (`field=isbn` etc.); blank/all filter omits `field`; book rows link to detail; empty healing state; section-level error recovery; Refresh triggers the new queries; existing summary / null-average / inconsistency cases stay green. |
| `src/styles/components.css` | Extend dashboard BEM classes for bucket lists and healing rows (e.g., `.dashboard-buckets`, `.dashboard-healing-list`) so new sections wrap cleanly at 320px, keep 44px targets, and reuse tokens. No new CSS framework. |

### 5. Invalidation hygiene

| File | Change |
| ---- | ------ |
| `src/api/booksQueries.ts` / `shelvesQueries.ts` | Confirm create/update/delete/restore/checkout/check-in/mark-read invalidation of `queryKeys.dashboard.all` still covers nested report keys via prefix matching, and that shelf renames including `common_name` continue to invalidate dashboard. If keys were restructured away from the `['dashboard']` prefix, update invalidation explicitly -- prefer keeping the prefix. |
| Mutation tests | Only adjust if key shape changes require it; do not broaden invalidation into unrelated domains. |

### 6. Documentation (when the feature lands)

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Note dashboard report sections on the live dashboard route (breakdowns + incomplete metadata + books drill-down); update `dashboardApi` / `dashboardQueries` / `queryKeys` / `DashboardPage` inventory. Prefer ticket presence under `docs/tickets/` over `docs/ToDo.md` when judging completion. |
| `docs/full-project-context.md` | Same dashboard report notes when that pack is kept current. |
| `docs/ToDo.md` | Mark the "Augment `/dashboard` with: Dashboard reports" checklist item done when maintainers still use that file. |

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

- The live dashboard route still shows Collection, Circulation, and Reading Record from `GET /dashboard` with
  existing null-average and inconsistency behavior.
- The dashboard shows a basic-stats section from `GET /dashboard/breakdowns` (totals plus category, shelf
  `common_name`, and creation-year buckets) without inventing zero-count buckets or recalculating totals from the
  book list.
- The dashboard shows a healing / incomplete-metadata section from `GET /dashboard/incomplete-metadata` with
  `total_incomplete` and each `missing_*` count, without treating the field counts as a summable total.
- Operators can list books with missing info via `GET /dashboard/incomplete-metadata/books`, optionally filter by
  documented `field` values, and open a book to fix metadata; blank/invalid filters are never sent.
- Soft-deleted books remain excluded (API contract); the FE does not add them back via `include_deleted`.
- Refresh / offline / error recovery cover the new queries without breaking summary UX.
- Colocated API and `DashboardPage` tests cover the new behavior; `make check` passes.
- `docs/AGENTS.md` (and ToDo / full-project context as needed) reflect the augmented dashboard.

## Plan coverage

Extends Workstream 10 (read-only dashboard) beyond the original `GET /dashboard` summary to the backend's catalog
breakdown and incomplete-metadata report surface. Completes the product UI that earlier API contract sync deferred for
dashboard reports.

## Out of scope

- Recalculating dashboard metrics from `GET /books` or loan lists.
- Chart libraries, heatmaps, "on this day", weather/quote widgets, or other V2 vision dashboards from product drafts.
- A dedicated `/admin/healing` route (keep healing on the dashboard route unless a later ticket relocates it).
- Wishlist UI, collection category filter UI, cover images, or automated bulk metadata fills.
- Shelves catalog CRUD (already `/shelves`).
- Inventing a `section` incomplete field or any query value not documented by the API.
- Changing auth, runtime config, connection bootstrap, or packaging/hardening work.
- Regenerating OpenAPI or extending contract smoke unless those paths/schemas regress (already shipped).
