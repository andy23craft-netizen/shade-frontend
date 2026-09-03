# Album MVP frontend handoff

This is the authoritative frontend handoff for album MVP work. It consolidates:

- FEAT-16 album storage and FEAT-17 typed loans and catalog IDs (backend 1.0.8)
- FEAT-21 through FEAT-24 album lookup, artwork, dashboard, mixed wishlists, and completed catalog
  contract (backend 1.0.15)

It supersedes `docs/technical-reference/FEAT-17-frontend-handoff.md` and
`docs/technical-reference/ALBUM-MVP-frontend-handoff.md`. Review this document with the current
`openapi.json` and `API-for-FE.md` before implementing album UI.

Backend 1.0.15 completes the album MVP contract. The current live, book-only frontend remains
compatible without calling album endpoints or rendering album data. Existing book routes, payloads,
response fields, and URLs are unchanged. The frontend contract is synchronized to OpenAPI 1.0.15;
generated but unused album types do not activate album functionality.

Keep the current visual design and book workflows. Updating contract files or generated types alone
is insufficient when implementing album UI: update runtime property access, API wrappers, query keys,
mutations, and fixtures, then test the complete flows.

## Authoritative files

- `docs/technical-reference/openapi.json`: complete machine-readable contract, `info.version`
  **1.0.15**.
- `docs/technical-reference/API-for-FE.md`: supplementary error, workflow, and release semantics.
- This handoff: required frontend implementation and verification work.

The backend agent has not changed frontend files. This handoff does not certify a live database
migration. Release the frontend and backend together only after the required retained-data migration
is ready and rehearsed. Do not let a nightly update deploy a newer backend alone against an older
frontend or an unmigrated database.

## Identifier and membership contract (FEAT-17; still in force)

FEAT-16 and FEAT-17 introduced typed catalog IDs and nullable loan/wishlist catalog references. They
did not ship album CRUD, album circulation actions, or mixed wishlist UI. Those screens remain out of
scope until album UI implementation begins. Do not add them as part of a book-only compatibility
update.

### Identifier changes

| Surface | Previous contract | New contract |
| --- | --- | --- |
| Every `BookRead` response | `id: string` | `book_id: string`; no `id` alias |
| Exact book-ID list filter | `GET /books?id=<uuid>` | `GET /books?book_id=<uuid>` |
| Book OpenAPI path parameter | `{id}` | `{book_id}` |
| Wishlist membership response | `wishlist_book_id: string` | `wishlist_item_id: string`; no old-name alias |
| Wishlist PATCH/DELETE membership parameter | `{wishlist_book_id}` | `{wishlist_item_id}` |
| Loan catalog reference | required non-null `book_id` | required nullable `book_id` and `album_id`; exactly one is non-null |
| Wishlist book membership references | required non-null `book_id` | required nullable `book_id` and `album_id`; current book endpoints return non-null `book_id`, null `album_id` |

Renaming a path parameter does not change the concrete URL: `/books/<uuid>` still addresses that
book. The client must obtain that UUID from `book.book_id`, not `book.id`. Do not globally rename
every `id`: a loan's own PK remains `id`, and other catalogs retain `author_id`, `category_id`,
`shelf_id`, `wishlist_id`, `collection_id`, and `collection_book_id`. A wishlist membership ID is
distinct from its book ID.

Book create/update payloads retain their existing fields, author/category semantics, and placement
rules. The backend still generates the catalog UUID on create. Bulk payloads already use `book_ids`
or `existing_book_id`; keep those names. Collections remain book-only at HTTP level and continue
using `collection_book_id` for membership operations.

All book responses expose `book_id`, including list/detail/create/update, checkout/check-in,
mark-read, cover upload, and dashboard book drill-down. Other `BookRead` properties retain their
existing meaning. Selectors, navigation, React keys, bulk selection, stash, shelves, cover requests,
loan joins, and cache updates must use `book_id`.

Local UI variables such as `bookId` can keep camelCase names. They must carry the UUID read from the
new response field. React Query state is memory-only, so a hard reload fetches the current response
shapes without a persistence migration. If client cache persistence is enabled later, invalidate or
migrate cached old-shape book/membership data so stale records do not reintroduce undefined IDs.

### Book wishlist membership

Existing book routes:

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

POST request fields remain `book_id`, optional `priority`, `status`, `notes`, and `url`. Membership
`status` remains `wanted | ordered | owned | dropped`, default `wanted`. PATCH requires `notes`
(string or null).

Duplicate POST response:

```json
{ "detail": "Book is already in this wishlist" }
```

Treat this **409** as an existing membership; do not create an optimistic duplicate or retry
indefinitely. Refresh the affected membership list. It remains legal for a book to belong to
different wishlists. A remove followed by a fresh add creates a new membership ID. Existing 412
shelf/Stash exclusion rules still apply.

For move/acquire workflows, pass the source `wishlist_item_id` to membership deletion and the catalog
`book_id` to book operations. If a move's destination already contains the book, resolve the
destination conflict explicitly; do not delete the source membership merely because the destination
POST returned 409. Preserve notes and handle partial-failure recovery according to the existing
workflow. Optimistic membership objects must use `wishlist_item_id`.

Continue using these book-specific wishlist endpoints until mixed wishlist UI is implemented.

### Loan reads

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

Exactly one of `book_id` and `album_id` is non-null. `returned_at: null` means active. Multiple
returned historical loans are allowed; at most one active loan exists per typed book or album. Book
and album IDs can coincide, so join books only on `loan.book_id === book.book_id`. Never substitute
`album_id` into a book detail/check-in URL.

`GET /loans` returns `{ items: LoanRead[], total: number }`. Supported query parameters:

| Parameter | Behavior |
| --- | --- |
| `book_id` | Book GUID; malformed/empty → 400, unknown/deleted book → 404 |
| `album_id` | Album GUID; malformed/empty → 400, unknown album → 404 |
| `media_type` | `book` or `album`; any other supplied value, including empty → 400 |
| `skip`, `take` | Existing paired pagination rules; `total` is the full filtered count |

All filters use AND. Valid conflicting filters return 200 `{ "items": [], "total": 0 }`. An existing
catalog item with no loans also returns that empty response. Default ordering remains
`checked_out_at` descending, then loan `id` descending. `GET /loans/{id}` retrieves either kind of
loan. Authentication is unchanged.

Until album UI ships, request `media_type=book` for the existing book-oriented global Loans page.
Per-book history can continue to request `book_id=<uuid>`. Include the supplied filters in
query/cache keys. Guard nullable references in detail views and circulation controls even if the
normal list requests are book-filtered. Album reads are supported, but album checkout/check-in is
not part of the book-only UI. Existing book checkout/check-in still returns `BookRead` and duplicate
checkout returns 409. Book dashboard and borrow-stat counts exclude album loans.

## Delivered album MVP contract (FEAT-21 through FEAT-24; backend 1.0.15)

### FEAT-21: metadata lookup and private artwork (backend 1.0.12)

- `AlbumRead` includes the required boolean `artwork_present`.
- `GET /albums/lookup` returns a non-persisted metadata draft sourced from Discogs or MusicBrainz.
- `GET /albums/{album_id}/artwork` serves private local artwork.
- `PUT /albums/{album_id}/artwork` uploads or replaces owner artwork.
- `DELETE /albums/{album_id}/artwork` removes owner artwork.
- `POST /albums/{album_id}/artwork/refetch` explicitly refetches Cover Art Archive artwork.

### FEAT-22: album dashboard data (backend 1.0.13)

`GET /dashboard` includes these required album fields:

- `total_albums`
- `albums_checked_out`
- `albums_recently_added`
- `album_borrowing: { active_loans, lifetime_loans, average_loan_days }`
- `listening: { albums_played, albums_unplayed, average_rating }`

`GET /dashboard/breakdowns` includes these required album fields:

- `total_albums`
- `albums_on_loan`
- `albums_by_media_format`
- `albums_by_shelf`
- `albums_by_creation_year`

Existing book fields remain book-only. Do not combine book and album totals, borrowing statistics,
shelf buckets, or creation-year buckets. Dashboard incomplete-metadata endpoints remain book-only.

### FEAT-23: typed mixed wishlist membership (backend 1.0.14)

- `GET /wishlists/{wishlist_id}/items` returns the mixed typed membership list.
- `POST /wishlists/{wishlist_id}/albums` adds an album membership.
- `DELETE /wishlists/{wishlist_id}/albums/{wishlist_item_id}` removes an album membership.
- Existing `/wishlists/{wishlist_id}/books` routes and response shapes remain book-only and unchanged.
- The generated contract includes `WishlistAlbumCreate`, `WishlistItemRead`, and `WishlistItemList`.
- Album membership PATCH is not available. Existing book-note editing stays on its book-specific path.

When mixed wishlist UI is implemented, use `/items` rather than merging book and album list requests.
Determine the media type from the one non-null typed catalog ID and resolve display data through the
corresponding catalog route.

### FEAT-24: completed album MVP contract (backend 1.0.15)

Backend 1.0.15 consolidates the complete album catalog, artwork, circulation, listening, dashboard,
and wishlist contract. It does not change existing book HTTP behavior. Collection membership HTTP
remains book-only; album collection integration is outside this contract.

## Current live-site compatibility

No runtime change or new UI is required for the book-only site:

- Keep the current book, loan, dashboard, wishlist, collection, shelf, author, and category flows.
- Continue using the book-specific wishlist endpoints.
- Continue rendering existing book-only dashboard values. Ordinary JSON parsing safely ignores the
  added album keys.
- Keep album, artist, and genre endpoints out of the development proxy until album UI implementation
  begins.
- Do not add album API exports, wrappers, query keys, routes, navigation, controls, artwork requests,
  or lookup calls as part of a compatibility release.
- Loan and wishlist rows already tolerate nullable `album_id`. The global Loans page remains filtered
  to books.
- React Query state remains memory-only, so stale contract objects are not restored after a hard
  reload.

Code that manually constructs or strictly validates dashboard objects must provide the required album
values. Use zeroes, null averages, and empty arrays in book-only fixtures. This is contract
synchronization and must not affect rendered output.

## Preconditions for album UI implementation

Before adding album UI:

1. Review backend 1.0.15 `openapi.json` and the album behavior in `API-for-FE.md`; treat those as the
   authoritative machine-readable and behavioral sources.
2. Add `/albums`, `/artists`, and `/genres` to the development proxy when the browser first needs
   those endpoints.
3. Implement the metadata flow as lookup, artist/genre resolution, editable draft, and explicit album
   creation.
4. Implement authenticated artwork reads and mutations through the backend. Do not construct browser
   URLs from private storage paths or call external artwork providers directly.
5. Keep album lifecycle actions on their dedicated checkout, check-in, mark-played, restore, and
   artwork endpoints.
6. Keep typed book and album identifiers distinct in loans and wishlists, even when UUID values happen
   to coincide.
7. Use the mixed `/items` wishlist response for mixed UI, while preserving book-specific note editing
   semantics.
8. Keep collections book-only unless a later backend contract explicitly adds album collection
   membership.
9. Add album dashboard widgets as separate album statistics and breakdowns; preserve all current book
   calculations and labels.
10. Add focused unit and browser coverage for catalog creation/editing, lookup, artwork, circulation,
    listening, dashboard, mixed wishlists, nullable typed identifiers, conflicts, stale state, and
    hard reloads.

## Known identity-sensitive frontend locations

Read-only inspection during the 1.0.8 identifier update found old field access in these files. This
is a starting list for regressions, not a complete inventory. Search the entire frontend, including
generated types, fixtures, persisted state, and optimistic objects, when changing identity or album
joins.

- `src/api/booksQueries.ts`: detail keys and mutation cache updates use `book.book_id`.
- `src/features/books/utils/bulkSelectionModel.ts`: selection and selected IDs.
- `src/features/books/routes/BookDetailsPage.tsx`, `EditBookPage.tsx`, `ReadingEditPage.tsx`,
  `StashPage.tsx`: navigation, payloads, and identity access.
- `src/features/shelves/components/ShelfShowcase.tsx`: book keys and book actions.
- `src/features/loans/components/CheckinForm.tsx`, `CheckoutDialog.tsx`,
  `src/features/loans/checkinEligibility.ts`, `src/features/loans/routes/LoansPage.tsx`: book IDs,
  loan joins, cache keys, and guarded actions.
- `src/features/wishlists/routes/WishlistsPage.tsx`: membership keys and optimistic membership shape.
- `src/features/wishlists/components/MoveWishlistBookControl.tsx`: source membership ID.
- `src/api/loansQueries.ts`, `src/api/wishlistsQueries.ts` and underlying API wrappers: query
  parameters, membership operation arguments, and cache invalidation.

Search for retired API field reads `book.id` and `wishlist_book_id` in runtime consumers and
fixtures. Retain unrelated loan `id` and internal IDs intentionally.

## Contract synchronization and verification

When importing a later backend contract:

1. Copy the backend `docs/technical-reference/openapi.json`.
2. Regenerate `src/api/generated/openapi.ts` with `yarn api:generate`; never hand-edit generated
   types.
3. Export and consume album types only as their frontend features are implemented.
4. Run deterministic generated-contract comparison, TypeScript checking, lint, unit tests, browser
   tests, production build, and bundle-size enforcement.
5. Verify the current book catalog, borrowing, dashboard, wishlist, and collection screens before
   deployment.

## Frontend acceptance checks

Book-only compatibility (already required against the typed-ID contract):

1. Import the current contract and pass TypeScript checking and the existing frontend test suite.
2. Confirm runtime consumers and fixtures use `book_id` and `wishlist_item_id`, not retired
   `book.id` / `wishlist_book_id`.
3. Against a disposable current-backend database, verify book list/detail/create/edit/delete, cover
   operations, exact-ID filtering, bulk selection, shelf moves, Stash/apply, mark-read, and
   navigation after mutation.
4. Verify checkout/check-in and per-book history; seed an album loan and confirm the book-only Loans
   page and book controls remain valid. Check cache keys and counts under pagination.
5. Verify wishlist add/list/edit-notes/remove, move between wishlists, and acquisition. Repeat an add
   and verify 409 handling does not create a duplicate or lose source membership. Verify
   retry/rollback behavior.
6. Verify collection book operations still use their unchanged membership ID, and book lookups use
   `book_id`.
7. Verify a hard reload uses the current field shapes. Confirm no requests contain `/undefined`,
   missing UUIDs, or the retired exact-ID query parameter `?id=`.
8. Coordinate any frontend release with the matching backend version and the separate data
   migration. Updating only these contract documents does not satisfy this checklist.

Album UI (required only when those screens are implemented): follow the preconditions above plus
focused coverage for lookup, artwork, circulation, listening, album dashboard widgets, mixed
wishlists, and typed-identifier conflicts.

## Database and deployment prerequisite

FEAT-21 adds `album_artwork` storage and related database behavior. The backend does not
automatically migrate an older database. For a disposable local environment, delete the development
`.db` and rebuild it from the clean schema before acceptance testing. For production or retained
data, back up the database and apply a rehearsed, data-preserving migration that includes the
`album_artwork` table and trigger from `sql/0000-clean-schema.sql`. Run `PRAGMA foreign_key_check`
afterward. Never delete a retained or live database.

Deploy backend 1.0.15 only with the required database migration. Frontend changes cannot compensate
for an older database schema.
