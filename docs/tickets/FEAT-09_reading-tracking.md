# FEAT-09 — Reading tracking

## Objective

Record initial reading completion and maintain completion date, rating, and review afterward.

## Dependencies

FEAT-08.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for `POST /books/{id}/mark-read`, `MarkReadRequest`, success
  `BookRead`, later reading edits via `PATCH /books/{id}` / `BookUpdate` (reading fields only), and error schemas
  (`ErrorDetail`, `HTTPValidationError`).
- `../technical-reference/API-for-FE.md` -- behavioral guidance OpenAPI does not fully express (required mark-read body,
  today-UTC default vs explicit `completion_date: null`, soft-delete `404` on mark-read, independent loan/reading axes,
  unvalidated temporal strings, and FE vs API ownership of reading state).

Reuse FEAT-03 typed mark-read and book-update helpers and mutation/cache invalidation. Do not invent a second reading
client. Prefer the dedicated mark-read endpoint for the initial unread → read transition; never simulate that
transition with generic `PATCH` (`is_read=true` or otherwise).

### Documented contract facts for this ticket

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
  nullable fields. Never include loan-related properties (`status`, `borrower`, `datetime_loaned_out`). Never send
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

## Scope

- Add a mark-read action for active unread books (`is_read=false`, non-null `deletion_date` absent) from appropriate
  list/detail contexts. Soft-deleted and already-read books must not be offered the initial action or submitted through
  the current UI.
- Collect optional `YYYY-MM-DD` completion date, integer rating from 1 through 5, and review, with review/confirmation,
  in-flight duplicate prevention, success feedback, and accessible validation.
- Use `POST /books/{id}/mark-read` for the initial transition, including `{}` when all values are omitted. Reject blank
  or out-of-range ratings client-side even when the backend would also `422`.
- Add a later edit flow limited to `completion_date`, `rating`, and `review` using `PATCH /books/{id}`, including
  intentional nullable-field clears. Map create/update-time `422 detail[].loc` entries to fields; preserve input, focus
  an error summary, and link field errors.
- Present read state and rating in collection and detail views (building on FEAT-04 presentation; do not rename wire
  fields).
- On success, update the returned `BookRead` in cache and invalidate book lists, detail, and dashboard queries per
  FEAT-03 / PLAN 7.5. Reading mutations do not require loans-list invalidation unless a shared helper already does so
  for book writes.
- On `404`, explain stale/missing/soft-deleted state, refetch affected book data, and preserve safe form input. On
  network or other retryable failures, preserve input and refetch state.
- Keep review text out of logs and diagnostics.

## Acceptance criteria

- Soft-deleted and missing books cannot be marked read; already-read books are not offered the initial action.
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
- Component/integration tests cover success (`200` `BookRead`), `422` for an omitted body or invalid rating, `404` for
  missing/deleted books, the required empty object, omitted optional values, explicit clears, rating bounds, cache
  invalidation, network failure, and retry.
- `make check` passes.

## Plan coverage

Workstream 8; sections 7.7, 8, 10, and the reading outcomes and traceability entries.
