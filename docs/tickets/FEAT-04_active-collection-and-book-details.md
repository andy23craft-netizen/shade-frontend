# FEAT-04 — Active collection and book details

## Objective

Let users browse the active library and understand a book's metadata and lifecycle state.

## Dependencies

FEAT-03.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for `GET /books`, `GET /books/{id}`, `BookList`
  (`{ items, total }`), `BookRead`, and enums (`Status`, `Category`, `Shelf`).
- `../technical-reference/API-for-FE.md` -- behavioral guidance OpenAPI does not fully express (soft-delete visibility,
  independent loan/reading/delete axes, borrow-stat semantics, and temporal-string caveats).

This ticket is read-only against the API. Contextual links may navigate to later workflows; do not call checkout,
check-in, mark-read, `PATCH`, `DELETE`, or restore here.

## Scope

### Collection (`/books`)

- Implement the title-ordered active collection from `BookList` using `GET /books` with its default
  `include_deleted=false`. Soft-deleted books are omitted server-side; do not client-filter on `deletion_date` for
  normal browsing.
- Render the full `{ items, total }` result set. There is no pagination; do not invent client paging assumptions.
- Show enough row context to browse (at least title, authors, `status`, and read/unread via `is_read`) and link each
  row to `/books/:bookId`.

### Detail (`/books/:bookId`)

- Load with `GET /books/{id}`. Path `{id}` is any string; missing rows return `404` with string `detail`. Soft-deleted
  books remain readable (`200` with non-null `deletion_date`).
- Present useful `BookRead` fields without renaming transport properties in the UI layer's data binding:
  - Bibliographic: `title`, `authors`, `isbn13`, `publisher`, `publication_date`, `pages`, `category`, `shelf`, `tags`
  - Acquisition: `purchase_date`, `purchase_price`, `acquisition_source`, `notes`
  - Lifecycle: `status`, `borrower`, `datetime_loaned_out`, `deletion_date`
  - Reading: `is_read`, `completion_date`, `rating`, `review`
  - Borrowing stats: `times_borrowed`, `last_borrowed_at`, `average_loan_days`
  - Audit: `id`, `creation_date`, `updated_date`
- Distinguish `Status` values textually and semantically: `unknown`, `available`, `on_loan`, `missing`,
  `display_only`, `reserved`, and `reading`. Treat `is_read` as an independent reading axis (not a `Status` value).
- Treat non-null `deletion_date` as soft-deleted: explain retained history, hide active lifecycle actions, and offer
  safe navigation back to the active collection (and toward admin restore only as a later-ticket destination if linked).
- Show borrow stats with API semantics: `times_borrowed` counts loan rows; `last_borrowed_at` is the stored checkout
  timestamp the API returns; `average_loan_days` is `null` when no returned loans exist -- never display that as zero.
- Add contextual links for edit, checkout, check-in, mark read, and delete only when valid for the current
  `BookRead`:
  - No checkout when `status` is `on_loan` or the book is soft-deleted.
  - No delete when `status` is `on_loan` (backend deletion would leave the active loan open until restore) or when
    already soft-deleted.
  - No check-in / mark-read entry points when soft-deleted (those routes return `404` for deleted books).
  - Prefer dedicated later-ticket routes over implying that generic `PATCH` can drive loan or delete state.

### Resilience and formatting

- Implement loading, empty (`total === 0`), stale, retry, offline, `403` (via existing unauthorized handling), detail
  `404`, and soft-deleted-detail states.
- On detail `404`, refresh stale collection data and offer safe navigation (the book is gone from the API, not merely
  soft-deleted).
- Format safely: null optionals, unknown enum values, long content, malformed temporal strings, date-only values as
  calendar dates without timezone day-shift (`YYYY-MM-DD`), and timestamps without inventing precision the API did not
  provide. Temporal fields are plain strings on the wire; the API does not validate format.

## Acceptance criteria

- Deleted books never appear in normal collection browsing (`GET /books` default).
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

## Plan coverage

Workstream 3; sections 5, 7.2, 7.5, 7.8, and 10; the active-browsing portions of the product gate.
