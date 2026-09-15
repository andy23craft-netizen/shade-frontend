# FEAT-01 - Better backups (frontend)

**Status:** Design / proposed (core decisions locked)
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
| Shade-admin affordance to enter / exit site-wide read-only mode | UI + API client for Shade (`andy`) admin only |
| Clear UX while the site is read-only | Show that writes are frozen; keep reads usable |
| Handle **HTTP 530** on mutating requests | Treat 530 as "site is read-only" (not a generic server error) |
| Do **not** build backup download / in-app backup UI | Manual backup remains CLI / `make` on the host |

Everything else (exporter shape, schedules, prune, covers packaging, `AGENTS.md` / `DB-updates.md`) is owned by the
backend, orchestrator, or Marvin siblings.

## Read-only mode contract (what FE must respect)

Locked decisions from the shared design:

* Read-only is **site-wide** (all tenants). Only the **Shade** library admin (tenant `andy`, hostname alias
  `shade`) may enter or exit. Other tenant admins must not see a working control (or must receive a clear denial).
* While read-only is on:
  * **Reads remain allowed** (non-mutating GETs and equivalent read paths).
  * **Mutating writes** (CRUD and other write methods) fail with **HTTP 530**.
* If the site **restarts while read-only is on**, it **stays read-only** until the Shade admin explicitly returns
  it to normal. The durable flag lives in a file under backend `DB_DIR` (not a table); FE should re-fetch status
  after reload rather than assuming an in-memory toggle.
* There is **no** in-app "download backup" or "run backup" button. Cutover capture is operator CLI.

Exact backend route/schema for get/set read-only status will land with the backend ticket; FE should follow OpenAPI
once that surface exists.

## Why this matters for the UI

Schema-bearing deploys follow:

```text
Shade admin: read-only ON
        |
        v
  operator CLI backup + evolve sql/ + deploy + drop/restart
        |
        v
  Shade admin: read-only OFF
```

The FE must make step 1 and the final step deliberate and visible so operators do not leave the site frozen or
attempt writes during cutover without understanding why they fail.

## Non-goals (frontend)

* General user-facing backup UI or backup file downloads.
* Invoking host backup jobs from the browser.
* Letting non-Shade tenant admins toggle site-wide read-only.
* Owning exporter format, schedules, retention, or offsite copies.

## Next steps (frontend)

1. Coordinate with backend on the read-only status / toggle API (Shade-admin-only; durable across restart).
2. Add Shade-admin UI to enter and exit site-wide read-only, with clear on-screen state.
3. Map **HTTP 530** on writes to a consistent "site is read-only" experience (toasts / banners / disabled write
   actions as appropriate).
4. Keep catalog browsing / read paths working while read-only is on.
5. Do not add backup download or run-backup controls.

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
