# FEAT-08 — Check-in and loan history

## Objective

Return active loans and present preserved active and returned borrowing history.

## Dependencies

FEAT-07 is complete (ticket file removed). CHORE-01 (update Loans API integration) should be completed before or
concurrently with this ticket -- it adds support for the `book_id` query parameter on `GET /loans`, the
`GET /loans/{id}` endpoint, and fixes the Check In routing issue in `BookDetailsPage`. Reuse FEAT-03 typed check-in
and loan helpers and mutation/cache invalidation (`booksApi.checkin`, `pickCheckinRequest`, `useCheckinBook`,
`loansApi.list` / `useLoans`, `src/api/dateTime.ts`). Reuse FEAT-07 checkout patterns (`ConfirmationDialog`,
`?bookId=` deep-link, Field-linked `422`, stale `404`/`409` refetch). Do not invent a second check-in client, and
never simulate return with generic `PATCH`. There are no create/update/delete loan HTTP endpoints; loans are created
by checkout and completed by check-in. Reading completion is FEAT-09; edit/delete/restore is FEAT-10; dashboard
metrics UI is FEAT-11.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for `POST /books/{id}/checkin`, `CheckinRequest`, success
  `BookRead`, `GET /loans`, `LoanList` (`{ items, total }`), `LoanRead`, and error schemas (`ErrorDetail`,
  `HTTPValidationError`).
- `../technical-reference/API-for-FE.md` -- behavioral guidance OpenAPI does not fully express (optional check-in body
  and UTC default, conflict based on active loan rather than book `status` alone, soft-delete `404`, lexical loan
  ordering, and FE vs API ownership of loan state).

### Documented contract facts for this ticket

Confirm against a representative running backend `/openapi.json` before locking behavior; record drift as a blocker.

- `POST /books/{id}/checkin` accepts an optional JSON body: `CheckinRequest`, explicit `null`, or an omitted body.
  Path `{id}` is any string; missing rows return `404` with string `detail`. Soft-deleted books are rejected the same
  way (`404`), even though `GET /books/{id}` can still return them and their loan history is retained.
- `CheckinRequest` has one optional nullable string: `returned_at`. Formats are not validated by the API. Request
  models ignore unknown properties.
- OpenAPI documents check-in success as `200` with `BookRead`, plus `403`, `404`, `409`, and FastAPI `422`
  (`detail[]`).
- Omitted or explicit-null `returned_at` uses current UTC on the server. Prefer omitting the property (or sending
  `{}` / `null` body) when the user leaves return time blank rather than inventing a browser timestamp or sending empty
  string. When the user supplies a value, send normalized UTC ISO 8601 so borrowing-statistics parsing remains reliable.
- Success completes the active loan (`returned_at` set) and clears book loan fields on the returned `BookRead`
  (`status` available, borrower / `datetime_loaned_out` cleared as the API defines). Do not rename transport properties
  in the UI layer's data binding.
- Conflict (`409`) is based on active loan existence (`returned_at=null`), not book `status` alone. Detail string:
  `{"detail": "Book is not checked out"}`. Explain stale state, refetch affected book and loan data, and avoid unsafe
  resubmission.
- Soft-delete and loan axes are independent: deleting an on-loan book leaves its active loan open; restore the book
  before check-in can complete that loan. Do not offer check-in for soft-deleted books, and do not use `PATCH` to clear
  `status` / `borrower` / `datetime_loaned_out`.
- `GET /loans` returns `LoanList` `{ items, total }` -- the full result set with no filtering or pagination.
  Soft-deleted books' historical (and still-open) loans remain in this list. Auth failure is `403`; there is no
  loan-specific `404`.
- `LoanRead` required fields: `id`, `book_id`, `borrower`, `checked_out_at`, `created_date`, `last_updated_date`.
  Optional nullable: `due_at`, `notes`, `returned_at`. Active loan ⇒ `returned_at: null`.
- Loans are ordered by stored `checked_out_at` text descending. That order is chronological only when clients used one
  consistent timestamp format; do not describe it as chronological when malformed or inconsistently serialized legacy
  values prevent that guarantee.
- Join each `book_id` to title (and related display metadata) client-side from active-book data, with a durable
  fallback when the book is soft-deleted, missing, or otherwise unavailable. Missing book metadata must not hide or
  crash a history row.
- Recommended return flow: FE selects an eligible book or active loan → `POST .../checkin` → display returned
  `BookRead` state. Temporal fields on the wire are plain strings; the API does not validate format, timezone, or
  ordering. Malformed stored loan timestamps can later surface as unhandled `500` on borrowing statistics.

## Current baseline

Already in place and should be reused (not rebuilt):

- Typed transport: `createBooksApi().checkin` (optional body; omit when `request` is `undefined`), `CheckinRequest` /
  `pickCheckinRequest`, and `useCheckinBook` (writes returned `BookRead` into the detail cache and invalidates books
  list/detail, loans, and dashboard per PLAN 7.5 on success).
- Typed loans API: `createLoansApi().list` / `useLoans` (`GET /loans` with optional `bookId` filter), `loansApi.get` /
  `useLoan` (`GET /loans/{id}`), query keys `queryKeys.loans.all`, `queryKeys.loans.list(bookId)`, and
  `queryKeys.loans.detail(id)`. These were added/updated in CHORE-01.
- Date/time helpers in `src/api/dateTime.ts` with colocated unit tests; checkout form conversion coverage lives in
  `src/features/loans/checkoutModel.test.ts` (reuse the same UTC ISO / date-only patterns for optional return time).
- Redaction already excludes `borrower` and `notes` from diagnostics (`src/api/apiRedaction.ts`).
- Shell nav links to registered `/checkin` and `/loans` (`routeMetadata.checkin` / `routeMetadata.loans`);
  `CheckinPage` and `LoansPage` are still `RoutePlaceholder`s.
- Book details (`BookDetailsPage`) hides lifecycle actions for soft-deleted books and shows Check In when
  `status === 'on_loan'`. CHORE-01 fixed the Check In link to use `/checkin?bookId=...` (the registered route) instead
  of the incorrect `/books/:bookId/checkin`. Eligibility should be tightened to require an active loan
  (`returned_at=null` from loan data) rather than relying solely on book `status`.
- FEAT-07 `/checkout` is the pattern to mirror: eligible selection, `?bookId=` deep-link with refresh, confirmation
  before mutate, Field-linked `422`, and `404`/`409` stale-state refetch with preserved form input.

## Remaining scope

### Check-in (`/checkin`)

- Replace `CheckinPage` placeholder: selection restricted to non-deleted books that have an active loan
  (`returned_at=null` from `useLoans()`), not merely a book `status` of `on_loan`. Soft-deleted and books without an
  active loan must not be selectable or submittable through the current UI.
- The detail Check In link routing was fixed in CHORE-01 (now uses `/checkin?bookId=...`). Validate deep-links to
  soft-deleted, missing, or non-active-loan books with an accessible explanation and refresh path; tighten detail
  eligibility display logic to require active-loan presence (not `status` alone).
- Support optional return timestamp with review/confirmation (`ConfirmationDialog`), in-flight duplicate prevention,
  success feedback, and accessible validation. Serialize blank return time as omitted / `{}` / `null` body so the
  server default is used. Call `useCheckinBook` for the mutation (do not add a parallel client).
- Map check-in `422 detail[].loc` entries to fields; preserve input, focus an error summary, and link field errors.
- On `404` or `409`, explain stale state, refetch affected book and loan data, and avoid unsafe resubmission. Treat the
  documented `409` detail as the user-facing conflict message.
- Keep loan notes out of feature logs and diagnostics (reuse existing redaction).

### Loan history (`/loans`)

- Replace `LoansPage` placeholder: implement from `useLoans()` (all loans) plus client-side joins to book metadata
  (`useBooks` and a durable fallback for soft-deleted / missing books). Optionally use `useLoans({ bookId })` for
  book-specific views if that UI is added.
- Derive active and returned views from `returned_at` nullability. The API supports an optional `book_id` query
  parameter (now available via CHORE-01), but full loan-history pagination is not supported by the backend.
- Preserve the API's lexical `checked_out_at`-descending order when rendering.
- Distinguish active and returned loans and derive due/overdue presentation from `due_at` and return dates without
  color alone.
- Render malformed legacy temporal strings safely. Calculate overdue state from date-only calendar values without
  timezone day shifts (`YYYY-MM-DD`); treat timestamps without inventing precision the API did not provide.
- Handle empty history (`total === 0`), no active loans, missing joined books, stale resources, offline/retryable
  failures, and `403` via existing unauthorized handling.

## Acceptance criteria

- A non-deleted book with an active loan remains eligible even if its book `status` is inconsistent; a soft-deleted
  book or a book without an active loan is not eligible. Detail Check In link uses `/checkin?bookId=...` (fixed in
  CHORE-01) and reaches the working check-in flow.
- Empty return time omits `returned_at` (or sends `{}` / `null` body) so the server default is used rather than a
  browser-generated timestamp.
- Submitted custom return timestamps are normalized UTC ISO 8601 values; arbitrary strings are never sent to the API.
- A confirmation step runs before `POST /books/{id}/checkin`; cancel leaves form values intact and does not mutate.
- A `404` means the selected book is missing or soft-deleted; handle with refetch and safe navigation (not as a
  successful return).
- A `409` with detail `Book is not checked out` explains that no active checkout exists, refetches state, and avoids
  unsafe resubmission.
- Success displays the book as available (from returned `BookRead`) while the completed loan remains in history.
- Active, returned, due, and overdue states are understandable without color.
- Loan order preserves the API's lexical `checked_out_at`-descending response and is not described as chronological when
  malformed or inconsistently serialized legacy values prevent that guarantee.
- Missing book metadata does not hide or crash a loan-history record.
- Date-only and timestamp behavior is tested around timezone and local-day boundaries.
- Duplicate clicks cause one mutation.
- Component/integration tests cover empty active/returned groups, success (`200` `BookRead`), field-mapped `422`,
  `404`, `409`, stale joins, network failure, and cache invalidation.
- `make check` passes.

## Plan coverage

Workstream 7; sections 8 and 10; check-in, history, and borrowing-statistics outcomes.
