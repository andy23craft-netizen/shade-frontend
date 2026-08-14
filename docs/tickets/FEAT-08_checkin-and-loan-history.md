# FEAT-08 — Check-in and loan history

## Objective

Finish active-loan-based check-in eligibility and selection, Field-linked check-in errors, documented conflict
messaging, and due/overdue loan-history presentation. Return active loans and present preserved borrowing history.

## Dependencies

FEAT-07 is complete (ticket file removed). CHORE-01 is complete (`loansApi.list({ bookId })`, `loansApi.get` /
`useLoan`, Check In deep-link `/checkin?bookId=...`). Reuse FEAT-03 typed helpers (`booksApi.checkin`,
`pickCheckinRequest`, `useCheckinBook`, `useLoans` / `useLoans({ bookId })`, `useLoan`, `src/api/dateTime.ts`) and
FEAT-07 checkout patterns (`ConfirmationDialog`, eligible selection, `?bookId=` deep-link with refresh, Field-linked
`422`, stale `404`/`409` refetch). Do not invent a second check-in client or simulate return with generic `PATCH`.
Reading completion is FEAT-09; edit/delete/restore is FEAT-10; dashboard metrics UI is FEAT-11.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for `POST /books/{id}/checkin`, `CheckinRequest`, success
  `BookRead`, `GET /loans`, `LoanList` / `LoanRead`, and error schemas.
- `../technical-reference/API-for-FE.md` -- behavioral guidance (optional check-in body and UTC default, conflict based
  on active loan rather than book `status` alone, soft-delete `404`, lexical loan ordering, FE vs API ownership).

### Documented contract facts still relevant

Confirm against a representative running backend `/openapi.json` before locking behavior; record drift as a blocker.

- Conflict (`409`) is based on active loan existence (`returned_at=null`), not book `status` alone. Detail string:
  `{"detail": "Book is not checked out"}`. Surface that documented detail, refetch affected book and loan data, and
  avoid unsafe resubmission.
- Soft-deleted books are not check-in eligible (`404` on check-in even when `GET /books/{id}` can still return them).
  Soft-deleted books' loans still appear in `GET /loans`.
- `GET /loans` returns the full `LoanList` (optional `book_id` filter; no pagination), ordered by stored
  `checked_out_at` text descending. That order is chronological only when clients used one consistent timestamp format;
  do not describe it as chronological when malformed or inconsistently serialized legacy values prevent that guarantee.
- Join each `book_id` to title client-side with a durable fallback when the book is missing. Missing metadata must not
  hide or crash a history row.
- Omitted / blank return time prefers omitting `returned_at` (or `{}` / `null` body) so the server UTC default applies;
  supplied values must be normalized UTC ISO 8601. (Already implemented in `checkinModel` -- keep regression coverage.)

## Current baseline

Already in place and should be reused (not rebuilt):

- Typed transport: `booksApi.checkin`, `pickCheckinRequest`, `useCheckinBook` (detail-cache write + PLAN 7.5
  invalidation), `loansApi.list` / `useLoans`, `loansApi.get` / `useLoan`, loan query keys, `dateTime.ts`, redaction
  for `borrower` / `notes`.
- `checkinModel` (`checkinFormValuesToRequest`, blank return time → omitted body, supplied values as UTC ISO 8601,
  client validation) with colocated `checkinModel.test.ts`.
- `CheckinPage` (not a placeholder): `?bookId=` deep-link via `useBook` + `useLoans({ bookId })`, optional return
  timestamp, `ConfirmationDialog` before mutate, in-flight disable via `useCheckinBook`, success navigation to detail,
  soft-deleted / non-`on_loan` warning UI, and `404`/`409` refetch with preserved return-time input. Displays borrower /
  checked-out from the first `returned_at === null` loan when present. Colocated `CheckinPage.test.tsx` covers happy
  path, soft-delete / not-on-loan warnings, blank and supplied return time, confirmation, success navigation, generic
  mutation errors, and pending disable -- not Field-linked `422` or documented `409` detail messaging.
- `LoansPage` (not a placeholder): `useLoans()` plus `useBooks()` joins; active vs returned sections from
  `returned_at` nullability; durable `Book {id}` fallback; empty / loading / retryable error states; shows `due_at`
  via `toLocaleString` / raw-string fallback. Colocated `LoansPage.test.tsx` covers those cases -- not due/overdue
  presentation or empty-active-section accessibility when only returned history exists.
- `BookDetailsPage` hides lifecycle actions for soft-deleted books and links Check In to `/checkin?bookId=...` when
  `status === 'on_loan'` only (still not active-loan gated).
- FEAT-07 `/checkout` remains the pattern to finish mirroring: eligible selection list, deep-link refresh path,
  Field-linked `422`, and documented conflict messaging.

## Remaining scope

### Check-in (`/checkin`)

- Mirror checkout's eligible selection: restrict to non-deleted books that have an active loan (`returned_at=null` from
  `useLoans()`), not merely a book `status` of `on_loan`. Visiting `/checkin` without a usable `bookId` should offer
  that selection (today it only errors when `bookId` is missing). Soft-deleted books and books without an active loan
  must not be selectable or submittable.
- Tighten deep-link and form gating to require active-loan presence from loan data (status alone is insufficient).
  Validate deep-links to soft-deleted, missing, or non-active-loan books with an accessible explanation and a refresh
  path (checkout's "Refresh eligible books" pattern).
- Tighten detail Check In eligibility to require active-loan presence (not `status === 'on_loan'` alone).
- Map check-in `422 detail[].loc` entries to fields; preserve input, focus an error summary, and link field errors
  (checkout already does this; check-in has client-side field summary only).
- On `409`, surface the documented detail `Book is not checked out`, refetch affected book and loan data, and avoid
  unsafe resubmission. Keep existing `404` refetch behavior and cover both with tests.

### Loan history (`/loans`)

- Distinguish due and overdue presentation from `due_at` and return dates without color alone. Calculate overdue state
  from date-only calendar values without timezone day shifts (`YYYY-MM-DD`); treat timestamps without inventing
  precision the API did not provide.
- Render malformed legacy temporal strings safely beyond the current `toLocaleString` / raw-string fallback where
  overdue logic needs them.
- Handle "history exists but no active loans" clearly if the empty Active section alone is insufficient for
  accessibility.
- Preserve the API's lexical `checked_out_at`-descending order when rendering (do not re-sort client-side).

## Acceptance criteria

- A non-deleted book with an active loan remains eligible even if its book `status` is inconsistent; a soft-deleted
  book or a book without an active loan is not eligible. Detail Check In reaches the working check-in flow only when
  an active loan is present.
- Visiting `/checkin` without `bookId` offers eligible selection (active loan + not soft-deleted), not only an error.
- A `404` means the selected book is missing or soft-deleted; handle with refetch and safe navigation (not as a
  successful return). Cover with tests (behavior exists; tests still missing).
- A `409` with detail `Book is not checked out` explains that no active checkout exists, refetches state, and avoids
  unsafe resubmission.
- Success displays the book as available (from returned `BookRead`) while the completed loan remains in history.
- Active, returned, due, and overdue states are understandable without color.
- Loan order preserves the API's lexical `checked_out_at`-descending response and is not described as chronological when
  malformed or inconsistently serialized legacy values prevent that guarantee.
- Date-only and timestamp behavior is tested around timezone and local-day boundaries (especially overdue derivation).
- Component/integration tests cover empty active/returned groups, success (`200` `BookRead`), field-mapped `422`,
  `404`, `409`, stale joins, network failure, and cache invalidation.
- Keep regression coverage for blank/custom return time shaping, confirmation cancel, pending disable, and missing-book
  history fallback.
- `make check` passes.

## Plan coverage

Workstream 7; sections 8 and 10; check-in, history, and borrowing-statistics outcomes.
