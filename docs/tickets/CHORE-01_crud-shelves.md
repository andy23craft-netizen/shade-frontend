# CHORE-01 -- `/shelves` write UI (deferred)

## Objective

Finish shelf catalog writes on `/shelves` once the backend documents create/update/delete HTTP. Read sync,
book membership via `shelf_name`, the API-fed Add/Edit Book picker, and the read-only `/shelves` catalog are
already shipped -- do not rebuild them.

Prefer this file under `docs/tickets/` when judging remaining shelves-write work. Treat ticket presence as the
source of truth over `docs/ToDo.md` (the checklist can lag).

## Already delivered (do not redo)

- Regenerated OpenAPI types: `ShelfRead`, book `shelf_name` (string); hard-coded `Shelf` enum / book `shelf`
  removed.
- `shelvesApi.list` / `useShelves` / `queryKeys.shelves` for unpaginated `GET /shelves`.
- `/shelves` read-only catalog (`ShelvesPage`) with Title Case `common_name`, system-shelf labelling
  (`unknown` / `removed`), loading / `QueryErrorState` / empty states, and honest copy that catalog edits wait
  for write routes.
- Add/Edit Book shelf pickers fed by `GET /shelves`: `shelf_id` in memory, Title Case labels, submit
  `shelf_name` as selected `common_name`; `unknown` allowed; `removed` excluded except edit may surface current
  `removed` membership; create requires an explicit shelf; Add/Edit Book block the page when shelves fail to
  load. No shelf CRUD on book forms.
- Collection/detail Title Case `shelf_name` via `formatShelfCommonNameForDisplay`.
- Documented **400** / **403** / **422** / network handling for list and book `shelf_name` without clearing the
  auth cache.
- Contract smoke includes `/shelves`; `docs/AGENTS.md` records the shipped baseline.

## Dependencies

Reuse FEAT-03 typed client / React Query, existing `ShelvesPage` / `shelfDisplay` / `shelvesApi` /
`useShelves`, and shared `QueryErrorState`, `Field`, `ConfirmationDialog`, `EmptyState`, `LoadingState`, plus
PLAN.md 7.5-style invalidation.

Do not pull FEAT-13 journey automation, FEAT-14 CI, FEAT-15 Podman, FEAT-16 release artifacts, FEAT-17 About
routing, FEAT-18 category filter UI, FEAT-19 wishlists, FEAT-20 dashboard reports, or FEAT-21 alternate-copy
checkout UX into this ticket.

## Blocker: shelf write HTTP is not in the checked-in contract

As of the OpenAPI and `API-for-FE.md` checked into this repo:

- `GET /shelves` exists (authenticated, unpaginated JSON **array** of `ShelfRead`).
- There is **no** `POST` / `PATCH` / `DELETE` shelf route in `docs/technical-reference/openapi.json`.
- Backend docs explicitly mark "add shelves from the UI" as blocked on shelf write HTTP.

**Do not invent** request bodies, status codes, or soft-delete semantics from product desire alone. Confirm
against a running backend `/openapi.json` before locking transport types; record drift as a blocker. When
writes are documented, regenerate types with `yarn api:generate` and extend this ticket's remaining scope.

## Contract references (for when writes land)

Treat these as complementary once OpenAPI documents write routes:

- `../technical-reference/openapi.json` -- paths, methods, status codes, schemas for shelf create/update/delete
  (plus existing `GET /shelves` / `ShelfRead` / book `shelf_name`).
- `../technical-reference/API-for-FE.md` -- status codes, system-shelf rules, and any rename side effects on book
  membership display.

Existing book-placement rules (still in force; not reopened by this remaining work):

- Book placement is `shelf_name` (= `shelves.common_name`); incoming values are trimmed then lowercased.
- Soft-delete moves membership to `removed`; restore moves to `unknown` (prior shelf is not restored).
- Only soft-delete assigns `removed`; create/update that normalize to `removed` → **400**.

## Remaining product intent

From `/shelves` only, an operator should be able to:

1. **Add a shelf** -- create with required `common_name` and optional location/description per documented schema.
2. **Edit a shelf** -- update selected shelf fields; Field-linked validation errors.
3. **Optionally delete a shelf** -- confirmation via `ConfirmationDialog`; map only documented
   **400** / **404** / **409** (or whatever OpenAPI lists).
4. **Protect system shelves** -- forbid deleting or renaming `unknown` / `removed` in the UI even if the API
   allows mistakes.
5. **Invalidate correctly** -- mutations invalidate `queryKeys.shelves.all` and also `queryKeys.books.all` (and
   dashboard if renames affect displayed membership) when write responses or product rules require it.

Title Case display and book-form picker rules stay as shipped; do not move shelf management onto Add/Edit Book.

## Out of scope

- Inventing `POST` / `PATCH` / `DELETE /shelves` before OpenAPI documents them.
- Creating or editing shelves from Add Book / Edit Book.
- Rebuilding the read catalog, picker, or `shelf_name` contract sync already delivered above.
- Changing soft-delete / restore shelf side effects (backend-owned).
- Wishlist, dashboard-report, or incomplete-metadata product UIs.
- Recalculating dashboard shelf buckets client-side.

## Remaining scope (file-level plan)

### 1. Typed write helpers and hooks (only after OpenAPI documents writes)

| File | Change |
| ---- | ------ |
| `src/api/generated/openapi.ts` | Regenerate via `yarn api:generate`. Expect documented create/update/delete paths and request/response schemas. Do not hand-edit. |
| `scripts/contractSmoke.test.ts` | Extend expected paths/methods only as OpenAPI adds them. |
| `src/api/shelvesApi.ts` | Add `create` / `update` / `remove` (names matching existing API style) with documented status codes only. |
| `src/api/shelvesApi.test.ts` | Cover success and documented error mapping for each write helper. |
| `src/api/shelvesQueries.ts` | Add `useCreateShelf` / `useUpdateShelf` / `useDeleteShelf`; invalidate `queryKeys.shelves.all` and books/dashboard when required. |
| `src/api/shelvesQueries.test.tsx` | Mutation success/error and invalidation coverage. |

### 2. `/shelves` write UI

| File | Change |
| ---- | ------ |
| `src/features/shelves/routes/ShelvesPage.tsx` | Replace the "catalog edits unavailable" copy with create/edit forms and optional delete. Reuse `ConfirmationDialog` for destructive actions; Field-linked **422**; disable while pending; keep system-shelf protection. |
| `src/features/shelves/routes/ShelvesPage.test.tsx` | Create/edit/delete flows, system-shelf guards, error mapping; assert no invented calls if OpenAPI is still read-only. |
| `src/styles/components.css` | Minimal BEM-like classes only if write forms need them; prefer existing list/form patterns. |

### 3. Docs hygiene (after write UI ships)

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Record shelf write helpers/hooks and that `/shelves` owns create/edit/delete; remove "write HTTP not yet documented" language once true. |
| `docs/ToDo.md` | Optional checklist update; prefer ticket removal under `docs/tickets/` when this remaining work is done. |
| This file | Delete when write UI acceptance criteria pass. |

## Acceptance criteria

- Checked-in OpenAPI documents shelf write HTTP; `yarn api:generate` / `yarn api:check` stay clean.
- Typed create/update/delete helpers and mutations exist; no invented statuses or bodies.
- `/shelves` supports create, edit, and optional delete with confirmation, Field-linked errors, pending disable,
  and system-shelf protection (`unknown` / `removed`).
- Mutations invalidate shelves (and books/dashboard when renames affect membership display).
- Book forms still do not create or edit shelves.
- Colocated tests cover write helpers, mutations, and ShelvesPage write flows.
- `make check` passes.
- This ticket file is removed after the above lands.

## Plan coverage

Deferred `/shelves` catalog writes only. Explicitly excludes inventing write endpoints, shelf management on the
book form, redoing shipped read/picker work, and unrelated FEAT-13..21 product work.
