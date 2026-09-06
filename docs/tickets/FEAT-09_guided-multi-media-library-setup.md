# FEAT-09 -- Guided Multi-Media Library Setup

**Status:** Ready after the small `FEAT-06` frontend query integration. The setup/settings
backend contract and both book and album Bulk Add engines are shipped.

**Dependency group:** B -- setup experience.

**Depends on:** `FEAT-06`, `FEAT-07`, shipped book Build Mode, shipped album Bulk Add, and
canonical location CRUD.

## Objective

Guide a genuinely uninitialized library through a productive first location and catalog
intake while composing existing book or album workflows rather than creating another form.

## Experience requirements

- Gate setup from explicit `/library/setup` state. Request failure, readiness failure, or a
  durable `failed` bootstrap state must receive honest recovery UI and must not masquerade as
  `not_started`.
- Ask for medium, use **shelf** for books and **crate** for albums, then offer either that
  medium's canonical versioned UTF-8 TSV bootstrap or guided Build Mode.
- Explain location-at-a-time building briefly and attach instructions to real controls.
- Create the first assignable location inline, select it as destination, and enter the normal
  intake engine with scanner focus and contextual guidance.
- Preserve unresolved rows across partial success. Let the owner choose/create another
  location and continue without returning to the ordinary shell.
- Permit explicit completion with zero imported items, route to the appropriate Dashboard,
  and never force setup again solely because the catalog remains empty.
- Add a discoverable Manage Collection action to resume guided building after completion.
- Persist unfinished work locally using `FEAT-07` namespacing. Cross-device resume is not
  required.
- Download only the server-approved canonical template. Validation previews ready, warning,
  and rejected totals before commit; correction occurs in the source TSV and re-import.

## Acceptance criteria

- [ ] All durable setup states, loading, offline/transient failure, retry, empty, partial
      success, and idempotent completion paths are covered.
- [ ] Refresh or browser closure restores only the matching library/media session and stable
      client item IDs.
- [ ] The flow supports books and albums with their own fields, lookup/import adapters, and
      shelf/crate language while sharing one orchestration model.
- [ ] Location creation honors system-location and mixed-media placement rules.
- [ ] Invalid TSV files do not mutate the catalog; validation totals and row-level reasons are
      accessible before commit.
- [ ] Completion and resume work with zero, some, or all rows saved.
- [ ] Keyboard, scanner, focus restoration, mobile layout, reduced motion, 200% text zoom,
      and interrupted-request recovery have unit and Playwright coverage.
- [ ] No tutorial-only carousel, fake scan, spreadsheet editor, restore workflow, or duplicate
      catalog form is introduced.

## UI questions requiring a product decision

1. When both media are supported, does setup begin with two room-style choices, a compact
   field choice, or a recommendation based on the owner's stated first collection?
2. After setup completion, which Dashboard opens when the final session was book versus album,
   and what happens when no medium was imported?
3. What exact labels distinguish **Finish this shelf/crate**, **Add another location**,
   **Save and leave**, and **Complete library setup** so none appear to discard unresolved
   rows?
4. Should the Manage entry be named **Build the Collection**, **Guided Setup**, or something
   else shared across both media?
5. How are TSV warnings summarized on mobile, and which row details must remain visible before
   commit?
6. May an owner switch media with unresolved rows present? If yes, should both namespaced
   sessions remain available through an explicit session chooser?

## Out of scope

Cross-device sessions, arbitrary spreadsheet editing, backup restore, new intake contracts,
and a different application shell for setup.
