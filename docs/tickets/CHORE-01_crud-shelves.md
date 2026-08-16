# CHORE-01 -- Shelves contract sync, book shelf picker, and `/shelves` CRUD

## Objective

Bring the frontend onto the current backend shelf contract, then ship:

1. Typed `GET /shelves` support and book payloads that use `shelf_name` (string) instead of the removed
   hard-coded `Shelf` enum / book `shelf` field.
2. A `/shelves` page that lists every shelf and (when the backend exposes write routes) lets operators add,
   edit, and optionally delete shelves.
3. An Add Book / Edit Book shelf control that loads shelves from the API, keeps `shelf_id` UUIDs in memory,
   shows Title Case `common_name` labels in a dropdown, and never creates or edits shelves from that form.
4. Graceful handling of documented backend error statuses for shelf list, book create/update with
   `shelf_name`, and (when present) shelf writes.

Prefer this file under `docs/tickets/` when judging shelves-work completion.

## Dependencies

FEAT-03 typed client / React Query, FEAT-05 `BookForm`, and FEAT-10 edit metadata are complete and must be
extended rather than replaced. Reuse `QueryErrorState`, `Field`, `ConfirmationDialog`, `EmptyState`,
`LoadingState`, `pickDocumentedRequestFields`, and PLAN.md 7.5-style invalidation.

Do not pull FEAT-13 journey automation, FEAT-14 CI, FEAT-15 Podman, FEAT-16 release artifacts, FEAT-17 About
routing, FEAT-18 category filter UI, FEAT-19 wishlists, FEAT-20 dashboard reports, or FEAT-21 alternate-copy
checkout UX into this ticket.

### Blocker: shelf write HTTP is not in the checked-in contract

As of the OpenAPI and `API-for-FE.md` checked into this repo:

- `GET /shelves` exists (authenticated, unpaginated JSON **array** of `ShelfRead`).
- There is **no** `POST` / `PATCH` / `DELETE` shelf route in `docs/technical-reference/openapi.json`.
- Backend docs explicitly mark "add shelves from the UI" as blocked on shelf write HTTP.

**Implement now without inventing endpoints:** contract regeneration, `shelvesApi.list`, React Query list hooks,
`/shelves` read-only browse UI, and the book-form picker.

**Defer write UI until the checked-in OpenAPI documents create/update/delete** (and `API-for-FE.md` describes
status codes / system-shelf rules). When that lands, extend this ticket's write sections (or a follow-up) -- do
not invent request bodies, status codes, or soft-delete semantics from product desire alone. Until then, the
`/shelves` page may show an honest empty create affordance or short copy that shelf catalog edits are unavailable,
not a fake local-only catalog.

Confirm against a running backend `/openapi.json` before locking transport types; record drift as a blocker.

## Contract references

Treat these as complementary:

- `../technical-reference/openapi.json` -- paths, methods, status codes, schemas:
  - `GET /shelves` → `200` array of `ShelfRead` (`shelf_id`, `common_name`, optional `location` /
    `description`, `created_date`, `updated_date`); `403` auth failure.
  - Book schemas use required `shelf_name` on `BookCreate` / `BookRead` and optional `shelf_name` on
    `BookUpdate` (string, maxLength 32). The old `Shelf` enum and book `shelf` property are gone.
  - Sort `sortBy=shelf` remains (lexical on `shelves.common_name`); that query name does not change.
- `../technical-reference/API-for-FE.md` -- behavioral rules OpenAPI does not fully express:
  - `GET /shelves` is **not** a `{ items, total }` envelope; includes system shelves `unknown` and `removed`;
    order `common_name` ASC then `shelf_id` ASC.
  - Book placement is membership exposed as `shelf_name` (= `shelves.common_name`), not a free-form book column.
  - Incoming `shelf_name` values are trimmed then lowercased (max 32 after trim).
  - Create requires `shelf_name`. Update: omit `shelf_name` to leave membership unchanged; JSON `null` or blank →
    **422**; unknown name → **400**; name that normalizes to `removed` → **400** (only soft-delete assigns
    `removed`).
  - Soft-delete moves membership to `removed`; restore moves to `unknown` (prior shelf is not restored).
  - Recommended FE flow: load `GET /shelves` → user picks a `common_name` → send as `shelf_name` on
    `POST /books` or `PATCH /books/{id}`.

## Current baseline

Already in place and must be updated (not left on the old enum):

- Generated types still model book `shelf: Shelf` and a hard-coded `Shelf` string union; `apiTypes` exports
  `Shelf`. Request pickers still list `'shelf'`.
- `BookForm` / `bookFormDefaults` / `bookFormModel` / `bookEditModel` use a static `SHELF_VALUES` select and
  form field `shelf`, defaulting create to `'unknown'`.
- Collection and detail pages display `book.shelf` via `enumDisplayValue` against the old enum.
- Fixtures and tests across books/loans pages still set `shelf: 'a1' | 'unknown' | ...`.
- `scripts/contractSmoke.test.ts` `expectedPaths` omits `/shelves`.
- No `shelvesApi`, shelves query keys/hooks, `/shelves` route, or Shelves nav link.
- Soft-delete / restore / checkout / check-in / mark-read lifecycle endpoints are unchanged by this ticket.

## Product intent

An operator should be able to:

1. **See the shelf catalog** -- open `/shelves` and see every shelf from `GET /shelves` (`common_name` in Title
   Case, plus optional location/description when present). Keep `shelf_id` available in client state for later
   writes and for the book picker.
2. **Assign a shelf when adding or editing a book** -- Add Book (`/books/new`) and Edit Book
   (`/books/:bookId/edit`) use a dropdown fed by `GET /shelves`. Option **values** are `shelf_id` UUIDs held in
   memory; visible labels are Title Case `common_name`. Submit maps the selected id to that shelf's
   `common_name` and sends it as `shelf_name`. Do **not** offer create/rename/delete of shelves on these pages.
3. **Allow `unknown`; never assign `removed`** -- the book dropdown may offer `unknown` as a normal destination
   (Title Case label `Unknown`). It must not allow choosing `removed` (backend rejects `removed` on create/update
   with **400**; only soft-delete assigns that membership). Soft-delete and restore continue to set `removed` /
   `unknown` via dedicated book endpoints when those flows apply; the form may still target `unknown` deliberately.
4. **Add / edit / optionally delete shelves (when API exists)** -- from `/shelves` only, with confirmation on
   destructive actions and Field-linked validation errors. Until write routes exist, do not invent them.
5. **Recover from API failures** -- list/load/mutate errors use existing `QueryErrorState` /
   `formatApiQueryError` / Field-linked **422** patterns; **403** stays a page-level unauthorized message without
   clearing the query cache. If `GET /shelves` fails on Add Book, block the whole page (do not render `BookForm`)
   with a helpful `QueryErrorState` and retry.

### Title Case display rule

Add a small pure helper (e.g., `formatShelfCommonNameForDisplay`) used by `/shelves`, book forms, collection cards,
and detail:

- Take API `common_name` (typically lowercase, may include underscores).
- Replace `_` with spaces, collapse whitespace, Title Case each word (first character upper, remainder lower unless
   the product later documents an acronym exception list -- do not invent special cases beyond Title Case).
- Examples: `unknown` → `Unknown`; `removed` → `Removed`; `liz_tbr` → `Liz Tbr`; `a1` → `A1`.
- Submit and compare using the API's stored `common_name` (lowercase), never the display string.

### Create vs edit defaults

- **Create:** do not default to `unknown` (or any other shelf). Require an explicit assignable shelf before submit
  (client validation if none selected). Prefer empty selection + "Shelf is required" over silently picking the
  first shelf. Assignable options include `unknown` and every other catalog shelf except `removed`.
- **Edit:** populate from `book.shelf_name`. `unknown` is a normal choosable target. If the current membership is
  `removed`, still show that current value as the selected option (Title Case label) so the operator sees reality,
  but do not allow choosing `removed` as a *new* target. Unchanged membership should omit `shelf_name` from the
  minimal `BookUpdate` patch (existing edit no-op / minimal-patch rules). Changing shelf sends the newly chosen
  `common_name`. Soft-deleted books remain non-editable via existing Edit eligibility (not this ticket's job to
  reopen).

## Out of scope

- Inventing `POST` / `PATCH` / `DELETE /shelves` before OpenAPI documents them.
- Creating or editing shelves from Add Book / Edit Book.
- Changing soft-delete / restore shelf side effects (backend-owned).
- Wishlist, dashboard-report, or incomplete-metadata product UIs.
- Recalculating dashboard shelf buckets client-side.
- Cover images, multi-library tenancy, or a second state store / form library.

## Remaining scope (file-level plan)

### 1. OpenAPI types and contract smoke

| File | Change |
| ---- | ------ |
| `src/api/generated/openapi.ts` | Regenerate via `yarn api:generate` from checked-in OpenAPI. Expect `/shelves`, `ShelfRead`, and book `shelf_name`; expect removal of the `Shelf` enum and book `shelf` property. Do not hand-edit. |
| `scripts/contractSmoke.test.ts` | Add `/shelves` to `expectedPaths` (sorted with existing paths). Keep wishlist/dashboard-report paths already listed. |
| `src/api/apiTypes.ts` | Export `ShelfRead`. Remove `Shelf` alias (or replace with a deprecated comment-free deletion). Update any docs comments that mention the enum. |
| `src/api/apiTypes.test.ts` | Assert `ShelfRead` / `shelf_name` shapes; drop `Shelf` enum assertions; fix book fixture fields to `shelf_name`. |

### 2. Typed shelves API, request picking, and book field rename

| File | Change |
| ---- | ------ |
| `src/api/shelvesApi.ts` | New module: `list(options?)` → `GET /shelves` returning `ShelfRead[]` (plain array). Accept optional `AbortSignal`. When OpenAPI later adds writes: `create` / `update` / `remove` with documented status codes only -- stub nothing now. |
| `src/api/shelvesApi.test.ts` | List success (array body), auth **403**, network/timeout mapping; assert path `/shelves` and no pagination query params. |
| `src/api/api.ts` | Aggregate `shelves: createShelvesApi(client)` on `createApi`. |
| `src/api/api.test.ts` | Assert `createApi` exposes `shelves.list`. |
| `src/api/requestFields.ts` | Replace `'shelf'` with `'shelf_name'` in `BOOK_CREATE_KEYS` / `BOOK_UPDATE_KEYS`. |
| `src/api/requestFields.test.ts` | Update fixtures and expectations to `shelf_name`. |
| `src/api/booksApi.test.ts` (and conflict / large-library tests) | Book bodies and fixtures use `shelf_name`; sort-by-shelf coverage unchanged. |
| Any other `src/api/*.test.*` fixtures using `shelf:` | Rename to `shelf_name`. |

### 3. Query keys, hooks, and invalidation

| File | Change |
| ---- | ------ |
| `src/api/queryKeys.ts` | Add `shelves.all` and `shelves.list()` (unpaginated; no skip/take). When writes exist later, keep invalidation on the `['shelves']` prefix. |
| `src/api/queryKeys.test.ts` | Cover shelves key shape and isolation from books/loans. |
| `src/api/shelvesQueries.ts` | `useShelves({ enabled? })` via `shelvesApi.list`. Later: `useCreateShelf` / `useUpdateShelf` / `useDeleteShelf` that invalidate `queryKeys.shelves.all` and also invalidate `queryKeys.books.all` (and dashboard if shelf renames affect displayed membership) when write responses or product rules require it -- only when OpenAPI writes exist. |
| `src/api/shelvesQueries.test.tsx` | List hook success/error; enabled flag; (future) mutation invalidation. |
| `src/api/booksQueries.ts` | No change required for reads; ensure create/update still invalidate book lists/detail/dashboard as today after `shelf_name` payloads. |

### 4. Display helper and assignable-shelf rules

| File | Change |
| ---- | ------ |
| `src/features/shelves/shelfDisplay.ts` | `formatShelfCommonNameForDisplay(commonName)`; treat `removed` as non-assignable (compare on normalized lowercase); keep `unknown` assignable; optional `SYSTEM_SHELF_COMMON_NAMES = ['unknown', 'removed']` for catalog labelling on `/shelves` only; `isAssignableShelf(shelf)` / `filterAssignableShelves(shelves)` exclude `removed` only; `shelfCommonNameById(shelves, shelfId)`. |
| `src/features/shelves/shelfDisplay.test.ts` | Title Case cases; underscore splitting; assignable filter excludes `removed` but keeps `unknown` and other names; id→name lookup. |

### 5. Book form and create/edit conversion (`shelf` → `shelf_name` + API-fed select)

| File | Change |
| ---- | ------ |
| `src/features/books/components/BookForm.tsx` | Remove static `SHELF_VALUES` / `Shelf` typing. Accept shelves input: e.g. `shelves: ShelfRead[]` (or assignable-only list + optional `currentShelfName` for edit when membership is `removed`). Form value for the control should be selected `shelf_id` (string) or empty. Render `<select>` options with `value={shelf_id}` and label `formatShelfCommonNameForDisplay(common_name)`. Include `unknown` in choosable options; exclude `removed` except when edit must surface the current `removed` membership as a non-targetable selected option. Do not fall back to the old hard-coded enum. **No** "Add shelf" controls on this form. |
| `src/features/books/components/bookFormDefaults.ts` | Replace `shelf: 'unknown'` with empty selected id (e.g. `shelfId: ''`) or equivalent; create must require a choice (including an explicit pick of `unknown` if that is the intended destination). |
| `src/features/books/components/bookFormModel.ts` | Rename field to align with form state (`shelfId` or keep UI name `shelf` only as label). Validate required selection on create. `formValuesToBookCreate` resolves `shelf_id` → `common_name` and emits `shelf_name` (never send display Title Case). Map server `fieldErrors.shelf_name` into the shelf Field. |
| `src/features/books/components/bookFormModel.test.ts` / `BookForm.test.tsx` | Cover required shelf, assignable options including `unknown`, Title Case labels, payload `shelf_name`, no `removed` in create options. |
| `src/features/books/routes/NewBookPage.tsx` | `useShelves()`; while shelves are loading show `LoadingState`; on shelves failure **block the whole page** -- render a helpful `QueryErrorState` (with retry when appropriate) and **do not mount `BookForm`**. On success, pass shelves into `BookForm`; map create **422** `shelf_name` and **400** (unknown name / `removed`) into Field or summary errors via existing error mapping. |
| `src/features/books/routes/EditBookPage.tsx` | Same shelves load; prefer the same full-page load/error gate before the form so the picker is never fed a missing catalog; `bookFormValuesFromBook` seeds selected id from matching `common_name` / `shelf_name`. |
| `src/features/books/routes/bookEditModel.ts` | Read/write `shelf_name`; compare on API names; omit unchanged `shelf_name`; never send `null`. |
| `src/features/books/routes/bookEditModel.test.ts` / `EditBookPage.test.tsx` / `NewBookPage.test.tsx` | Update fixtures to `shelf_name`; assert picker wiring; Add Book shelves-failure blocks the page (no form); error paths for create **400**/**422**. |

### 6. Browse / detail display of shelf names

| File | Change |
| ---- | ------ |
| `src/features/books/routes/BooksPage.tsx` | Display `formatShelfCommonNameForDisplay(book.shelf_name)` (or Title Case + safe fallback). Stop treating shelf as a closed enum for `enumDisplayValue` unless an unknown string still needs a neutral suffix -- prefer Title Case of the raw `shelf_name` without inventing enum membership. |
| `src/features/books/routes/BookDetailsPage.tsx` | Same display for the shelf field. |
| `src/features/books/routes/BooksPage.test.tsx` / `BookDetailsPage.test.tsx` | Fixtures `shelf_name`; assert Title Case (or documented display) in the UI. |
| All other feature tests using `shelf:` on `BookRead` | Rename to `shelf_name` (Mark Read, Delete, Deleted, Reading, Checkout, Check-in, Loans, etc.). |

### 7. Feature module -- `/shelves` page

| File | Change |
| ---- | ------ |
| `src/features/shelves/routes/ShelvesPage.tsx` | New route page. `useShelves()`; loading / `QueryErrorState` / empty catalog messaging; list rows showing Title Case `common_name`, optional location/description, stable key `shelf_id`. Mark system shelves (`unknown`, `removed`) clearly so operators do not expect to delete them even when writes exist. |
| `src/features/shelves/routes/ShelvesPage.test.tsx` | Loading, error+retry, list rendering, Title Case labels, system-shelf labelling; assert no invented write calls while OpenAPI is read-only. |
| Write UI (only after OpenAPI documents it) | Inline or section forms for create (`common_name` required; optional location/description per schema); edit selected shelf; optional delete with `ConfirmationDialog`. Field-linked **422**; documented **400**/**404**/**409** messaging; disable while pending; invalidate shelves (and books if names change). Forbid deleting or renaming system shelves in the UI even if the API allows mistakes. |

### 8. Routing, navigation, and metadata

| File | Change |
| ---- | ------ |
| `src/routes/routeMetadata.ts` | Add `shelves: { path: '/shelves', title: 'Shelves', heading: 'Shelves' }`. |
| `src/routes/routes.tsx` | Register `ShelvesPage` under `AppShell` at `routeMetadata.shelves.path`. |
| `src/layout/AppShell.tsx` | Primary nav `NavLink` to `/shelves` (label "Shelves"), near Books / Loans -- not under admin. |
| `src/layout/AppShell.test.tsx` | Expect Shelves nav link and current-page behavior. |
| `src/App.test.tsx` | Optional: document title / heading focus when navigating to `/shelves`. |

### 9. Styling

| File | Change |
| ---- | ------ |
| `src/styles/components.css` | Minimal BEM-like classes only as needed (e.g., `.shelves-page`, `.shelves-list`, `.shelf-row`) reusing list/section spacing. Prefer existing books/loans patterns. |
| `src/styles/shell.css` | Only if nav density needs adjustment for the extra primary link at narrow widths. |

### 10. Error handling matrix (implement against documented statuses)

| Situation | Expected FE behavior |
| --------- | -------------------- |
| `GET /shelves` **403** | On Add Book (and prefer Edit Book): full-page `QueryErrorState` unauthorized copy; do not render `BookForm`; no Retry that spam-loops; do not clear cache. |
| `GET /shelves` network / timeout / 5xx | On Add Book (and prefer Edit Book): full-page retryable `QueryErrorState`; do not render `BookForm` or fall back to the old hard-coded enum. |
| Create/update book **422** (`shelf_name` null/blank) | Field-linked error on the shelf control; focus error summary per existing BookForm behavior. |
| Create/update book **400** (name not in catalog, or `removed`) | Page or Field-level message from `detail`; do not pretend success; keep form input. |
| Soft-deleted book edit **404** | Existing EditBook refetch / warning path (unchanged). |
| Future shelf write errors | Map only statuses documented in OpenAPI / API-for-FE when those routes exist. |

### 11. Docs hygiene (after implementation)

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Record `shelf_name`, `GET /shelves`, `shelvesApi` / hooks, `/shelves` route, book-form picker rules (`unknown` allowed; `removed` excluded; Title Case display; no shelf CRUD on book forms; Add Book blocked when shelves fail to load). Note write HTTP status honestly. Update lifecycle / compensation lines that still say required field `shelf` as an enum. |
| `docs/ToDo.md` | Optional checklist line for this chore; prefer ticket presence under `docs/tickets/` as source of truth. |

## Acceptance criteria

- `yarn api:generate` / `yarn api:check` stay clean against checked-in OpenAPI; generated types expose `ShelfRead`
  and book `shelf_name` and no longer depend on a `Shelf` enum for book payloads.
- `scripts/contractSmoke.test.ts` includes `/shelves`.
- Typed `shelvesApi.list` + `useShelves` load the unpaginated array; query keys live under `queryKeys.shelves`.
- `/shelves` lists all shelves with Title Case `common_name` and graceful loading/error/empty states.
- Add Book and Edit Book shelf controls load from `GET /shelves`, keep `shelf_id` in memory, show Title Case
  labels, submit `shelf_name` as the selected shelf's `common_name`, and do not create/edit shelves inline.
- `unknown` is a choosable assignment target; `removed` is not (except edit may surface current `removed`
  membership as a non-targetable selected option).
- Book create no longer defaults silently to `unknown`; the operator must pick a shelf explicitly.
- When `GET /shelves` fails on Add Book, the page shows a helpful `QueryErrorState` and does not render
  `BookForm`.
- Collection and detail shelf display use Title Case `shelf_name` (not the old enum list).
- Documented **400** / **403** / **422** / network failures for shelves and `shelf_name` are handled without
  clearing auth cache or inventing lifecycle workarounds.
- No invented shelf write HTTP while OpenAPI is read-only; when writes are documented, create/edit and optional
  delete live only on `/shelves`, with system shelves protected in the UI.
- Colocated tests cover API helpers, display helpers, BookForm/new/edit wiring, ShelvesPage, and fixture renames.
- `make check` passes.

## Plan coverage

Shelf catalog read + book membership via `shelf_name`, Add/Edit book picker UX, and a `/shelves` surface ready for
CRUD once the backend write contract exists. Explicitly excludes inventing shelf write endpoints, shelf management
on the book form, and unrelated FEAT-13..21 product work.
