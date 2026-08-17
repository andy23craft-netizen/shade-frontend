# FEAT-25 -- Remove the browser backup page

## Objective

`/admin/backup` is a browser download of `GET /backup`. Nightly SQL backups belong on the API host, not in the SPA.
Remove the Backup Library page, its admin nav item, and the unused frontend backup client. Do not change the backend
contract: `GET /backup` stays for the operational fetch script.

## Dependencies

This ticket is **gated** on backend
[`../shade-backend/docs/FEAT-01_fancy-backups-script.md`](../../../shade-backend/docs/FEAT-01_fancy-backups-script.md)
(checked-in filename: `FEAT-01_fancy-backups-script.md`). Do not start frontend work until that ticket has shipped
`scripts/fetch_backup.py`, `make fetch-backup`, and nightly cron (Podman image crontab plus documented Pi/orchestrator
host cron). Today the browser page is the only operator backup path; removing it first would leave no backup path.

FEAT-10 backup download is complete (`BackupLibraryPage`, `backupApi.get`, programmatic `<a download>`, always
`URL.revokeObjectURL`). Deleted-books admin on `/admin/deleted` is independent and stays.

Sibling open tickets still mention `/admin/backup` or a browser backup download (FEAT-15 route lists, FEAT-16
production smoke and `Content-Disposition` access, FEAT-17 About links). Update those tickets in the same change so
later work does not rebuild the page.

Do not pull FEAT-15 Podman, FEAT-16 release artifacts, FEAT-17 About / homepage, FEAT-18 collection filters,
FEAT-19 wishlists, FEAT-20 dashboard reports, FEAT-21 display-only alternate copies, FEAT-22 check-in consolidation,
FEAT-23 checkout-on-details, or FEAT-24 extra scanner surfaces into this implementation.

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
- Admin nav in `AppShell`: "Deleted Books" (`/admin/deleted`) and "Backup Library" (`/admin/backup`).
- `createApi` exposes `backup: createBackupApi(client)`. Nothing else in product UI calls it.
- `apiClient.get` already returns raw `Response` for non-JSON bodies. Colocated `apiClient.test.ts` uses `/backup` as
  the binary-success example path.
- Vite optional same-origin proxy allowlists `/backup` among other API prefixes.
- `scripts/contractSmoke.test.ts` asserts checked-in OpenAPI includes `/backup`.
- Playwright `e2e/` has no backup journey and `e2e/support/mockApi.ts` has no `/backup` handler. Accessibility scans
  do not include `/admin/backup`.
- No backup-specific CSS in `src/styles/`.

The overlap: backend FEAT-01 already calls the same authenticated `GET /backup`, writes to `data/backups/`, and
discards unchanged dumps. A second, manual browser download does not add operational coverage and puts a full SQL dump
on whatever device opened the SPA.

## Product intent

1. **Backups are operational, not a product page** -- operators do not download SQL from Shade in the browser. Nightly
   fetch + content dedup lives on the API (backend FEAT-01). Emergency/local dumps remain `make backup` /
   `scripts/backup_db.py` in the backend repo.
2. **Remove `/admin/backup`** -- no Backup Library heading, no Download Backup control, no admin nav item. Deleted
   Books remains the only Administration destination.
3. **Do not keep a dead API helper** -- once the page is gone, `backupApi` has no callers. Delete it and drop `backup`
   from `createApi`. Do not leave an unused blob downloader "in case."
4. **Do not call `GET /backup` from the SPA** -- generated OpenAPI may still list the path; the frontend must not
   fetch it. Leave `yarn api:generate` / `yarn api:check` and contract smoke as they are (no OpenAPI edit in this
   ticket).
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
- Implementing or editing `scripts/fetch_backup.py`, container cron, or Pi crontab (backend FEAT-01 /
  orchestrator).
- Replacing `scripts/backup_db.py` / `make backup`.
- A frontend backup list, restore-from-dump, encryption, or off-box copy UI.
- Relocating dashboard / About (FEAT-17) beyond dropping `/admin/backup` from that ticket's planned links.
- FEAT-15 Podman image work, FEAT-16 tarball packaging, or changing Vite's optional `/backup` proxy prefix (that
  prefix proxies the API, not the SPA route).

## Remaining scope (file-level plan)

### 1. Remove the page and route

| File | Change |
| ---- | ------ |
| `src/features/books/routes/BackupLibraryPage.tsx` | Delete. |
| `src/features/books/routes/BackupLibraryPage.test.tsx` | Delete. Do not leave a suite that mounts `/admin/backup` as a real page. |
| `src/routes/routeMetadata.ts` | Delete `backup`. Keep `deletedBooks` title/heading "Deleted Books". |
| `src/routes/routes.tsx` | Stop importing `BackupLibraryPage`. Remove the `routeMetadata.backup` child. Do not add a named redirect; `*` already covers unknown paths. |
| `src/layout/AppShell.tsx` | Remove the admin "Backup Library" `NavLink`. Keep "Deleted Books". |
| `src/layout/AppShell.test.tsx` | Drop "Backup Library" from the nav label list. Assert there is no link to `/admin/backup`. Keep Deleted Books → `/admin/deleted`. |

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
| `vite.config.ts` | Leave `/backup` in the optional API proxy allowlist. That is not the SPA route. |

### 3. Browser journeys and baselines

| File | Change |
| ---- | ------ |
| `e2e/accessibility.spec.ts` | No change (backup is not a critical route today). Do not add `/admin/backup`. |
| `e2e/support/mockApi.ts` | No `/backup` handler today; do not add one. |
| `e2e/library.lifecycle.spec.ts` | Unchanged (no backup step). |
| `docs/baselines/FEAT-12_browser-support.md` | Smoke scope: drop "backup page". Deleted-books administration stays. |
| `docs/baselines/FEAT-13_testing.md` | Automated coverage list: drop backup success/failure, SQL content-type/filename, UTF-8 `Content-Disposition` for the download helper, and object-URL cleanup after backup download. Keep generic timeout, Bearer, and unauthorized coverage. |

### 4. Docs hygiene (as part of this ticket, not a follow-up)

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Shipped capabilities: soft delete/restore and deleted admin only -- no `/admin/backup`. Drop Backup Library from live product UI, route inventory, and "leave `/admin/backup` under `BackupLibraryPage`." Remove `backupApi` from the API layer inventory and `createApi` aggregate. Lifecycle table: `GET /backup` is backend/operational, not a frontend caller; do not list it as an SPA lifecycle action. Preserve "never inspect/log/cache/upload dump contents." Nav: Administration is Deleted Books only. Update "Next" remaining tickets to include FEAT-25 until this file is removed after completion. MVP in-scope prose can still say the *library* has authenticated SQL backup; it must not say the *browser* downloads it. |
| `docs/full-project-context.md` | Same route, nav, and API-helper notes when that pack is kept current. |
| `docs/ToDo.md` | Add a checklist line for this ticket. |
| `docs/product-docs/PLAN.md` | Target IA: drop `/admin/backup` (the duplicate bullet too). Workstream 9 already shipped FEAT-10; record that browser download is withdrawn in favor of backend FEAT-01 nightly fetch. Release-blocker / CORS notes that require JavaScript to read backup `Content-Disposition` should stop treating a browser download as a frontend deliverable (host CORS may still expose the header; the SPA does not consume it). |
| `docs/MAINTAINERS.md` | Registered product routes: drop `/admin/backup`. Inventory: drop `backupApi` / `BackupLibraryPage`. Keep OpenAPI `/backup` as a backend path. |
| `README.md` | Production connectivity: do not require "JavaScript access to the backup response `Content-Disposition` filename" as a frontend release blocker. Authenticated API access and CORS/preflight (or same-origin proxy) stay. Artifact/gitignore notes that mention backup dumps as non-deployable files can stay. |
| `docs/tickets/FEAT-15_podman-development-and-preview.md` | SPA route list: remove `/admin/backup`. |
| `docs/tickets/FEAT-16_versioned-release-artifacts.md` | Smoke checklist: drop "authenticated backup download" and backup-generation `500` / filename handling as *frontend* browser checks. Keep rejecting SQL dumps inside the static tarball. CORS `Content-Disposition` exposure is not a SPA requirement after this ticket. |
| `docs/tickets/FEAT-17_about-page.md` | How-to links: restore under `/admin/deleted` only. Do not link `/admin/backup` or promise an in-app SQL download. Optional one-liner that library backups run on the API host is enough; do not document cron internals in About. |

`docs/product-docs/PRODUCT_REQS.V1.md` has no Backup Library heading to revive. Do not add a browser backup page to
match PLAN.md Workstream 9 after this withdrawal.

## Acceptance criteria

- `/admin/backup` is not a product page. Visiting it shows the existing not-found route, not "Backup Library."
- Administration navigation has Deleted Books and has no Backup Library item and no link to `/admin/backup`.
- `BackupLibraryPage` and `backupApi` are gone. `createApi` has no `backup` helper. No application module calls
  `GET /backup`.
- Generated OpenAPI still documents `/backup`; `yarn api:check` / contract smoke still see that path. This ticket does
  not edit `docs/technical-reference/openapi.json`.
- `apiClient` still handles non-JSON success bodies. Redaction still denylists backup contents.
- Optional Vite API proxy may still forward `/backup`. That is not a product route.
- Colocated tests cover nav and `createApi` without a backup aggregate. No leftover suite mounts `/admin/backup`.
  `make check` passes.
- `docs/AGENTS.md` (and PLAN / ToDo / README / sibling tickets as listed) no longer describe `/admin/backup` as a live
  feature route or a required browser download.
- Implementation did not start before backend FEAT-01 (`scripts/fetch_backup.py` and nightly cron) shipped.

## Plan coverage

Workstream 9 already shipped deleted-books admin and a browser SQL download. This ticket is IA cleanup after backend
FEAT-01: one operational backup path (`GET /backup` via script/cron), no SPA download page. Explicitly excludes
backend contract changes and FEAT-15 through FEAT-24 product work except doc/nav mentions of `/admin/backup`.
