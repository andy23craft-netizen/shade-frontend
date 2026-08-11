# FEAT-10 — Book administration, restoration, and backup

## Objective

Maintain book metadata, safely manage soft deletion/restoration, and download a complete authenticated SQL backup.

## Dependencies

FEAT-09.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for `PATCH /books/{id}` / `BookUpdate`, `DELETE /books/{id}`,
  `GET /books` (`include_deleted`), `POST /books/{id}/restore`, success `BookRead` / `BookList`, `GET /backup`
  (`application/sql` + `Content-Disposition`), and error schemas (`ErrorDetail`, `HTTPValidationError`).
- `../technical-reference/API-for-FE.md` -- behavioral guidance OpenAPI does not fully express (soft-delete visibility
  and retained history, independent loan/reading/delete axes, on-loan delete leaving an open loan, generic `PATCH`
  accepting soft-deleted rows without bumping `updated_date`, blank-ISBN/`null` rules, backup blob download, CORS
  header exposure, and FE vs API ownership of lifecycle).

Reuse FEAT-03 typed book-update, delete, restore, list, and backup helpers and mutation/cache invalidation. Reuse the
FEAT-05 book form for metadata edit. Do not invent a second administration client. Prefer dedicated delete/restore
endpoints over reproducing their effects with `PATCH`, and never use generic `PATCH` to simulate checkout, check-in,
initial mark-read, or restore.

### Documented contract facts for this ticket

Confirm against a representative running backend `/openapi.json` before locking behavior; record drift as a blocker.

#### Metadata edit (`PATCH /books/{id}`)

- Path `{id}` is any string; missing rows return `404` with string `detail` (`Book not found`). Soft-deleted books
  remain readable via `GET /books/{id}` and still accept generic `PATCH` (including `status` / `borrower` / `is_read`)
  without creating or updating loans -- do not use that as a lifecycle back door.
- Request body is required `BookUpdate`. Every property is optional (partial update). Request models ignore unknown
  properties. OpenAPI documents success as `200` with `BookRead`, plus `403`, `404`, and FastAPI `422` (`detail[]`).
  There is no edit `409`.
- `PATCH` does not bump `updated_date`. Do not treat `updated_date` as a concurrency token or infer freshness from it
  after a metadata edit.
- Compute a minimal patch of intentionally changed metadata fields only. In-scope transport properties:
  `isbn13`, `title`, `authors`, `publisher`, `publication_date`, `pages`, `category`, `shelf`, `tags`,
  `purchase_date`, `purchase_price`, `notes`, `acquisition_source`, and non-loan `status` values (`unknown`,
  `available`, `missing`, `display_only`, `reserved`, `reading`). Unchanged fields must be absent from the request
  (`exclude_unset` semantics).
- Exclude from this ticket's edit payload: `borrower`, `datetime_loaned_out`, `status=on_loan`, reading fields owned by
  FEAT-09 (`is_read`, `completion_date`, `rating`, `review`), and any attempt to drive soft-delete/restore through
  `PATCH` (`deletion_date` is not a `BookUpdate` property; restore is `POST .../restore` only).
- Never send `null` for DB-required fields such as `title`, `authors`, `category`, `shelf`, `is_read`, or `status` --
  that can cause an unhandled server error on commit. A blank ISBN intentionally clears to `null` (same create/update
  rule as FEAT-05). The API normalizes `isbn13` when possible; preserve the submitted value and rely on the API for
  canonical form.
- `pages` is a positive integer (`exclusiveMinimum: 0`) or `null`. `title` / `authors` / `publisher` use documented
  `maxLength` values; `isbn13` allows `maxLength` 14. Temporal fields are plain strings; still serialize user-entered
  dates as `YYYY-MM-DD`. `purchase_price` remains an unconstrained nullable `number`.

#### Soft delete (`DELETE /books/{id}`)

- Success is `204 No Content` (no JSON body). Documented errors: `403`, `404`, and FastAPI `422` (`detail[]`). There
  is no delete `409`.
- Missing book → `404` with `{"detail": "Book not found"}`. Second/stale delete of an already soft-deleted book →
  `404` with `{"detail": "Book already deleted"}`. Soft-deleted books are omitted from `GET /books` unless
  `include_deleted=true`, remain readable via `GET /books/{id}`, keep loan and reading data, and are rejected by
  checkout / check-in / mark-read (`404`).
- Deleting an on-loan book is permitted by the API but leaves its active loan open; check-in cannot complete until the
  book is restored. This ticket must prevent that deletion in the UI when book `status` is `on_loan` or an active loan
  record exists (`returned_at=null`).

#### Deleted list and restore

- Build `/admin/deleted` from `GET /books?include_deleted=true` (`BookList` `{ items, total }`). Soft-deleted rows
  count in `total`. Client-filter on non-null `deletion_date`; do not invent a deleted-only list endpoint or
  pagination.
- Soft-deleted detail remains available through `GET /books/{id}` (`200` with non-null `deletion_date`). Show retained
  reading and borrowing information and disable lifecycle actions the API rejects on deleted books (checkout, check-in,
  mark-read). Prefer dedicated restore over implying `PATCH` can undelete.
- `POST /books/{id}/restore` returns `200` with `BookRead` (`deletion_date: null`). Missing book → `404`
  (`Book not found`). Restoring an already-active book → `409` with `{"detail": "Book is not deleted"}`. Explain stale
  state, refetch, and avoid unsafe resubmission.

#### Backup (`GET /backup`)

- Authenticated Bearer download only. Response is `application/sql` (binary attachment), not JSON, and includes
  soft-deleted books plus complete loan history. OpenAPI documents `200` with `Content-Disposition`, plus `403` and
  generation `500` (`{"detail": "Failed to generate database backup"}`).
- Filename pattern: `Shade Library - YYYY-mm-dd_HH-MM-SS_Z.sql` (UTC; literal `Z`). Prefer the UTF-8
  `filename*=UTF-8''...` form from the exposed `Content-Disposition` header; provide a sensible fallback such as
  `Shade Library backup.sql`.
- Direct navigation cannot attach the Bearer token. Use authenticated `fetch`, `response.blob()`, a programmatic
  `<a download>`, and always `URL.revokeObjectURL`. Do not inspect, log, cache, or upload dump contents. Credentialed
  CORS (cookies) is disabled; `Content-Disposition` is exposed for JavaScript access when the exact frontend origin is
  listed in backend `CORS_ORIGINS`.

## Scope

### Edit (`/books/:bookId/edit`)

- Implement `/books/:bookId/edit` with the reusable FEAT-05 book form and `PATCH /books/{id}` using the minimal-patch
  rules above.
- Load the current `BookRead` first. Reject deep-links to missing books with accessible `404` handling. Soft-deleted
  targets may still be patchable by the API; do not present edit as a substitute for restore/delete, and never send
  loan or initial mark-read fields from this form.
- Map `422 detail[].loc` entries to fields; preserve the draft, focus an error summary, and link field errors.
  Duplicate-submit prevention and success feedback required.
- On success, update the returned `BookRead` in cache and invalidate active/deleted lists, detail, and dashboard
  queries per FEAT-03 / PLAN 7.5.

### Delete (detail / collection contexts)

- Add an accessible delete confirmation explaining soft deletion and retained history. Destructive intent must be clear
  without relying on color; trap and restore focus via the shared confirmation dialog.
- Use `DELETE /books/{id}` and correctly handle `204 No Content`.
- Block initiate/submit when `status` is `on_loan` or an active loan exists. Already soft-deleted books must not be
  offered delete again.
- On success, remove the book from normal browsing and frontend-derived active caches without erasing history, and
  invalidate deleted-list / detail / dashboard queries as needed.
- On stale `404` (`Book not found` or `Book already deleted`), refetch and explain the new state.

### Deleted books (`/admin/deleted`)

- Implement `/admin/deleted` from mixed `include_deleted=true` results filtered on non-null `deletion_date`.
- Show retained reading and borrowing information; disable invalid lifecycle actions; offer restore.
- Restore with `POST /books/{id}/restore`, return records to active browsing, and invalidate active/deleted lists,
  detail, and dashboard data.
- On restore `409` (`Book is not deleted`) or `404`, refetch and explain the new state.

### Backup (`/admin/backup`)

- Implement `/admin/backup` using authenticated `GET /backup` with the blob-download behavior above.
- Show progress and recoverable `403`, generation `500`, network, and interrupted-download states. Warn that the file
  contains active and deleted books plus complete loan history. Never create a download after a failed response.

## Acceptance criteria

- Send explicit `null` only for documented nullable fields; never send it for `title`, `authors`, `category`, `shelf`,
  `is_read`, or `status`. A blank ISBN intentionally clears to `null`.
- Unchanged fields are absent from edit requests; loan state and FEAT-09 reading fields cannot be edited here.
- Field-mapped `422` responses preserve the edit draft and focus accessible error feedback.
- Delete removes a book from normal browsing and frontend-derived active caches without erasing history (`204`).
- Deleted records remain inspectable via id / deleted admin and can be restored to the active collection (`200`
  `BookRead` with `deletion_date: null`).
- Stale delete handles `404` (`Book not found` / `Book already deleted`) by refetching and explaining the new state.
  Stale restore handles `404` and `409` (`Book is not deleted`) the same way.
- Books whose `status` is `on_loan` or which have an active loan record cannot initiate or submit deletion.
- Confirmation focus is trapped/restored and destructive intent is clear without relying on color.
- Tests cover minimal patch generation, clearable values (including blank ISBN → `null`), active-loan deletion policy,
  `204`, soft-deleted `PATCH` non-bypass, stale delete/restore, and cache invalidation.
- Backup tests cover an authenticated non-empty SQL response, UTF-8 and fallback filenames, object-URL cleanup,
  generation `500` with detail `Failed to generate database backup`, rejected access (`403`), network failure, and
  suppression of bogus downloads after failure.
- A production-like cross-origin test verifies authenticated preflight and JavaScript access to exposed
  `Content-Disposition` with the exact frontend origin in backend `CORS_ORIGINS`; no cookies or credentialed CORS are
  used.
- `make check` passes.

## Plan coverage

Workstream 9; sections 7.6, 7.7, 8, 10, and 12; the edit/delete/restore/backup outcomes and traceability entries.
