# FEAT-25 -- Remove the browser backup page

## Objective

`/admin/backup` is a browser download of `GET /backup`. Nightly SQL backups belong on the API host, not in the SPA.
Remove the Backup Library page, its Manage Collection and Catalog Guide links, and the unused frontend backup client.
Do not change the backend contract: `GET /backup` stays for the operational fetch script.

## Dependencies

Backend operational fetch-backup has shipped (backend FEAT-01 ticket file removed):

- `scripts/fetch_backup.py`
- `make fetch-backup`
- Podman image crontab (`ci/crontab` nightly `scripts/fetch_backup.py`)

The frontend gate is satisfied; start this ticket. Pi/orchestrator host crontab install may still be an ops follow-up
in the backend/orchestrator repos and does not block removing the browser page.

FEAT-10 backup download is complete (`BackupLibraryPage`, `backupApi.get`, programmatic `<a download>`, always
`URL.revokeObjectURL`). Deleted-books admin on `/admin/deleted` is independent and stays.

FEAT-17 About homepage, FEAT-19 wishlists, FEAT-22 check-in on `/loans`, FEAT-23 checkout on book details, and FEAT-24
hardware ISBN scan on Dashboard / Books / Loans are complete; do not reference their removed ticket files.

Do not pull FEAT-26 wishlist move-to-shelf or FEAT-27 Collections into this implementation.

## Contract references

No new backend endpoints and **no** HTTP contract change. Treat these as complementary and leave them in place:

- `../technical-reference/openapi.json` -- `GET /backup` (Bearer; `application/sql` attachment;
  `Content-Disposition` filename; **200** dump; **403** rejected credentials; **500**
  `{"detail": "Failed to generate database backup"}`).
- `../technical-reference/API-for-FE.md` -- dump includes soft-deleted books and historical loans; finite stream, not
  JSON; frontend must not inspect, log, cache, or upload dump contents. That hygiene still applies if any leftover
  client code is touched; this ticket should delete the caller instead of adding new download UX.

Do not invent a frontend restore-from-SQL, backup-status, or backup-list API. Completing a backup is `GET /backup` on
the API host (script / cron), not a browser download.

## Current baseline

Already in place:

- `/admin/backup` via `BackupLibraryPage` + `backupApi.get` through `useConnection().apiClient`. Download Backup
  fetches the SQL blob, parses UTF-8 `Content-Disposition` (`filename*=UTF-8''...`) with a `backup.sql` fallback,
  triggers a programmatic `<a download>`, and always `URL.revokeObjectURL`. Documented **403** / generation **500** /
  timeout / unreachable messaging. Warning copy: the file contains complete library history.
- Primary nav in `AppShell`: direct Dashboard link; Collection `DrawerNavMenu` (Browse, Manage, Wishlists);
  Circulation `DrawerNavMenu` (Loans only -- no Check Out or Check In items). There is no Administration group in the
  header. Backup Library is linked from `/collection/manage` (`ManageCollectionPage`) alongside Add Book, Shelves, and
  Deleted Books. Collection drawer `activePrefixes` includes `/admin/backup` and `/admin/deleted`.
- About `CatalogGuide` (How to Use dialog) still links "download a library backup" to `/admin/backup` under an
  Administration paragraph (alongside restore deleted books). `AboutPage.test.tsx` asserts that link.
- `createApi` exposes `backup: createBackupApi(client)`. Nothing else in product UI calls it.
- `apiClient.get` already returns raw `Response` for non-JSON bodies. Colocated `apiClient.test.ts` uses `/backup` as
  the binary-success example path.
- Vite optional same-origin proxy allowlists `/backup` among other API prefixes.
- `scripts/contractSmoke.test.ts` asserts checked-in OpenAPI includes `/backup`.
- `scripts/productionLikeHost.ts` / `.test.ts` still hit authenticated `GET /backup` for CORS / Bearer /
  `Content-Disposition` connectivity checks (API host verification, not an SPA journey).
- Playwright `e2e/` has no backup journey and `e2e/support/mockApi.ts` has no `/backup` handler. Accessibility scans
  do not include `/admin/backup`.
- No backup-specific CSS in `src/styles/`.
- No `ManageCollectionPage.test.tsx` yet.
- `README.md` treats JavaScript access to backup `Content-Disposition` and an authenticated browser backup download as
  production release-blocker / smoke-checklist items.
- `docs/ToDo.md` has no checklist line for this ticket yet.

The overlap: backend fetch-backup already calls the same authenticated `GET /backup`, writes to `data/backups/`, and
discards unchanged dumps. A second, manual browser download does not add operational coverage and puts a full SQL dump
on whatever device opened the SPA.

## Product intent

1. **Backups are operational, not a product page** -- operators do not download SQL from Shade in the browser. Nightly
   fetch + content dedup lives on the API (backend `scripts/fetch_backup.py` / cron). Emergency/local dumps remain
   `make backup` / `scripts/backup_db.py` in the backend repo.
2. **Remove `/admin/backup`** -- no Backup Library heading, no Download Backup control, no link from Manage Collection
   or Catalog Guide. Deleted Books remains reachable via Collection → Manage → Deleted Books (`/admin/deleted`).
3. **Do not keep a dead API helper** -- once the page is gone, `backupApi` has no callers. Delete it and drop `backup`
   from `createApi`. Do not leave an unused blob downloader "in case."
4. **Do not call `GET /backup` from the SPA** -- generated OpenAPI may still list the path; the frontend must not
   fetch it. Leave `yarn api:generate` / `yarn api:check`, contract smoke, and production-like host `/backup`
   connectivity checks as they are (no OpenAPI edit in this ticket; those scripts verify the API, not a product page).
5. **Old `/admin/backup` URLs** -- remove the product route. Visiting `/admin/backup` uses the existing `*` not-found
   page (heading "Page Not Found", link back into the app). Do **not** keep a "Backup Library" document title. Do not
   invent a compatibility redirect to Deleted Books or Dashboard (those are the wrong capability). Do not add a
   "backups moved to the server" product page.
6. **Sensitive dumps stay denylisted** -- `apiRedaction` must still refuse backup contents in diagnostics even with
   no download UI.

Tone: delete the page and its client; do not relocate download onto Deleted Books, Dashboard, or About. Do not add
cron status, backup-file browsing, or restore-from-SQL in the frontend.

## Out of scope

- Changing `GET /backup` request/response shape, auth, dump format, or OpenAPI.
- Implementing or editing `scripts/fetch_backup.py`, container cron, or Pi crontab (backend / orchestrator).
- Replacing `scripts/backup_db.py` / `make backup`.
- A frontend backup list, restore-from-dump, encryption, or off-box copy UI.
- FEAT-15 Podman image work or changing Vite's optional `/backup` proxy prefix (that prefix proxies the API, not the
  SPA route).
- Removing `scripts/productionLikeHost` authenticated `/backup` connectivity checks (API verification stays).
- FEAT-26 / FEAT-27 product work.

## Remaining scope (file-level plan)

### 1. Remove the page and route

| File | Change |
| ---- | ------ |
| `src/features/books/routes/BackupLibraryPage.tsx` | Delete. |
| `src/features/books/routes/BackupLibraryPage.test.tsx` | Delete. Do not leave a suite that mounts `/admin/backup` as a real page. |
| `src/routes/routeMetadata.ts` | Delete `backup`. Keep `deletedBooks` title/heading "Deleted Books". |
| `src/routes/routes.tsx` | Stop importing `BackupLibraryPage`. Remove the `routeMetadata.backup` child. Do not add a named redirect; `*`
  already covers unknown paths. |
| `src/features/collection/routes/ManageCollectionPage.tsx` | Remove the Backup Library `AppLink`. Keep Add Book, Shelves, and Deleted Books. Soften the header copy if it still
  implies a browser backup ("maintain your library" is fine without naming Backup Library). |
| `src/features/collection/routes/ManageCollectionPage.test.tsx` (new) | Assert Manage Collection offers Add Book, Shelves, and Deleted Books only; no Backup Library link to
  `/admin/backup`. |
| `src/features/about/components/CatalogGuide.tsx` | Remove the "download a library backup" link and `/admin/backup` reference. Keep restore deleted books. Retone the
  Administration sentence so it does not promise a browser backup. |
| `src/features/about/routes/AboutPage.test.tsx` | Drop assertions for the backup Catalog Guide link. Keep restore-deleted and other workflow links. |
| `src/layout/AppShell.tsx` | Remove `/admin/backup` from the Collection drawer `activePrefixes` (keep `/admin/deleted` if Deleted Books
  remains under that prefix). No header nav item to remove -- Backup Library was never in the header. |
| `src/layout/AppShell.test.tsx` | Assert the Collection drawer Manage link still points to `/collection/manage`. Assert there is no header or
  drawer link to `/admin/backup`. Circulation stays Loans only. |

### 2. Remove the unused backup client

| File | Change |
| ---- | ------ |
| `src/api/backupApi.ts` | Delete. |
| `src/api/backupApi.test.ts` | Delete. Filename / `Content-Disposition` cases leave with the helper; do not port them into page tests. |
| `src/api/api.ts` | Drop the `backupApi` import and `backup` aggregate. |
| `src/api/api.test.ts` | Stop expecting `api.backup`. Keep the rest of the `createApi` surface assertions. |
| `src/api/apiClient.test.ts` | Keep binary/`application/sql` coverage. The `/backup` path in those examples may stay (it tests `client.get`, not the page) or become any non-JSON path; do not delete blob handling. |
| `src/api/apiRedaction.ts` / `src/api/apiRedaction.test.ts` | Keep the backup denylist and fixtures. Do not start logging dump contents. |
| `src/api/generated/openapi.ts` | Do not hand-edit. `/backup` remains in the checked-in spec. |
| `scripts/contractSmoke.test.ts` | Keep `/backup` on the OpenAPI smoke list. |
| `scripts/productionLikeHost.ts` / `productionLikeHost.test.ts` | Keep authenticated `/backup` connectivity / `Content-Disposition` checks (API host, not SPA). |
| `vite.config.ts` | Leave `/backup` in the optional API proxy allowlist. That is not the SPA route. |

### 3. Browser journeys

| File | Change |
| ---- | ------ |
| `e2e/accessibility.spec.ts` | No change (backup is not a critical route today). Do not add `/admin/backup`. |
| `e2e/support/mockApi.ts` | No `/backup` handler today; do not add one. |
| `e2e/library.lifecycle.spec.ts` | Unchanged (no backup step). |

### 4. Docs hygiene (as part of this ticket, not a follow-up)

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Shipped capabilities: soft delete/restore and deleted admin only -- no `/admin/backup`. Drop Backup Library from
  live product UI, `/collection/manage`, Catalog Guide, route inventory, and "leave `/admin/backup` under
  `BackupLibraryPage`." Remove `backupApi` from the API layer inventory and `createApi` aggregate. Lifecycle table:
  `GET /backup` is backend/operational, not a frontend caller; do not list it as an SPA lifecycle action. Preserve
  "never inspect/log/cache/upload dump contents." Collection maintenance on Manage Collection: Add Book, Shelves,
  Deleted Books only (no Backup Library). MVP in-scope prose can still say the *library* has authenticated SQL backup;
  it must not say the *browser* downloads it. Evergreen smoke scope: drop "backup page"; deleted-books administration
  stays. Automated coverage inventory: drop backup success/failure, SQL content-type/filename, UTF-8
  `Content-Disposition` for the download helper, and object-URL cleanup after backup download. Keep generic timeout,
  Bearer, unauthorized, and production-like host `/backup` connectivity coverage. Mark FEAT-25 complete (ticket file
  removed) in the completed / next ticket narrative. |
| `docs/full-project-context.md` | Same route, nav, Catalog Guide, and API-helper notes when that pack is kept current. |
| `docs/ToDo.md` | Add a checklist line for this ticket (and mark it done when the work ships). |
| `docs/MAINTAINERS.md` | Registered product routes: drop `/admin/backup`. Inventory: drop `backupApi` / `BackupLibraryPage`. Keep OpenAPI
  `/backup` as a backend path. Manage Collection links: Add Book, Shelves, Deleted Books only. |
| `README.md` | Update onboarding and production handoff for the withdrawn browser backup page. Production connectivity: drop
  "JavaScript access to the backup response `Content-Disposition` filename" as a frontend release blocker; authenticated
  API access and CORS/preflight (or same-origin proxy) stay. Production smoke checklist: remove the authenticated
  backup download item (non-empty SQL attachment, `Content-Disposition` filename, generation `500`, object-URL cleanup).
  Keep CI/privacy notes that backup dumps must not appear in artifacts or be inspected/logged by the SPA. Point
  operators at backend `make fetch-backup` / `scripts/fetch_backup.py` / nightly cron for operational backups instead of
  the removed page. |

`docs/product-docs/PRODUCT_REQS.V1.md` has no Backup Library heading to revive. Do not add a browser backup page after
this withdrawal.

## Acceptance criteria

- `/admin/backup` is not a product page. Visiting it shows the existing not-found route, not "Backup Library."
- `/collection/manage` lists Add Book, Shelves, and Deleted Books only; no Backup Library link to `/admin/backup`.
- Catalog Guide no longer links to `/admin/backup` or promises a browser backup download.
- `BackupLibraryPage` and `backupApi` are gone. `createApi` has no `backup` helper. No application module calls
  `GET /backup`.
- Generated OpenAPI still documents `/backup`; `yarn api:check` / contract smoke still see that path. This ticket does
  not edit `docs/technical-reference/openapi.json`.
- `apiClient` still handles non-JSON success bodies. Redaction still denylists backup contents.
- Optional Vite API proxy may still forward `/backup`. Production-like host tests may still call `/backup` for API
  connectivity. That is not a product route.
- Colocated tests cover Manage Collection, Catalog Guide, drawer prefixes, and `createApi` without a backup aggregate.
  No leftover suite mounts `/admin/backup`. `make check` passes.
- `README.md` no longer treats a browser backup download or backup `Content-Disposition` access as a frontend release
  blocker or production smoke step; it documents operational backup via the backend fetch script instead.
- `docs/AGENTS.md` (and ToDo / MAINTAINERS as listed) no longer describe `/admin/backup` as a live feature route or a
  required browser download.

## Plan coverage

Deleted-books admin and a browser SQL download already shipped (FEAT-10). Backend fetch-backup + container cron have
shipped. This ticket is IA cleanup: one operational backup path (`GET /backup` via script/cron), no SPA download page.
Explicitly excludes backend contract changes and FEAT-26 / FEAT-27 product work.
