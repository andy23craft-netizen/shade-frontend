# FEAT-25 -- Remove the browser backup page

## Objective

Finish docs hygiene for withdrawing the browser backup page. Product code already removed `/admin/backup`,
`BackupLibraryPage`, and `backupApi`. Nightly SQL backups remain an API-host concern (`GET /backup` via
`scripts/fetch_backup.py` / cron). Do not change the backend contract.

## Dependencies

Backend operational fetch-backup has shipped. Frontend product removal has shipped (see Current baseline). Remaining
work is documentation only.

FEAT-17 About homepage, FEAT-19 wishlists, FEAT-22 check-in on `/loans`, FEAT-23 checkout on book details, and FEAT-24
hardware ISBN scan on Dashboard / Books / Loans are complete; do not reference their removed ticket files.

Do not pull FEAT-26 wishlist move-to-shelf or FEAT-27 Collections into this implementation.

## Contract references

No new backend endpoints and **no** HTTP contract change. Leave in place:

- `../technical-reference/openapi.json` -- `GET /backup` (Bearer; `application/sql` attachment;
  `Content-Disposition` filename; **200** dump; **403** rejected credentials; **500**
  `{"detail": "Failed to generate database backup"}`).
- `../technical-reference/API-for-FE.md` -- dump includes soft-deleted books and historical loans; finite stream, not
  JSON; frontend must not inspect, log, cache, or upload dump contents.

Do not invent a frontend restore-from-SQL, backup-status, or backup-list API.

## Current baseline

Already shipped in code (do not re-implement):

- `/admin/backup` is not a product route. Visiting it hits `*` / `NotFoundPage` ("Page Not Found"). Asserted in
  `AppShell.test.tsx`.
- `BackupLibraryPage.tsx` / `.test.tsx`, `backupApi.ts` / `.test.ts` deleted. `createApi` has no `backup` aggregate
  (`api.ts` / `api.test.ts`).
- `/collection/manage` (`ManageCollectionPage`) lists Add Book, Shelves, and Deleted Books only. Softened header copy
  ("maintain your library"). `ManageCollectionPage.test.tsx` asserts no Backup Library link.
- `CatalogGuide` Administration copy links restore deleted books only; no `/admin/backup`. `AboutPage.test.tsx`
  matches that.
- Collection drawer `activePrefixes` keeps `/admin/deleted` and does not include `/admin/backup`.
- `apiClient` still handles non-JSON success bodies (`/backup` remains an example path in `apiClient.test.ts`).
- `apiRedaction` still denylists backup contents.
- Vite optional API proxy still allowlists `/backup`. `scripts/contractSmoke.test.ts` and
  `scripts/productionLikeHost` still verify authenticated `GET /backup` (API host, not SPA).
- `README.md` points operators at backend `make fetch-backup` / `scripts/fetch_backup.py` / scheduled backup; no
  browser download release-blocker or smoke step.
- `docs/ToDo.md` checklist line for this ticket is marked done.

Still stale (this ticket's remaining work):

- `docs/AGENTS.md` still lists `/admin/backup` / `BackupLibraryPage` / `backupApi` as live product UI, names Backup
  Library on Manage Collection, keeps backup-page smoke and download-helper coverage inventory, and lists FEAT-25
  under **Next**.
- `docs/MAINTAINERS.md` still inventories `backupApi`, `/admin/backup`, and browser `Content-Disposition` access as a
  production connectivity requirement.
- `docs/full-project-context.md` still mirrors the pre-removal route, nav, Catalog Guide, and API-helper notes.

## Product intent

1. **Backups are operational, not a product page** -- operators do not download SQL from Shade in the browser.
2. **Docs must match the SPA** -- no live-product description of Backup Library, `backupApi`, or a required browser
   download. Preserve "never inspect/log/cache/upload dump contents" and OpenAPI / production-like host `/backup`
   connectivity as API verification.
3. **Do not revive the page** -- no relocate of download onto Deleted Books, Dashboard, or About; no cron-status or
   restore-from-SQL UI in the frontend.

## Out of scope

- Changing `GET /backup`, OpenAPI, Vite `/backup` proxy prefix, or production-like host `/backup` checks.
- Backend / orchestrator fetch-backup scripts or crontab.
- FEAT-26 / FEAT-27 product work.
- Re-deleting already-removed page/client files.

## Remaining scope (docs hygiene)

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Shipped capabilities: soft delete/restore and deleted admin only -- no `/admin/backup`. Drop Backup Library from
  live product UI, `/collection/manage`, Catalog Guide, route inventory, and "leave `/admin/backup` under
  `BackupLibraryPage`." Remove `backupApi` from the API layer inventory and `createApi` aggregate. Lifecycle table:
  `GET /backup` is backend/operational, not a frontend caller. Preserve "never inspect/log/cache/upload dump
  contents." Collection maintenance on Manage Collection: Add Book, Shelves, Deleted Books only. MVP in-scope prose
  may still say the *library* has authenticated SQL backup; it must not say the *browser* downloads it. Evergreen
  smoke scope: drop "backup page"; deleted-books administration stays. Automated coverage inventory: drop backup
  success/failure, SQL content-type/filename, UTF-8 `Content-Disposition` for the download helper, and object-URL
  cleanup after backup download. Keep generic timeout, Bearer, unauthorized, and production-like host `/backup`
  connectivity coverage. Mark FEAT-25 complete (ticket file removed) in the completed / next ticket narrative. |
| `docs/full-project-context.md` | Same route, nav, Catalog Guide, and API-helper notes when that pack is kept current. |
| `docs/MAINTAINERS.md` | Registered product routes: drop `/admin/backup`. Inventory: drop `backupApi` /
  `BackupLibraryPage`. Keep OpenAPI `/backup` as a backend path. Manage Collection links: Add Book, Shelves, Deleted
  Books only. Drop browser backup `Content-Disposition` as a frontend production connectivity requirement; keep
  authenticated CORS/Bearer (or same-origin proxy) verification. Production-like host may still mention `/backup`
  as API connectivity. |
| `docs/ToDo.md` | Already marked done; leave as-is until this ticket file is deleted on completion. |

`docs/product-docs/PRODUCT_REQS.V1.md` has no Backup Library heading to revive. Do not add a browser backup page after
this withdrawal.

## Acceptance criteria

- `docs/AGENTS.md` no longer describes `/admin/backup` as a live feature route, `BackupLibraryPage`, or `backupApi`,
  and no longer lists FEAT-25 under **Next**.
- `docs/MAINTAINERS.md` and `docs/full-project-context.md` match the same post-removal inventory (no product backup
  page; no unused `backupApi`).
- Product code remains as in Current baseline (no SPA caller of `GET /backup`; OpenAPI / contract smoke /
  production-like host `/backup` checks unchanged).
- When docs are current, delete this ticket file and treat FEAT-25 as complete in AGENTS / ToDo narrative.

## Plan coverage

Deleted-books admin and a browser SQL download shipped earlier (FEAT-10). Backend fetch-backup + container cron and
frontend page/client removal have shipped. Remaining work is aligning AGENTS / MAINTAINERS / full-project-context with
that removal. Explicitly excludes backend contract changes and FEAT-26 / FEAT-27 product work.
