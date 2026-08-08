# FEAT-10 — Book edit, delete, and restore

## Objective

Maintain book metadata and soft-delete or restore records without losing history.

## Dependencies

FEAT-09.

## Contract gate

Resolve backend behavior for deleting an actively loaned book. Prevent it in the UI if unsupported; if supported, make
the resulting active-loan and history behavior explicit and tested.

## Scope

- Implement `/books/:bookId/edit` using the reusable book form and `PATCH /books/{id}`.
- Compute a minimal patch containing only intentionally changed, contract-supported metadata fields.
- Exclude borrower, loan timestamp, on-loan state, deletion state, and initial mark-read semantics.
- Add an accessible delete confirmation explaining soft deletion and retained history.
- Use `DELETE /books/{id}` and correctly handle `204 No Content`.
- Implement `/admin/deleted` from `GET /books?include_deleted=true`, filtering to deleted records.
- Show retained reading and borrowing information and disable invalid lifecycle actions.
- Restore with `POST /books/{id}/restore` and return records to active browsing.
- Invalidate active/deleted lists, detail, and dashboard data after each mutation.

## Acceptance criteria

- Blank/cleared values follow the contract decisions recorded in FEAT-05.
- Unchanged fields are absent from edit requests and loan state cannot be edited.
- Delete removes a book from normal browsing and frontend-derived active caches without erasing history.
- Deleted records remain inspectable and can be restored to the active collection.
- Repeated/stale delete or restore handles `404`/`409` by refetching and explaining the new state.
- Confirmation focus is trapped/restored and destructive intent is clear without relying on color.
- Tests cover minimal patch generation, clearable values, active-loan deletion policy, `204`, stale operations, and cache
  invalidation.
- `make check` passes.

## Plan coverage

Workstream 9; sections 7.7, 8, 10, and the edit/delete/restore outcomes and traceability entries.
