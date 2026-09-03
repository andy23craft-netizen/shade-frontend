# API for Frontend (supplementary)

Backend **1.0.15** is the current contract (`ci/VERSION` / OpenAPI `info.version`). Album catalog CRUD, soft-delete /
restore, artist/genre catalogs, circulation (checkout / check-in / mark-played), Discogs/MusicBrainz lookup, and
private artwork get/upload/delete/refetch are shipped. Existing book, wishlist, and loan response shapes are
unchanged aside from additive album fields noted below. Full schemas and authenticated paths live in the regenerated
`openapi.json`.

Album circulation (shipped)

- Album create/read/update include `status` (`available`, `on_loan`, `display_only`), `is_played`,
  `completion_date`, and `review`. New albums default to available, not played, with null completion/review.
  PATCH omission preserves these values; null status/is_played is 422. Null completion_date/review clears them.
  Albums have no `reading`, `reserved`, or TBR automation. Played state is independent of circulation status.
- POST `/albums/{album_id}/checkout` uses the existing required `CheckoutRequest`: borrower is required (1–255
  characters); checked_out_at, due_at, notes are optional. Omitted/null checked_out_at defaults to now.
  Returns 200 AlbumRead, creates a loan with album_id set and book_id null, and sets status to on_loan.
  Display-only albums return 412 `Album is display only`; an active loan or on_loan status returns
  409 `Album is already checked out`. Use circulation endpoints to open/close loans; editing status alone
  does not create or complete loan history.
- POST `/albums/{album_id}/checkin` accepts the existing optional `CheckinRequest`; omit the body or send `{}`
  to use now, or supply returned_at. It closes the active album loan and returns 200 AlbumRead with status
  available. No active loan returns 409 `Album is not checked out`.
- POST `/albums/{album_id}/mark-played` requires a body (`{}` is valid), sets is_played=true and returns
  200 AlbumRead. Optional fields are completion_date, rating (1–5 or null), review. Omitted fields preserve
  their values, except a missing completion_date defaults to today (UTC) if none exists. Explicit null clears
  each optional field. This action never changes status or loan history. PATCH is_played=false marks unplayed.
- All three routes use existing Bearer auth (403 if unauthorized); malformed album IDs return 400, missing
  or soft-deleted albums return 404 `Album not found`. Soft-delete leaves an active loan open and keeps
  status on_loan. Restore the album before check-in; restore preserves circulation status. A book-occupied
  unknown shelf can block restore with 412 under the existing shared-shelf rule.
- GET `/loans?album_id=...` or `?media_type=album` supplies album history. The unfiltered list also includes it;
  book_id filters exclude album rows. Album times_borrowed counts all its loans, last_borrowed_at is the latest
  checkout, and average_loan_days uses returned loans only (null when none are returned). Book/dashboard
  borrowing counts remain book-only; album loans are reported by the additive `album_borrowing` object. Shelf
  placement and played state are unaffected by checkout/check-in.
- Frontend album forms and actions need these fields/endpoints when album UI ships. Existing book forms need no
  circulation-schema changes. Schema additions that require a fresh disposable dev database are not upgraded
  automatically by `make run` on an existing file.

Album behavior and frontend integration

- Authenticated album catalog routes: GET/POST `/albums`, GET/PATCH/DELETE `/albums/{album_id}`, and POST
  `/albums/{album_id}/restore`, plus lookup and artwork routes below. Create returns 201; delete returns 204;
  read/update/restore return `AlbumRead` (includes required boolean `artwork_present`).
- Create requires `title` and nonempty ordered `artist_ids`. Resolve/create artist and genre catalog records
  first. `genre_ids` and `tracks` default to empty arrays; `media_format` defaults to `unknown`
  (other values: `vinyl`, `cd`, `cassette`, `other`). Identifiers are optional; barcode has no checksum validation.
- Omit or send null `shelf_name` on create for an unshelved album. List inner-joins shelf membership and omits
  unshelved albums. Detail represents their shelf as `unknown`; that string alone cannot distinguish an
  unshelved album from actual membership on the system `unknown` shelf. Book placement fields are unchanged.
- PATCH omission preserves fields and child lists. Sending `artist_ids` replaces album credits and requires
  at least one ID. Sending `genre_ids` or `tracks` replaces the whole list; `[]` clears it. Null child lists,
  null title/media_format, and null shelf_name are 422. Optional scalar fields can be cleared with null.
  Duplicate or unresolved artist/genre IDs are 422, with field-linked details.
- Tracks require `track_number` and `title`; `disc_number` defaults to 1. Numbers must be positive and each
  disc/track pair unique. Optional `artist_ids` defaults to `[]`; duration is a string of at most 31 characters.
  Submit the entire edited track list. Replacement creates new `album_track_id` values, so clients must use
  the returned IDs. Responses order tracks by disc/track number and artists/genres by persisted position.
- GET `/albums` returns `{items, total}`. `artist`, `title`, `barcode` are substring filters; blank values
  return 400. `media_format` matches the enum exactly. Artist search matches first name/surname on either
  album or track credits, without duplicate albums; album-level matches always precede track-only matches.
  Sorts are `artist` (default, first album credit surname then first name), `title`, `releaseDate`,
  `creationDate`; `sortOrder=asc|desc` defaults to asc, with stable ascending album_id ties. Null sort values
  sort last. No shelf sort. Supply both `skip` and `take`, or neither; skip >= 0, take >= 1.
- DELETE is soft: retain the album, tracks, artists, genres, and loan history; set deletion_date, move to
  `removed`, and remove wishlist/collection memberships (compacting collection order). Default lists exclude
  deleted albums; `include_deleted=true` includes them. Detail GET includes deleted albums. PATCH or repeat
  DELETE returns 404 until restored. Restore clears deletion_date and moves to `unknown`; it does not restore
  the former shelf, wishlists, or collections. Restoring an active album returns 409.
- Shelf and collection membership is exclusive by media type, including system shelves. Restore returns 412
  if `unknown` currently contains books; the entire operation rolls back and the album remains deleted.
  Delete likewise rolls back if its system destination cannot be used. Missing lifecycle system shelves are 409.
- Existing book forms must exclude `removed` from every shelf picker (including bulk import, move, and Stash
  apply). Manual book/album placement there returns 400. GET `/shelves` remains the same array shape, with
  `removed` included. Shelf deletion returns 409 if either books or albums remain. System shelves cannot be
  created, renamed, or deleted by clients. Handle 412 by showing the server detail and preserving form input:
  `A book cannot be placed on an album shelf`, `An album cannot be placed on a book shelf`, or
  `Books cannot be added to an album collection`. Empty shelves accept either type; there is no media_type
  field on the shared shelf catalog.
- An album on a wishlist cannot be assigned a shelf (412: `The album must be removed from the wishlist before
  it can be placed on a shelf`). Album wishlist membership uses POST `/wishlists/{wishlist_id}/albums`, DELETE
  `/wishlists/{wishlist_id}/albums/{wishlist_item_id}`, and the mixed GET `/wishlists/{wishlist_id}/items`.
  Collections remain book-only at membership HTTP routes; deleting a collection clears either type of membership.
- Album reads include `times_borrowed`, `last_borrowed_at`, `average_loan_days` from album loans only, plus
  `artwork_present`. Album dashboard summary/breakdown fields and album wishlist membership routes are shipped.
  Albums never appear in GET `/books`. Album UI is needed to use the new resource; the existing book UI needs
  only the shelf/error handling adjustments above. Regenerating client types alone does not implement those
  behaviors. See [the album contract handoff](FEAT-24-frontend-handoff.md) for compatibility-only adoption of
  1.0.15 without activating album UI.

Artist/genre catalog behavior

- `/artists`: GET returns unpaginated `{items, total}`, ordered by surname, first name, then artist_id (name
  ordering is case-insensitive; null first names sort first). POST creates with 201; GET/PATCH/DELETE
  `/artists/{artist_id}` read, update, or delete. `in_use=true` restricts the list to album or track references.
  Artist records have `artist_id`, `first_name`, `surname`, `created_date`, and `updated_date`.
- Artist create requires surname, optional first_name. Both trim and allow at most 255 characters; blank
  first_name becomes null. PATCH preserves omitted fields and permits clearing first_name with null. Null/blank
  surname is 422. Duplicate artist names are allowed: identify rows by UUID, not their display name.
- `/genres`: GET returns a plain unpaginated array ordered by name, then genre_id. POST creates with 201;
  GET/PATCH/DELETE `/genres/{genre_id}` read, update, or delete. `in_use=true` lists only assigned genres.
  Records have `genre_id`, `name`, `slug`, `created_date`, and `updated_date`. POST requires name and slug;
  PATCH preserves omitted fields. Null/blank values are 422. Names trim/collapse whitespace; slugs trim/lowercase;
  both allow at most 255 characters. Slugs must be supplied; the backend does not generate them from names.
- Genre duplicate name/slug returns 409 (`Genre name already exists` / `Genre slug already exists`). Referenced
  deletion returns 409 (`Artist is referenced by one or more albums or tracks` / `Genre is assigned to one or more
  albums`). Remove memberships before deleting a referenced catalog row. Successful deletion is 204.
- Artist unresolved IDs return 404, matching authors. Genre malformed GUIDs return 400; unknown GUIDs return 404,
  matching categories. These catalogs use the existing Bearer authentication and database scope.
- Artists and genres remain distinct from authors and categories. Album forms resolve/create these rows
  and send ordered `artist_ids` / `genre_ids` to album create/update.

Regenerate clients from `openapi.json`. Album contract additions do not require activating album UI; runtime changes
are needed only when album UI ships. Coordinate deployment with the matching frontend and any required retained-data
migration.

Paths, methods, status codes, request/response schemas, and enums live in `openapi.json`. Live `/openapi.json` and
`/docs` match the running app; a drift test keeps the checked-in file equal to what the app generates.

This document covers behavior and frontend guidance that OpenAPI does not fully express. Do not duplicate schema
or route tables here. Prefer this document (and live router/detail strings) when OpenAPI is incomplete for a
shared status code, or when a schema shows null as allowed but validators reject it at runtime.

## Identifier and loan contract (shipped)

Book responses and the exact-ID query use `book_id` (not `id`); book route path parameters use `{book_id}`.
Wishlist membership reads and PATCH/DELETE paths use `wishlist_item_id` (not `wishlist_book_id`). Read models
include both nullable `book_id` and `album_id`; book-specific wishlist routes only return book rows, while the mixed
items route returns both kinds. Update frontend property access and regenerated clients together; no old-name aliases
are provided.

Loans expose exactly one non-null `book_id` / `album_id`. The loan's own identifier remains `id`. `GET /loans` accepts
`book_id`, `album_id`, and `media_type=book|album`, combined with AND semantics. Valid conflicting filters return an
empty list; unknown catalog IDs return **404**, malformed GUIDs and invalid `media_type` return **400**. Filtered
`total` uses the same predicates as `items`. Book stats and the dashboard's existing `borrowing` object exclude album
loans; album loans are reported separately by `album_borrowing`.
Wishlist membership supports both typed catalog kinds. Duplicate book or album add returns **409**; refresh membership
instead of retrying as a new add. Different wishlists may contain the same catalog item.

Fresh disposable development databases use the current schema. Existing V1 production data still requires the
separate rehearsed, data-preserving migration before deployment.

Default local base: `http://127.0.0.1:8000` (server root; no `/api` prefix)

## Auth

Protected routes use a shared secret:

Authorization: Bearer <API_SECRET_KEY>

There is no login, logout, or session system. Missing or invalid credentials return 403 with
{"detail": "Invalid authentication credentials"}.

Public routes: `GET /health`, `GET /ready`, `GET /version`, and FastAPI's generated docs/OpenAPI routes (`/docs`,
`/redoc`, `/openapi.json`, `/docs/oauth2-redirect`). Every other business route requires the Bearer token.

There is no dedicated token-verification endpoint. Use `GET /health` for startup reachability only (unauthenticated;
does not touch the database). Use `GET /ready` when the UI needs to know the database connection is usable; failure
returns **503** with `Retry-After: 1`. Use `GET /version` when the UI needs the running API release string (same value
as `ci/VERSION` and OpenAPI `info.version`); do not treat it as a health probe. Learn whether credentials are accepted
from the first protected request you need (e.g., `GET /books` or `GET /dashboard`); a **403** means the token is
missing or invalid.

## CORS

Default allowed origins are the local Vite origins http://localhost:5173 and http://127.0.0.1:5173. For a
deployed frontend, set CORS_ORIGINS to a JSON array of exact origins (scheme, hostname, and port; no path or
trailing slash), for example:

CORS_ORIGINS=["https://library.john-shade.spir.es"]

CORS does not replace authentication. The middleware handles browser preflight; frontend code should not send
OPTIONS manually. Allowed request headers include Authorization, Content-Type, and Library-Username.
Content-Disposition is exposed so download filenames are readable from JavaScript. Credentialed CORS (cookies) is
disabled. A disallowed origin can still reach the server, but browser JS cannot read the response.

Library-Username is allowed on CORS preflight today so the SPA can send it, but the backend does not yet validate
or route on that header (multi-tenant selection is planned). Sending it is harmless; omitting it does not change
current single-library behavior.

## Error and validation semantics

| Status | Meaning beyond the OpenAPI label |
| --- | --- |
| **400** | Malformed or empty GUID on book path `{book_id}` (GET / PATCH / DELETE / checkout / check-in / mark-read / cover get/upload/delete); malformed or empty GUID on album path `{album_id}` (catalog / artwork / circulation / restore); malformed or empty GUID on loan reads (`GET /loans/{id}` path, or `book_id` / `album_id` query); invalid `media_type`; malformed or empty `wishlist_id` / membership `wishlist_item_id` / membership `book_id` on wishlist routes; malformed or empty `collection_id` / `collection_book_id` / membership `book_id` on collection routes; malformed or empty `shelf_id` on shelf update/delete; empty/whitespace `isbn`, `author`, `title`, `publisher`, `acquisition_source`, or `shelf_name` on `GET /books`; blank album list filters (`artist`, `title`, `barcode`); malformed `book_id`; inverted numeric/date ranges; partial or invalid `skip`/`take` on list endpoints; invalid `sortBy` or `sortOrder` on `GET /books` or `GET /albums`; invalid or blank `field` on `GET /dashboard/incomplete-metadata/books`; unknown `shelf_name` on book/album create/update; placement onto system shelf `removed`; malformed or empty book GUID in a bulk shelf-move request; unknown destination `shelf_name` on bulk shelf move or bulk import; malformed or duplicate `category_id` on `GET /books`; malformed category, author, or genre GUID on catalog CRUD; create/rename/delete of system shelves `unknown` or `removed`, or rename to those names; combining `shelf_name` with a non-`shelved` `placement_state` on `GET /books` (`shelf_name requires shelved placement_state`) |
| **403** | Missing or invalid Bearer token |
| **404** | Book missing or already deleted on checkout / check-in / mark-read / PATCH / bulk shelf move / cover get/upload/delete / second delete / `GET /books/{book_id}`; no local cover and no usable ISBN cover fallback on `GET /books/{book_id}/cover` (`"Book cover not found"`); album missing or soft-deleted on PATCH / delete / restore / artwork / circulation (`"Album not found"`); no local album artwork on `GET /albums/{album_id}/artwork`; unknown book for `GET /loans?book_id=...`; unknown album for `GET /loans?album_id=...`; unknown loan for `GET /loans/{id}`; unknown wishlist, unknown book when adding a wishlist membership, or unknown wishlist book on remove; unknown collection, unknown book when adding a collection membership, or unknown collection book on reorder/remove; unknown shelf for PATCH / DELETE `/shelves/{shelf_id}`; unknown category, author, artist, or genre on catalog CRUD; unknown `category_id` on book create/update (`Category not found`) |
| **409** | Checkout when already on loan (book or album); check-in with no active loan (book or album); restore when the album is not soft-deleted; artwork refetch conflict when owner upload would be replaced without `replace_owner_upload`; duplicate shelf `common_name` on create/rename; delete shelf while books or albums remain; duplicate category/genre name/slug; delete category while book memberships remain; delete author while book memberships remain (`Author is referenced by one or more books`); delete artist while album/track credits remain; delete genre while album memberships remain; duplicate book or `order_num` in the same collection; duplicate book in the same wishlist; ordinary PATCH or bulk shelf move on a stashed book (`Book is stashed; use the stash apply operation`); bulk stash when a book is already stashed |
| **412** | Checkout when the book or album has `status=display_only` (`"Book is display only"` / `"Album is display only"`); add a book with any shelf membership, including `unknown`, to a wishlist (`"Existing books cannot be added to a wishlist"`); assign `shelf_name` on book create/update or bulk shelf move when the book is on any wishlist (`"The book must be removed from the wishlist before it can be placed on a shelf"`); assign `shelf_name` on album create/update when the album is on a wishlist (`"The album must be removed from the wishlist before it can be placed on a shelf"`); mixed media on a shelf or collection (`"A book cannot be placed on an album shelf"`, `"An album cannot be placed on a book shelf"`, `"Books cannot be added to an album collection"`); album soft-delete/restore when the destination system shelf is occupied by the other media type; add a stashed book to a wishlist (`"Stashed books cannot be added to a wishlist"`); bulk apply-stash to system shelf `unknown` |
| **422** | Body/query validation; invalid ISBN; invalid rating/pages; omitted mark-read or mark-played body; unsupported wishlist membership status; blank `shelf_name` on book create; JSON null `shelf_name` or `category_ids` on book update (omit those fields instead); null or blank shelf `common_name` on shelf create/update; empty or duplicate `book_ids`, or null / blank / overlong `shelf_name`, on bulk shelf move; blank collection name on create/update; non-positive `order_num` on collection add/reorder; invalid/blank category/genre name or slug; invalid/blank author or artist surname or overlong name fields; empty/duplicate `author_ids` on book create/update, or null `author_ids` on update; empty/duplicate `artist_ids` on album create/update when supplied; empty items, duplicate `client_item_id`, or more than 50 items on bulk lookup/import; per-item book payload supplying `author_ids`, `shelf_name`, or `acquisition_source` on bulk import (use request-level `shelf_name` / `acquisition_source` and per-item `authors` instead); unknown `author_ids` on book create/update (422 object detail with message `One or more authors do not exist` and `author_ids` listing missing GUIDs); cover or album-artwork upload rejected (unsupported type, empty file, over 10 MB, or bytes/type mismatch); album lookup without exactly one of `barcode` / `discogs_release_id`; wishlist membership PATCH with omitted `notes` or `{}` (send `notes` explicitly) |
| **500** | Backup dump failed, or (edge case) unhandled parse of bad stored loan timestamps |
| **502** | Metadata provider transport/5xx failure on `GET /books/lookup` or `GET /albums/lookup` (bulk book lookup uses per-item `provider_failure` with HTTP 200 instead); album artwork refetch provider failure |
| **503** | `GET /ready` or SQLAlchemy connection-pool exhaustion (`{"detail": "Database is temporarily unavailable"}` with `Retry-After: 1`) |
| **504** | Metadata provider timeout on `GET /books/lookup` or `GET /albums/lookup` (bulk book lookup uses per-item `provider_timeout` with HTTP 200 instead); album artwork refetch timeout |

Explicit API errors use string `detail`. FastAPI framework validation uses the usual detail array. Invalid ISBN
lookup is a special case: 422 with string detail because the route raises that error explicitly.

Request models ignore unknown JSON properties. Date and timestamp fields are plain strings -- the API does not
validate format, timezone, ordering, or calendar correctness. Clients should still send dates as YYYY-MM-DD and
UTC timestamps as ISO 8601 (e.g., 2026-08-08T10:00:00.000Z), because borrowing statistics parse them as datetimes.
Malformed stored loan timestamps can later cause an unhandled 500 when those statistics run.

There are no WebSocket, SSE, subscription, or push endpoints. Non-JSON binary responses today are GET /backup
(SQL attachment), GET /books/{book_id}/cover (image bytes), and GET /albums/{album_id}/artwork (image bytes). Cover
and artwork resolution, including Open Library ISBN fallback and Cover Art Archive refetch, happens server-side
behind the authenticated endpoints.

List endpoints (GET /books, GET /albums, GET /loans, GET /wishlists, GET /wishlists/{wishlist_id}/books,
GET /wishlists/{wishlist_id}/items, GET /collections, GET /collections/{collection_id}/books, and
GET /dashboard/incomplete-metadata/books) support
optional offset/limit pagination. Send both skip and take
together, or omit both for the full filtered result set. When paginated, total is still the count of all rows
matching filters (not the page size). GET /books defaults to `placement_state=shelved`, so stashed and unshelved
(wishlist-only) books are omitted unless their exact placement state is requested; item and count queries use the
same placement predicate. Partial params (skip only or take only), negative
skip, or non-positive take return 400.

GET /authors and GET /artists also return an `{ "items", "total" }` envelope but do not accept `skip` or `take`;
each returns the full catalog. Authors order by surname, first name, then `author_id`. Artists order
case-insensitively by surname, first name (null first), then `artist_id`. Optional `in_use=true` limits each list
to rows referenced by books (authors) or album/track credits (artists).

GET /shelves, GET /categories, and GET /genres are not paginated list envelopes: each returns a plain JSON array.
Book lifecycle (behavioral)

Loan status and reading status are independent of delete:

available --checkout--> on_loan --check-in--> available
unread --mark-read--> read
active --DELETE--> gone (hard delete; no restore)

DELETE /books/{book_id} is permanent. It removes the book row, dependent wishlist/collection memberships, category
links, shelf membership, book_authors rows, loan rows, and any on-disk cover file. A second delete or any read/write route for that id
returns **404** `"Book not found"`. After delete, the same catalog fields may be used to create a new book (new
`book_id`).

Delete is allowed while the book is checked out; associated loan rows are removed with the book.

Prefer dedicated endpoints over reproducing their effects with PATCH:

    checkout / check-in / mark-read / lookup / bulk lookup / bulk import / bulk shelf move / bulk stash or apply /
    cover upload or delete

PATCH bumps updated_date via a SQLite trigger when the handler does not set it explicitly (the column still
changes on successful update). Do not send null for DB-required fields such as title, is_read, or
status. Books no longer store a free-form authors field: create/update use normalized author_ids, while reads
return structured authors. Do not set covers through create/update JSON -- cover_image_path is read-only on BookRead; use
PUT / DELETE /books/{book_id}/cover. Category membership is replaced only when category_ids is present: omit
category_ids to preserve existing memberships, send [] to clear all memberships, or send a list of category
GUIDs to replace them. JSON null category_ids on update is 422 (OpenAPI may still show null as a schema
option). shelf_name must not be JSON null on update (422); omit the field to leave membership unchanged.
Assigning shelf_name on create or update returns 412
{"detail": "The book must be removed from the wishlist before it can be placed on a shelf"} when the book is on
any wishlist; remove the membership with DELETE /wishlists/{wishlist_id}/books/{wishlist_item_id} first (then
assign via PATCH or bulk shelf move). Stashed books return 409 from ordinary PATCH or bulk shelf move; use
POST /books/bulk/apply-stash instead.

Books expose `placement_state` (`shelved`, `stashed`, or `unshelved`). `shelf_name` maps to
`shelves.common_name` and is populated only for `shelved`, including the real system shelf `unknown`;
it is JSON null for `stashed` and `unshelved`. `previous_shelf_name` is populated only for a stashed book while
its source shelf still exists. Create may omit shelf_name to leave the book with no books_shelves membership (required for wishlist
add). Incoming names are trimmed then lowercased (max length 32 after trim). Unknown names return 400 on
create/update / bulk shelf move. JSON null shelf_name on create is treated as omitted. shelf_name must not be JSON null on update
(422); omit the field to leave membership unchanged. See Shelves for list and catalog CRUD behavior.

Books default to author ascending (sortBy=author, sortOrder=asc when omitted). Allowed sortBy values:
author, title, creationDate, shelf. Shelf sorting is lexical on shelves.common_name. Allowed sortOrder
values: asc, desc. Invalid values return 400. Every primary sort uses publication_date ascending as its
secondary key, regardless of the primary direction. Partial ISO dates are interpreted at their earliest date
(`YYYY` as January 1 and `YYYY-MM` as the first of that month); null, blank, and unparseable values sort after
valid dates. Book book_id ascending is the final stable tie-breaker, keeping paginated pages consistent. The previous
implicit title sort is no longer the default; pass sortBy=title when title order is required.

Authors are normalized resources rather than book-level text. Each author row has stable author_id, nullable
first_name, required surname, created_date, and updated_date. Book-author membership is stored separately and
preserves author order. BookRead.authors is therefore a structured array of author objects rather than a string.

Load/reuse authors through the authenticated author catalog:

    GET /authors -- list all authors as `{ "items": [...], "total": <int> }` (no `skip`/`take`); ordered by

    surname, first name, then `author_id`. Optional `in_use=true` returns only authors referenced by at least one book.

    POST /authors -- create an author; returns 201.

    GET /authors/{author_id} -- read one author.

    PATCH /authors/{author_id} -- partially update the author's name.

    DELETE /authors/{author_id} -- delete an unreferenced author (204); referenced authors are rejected with

    409 {"detail": "Author is referenced by one or more books"} rather than removing book-author memberships.

Book create requires author_ids with at least one author GUID. Book update replaces author membership only when
author_ids is present; omit it to preserve the current authors. author_ids may not be null, empty, or contain
duplicates. Author order in the submitted ID list is preserved in book membership and returned book data.

The author filter on GET /books remains a text search for frontend convenience, but it now searches normalized
author names (case-insensitive substring over first_name + surname via book_authors). Author sorting uses the
first-listed author's surname and then first name.

ISBN metadata lookup remains deliberately non-mutating. GET /books/lookup may return a textual draft.authors
value from the metadata provider, but that draft does not create author records. Before POST /books, the frontend
must resolve/reuse matching author records or create them with POST /authors, then submit their GUIDs as
author_ids.

Path {book_id} must be a GUID: 400 when empty or malformed (including legacy spreadsheet codes
like SL-0001); 404 when the GUID is well-formed but the book is missing or has been hard-deleted.
Deleted books return 404 on checkout, check-in, mark-read, PATCH, bulk shelf move, and cover
get/upload/delete as well as on GET /books/{book_id} and a second DELETE.

Optional filters on GET /books form one composable catalog-query surface. Different filter types use AND
semantics: a book must satisfy every supplied predicate. Filters compose with all supported
sorting modes, and skip / take pagination. No matches return an empty BookList
(items: [], total: 0), not 404. When paginated, `total` remains the full number of matching rows for the active
placement filter before pagination (item and count queries share the same placement predicate).

Text filters:

    isbn retains literal substring matching against stored isbn13 and is not normalized like create/lookup.

    author, title, publisher, and acquisition_source use case-insensitive substring matching.

    Blank or whitespace-only text filters return 400.

Exact/state filters:

    book_id matches one exact Book GUID. A malformed GUID is 400; a well-formed GUID with no matching book returns
    an empty BookList, not 404.

    shelf_name matches normalized shelf membership through books_shelves / shelves.common_name; input is trimmed
    and lowercased. An unknown but valid shelf name simply returns no matches. Requires `placement_state=shelved`
    (the default); combining `shelf_name` with `stashed` or `unshelved` returns 400.

    placement_state selects shelved (default), stashed, or unshelved books. Omit it for the default shelved catalog.

    is_read is an exact boolean filter.

    status is an exact Status enum filter; allowed values are defined by OpenAPI.

Numeric ranges are inclusive and either bound may be supplied alone:

    pages_min / pages_max

    rating_min / rating_max

    purchase_price_min / purchase_price_max

Supplying both bounds with the minimum greater than the maximum returns 400.

Publication filtering uses publication_year_min / publication_year_max. Bounds are inclusive and may be used
independently. This operates on the stored publication_date text using its leading year representation.

Date filters accept YYYY-MM-DD values and may use either bound independently:

    purchase_date_min / purchase_date_max

    completion_date_min / completion_date_max

    creation_date_min / creation_date_max

    updated_date_min / updated_date_max

Ranges are inclusive by calendar date. Invalid date syntax is FastAPI 422; an inverted range is 400.
creation_date and updated_date are stored timestamps, so their date bounds cover the requested whole calendar
day.

The following Book data is intentionally not exposed as normal GET /books filters in V1:

    notes and review are free-form prose rather than useful catalog dimensions.

    tags are currently serialized JSON in a SQLite text column; proper tag-membership filtering is not implemented
    as a JSON substring query.

    times_borrowed, last_borrowed_at, and average_loan_days are derived loan statistics rather than persisted
    Book fields.

The filters compose with each other, repeated category_id, pagination, and sorting. When
different filter types are supplied, all predicates must match. No matches return an empty BookList
(items: [], total: 0), not 404. When paginated, `total` remains the count of all matching rows for the active
placement filter before pagination.

Categories are normalized resources rather than a fixed enum. Load the available category vocabulary from
`GET /categories` (authenticated, unpaginated JSON array ordered by `name` then `category_id`; fields in
OpenAPI). Optional `in_use=true` returns only categories assigned to at least one book. Do not hard-code category
names or slugs in the frontend.

Category catalog CRUD uses the same Bearer authentication:

    POST /categories -- create a category; name and slug are required and returns 201 CategoryRead.
    Names are whitespace-normalized; slugs are trimmed and lowercased. Duplicate names or slugs return 409.

    GET /categories/{category_id} -- read one category. Malformed GUID 400; missing category 404.

    PATCH /categories/{category_id} -- partially update name and/or slug; returns 200 CategoryRead.
    Duplicate resulting name or slug returns 409.

    DELETE /categories/{category_id} -- delete an unused category (204). A category still assigned to any book
    returns 409; the API does not silently remove those memberships.

Refresh `GET /categories` after create/update/delete so category pickers and filters remain current. Books expose
their memberships through `categories`, and create/update requests assign memberships with `category_ids`.

GET /books accepts repeated category_id query parameters. One category_id requires membership in that category.
Multiple values use AND/intersection semantics: a book must belong to every requested category to match. For
example, ?category_id=<history-id>&category_id=<fiction-id> returns books assigned to both categories, not books
assigned to either category. Duplicate category IDs return 400
{"detail": "Duplicate category filter"} rather than silently deduplicating. Malformed category GUIDs return
400 ("Invalid category id"). A well-formed but unknown category ID is not an error: it simply yields no
matches (items: [], total: 0).

Category filtering composes with isbn, author, title, pagination, and sorting. When
paginated, total uses the same shelf join and category intersection predicates and remains the count of all
matching rows before pagination.

For alternate-copy lookup, use the existing isbn filter to find copies sharing an ISBN. To look for another
edition of the same work, use author and title; the API has no dedicated alternate-edition or work resource.
The frontend should exclude the current book and prefer status=available when presenting a checkout substitute.
Book covers

Cover routes are authenticated book routes. OpenAPI documents GET / PUT / DELETE /books/{book_id}/cover and the
multipart upload body; this section covers FE semantics OpenAPI does not fully express.

BookRead.cover_image_path is an optional filename (for example {book_id}.webp), not a URL and not a
browser-ready path. It is set only by successful PUT /books/{book_id}/cover and cleared by DELETE. Create/update
JSON cannot set it. A non-null cover_image_path means a local file exists for that book; null does not mean "no
cover available" -- GET /books/{book_id}/cover may still return an ISBN-derived cover fetched server-side.

PUT /books/{book_id}/cover:

    multipart form field name is file (required)

    accepted types: JPEG, PNG, WebP only (image/jpeg, image/png, image/webp); max 10 MB; empty bodies and
    bytes that do not match the declared content type are rejected with 422 (string detail)

    success returns 200 BookRead with updated cover_image_path

    replacing a cover deletes any prior on-disk file for that book (including a different extension)

    missing or deleted book → 404 "Book not found"

DELETE /books/{book_id}/cover removes on-disk files and clears cover_image_path (204). Missing or deleted
book → 404.

GET /books/{book_id}/cover response behavior:

    Local uploaded file → 200 with image bytes and matching Content-Type (image/jpeg / image/png /
    image/webp).

    No local file, but the book has isbn13 and Open Library returns a usable cover → the backend fetches the
    image server-side and returns 200 with the image bytes and matching image Content-Type.

    No usable local or ISBN-derived cover → 404 "Book cover not found".

    Missing or deleted book → 404 "Book not found".

Uploaded local covers always take priority over ISBN-derived artwork. Open Library timeout, network failure,
missing artwork, non-200 response, empty response, or non-image response is treated as an unavailable cover and
resolves to the normal 404 cover state. `GET /books/{book_id}/cover` releases its database session after reading
immutable book metadata, before file/provider work. External fetches use a shared asynchronous client,
`COVER_TIMEOUT_SECONDS` (default 3), and `COVER_MAX_CONCURRENCY` (default 5); application shutdown closes the client.

Browser display cannot put Authorization on an <img src>. Use authenticated fetch to
GET /books/{book_id}/cover:

    200 → response.blob() and an object URL for <img>

    404 → show a placeholder

Do not invent cover URLs from cover_image_path alone. The frontend must not call Open Library directly.

Recommended cover upload: FE picks an image file → PUT /books/{book_id}/cover with FormData field file and Bearer
auth → refresh book state from the returned BookRead (or re-fetch GET /books/{book_id}). On 422, surface the
string detail (type/size/mismatch). After hard delete, cover routes return 404.
Shelves

Shelves are a separate catalog resource. Book placement is membership (books_shelves), exposed to clients as
shelf_name on book create/update/read -- not as a free-form book column.

GET /shelves:

    requires Bearer authentication (same as other business routes)

    returns an unpaginated JSON array of ShelfRead objects (fields in OpenAPI), not { "items", "total" }

    includes system shelf unknown

    orders by common_name ascending, then shelf_id ascending

Write routes (same Bearer auth):

    POST /shelves -- create with required common_name (trimmed/lowercased, max 32) and optional
    location / description; returns 201 ShelfRead. Reserved names unknown and removed are 400;
    duplicate common_name is 409.

    PATCH /shelves/{shelf_id} -- update provided fields; returns 200 ShelfRead. Malformed id 400;
    missing 404. System shelves cannot be renamed (400), but location / description may change.
    Rename to a reserved name is 400; rename conflict is 409.

    DELETE /shelves/{shelf_id} -- remove an empty non-system shelf (204). System shelves 400; any
    remaining book or album membership 409 (catalog items are unchanged).

Refresh GET /shelves after create/update/delete so pickers stay current. New common_name values are
immediately assignable on book create/update via shelf_name.

For book forms: load GET /shelves, exclude removed, present common_name values, and submit the chosen name as shelf_name.
Omit shelf_name on POST /books when creating a wishlist-only catalog row (no membership). Omit shelf_name
on PATCH when membership should not change. Assigning shelf_name while the book is on any wishlist returns
412.

GET /books defaults to shelved books. Pass `placement_state=stashed` for Stash or `placement_state=unshelved` for
wishlist-style catalog rows; every existing book filter, sort, and pagination rule composes with this filter.
Combining `shelf_name` with a non-shelved placement state returns 400. GET /books/{book_id} always returns the explicit
placement fields; it no longer synthesizes `shelf_name: "unknown"` for a missing membership.

Dashboard incomplete-shelf / missing_shelf means membership on unknown. Stash is intentional placement and never
counts as missing shelf (see Dashboard below).
Bulk book movement

Use the bulk shelf-move operation documented in OpenAPI when moving an explicit frontend selection of books to one
destination shelf. Do not implement bulk movement by looping over individual PATCH /books/{book_id} requests.

Bulk movement is atomic: the API validates the destination and every selected book before changing any shelf
membership. If any selected book is missing or still belongs to a wishlist, the entire operation fails
and every selected book remains on its original shelf.

The destination uses the same shelf_name rules as ordinary book assignment: surrounding whitespace is trimmed,
letters are lowercased, the normalized value is limited to 32 characters, and unknown shelves are rejected.
The system shelf unknown remains a valid destination.

The request contains explicit book GUIDs only. Duplicate IDs are rejected rather than silently deduplicated. A
malformed GUID uses the normal Books API 400 behavior; a well-formed but missing or deleted book causes the
operation to fail with 404.

A selected book that is already on the destination shelf is valid and is still counted as successfully processed.
The successful response preserves the supplied book order, identifies the normalized destination shelf, and reports
the number of processed books.

If any selected book is on a wishlist, the operation returns 412:

{"detail": "The book must be removed from the wishlist before it can be placed on a shelf"}

The API does not remove wishlist membership automatically. The frontend should surface the failure, allow the
wishlist conflict to be resolved, and retry the bulk move when appropriate.

Stash and apply

Stash is a first-class placement state, not a shelf and not circulation status. A book may be stashed or applied in
any circulation state, including `on_loan`; the operation preserves `status` and active loan rows. Checkout and
check-in also preserve stash placement. Collections remain independent and are unchanged.

`POST /books/bulk/stash` accepts `{ "book_ids": [...] }` with 1--100 unique book GUIDs. Every selected book must
currently be shelved and not wishlisted. The atomic **200** response preserves request order and returns
`stashed_count`, `book_ids`, and `items` containing each `book_id` plus `previous_shelf_name`. A missing book is 404;
an already-stashed or otherwise unshelved book is 409; a wishlist conflict is 412. No selected book changes on error.

`GET /books?placement_state=stashed` is the Stash list. Default author sorting, other book sorts, composable filters,
and paired pagination work normally. Each item has `shelf_name: null` and its provenance in
`previous_shelf_name` (null only if the former shelf was later deleted).

`POST /books/bulk/apply-stash` accepts `{ "book_ids": [...], "shelf_name": "..." }`, also with 1--100 explicit
unique IDs. Every selected book must still be stashed. The destination must be a user shelf: the system `unknown`
shelf returns 412, and a missing shelf returns 400. Any subset may be applied without changing unselected stash rows.
The atomic **200** response preserves `book_ids` and returns `applied_count`, normalized `destination_shelf`,
`destination_preexisting_count`, and `destination_was_occupied`. Occupancy is measured before placement under the
same serialized write transaction; use the response directly for reconciliation rather than issuing a second count.

Adding a stashed book to a wishlist returns 412 `"Stashed books cannot be added to a wishlist"`. Assigning a shelf
to a stashed book through ordinary PATCH or bulk move returns 409
`"Book is stashed; use the stash apply operation"`.
Build Mode (bulk lookup and import)

Build Mode is a shelf-first high-throughput catalog workflow for onboarding a physical shelf at a time. Scan
queues, review UI, session persistence, and which rows are Ready to submit remain frontend responsibilities. The API
provides batch ISBN metadata lookup with catalog classification and per-item import onto one destination shelf.

Do not loop GET /books/lookup or POST /books when POST /books/bulk/lookup and POST /books/bulk/import cover the
same workflow. OpenAPI defines request/response schemas; this section covers FE semantics.

Choose the destination shelf before import. The bulk import request carries one shelf_name (trimmed/lowercased,
max 32) that applies to every approved item. Optional acquisition_source at the request level is applied to each
successful create or acquire_wishlist item.

POST /books/bulk/lookup:

    accepts 1--50 items, each { client_item_id, isbn }; duplicate client_item_id, empty items, or >50 items → 422

    always returns 200 with one BulkBookLookupItemResult per request item, in request order (provider failures are

    per-item, not whole-request 502/504 like GET /books/lookup)

    per-item status: found, not_found, invalid_isbn, provider_timeout, provider_failure

    found includes draft (same fields as GET /books/lookup), missing_fields among title / authors / publisher /

    publication_date / pages, normalized isbn13, catalog_state, and catalog_book_ids

    catalog_state: new (no catalog row), owned (shelved), wishlist (unshelved + on a wishlist), unshelved (catalog

    row with no shelf membership and not wishlisted), ambiguous (multiple catalog rows share the ISBN), or null when

    isbn13 could not be determined

    catalog classification runs from the local database even when metadata lookup fails (for example provider_timeout

    can still report catalog_state owned when the ISBN already exists)

POST /books/bulk/import:

    accepts shelf_name, optional acquisition_source, and 1--50 items; duplicate client_item_id, empty items, or >50

    items → 422; unknown shelf_name → 400 before any item is processed

    always returns 200 BulkBookImportResponse with submitted_count, succeeded_count, failed_count, created_count,

    wishlist_acquired_count, and one BulkBookImportItemResult per request item

    items are processed in request order with per-item savepoints: one failure does not roll back siblings

    request-level shelf_name and acquisition_source control placement and shared acquisition metadata; per-item book

    must not supply author_ids, shelf_name, or acquisition_source (validation_failed)

    each item: client_item_id, action create or acquire_wishlist, optional existing_book_id, partial book object

    create: book uses an authors array (each entry may use author_id and/or first_name + surname; missing authors

    are created), optional category_ids, and other BookCreate-compatible fields except the reserved ones above;

    rejects ISBN collisions with status already_exists and conflicting_book_ids

    acquire_wishlist: existing_book_id required; book carries optional BookUpdate-compatible fields; omitted authors

    and category_ids preserve existing memberships; removes wishlist membership and assigns the request shelf;

    stale_reference when the book is missing, already shelved, or no longer on a wishlist

    per-item status values: created, wishlist_acquired, already_exists, validation_failed, stale_reference,

    persistence_failed; inspect error_code and detail for UI messaging

    duplicate ISBN within one import request: first matching create may succeed; later create with the same ISBN

    typically returns already_exists for that item

Recommended Build Mode flow: FE selects destination shelf (and optional acquisition source) → user scans ISBNs into
a local session queue → POST /books/bulk/lookup with stable client_item_id per scan → present drafts, missing_fields,
and catalog_state (owned / wishlist / ambiguous need explicit user decisions) → user edits drafts and resolves
authors via GET /authors / POST /authors or inline author objects on import → submit only approved rows via
POST /books/bulk/import with action create for new titles or acquire_wishlist plus existing_book_id for wishlist
acquisition → refresh affected book/list/shelf queries from per-item results; leave unresolved scans in the session
for later manual work or a later import batch.
ISBN lookup and normalization

GET /books/lookup does not create or modify a book. Unknown ISBNs return 200 with found: false and
draft: null (not an error) so the UI can fall through to manual entry. The draft is editable and not persisted.

Accepted forms include ISBN-10, ISBN-13, and values with spaces or hyphens. Values are normalized to ISBN-13 when
possible. The same normalization applies to create/update isbn13. Blank ISBN on create/update is stored as null;
a blank lookup query is 422.

Current limitations:

    ISBN-13 check digits are validated; ISBN-10 check digits are not. A 10-character value with nine numeric leading
    characters is converted from those nine digits even if the ISBN-10 check digit is wrong.

    Lookup uses `METADATA_PROVIDER` (default `open_library`) with `METADATA_TIMEOUT_SECONDS` (default `3`) and optional
    `METADATA_API_KEY`. Transient timeouts, connection failures, HTTP 429, and HTTP 5xx are retried up to three total
    attempts with short backoff.

    Unexpected non-404 provider 4xx responses and malformed provider JSON are not normalized to 502 and can
    surface as unhandled 500.

Recommended add-book flow: FE captures ISBN → GET /books/lookup → editable draft → resolve the draft's textual
author names against GET /authors (create missing authors with POST /authors) → user confirms → POST /books
with ordered author_ids. Include shelf_name when placing the book in the collection. Omit shelf_name (or send
JSON null) when creating a wishlist-only catalog row, then POST /wishlists/{wishlist_id}/books. Lookup is
optional; manual create without lookup is fine, but book creation still requires normalized author_ids.

Album metadata and artwork lookup

`GET /albums/lookup` is an authenticated, non-mutating lookup. Send exactly one of `barcode` (spaces and hyphens
are ignored) or `discogs_release_id`. Discogs is preferred when `DISCOGS_TOKEN` is configured; an ordinary Discogs
miss falls through to MusicBrainz, while provider failures and timeouts return 502 and 504. Without a Discogs token,
barcode lookup uses MusicBrainz directly. Unknown releases return `200 {"found": false, "draft": null}`.
An explicit Discogs ID needs a configured token; without one there is no barcode for MusicBrainz to search.
On a Discogs hit, a best-effort MusicBrainz barcode search may enrich only the exact Release ID using format/date/label
evidence; Discogs metadata remains authoritative. MusicBrainz metadata fallback fetches the selected concrete release
to obtain tracks and labels. Each outbound call uses `METADATA_TIMEOUT_SECONDS` (default 3), not a whole-request budget.

The add-album flow is: scan barcode → lookup → resolve each textual draft artist and genre through `/artists` and
`/genres` → let the user edit the draft/tracks → submit normalized `artist_ids` and `genre_ids` to `POST /albums`.
Lookup never assigns a shelf and never persists the draft.

Album reads expose `artwork_present`. Authenticated `GET`, `PUT`, and `DELETE /albums/{album_id}/artwork` serve,
replace, and remove private local artwork. Missing artwork returns 404 `Album artwork not found`.
`POST /albums/{album_id}/artwork/refetch` uses only the album's exact MusicBrainz Release ID and an approved front
image from the Cover Art Archive. It does not use Discogs artwork. Albums without a usable MusicBrainz Release ID
return 422. Refetch preserves owner-uploaded artwork unless the JSON body explicitly sends
`{"replace_owner_upload": true}`; otherwise it returns 409 `Owner artwork replacement was not authorized`.
Deleting artwork does not clear catalog provider identifiers, so a later explicit refetch remains possible.
Uploads accept JPEG, PNG, and WebP only (10 MB maximum, with bytes/type validation). Artwork files are runtime data under
`ALBUM_ARTWORK_DIR`, isolated by configured database identity and album ID. This is a deployment/library namespace;
multi-tenant request routing is still deferred. No provider request occurs during artwork GET or DELETE.

For shelf-at-a-time onboarding, prefer POST /books/bulk/lookup followed by POST /books/bulk/import (see Build Mode
above) instead of looping single-book lookup/create.
Checkout, check-in, loans, mark-read

Checkout: only borrower is required (1-255 chars; whitespace-only is not rejected). Omitted checked_out_at
defaults to current UTC. Formats for checked_out_at / due_at / notes are not validated. Success sets book
status=on_loan and creates a Loan with returned_at=null. Borrower and checkout timestamps live only on the
loan row. `due_at` is optional legacy compatibility data: the frontend does not need to calculate or send it.
A book with status=display_only is rejected with 412
{"detail": "Book is display only"}; no loan is created and its status is unchanged. (OpenAPI may label that
412 only as "Precondition failed"; use the detail string.) The frontend may use the
isbn and/or author + title list filters to offer another copy or edition. Conflict when book status is
on_loan or an active loan already exists: {"detail": "Book is already checked out"}.

Check-in: body optional ({}, omit, or null). Omitted or explicit-null returned_at uses current UTC.
Completes the active loan and sets book status=available. Conflict is based on active loan existence, not only
book status: {"detail": "Book is not checked out"}. Missing or deleted book → 404.

Loans: `GET /loans` returns all loans (active and returned) unless `skip`/`take` paginate the result.
Default order is stored `checked_out_at` text descending, then loan `id` descending (chronological only when clients
use one consistent timestamp format). Optional filters:

    `book_id` -- limits to that book's loans; **404** when the book does not exist.

    `album_id` -- limits to that album's loans; **404** when the album does not exist.

    `media_type=book|album` -- limits to rows with a non-null `book_id` or `album_id` respectively; invalid values
    return **400**.

Filters combine with AND. Conflicting but valid combinations (for example `media_type=album` with a specific
`book_id`) can return an empty list rather than **400**. `GET /loans/{id}` returns a single loan.

For the path `{id}` and `book_id` / `album_id` query params: **400** when the value is empty or not a valid GUID;
**404** when the GUID is well-formed but unknown (book for `book_id`, album for `album_id`, loan for `{id}`). No
create/update/delete loan HTTP endpoints; loans are created by book or album checkout and completed by the matching
check-in. Active loan ⇒ `returned_at: null`. `LoanRead` includes nullable `book_id` and `album_id`.

Prefer loan reads over catalog fields for borrower and checkout timing:

    GET /loans?book_id={book_id} for a book's loans

    GET /loans?album_id={album_id} for an album's loans

    GET /loans/{id} when a specific loan id is known

Mark-read: body required but all fields optional -- send at least {} (omitted body → 422). Sets
is_read=true; uses supplied completion_date or today's UTC date when unset; applies rating / review when
supplied. Explicit null clears those fields; a cleared completion_date is not replaced with today in that
request. Missing or deleted book → 404. Album mark-played mirrors this pattern for `is_played` (see Album
circulation above).

BookRead borrow stats: times_borrowed counts loan rows; last_borrowed_at is the lexically greatest stored
checked_out_at (chronologically latest only with consistent formatting); average_loan_days uses returned loans
only (null when none).

Dashboard: GET /dashboard remains the high-level summary used for collection, borrowing, reading, and listening
widgets. Existing fields stay book-only: `total_books`, `stash_count`, `checked_out`, `read`, `unread`,
`recently_added`, `borrowing`, and `reading`. Shelved plus stashed books are owned books and contribute to those book
counts; unshelved wishlist-style rows remain excluded. `reading.books_read` / `books_unread` match top-level `read` /
`unread`.

Additive album fields are `total_albums`, `albums_checked_out`, `albums_recently_added`, `album_borrowing`, and
`listening`. `album_borrowing` has the same shape as book-only `borrowing`; `listening` contains `albums_played`,
`albums_unplayed`, and `average_rating`. Album counts include shelved, non-deleted albums only: unshelved albums and
albums soft-deleted onto `removed` are excluded. There is no album Stash. `recently_added` remains book-only while
`albums_recently_added` is album-only; both use `recent_window_days`, currently 30. Averages are null when there is
insufficient data.

GET /dashboard/breakdowns keeps `total_books`, `on_loan`, `by_category`, `by_shelf`, and `by_creation_year` book-only.
`on_loan` uses owned books whose stored status is on_loan, matching the summary's `checked_out` definition. Category
buckets are built from normalized category memberships and use category display names as keys.
A book with multiple categories contributes once to each applicable category bucket. Shelf buckets use
shelves.common_name via membership and therefore exclude Stash; `by_shelf` need not sum to `total_books` while
Stash is non-empty. Creation-year buckets are derived from creation_date. Zero-count buckets are
omitted because the response is built from existing grouped rows.

The additive album breakdown fields are `total_albums`, `albums_on_loan`, `albums_by_media_format`,
`albums_by_shelf`, and `albums_by_creation_year`. They use the same active shelved-album definition as the summary and
omit zero-count buckets. Album and book shelf/year buckets are deliberately separate and must not be combined by key.

GET /dashboard/incomplete-metadata reports cleanup counts for missing category, shelf, pages, publisher,
publication year, and ISBN among owned (shelved or stashed) books. Category is missing when a book has no category memberships.
Shelf is missing when membership is on common_name = unknown. Publisher, publication_date, and
isbn13 are missing when null or blank; pages are missing when null.
missing_year refers to publication_date, while the breakdown's creation-year chart uses creation_date.
Stashed books can count as incomplete for fields other than shelf, but never count as `missing_shelf`.
total_incomplete counts distinct owned books missing at least one tracked field and is not the sum of the
individual field counts.
Both incomplete-metadata routes remain strictly book-only. Missing album tracks are not incomplete metadata and must
not link to the book cleanup drill-down.

GET /dashboard/incomplete-metadata/books returns the full BookList / BookRead representation for owned books
missing at least one tracked field, including calculated borrow statistics. Wishlist-style unshelved books are
excluded. Optional field values are category, shelf, pages, publisher, year, and isbn. Invalid or blank
values return 400. There is no section metadata field or query value. Default order is creation_date
descending, then book id ascending. Optional skip / take pagination follows the normal paired-parameter rules,
and total remains the unpaginated matching count.
Wishlists

Wishlist routes are authenticated. There is no soft-delete for wishlists. GET /wishlists returns wishlists newest
first by created_date, then wishlist_id, both descending. One wishlist can contain both books and albums.

GET /wishlists/{wishlist_id}/items is the mixed membership list. It returns `{ items, total }`; every row contains
`wishlist_item_id`, `wishlist_id`, `created_date`, nullable `book_id` and `album_id` (exactly one non-null), plus shared
`priority`, `status`, `notes`, and `url`. It returns IDs rather than embedded catalog display data. Resolve the non-null
typed ID through its catalog endpoint when mixed UI ships. Optional `skip` / `take` and ordering match the book-only
list: priority ascending with nulls last, then creation date and membership ID ascending.

GET /wishlists/{wishlist_id}/books returns membership rows enriched with `book_title`, `book_authors`, and
`book_status`, not full `BookRead` objects. Memberships reference existing catalog books by `book_id`. The default
order is priority ascending with null priorities last, then `created_date` ascending and `wishlist_item_id` ascending.

POST /wishlists creates a wishlist. PATCH /wishlists/{wishlist_id} is partial and preserves omitted fields;
last_updated_date is bumped by a SQLite trigger when the handler does not set it. DELETE /wishlists/{wishlist_id}
permanently deletes its membership rows before deleting the wishlist itself; catalog books are not deleted.

POST /wishlists/{wishlist_id}/books adds a catalog book that has no books_shelves membership. `status`
defaults to `wanted`; allowed values are `wanted`, `ordered`, `owned`, and `dropped` (see `WishlistBookStatus` in
OpenAPI). Duplicate `(wishlist_id, book_id)` returns **409** `{"detail": "Book is already in this wishlist"}`. A book
that is already on any shelf (including system shelf `unknown`) is rejected with **412**
`{"detail": "Existing books cannot be added to a wishlist"}`. Create the catalog row with omitted
`shelf_name`, then add it to the wishlist.
PATCH /wishlists/{wishlist_id}/books/{wishlist_item_id} updates membership notes. Send a string to replace notes
or JSON null to clear them; omitting notes or sending an empty object is 422.
DELETE /wishlists/{wishlist_id}/books/{wishlist_item_id} removes one membership (204); the catalog book is
not deleted. To place a wishlisted book on a shelf, remove its membership (or delete the whole wishlist), then
assign shelf_name via PATCH /books/{book_id} or POST /books/bulk/move-to-shelf.

POST /wishlists/{wishlist_id}/albums accepts `album_id` and the same optional priority/status/notes/url fields. The
album must exist, be unshelved, and not be soft-deleted. Shelved albums (including `unknown`) return 412
`Existing albums cannot be added to a wishlist`; soft-deleted albums return 412
`Soft-deleted albums cannot be added to a wishlist`. A duplicate in that wishlist returns 409
`Album is already in this wishlist`. DELETE /wishlists/{wishlist_id}/albums/{wishlist_item_id} removes only an album
membership and never deletes the catalog album. Book-only GET/PATCH/DELETE paths continue to ignore album rows.

For path wishlist_id, membership wishlist_item_id, and membership book_id/album_id on add: 400 when empty or not a
valid GUID; 404 when the GUID is well-formed but unknown. Wrong-media and cross-wishlist membership paths return 404.
Deleting a catalog book removes all of its wishlist memberships.
Collections

Collection routes are authenticated. There is no soft-delete for collections. GET /collections returns collections
newest first by created_date, then collection_id, both descending.

GET /collections/{collection_id}/books returns membership rows enriched with shelf_name and on_wishlist, not
full BookRead objects. Memberships reference existing catalog books by book_id. The default order is order_num
ascending, then collection_book_id ascending. For unshelved catalog books, collection membership shelf_name is
JSON null (there is no books_shelves row). GET /books/{book_id} likewise returns JSON null plus an explicit
`placement_state` for stashed or unshelved books. on_wishlist is true when the book has any wishlist
membership.

Collections coexist with shelves and wishlists. Adding a shelved or wishlisted book to a collection succeeds; collection
routes do not return 412 for shelf or wishlist overlap. Wishlist/shelf mutual exclusion elsewhere is unchanged.

POST /collections creates a collection (201 CollectionRead). PATCH /collections/{collection_id} is partial and
preserves omitted fields; explicit JSON null clears description. last_updated_date is bumped by a SQLite trigger
when the handler does not set it. DELETE /collections/{collection_id} permanently deletes its membership rows before
deleting the collection itself (204); catalog books are not deleted.

POST /collections/{collection_id}/books adds a catalog book. Omit order_num to append at the end
(max(order_num) + 1, or 1 when empty). Duplicate (collection_id, book_id) returns 409
{"detail": "Book is already in this collection"}. Duplicate (collection_id, order_num) returns 409
{"detail": "Order number is already used in this collection"}.

PATCH /collections/{collection_id}/books/{collection_book_id} partially updates a membership (200
CollectionBookRead). `order_num` moves the membership and renumbers all memberships to contiguous positions;
values above the membership count are clamped to the last position. `notes` replaces membership notes, and JSON
null explicitly clears them. Omitted fields are preserved. At least one field is required, and order_num cannot
be null.

DELETE /collections/{collection_id}/books/{collection_book_id} removes one membership and renumbers remaining rows
(204).

Join membership book_id to GET /books/{book_id} for title and authors. Pagination matches wishlists (skip/take
together, { items, total } wrapper).

For path collection_id, membership collection_book_id, and membership book_id: 400 when empty or not a valid
GUID; 404 when the GUID is well-formed but unknown ("Collection not found", "Book not found", or
"Collection book not found" as appropriate). Hard-deleting a catalog book removes all of its collection
memberships and renumbers remaining rows in each affected collection.
Backup download (browser)

GET /backup returns an application/sql attachment (not JSON) of the current database contents.
Filename pattern: Shade Library - YYYY-mm-dd_HH-MM-SS_Z.sql (UTC; literal Z). Dump failure → 500 with
{"detail": "Failed to generate database backup"}.

Direct navigation cannot attach the Bearer token. Use authenticated fetch, response.blob(), and a programmatic
<a download>, copying the UTF-8 filename from Content-Disposition:

const response = await fetch(`${apiBase}/backup`, {
  headers: { Authorization: `Bearer ${apiSecretKey}` },
});

if (!response.ok) {
  throw new Error(`Backup failed with status ${response.status}`);
}

const blob = await response.blob();
const objectUrl = URL.createObjectURL(blob);
const disposition = response.headers.get("Content-Disposition") ?? "";
const encodedFilename = disposition.match(/filename\*=UTF-8''([^;]+)/)?.[1];
const link = document.createElement("a");
link.href = objectUrl;
link.download = encodedFilename
  ? decodeURIComponent(encodedFilename)
  : "Shade Library backup.sql";
document.body.appendChild(link);
link.click();
link.remove();
URL.revokeObjectURL(objectUrl);

Frontend vs API ownership
Responsibility	Owner
Barcode/camera/manual ISBN capture, editable drafts, forms, presentation	Frontend
Display of API release/version from GET /version; database readiness from GET /ready	Frontend
Shelf picker UI from GET /shelves; submit chosen common_name as shelf_name	Frontend
Category picker/filter UI from GET /categories (optional in_use=true); submit category GUIDs as category_ids	Frontend
Author picker/resolution UI from /authors (optional in_use=true); submit ordered author GUIDs as author_ids	Frontend
Category catalog management UI (create / rename / edit slug / delete unused categories)	Frontend
Author catalog management UI (create / edit / delete unreferenced authors)	Frontend
Shelf catalog management UI (create / rename / edit metadata / delete empty shelves)	Frontend
Bulk selection and Move to Shelf interaction; send explicit selected book IDs in one bulk request	Frontend
Build Mode scan queue, review UI, Ready/Problem row state, and session persistence	Frontend
Cover display via authenticated GET /books/{book_id}/cover and blob object URL	Frontend
Cover upload/delete UI (PUT/DELETE multipart file; do not PATCH cover_image_path)	Frontend
Album artwork display via authenticated GET /albums/{album_id}/artwork (when album UI ships)	Frontend
Album artwork upload/delete/refetch UI (when album UI ships)	Frontend
Artist/genre picker and resolution UI for album forms (when album UI ships)	Frontend
Wishlist list/create/add UI; create unshelved catalog rows before add-to-wishlist	Frontend
Collection list/create/add/reorder UI	Frontend
Auth, ISBN normalize/validate (ISBN-13), metadata lookup, persistence	API
Canonical project version (ci/VERSION via GET /version)	API
Hard delete (books), soft-delete/restore (albums), loan records, checkout/check-in, reading/played state	API
Shelf catalog CRUD (/shelves) and membership via shelf_name	API
Atomic bulk shelf movement, including validation of every selected book and destination	API
Build Mode bulk ISBN lookup/classification and per-item import onto a destination shelf	API
Category catalog CRUD (/categories), normalized book memberships, and category intersection filtering	API
Author catalog CRUD (/authors), ordered normalized book-author memberships, and author filtering/sorting	API
Artist/genre catalog CRUD (/artists, /genres) and ordered album memberships	API
Album metadata lookup (Discogs/MusicBrainz) and Cover Art Archive artwork refetch	API
Cover storage under COVER_DIR, cover_image_path, and server-side Open Library ISBN cover fallback	API
Album artwork storage under ALBUM_ARTWORK_DIR and artwork_present on AlbumRead	API
Wishlist/shelf mutual exclusion (412 when both would apply)	API
Collections CRUD and ordered book membership (/collections)	API
Borrowing and dashboard statistics (explicit book and album fields)	API

Recommended borrowing/returning: FE collects borrower (or selects loan/catalog item) → POST .../checkout or
POST .../checkin on the book or album route → refresh loan state via GET /loans?book_id=... or
GET /loans?album_id=... (or GET /loans/{id}) and display returned catalog status. Do not drive loan state through
generic PATCH.

Recommended shelf assignment: FE loads GET /shelves → user picks a common_name → send as shelf_name on
POST /books or PATCH /books/{book_id}. Omit shelf_name on create for a wishlist-only row. If assign returns 412
"The book must be removed from the wishlist before it can be placed on a shelf", the book still has wishlist
membership; remove that membership (or delete the wishlist), then retry. Manage the catalog with POST / PATCH /
DELETE /shelves, then refresh GET /shelves.

Recommended category management: FE loads GET /categories for the canonical vocabulary; create with
POST /categories, edit with PATCH /categories/{category_id}, and delete with
DELETE /categories/{category_id}. Refresh the category list after writes. A delete 409 means the category is
still assigned to at least one book and should remain available until those memberships are changed.

Recommended author handling: FE loads/searches GET /authors and reuses existing author IDs whenever possible.
Create a missing author with POST /authors, then submit ordered author_ids on book create/update. Edit author
identity with PATCH /authors/{author_id} so the normalized name change is reflected anywhere that author is
referenced. A delete 409 means the author is still referenced by a book; do not silently detach the author.
Unknown author_ids on book create/update return 422 with an object detail (message plus author_ids); surface
that to the user and refresh GET /authors before retrying.

Recommended bulk shelf assignment: FE maintains the explicit selected book IDs → user chooses a destination from
GET /shelves → send the entire selection in one bulk shelf-move request as defined by OpenAPI → on success,
refresh the affected book/list/shelf queries. Do not issue one PATCH /books/{book_id} per selected book.

Treat the operation as all-or-nothing. A 404 means at least one selected book is missing or deleted; a
412 with "The book must be removed from the wishlist before it can be placed on a shelf" means at least one
selected book still has wishlist membership. In either case, assume none of the selected books moved. Destination
validation follows ordinary shelf assignment: unknown is allowed, while an unknown shelf name returns 400.

Recommended Build Mode: FE selects destination shelf (and optional acquisition source) → maintain a local scan queue
with stable client_item_id values → POST /books/bulk/lookup → review drafts, missing_fields, and catalog_state →
resolve authors (GET/POST /authors or inline author objects on import) → POST /books/bulk/import with only approved
items (action create or acquire_wishlist with existing_book_id) → refresh book/list/shelf state from the response;
leave unresolved scans in the session. Do not loop GET /books/lookup or POST /books for the same batch.

Recommended wishlist add: POST /books without shelf_name → POST /wishlists/{wishlist_id}/books with
{ "book_id" }. Adding a book that already has shelf membership returns 412
"Existing books cannot be added to a wishlist". Join membership book_id to GET /books/{book_id} for title/authors
(unshelved books are omitted from GET /books items and total). Remove one membership with
DELETE /wishlists/{wishlist_id}/books/{wishlist_item_id}; delete the whole wishlist to clear all memberships at once.

Recommended collection add: POST /collections/{collection_id}/books with { "book_id" } (optional order_num and
notes). Shelved and wishlisted books may be added without 412. List memberships for shelf_name and
on_wishlist (shelf_name is null when the book is unshelved; do not expect BookRead's synthesized
"unknown" here); join book_id to GET /books/{book_id} for title/authors. Reorder with
PATCH /collections/{collection_id}/books/{collection_book_id} and { "order_num" }; remove with membership
DELETE.

Recommended cover display: authenticated fetch to GET /books/{book_id}/cover → on 200 use the returned image
blob as an object URL; on 404 show a placeholder. The backend owns local-versus-ISBN cover resolution, so the
frontend does not need to distinguish the source or call Open Library directly. Treat non-null
cover_image_path as "local file exists," not as a browser path. Upload with PUT multipart file; clear with
DELETE.
