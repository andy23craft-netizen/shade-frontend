# Frontend contract handoff: backend 1.0.8

Implement the frontend changes below against the accompanying `openapi.json` from this backend revision.
Keep the current visual design and book workflows. Updating contract files or generated types alone is insufficient:
update runtime property access, API wrappers, query keys, mutations, and fixtures, then test the complete flows.

This release incorporates FEAT-16 album storage and FEAT-17 typed loans/catalog IDs. It does not ship album CRUD,
album circulation actions, or mixed wishlist UI. Do not add those screens for this compatibility update.

## Authoritative files to copy

- `docs/technical-reference/openapi.json`: complete machine-readable contract, `info.version` **1.0.8**.
- `docs/technical-reference/API-for-FE.md`: supplementary error, workflow, and release semantics.
- This handoff: required frontend implementation and verification work.

The backend agent has not changed frontend files or deployed the backend. This handoff does not certify a live
database migration. Release the frontend and backend together only after the separate V1-to-V2 migration is ready
and rehearsed. Do not let the nightly update deploy this backend alone against the current frontend or V1 database.

## Identifier changes

| Surface | Previous contract | New contract |
| --- | --- | --- |
| Every `BookRead` response | `id: string` | `book_id: string`; no `id` alias |
| Exact book-ID list filter | `GET /books?id=<uuid>` | `GET /books?book_id=<uuid>` |
| Book OpenAPI path parameter | `{id}` | `{book_id}` |
| Wishlist membership response | `wishlist_book_id: string` | `wishlist_item_id: string`; no old-name alias |
| Wishlist PATCH/DELETE membership parameter | `{wishlist_book_id}` | `{wishlist_item_id}` |
| Loan catalog reference | required non-null `book_id` | required nullable `book_id` and `album_id`; exactly one is non-null |
| Wishlist book membership references | required non-null `book_id` | required nullable `book_id` and `album_id`; current book endpoints return non-null `book_id`, null `album_id` |

Renaming a path parameter does not change the concrete URL: `/books/<uuid>` still addresses that book. The client
must obtain that UUID from `book.book_id`, not `book.id`. Do not globally rename every `id`: a loan's own PK remains
`id`, and other catalogs retain `author_id`, `category_id`, `shelf_id`, `wishlist_id`, `collection_id`, and
`collection_book_id`. A wishlist membership ID is distinct from its book ID.

Book create/update payloads retain their existing fields, author/category semantics, and placement rules. The backend
still generates the catalog UUID on create. Bulk payloads already use `book_ids` or `existing_book_id`; keep those names.
Collections remain book-only at HTTP level and continue using `collection_book_id` for membership operations.

All book responses now expose `book_id`, including list/detail/create/update, checkout/check-in, mark-read, cover
upload, and dashboard book drill-down. Other `BookRead` properties retain their existing meaning. Update frontend
selectors, navigation, React keys, bulk selection, stash, shelves, cover requests, loan joins, and cache updates.

## Wishlist membership contract

Existing routes:

| Method and path | Result |
| --- | --- |
| `GET /wishlists/{wishlist_id}/books` | `{ items: WishlistBookRead[], total: number }`; only book rows |
| `POST /wishlists/{wishlist_id}/books` | 201 `WishlistBookRead`; duplicate book in this wishlist returns 409 |
| `PATCH /wishlists/{wishlist_id}/books/{wishlist_item_id}` | Updates notes and returns `WishlistBookRead` |
| `DELETE /wishlists/{wishlist_id}/books/{wishlist_item_id}` | 204; removes the membership, not the book |

Example complete membership response (UUID values are illustrative):

```json
{
  "wishlist_item_id": "11111111-1111-4111-8111-111111111111",
  "wishlist_id": "22222222-2222-4222-8222-222222222222",
  "created_date": "2026-09-03T12:00:00.000Z",
  "book_id": "33333333-3333-4333-8333-333333333333",
  "album_id": null,
  "book_title": "Example book",
  "book_authors": [],
  "book_status": "available",
  "priority": null,
  "status": "wanted",
  "notes": null,
  "url": null
}
```

POST request fields remain `book_id`, optional `priority`, `status`, `notes`, and `url`. Membership `status` remains
`wanted | ordered | owned | dropped`, default `wanted`. PATCH requires `notes` (string or null).

Duplicate POST response:

```json
{ "detail": "Book is already in this wishlist" }
```

Treat this **409** as an existing membership; do not create an optimistic duplicate or retry indefinitely. Refresh
the affected membership list. It remains legal for a book to belong to different wishlists. A remove followed by a
fresh add creates a new membership ID. Existing 412 shelf/Stash exclusion rules still apply.

For move/acquire workflows, pass the source `wishlist_item_id` to membership deletion and the catalog `book_id` to
book operations. If a move's destination already contains the book, resolve the destination conflict explicitly;
do not delete the source membership merely because the destination POST returned 409. Preserve notes and handle
partial-failure recovery according to the existing workflow. Optimistic membership objects must use the new ID key.

## Loan reads

The loan's own `id` is unchanged. Both catalog-reference fields are present in responses:

```ts
type LoanRead = {
  id: string;
  book_id: string | null;
  album_id: string | null;
  borrower: string;
  checked_out_at: string;
  due_at?: string | null;
  notes?: string | null;
  returned_at?: string | null;
  created_date: string;
  last_updated_date: string;
};
```

Exactly one of `book_id` and `album_id` is non-null. `returned_at: null` means active. Multiple returned historical
loans are allowed; at most one active loan exists per typed book or album. Book and album IDs can coincide, so join
books only on `loan.book_id === book.book_id`. Never substitute `album_id` into a book detail/check-in URL.

`GET /loans` returns `{ items: LoanRead[], total: number }`. Supported query parameters:

| Parameter | Behavior |
| --- | --- |
| `book_id` | Book GUID; malformed/empty → 400, unknown/deleted book → 404 |
| `album_id` | Album GUID; malformed/empty → 400, unknown album → 404 |
| `media_type` | `book` or `album`; any other supplied value, including empty → 400 |
| `skip`, `take` | Existing paired pagination rules; `total` is the full filtered count |

All filters use AND. Valid conflicting filters return 200 `{ "items": [], "total": 0 }`. An existing catalog item
with no loans also returns that empty response. Default ordering remains `checked_out_at` descending, then loan
`id` descending. `GET /loans/{id}` retrieves either kind of loan. Authentication is unchanged.

Until album UI ships, request `media_type=book` for the existing book-oriented global Loans page. Per-book history
can continue to request `book_id=<uuid>`. Include the supplied filters in query/cache keys. Guard nullable references
in detail views and circulation controls even if the normal list requests are book-filtered. Album reads are supported,
but album checkout/check-in is not. Existing book checkout/check-in still returns `BookRead` and duplicate checkout
returns 409. Book dashboard and borrow-stat counts exclude album loans.

## Known frontend change locations

Read-only inspection of the current frontend found old field access in these files. This is a starting list;
search the entire frontend, including generated types, fixtures, persisted state, and optimistic objects.

- `src/api/booksQueries.ts`: detail keys and mutation cache updates use `book.id`.
- `src/features/books/utils/bulkSelectionModel.ts`: selection and selected IDs use `book.id`.
- `src/features/books/routes/BookDetailsPage.tsx`, `EditBookPage.tsx`, `ReadingEditPage.tsx`, `StashPage.tsx`:
  navigation, payloads, and identity access.
- `src/features/shelves/components/ShelfShowcase.tsx`: book keys and book actions.
- `src/features/loans/components/CheckinForm.tsx`, `CheckoutDialog.tsx`, `src/features/loans/checkinEligibility.ts`,
  `src/features/loans/routes/LoansPage.tsx`: book IDs, loan joins, cache keys, and guarded actions.
- `src/features/wishlists/routes/WishlistsPage.tsx`: membership keys and optimistic membership shape.
- `src/features/wishlists/components/MoveWishlistBookControl.tsx`: source membership ID.
- `src/api/loansQueries.ts`, `src/api/wishlistsQueries.ts` and underlying API wrappers: query parameters,
  membership operation arguments, and cache invalidation.

Local UI variables such as `bookId` can keep camelCase names. They must carry the UUID read from the new response
field. If client cache persistence is enabled, invalidate or migrate cached old-shape book/membership data during
the release so stale records do not reintroduce undefined IDs after reload.

## Frontend acceptance checks

1. Regenerate/import the 1.0.8 contract and pass TypeScript checking and the existing frontend test suite.
2. Search for old API field reads `book.id` and `wishlist_book_id`; remove them from runtime consumers and fixtures.
   Retain unrelated loan `id` and internal IDs intentionally.
3. Against a disposable 1.0.8 backend database, verify book list/detail/create/edit/delete, cover operations,
   exact-ID filtering, bulk selection, shelf moves, Stash/apply, mark-read, and navigation after mutation.
4. Verify checkout/check-in and per-book history; seed an album loan and confirm the book-only Loans page and book
   controls remain valid. Check cache keys and counts under pagination.
5. Verify wishlist add/list/edit-notes/remove, move between wishlists, and acquisition. Repeat an add and verify
   409 handling does not create a duplicate or lose source membership. Verify retry/rollback behavior.
6. Verify collection book operations still use their unchanged membership ID, and book lookups use `book_id`.
7. Verify a hard reload and any persisted cache restore use the new field shapes. Confirm no requests contain
   `/undefined`, missing UUIDs, or the retired exact-ID query parameter.
8. Coordinate the frontend release with backend 1.0.8 and the separate data migration. Updating only these contract
   documents does not satisfy this checklist or make the existing deployed frontend compatible.
