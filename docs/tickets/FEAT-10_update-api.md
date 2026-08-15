# FEAT-10 -- Update frontend for backend API contract changes

## Objective

Keep every shipped product flow working against the updated backend contract already checked in under
`docs/technical-reference/openapi.json` and `docs/technical-reference/API-for-FE.md`. Sync generated types and the
typed API layer, close behavioral gaps that the new contract introduces for existing screens (especially checkout
`412` for `display_only`), and leave new wishlist / dashboard-report product UI for later tickets.

This ticket is **not** the historical FEAT-10 (edit, soft delete/restore, deleted admin, backup). That work is
complete and its ticket file was removed. This file reuses the FEAT-10 id for API-contract follow-up only.

## Dependencies

FEAT-01 through FEAT-11 and CHORE-01 are complete. Reuse the FEAT-03 typed client, query keys, mutation invalidation,
and redaction helpers. Do not invent lifecycle behavior with generic `PATCH`. Do not pull FEAT-12 operational
hardening, FEAT-13 journey automation, FEAT-14 CI packaging, FEAT-15 Podman, FEAT-16 release artifacts, FEAT-17 About
homepage, or a full wishlists / incomplete-metadata product surface into this ticket.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for paths, methods, status codes, request/response schemas,
  enums, and nullability (OpenAPI 3.1; LibraryV2 `0.2.0`).
- `../technical-reference/API-for-FE.md` -- behavioral guidance OpenAPI does not fully express (auth, CORS, error
  meanings, list filters/sort defaults, `display_only` checkout `412`, dashboard report endpoints, wishlists, backup
  download).

Confirm against a representative running backend `/openapi.json` before locking transport types; record drift as a
blocker rather than inventing frontend semantics.

### Contract deltas that matter for existing product UI

Additive paths (do not call from product UI in this ticket, but generated types and contract smoke must know them):

- `GET /dashboard/breakdowns`
- `GET /dashboard/incomplete-metadata`
- `GET /dashboard/incomplete-metadata/books`
- `GET` / `POST /wishlists`
- `PATCH` / `DELETE /wishlists/{wishlist_id}`
- `GET` / `POST /wishlists/{wishlist_id}/books`

Existing-route behavior changes:

| Area | Change | Impact on current FE |
| ---- | ------ | -------------------- |
| Checkout | New **412** `{"detail": "Book is display only"}` when `status=display_only` | Eligibility already requires `status === 'available'`, but deep-link / stale races can still hit `412`. `CheckoutPage` today only special-cases `404` / `409` / `422`; `412` falls through to a generic message and does not refetch. |
| Checkout guidance | FE may offer another copy/edition via `GET /books?isbn=` and/or `author` + `title` filters when checkout is blocked | ISBN Find already uses `isbn`. Author/title list filters are not wired in `booksApi.list` yet. |
| `GET /books` filters | Optional `author`, `title` (case-insensitive substring) and `category` (exact enum); empty/whitespace `isbn` / `author` / `title` → **400** | Existing callers omit empty `isbn` today. New optional params must omit blank/whitespace the same way. Category filter UI is deferred (see Out of scope). |
| `GET /books` sort | Allowed `sortBy` now includes `shelf` (lexical on shelf codes). Default remains `author` / `asc` | Collection already defaults to author ascending. Shelf is not offered in sort controls yet. |
| List pagination | Wishlists and incomplete-metadata book lists also use paired `skip`/`take` | No current FE caller; preserve the existing paired-param rule wherever pagination is sent. |
| Core book/loan/dashboard schemas | `BookRead` / `BookCreate` / `BookUpdate` / `LoanRead` / `DashboardSummary` field sets unchanged in the latest doc refresh | Existing forms and displays should typecheck after regenerate; do not invent schema fields. |

## Current baseline

Already in place and should be reused (not rebuilt):

- `yarn api:generate` / `yarn api:check` from `docs/technical-reference/openapi.json` into
  `src/api/generated/openapi.ts` (currently stale relative to the updated OpenAPI -- missing wishlist and dashboard
  report paths, and checkout `412`).
- Typed helpers: `booksApi`, `loansApi`, `dashboardApi.get` (`GET /dashboard` only), `healthApi`, `backupApi`,
  aggregated by `createApi`.
- React Query hooks and PLAN.md 7.5 invalidation for books / loans / dashboard.
- Checkout eligibility: `deletion_date === null` and `status === 'available'` on `CheckoutPage`; detail "Check Out"
  gated the same way. Soft-deleted / non-available books are not offered.
- ISBN Find on `/checkout` via `useBooks({ isbn })` / `compactIsbnForListFilter` (never lookup for selection).
- Collection sort via `booksListModel` (`author` | `title` | `creationDate`, default author ascending).
- `scripts/contractSmoke.test.ts` asserts an exact OpenAPI path list that still omits the new dashboard and wishlist
  paths -- regenerate alone will fail this smoke until the expected list is updated.
- Shared `ApiError` mapping: `412` is currently a generic `http` kind with server `detail` preserved in `message`
  when present; no checkout-specific handling.

## Out of scope

Leave these for later product tickets (see `docs/ToDo.md` and future feature docs):

- Wishlists product UI, routes, navigation, or membership management.
- Dashboard breakdown charts, incomplete-metadata cleanup UI, or relocating `/` (FEAT-17).
- Collection category filter controls on `/books` (API supports `category`; product filter UI is separate).
- New product features that only become possible because the API grew (do not expand MVP).

## Remaining scope (file-level plan)

### 1. Regenerate and lock the OpenAPI TypeScript contract

| File | Change |
| ---- | ------ |
| `src/api/generated/openapi.ts` | Regenerate with `yarn api:generate`. Do not hand-edit. Expect new path entries for dashboard report and wishlist routes, new schemas (`DashboardBreakdowns`, `DashboardCountBucket`, `DashboardIncompleteMetadata`, wishlist types / `WishlistBookStatus`), and checkout responses including `412`. |
| `scripts/contractSmoke.test.ts` | Extend `expectedPaths` to include every path in the checked-in OpenAPI (add the six new dashboard/wishlist paths; keep existing ones). Keep the live-backend drift note; do not invent a live fetch requirement here. |
| `src/api/apiTypes.ts` | Export aliases only for schemas this ticket's helpers/UI need. Minimum: keep existing book/loan/dashboard/health aliases compiling. Optionally add dashboard-report and wishlist aliases only if a typed helper in this ticket imports them; otherwise leave unused aliases for a later feature ticket. |
| `src/api/apiTypes.test.ts` | Adjust only if alias exports or fixture shapes change after regenerate. |

### 2. Typed books list helpers -- new query params without breaking callers

| File | Change |
| ---- | ------ |
| `src/api/booksApi.ts` | Extend `ListBooksOptions` with optional `author?: string`, `title?: string`, and `category?: string` (or `Category`). Serialize to `author`, `title`, and `category` query params. Omit each when `undefined`, `''`, or whitespace-only (same rule as `isbn`) so the FE never triggers documented **400** empty-filter errors. Preserve existing `includeDeleted` / `isbn` / `skip` / `take` / `sortBy` / `sortOrder` behavior. Accept `sortBy: 'shelf'` as a string the same way other sort keys are passed (no special casing required in the helper). |
| `src/api/queryKeys.ts` | Include optional `author`, `title`, and `category` in `books.list` and `books.infiniteList` key objects when present (mirror the `isbn` omit-empty pattern) so filtered caches do not collide. |
| `src/api/booksQueries.ts` | Thread the new optional filters through `useBooks` / `useInfiniteBooks` into `booksApi.list` and query keys. Do not change default list behavior when filters are omitted. |
| `src/api/booksApi.test.ts` | Cover: `author` / `title` / `category` serialization; omitting blank/whitespace filters; composition with `isbn`, pagination, and sort; existing isbn-only and unfiltered cases still pass. |
| `src/api/booksQueries.test.tsx` / `src/api/queryKeys` coverage | Assert query keys distinguish filtered lists and that hooks forward the new options. |

### 3. Checkout `412` (`display_only`) -- keep checkout working under the new contract

| File | Change |
| ---- | ------ |
| `src/features/loans/routes/CheckoutPage.tsx` | Keep eligibility as active + `status === 'available'` (so `display_only` is never offered in the selector). In `handleCheckoutError`, treat **412** like a stale-state conflict: refetch eligible books/loans, preserve borrower/optional fields, and show a clear message based on `Book is display only` (do not invent a different status code). For deep-linked / selected books that are `display_only` before mutate, reuse the existing non-eligible warning path and mention display-only explicitly if status is shown. Optionally, when checkout is blocked for display-only (or after `412`), offer alternate copies/editions using existing ISBN Find and/or new `author`+`title` list filters, excluding the current book and preferring `status=available` -- keep this lightweight; do not build a general catalog search UI. |
| `src/features/loans/routes/CheckoutPage.test.tsx` | Add coverage for: `display_only` not listed as eligible; deep-link / ineligible messaging for `display_only`; mutate `412` refreshes eligible state, preserves form input, and surfaces the display-only detail; existing `404` / `409` / `422` cases unchanged. |
| `src/api/booksApi.conflicts.test.ts` (and/or `booksApi.test.ts`) | Assert `POST .../checkout` **412** bodies surface as `ApiError` with `status: 412` and the documented detail string (same pattern as existing `409` coverage). |
| `src/features/books/routes/BookDetailsPage.tsx` | Confirm "Check Out" remains gated to active + `available` only (no link for `display_only`). Update copy only if the detail page currently implies every non-loaned book can be checked out. |
| `src/features/books/routes/BookDetailsPage.test.tsx` | Assert no Check Out action when `status === 'display_only'`. |

### 4. Collection sort alignment for `sortBy=shelf` (API now allows it)

| File | Change |
| ---- | ------ |
| `src/features/books/booksListModel.ts` | Add `'shelf'` to `BookSortBy`, `SORT_BY_VALUES`, and `sortByLabel` (e.g., `"Shelf"`). Keep `DEFAULT_SORT_BY = 'author'` and `DEFAULT_SORT_ORDER = 'asc'` to match the API default. |
| `src/features/books/components/BooksListControls.tsx` | Offer Shelf in the sort-by select (labels come from `sortByLabel`). |
| `src/features/books/booksListModel.test.ts` / `BooksPage.test.tsx` | Cover parsing, defaulting, URL persistence, and label for `sortBy=shelf`. |
| `src/features/books/routes/BooksPage.tsx` | No structural change beyond consuming the widened sort type through existing URL/search-param wiring. |

Do **not** add category filter controls on `/books` in this ticket.

### 5. Dashboard and wishlist API surfaces -- regenerate only; no product UI

| File | Change |
| ---- | ------ |
| `src/api/dashboardApi.ts` | Leave `get()` on `GET /dashboard` as the only dashboard helper used by `DashboardPage`. Do not add breakdown / incomplete-metadata helpers unless a later ticket needs them. |
| `src/api/api.ts` | Do not add a `wishlists` aggregate in this ticket. |
| New `wishlistsApi.ts` / wishlist routes / nav | Out of scope. |

If `yarn api:generate` forces temporary unused generated types, that is fine; do not create dead feature modules only
to "use" them.

### 6. Error presentation and docs hygiene

| File | Change |
| ---- | ------ |
| `src/api/apiErrors.ts` / `apiErrors.test.ts` | No new `ApiErrorKind` is required for `412` (keep `http`). Optionally special-case `formatApiQueryError` for status `412` only if page-level messaging needs a stable generic string; prefer preserving server `detail` and handling copy in `CheckoutPage`. |
| `src/api/apiClient.test.ts` | Optional: one assertion that a `412` JSON error maps to `ApiError` kind `http` with detail preserved (mirrors existing `404` / `409` coverage). |
| `docs/AGENTS.md` | After implementation: note that generated OpenAPI types match the wishlist / dashboard-report paths; document checkout `412` / `display_only` frontend handling; list `author` / `title` / `category` list filters and `sortBy=shelf` where the inventory describes `booksApi` / collection sort. Mark this ticket complete (or remove the file per project convention when done). Do not claim wishlist or incomplete-metadata product UI shipped. |
| `docs/ToDo.md` | Optional checklist line for this ticket if maintainers still use that file; prefer ticket presence under `docs/tickets/` as the source of truth. |

### 7. Verification matrix (existing flows must still pass)

Re-run or extend tests so these shipped flows remain green against the regenerated contract:

- Connection / health bootstrap (`ConnectionProvider` tests)
- Collection infinite list + sort URL params (`BooksPage`)
- Book detail action gating (checkout / check-in / mark-read / edit / delete)
- Create + ISBN lookup + scanner handoff (`NewBookPage`, scanning tests)
- Edit / delete / restore / backup (FEAT-10 historical flows)
- Checkout (including ISBN Find) and check-in / loans
- Mark-read / reading edit
- Dashboard summary (`GET /dashboard` only)
- `scripts/contractSmoke.test.ts` and `yarn api:check`

## Acceptance criteria

- `yarn api:generate` output is committed and `yarn api:check` is clean against `docs/technical-reference/openapi.json`.
- `scripts/contractSmoke.test.ts` expects the full checked-in OpenAPI path set, including new dashboard and wishlist
  paths.
- Existing product routes compile and pass tests without calling wishlist or dashboard-report endpoints.
- `booksApi.list` / `useBooks` / `useInfiniteBooks` can pass `author`, `title`, and `category`; blank/whitespace
  values are never sent.
- `/books` can sort by shelf via the existing sort controls; default sort remains author ascending.
- Checkout never offers `display_only` books as eligible; a `412` checkout response refreshes stale state, preserves
  form input, and shows an understandable display-only message (server detail acceptable).
- Detail "Check Out" stays unavailable for `display_only` books.
- No wishlist routes, nav items, or incomplete-metadata dashboard UI ship in this ticket.
- Lifecycle operations still use dedicated endpoints (never simulate restore / checkout / check-in / mark-read with
  generic `PATCH`).
- `make check` passes.

## Plan coverage

Backend contract sync for shipped FEAT-01 through FEAT-11 flows; defensive handling of new checkout `412` and expanded
`GET /books` query surface. Explicitly excludes new product surfaces that the backend now enables (wishlists,
dashboard reports, category filter UX) so those can be ticketed separately.
