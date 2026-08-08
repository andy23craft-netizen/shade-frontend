# FEAT-08 — Check-in and loan history

## Objective

Return active loans and present preserved active and returned borrowing history.

## Dependencies

FEAT-07.

## Contract gate

Confirm return/checkout chronology and timestamp timezone behavior against OpenAPI and the running backend.

## Scope

- Implement `/checkin` with selection restricted to active books that are on loan.
- Support optional return timestamp, omitting it to use the API default.
- Use only `POST /books/{id}/checkin`; never simulate return with generic `PATCH`.
- Implement `/loans` using `GET /loans` and active-book data.
- Join each `book_id` to a title client-side with a durable fallback when a book is deleted or unavailable.
- Distinguish active and returned loans and derive due/overdue presentation from due and return dates.
- Refresh book, loan, detail, and dashboard data after return.
- Handle empty history, no active loans, missing joined books, stale resources, and retryable failures.

## Acceptance criteria

- Returning an available or deleted book is impossible through the current UI.
- A `409` explains that no active checkout exists, refetches state, and avoids unsafe resubmission.
- Success displays the book as available while the completed loan remains in history.
- Active, returned, due, and overdue states are understandable without color.
- Loan order follows the API and is not silently reinterpreted.
- Date-only and timestamp behavior is tested around timezone and local-day boundaries.
- Missing book metadata does not hide or crash a loan-history record.
- Tests cover empty active/returned groups, success, `404`, `409`, stale joins, network failure, and cache invalidation.
- `make check` passes.

## Plan coverage

Workstream 7; sections 8 and 10; check-in, history, and borrowing-statistics outcomes.
