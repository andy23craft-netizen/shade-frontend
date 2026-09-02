# Migration Plans Feedback: Seed SQL Sync from the Live Instance

**Status:** Planning and decision support. This document evaluates a pre-launch alternative to the strategies
described in `docs/migration_plans.md`. It is not an implementation ticket.

**Audience:** Senior and junior engineers preparing backend and frontend work tickets.

## Executive summary

The live library instance has diverged from the authoritative seed SQL in `shade-backend/sql/` and from
`shade-backend/data/app.db`. That divergence is mostly **data drift** (~100 catalog rows, a few collections, and
associated relationships) rather than a large-scale production migration problem.

The proposal here is to treat the **running instance as the temporary source of truth for catalog data**, export it
into seed-compatible SQL, reconcile that export with the committed seed files, and refresh those files in the backend
repo. Developers can then delete and rebootstrap local databases from updated seeds while building album support and
multi-user features, without maintaining a parallel V1-to-V2 conversion pipeline for every schema experiment.

This approach is appropriate **only until public launch**. After launch, adopt conventional production database
migration and backup/restore practices (as outlined in backend PLAN-02 and PLAN-03).

| Concern                          | Seed SQL sync (this proposal)          | Strategies in `migration_plans.md`                                |
|----------------------------------|----------------------------------------|-------------------------------------------------------------------|
| ~100 missing/edited catalog rows | Primary fit                            | Overkill if framed as a full migration                            |
| Schema changes (albums, tenants) | Does not replace schema work           | Side-by-side conversion or incremental migrations remain relevant |
| Running instance during dev      | Decouples data from schema experiments | Requires careful cutover planning                                 |
| Post-launch operations           | Explicitly out of scope                | Required                                                          |

**Recommendation:** Adopt seed SQL sync as the **pre-launch data reconciliation strategy**. Keep schema evolution
(clean bootstrap SQL + targeted migrations when an existing DB must be upgraded in place) separate from catalog seed
maintenance. Do not discard the safety practices from `migration_plans.md` (immutable backups, verification,
fail-closed behavior); apply them to the sync workflow instead of a one-time V1-to-V2 converter.

## Problem restated

### Historical context

1. The catalog originally lived in a Google Sheet.
2. The sheet was exported to `.xlsx`, converted to seed SQL, and loaded via backend bootstrap.
3. The spreadsheet has been retired; this frontend/backend stack is the catalog UI for one junior engineer's personal
   library (semi-live, single user today).
4. That engineer continued adding and editing books, collections, loans, reading state, and cover relationships in
   the running app. Much of that state is **not** reflected in `shade-backend/sql/` or `shade-backend/data/app.db`.

### Near-term product work

Before public launch, the team still plans:

- **Music album support** (new tables, APIs, and seed structure).
- **Multi-user support** (tenant-scoped databases, per-tenant backups, routing).

### Why this feels harder than it is

Two separate problems are currently entangled:

1. **Data reconciliation:** The live catalog has rows the repo seeds do not.
2. **Schema evolution:** New features require new tables and columns.

Trying to solve both by running the live database through every schema experiment, or by building a full V1-to-V2
converter now, adds complexity disproportionate to ~100 rows of catalog drift.

## Proposed approach: operational export to seed SQL

### Goal

Keep `shade-backend/sql/*.sql` (excluding `0000-clean-schema.sql` and `migrations/`) aligned with the **current
authoritative catalog** so that:

- `rm -f data/app.db && make run` reproduces the live library for any developer.
- Schema work can proceed against a fresh bootstrap without manually re-entering catalog data.
- The junior engineer's instance can be refreshed from repo seeds after a sync, if desired.

### Workflow (target state)

```text
Live instance (andy.db or equivalent)
  -> authenticated export (GET /backup or a new seed-export endpoint/script)
  -> normalize to per-table seed INSERT files (matching existing seed conventions)
  -> row-level diff against committed sql/0100-*.sql ... sql/0400-*.sql
  -> human-reviewed patch (or auto-merge for unambiguous inserts)
  -> commit updated seed files to shade-backend
  -> developers rebootstrap locally; CI loads seeds in fixture tests
```

### What already exists

| Asset                                     | Role today                                         | Gap for this proposal                                             |
|-------------------------------------------|----------------------------------------------------|-------------------------------------------------------------------|
| `GET /backup`                             | Full SQLite `iterdump()` (schema + data + indexes) | Dump format differs from seed files; not table-partitioned        |
| `scripts/fetch_backup.py` / `make backup` | Downloads backup when content changes              | Writes to `data/backups/`, not `sql/`                             |
| `scripts/generate_sql_from_tsvs.py`       | Regenerates seeds from TSV exports                 | TSVs are stale; does not include runtime-only rows or collections |
| `sql/0100-*.sql` ... `sql/0400-*.sql`     | Bootstrap catalog data                             | No collection seed files; missing ~100 live rows                  |
| `src/db/bootstrap.py`                     | Clean bootstrap from top-level `sql/*.sql`         | Rewriting seeds does not update an existing DB automatically      |

### What to build

Prefer a **seed export and reconcile** tool over naive text diff of `GET /backup` output against seed files.

1. **Export:** Read the live SQLite file (via API backup download or a maintainer script with filesystem access).
2. **Normalize:** Emit INSERT statements in the same shape as `generate_sql_from_tsvs.py` output:
   - One file per domain table group (shelves, categories, authors, books, junction tables, wishlists, loans if
     in scope, collections).
   - Stable primary keys preserved (critical for cover filenames and relationships).
   - Deterministic ordering (e.g., by primary key) for repeatable diffs.
3. **Reconcile:** Compare exported rows to committed seed rows by primary key:
   - **Insert:** row absent from seed file.
   - **Update:** same key, different column values (surface for review; do not silently overwrite ambiguous cases).
   - **Delete:** row in seed but absent from live export (flag; default to manual decision pre-launch).
4. **Apply:** Write patched seed files (or emit a patch report + optional `--apply`).
5. **Verify:** Bootstrap a fresh DB from patched seeds; run integrity checks and row-count invariants; smoke-read via
   API.

Optional frontend role: a maintainer-only download trigger is **not required** if operators use `make backup` and a
backend CLI. The frontend deliberately avoids handling SQL dump contents today; keep it that way unless there is a
strong operator UX need.

## Feedback on the idea

### Pros

1. **Right-sized for pre-launch scale.** ~100 rows and a few collections do not justify a full migration converter or
   ongoing dual-database maintenance during feature development.
2. **Separates data from schema.** Album and multi-tenant work can update `0000-clean-schema.sql` and migrations
   without constantly copying data out of a live `app.db`.
3. **Reuses existing mental model.** The team already trusts "delete DB, rebootstrap from `sql/`" for local dev.
   Updating seeds extends that path instead of replacing it.
4. **Improves onboarding and CI.** New clones and test fixtures match the real catalog the junior engineer uses.
5. **UUID preservation.** Export-from-live keeps cover paths, collection memberships, and loan history intact better
   than regenerating from stale TSVs.
6. **Natural sunset.** At launch, stop seed-syncing production data into git; switch to per-tenant backups and formal
   migrations (PLAN-02/03).

### Cons and risks

1. **Format mismatch.** `GET /backup` `iterdump()` output is not seed-file compatible. A dedicated normalizer is
   required; raw `diff backup.sql sql/0200-books.sql` will not work reliably.
2. **Two sources of truth during transition.** Until the first successful sync lands, live DB and repo seeds disagree.
   Document which wins (live export) and freeze writes during export windows.
3. **Updates vs inserts.** Edited titles, shelf moves, ratings, and notes are **updates**, not new INSERTs. A tool that
   only appends rows will leave stale seed data.
4. **Deletes are politically hard.** Books removed in the app but still in seed files need an explicit policy (remove
   from seeds vs keep for history). Default to human review.
5. **Tables without seed files today.** Collections (`collections`, `collection_books`) exist in
   `0000-clean-schema.sql` but have no numbered seed file. The sync tool must define new files (e.g.
   `0425-collections.sql`, `0430-collection-books.sql`) and bootstrap ordering.
6. **Operational data scope.** Decide whether loans, `schema_migrations`, and ephemeral state belong in seeds or only
   catalog entities. Including active loans in seeds may surprise developers; excluding them loses circulation history
   on rebootstrap.
7. **Does not replace schema migrations.** Adding album tables still requires updating clean schema and, for anyone
   who cannot delete their DB, forward migrations under `sql/migrations/`.
8. **Secret and PII surface.** Backups and seed exports contain borrower names, notes, and reviews. Treat exports like
   credentials: no CI artifacts, no frontend telemetry, restricted repo access if needed.
9. **Automation confidence.** "Automatically editing sql files" should mean **deterministic, reviewed merges** for
   unambiguous inserts first. Fully unattended patches for updates/deletes are risky at this scale but still costly
   when wrong.

### Mitigations

- Run export against a **quiesced** database (no writes during export) or accept a known staleness window.
- Always produce a **human-readable reconcile report** (counts, sample rows, update/delete candidates) before `--apply`.
- Keep a **timestamped full backup** (`make backup`) before applying seed patches.
- Add a **bootstrap verification** step to CI: fresh DB from seeds passes `PRAGMA foreign_key_check` and expected row
  counts within tolerances.
- Scope v1 of the tool to **catalog + collections**; treat loans as optional phase 2.

## Comparison with `migration_plans.md` options

### Option 1: Delete and rebootstrap

Still valid **after** seeds are synced. The blocker today is not rebootstrap mechanics; it is that rebootstrap would
**lose** live-only data. Seed sync removes that blocker for pre-launch dev environments.

Once seeds match live data, delete-and-rebootstrap becomes the preferred local dev loop again.

### Option 2: Side-by-side V1-to-V2 conversion

Valuable for a **coordinated production cutover** when schema changes are large (albums, tenants, renamed columns) and
downtime must be minimized. For pre-launch, single-user data reconciliation, seed sync is simpler.

Revisit side-by-side conversion at launch if:

- Multiple tenants already have non-disposable production data.
- Schema delta cannot be expressed by rebootstraping from updated clean schema + seeds.
- Zero-downtime cutover is required.

### Option 3: Incremental forward migrations

Still needed for **schema** changes on databases that cannot be deleted. Not the best tool for bulk **catalog row**
backfill from a live instance into git-managed seeds.

Use migrations for structure; use seed sync for catalog content until launch.

### Option 4: V1 release branch

Unchanged. Source-control branching does not solve data drift.

## Alternative options

| Option                                               | Effort         | Fit                        | Notes                                                                                          |
|------------------------------------------------------|----------------|----------------------------|------------------------------------------------------------------------------------------------|
| **A. One-time manual merge**                         | Low            | Good for a single sync now | Export backup, hand-copy INSERTs into seed files. Fine once; does not scale for ongoing drift. |
| **B. Seed export/reconcile tool (recommended)**      | Medium         | Best ongoing pre-launch    | Semantic row diff; preserves UUIDs; repeatable.                                                |
| **C. Retire TSV pipeline; live DB only**             | Low short-term | Poor                       | Every developer needs a copied `andy.db`; CI diverges; no git review of catalog changes.       |
| **D. Refresh TSVs from app export, rerun generator** | Medium         | Partial                    | Loses runtime UUIDs unless TSV export encodes them; collections not in TSV pipeline today.     |
| **E. Full side-by-side converter now**               | High           | Overkill pre-launch        | Better saved for launch cutover with multi-tenant data.                                        |
| **F. Copy live `app.db` into repo**                  | Low            | Poor                       | Binary DB in git is opaque, conflict-prone, and bypasses seed/bootstrap tests.                 |

**Recommendation:** Implement **B**, optionally preceded by **A** for an immediate unblock while the tool is built.

## Relationship to upcoming features

### Album support

- Update `0000-clean-schema.sql` and album seed files (empty or fixture data initially).
- Seed sync v1 should **ignore unknown tables** gracefully so album development does not break catalog export.
- When album catalog rows exist in live DB pre-launch, extend the exporter to album table groups.

### Multi-user support

- Pre-launch: single library export into shared seeds is acceptable.
- Post-launch: **do not** sync tenant production data into committed seeds. Per-tenant `GET /backup`, retention, and
  restore (PLAN-02) replace git-based catalog sharing.
- During multi-tenant development, seed sync may target a named dev tenant only (e.g. `andy.db`).

## Suggested implementation phases

### Phase 0: Immediate unblock (manual)

1. `make backup` against the live instance.
2. Identify missing books, collections, and relationships (SQL queries or diff by UUID).
3. Manually add INSERTs to appropriate seed files (and add collection seed files if missing).
4. Rebootstrap a staging copy; verify catalog and covers.

### Phase 1: Backend seed exporter (MVP)

- CLI: `uv run python scripts/export_seed_sql.py --database path/to/andy.db --output-dir /tmp/seed-export`
- Emits table-grouped files matching existing naming and INSERT column order.
- Preserves UUIDs verbatim.
- Includes collections.
- Tests: round-trip bootstrap, foreign keys, deterministic output.

### Phase 2: Reconcile and apply

- CLI: `uv run python scripts/reconcile_seed_sql.py --live-export /tmp/seed-export --seed-dir sql/`
- Row-level diff report (insert/update/delete candidates).
- `--apply` writes only unambiguous inserts; updates/deletes require explicit flags or manual edit.
- Makefile target: `make seed-reconcile` (documented in MAINTAINERS.md).

### Phase 3: Operator workflow integration

- Document cadence: sync before major schema merges; sync after bulk catalog edits.
- Optional: wrap `fetch_backup.py` + exporter for remote instances (`--base-url`).
- CI check: seed bootstrap smoke test with minimum row counts.

### Phase 4: Sunset at launch

- Freeze seed files as **demo/fixture** data or remove personal catalog from repo.
- Enable PLAN-02 backup/restore for production tenants.
- Require forward migrations for all schema changes on existing tenant DBs.

## Ticket breakdown (draft)

Use these as starting points for `docs/tickets/` in each repo. Adjust IDs to match repo conventions.

### Backend tickets

1. **BE-SEED-01: Inventory live-vs-seed drift**
   - Document tables in scope, row counts, and missing seed files (collections).
   - Acceptance: written report with UUID samples (no full catalog dump in ticket).

2. **BE-SEED-02: `export_seed_sql.py`**
   - Export live SQLite to seed-format SQL files.
   - Acceptance: deterministic output; preserves UUIDs; includes collections; unit tests.

3. **BE-SEED-03: `reconcile_seed_sql.py`**
   - Row-level diff vs committed seeds; report + guarded `--apply`.
   - Acceptance: detects inserts/updates/deletes; does not corrupt existing seed formatting; tests for merge cases.

4. **BE-SEED-04: Collection seed files and bootstrap order**
   - Add `0425-collections.sql` / `0430-collection-books.sql` (names TBD).
   - Acceptance: clean bootstrap loads collections; OpenAPI/CI fixtures unchanged or updated.

5. **BE-SEED-05: MAINTAINERS runbook**
   - Document quiesce, backup, export, reconcile, verify, commit flow.
   - Acceptance: another developer can rebootstrap matching catalog from updated seeds alone.

6. **BE-SEED-06: CI bootstrap verification**
   - Test that fresh bootstrap from seeds passes integrity checks and baseline counts.
   - Acceptance: fails if seeds are internally inconsistent.

### Frontend tickets

Frontend involvement should stay minimal:

1. **FE-SEED-01: Documentation cross-link only**
   - Link maintainer docs to backend seed-sync runbook if useful for operators.
   - No SQL handling in the browser.

2. **FE-SEED-02 (optional): Remove legacy backup UI references**
   - If any stale backup UI/docs remain, align with backend-only backup policy (already mostly done).

No SPA download of SQL dumps is recommended unless operators explicitly request it later.

## Decision checklist

Before adopting seed SQL sync, confirm:

- [ ] The live instance is the authoritative catalog until the next sync (not stale TSV exports).
- [ ] Writes can pause for a short export window, or staleness is acceptable.
- [ ] UUID preservation is required for covers and relationships (yes for this project).
- [ ] Scope is pre-launch only; launch triggers migration/backup strategy from PLAN-02/03.
- [ ] Schema changes (albums, tenants) will still update `0000-clean-schema.sql` and migrations separately.
- [ ] The team accepts human review for updates and deletes in seed files.
- [ ] Loans and other operational history have an explicit in-scope / out-of-scope decision.
- [ ] A full backup is taken before the first `--apply` to committed seeds.

## Recommended decision

**Adopt seed SQL sync as the pre-launch data strategy.** Perform one manual merge (Phase 0) if feature work is blocked
today; build the exporter and reconcile tooling (Phases 1-2) so drift does not recur. Continue to use
`migration_plans.md` safety practices for backups and verification, but defer a full side-by-side V1-to-V2 converter
until multi-tenant launch unless schema experiments prove rebootstrap insufficient.

At launch, stop treating git-managed seeds as the live catalog carrier. Switch to per-tenant operational backups and
standard forward migrations for schema evolution.
