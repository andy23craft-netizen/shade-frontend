# Album MVP frontend handoff: backend 1.0.15

This is the authoritative frontend handoff for the additive backend work delivered by FEAT-21 through FEAT-24. It
supersedes the individual FEAT-21, FEAT-22, FEAT-23, and FEAT-24 frontend handoff files. Review this document with the
current `openapi.json` and `API-for-FE.md` before implementing album UI.

Backend 1.0.15 completes the album MVP contract. The current live, book-only frontend remains compatible without
calling album endpoints or rendering album data. Existing book routes, payloads, response fields, and URLs are
unchanged. The frontend contract is synchronized to OpenAPI 1.0.15; generated but unused album types do not activate
album functionality.

## Delivered backend contract

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

Existing book fields remain book-only. Do not combine book and album totals, borrowing statistics, shelf buckets, or
creation-year buckets. Dashboard incomplete-metadata endpoints remain book-only.

### FEAT-23: typed mixed wishlist membership (backend 1.0.14)

- `GET /wishlists/{wishlist_id}/items` returns the mixed typed membership list.
- `POST /wishlists/{wishlist_id}/albums` adds an album membership.
- `DELETE /wishlists/{wishlist_id}/albums/{wishlist_item_id}` removes an album membership.
- Existing `/wishlists/{wishlist_id}/books` routes and response shapes remain book-only and unchanged.
- The generated contract includes `WishlistAlbumCreate`, `WishlistItemRead`, and `WishlistItemList`.
- Album membership PATCH is not available. Existing book-note editing stays on its book-specific path.

When mixed wishlist UI is implemented, use `/items` rather than merging book and album list requests. Determine the
media type from the one non-null typed catalog ID and resolve display data through the corresponding catalog route.

### FEAT-24: completed album MVP contract (backend 1.0.15)

Backend 1.0.15 consolidates the complete album catalog, artwork, circulation, listening, dashboard, and wishlist
contract. It does not change existing book HTTP behavior. Collection membership HTTP remains book-only; album
collection integration is outside this contract.

## Current live-site compatibility

No runtime change or new UI is required for the book-only site:

- Keep the current book, loan, dashboard, wishlist, collection, shelf, author, and category flows.
- Continue using the book-specific wishlist endpoints.
- Continue rendering existing book-only dashboard values. Ordinary JSON parsing safely ignores the added album keys.
- Keep album, artist, and genre endpoints out of the development proxy until album UI implementation begins.
- Do not add album API exports, wrappers, query keys, routes, navigation, controls, artwork requests, or lookup calls
  as part of a compatibility release.
- Loan and wishlist rows already tolerate nullable `album_id`. The global Loans page remains filtered to books.
- React Query state remains memory-only, so stale contract objects are not restored after a hard reload.

Code that manually constructs or strictly validates dashboard objects must provide the required album values. Use
zeroes, null averages, and empty arrays in book-only fixtures. This is contract synchronization and must not affect
rendered output.

## Preconditions for album UI implementation

Before adding album UI:

1. Review backend 1.0.15 `openapi.json` and the album behavior in `API-for-FE.md`; treat those as the authoritative
   machine-readable and behavioral sources.
2. Add `/albums`, `/artists`, and `/genres` to the development proxy when the browser first needs those endpoints.
3. Implement the metadata flow as lookup, artist/genre resolution, editable draft, and explicit album creation.
4. Implement authenticated artwork reads and mutations through the backend. Do not construct browser URLs from
   private storage paths or call external artwork providers directly.
5. Keep album lifecycle actions on their dedicated checkout, check-in, mark-played, restore, and artwork endpoints.
6. Keep typed book and album identifiers distinct in loans and wishlists, even when UUID values happen to coincide.
7. Use the mixed `/items` wishlist response for mixed UI, while preserving book-specific note editing semantics.
8. Keep collections book-only unless a later backend contract explicitly adds album collection membership.
9. Add album dashboard widgets as separate album statistics and breakdowns; preserve all current book calculations and
   labels.
10. Add focused unit and browser coverage for catalog creation/editing, lookup, artwork, circulation, listening,
    dashboard, mixed wishlists, nullable typed identifiers, conflicts, stale state, and hard reloads.

## Contract synchronization and verification

When importing a later backend contract:

1. Copy the backend `docs/technical-reference/openapi.json`.
2. Regenerate `src/api/generated/openapi.ts` with `yarn api:generate`; never hand-edit generated types.
3. Export and consume album types only as their frontend features are implemented.
4. Run deterministic generated-contract comparison, TypeScript checking, lint, unit tests, browser tests, production
   build, and bundle-size enforcement.
5. Verify the current book catalog, borrowing, dashboard, wishlist, and collection screens before deployment.

## Database and deployment prerequisite

FEAT-21 adds `album_artwork` storage and related database behavior. The backend does not automatically migrate an
older database. For a disposable local environment, delete the development `.db` and rebuild it from the clean schema
before acceptance testing. For production or retained data, back up the database and apply a rehearsed,
data-preserving migration that includes the `album_artwork` table and trigger from `sql/0000-clean-schema.sql`. Run
`PRAGMA foreign_key_check` afterward. Never delete a retained or live database.

Deploy backend 1.0.15 only with the required database migration. Frontend changes cannot compensate for an older
database schema.
