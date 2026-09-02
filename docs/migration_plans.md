# V1-to-V2 Database Migration Plans

**Status:** Planning and decision support. This document compares migration and release strategies; it is not an
implementation ticket or authorization to modify a production database.

## Executive summary

A release branch is not technically required for the V1-to-V2 database transition. However, choosing not to maintain a
release branch is separate from choosing to delete and rebootstrap the database. A Git branch preserves source history;
it does not preserve production data, runtime assets, deployed configuration, or a rollback-compatible application
artifact.

The practical options are:

| Strategy | Implementation effort | Data risk | Rollback quality | Best fit |
| --- | ---: | ---: | ---: | --- |
| Delete the database and rebootstrap from seed files | Low | High after real use begins | Poor unless V1 data and artifact are retained | Disposable development or genuinely pre-launch data |
| Build a new V2 database from the V1 database, verify it, then swap | Medium | Low | Excellent | Recommended coordinated V2 cutover |
| Migrate the existing database incrementally | Medium–high | Medium unless rehearsed on a copy | Good with a preserved pre-migration database | Gradual schema delivery or conventional upgrades |
| Maintain a V1 release branch | Ongoing overhead | Does not itself protect data | Helps code maintenance only | Extended parallel V1 support |

The recommended approach is to avoid a long-lived release branch unless V1 needs parallel hotfix support, retain an
immutable V1 tag and deployable artifact, and perform a side-by-side V1-to-V2 database conversion with verification and
an atomic file swap.

## Current repository behavior

The backend currently has two distinct database paths:

1. **Clean bootstrap:** `src/db/bootstrap.py` checks whether the `books` table exists. If it does not, it executes the
   ordered top-level `sql/*.sql` files and stamps all existing migration files as already applied because the clean
   schema is expected to contain their effects.
2. **Existing database upgrade:** If `books` already exists, the clean-bootstrap scripts do not run. The application
   executes only unapplied files under `sql/migrations/*.sql`, recording their names in `schema_migrations`.

Consequently, rewriting the clean-schema or generated seed scripts does nothing to an existing database by itself. The
database must be deliberately deleted, moved, or converted before those scripts run again.

The current TSV generator primarily regenerates:

- shelves;
- categories;
- authors;
- books;
- book-author, book-category, and book-shelf memberships;
- wanted books;
- wishlists and wishlist memberships.

It produces stable UUID5 identifiers for spreadsheet-derived entities, which makes repeated seed generation more
predictable. Those deterministic IDs protect only records represented identically in the source TSV files. They do not
preserve arbitrary runtime-created records or every value stored in the operational database.

The migration runner executes and commits one migration file at a time. If an early migration commits and a later file
fails, the database may remain at an intermediate schema. Substantial V2 migrations should therefore be run and verified
against a staging copy before the converted database is activated.

## Option 1: Delete and rebootstrap

This option rewrites the final clean schema and seed-generation scripts, removes or moves the existing `app.db`, and
starts V2 against a newly bootstrapped database.

### Advantages

- It is the simplest schema-development path.
- The final database is created directly from the intended V2 schema.
- It avoids expressing every structural change as an incremental SQLite migration.
- It is easy to repeat while the database remains disposable.
- It validates the same path that brand-new V2 installations will use.

### Complications

Once the application is used as the authoritative catalog, the operational database can contain information not
represented completely in the source spreadsheets or seed generator:

- books created or edited after the original import;
- changed shelf placement and category memberships;
- collections, collection ordering, and membership notes;
- wishlist priority, status, URL, and notes;
- active and historical loans;
- reading completion dates, ratings, and reviews;
- availability, reservation, and setup state;
- tenant and library settings;
- borrower feedback and Work assignments added by V2;
- runtime-generated UUID relationships;
- references to uploaded covers, album artwork, and signatures.

The binary assets may remain in separate directories, but the database contains the UUID relationships required to
reconnect them. Recreating entities with different IDs can orphan those files and sever loan, membership, feedback, or
Work relationships.

Rebootstrap also creates downtime and rollback concerns. A failed import cannot be treated as a valid empty library,
and V2 must never respond to a schema problem by silently bootstrapping a new empty database at the production path.

### When it is acceptable

Delete-and-rebootstrap is defensible only when all of the following are explicitly true:

- V1 has not become the authoritative live catalog.
- Current database state is considered disposable.
- The TSV sources contain every value that must survive.
- Post-bootstrap edits, loans, history, notes, and memberships can be discarded or are absent.
- The generated V2 database is verified before it replaces the current database.
- The original database and V1 application artifact are retained for rollback.

This should be recorded as an explicit data-disposability decision rather than inferred from the choice not to use a
release branch.

## Option 2: Side-by-side V2 database conversion

This option creates a new V2 database from the final clean schema, then copies and transforms authoritative data from
the V1 database rather than recreating the catalog from old spreadsheet seeds.

Suggested flow:

1. Stop or prevent writes to V1 for the final conversion window.
2. Open the V1 database read-only.
3. Create a separate V2 database from the final V2 schema.
4. Copy and transform all V1 rows into their V2 structures.
5. Preserve every existing book and relationship UUID.
6. Reconnect or verify references to covers and other runtime assets.
7. Compare source and destination row counts and relationship invariants.
8. Run `PRAGMA integrity_check` and `PRAGMA foreign_key_check`.
9. Confirm the expected schema and migration version.
10. Run representative read-only API smoke queries against the new database.
11. Produce a concise verification report without catalog contents.
12. Atomically rename the verified V2 database into place.
13. Start V2 and run tenant-scoped health and representative read checks.
14. Retain the untouched V1 database until post-activation verification succeeds.

### Advantages

- The V1 database remains untouched throughout conversion.
- The destination begins from the final clean V2 schema.
- Complex SQLite table changes can be expressed as controlled copy/transform operations.
- It naturally supports the planned `app.db` to `andy.db` transition.
- Old and new databases can be compared before activation.
- Rollback is an atomic file swap combined with restarting the retained V1 artifact.
- It does not require a release branch.

### Complications

- The converter must account for every table, relationship, and data invariant.
- It must be updated whenever the V2 schema changes before release.
- Existing UUIDs must be preserved deliberately rather than regenerated from mutable names.
- It needs representative fixtures and a rehearsal against a copy of the real database.
- It must fail closed on invalid rows, collisions, missing relationships, or incomplete transformations.
- Writes must stop during the final snapshot and activation window, or later V1 changes will be lost.
- Asset directories and tenant-specific paths must be handled as part of the release procedure.
- After V2 accepts writes, a code-only rollback is unsafe. Rollback must restore the preserved V1 database because V1
  cannot be expected to understand V2-only schema or data.

This is still a migration even though the destination is created using the clean-bootstrap schema. It should not be
described as a simple reseed.

## Option 3: Incremental forward migrations

This option keeps the existing database file and applies ordered, forward-only transformations from the released V1
schema to V2 through `sql/migrations/*.sql`.

Every schema change must still be represented in both places:

- the clean schema for new installations; and
- an incremental migration for existing installations.

### Advantages

- It follows the repository's existing migration architecture.
- Existing data remains in the operational database.
- Individual schema changes can ship incrementally.
- New installations and upgraded installations converge on the same schema.
- It is useful if V2 features will be delivered gradually rather than through one coordinated cutover.

### Complications

V2 anticipates several high-risk transformations:

- renaming `books.id` to `book_id` without changing UUID values;
- retaining every foreign key and relationship that references those UUIDs;
- restructuring wishlist membership for typed books and albums;
- adding typed book/album loan relationships;
- introducing Work grouping and historical feedback aggregation;
- adding tenant-scoped settings, setup, availability, albums, and new asset relationships;
- moving from a single `app.db` to tenant-specific databases such as `andy.db`.

SQLite commonly implements major table changes by creating a replacement table, copying rows, dropping the original,
and renaming the replacement. Foreign keys and dependent relationships make these transformations vulnerable to subtle
data loss or broken references.

The current migration runner commits each migration file independently. A multi-file failure can therefore leave a
partially upgraded schema. Each intermediate state must be restart-safe, or the runner/release process must be hardened
before destructive V2 migrations are attempted.

Even when incremental migrations are selected, the full chain should first run against a staging copy. The converted
copy should become active only after all migrations and verification checks succeed.

## Option 4: Maintain a V1 release branch

A release branch is a source-control and maintenance decision, not a database-preservation mechanism.

It is useful when:

- V1 must remain supported for a meaningful period;
- production V1 needs hotfixes while V2 development continues;
- V2 stabilization is lengthy while main continues to change;
- multiple deployment environments require independent release cadence.

### Advantages

- V1 hotfixes can be isolated from unfinished V2 work.
- A stable line remains available for emergency V1 builds.
- Release stabilization can occur without freezing main.

### Complications

- V1 fixes must be merged or cherry-picked into V2.
- API documentation, generated OpenAPI, and migration sequences can diverge.
- Long-lived branches accumulate integration and merge risk.
- Operators may incorrectly treat the branch as rollback protection even though it does not contain the production
  database, runtime assets, secrets, or deployed configuration.
- A branch does not ensure that the old dependency set can still be built or deployed successfully.

If the project expects one coordinated V2 cutover and no extended V1 maintenance period, an immutable V1 tag plus a
retained, tested build artifact is normally sufficient. A branch can be created later if a genuine parallel-support
need emerges.

## What rollback actually requires

A reliable rollback requires all of the following:

- an immutable V1 source revision or tag;
- the exact deployable V1 artifact;
- V1-compatible configuration and secrets handling;
- a byte-for-byte pre-upgrade V1 SQLite file;
- the associated V1 runtime asset directories;
- a documented command/runbook to reactivate them;
- a smoke test proving the restored V1 stack can start and read its database.

A Git release branch supplies only part of the first item.

Once V2 accepts writes, rolling back application code without rolling back the database can corrupt data or fail at
startup. The rollback boundary must therefore be the application artifact, configuration, database, and relevant
assets together.

## Recommended plan

The recommended strategy is:

1. Do not require a long-lived V1 release branch unless parallel V1 hotfix support becomes necessary.
2. Create an immutable V1 release tag and retain the exact built artifact and configuration needed to run it.
3. Continue updating the final V2 clean-bootstrap schema for brand-new installations.
4. Implement a side-by-side V1-to-V2 converter using the live V1 database as its authoritative input.
5. Preserve every existing UUID and relationship.
6. Commit a representative frozen V1 database fixture.
7. Run the complete conversion in CI and assert schema, data, relationship, UUID, and asset-reference preservation.
8. Test an injected conversion failure and prove that the source/live database remains unchanged.
9. Rehearse the release against a disposable copy of the real database.
10. Record before/after verification results without exposing catalog contents.
11. Stop V1 writes briefly for the final conversion.
12. Create and checksum both a SQL backup and byte-for-byte V1 database copy.
13. Convert and verify a staging V2 database.
14. Atomically activate the V2 tenant database.
15. Start V2 and run tenant-scoped health, catalog, membership, loan, and asset smoke checks.
16. Keep the V1 artifact, database, and rollback copy until V2 is explicitly accepted.

If the team confirms that the current database is genuinely disposable and no irreplaceable runtime state exists, the
delete-and-rebootstrap option may replace steps 4 through 15. That exception should be documented with an inventory of
what data will be discarded and a successful verification of the newly generated database.

## Decision checklist

Before selecting a strategy, answer these questions explicitly:

- Has V1 gone live or become the authoritative catalog?
- Are all books, edits, shelves, categories, collections, wishlists, loans, ratings, and notes represented in source
  files outside the database?
- Are there runtime-created UUIDs or uploaded assets that must survive?
- Must V1 remain patchable after V2 development begins?
- Will V2 ship as one coordinated cutover or through incremental production releases?
- Can writes be stopped for a bounded final conversion window?
- Has the migration been rehearsed against representative and real-data copies?
- Can the team produce and start the exact V1 artifact during a rollback drill?
- Is rollback defined as restoring code, configuration, database, and assets together?

The answers determine whether rebootstrap is an acceptable simplification or an unsafe replacement for a data-preserving
upgrade.
