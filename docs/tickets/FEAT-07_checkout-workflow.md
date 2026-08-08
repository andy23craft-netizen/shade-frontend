# FEAT-07 — Checkout workflow

## Objective

Loan one currently available book while preserving API lifecycle and loan-history invariants.

## Dependencies

FEAT-06.

## Contract gate

Confirm checkout/due-date chronology and timestamp timezone behavior against OpenAPI and the running backend.

## Scope

- Implement `/checkout` with selection limited to active available books.
- Add a detail-page entry point for eligible books, preselecting that book safely.
- Collect required borrower plus optional checkout timestamp, due date, and notes.
- Omit checkout time when blank so the API default is used.
- Add review/confirmation, in-flight duplicate prevention, success feedback, and accessible validation.
- Use only `POST /books/{id}/checkout`; never simulate checkout with generic `PATCH`.
- On success, update the book and invalidate collection, detail, loans, and dashboard queries.
- On `404` or `409`, explain stale state, refetch affected data, and preserve safe form input.

## Acceptance criteria

- On-loan and deleted books cannot be selected or submitted through the current UI.
- Empty checkout time uses the server default rather than a browser-generated timestamp.
- A `409` explains that state changed, refreshes the book, and retains borrower/optional values.
- Success visibly marks the book unavailable and displays the borrower where appropriate.
- Date/time conversion is explicit and tested across timezone and local-day boundaries.
- Long borrower names and notes remain usable, and private values are absent from diagnostics.
- Duplicate clicks cause one mutation.
- Component/integration tests cover success, validation, stale selection, `404`, `409`, network failure, and retry.
- `make check` passes.

## Plan coverage

Workstream 6; sections 8 and 10; checkout product outcomes and cache integration gate.
