# FEAT-10 — Book administration, restoration, and backup

## Objective

Maintain book metadata, safely manage soft deletion/restoration, and download a complete authenticated SQL backup.

## Dependencies

FEAT-09.

## Contract constraints

The backend permits deleting an on-loan book but leaves its active loan open and rejects check-in until the book is
restored. This ticket must prevent that deletion in the UI. Generic `PATCH` permits soft-deleted records and does not
update `updated_date`, so neither behavior may be used to bypass lifecycle controls or infer concurrency.

## Scope

- Implement `/books/:bookId/edit` using the reusable book form and `PATCH /books/{id}`.
- Compute a minimal patch containing only intentionally changed metadata fields: `isbn13`, `title`, `authors`,
  `publisher`, `publication_date`, `pages`, `category`, `shelf`, `tags`, `purchase_date`, `purchase_price`, `notes`,
  `acquisition_source`, and non-loan status values.
- Exclude borrower, loan timestamp, on-loan state, deletion state, and initial mark-read semantics.
- Add an accessible delete confirmation explaining soft deletion and retained history.
- Use `DELETE /books/{id}` and correctly handle `204 No Content`.
- Implement `/admin/deleted` from mixed active/deleted `GET /books?include_deleted=true` results, filtering on non-null
  `deletion_date`.
- Show retained reading and borrowing information and disable invalid lifecycle actions.
- Restore with `POST /books/{id}/restore` and return records to active browsing.
- Invalidate active/deleted lists, detail, and dashboard data after each mutation.
- Implement `/admin/backup` using authenticated `GET /backup`. Fetch the SQL attachment as a blob, safely prefer the
  exposed UTF-8 `Content-Disposition` filename, provide a sensible fallback, trigger the download, and always revoke
  the temporary object URL.
- Show backup progress and recoverable `403`, generation `500`, network, and interrupted-download states. Warn that the
  file contains active and deleted books plus complete loan history, and never inspect, log, cache, or upload its
  contents.

## Acceptance criteria

- Send explicit `null` only for documented nullable fields; never send it for `title`, `authors`, `category`, `shelf`,
  `is_read`, or `status`. A blank ISBN intentionally clears to `null`.
- Unchanged fields are absent from edit requests and loan state cannot be edited.
- Field-mapped `422` responses preserve the edit draft and focus accessible error feedback.
- Delete removes a book from normal browsing and frontend-derived active caches without erasing history.
- Deleted records remain inspectable and can be restored to the active collection.
- Repeated/stale delete or restore handles `404`/`409` by refetching and explaining the new state.
- Books whose status is `on_loan` or which have an active loan record cannot initiate or submit deletion.
- Confirmation focus is trapped/restored and destructive intent is clear without relying on color.
- Tests cover minimal patch generation, clearable values, active-loan deletion policy, `204`, stale operations, and cache
  invalidation.
- Backup tests cover an authenticated non-empty SQL response, UTF-8 and fallback filenames, object-URL cleanup,
  generation `500`, rejected access, network failure, and suppression of bogus downloads after failure.
- A production-like cross-origin test verifies authenticated preflight and JavaScript access to exposed
  `Content-Disposition` with the exact frontend origin in backend `CORS_ORIGINS`; no cookies or credentialed CORS are
  used.
- `make check` passes.

## Plan coverage

Workstream 9; sections 7.6, 7.7, 8, 10, and 12; the edit/delete/restore/backup outcomes and traceability entries.
