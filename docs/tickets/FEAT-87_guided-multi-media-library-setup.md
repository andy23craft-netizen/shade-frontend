# FEAT-09 -- Guided Multi-Media Library Setup

**Status:** Frontend complete for the shipped backend contract. Canonical TSV import remains
blocked on the separately delivered `BACKEND-HANDOFF-09_setup-tsv-contract` backend ticket.

**Dependency group:** B -- setup experience.

**Depends on:** `FEAT-06`, `FEAT-07`, shipped book Build Mode, shipped album Bulk Add, and
canonical location CRUD.

## Implementation progress

**Overall:** 90% (all work supported by OpenAPI 1.1.3 complete; TSV integration blocked)

- [x] Confirm the shipped `/library/setup` and `/library/setup/complete` transport, query,
      cache-isolation, and generated-type baseline.
- [x] Inventory the existing book Build Mode, album Bulk Add, location CRUD, settings route,
      and Manage Collection entry points that setup must compose.
- [x] Add the `/library/setup` route and durable-state gate with loading, retry, failed-state,
      and already-complete behavior.
- [x] Add shared typed setup orchestration for media choice, location choice/creation, local
      session identity, and resume.
- [x] Add explicit zero/some/all-item setup completion with media-appropriate Dashboard
      routing and retry-safe mutation handling.
- [x] Compose guided book setup with the existing book Build Mode.
- [x] Compose guided album setup with the existing album Bulk Add flow.
- [ ] Add canonical TSV template download, validation preview, and commit flow for both media.
      Blocked on the delivered `BACKEND-HANDOFF-09_setup-tsv-contract`; OpenAPI 1.1.3 has no
      TSV routes.
- [x] Add Manage Collection resume entry and finish/leave/next-location navigation.
- [x] Complete unit, accessibility, persistence/isolation, interruption, and Playwright
      coverage; record verification evidence below.

### Decisions and assumptions in force

- Setup begins with two explicit room-style choices: **Books** and **Albums**.
- Completing a book session opens the Reading Dashboard; completing an album session opens
  the Listening Dashboard. Zero-item completion uses the owner's selected medium.
- Unresolved rows remain in their media-specific, library-scoped session when switching
  media; setup does not silently discard them.
- The Manage Collection entry is provisionally named **Build the Collection**.
- These bounded orchestration choices can be revised without changing the backend contract
  or duplicating either intake engine.

### Verification evidence

- 2026-09-06: existing library API/query tests confirm all four durable states and canonical
  library-scoped query keys; repository inventory completed. No setup UI existed at start.
- 2026-09-06: added `/library/setup` with distinct loading, query-error/retry, durable `failed`,
  `required`, `in_progress`, and idempotent `complete` presentations; supported-media choices
  route into the existing intake engines with setup context. Added **Build the Collection** to
  Manage Collection. Focused result: 24 tests passed; TypeScript and ESLint passed.
- 2026-09-06: added the versioned `shade:<library>:shared:guided-setup:v1` orchestration
  session. It strictly validates restored state, keeps book/album destinations independent,
  and reserves stable per-media client-item sequences across reloads. Setup now resumes the
  selected medium, loads real locations, creates the first shelf/crate inline, stores its
  stable ID and canonical name, and hands it to the existing book/album intake route. Book
  Build Mode and album intake accept that setup destination without introducing another
  catalog form. Focused result: 32 tests passed; TypeScript and ESLint passed.
- 2026-09-06: confirmed OpenAPI 1.1.3 has no canonical TSV template, validation, or commit
  route. Delivered `BACKEND-HANDOFF-09_setup-tsv-contract` with the required tenant-safe binary
  template, mutation-free validation, row disposition/reason, token binding, idempotent commit,
  normalized-vocabulary, partial-success, and OpenAPI requirements. TSV work is contract-blocked.
- 2026-09-06: completed the guided book and album compositions. Book Build Mode now persists
  setup-only queue, drafts, saved IDs, errors, stable client sequences, and destination across
  reloads; interrupted lookups safely requeue. Both intake engines expose explicit complete,
  add-location, and save/leave actions without duplicating their catalog forms. Completion
  permits zero, some, or all saved rows, preserves unresolved local work, calls the dedicated
  completion endpoint, and routes to the medium-appropriate Dashboard. Added real-browser
  coverage for inline shelf creation, intake handoff, reload restoration, zero-item completion,
  and request/state assertions, plus setup accessibility and tenant-isolation coverage.
- 2026-09-06: canonical `make check` passed: 1,294 unit tests across 134 files, all 16 Chromium
  Playwright tests, TypeScript, ESLint, production build, coverage thresholds, and the 98.72 kB
  main-entry gzip budget.

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

- [x] All durable setup states, loading, offline/transient failure, retry, empty, partial
      success, and idempotent completion paths are covered.
- [x] Refresh or browser closure restores only the matching library/media session and stable
      client item IDs.
- [x] The flow supports books and albums with their own fields, lookup adapters, and
      shelf/crate language while sharing one orchestration model.
- [x] Location creation composes canonical location APIs and preserves server-enforced
      system-location and mixed-media placement rules.
- [ ] Invalid TSV files do not mutate the catalog; validation totals and row-level reasons are
      accessible before commit. Blocked on the backend TSV contract.
- [x] Completion and resume work with zero, some, or all rows saved.
- [x] Existing intake keyboard/scanner behavior is retained; setup accessibility,
      tenant-isolated restoration, and interrupted-request recovery have automated coverage.
- [x] No tutorial-only carousel, fake scan, spreadsheet editor, restore workflow, or duplicate
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
