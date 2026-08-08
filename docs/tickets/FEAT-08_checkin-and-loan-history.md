# FEAT-08 — Check-in and loan history

## Objective

Return active loans and present preserved active and returned borrowing history.

## Dependencies

FEAT-07.

## Contract constraints

The API stores loan timestamps as unvalidated strings, orders loans lexically by `checked_out_at`, and checks in based on
an active loan record rather than book status alone. Send custom return timestamps as normalized UTC ISO 8601 values.

## Scope

- Implement `/checkin` with selection restricted to non-deleted books that have an active loan (`returned_at=null`), not
  merely a book status of `on_loan`.
- Support optional return timestamp; omission or explicit `null` uses the API's current UTC time, while a custom value
  is normalized UTC ISO 8601.
- Use only `POST /books/{id}/checkin`; never simulate return with generic `PATCH`.
- Implement `/loans` using `GET /loans` and active-book data.
- Derive active and returned views from `returned_at` nullability. The endpoint has no filtering or pagination.
- Join each `book_id` to a title client-side with a durable fallback when a book is deleted or unavailable.
- Distinguish active and returned loans and derive due/overdue presentation from due and return dates.
- Render malformed legacy temporal strings safely. Calculate overdue state from date-only calendar values without
  timezone day shifts.
- Refresh book, loan, detail, and dashboard data after return.
- Handle empty history, no active loans, missing joined books, stale resources, and retryable failures.

## Acceptance criteria

- A non-deleted book with an active loan remains eligible even if its book status is inconsistent; a deleted book or a
  book without an active loan is not eligible.
- A `404` means the selected book is missing or soft-deleted.
- A `409` explains that no active checkout exists, refetches state, and avoids unsafe resubmission.
- Success displays the book as available while the completed loan remains in history.
- Active, returned, due, and overdue states are understandable without color.
- Loan order preserves the API's lexical `checked_out_at`-descending response and is not described as chronological when
  malformed or inconsistently serialized legacy values prevent that guarantee.
- Custom return timestamps use normalized UTC ISO 8601 values so borrowing-statistics parsing remains reliable.
- Date-only and timestamp behavior is tested around timezone and local-day boundaries.
- Missing book metadata does not hide or crash a loan-history record.
- Tests cover empty active/returned groups, success, `404`, `409`, stale joins, network failure, and cache invalidation.
- `make check` passes.

## Plan coverage

Workstream 7; sections 8 and 10; check-in, history, and borrowing-statistics outcomes.
