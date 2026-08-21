# FEAT-28 -- Collections follow-up: edit collections and add from Book Details

## Objective

Finish the two small Collections interactions intentionally left outside FEAT-27:

1. allow an existing collection's name and description to be edited after creation; and
2. allow the current catalog book to be added directly to a chosen collection from Book Details.

Keep `/collections` as the primary collection-management surface. Book Details should provide a focused membership
action, not duplicate the full Collections UI.

## Dependencies

- FEAT-27 Curated Collections is complete (ticket file removed). Reuse its API/query/component architecture.
- Checked-in `docs/technical-reference/openapi.json` and `docs/technical-reference/API-for-FE.md` document
  `PATCH /collections/{collection_id}` (partial update; explicit JSON `null` clears `description`) and
  `POST /collections/{collection_id}/books` (add existing active catalog book; **409** duplicate; **412** soft-deleted).
- Collection membership remains orthogonal to shelf and wishlist placement.
- Reuse shared form/error patterns, React Query invalidation, and Book Details action patterns (`CheckoutDialog` is the
  closest dialog precedent on detail).

## Contract references

- `../technical-reference/openapi.json` -- `CollectionUpdate` (`name`, `description`; both nullable); membership create
  with `{ book_id }` and optional `notes` / `order_num`.
- `../technical-reference/API-for-FE.md` -- `PATCH` preserves omitted fields; explicit `null` clears `description`;
  collection add does not return **412** for shelf/wishlist overlap; soft-deleted add is **412**
  `"Soft-deleted books cannot be added to a collection"`; duplicate book is **409**
  `"Book is already in this collection"`.

Do not invent frontend-only request shapes if the running backend contract differs; record drift as a blocker.

## Product decisions

### Edit existing collection

On `/collections`, provide a clear Edit action for each existing collection (`CollectionSection` header today only
offers Delete).

The edit flow must support:

- changing the collection name;
- changing the description;
- clearing an existing description via explicit JSON `null` (API-supported);
- cancelling without mutation;
- Field-linked validation and pending/error states consistent with `CreateCollectionForm`.

Editing a collection must not alter membership ordering or membership contents.

### Add current Book Details book to a collection

On `/books/:bookId`, provide an **Add to Collection** action for the current active book (alongside the existing
`book-details-actions` nav: Edit, Check Out/In, Mark Read / Edit Reading, Delete).

The focused flow should:

- load collections via `useCollections`;
- require the user to choose a target collection;
- allow optional membership `notes` (`CollectionBookCreate` supports it);
- submit the current `bookId` via `useAddCollectionBook` (no catalog search, no `POST /books`);
- surface duplicate **409** clearly and non-destructively;
- surface soft-deleted **412** honestly and refresh relevant book/collection queries;
- leave shelf, wishlist, reading, and circulation state unchanged.

If no collections exist, show a useful empty state with a link to `/collections` rather than a dead selector.

Do not confuse this with wishlist move-to-shelf copy that says "Add to Collection" on
`MoveWishlistBookToShelfControl` (that shelves a wishlisted book into the physical library).

## Current baseline (already shipped; extend, do not rebuild)

| Area | Location |
| ---- | -------- |
| Collections API | `src/api/collectionsApi.ts` (`update`, `addBook`, …) |
| Query hooks | `src/api/collectionsQueries.ts` -- `useUpdateCollection` invalidates `queryKeys.collections.all`; `useAddCollectionBook` invalidates `queryKeys.collections.books(collectionId)` |
| Request pickers | `pickCollectionUpdate` / `pickCollectionBookCreate` in `src/api/requestFields.ts` (null `description` is preserved) |
| Create form model | `src/features/collections/collectionFormModel.ts` -- create + add-from-search only; **no** edit helpers yet |
| Collections page | `src/features/collections/routes/CollectionsPage.tsx` -- create, delete, add-via-search, reorder/remove; **no** Edit UI |
| Book Details | `src/features/books/routes/BookDetailsPage.tsx` -- active-book actions nav + `CheckoutDialog`; **no** add-to-collection |
| Styles | `.collection-card*` / `.collections-page*` in `src/styles/components.css`; `.book-details-actions` for detail actions |

## Remaining scope

| Area | Change |
| ---- | ------ |
| `collectionFormModel.ts` (+ tests) | Edit form values, init from `CollectionRead`, validation, `formValuesToCollectionUpdate` (omit unchanged fields or send partial patch; blank description → `null` when clearing). |
| `CollectionsPage.tsx` (+ tests) | Edit action per collection; focused edit form/dialog using `useUpdateCollection`; cancel leaves data unchanged; Field-linked **422**. |
| Book Details (+ tests) | **Add to Collection** control/dialog: collection picker, optional notes, `useAddCollectionBook` with current `book.id`; empty-collections link to `/collections`; **409** / **412** / pending handling. Prefer a colocated component under `src/features/collections/components/` or `src/features/books/` matching existing detail-dialog style. |
| Styles | Minimal responsive styles for edit and detail add flows; reuse shared form/dialog/button classes. |

No new collections API methods or query keys are required unless a follow-on surface needs them.

## Acceptance criteria

- An existing collection can be renamed from `/collections`.
- An existing collection description can be changed and cleared (explicit `null`).
- Cancelling collection edit leaves the original collection unchanged.
- Edit validation and backend validation errors use existing accessible form patterns.
- Book Details exposes **Add to Collection** for an active book.
- The Book Details flow uses the current book ID directly (no redundant catalog search or book create).
- A user can choose a collection, optionally enter membership notes, and add the current book successfully.
- Duplicate membership produces a clear non-destructive **409** message.
- A stale soft-deleted add failure surfaces **412** honestly and refreshes relevant queries.
- Adding the book to a collection does not modify shelf, wishlist membership, reading state, circulation state, or other
  catalog metadata.
- No-collection state provides a useful path to `/collections`.
- Controls are keyboard accessible, manage focus consistently with shared dialogs/forms, and remain usable at 320 px.
- Existing FEAT-27 create/delete/reorder/remove/add-via-search behavior remains green.
- `make check` passes.

## Out of scope

- Creating, renaming, merging, or deleting taxonomy categories.
- Editing membership notes after membership creation (membership `PATCH` only documents `order_num` today).
- Bulk add-to-collection.
- Drag-and-drop collection ordering.
- Featured collections on Home / Discover.
- Listing "collections this book belongs to" on Book Details (optional later; not required here).
- Removing collection membership from Book Details.
- Moving a collection membership to a shelf; Collections and shelf placement remain independent.
- Wishlist move-to-shelf / "Add to Collection" shelving copy on `/wishlists`.
