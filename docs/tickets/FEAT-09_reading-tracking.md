# FEAT-09 — Reading tracking

## Objective

Record initial reading completion and maintain completion date, rating, and review afterward.

## Dependencies

FEAT-08 is complete (ticket file removed). Reuse FEAT-03 typed helpers (`booksApi.markRead`, `pickMarkReadRequest`,
`useMarkBookRead`, `booksApi.update`, `pickBookUpdate`, `useUpdateBook`, `dateTime.ts`) and FEAT-07/FEAT-08 form
patterns (`ConfirmationDialog`, Field-linked `422`, stale `404` refetch with preserved input). Do not invent a second
reading client. Prefer the dedicated mark-read endpoint for the initial unread → read transition; never simulate that
transition with generic `PATCH` (`is_read=true` or otherwise). Metadata edit, delete, restore, and backup remain FEAT-10;
do not pull those into FEAT-09.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for `POST /books/{id}/mark-read`, `MarkReadRequest`, success
  `BookRead`, later reading edits via `PATCH /books/{id}` / `BookUpdate` (reading fields only), and error schemas
  (`ErrorDetail`, `HTTPValidationError`).
- `../technical-reference/API-for-FE.md` -- behavioral guidance OpenAPI does not fully express (required mark-read body,
  today-UTC default vs explicit `completion_date: null`, soft-delete `404` on mark-read, independent loan/reading axes,
  unvalidated temporal strings, and FE vs API ownership of reading state).

### Documented contract facts still relevant

Confirm against a representative running backend `/openapi.json` before locking behavior; record drift as a blocker.

- `POST /books/{id}/mark-read` requires a JSON `MarkReadRequest` body. Path `{id}` is any string; missing rows return
  `404` with string `detail`. Soft-deleted books are rejected the same way (`404`), even though `GET /books/{id}` can
  still return them and retained reading data remains visible.
- `MarkReadRequest` has no required properties, but the request body itself is required. Send at least `{}`. An omitted
  body is **422**. Optional nullable fields: `completion_date` (string), `rating` (integer `minimum` 1 / `maximum` 5),
  and `review` (string). Request models ignore unknown properties.
- OpenAPI documents mark-read success as `200` with `BookRead`, plus `403`, `404`, and FastAPI `422` (`detail[]`). There
  is no mark-read `409`.
- Success sets `is_read=true`. Omitted `completion_date` defaults to today's UTC date on the server. Supplied
  `rating` / `review` are applied when present. Explicit `null` clears those fields; an explicitly cleared
  `completion_date` is not replaced with today in that request. Prefer omitting optional properties when the user leaves
  them blank on initial mark-read so the server default applies, rather than inventing a browser date or sending empty
  string.
- When the user supplies a completion date, serialize it as `YYYY-MM-DD`. Temporal fields are plain strings on the wire;
  the API does not validate format, timezone, ordering, or calendar correctness.
- Later edits of an already-read book use `PATCH /books/{id}` with a required `BookUpdate` body. For this ticket, send
  only intentionally changed reading fields: `completion_date`, `rating`, and/or `review`. Explicit `null` clears those
  nullable fields. Never include loan-driving `status` values that simulate checkout or check-in, and do not invent
  book-level borrower or checkout-timing fields (those live on loan rows). Never send
  `is_read=false`, `is_read=null`, or any "mark unread" payload -- the UI must not offer that action, and nulling
  DB-required fields such as `is_read` can cause an unhandled server error on commit.
- Soft-delete and loan/reading axes are independent: do not offer mark-read for soft-deleted or already-read books.
  Reading updates must not change checkout state. Soft-deleted books still accept generic `PATCH` (including reading
  fields) without creating loans; do not use that as a back door for initial mark-read or loan mutation.
- `PATCH` does not bump `updated_date`. Success responses for both mark-read and reading PATCH are `BookRead`; bind
  transport property names (`is_read`, `completion_date`, `rating`, `review`) without renaming them in the UI layer's
  data binding.
- Recommended flow: FE collects optional completion date, rating, and review for an active unread book →
  `POST .../mark-read` (or `{}`) → display returned `BookRead`. Later, FE patches only changed reading fields →
  display returned `BookRead`.

## Current baseline

Already in place and should be reused (not rebuilt):

- Typed transport: `booksApi.markRead` (defaults to `{}`), `pickMarkReadRequest`, `useMarkBookRead` (detail-cache write
  + PLAN 7.5 invalidation via `invalidateBookCaches`, including dashboard), `booksApi.update`, `pickBookUpdate`,
  `useUpdateBook`, and `formatDateOnly` / related helpers in `dateTime.ts`. Colocated API and hook tests cover empty
  mark-read bodies and cache invalidation.
- FEAT-04 collection/detail presentation: `BooksPage` shows read vs unread; `BookDetailsPage` renders `is_read`,
  `completion_date`, `rating`, and `review` on the detail view.
- `BookDetailsPage` links to `/books/:bookId/mark-read` for every non-deleted book (stub only: the route is not
  registered, the link is not gated on `is_read=false`, and there is no mark-read or reading-edit UI yet).

## Remaining scope

### Initial mark-read

- Register `/books/:bookId/mark-read` (or equivalent owned route) and implement `MarkReadPage` + `markReadModel`
  (optional `YYYY-MM-DD` completion date, rating 1–5, review; blank optionals omitted; `{}` when all omitted;
  client-side rating bounds; `ConfirmationDialog`; `useMarkBookRead`; success navigation back to detail).
- Gate the initial action to active unread books (`deletion_date === null` and `is_read === false`) on detail and any
  list entry points. Do not offer mark-read for soft-deleted or already-read books.
- Map mark-read `422 detail[].loc` entries to fields; preserve input, focus an error summary, and link field errors
  (mirror FEAT-07 checkout / FEAT-08 check-in patterns).
- On `404`, explain stale/missing/soft-deleted state, refetch affected book data, and preserve safe form input. On
  network or other retryable failures, preserve input and refetch state.
- Prevent duplicate submissions while a mutation is pending.

### Later reading edits

- Add a reading-edit flow for already-read books limited to `completion_date`, `rating`, and `review` via
  `PATCH /books/{id}` / `useUpdateBook`, including intentional nullable-field clears. Send only changed reading fields.
  Map `422` field errors and preserve draft input. Do not offer "mark unread" or loan/status mutation through this
  flow.

### Presentation

- Show rating alongside read state in the collection list (detail already shows reading fields; extend list presentation
  without renaming wire fields).
- After success, bind visible read state from the returned `BookRead` (cache writes already occur in the hooks).

### Tests

- Colocated route/model tests for mark-read success (`200` `BookRead`), `{}` when all optionals omitted, explicit
  clears, rating bounds, Field-linked `422`, `404` for missing/deleted books, stale-state refetch, network failure,
  confirmation cancel, pending disable, eligibility gating, and reading PATCH edits.
- Update `BookDetailsPage` tests for gated Mark Read / reading-edit entry points.

## Acceptance criteria

- Soft-deleted and missing books cannot be marked read; already-read books are not offered the initial mark-read action.
- Initial completion never uses generic `PATCH`.
- Optional omission sends `{}` and allows the API to choose its default completion date (today UTC).
- Omitted fields preserve/default according to the endpoint, while explicit `null` clears that field; explicit
  `completion_date: null` suppresses the API's today default.
- Non-null completion dates serialize as `YYYY-MM-DD`; arbitrary temporal strings are never sent to the API.
- Rating bounds (1 through 5) are enforced client-side; backend `422` (invalid rating, omitted mark-read body, or other
  validation) is accessible and preserves the draft.
- Later edits send only intentionally changed, contract-supported reading fields and never loan fields or
  `is_read=false` / `is_read=null`.
- The UI does not offer "mark unread."
- Reading state never changes checkout state.
- Success visibly reflects `is_read`, `completion_date`, `rating`, and `review` from the returned `BookRead`.
- Duplicate clicks cause one mutation.
- Component/integration tests cover the mark-read and reading-edit flows listed above.
- Keep review text out of logs and diagnostics.
- `make check` passes.

## Plan coverage

Workstream 8; sections 7.7, 8, 10, and the reading outcomes and traceability entries.
