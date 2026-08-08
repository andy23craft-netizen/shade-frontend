# FEAT-09 — Reading tracking

## Objective

Record initial reading completion and maintain completion date, rating, and review afterward.

## Dependencies

FEAT-08.

## Contract gate

Confirm whether repeated mark-read calls are rejected or idempotent and whether later `PATCH` can clear rating, review,
or completion date.

## Scope

- Add a mark-read action for active unread books from appropriate list/detail contexts.
- Collect optional completion date, integer rating from 1 through 5, and review.
- Use `POST /books/{id}/mark-read` for the initial transition, including `{}` when all values are omitted.
- Add a later edit flow for verified reading fields using `PATCH /books/{id}`.
- Never include loan-related fields in a reading update.
- Present read state and rating in collection and detail views.
- Update the returned book and invalidate book lists, detail, and dashboard data.
- Preserve input and refetch state on validation, not-found, stale, and network failures.

## Acceptance criteria

- Deleted books cannot be marked read and read books are not offered the initial action.
- Initial completion never uses generic `PATCH`.
- Optional omission sends `{}` and allows the API to choose its default completion date.
- Rating validation and backend errors are accessible and preserve the draft.
- Later edits send only intentionally changed, contract-supported reading fields.
- The UI does not offer “mark unread.”
- Reading state never changes checkout state.
- Tests cover omitted values, rating bounds, later edits/clears as supported, stale deletion, cache invalidation, and retry.
- `make check` passes.

## Plan coverage

Workstream 8; sections 7.7, 8, 10, and the reading outcomes and traceability entries.
