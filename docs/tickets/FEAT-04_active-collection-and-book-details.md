# FEAT-04 — Active collection and book details

## Objective

Let users browse the active library and understand a book's metadata and lifecycle state.

## Dependencies

FEAT-03 is complete. Do not rebuild typed route helpers, React Query hooks, query keys, mutation invalidation,
`enumDisplayValue`, request-field / date-time request utilities, connection unauthorized handling, or shared shell UI
primitives.

Reuse `useBooks` / `useBook`, `queryKeys`, `enumDisplayValue`, and shared components (`LoadingState`, `EmptyState`,
`Alert`, `AppLink`). Replace the `RoutePlaceholder` bodies in `src/features/books/routes/BooksPage.tsx` and
`BookDetailsPage.tsx`. Product feature workflows beyond read-only browse/detail belong to later tickets.

## Explicitly out of scope (owned by later tickets)

| Later ticket | Owns (do not pull into FEAT-04)                                            |
|--------------|----------------------------------------------------------------------------|
| FEAT-05      | Book form model, create/lookup UI, ISBN checksums, form date serialization |
| FEAT-07      | Checkout UI and borrower/notes collection                                  |
| FEAT-08      | Check-in UI and loan-history UI                                            |
| FEAT-09      | Mark-read / reading-edit UI                                                |
| FEAT-10      | Edit/delete/restore/backup UI and admin deleted list                       |
| FEAT-11      | Dashboard page UI                                                          |

Contextual links may navigate to those routes when valid for the current `BookRead`; do not implement those workflows
here.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for `GET /books`, `GET /books/{id}`, `BookList` (`{ items,
  total }`), `BookRead`, and enums (`Status`, `Category`, `Shelf`).
- `../technical-reference/API-for-FE.md` -- behavioral guidance OpenAPI does not fully express (soft-delete visibility,
  independent loan/reading/delete axes, borrow-stat semantics, and temporal-string caveats).

This ticket is read-only against the API. Do not call checkout, check-in, mark-read, `PATCH`, `DELETE`, or restore here.

## Current baseline

Already in place and should be extended, not replaced:

- `useBooks({ includeDeleted?: boolean })` defaults to active-only (`include_deleted=false`). Soft-deleted books are
  omitted server-side; do not client-filter on `deletion_date` for normal browsing.
- `useBook(id)` loads `GET /books/{id}` (path `{id}` is any string; missing rows are `404`; soft-deleted rows remain
  `200` with non-null `deletion_date`).
- `enumDisplayValue` for known vs unknown enum strings with a neutral fallback.
- `src/api/dateTime.ts` request serializers (`YYYY-MM-DD` / UTC ISO 8601). Display formatting that avoids timezone
  day-shift for date-only strings is still this ticket's responsibility.
- Shared loading, empty, alert, and link primitives from FEAT-01; connection `403` clearing from FEAT-02.

## Remaining scope

### Collection (`/books`)

- Implement the title-ordered active collection from `BookList` via `useBooks()` (default active-only).
- Render the full `{ items, total }` result set. There is no pagination; do not invent client paging assumptions.
- Show enough row context to browse (at least title, authors, `status`, and read/unread via `is_read`) and link each row
  to `/books/:bookId`.

### Detail (`/books/:bookId`)

- Load with `useBook(bookId)`. Present useful `BookRead` fields without renaming transport properties in the UI layer's
  data binding:
  - Bibliographic: `title`, `authors`, `isbn13`, `publisher`, `publication_date`, `pages`, `category`, `shelf`, `tags`
  - Acquisition: `purchase_date`, `purchase_price`, `acquisition_source`, `notes`
  - Lifecycle: `status`, `borrower`, `datetime_loaned_out`, `deletion_date`
  - Reading: `is_read`, `completion_date`, `rating`, `review`
  - Borrowing stats: `times_borrowed`, `last_borrowed_at`, `average_loan_days`
  - Audit: `id`, `creation_date`, `updated_date`
- Distinguish `Status` values textually and semantically: `unknown`, `available`, `on_loan`, `missing`, `display_only`,
  `reserved`, and `reading`. Treat `is_read` as an independent reading axis (not a `Status` value).
- Treat non-null `deletion_date` as soft-deleted: explain retained history, hide active lifecycle actions, and offer
  safe navigation back to the active collection (and toward admin restore only as a later-ticket destination if linked).
- Show borrow stats with API semantics: `times_borrowed` counts loan rows; `last_borrowed_at` is the stored checkout
  timestamp the API returns; `average_loan_days` is `null` when no returned loans exist -- never display that as zero.
- Add contextual links for edit, checkout, check-in, mark read, and delete only when valid for the current `BookRead`:
  - No checkout when `status` is `on_loan` or the book is soft-deleted.
  - No delete when `status` is `on_loan` (backend deletion would leave the active loan open until restore) or when
    already soft-deleted.
  - No check-in / mark-read entry points when soft-deleted (those routes return `404` for deleted books).
  - Prefer dedicated later-ticket routes over implying that generic `PATCH` can drive loan or delete state.

### Resilience and formatting

- Implement loading, empty (`total === 0`), stale, retry, offline, `403` (via existing unauthorized handling), detail
  `404`, and soft-deleted-detail states.
- On detail `404`, refresh stale collection data (invalidate via existing `queryKeys.books` prefixes) and offer safe
  navigation (the book is gone from the API, not merely soft-deleted).
- Format safely: null optionals, unknown enum values (via `enumDisplayValue`), long content, malformed temporal strings,
  date-only values as calendar dates without timezone day-shift (`YYYY-MM-DD`), and timestamps without inventing
  precision the API did not provide. Temporal fields are plain strings on the wire; the API does not validate format.

## Acceptance criteria

- Deleted books never appear in normal collection browsing (`useBooks()` / `GET /books` default).
- Soft-deleted detail fetched by id renders as deleted (non-null `deletion_date`), not as a hard not-found.
- On-loan books are visibly unavailable and cannot begin another checkout from contextual actions.
- On-loan books do not expose a delete action.
- Null `average_loan_days` shows an explanatory fallback rather than zero.
- A detail `404` refreshes stale collection data and offers safe navigation.
- Status and read/unread are conveyed textually and semantically, not by color alone.
- Detail links and back navigation work at narrow and wide widths.
- API success and every relevant failure/empty state have component or integration tests.
- Tests cover nullable borrowing statistics, malformed temporal strings, unknown `Status` / `Category` / `Shelf`
  fallbacks, and soft-deleted vs missing detail.
- Date-only values do not shift days because of timezone conversion.
- `make check` passes.
- No FEAT-05 through FEAT-11 product workflows land in this ticket beyond contextual navigation links.

## Plan coverage

Workstream 3; sections 5, 7.2, 7.5, 7.8, and 10; the active-browsing portions of the product gate.
