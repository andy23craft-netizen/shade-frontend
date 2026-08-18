# FEAT-26 -- Move a wishlisted book onto a shelf

## Objective

On `/wishlists`, let the operator record that they purchased a wishlisted book by moving it into the collection: remove
the wishlist membership, then assign a shelf via `PATCH /books/{id}`. Each membership row exposes a shelf picker and a
primary action (e.g., "Add to Collection") that runs both API calls in order.

This closes the loop opened by FEAT-19 (add unshelved catalog rows to wishlists) without requiring the operator to
delete an entire wishlist first.

## Dependencies

FEAT-19 wishlists are complete (`WishlistsPage`, `AddWishlistBookControl`, `wishlistsApi` / `wishlistsQueries`,
membership join via `GET /books/{id}`). Shelves catalog CRUD and book-form shelf pickers are complete (`useShelves`,
`shelfDisplay`, `BookForm`).

Checked-in `docs/technical-reference/openapi.json` and `docs/technical-reference/API-for-FE.md` already document
wishlist membership removal and the recommended move-to-shelf flow. Regenerate `src/api/generated/openapi.ts` with
`yarn api:generate` before implementing transport helpers (`yarn api:check` must pass). Compare with a running backend
`/openapi.json` if drift is suspected; record mismatches as a blocker rather than inventing frontend semantics.

Do not pull FEAT-20 dashboard reports, FEAT-21 display-only checkout, FEAT-22 / FEAT-23 circulation consolidation,
FEAT-24 scanner expansion, or FEAT-25 backup removal into this ticket.

## Contract references

Treat these as complementary:

- `../technical-reference/openapi.json` -- membership
  `DELETE /wishlists/{wishlist_id}/books/{wishlist_book_id}` → **204**; **400** malformed or missing identifier;
  **404** unknown wishlist or membership; **403** auth; **422** validation error. Path identifier is
  `wishlist_book_id` (membership row id), not `book_id`. Existing `PATCH /books/{id}` with
  `{ "shelf_name": "<common_name>" }` → **200** `BookRead`; **400** unknown shelf name; **404** missing/soft-deleted
  book; **412** `{"detail": "The book must be removed from the wishlist before it can be placed on a shelf"}` when
  membership still exists; **422** null/blank `shelf_name` on update.
- `../technical-reference/API-for-FE.md` -- recommended move flow: membership `DELETE`, then `PATCH` `shelf_name`
  (deleting the whole wishlist also clears memberships but is not required); shelf/wishlist mutual exclusion (**412**);
  load assignable shelves from `GET /shelves` and submit `common_name` as `shelf_name` (never Title Case display
  strings); unshelved wishlist-only books are omitted from `GET /books` but readable via `GET /books/{id}`; `unknown`
  is assignable, `removed` is not.

**Required call order (non-negotiable):**

1. `DELETE /wishlists/{wishlist_id}/books/{wishlist_book_id}` -- drop membership so shelf assignment is allowed.
2. `PATCH /books/{book_id}` with `{ shelf_name }` only -- minimal patch; never send `status`, reading fields, or
   loan-driving values.

Never assign `shelf_name` while the book is still on a wishlist (the API returns **412**). Never simulate shelf
placement with create or a second unshelved row.

## Current baseline

Already in place and should be reused (not rebuilt):

- `/wishlists` via `WishlistsPage`: nested `useWishlistBooks` + per-row `useBook` join; create wishlist;
  `AddWishlistBookControl` (unshelved `POST /books` then `POST /wishlists/{id}/books`); permanent wishlist delete with
  confirmation. **No membership remove or move-to-shelf UI today.**
- `wishlistsApi`: `list`, `create`, `update`, `remove` (whole wishlist), `listBooks`, `addBook` only.
- `wishlistsQueries`: read hooks plus `useCreateWishlist`, `useUpdateWishlist`, `useDeleteWishlist`,
  `useAddWishlistBook`. Add invalidates that wishlist's books key; whole-wishlist delete invalidates
  `queryKeys.wishlists.all`.
- `booksApi.update` / `useUpdateBook`: minimal `BookUpdate` patches; detail-cache write plus books/dashboard
  invalidation (PLAN.md 7.5).
- Shelf picker conventions from `BookForm` / `NewBookPage`: `useShelves` load gate; `filterAssignableShelves` (exclude
  `removed`; allow `unknown`); Title Case labels via `formatShelfCommonNameForDisplay`; resolve selected `shelfId` →
  `shelf_name` via `shelfCommonNameById`.
- Shared UI: `Field`, `Button`, `ConfirmationDialog`, `Alert`, `LoadingState`, `QueryErrorState`, `AppLink`.
- Wishlist styles in `src/styles/components.css` (`.wishlist-membership`, `.wishlist-card`, etc.).

Stale copy to replace during implementation:

- Page intro and delete-wishlist confirmation still say a wishlisted book cannot be shelved until the wishlist is
  deleted. After this ticket, individual memberships can be moved without deleting the wishlist.

## Product intent

1. **Per-membership action** -- each book on a wishlist offers a labelled shelf `<select>` (from `GET /shelves`) and a
   submit control meaning "I bought this; put it on my shelf." Default shelf selection is empty (explicit pick required,
   same as `/books/new` create).
2. **Two-step lifecycle** -- on confirm, call membership `DELETE`, then `PATCH` `{ shelf_name }`. Do not call them in
   parallel or shelf-first.
3. **Confirmation** -- use `ConfirmationDialog` before mutating (consistent with checkout, delete, mark-read). Name the
   book and the chosen shelf in the description.
4. **Success** -- navigate to `/books/{bookId}` so the operator sees the newly shelved detail (mirror create-book
   success). Optionally show a brief success toast via `useNotifications` if other flows do; not required if navigation
   is enough.
5. **Honest errors** -- surface **412** on shelf assign as stale state ("remove from wishlist first") with refetch of
   wishlist books and book detail; **404** on either step triggers refetch; **400** / **422** shelf errors map to the
   shelf field or form summary. If membership delete succeeds but shelf assign fails, show a recoverable error: the
   book is off the wishlist but still unshelved; keep the shelf picker populated so the operator can retry assign
   without re-deleting.
6. **Shelves load gate** -- when `useShelves` is loading, show a polite loading state on the move control; on shelves
   query failure, disable move actions and point at shelf load recovery (do not mount a broken empty `<select>`).
7. **Scope of shelf patch** -- send only `{ shelf_name }` on the update; do not open the full edit form or patch
   acquisition fields in this ticket (UI design notes mention "where did you get this?" as a future prompt).

## Out of scope

- Membership edit (`PATCH` priority, status, notes, url) -- still no wishlist membership update API.
- Adding shelved collection books to a wishlist from `/books` (FEAT-19 explicitly excluded add-from-collection).
- Full book metadata edit, acquisition-source prompt, purchase date/price capture, or ISBN lookup on move.
- Automatic shelf suggestion, default shelf memory, or "create shelf" inline on the wishlist row.
- Changing wishlist add flow (`AddWishlistBookControl`) or whole-wishlist delete behavior beyond copy updates.

## Remaining scope (file-level plan)

### 1. API transport and React Query

| File | Change |
| ---- | ------ |
| `src/api/generated/openapi.ts` | Regenerate from checked-in `docs/technical-reference/openapi.json` via `yarn api:generate` / `yarn api:check` (membership DELETE is already in the spec; do not hand-edit generated paths). |
| `src/api/wishlistsApi.ts` | Add `removeBook(wishlistId, wishlistBookId)` → `DELETE /wishlists/{wishlist_id}/books/{wishlist_book_id}` (**204**). Accept optional `AbortSignal`. Use encoded path segments. |
| `src/api/wishlistsQueries.ts` | Add `useRemoveWishlistBook()` mutation; `onSuccess` invalidates `queryKeys.wishlists.books(wishlistId)`. Add `useMoveWishlistBookToShelf()` (or equivalent exported orchestrator) that sequentially calls `removeBook` then `booksApi.update` with `{ shelf_name }` only. On full success: write returned `BookRead` to detail cache; invalidate `queryKeys.wishlists.books(wishlistId)`, `queryKeys.books.all`, `queryKeys.books.detail(bookId)`, and `queryKeys.dashboard.all`. Do not retry failed mutations automatically (`mutations.retry: false` already global). Expose pending/error state for the combined operation. |
| `src/api/wishlistsApi.test.ts` | Cover `removeBook`: happy **204**, **400**, **404**, auth path wiring. |
| `src/api/wishlistsQueries.test.tsx` | Cover `useRemoveWishlistBook` invalidation key; orchestrator calls remove then update in order; success invalidates books + wishlist books + dashboard; shelf-only update body. |
| `scripts/contractSmoke.test.ts` | Assert `DELETE /wishlists/{wishlist_id}/books/{wishlist_book_id}` exists in checked-in OpenAPI. |

Reuse `createBooksApi` inside the orchestrator hook (same pattern as add-to-wishlist using `useCreateBook` +
`useAddWishlistBook` in the UI layer, or colocate sequential calls in one mutationFn for atomic UX).

### 2. Form model

| File | Change |
| ---- | ------ |
| `src/features/wishlists/moveWishlistBookModel.ts` (new) | Form values `{ shelfId: string }`; client validation requiring non-empty `shelfId`; `shelfIdToShelfNameUpdate(shelfId, shelves)` returning `{ shelf_name }` or validation error; colocated unit tests for empty shelf, unknown id, and `removed` shelf rejection client-side. |
| `src/features/wishlists/moveWishlistBookModel.test.ts` (new) | Validation and conversion cases. |

Keep wishlist-specific move logic out of `bookEditModel` (full edit patch) and out of `wishlistFormModel` (create/add).

### 3. UI component

| File | Change |
| ---- | ------ |
| `src/features/wishlists/components/MoveWishlistBookToShelfControl.tsx` (new) | Props: `wishlistId`, `wishlistBookId`, `bookId`, `bookTitle` (for labels/confirmation), optional `disabled` when parent shelves query is not ready. Render `Field` + `<select>` of assignable shelves (Title Case labels, empty default option), primary submit button, inline error summary with focus on failure, `ConfirmationDialog` on submit. Wire `useShelves`, `useMoveWishlistBookToShelf`, validation from `moveWishlistBookModel`. Handle **412** / **404** refetch callbacks passed from parent or invoked inside via `queryClient.invalidateQueries`. On success: `navigate` to `/books/{bookId}`. Disable controls while pending. If membership is already gone but book is unshelved (partial failure retry), allow submit to call only `PATCH` -- implementer may track local `membershipRemoved` flag from prior error detail or infer from refetched membership list. |
| `src/features/wishlists/components/MoveWishlistBookToShelfControl.test.tsx` (new) | Shelf select renders assignable shelves; empty shelf blocked client-side; confirmation opens and cancel does not mutate; happy path calls orchestrator and navigates to detail; **412** / **404** messaging; pending disable; partial-failure retry path if implemented. |

Do not reuse full `BookForm` for a single shelf field -- a focused control keeps the row compact.

### 4. Wishlists page wiring

| File | Change |
| ---- | ------ |
| `src/features/wishlists/routes/WishlistsPage.tsx` | Load `useShelves` once at page level (or per `WishlistSection` if simpler). Pass shelves + shelves query status into `WishlistMembershipRow`. Extend `WishlistMembershipRow` to render `MoveWishlistBookToShelfControl` beneath the existing metadata `<dl>` (or in a footer actions region). Update page intro copy: books can be moved to a shelf individually. Update delete-wishlist dialog copy: deleting a wishlist is no longer the only way to shelve a book. |
| `src/features/wishlists/routes/WishlistsPage.test.tsx` | Assert move control appears on membership rows when shelves load; shelves failure disables move; successful move removes row after invalidation (mock orchestrator); updated copy snapshots if asserted. |

### 5. Styles

| File | Change |
| ---- | ------ |
| `src/styles/components.css` | Add minimal layout for `.wishlist-membership__move` (or similar): stack shelf select and button on narrow viewports, align with existing `.wishlist-membership` spacing; reuse shared form/select classes where possible. |

### 6. Tests, mocks, and docs hygiene

| File | Change |
| ---- | ------ |
| `e2e/support/mockApi.ts` | Implement membership DELETE and honor shelf assign after delete (update in-memory wishlist + book shelf state). Enables a future wishlist journey spec; optional in this ticket if timeboxed, but mock must stay aligned once e2e covers move. |
| `docs/AGENTS.md` | After completion: wishlists support membership remove + move-to-shelf; update "no membership remove/edit" wording; add inventory entries for new files/hooks; list FEAT-26 under completed / remove from Next. |
| `docs/ToDo.md` | Add checklist line for FEAT-26. |

## Acceptance criteria

- Each wishlist membership row on `/wishlists` shows a labelled shelf `<select>` populated from `GET /shelves`
  (assignable shelves only, Title Case labels) and a primary action to move the book to the collection.
- Submit requires an explicit shelf selection; blank shelf is blocked client-side.
- Confirmation dialog names the book and shelf before mutate.
- Mutate sequence is strictly membership `DELETE` then `PATCH /books/{id}` with `{ shelf_name }` only.
- Success navigates to `/books/{bookId}` with shelved detail; wishlist membership list no longer shows the book after
  invalidation.
- **412** on shelf assign is surfaced with honest copy and refetch; never ignored.
- **404** on either step refetches affected queries.
- **400** / **422** shelf errors map to the shelf control or form summary.
- If delete succeeds and shelf assign fails, the operator can retry shelf assignment without deleting the wishlist.
- Shelves load failure blocks move controls with recovery consistent with `NewBookPage` / `EditBookPage`.
- Controls disable while the combined mutation is pending.
- Colocated unit tests cover API helper, query orchestration, form model, component, and page wiring.
- `yarn api:check` passes after regenerating types from checked-in OpenAPI; `make check` passes.
- Stale copy about needing to delete the whole wishlist to shelve a book is removed from the wishlists UI.

## Plan coverage

Extends FEAT-19 wishlists with the natural "purchased / add to collection" exit path described in product design
notes, without expanding into acquisition-metadata prompts or collection add-from-shelf flows. Explicitly excludes
FEAT-20 through FEAT-25.
