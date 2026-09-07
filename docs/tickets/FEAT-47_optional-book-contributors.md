# FEAT-47 -- Optional Book Contributors

**Status:** Blocked on `BACKEND-HANDOFF-PLAN-03` ordered contributor-role contract.

**Depends on:** Normalized contributor resources/memberships and book create/update/read support.

## Objective

Add ordered editors, illustrators, and translators alongside required ordered authors.

## Acceptance criteria

- [ ] Create/edit can search, reuse, create where allowed, order, replace, and clear optional contributors by role.
- [ ] Book Details renders only non-empty roles with correct singular/plural accessible labels.
- [ ] Stable IDs—not display strings—are submitted; duplicate people within a role and cross-role participation follow explicit rules.
- [ ] ISBN lookup drafts can be resolved into normalized contributors without creating records until the owner saves.
- [ ] Minimal update semantics distinguish omit/preserve from empty/clear and never send accidental nulls.
- [ ] Build Mode, validation errors, stale records, mobile layout, keyboard ordering, and screen readers are tested.

## Out of scope

Contributor biographies, public authority files, and contributor catalog administration.

## Open questions

1. May the same person hold multiple roles on one book?
2. Is inline contributor creation approved for every role, matching the current author flow?
3. Should legacy flat editor/illustrator strings be migrated or displayed read-only until normalized?
