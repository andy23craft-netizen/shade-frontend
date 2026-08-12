# FEAT-04 — Active collection and book details

## Objective

Let users browse the active library and understand a book's metadata and lifecycle state.

## Dependencies

FEAT-03 is complete. Do not rebuild typed route helpers, React Query hooks, query keys, mutation invalidation,
`enumDisplayValue`, request-field / date-time request utilities, connection unauthorized handling, or shared shell UI
primitives.

Reuse `useBooks` / `useBook`, `queryKeys`, `enumDisplayValue`, and shared components (`LoadingState`, `EmptyState`,
`Alert`, `AppLink`). Extend the existing read-only UI in `src/features/books/routes/BooksPage.tsx` and
`BookDetailsPage.tsx`. Product feature workflows beyond read-only browse/detail and contextual navigation belong to
later tickets.

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

- `BooksPage` (`/books`): `useBooks()` default active-only list of full `{ items, total }`, row context (title, authors,
  `status`, `is_read`, category, shelf), per-row links to `/books/:bookId`, plus loading / empty (`total === 0`) /
  error UI. Soft-deleted books are omitted server-side; do not client-filter on `deletion_date` for normal browsing.
- `BookDetailsPage` (`/books/:bookId`): `useBook(bookId)` detail with bibliographic, acquisition, lifecycle, reading,
  borrowing-stat, and audit fields; soft-deleted banner when `deletion_date` is non-null; null optionals, unknown enums
  via `enumDisplayValue`, malformed temporal strings, and date-only `YYYY-MM-DD` values shown without timezone
  day-shift; null `average_loan_days` as an explanatory fallback (not zero).
- Detail contextual navigation already gated for edit, checkout, and check-in:
  - Check Out when not soft-deleted and `status` is not `on_loan` (`/checkout?bookId=...`).
  - Check In when not soft-deleted and `status` is `on_loan` (`/checkin?bookId=...`).
  - Edit when not soft-deleted (`/books/:bookId/edit`).
- Detail `404` invalidates `queryKeys.books.all`, explains hard not-found, and offers back navigation to `/books`.
- Component tests under `BooksPage.test.tsx` and `BookDetailsPage.test.tsx` cover collection
  success/empty/loading/error, detail success, null `average_loan_days`, unknown enums, malformed dates, null
  optionals, soft-deleted (no lifecycle links), loading, detail `404` (including list invalidation), and generic detail
  errors.
- Shared loading, empty, alert, and link primitives from FEAT-01; connection `403` clearing from FEAT-02;
  `enumDisplayValue` and `src/api/dateTime.ts` request serializers from FEAT-03.

## Remaining scope

### Contextual actions still missing on detail

Registered routes already cover edit, checkout, and check-in. Finish the gated contextual entry points called for by
PLAN Workstream 3:

- Mark read when valid for the current `BookRead` (not soft-deleted; prefer unread-only so FEAT-09 does not inherit a
  misleading entry point). There is no dedicated mark-read path yet -- link only to a later-ticket destination that
  already exists in the router, or leave a clearly gated affordance that FEAT-09 will own without inventing a workflow.
- Delete when valid (not `on_loan`, not soft-deleted). Same rule: navigation or a gated affordance only; FEAT-10 owns
  delete confirmation and the API call.
- Soft-deleted detail may link toward `/admin/deleted` as a later-ticket restore destination; keep active lifecycle
  actions hidden (already done for edit / checkout / check-in).

### Resilience gaps

- Add an explicit retry affordance on collection and detail failure states (PLAN "stale, and retry states"). Prefer
  React Query `refetch` over inventing a second client. Offline / unreachable / timeout messages can reuse the existing
  `Alert` pattern; `403` stays on FEAT-02 unauthorized handling.
- Keep status and read/unread textual and semantic (not color-only); collection already shows both axes.

### Tests still required

- On-loan detail: Check Out hidden; Delete (once present) hidden; on-loan status still visible.
- Date-only fields (`YYYY-MM-DD`) assert calendar display without timezone day-shift.
- Soft-deleted vs missing detail already covered; keep those green when adding mark-read / delete / retry.

## Acceptance criteria

- On-loan books are visibly unavailable and cannot begin another checkout from contextual actions (covered by tests).
- On-loan books do not expose a delete action (once the delete entry point exists).
- Soft-deleted detail does not expose mark-read or delete entry points.
- Collection and detail failure states offer retry; detail `404` still refreshes stale collection data and offers safe
  navigation.
- Date-only values do not shift days because of timezone conversion (asserted in tests).
- `make check` passes.
- No FEAT-05 through FEAT-11 product workflows land in this ticket beyond contextual navigation links / gated
  affordances.

## Plan coverage

Workstream 3; sections 5, 7.2, 7.5, 7.8, and 10; the active-browsing portions of the product gate.
