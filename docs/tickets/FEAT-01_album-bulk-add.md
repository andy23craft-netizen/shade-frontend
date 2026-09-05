# FEAT-01 -- Album Bulk Add

**Status:** Blocked on the album bulk lookup/import backend contract.

**Dependency group:** Album intake and guided setup.

**Depends on:** Shipped book Build Mode patterns; backend album bulk lookup/import routes;
the guided setup ticket derived from PLAN-03 for first-run composition.

## Objective

Adapt the shipped book Build Mode interaction for high-throughput album intake without
creating a polymorphic item endpoint or inheriting book-only ISBN, author, or status rules.

## Acceptance criteria

- [ ] The owner chooses one destination **crate** before capture and can continue into a
      newly created or existing next crate after import.
- [ ] Capture accepts barcode, Discogs release ID, and manual artist/title rows in batches of
      1--50, using stable client IDs and preserving request order.
- [ ] Lookup distinguishes found, not found, invalid, timeout, and provider failure outcomes.
- [ ] Review distinguishes new, already owned, wishlisted, unshelved, ambiguous, and
      soft-deleted catalog matches without silently restoring or reusing deleted records.
- [ ] Draft metadata remains editable; title and at least one artist are the only universal
      import-blocking metadata requirements.
- [ ] Artist and genre references are resolved through canonical resources before import.
- [ ] Import uses the backend's per-row/independent-savepoint semantics, saves valid rows,
      retains unresolved rows, and presents per-item outcomes accurately.
- [ ] Queue state, retries, lookup results, edits, and save outcomes survive refresh locally
      and are namespaced by library identity and media type.
- [ ] Finish, discard, navigation protection, cancellation, loading, empty, and error states
      have responsive and accessible coverage.
- [ ] First-run guided setup can compose this workflow without creating a second album form.

## Out of scope

Polymorphic `/items` CRUD, album Collections, silent soft-delete restoration, and
cross-device draft persistence.
