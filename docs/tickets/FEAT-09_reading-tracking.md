# FEAT-09 — Reading tracking

## Objective

Record initial reading completion and maintain completion date, rating, and review afterward.

## Dependencies

FEAT-08.

## Contract constraints

The mark-read request body is required even when all fields are omitted. Nullable completion date, rating, and review
fields can be explicitly cleared; an explicitly cleared completion date is not replaced with today's date.

## Scope

- Add a mark-read action for active unread books from appropriate list/detail contexts.
- Collect optional `YYYY-MM-DD` completion date, integer rating from 1 through 5, and review.
- Use `POST /books/{id}/mark-read` for the initial transition, including `{}` when all values are omitted.
- Add a later edit flow limited to `completion_date`, `rating`, and `review` using `PATCH /books/{id}`, including
  intentional nullable-field clears. Never send `is_read=false`.
- Never include loan-related fields in a reading update.
- Present read state and rating in collection and detail views.
- Update the returned book and invalidate book lists, detail, and dashboard data.
- Preserve input and refetch state on validation, not-found, stale, and network failures.

## Acceptance criteria

- Deleted books cannot be marked read and read books are not offered the initial action.
- Initial completion never uses generic `PATCH`.
- Optional omission sends `{}` and allows the API to choose its default completion date.
- Omitted fields preserve/default according to the endpoint, while explicit `null` clears that field; explicit
  `completion_date: null` suppresses the API's today default.
- Non-null completion dates serialize as `YYYY-MM-DD` because the backend does not validate temporal strings.
- Rating validation and backend errors are accessible and preserve the draft.
- Later edits send only intentionally changed, contract-supported reading fields.
- The UI does not offer "mark unread."
- Reading state never changes checkout state.
- Tests cover `422` for an omitted body or invalid rating, `404` for missing/deleted books, the required empty object,
  omitted optional values, explicit clears, rating bounds, cache invalidation, and retry.
- `make check` passes.

## Plan coverage

Workstream 8; sections 7.7, 8, 10, and the reading outcomes and traceability entries.
