# FEAT-07 — Checkout workflow

## Objective

Loan one currently available book while preserving API lifecycle and loan-history invariants.

## Dependencies

FEAT-06.

## Contract constraints

The API stores checkout and due values as unvalidated strings and does not enforce chronology. Send checkout timestamps
as normalized UTC ISO 8601 values and due dates as `YYYY-MM-DD`; malformed loan timestamps can later break borrowing
statistics.

## Scope

- Implement `/checkout` with selection limited to active available books.
- Add a detail-page entry point for eligible books, preselecting that book safely.
- Collect a borrower of at most 255 characters, using trimming only to detect blank input while submitting the entered
  value unchanged, plus optional checkout timestamp, due date, and notes.
- Omit checkout time when blank so the API default is used.
- Serialize blank nullable due date and notes as omitted or `null`, never as arbitrary empty temporal text.
- Add review/confirmation, in-flight duplicate prevention, success feedback, and accessible validation.
- Use only `POST /books/{id}/checkout`; never simulate checkout with generic `PATCH`.
- On success, update the book and invalidate collection, detail, loans, and dashboard queries.
- On `404` or `409`, explain stale state, refetch affected book and loan data, and preserve safe form input. A checkout
  `409` can mean either book status is `on_loan` or an active loan already exists.

## Acceptance criteria

- On-loan and deleted books cannot be selected or submitted through the current UI.
- Empty checkout time uses the server default rather than a browser-generated timestamp.
- Submitted checkout timestamps are normalized UTC ISO 8601 values and due dates are `YYYY-MM-DD`; arbitrary strings are
  never sent to the API.
- Whitespace-only or over-255-character borrowers are rejected client-side even though the backend does not reject the
  former.
- A `409` explains that state changed, refreshes the book, and retains borrower/optional values.
- Success visibly marks the book unavailable and displays the borrower where appropriate.
- Date/time conversion is explicit and tested across timezone and local-day boundaries.
- A 255-character borrower is accepted and 256 characters are rejected; long notes remain usable, and private values
  are absent from diagnostics.
- Duplicate clicks cause one mutation.
- Component/integration tests cover success, field-mapped `422`, stale selection, `404`, both `409` causes, network
  failure, and retry.
- `make check` passes.

## Plan coverage

Workstream 6; sections 8 and 10; checkout product outcomes and cache integration gate.
