# FEAT-10 — Book administration, restoration, and backup

## Objective

Maintain book metadata, safely manage soft deletion/restoration, and download a complete authenticated SQL backup.

## Dependencies

FEAT-09 is complete (ticket file removed). Reuse FEAT-03 typed helpers (`booksApi.update`, `pickBookUpdate`,
`useUpdateBook`, `booksApi.remove`, `useDeleteBook`, `booksApi.restore`, `useRestoreBook`,
`useBooks({ includeDeleted })`, `backupApi.get`) and FEAT-05 `BookForm` / `bookFormModel`. Reuse FEAT-07/FEAT-08 form
patterns (`ConfirmationDialog`, Field-linked `422`, stale `404`/`409` refetch with preserved input) and `findActiveLoan`
for the on-loan delete policy. Do not invent a second administration client. Prefer dedicated delete/restore endpoints
over reproducing their effects with `PATCH`, and never use generic `PATCH` to simulate checkout, check-in, initial
mark-read, or restore. Dashboard metrics UI remains FEAT-11; do not pull it into FEAT-10.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for `PATCH /books/{id}` / `BookUpdate`, `DELETE /books/{id}`,
  `GET /books` (`include_deleted`), `POST /books/{id}/restore`, success `BookRead` / `BookList`, `GET /backup`
  (`application/sql` + `Content-Disposition`), and error schemas (`ErrorDetail`, `HTTPValidationError`).
- `../technical-reference/API-for-FE.md` -- behavioral guidance OpenAPI does not fully express (soft-delete visibility
  and retained history, independent loan/reading/delete axes, on-loan delete leaving an open loan, generic `PATCH`
  accepting soft-deleted rows without bumping `updated_date`, blank-ISBN/`null` rules, backup blob download, CORS
  header exposure, and FE vs API ownership of lifecycle).

### Documented contract facts still relevant

Confirm against a representative running backend `/openapi.json` before locking behavior; record drift as a blocker.

- `PATCH /books/{id}` requires a `BookUpdate` body. Every property is optional. Success is `200` `BookRead`, plus `403`,
  `404` (`Book not found`), and FastAPI `422` (`detail[]`). There is no edit `409`. `PATCH` does not bump
  `updated_date`. Soft-deleted rows remain readable and still accept generic `PATCH`; do not use that as a restore,
  loan, or initial mark-read back door.
- Send only intentionally changed metadata fields (`exclude_unset`). In-scope: `isbn13`, `title`, `authors`,
  `publisher`, `publication_date`, `pages`, `category`, `shelf`, `tags`, `purchase_date`, `purchase_price`, `notes`,
  `acquisition_source`, and non-loan `status` values (`unknown`, `available`, `missing`, `display_only`, `reserved`,
  `reading`). Exclude `status=on_loan`, reading fields (`is_read`, `completion_date`, `rating`, `review`; those stay on
  the FEAT-09 reading flows), and any loan/borrower/checkout-timing fields.
- Never send `null` for DB-required fields (`title`, `authors`, `category`, `shelf`, `is_read`, `status`). A blank ISBN
  intentionally clears to `null`. Preserve submitted `isbn13` and rely on the API for canonical form. Non-null dates
  serialize as `YYYY-MM-DD`. `pages` is a positive integer or `null`.
- `DELETE /books/{id}` succeeds with `204` (no JSON body). Missing or already-deleted books return `404` (`Book not
  found` / `Book already deleted`). There is no delete `409`. The API allows deleting an on-loan book and would leave
  the loan open; the UI must not. Soft-deleted books stay readable via `GET /books/{id}` with retained loan/reading
  data, are omitted from `GET /books` unless `include_deleted=true`, and are rejected by checkout / check-in /
  mark-read (`404`).
- Build `/admin/deleted` from `GET /books?include_deleted=true` (`BookList` `{ items, total }`). Client-filter on
  non-null `deletion_date`. Do not invent a deleted-only list endpoint or pagination.
- `POST /books/{id}/restore` returns `200` `BookRead` (`deletion_date: null`). Missing book → `404`. Restoring an
  already-active book → `409` (`Book is not deleted`).
- `GET /backup` is an authenticated SQL blob (`application/sql`), not JSON, including soft-deleted books and complete
  loan history. Documented errors: `403` and generation `500` (`Failed to generate database backup`). Direct navigation
  cannot attach the Bearer token. Credentialed CORS (cookies) is disabled; `Content-Disposition` is exposed when the
  exact frontend origin is listed in backend `CORS_ORIGINS`.

## Current baseline

Already in place and should be reused (not rebuilt):

- Typed transport and cache: `booksApi.update` / `pickBookUpdate` / `useUpdateBook`, `booksApi.remove` (`204`) /
  `useDeleteBook`, `booksApi.restore` / `useRestoreBook`, `useBooks({ includeDeleted: true })`, and `backupApi.get`
  (`{ blob, filename }`, UTF-8 `filename*=UTF-8''...` plus `backup.sql` fallback). Colocated API and hook tests cover
  `204`, restore `409`, include-deleted listing, backup filenames, detail-cache writes, and PLAN 7.5 invalidation
  (lists, detail, dashboard).
- FEAT-05 `BookForm` / `bookFormDefaults` / `bookFormModel`: create metadata fields, client validation, Field-linked
  `422`, blank-optional-to-`null` (including blank ISBN). Submit path is still create-only (`BookCreate`, always
  `status=available` and `is_read=false`; no status control). Extend it for edit rather than inventing a parallel form.
- `ConfirmationDialog` (danger variant, focus trap/restore) and `findActiveLoan`.
- Routes `/books/:bookId/edit`, `/admin/deleted`, and `/admin/backup` are registered and linked from AppShell admin
  nav, but still render `RoutePlaceholder`.
- `BookDetailsPage`: "Edit Book" to `/books/:bookId/edit` for every active book; stub "Delete Book" to
  `/books/:bookId/delete` when active and `status !== 'on_loan'` (route not registered; not yet gated on an active
  loan record). Soft-deleted detail already shows retained reading/borrowing and hides lifecycle actions (no edit,
  delete, checkout, check-in, mark-read, or restore).

## Remaining scope

### Edit (`/books/:bookId/edit`)

- Replace the `EditBookPage` placeholder. Load the current `BookRead`, populate the reusable book form, and `PATCH`
  via `useUpdateBook` with a minimal patch of changed metadata fields only. Add a non-loan status control if status is
  editable here; never send `status=on_loan`, reading fields, or loan-driving values. Blank ISBN → `null`.
- Reject missing-book deep-links with accessible `404` handling. Do not present edit as a substitute for restore on
  soft-deleted targets.
- Map `422 detail[].loc` to fields; preserve the draft; focus an error summary. Prevent duplicate submits. On success,
  bind the returned `BookRead` (hooks already write detail cache and invalidate lists/dashboard) and navigate back to
  detail.

### Delete (detail)

- Implement the delete confirmation (dedicated `/books/:bookId/delete` matching the detail stub, or an in-page
  `ConfirmationDialog`). Explain soft deletion and retained history. Destructive intent must be clear without relying
  on color.
- Use `DELETE /books/{id}` / `useDeleteBook` and handle `204`. Block initiate and submit when `status === 'on_loan'`
  **or** `findActiveLoan` is present. Do not offer delete for soft-deleted books (detail already hides it; keep that
  gate on any new route).
- On stale `404` (`Book not found` or `Book already deleted`), refetch and explain the new state. On success, leave
  normal browsing (active list) without erasing history.

### Deleted books (`/admin/deleted`)

- Replace the `DeletedBooksPage` placeholder. Load `useBooks({ includeDeleted: true })` and client-filter on non-null
  `deletion_date`. Show retained reading and borrowing information; disable invalid lifecycle actions; offer restore.
- Restore with `POST /books/{id}/restore` / `useRestoreBook`. On success, return the record to active browsing. On
  `409` (`Book is not deleted`) or `404`, refetch and explain the new state.

### Backup (`/admin/backup`)

- Replace the `BackupLibraryPage` placeholder. Download through `backupApi.get` (do not reimplement filename parsing).
  Use authenticated `fetch` results, a programmatic `<a download>`, and always `URL.revokeObjectURL`. Do not inspect,
  log, cache, or upload dump contents.
- Show progress and recoverable `403`, generation `500`, network, and interrupted-download states. Warn that the file
  contains active and deleted books plus complete loan history. Never create a download after a failed response.

## Acceptance criteria

- Send explicit `null` only for documented nullable fields; never send it for `title`, `authors`, `category`, `shelf`,
  `is_read`, or `status`. A blank ISBN intentionally clears to `null`.
- Unchanged fields are absent from edit requests; loan state and reading fields cannot be edited here.
- Field-mapped `422` responses preserve the edit draft and focus accessible error feedback.
- Delete removes a book from normal browsing and frontend-derived active caches without erasing history (`204`).
- Deleted records remain listed on `/admin/deleted` and can be restored to the active collection (`200` `BookRead`
  with `deletion_date: null`).
- Stale delete handles `404` (`Book not found` / `Book already deleted`) by refetching and explaining the new state.
  Stale restore handles `404` and `409` (`Book is not deleted`) the same way.
- Books whose `status` is `on_loan` or which have an active loan record cannot initiate or submit deletion.
- Confirmation focus is trapped/restored and destructive intent is clear without relying on color.
- Tests cover minimal patch generation, clearable values (including blank ISBN → `null`), active-loan deletion policy,
  `204`, soft-deleted `PATCH` non-bypass, stale delete/restore, and UI wiring of cache-backed success.
- Backup UI tests cover an authenticated non-empty SQL download, object-URL cleanup, generation `500` with detail
  `Failed to generate database backup`, rejected access (`403`), network failure, and suppression of bogus downloads
  after failure. Reuse existing `backupApi` filename tests; do not duplicate them.
- A production-like cross-origin test verifies authenticated preflight and JavaScript access to exposed
  `Content-Disposition` with the exact frontend origin in backend `CORS_ORIGINS`; no cookies or credentialed CORS are
  used.
- `make check` passes.

## Plan coverage

Workstream 9; sections 7.6, 7.7, 8, 10, and 12; the edit/delete/restore/backup outcomes and traceability entries.
