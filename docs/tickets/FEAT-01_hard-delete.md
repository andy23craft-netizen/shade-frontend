# FEAT-01 -- Hard delete (remove soft delete / restore)

**Status:** Ready

## Product refs

- `docs/technical-reference/openapi.json` (`info.version` `0.2.12`): `BookRead` no longer has `deletion_date`;
  `GET /books` no longer accepts `include_deleted`; `POST /books/{id}/restore` is removed; `DELETE /books/{id}` is a
  permanent **204** hard delete.
- `docs/technical-reference/API-for-FE.md` ("Book lifecycle"): `active --DELETE--> gone (hard delete; no restore)`.
  Hard delete removes the book row, dependent wishlist/collection memberships, category links, shelf membership, loan
  rows, and any on-disk cover file. A second delete or any read/write route for that id returns **404** `"Book not
  found"`. Delete is allowed while the book is checked out (associated loan rows are removed with the book).
- This ticket also requires:
  - A confirmation modal before every frontend-initiated delete operation.
  - Removal of the "Deleted Books" entry on `/collection/manage` and deletion of the `/admin/deleted` admin page.

## Depends on

- Backend hard-delete contract shipped and reflected in the checked-in OpenAPI / API-for-FE docs (already present in
  this repo).

## Current baseline (do not re-do)

- The SPA still models soft delete via `BookRead.deletion_date`, `GET /books?include_deleted=true`, and
  `POST /books/{id}/restore`.
- `/books/:bookId/delete` explains soft deletion and links users to Deleted Books for restore.
- `/admin/deleted` (`DeletedBooksPage`) lists soft-deleted books and restores them after confirmation.
- `/collection/manage` links to Deleted Books; `CatalogGuide` and `AppShell` nav prefixes still reference
  `/admin/deleted`.
- Several surfaces gate on `deletion_date !== null` instead of treating missing books as **404**.
- Collection add flows still handle a **412** `"Soft-deleted books cannot be added to a collection"` family that no
  longer exists in OpenAPI.
- Most resource deletes already use `ConfirmationDialog` (book delete page, shelf delete, collection delete, collection
  membership remove, wishlist delete). Cover delete (`BookCoverManager`) does not.

## Decisions (locked in this ticket)

| Topic | Choice |
|-------|--------|
| Deleted-book admin | Remove `/admin/deleted`, its route metadata, lazy import, tests, e2e journey, and all restore API/hook code. |
| `deletion_date` | Remove from fixtures, types, eligibility helpers, and UI branches. Hard-deleted books are gone (**404**). |
| Book detail for deleted id | **404** only -- no "soft-deleted but still viewable" detail state. |
| On-loan delete | Keep the existing frontend guard (do not offer delete while checked out). API allows it; `docs/AGENTS.md` says the SPA must not. |
| Delete confirmation copy | Replace soft-delete language with permanent-removal warnings on book delete. |
| Confirmation modals | Every SPA-initiated `DELETE` must pass through `ConfirmationDialog` before the mutation runs. |
| Cache invalidation | Keep `useDeleteBook` invalidating `queryKeys.collections.all` (server drops memberships on hard delete). |
| OpenAPI types | Regenerate `src/api/generated/openapi.ts` from the checked-in spec; do not hand-edit generated output. |

## Acceptance criteria

1. `yarn api:check`, `yarn typecheck`, `yarn test:coverage`, and `yarn test:e2e` pass.
2. No runtime references to `deletion_date`, `include_deleted`, `includeDeleted`, `useRestoreBook`, `booksApi.restore`,
   `/admin/deleted`, or `DeletedBooksPage`.
3. Deleting a book permanently removes it from lists and detail; revisiting its detail URL shows the existing book-not-
   found recovery UI (**404**), not a soft-deleted banner.
4. `/collection/manage` shows only Add Book and Shelves maintenance links; `/admin/deleted` is not reachable.
5. Every delete action listed in "Confirmation audit" below opens `ConfirmationDialog` before mutating.
6. `docs/AGENTS.md` is updated to describe hard delete (no restore admin) instead of soft delete/restore.

---

## Work

### 1. Regenerate API types

**`src/api/generated/openapi.ts`**

- Run `yarn api:generate` (also enforced by `yarn api:check`).
- Expect removals including: `BookRead.deletion_date`, `GET /books` `include_deleted`, `/books/{id}/restore`, and
  collection-add **412** descriptions mentioning soft-deleted books.

### 2. Books API layer

**`src/api/booksApi.ts`**

- Remove `includeDeleted` from `ListBooksOptions` and drop the `include_deleted` query param from `list`.
- Delete the `restore` method entirely.

**`src/api/booksQueries.ts`**

- Remove `includeDeleted` from `useBooks` / `useInfiniteBooks` option types and from query-key construction inputs.
- Delete `useRestoreBook`.
- Keep `useDeleteBook` calling `booksApi.remove`; confirm post-delete invalidation still covers books, detail, loans,
  dashboard, and `queryKeys.collections.all`.

**`src/api/queryKeys.ts`**

- Remove `includeDeleted` from `books.list` / `books.infiniteList` key shapes and helpers.

**`src/api/booksApi.test.ts`**

- Remove tests for `includeDeleted` / `include_deleted` query params and for `restore`.
- Keep/adjust `remove` (**DELETE**) coverage.

**`src/api/booksApi.conflicts.test.ts`**

- Remove the restore **409** propagation test (endpoint gone).

**`src/api/booksQueries.test.tsx`**

- Remove `useRestoreBook` coverage and any `includeDeleted` list-key assertions.
- Keep `useDeleteBook` invalidation tests.

**`src/api/queryKeys.test.ts`**

- Drop `includeDeleted` from expected book list keys.

**`scripts/contractSmoke.test.ts`**

- Remove `'/books/{id}/restore'` from `expectedPaths`.

### 3. Remove Deleted Books admin

**Delete these files**

- `src/features/books/routes/DeletedBooksPage.tsx`
- `src/features/books/routes/DeletedBooksPage.test.tsx`

**`src/routes/lazyRoutePages.tsx`**

- Remove the `DeletedBooksPage` lazy export.

**`src/routes/routeMetadata.ts`**

- Remove the `deletedBooks` entry (`path: '/admin/deleted'`, title, heading).

**`src/routes/routes.tsx`**

- Remove the `DeletedBooksPage` import and route child for `routeMetadata.deletedBooks`.

**`src/layout/AppShell.tsx`**

- Remove `'/admin/deleted'` from the Collection drawer `activePrefixes`.

**`src/features/collection/routes/ManageCollectionPage.tsx`**

- Remove the "Deleted Books" `AppLink` block.
- Update the page intro copy (drop "restore records").

**`src/features/about/components/CatalogGuide.tsx`**

- Remove the Administration paragraph linking to `/admin/deleted` ("restore deleted books").

### 4. Book delete flow (hard delete)

**`src/features/books/routes/DeleteBookPage.tsx`**

- Remove the `book.deletion_date !== null` branch ("already deleted" + restore pointer). A previously deleted id should
  only appear via **404** on `useBook`.
- Replace soft-delete `Alert` and `ConfirmationDialog` body copy with permanent-removal language: the book record, loans,
  memberships, categories, shelf placement, and cover file are removed and cannot be restored.
- Keep on-loan blocking UI and the existing two-step confirm pattern (page button opens dialog; dialog confirms
  mutation).
- On success, continue navigating to `/books`.

**`src/features/books/routes/DeleteBookPage.test.tsx`**

- Replace soft-delete expectation tests with hard-delete copy and behavior.
- Remove "already soft-deleted" / restore messaging cases; add/adjust **404** not-found cases instead.

**`src/features/books/routes/BookDetailsPage.tsx`**

- Remove `isDeleted` / `deletion_date` logic and the "This book has been deleted" historical-reference banner.
- `canShowActiveActions` becomes unconditional for loaded books (still respect on-loan delete guard).
- Update book-not-found copy: drop "removed rather than soft-deleted" wording; use neutral permanent-unavailable language.

**`src/features/books/routes/BookDetailsPage.test.tsx`**

- Remove soft-deleted action-gating tests; replace with **404** / not-found cases where appropriate.

### 5. Remove `deletion_date` gating elsewhere

These files branch on `deletion_date`. After hard delete, deleted books are not returned by the API -- use **404** /
`isBookIdentityError` instead of a deleted flag.

| File | Change |
|------|--------|
| `src/features/books/routes/EditBookPage.tsx` | Remove deleted-book warning branch; rely on **404** load failure. |
| `src/features/books/routes/MarkReadPage.tsx` | Same. |
| `src/features/books/routes/ReadingEditPage.tsx` | Same. |
| `src/features/loans/checkoutEligibility.ts` | Remove `deletion_date === null` predicate (lists/detail won't surface deleted rows). |
| `src/features/loans/checkinEligibility.ts` | Same. |
| `src/features/books/utils/bulkSelectionModel.ts` | Remove `deletion_date` from eligibility; all list rows are active catalog books. |
| `src/features/collections/components/CollectionMembershipRow.tsx` | Remove `book.deletion_date !== null` silent omit; keep existing error row when `useBook` fails (**404**). |
| `src/features/home/components/HomeStaffPick.tsx` | Remove deleted-book hide branch. |

Update colocated tests for each file above: drop `deletion_date` from fixtures; adjust expectations.

### 6. Collection add flows (drop soft-deleted **412**)

**`src/features/collections/components/AddCollectionBookControl.tsx`**

- Remove handling/copy for `"Soft-deleted books cannot be added to a collection"`.

**`src/features/collections/components/AddBookToCollectionDialog.tsx`**

- Same.

**`src/api/collectionsApi.test.ts`**

- Remove the soft-deleted-add **412** propagation test.

**`src/features/collections/components/AddCollectionBookControl.test.tsx`**

- Remove soft-deleted **412** scenario.

**`src/features/collections/components/AddBookToCollectionDialog.test.tsx`**

- Same.

**`src/features/collections/components/CollectionMembershipRow.test.tsx`**

- Replace "omit soft-deleted joined book" with missing-book (**404**) rendering if still relevant.

### 7. Confirmation audit (delete operations)

All SPA-initiated deletes must open `ConfirmationDialog` before the mutation.

| Operation | Location | Current | Action |
|-----------|----------|---------|--------|
| Delete book | `DeleteBookPage.tsx` | Confirmed | Update copy only (section 4). |
| Delete book cover | `BookCoverManager.tsx` | Immediate `removeCover.mutate` on button click | Add `ConfirmationDialog`; confirm label e.g. "Remove Cover"; warn that custom cover is cleared (ISBN fallback may still apply). |
| Delete shelf | `ShelvesPage.tsx` | Confirmed | No change. |
| Delete collection | `CollectionsPage.tsx` | Confirmed | No change. |
| Remove collection membership | `CollectionMembershipRow.tsx` | Confirmed | No change. |
| Delete wishlist | `WishlistsPage.tsx` | Confirmed | No change. |

**`src/features/books/components/BookCoverManager.tsx`**

- Add local `confirmOpen` state and `ConfirmationDialog` wired to `handleRemove`.
- Disable actions while `removeCover.isPending`.

**`src/features/books/components/BookCoverManager.test.tsx`**

- Add tests: no mutation before confirm; cancel closes dialog; confirm calls `useRemoveBookCover`.

There is no standalone wishlist-membership delete button today (removal happens inside `MoveWishlistBookToShelfControl`,
which already confirms). Do not add new delete surfaces in this ticket.

### 8. E2E and mock API

**`e2e/support/mockApi.ts`**

- Remove `deletion_date` from mock book shape and state transitions.
- Drop `include_deleted` filtering in `listBooks`.
- Remove the `POST /books/{id}/restore` handler.
- On `DELETE /books/{id}`, remove the book from `state.books` (and related loans/memberships if the mock models them),
  instead of setting `deletion_date`.

**`e2e/library.lifecycle.spec.ts`**

- Keep the delete-book journey through `/books/:bookId/delete` with dialog confirmation.
- Assert the book is removed from mock state (not soft-flagged).
- Remove the entire "RESTORE" section (`/admin/deleted`, restore dialog, `POST .../restore` assertion).
- Adjust any post-delete assertions that assumed a restorable soft-deleted record.

### 9. Test fixture sweep

Remove `deletion_date: null` (or non-null) from book fixtures across unit tests now that the field is gone from
`BookRead`. Grep targets include at least:

- `src/api/apiTypes.test.ts`
- `src/api/booksApi.largeLibrary.test.ts`
- `src/features/books/routes/*.test.tsx`
- `src/features/loans/**/*.test.ts(x)`
- `src/features/collections/**/*.test.tsx`
- `src/features/wishlists/**/*.test.tsx`
- `src/features/shelves/components/ShelfShowcase.test.tsx`
- `src/features/home/components/HomeStaffPick.test.tsx`
- `src/features/about/routes/AboutPage.test.tsx`
- `src/features/collection/routes/ManageCollectionPage.test.tsx`

**`src/features/collection/routes/ManageCollectionPage.test.tsx`**

- Remove assertions/link expectations for Deleted Books.

**`src/features/about/routes/AboutPage.test.tsx`**

- Remove the "restore deleted books" link expectation.

### 10. Project docs (same PR)

**`docs/AGENTS.md`**

- Replace soft delete/restore / Deleted Books admin inventory with hard delete (permanent `DELETE /books/{id}`, no
  restore route, no `/admin/deleted`).
- Remove restore from the lifecycle-endpoint table.
- Update `/collection/manage` description (Add Book + Shelves only).
- Remove `include_deleted` / `deletion_date` references in contract and test inventory sections.
- Drop collection soft-deleted **412** mentions; hard delete drops memberships server-side.
- Update e2e lifecycle bullet (delete only, no restore journey).

Do not edit `docs/technical-reference/openapi.json` or `API-for-FE.md` in this ticket -- they are already updated.

---

## Suggested implementation order

1. Regenerate OpenAPI types and strip restore / `include_deleted` from the API layer + query keys.
2. Delete Deleted Books route/page and remove navigation links.
3. Update book delete/detail/edit flows and eligibility helpers.
4. Add cover-delete confirmation; sweep collection soft-deleted **412** handling.
5. Update mocks, e2e, and unit-test fixtures; run `make check`.
6. Update `docs/AGENTS.md`.

## Out of scope

- Changing the frontend on-loan delete guard to match API permissiveness.
- Adding a wishlist-membership-only delete button.
- Browser backup admin (`/admin/backup`) -- still not a product page.
- Backend or OpenAPI doc changes.
