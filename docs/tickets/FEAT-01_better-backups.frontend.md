# FEAT-01 - Better backups (frontend)

**Status:** Ready to implement (UX and contract decisions locked)
**Owner:** shade-frontend
**Sibling tickets:**
[`FEAT-01_better-backups.backend.md`](FEAT-01_better-backups.backend.md),
[`FEAT-01_better-backups.orchestrator.md`](FEAT-01_better-backups.orchestrator.md),
[`FEAT-01_better-backups.marvin.md`](FEAT-01_better-backups.marvin.md)

## Goal (shared)

Keep backup and restore simple and reliable, and give operators a deliberate path for schema-bearing deploys
**without losing data**. Frequent restore-ready snapshots are owned by backend tooling and host schedulers. The
frontend piece is the **admin control surface for site-wide read-only mode**, which freezes writes during cutover.

## Frontend scope

| Concern | Frontend responsibility |
|---------|-------------------------|
| Shade-admin affordance to enter / exit site-wide read-only mode | Toggle on **Library Settings** (`/library/settings`); UI + API client for Shade (`andy`) only |
| Clear UX while the site is read-only | Global warning banner for **all** admins; disable write controls from status on load/reload |
| Handle **HTTP 530** on mutating requests | Treat 530 as "site is read-only" (not a generic server error) |
| Do **not** build backup download / in-app backup UI | Manual backup remains CLI / `make` on the host |

Everything else (exporter shape, schedules, prune, covers packaging, `AGENTS.md` / `DB-updates.md`) is owned by the
backend, orchestrator, or Marvin siblings.

## Read-only mode contract (what FE must respect)

Locked decisions from the shared design and FE UX clarifications:

* Read-only is **site-wide** (all tenants). Only the **Shade** library admin (tenant `andy`, hostname alias
  `shade`) may enter or exit. Other tenant admins must **not** see the toggle control on Library Settings.
* API surface (checked-in OpenAPI / `API-for-FE.md`):
  * `GET /library/site-read-only` → `{ "enabled": true|false }` (authenticated admin)
  * `PUT /library/site-read-only` with `{ "enabled": true|false }` -- Shade (`andy`) admin only; other tenants
    **403**
* While read-only is on:
  * **Reads remain allowed** (non-mutating GETs and equivalent read paths).
  * **Mutating writes** (CRUD and other write methods) fail with **HTTP 530**
    `{"detail": "Site is in read-only mode"}`.
* If the site **restarts while read-only is on**, it **stays read-only** until the Shade admin explicitly returns
  it to normal. The durable flag lives in a file under backend `DB_DIR` (not a table); FE must re-fetch status
  on page load/reload rather than assuming an in-memory toggle.
* There is **no** in-app "download backup" or "run backup" button. Cutover capture is operator CLI.

## UX decisions (locked)

1. **Placement:** Site-wide read-only toggle lives on **Library Settings** (`/library/settings`). Show the control
   only for the Shade (`andy`) tenant admin. Non-Shade Library Settings pages omit the control.
2. **Status on load:** On page load and reload, send `GET /library/site-read-only` (when an admin session is
   active) and enable or disable write controls from that status. Do not rely on client-only memory of the last
   toggle.
3. **Banner:** While read-only is enabled, **all** admins (every tenant) see a warning banner at the **top of
   every page**. Viewers do not need a banner from this ticket.
4. **Confirmation:** Changing the read-only toggle in **either** direction (on → off or off → on) requires a
   confirmation dialog before calling `PUT`.
5. **530 fallback:** If a mutation still returns **530** (e.g., status race), surface it as site read-only -- not
   a generic server error -- even when the banner/disabled controls already explain the freeze.

## Why this matters for the UI

Schema-bearing deploys follow:

```text
Shade admin: read-only ON (Library Settings + confirm)
        |
        v
  operator CLI backup + evolve sql/ + deploy + drop/restart
        |
        v
  Shade admin: read-only OFF (Library Settings + confirm)
```

The FE must make step 1 and the final step deliberate and visible so operators do not leave the site frozen or
attempt writes during cutover without understanding why they fail.

## Non-goals (frontend)

* General user-facing backup UI or backup file downloads.
* Invoking host backup jobs from the browser.
* Letting non-Shade tenant admins toggle site-wide read-only.
* Owning exporter format, schedules, retention, or offsite copies.
* Viewer-mode read-only messaging beyond ordinary catalog reads continuing to work.

## Acceptance criteria

* Shade (`andy`) admin can enter and exit site-wide read-only from Library Settings, with confirmation both ways.
* Non-Shade Library Settings does not expose a working read-only toggle.
* Admin page load/reload fetches `GET /library/site-read-only` and disables write controls when `enabled` is true.
* While enabled, every admin session shows a top-of-page warning banner on all routes.
* Catalog and other read paths remain usable; mutating failures with **530** are presented as site read-only.
* No backup download or run-backup controls are added.
* Typed clients follow checked-in OpenAPI (`SiteReadOnlyRead` / `SiteReadOnlyUpdate`); extend `libraryApi` /
  `libraryQueries` rather than inventing a parallel client.

## Next steps (frontend)

1. Wire `GET`/`PUT /library/site-read-only` through `libraryApi` / React Query (regenerate or refresh generated
   types from OpenAPI if needed).
2. Add Shade-only toggle on Library Settings with confirmation for both enable and disable.
3. On admin load/reload, fetch status and disable write controls when read-only is on.
4. Show a site-wide warning banner for all admins while read-only is on.
5. Map **HTTP 530** on writes to a consistent "site is read-only" experience.
6. Do not add backup download or run-backup controls.

## Decision log (FE-relevant)

| Date | Decision | Notes |
|------|----------|-------|
| 2026-09-14 | Schema features need admin read-only mode | Enter and exit |
| 2026-09-14 | Read-only is site-wide | Affects all tenants |
| 2026-09-14 | Read-only survives restart | Stays on until admin manually returns to normal |
| 2026-09-15 | Mutating requests under read-only → **HTTP 530** | FE must handle 530 distinctly |
| 2026-09-15 | Only Shade (`andy`) admin toggles read-only | Other tenant admins cannot enter/exit |
| 2026-09-15 | Reads remain allowed under read-only | Non-mutating GETs / read paths ok; writes → 530 |
| 2026-09-15 | Manual backup is CLI / `make` | Not an HTTP backup endpoint; no in-app backup button |
| 2026-09-15 | No general user-facing backup UI | Shade-admin read-only control only |
| 2026-09-15 | Toggle lives on Library Settings | `/library/settings`; Shade (`andy`) only |
| 2026-09-15 | Fetch status on load/reload | Drive enable/disable of write controls from `GET` |
| 2026-09-15 | Warning banner for all admins | Top of every page while read-only is on |
| 2026-09-15 | Confirm toggle both directions | Confirmation before `PUT` enable or disable |
| 2026-09-15 | OpenAPI contract available | `GET`/`PUT /library/site-read-only`; follow generated types |
