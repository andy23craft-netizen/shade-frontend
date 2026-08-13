# FEAT-07 — Checkout workflow

## Objective

Loan one currently available book while preserving API lifecycle and loan-history invariants.

## Dependencies

FEAT-06 is complete (ticket file removed). Reuse FEAT-03 typed checkout helpers and mutation/cache invalidation
(`booksApi.checkout`, `pickCheckoutRequest`, `useCheckoutBook`, `src/api/dateTime.ts`). Do not invent a second checkout
client, and never simulate checkout with generic `PATCH`. Check-in and loan history belong to FEAT-08; mark-read to
FEAT-09; edit/delete to FEAT-10.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for `POST /books/{id}/checkout`, `CheckoutRequest`, success
  `BookRead`, and error schemas (`ErrorDetail`, `HTTPValidationError`).
- `../technical-reference/API-for-FE.md` -- behavioral guidance OpenAPI does not fully express (checkout defaults,
  unvalidated temporal strings, soft-delete `404`, dual `409` causes with one detail string, and FE vs API ownership of
  loan state).

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
  still reject blank/whitespace-only input. Non-blank borrowers are trimmed before submit (blank check and payload both
  use trim).
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

## Current baseline

Already in place and should be reused (not rebuilt):

- Typed transport: `createBooksApi().checkout`, `CheckoutRequest` / `pickCheckoutRequest`, and `useCheckoutBook` (writes
  returned `BookRead` into the detail cache and invalidates books list/detail, loans, and dashboard per PLAN 7.5 on
  success).
- Date/time helpers in `src/api/dateTime.ts` with colocated unit tests; checkout form conversion coverage lives in
  `src/features/loans/checkoutModel.test.ts` (including offset → UTC normalization and date-only due dates).
- Redaction already excludes `borrower` and `notes` from diagnostics (`src/api/apiRedaction.ts`).
- `/checkout` is a real page (`CheckoutPage`), not a `RoutePlaceholder`. Shell nav links to `routeMetadata.checkout`.
- `CheckoutPage` loads active books via `useBooks`, offers only `deletion_date === null && status === 'available'`
  options, preselects via `?bookId=`, and warns when the deep-linked book is missing or not eligible.
- Checkout form model (`checkoutModel.ts`): borrower blank/255 validation, optional `datetime-local` / `date` / notes,
  omit blank `checked_out_at` / `due_at` / `notes`, normalize supplied checkout timestamps with `normalizeUtcIso8601`.
- Mutation is `useCheckoutBook`; submit is disabled while pending or when no eligible book is selected. Success
  navigates to `/books/:bookId` so the returned `BookRead` (already written into the detail cache) is visible.
- Book details (`BookDetailsPage`) offers Check Out only when active and `status === 'available'`, linking to
  `/checkout?bookId={id}`. Soft-deleted books hide lifecycle actions; `on_loan` and other non-`available` statuses omit
  Check Out.

## Remaining scope

- Add review/confirmation before the mutation (reuse `ConfirmationDialog`), with accessible copy of the selected book
  and borrower.
- Map checkout `422 detail[].loc` entries to form fields; preserve input, focus an error summary, and link field errors
  (same pattern as create on `/books/new`).
- On mutation `404` or `409`, explain stale state, refetch affected book and loan queries, and preserve safe form
  input. Treat both documented `409` causes as one user-facing conflict message matching the API detail
  (`Book is already checked out`). Soft-deleted / missing targets must not be treated as a successful loan.
- Give ineligible or missing deep-links an accessible refresh path (refetch the active books list), not only a static
  warning.
- Extend component/integration tests for field-mapped `422`, mutation `404`, both `409` causes, network failure, and
  retry. Keep borrower names and notes out of feature logs and diagnostics.

## Acceptance criteria

- A confirmation step runs before `POST /books/{id}/checkout`; cancel leaves form values intact and does not mutate.
- Checkout `422` field errors map into the form summary and linked fields; focus moves to the summary.
- A `409` with detail `Book is already checked out` explains that state changed, refetches the book (and loans), and
  retains borrower/optional values. Tests cover both underlying causes (book already `on_loan`, and active loan already
  present) even though the API detail string is the same.
- A soft-deleted or missing target yields `404` handling with refetch and safe navigation; the UI does not treat that as
  a successful loan.
- Deep-links to missing or non-`available` books expose a refresh path that reloads eligible books.
- Component/integration tests cover field-mapped `422`, `404`, both `409` causes, network failure, and retry (in
  addition to existing success, eligibility, and client-validation coverage).
- `make check` passes.

## Plan coverage

Workstream 6; sections 8 and 10; checkout product outcomes and cache integration gate.
