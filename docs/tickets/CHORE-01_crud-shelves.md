# CHORE-01 -- `/shelves` write UI

## Objective

Finish shelf catalog create/update/delete on `/shelves` against the now-documented write HTTP. Read sync, book
membership via `shelf_name`, the API-fed Add/Edit Book picker, and the read-only `/shelves` catalog are already
shipped -- do not rebuild them.

Prefer this file under `docs/tickets/` when judging remaining shelves-write work. Treat ticket presence as the
source of truth over `docs/ToDo.md` (the checklist can lag).

## Already delivered (do not redo)

- Regenerated OpenAPI types: `ShelfRead`, book `shelf_name` (string); hard-coded `Shelf` enum / book `shelf`
  removed.
- `shelvesApi.list` / `useShelves` / `queryKeys.shelves` for unpaginated `GET /shelves`.
- `/shelves` read-only catalog (`ShelvesPage`) with Title Case `common_name`, system-shelf labelling
  (`unknown` / `removed`), loading / `QueryErrorState` / empty states, and copy that catalog edits were waiting
  on write routes (replace that copy when write UI lands).
- Add/Edit Book shelf pickers fed by `GET /shelves`: `shelf_id` in memory, Title Case labels, submit
  `shelf_name` as selected `common_name`; `unknown` allowed; `removed` excluded except edit may surface current
  `removed` membership; create requires an explicit shelf; Add/Edit Book block the page when shelves fail to
  load. No shelf CRUD on book forms.
- Collection/detail Title Case `shelf_name` via `formatShelfCommonNameForDisplay`.
- Documented **400** / **403** / **422** / network handling for list and book `shelf_name` without clearing the
  auth cache.
- Contract smoke includes `/shelves`; `docs/AGENTS.md` records the shipped read/picker baseline.

## Dependencies

Reuse FEAT-03 typed client / React Query, existing `ShelvesPage` / `shelfDisplay` / `shelvesApi` /
`useShelves`, and shared `QueryErrorState`, `Field`, `ConfirmationDialog`, `EmptyState`, `LoadingState`, plus
PLAN.md 7.5-style invalidation.

Do not pull FEAT-13 journey automation, FEAT-14 CI, FEAT-15 Podman, FEAT-16 release artifacts, FEAT-17 About
routing, FEAT-18 category filter UI, FEAT-19 wishlists, FEAT-20 dashboard reports, or FEAT-21 alternate-copy
checkout UX into this ticket.

## Contract references

Treat these as complementary:

- `../technical-reference/openapi.json` -- paths, methods, status codes, and schemas:
  - `GET /shelves` -- authenticated, unpaginated JSON **array** of `ShelfRead` (**200**; **403**)
  - `POST /shelves` -- body `ShelfCreate` (`common_name` required max 32; optional `location` / `description`);
    **201** `ShelfRead`; **400** / **403** / **409** / **422**
  - `PATCH /shelves/{shelf_id}` -- body `ShelfUpdate` (optional `common_name` / `location` / `description`, each
    nullable); **200** `ShelfRead`; **400** / **403** / **404** / **409** / **422**
  - `DELETE /shelves/{shelf_id}` -- **204**; **400** / **403** / **404** / **409** / **422**
  - Schemas: `ShelfCreate`, `ShelfUpdate`, `ShelfRead` (`shelf_id`, `common_name`, `created_date`,
    `updated_date`, optional `location` / `description`)
- `../technical-reference/API-for-FE.md` -- behavioral rules OpenAPI does not fully express:
  - List order: `common_name` ascending, then `shelf_id` ascending; includes system shelves `unknown` /
    `removed`.
  - Incoming `common_name` is trimmed then lowercased (max 32 after trim).
  - Create: reserved names `unknown` / `removed` → **400**; duplicate `common_name` → **409**.
  - Update: malformed/empty `shelf_id` → **400**; unknown id → **404**. System shelves cannot be renamed
    (**400**), but `location` / `description` may change. Rename to a reserved name → **400**; rename conflict →
    **409**.
  - Delete: empty non-system shelf → **204**. System shelves → **400**; any remaining book membership → **409**
    (books are unchanged).
  - Refresh `GET /shelves` after create/update/delete so pickers stay current. New `common_name` values are
    immediately assignable on book create/update via `shelf_name`.
  - Book placement remains `shelf_name` (= `shelves.common_name`); soft-delete moves membership to `removed`;
    restore moves to `unknown` (prior shelf is not restored). Only soft-delete assigns `removed`; create/update
    that normalize to `removed` → **400**.
  - Frontend owns shelf catalog management UI (create / rename / edit metadata / delete empty shelves); API owns
    shelf CRUD and membership.

Confirm against a running backend `/openapi.json` before locking transport types; record drift as a blocker
rather than inventing frontend semantics. Prefer `yarn api:generate` over hand-editing generated types.

## Remaining product intent

From `/shelves` only, an operator should be able to:

1. **Add a shelf** -- `POST /shelves` with required `common_name` and optional `location` / `description`;
   Field-linked **422**; map **400** (reserved names) and **409** (duplicate) into the form summary.
2. **Edit a shelf** -- `PATCH /shelves/{shelf_id}` for changed fields only; Field-linked **422**; map **400** /
   **404** / **409**. Allow `location` / `description` edits on system shelves; forbid renaming `unknown` /
   `removed` in the UI.
3. **Delete a shelf** -- `DELETE /shelves/{shelf_id}` with `ConfirmationDialog`; map **400** (system shelf),
   **404**, and **409** (books remain). Do not offer delete for system shelves or invent soft-delete.
4. **Protect system shelves** -- forbid deleting or renaming `unknown` / `removed` even if the API allows
   mistakes; still allow non-name metadata edits where the API permits them.
5. **Invalidate correctly** -- mutations invalidate `queryKeys.shelves.all` (and `queryKeys.books.all` /
   dashboard when a rename can change displayed membership). Refresh pickers after successful writes.

Title Case display and book-form picker rules stay as shipped; do not move shelf management onto Add/Edit Book.

## Out of scope

- Creating or editing shelves from Add Book / Edit Book.
- Rebuilding the read catalog, picker, or `shelf_name` contract sync already delivered above.
- Changing soft-delete / restore shelf side effects (backend-owned).
- Wishlist, dashboard-report, or incomplete-metadata product UIs.
- Recalculating dashboard shelf buckets client-side.
- Inventing statuses, bodies, or soft-delete semantics beyond the checked-in OpenAPI / `API-for-FE.md`.

## Remaining scope (file-level plan)

### 1. Typed write helpers and hooks

| File | Change |
| ---- | ------ |
| `src/api/generated/openapi.ts` | Regenerate via `yarn api:generate` so `ShelfCreate` / `ShelfUpdate` and write paths are present. Do not hand-edit. |
| `scripts/contractSmoke.test.ts` | Expect `POST /shelves`, `PATCH` / `DELETE /shelves/{shelf_id}`, and related schemas. |
| `src/api/apiTypes.ts` | Export `ShelfCreate` / `ShelfUpdate` aliases alongside existing `ShelfRead` if not already present. |
| `src/api/shelvesApi.ts` | Add `create` / `update` / `remove` (names matching existing API style): `POST` → **201**, `PATCH` → **200**, `DELETE` → **204**; serialize only documented request fields. |
| `src/api/shelvesApi.test.ts` | Cover success and documented error mapping (**400** / **404** / **409** / **422**) for each write helper. |
| `src/api/shelvesQueries.ts` | Add `useCreateShelf` / `useUpdateShelf` / `useDeleteShelf`; invalidate `queryKeys.shelves.all` and books/dashboard when renames affect membership display. |
| `src/api/shelvesQueries.test.tsx` | Mutation success/error and invalidation coverage. |
| `src/api/api.ts` | Keep `shelves` aggregate; no parallel client. |

### 2. `/shelves` write UI

| File | Change |
| ---- | ------ |
| `src/features/shelves/routes/ShelvesPage.tsx` | Replace the "catalog edits unavailable" copy with create/edit forms and delete. Reuse `ConfirmationDialog` for destructive actions; Field-linked **422**; disable while pending; keep system-shelf protection (no rename/delete of `unknown` / `removed`). |
| `src/features/shelves/routes/ShelvesPage.test.tsx` | Create/edit/delete flows, system-shelf guards, and error mapping for documented statuses. |
| `src/features/shelves/shelfDisplay.ts` | Extend only if write UI needs shared helpers (e.g., system-shelf guards); keep Title Case / assignable-shelf rules intact. |
| `src/styles/components.css` | Minimal BEM-like classes only if write forms need them; prefer existing list/form patterns. |

### 3. Docs hygiene (after write UI ships)

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Record shelf write helpers/hooks and that `/shelves` owns create/edit/delete; remove "write HTTP not yet documented" language. |
| `docs/ToDo.md` | Optional checklist update; prefer ticket removal under `docs/tickets/` when this remaining work is done. |
| This file | Delete when write UI acceptance criteria pass. |

## Acceptance criteria

- Checked-in OpenAPI types include shelf write schemas/paths; `yarn api:generate` / `yarn api:check` stay clean.
- Typed `create` / `update` / `remove` helpers and mutations exist; only documented statuses and bodies are used.
- `/shelves` supports create, edit, and delete with confirmation, Field-linked errors, pending disable, and
  system-shelf protection (`unknown` / `removed` cannot be renamed or deleted in the UI).
- Mutations invalidate shelves (and books/dashboard when renames affect membership display).
- Book forms still do not create or edit shelves.
- Colocated tests cover write helpers, mutations, and ShelvesPage write flows.
- `make check` passes.
- This ticket file is removed after the above lands.

## Plan coverage

Remaining `/shelves` catalog writes only. Explicitly excludes shelf management on the book form, redoing shipped
read/picker work, inventing undocumented API behavior, and unrelated FEAT-13..21 product work.
