# Migration Plans Feedback: Seed SQL Sync from the Live Instance

**Status:** Planning and decision support. This document refines the pre-launch strategy described in
`docs/migration_plans.md`. It is not an implementation ticket.

**Audience:** Senior and junior engineers preparing backend and frontend work tickets.

## Executive summary

The live library instance has diverged from the authoritative seed SQL in `shade-backend/sql/` and from
`shade-backend/data/app.db`. That divergence is mostly **data drift** (~100 catalog rows, a few collections, and
associated relationships) rather than a large-scale production migration problem.

The team adopts **Option 1 (delete and rebootstrap)** from `docs/migration_plans.md` as the pre-launch schema and
local-development strategy. That option is the simplest path: update the final clean schema and seed SQL, remove or
move the existing database, and start fresh against a bootstrapped file. `migration_plans.md` already documents how to
do this safely (backup, verification, retained rollback copy, fail-closed bootstrap).

The blocker today is not rebootstrap mechanics. It is that rebootstrap would **lose** live-only catalog data because
committed seeds are stale. This document proposes **seed SQL sync** as the prerequisite step that makes Option 1 safe
again: treat the running instance as the temporary source of truth, export it into seed-compatible SQL, reconcile that
export with committed seed files, and refresh them in the backend repo. After sync, developers can follow the Option 1
loop (`rm -f data/app.db && make run`) while building album support and multi-user features.

Seed sync is appropriate **only until public launch**. After launch, adopt conventional production database migration
and backup/restore practices (as outlined in backend PLAN-02 and PLAN-03).

The team **rejects Option 4 (maintain a V1 release branch)**. A long-lived release branch would complicate Git flow
without preserving production data, runtime assets, or deployed configuration. Continue on `main`; use an immutable tag
and retained artifact only if a rollback drill requires a known V1 build.

| Concern                          | Seed SQL sync + Option 1               | Options 2-3 in `migration_plans.md`     | Option 4 (release branch)      |
|----------------------------------|----------------------------------------|-----------------------------------------|--------------------------------|
| ~100 missing/edited catalog rows | Sync seeds, then rebootstrap           | Overkill for this scale                 | Does not help                  |
| Schema changes (albums, tenants) | Update clean schema; delete and rebootstrap locally | Side-by-side or incremental migrations | Adds merge overhead only |
| Running instance during dev      | Rebootstrap from updated seeds         | Parallel DB maintenance                 | No benefit                     |
| Git workflow                     | Unchanged (`main` only)                | Unchanged                               | **Rejected**                   |
| Post-launch operations           | Out of scope for seed sync             | PLAN-02/03 backup and restore           | Not applicable                 |

**Recommendation:** Use **seed SQL sync to unlock Option 1**. Do not adopt a V1 release branch. Apply the safety
practices from `migration_plans.md` (immutable backups, verification, fail-closed behavior) to the sync-and-rebootstrap
workflow rather than building a side-by-side V1-to-V2 converter for pre-launch development.

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

Trying to solve both by keeping a long-lived operational database through every schema experiment, or by building a full
V1-to-V2 converter or release branch now, adds complexity disproportionate to ~100 rows of catalog drift. Option 1
avoids that entanglement once seeds are current.

## Proposed approach: operational export to seed SQL

### Goal

Keep `shade-backend/sql/*.sql` (excluding `0000-clean-schema.sql` and `migrations/`) aligned with the **current
authoritative catalog** so that Option 1 rebootstrap works:

- `rm -f data/app.db && make run` reproduces the live library for any developer.
- Schema work updates `0000-clean-schema.sql`, then deletes and rebootstraps without manually re-entering catalog data.
- The junior engineer's instance can be refreshed from repo seeds after a sync, following the verification steps in
  `migration_plans.md`.

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

1. **Enables the chosen Option 1 loop.** Sync closes the data gap that currently makes delete-and-rebootstrap unsafe.
2. **Right-sized for pre-launch scale.** ~100 rows and a few collections do not justify a full migration converter,
   release branch, or ongoing dual-database maintenance during feature development.
3. **Separates data from schema.** Album and multi-tenant work can update `0000-clean-schema.sql`, sync catalog seeds,
   and rebootstrap without constantly copying data out of a live `app.db`.
4. **Matches existing repo behavior.** Bootstrap already loads top-level `sql/*.sql` on a fresh database; updating
   seeds extends that path rather than replacing it.
5. **Improves onboarding and CI.** New clones and test fixtures match the real catalog the junior engineer uses.
6. **UUID preservation.** Export-from-live keeps cover paths, collection memberships, and loan history intact better
   than regenerating from stale TSVs.
7. **No Git flow changes.** Unlike Option 4, seed sync does not require parallel branches, cherry-picks, or divergent
   release cadence.
8. **Natural sunset.** At launch, stop seed-syncing production data into git; switch to per-tenant backups and formal
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
7. **Option 1 preconditions still apply.** After sync, rebootstrap remains a deliberate operator action with backup,
   verification, and rollback copy per `migration_plans.md`. A failed bootstrap must not silently replace production
   with an empty library.
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

## Alignment with `migration_plans.md` options

### Option 1: Delete and rebootstrap (adopted)

**This is the team's pre-launch strategy.** `migration_plans.md` describes the procedure: rewrite the final clean
schema and seed files, take a backup, verify the bootstrapped database, retain the original file for rollback, and
activate deliberately. Follow that runbook; do not invent a parallel path.

Seed SQL sync is the **data step that makes Option 1 safe today**. Without it, rebootstrap drops the ~100 live-only
rows and runtime edits documented above. With current seeds, Option 1 is the preferred loop for:

- Local development and CI fixtures.
- Schema experiments (albums, multi-tenant tables) during pre-launch.
- Validating the same bootstrap path new installations will use.

Option 1 preconditions from `migration_plans.md` still apply: record the data-disposability decision explicitly, verify
before activation, and retain rollback artifacts. Seed sync reduces what would be discarded; it does not remove the need
for verification.

### Option 2: Side-by-side V1-to-V2 conversion (deferred)

Not chosen for pre-launch development. Valuable at **launch** if multiple tenants have non-disposable production data,
schema delta cannot be expressed by rebootstraping from updated clean schema + seeds, or zero-downtime cutover is
required. Until then, Option 1 plus seed sync is sufficient for a single semi-live user.

### Option 3: Incremental forward migrations (limited use)

Not the primary pre-launch strategy. The repository already supports forward migrations for existing databases, but
the team prefers delete-and-rebootstrap locally while the catalog remains seed-driven. Reserve incremental migrations for
post-launch tenant databases that cannot be deleted, or for CI coverage of the migration runner itself.

Use seed sync for catalog content; use Option 1 for schema structure during pre-launch.

### Option 4: V1 release branch (rejected)

**Do not adopt.** A long-lived V1 release branch would complicate Git flow without solving the actual problem. As
`migration_plans.md` states, a branch preserves source history only; it does not preserve the production database,
runtime assets, secrets, or deployed configuration. It also invites cherry-pick debt, divergent OpenAPI, and mistaken
assumptions that the branch itself enables rollback.

There is no extended parallel V1 maintenance period and no need for independent release cadence. Continue feature work
on `main`. If a rollback drill ever requires a known V1 build, an **immutable tag plus retained artifact** is
sufficient; a branch can be created later only if a genuine parallel-support need emerges (unlikely for this project).

## Alternative options

| Option                                               | Effort         | Fit                        | Notes                                                                                          |
|------------------------------------------------------|----------------|----------------------------|------------------------------------------------------------------------------------------------|
| **A. One-time manual merge**                         | Low            | Good for a single sync now | Export backup, hand-copy INSERTs into seed files. Fine once; does not scale for ongoing drift. |
| **B. Seed export/reconcile tool (recommended)**      | Medium         | Best ongoing pre-launch    | Semantic row diff; preserves UUIDs; repeatable.                                                |
| **C. Retire TSV pipeline; live DB only**             | Low short-term | Poor                       | Every developer needs a copied `andy.db`; CI diverges; no git review of catalog changes.       |
| **D. Refresh TSVs from app export, rerun generator** | Medium         | Partial                    | Loses runtime UUIDs unless TSV export encodes them; collections not in TSV pipeline today.     |
| **E. Full side-by-side converter now**               | High           | Overkill pre-launch        | Defer to launch if Option 1 is insufficient.                                                   |
| **F. Copy live `app.db` into repo**                  | Low            | Poor                       | Binary DB in git is opaque, conflict-prone, and bypasses seed/bootstrap tests.                 |
| **G. V1 release branch (Option 4)**                  | Ongoing        | **Rejected**               | Complicates Git flow without preserving data; use tag + artifact if rollback drill needed.     |

**Recommendation:** Implement **B** to support **Option 1**, optionally preceded by **A** for an immediate unblock while
the tool is built. Do not implement **G**.

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

1. `make backup` against the live instance (per Option 1 backup requirements in `migration_plans.md`).
2. Identify missing books, collections, and relationships (SQL queries or diff by UUID).
3. Manually add INSERTs to appropriate seed files (and add collection seed files if missing).
4. Delete and rebootstrap a staging copy; verify catalog, covers, and integrity checks before touching production.

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

5. **BE-SEED-05: MAINTAINERS runbook (Option 1 + seed sync)**
   - Document quiesce, backup, export, reconcile, verify, commit, delete-and-rebootstrap flow.
   - Cross-reference `migration_plans.md` Option 1 verification and rollback steps.
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

Before adopting seed SQL sync and Option 1 rebootstrap, confirm:

- [ ] Option 1 is the chosen pre-launch strategy; Option 4 (release branch) is explicitly out of scope.
- [ ] The live instance is the authoritative catalog until the next sync (not stale TSV exports).
- [ ] Writes can pause for a short export window, or staleness is acceptable.
- [ ] UUID preservation is required for covers and relationships (yes for this project).
- [ ] Scope is pre-launch only; launch triggers migration/backup strategy from PLAN-02/03.
- [ ] Schema changes (albums, tenants) update `0000-clean-schema.sql`, then use delete-and-rebootstrap locally.
- [ ] The team accepts human review for updates and deletes in seed files.
- [ ] Loans and other operational history have an explicit in-scope / out-of-scope decision.
- [ ] A full backup and rollback copy exist before the first `--apply` to committed seeds or production rebootstrap.
- [ ] Rebootstrap verification (integrity checks, row counts, smoke reads) passes before activation.

## Recommended decision

**Adopt Option 1 (delete and rebootstrap) for pre-launch development, enabled by seed SQL sync.** Perform one manual
merge (Phase 0) if feature work is blocked today; build the exporter and reconcile tooling (Phases 1-2) so drift does
not recur. Follow the Option 1 procedure and safety practices in `migration_plans.md` for every rebootstrap.

**Reject Option 4.** Do not create or maintain a V1 release branch; keep working on `main`.

Defer side-by-side V1-to-V2 conversion until multi-tenant launch unless a future state proves Option 1 insufficient
for production cutover.

At launch, stop treating git-managed seeds as the live catalog carrier. Switch to per-tenant operational backups and
standard forward migrations for schema evolution.
