# FEAT-08 — Check-in and loan history

## Objective

Return active loans and present preserved active and returned borrowing history.

## Dependencies

FEAT-07.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for `POST /books/{id}/checkin`, `CheckinRequest`, success
  `BookRead`, `GET /loans`, `LoanList` (`{ items, total }`), `LoanRead`, and error schemas (`ErrorDetail`,
  `HTTPValidationError`).
- `../technical-reference/API-for-FE.md` -- behavioral guidance OpenAPI does not fully express (optional check-in body
  and UTC default, conflict based on active loan rather than book `status` alone, soft-delete `404`, lexical loan
  ordering, and FE vs API ownership of loan state).

Reuse FEAT-03 typed check-in and loan helpers and mutation/cache invalidation. Do not invent a second check-in client,
and never simulate return with generic `PATCH`. There are no create/update/delete loan HTTP endpoints; loans are created
by checkout and completed by check-in.

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
- `GET /loans` returns `LoanList` `{ items, total }` -- the full result set with no filtering or pagination. Soft-deleted
  books' historical (and still-open) loans remain in this list. Auth failure is `403`; there is no loan-specific `404`.
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

## Scope

### Check-in (`/checkin`)

- Implement `/checkin` with selection restricted to non-deleted books that have an active loan (`returned_at=null`),
  not merely a book `status` of `on_loan`. Soft-deleted and books without an active loan must not be selectable or
  submittable through the current UI.
- Add a detail-page entry point for eligible books, preselecting that book safely (reject deep-links to soft-deleted,
  missing, or non-active-loan books with an accessible explanation and refresh path).
- Support optional return timestamp with review/confirmation, in-flight duplicate prevention, success feedback, and
  accessible validation. Serialize blank return time as omitted / `{}` / `null` body so the server default is used.
- On success, update the returned `BookRead` in cache and invalidate collection, detail, loans, and dashboard queries
  per FEAT-03 / PLAN 7.5.
- On `404` or `409`, explain stale state, refetch affected book and loan data, and avoid unsafe resubmission. Treat the
  documented `409` detail as the user-facing conflict message.
- Keep loan notes out of logs and diagnostics where they may appear on joined loan context.

### Loan history (`/loans`)

- Implement `/loans` from `GET /loans` plus client-side joins to book metadata.
- Derive active and returned views from `returned_at` nullability; do not invent server-side filter or pagination
  parameters.
- Preserve the API's lexical `checked_out_at`-descending order when rendering.
- Distinguish active and returned loans and derive due/overdue presentation from `due_at` and return dates without
  color alone.
- Render malformed legacy temporal strings safely. Calculate overdue state from date-only calendar values without
  timezone day shifts (`YYYY-MM-DD`); treat timestamps without inventing precision the API did not provide.
- Handle empty history (`total === 0`), no active loans, missing joined books, stale resources, offline/retryable
  failures, and `403` via existing unauthorized handling.

## Acceptance criteria

- A non-deleted book with an active loan remains eligible even if its book `status` is inconsistent; a soft-deleted
  book or a book without an active loan is not eligible.
- Empty return time omits `returned_at` (or sends `{}` / `null` body) so the server default is used rather than a
  browser-generated timestamp.
- Submitted custom return timestamps are normalized UTC ISO 8601 values; arbitrary strings are never sent to the API.
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
- Component/integration tests cover empty active/returned groups, success (`200` `BookRead`), `404`, `409`, stale
  joins, network failure, and cache invalidation.
- `make check` passes.

## Plan coverage

Workstream 7; sections 8 and 10; check-in, history, and borrowing-statistics outcomes.
