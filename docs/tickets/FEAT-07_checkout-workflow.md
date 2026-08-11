# FEAT-07 — Checkout workflow

## Objective

Loan one currently available book while preserving API lifecycle and loan-history invariants.

## Dependencies

FEAT-06.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for `POST /books/{id}/checkout`, `CheckoutRequest`, success
  `BookRead`, and error schemas (`ErrorDetail`, `HTTPValidationError`).
- `../technical-reference/API-for-FE.md` -- behavioral guidance OpenAPI does not fully express (checkout defaults,
  unvalidated temporal strings, soft-delete `404`, dual `409` causes with one detail string, and FE vs API ownership of
  loan state).

Reuse FEAT-03 typed checkout helpers and mutation/cache invalidation. Do not invent a second checkout client, and never
simulate checkout with generic `PATCH`.

### Documented contract facts for this ticket

Confirm against a representative running backend `/openapi.json` before locking behavior; record drift as a blocker.

- `POST /books/{id}/checkout` requires a JSON `CheckoutRequest` body. Path `{id}` is any string; missing rows return
  `404` with string `detail`. Soft-deleted books are rejected the same way (`404`), even though `GET /books/{id}` can
  still return them.
- `CheckoutRequest` requires `borrower` (`minLength` 1, `maxLength` 255). Optional nullable strings: `checked_out_at`,
  `due_at`, and `notes`. Formats for those optionals are not validated by the API. Request models ignore unknown
  properties.
- OpenAPI documents success as `200` with `BookRead`, plus `403`, `404`, `409`, and FastAPI `422` (`detail[]`).
- Only `borrower` is required at runtime. Whitespace-only borrowers are not rejected by the backend; the frontend must
  still reject blank/whitespace-only input while submitting the entered non-blank value unchanged (trim only for the
  blank check).
- Omitted `checked_out_at` defaults to current UTC on the server. Prefer omitting the property when the user leaves
  checkout time blank rather than inventing a browser timestamp or sending empty string.
- Serialize blank nullable `due_at` and `notes` as omitted or `null`, never as arbitrary empty temporal text. When the
  user supplies values, send `checked_out_at` as normalized UTC ISO 8601 and `due_at` as `YYYY-MM-DD`. Malformed stored
  loan timestamps can later surface as unhandled `500` on borrowing statistics.
- Success sets book `status=on_loan`, copies borrower and loan timestamp onto the book, and creates a `Loan` with
  `returned_at=null`. The response is `BookRead` (loan fields on the book use `borrower` and `datetime_loaned_out`; do
  not rename transport properties to request names such as `checked_out_at`).
- Conflict (`409`) when book `status` is `on_loan` or an active loan already exists. Both causes use the same string
  detail: `{"detail": "Book is already checked out"}`. Explain stale state, refetch affected book and loan data, and
  preserve safe form input.
- Soft-delete and loan/reading axes are independent: do not offer checkout for soft-deleted books, and do not use
  `PATCH` to set `status` / `borrower` / `datetime_loaned_out`.
- Recommended borrowing flow: FE collects borrower (and optional fields) → `POST .../checkout` → display returned
  `BookRead` state.

## Scope

- Implement `/checkout` with selection limited to active books whose `status` is `available` (from `GET /books` default
  `include_deleted=false`). Soft-deleted and `on_loan` books must not be selectable or submittable through the current
  UI.
- Add a detail-page entry point for eligible books, preselecting that book safely (reject deep-links to soft-deleted,
  missing, or non-available books with an accessible explanation and refresh path).
- Collect borrower (at most 255 characters), optional checkout timestamp, optional due date, and optional notes with
  review/confirmation, in-flight duplicate prevention, success feedback, and accessible validation.
- Map create-time `422 detail[].loc` entries to fields; preserve input, focus an error summary, and link field errors.
- On success, update the returned `BookRead` in cache and invalidate collection, detail, loans, and dashboard queries
  per FEAT-03 / PLAN 7.5.
- On `404` or `409`, explain stale state, refetch affected book and loan data, and preserve safe form input. Treat both
  documented `409` causes as one user-facing conflict message matching the API detail.
- Keep borrower names and notes out of logs and diagnostics.

## Acceptance criteria

- Soft-deleted, missing, and non-`available` books (including `on_loan`) cannot be selected or submitted through the
  current UI.
- Empty checkout time omits `checked_out_at` so the server default is used rather than a browser-generated timestamp.
- Submitted checkout timestamps are normalized UTC ISO 8601 values and due dates are `YYYY-MM-DD`; arbitrary strings are
  never sent to the API.
- Whitespace-only or over-255-character borrowers are rejected client-side even though the backend does not reject the
  former.
- A `409` with detail `Book is already checked out` explains that state changed, refreshes the book (and loans), and
  retains borrower/optional values. Tests cover both underlying causes (book already `on_loan`, and active loan already
  present) even though the API detail string is the same.
- A soft-deleted or missing target yields `404` handling with refetch and safe navigation; the UI does not treat that as
  a successful loan.
- Success visibly marks the book `on_loan` and displays the borrower (and `datetime_loaned_out` where appropriate) from
  the returned `BookRead`.
- Date/time conversion is explicit and tested across timezone and local-day boundaries.
- A 255-character borrower is accepted and 256 characters are rejected; long notes remain usable, and private values
  are absent from diagnostics.
- Duplicate clicks cause one mutation.
- Component/integration tests cover success (`200` `BookRead`), field-mapped `422`, stale selection, `404`, both `409`
  causes, network failure, and retry.
- `make check` passes.

## Plan coverage

Workstream 6; sections 8 and 10; checkout product outcomes and cache integration gate.
