# API for Frontend (supplementary)

Paths, methods, status codes, request/response schemas, and enums live in `docs/openapi.json`
(regenerate with `make openapi`). Live `/openapi.json` and `/docs` match the running app; a drift test keeps the
checked-in file equal to what the app generates.

This document covers behavior and frontend guidance that OpenAPI does not fully express. Do not duplicate schema
or route tables here.

**Default local base:** `http://127.0.0.1:8000` (server root; no `/api` prefix)

---

# Auth

Protected routes use a shared secret:

```http
Authorization: Bearer <API_SECRET_KEY>
```

There is no login, logout, or session system. Missing or invalid credentials return **403** with
`{"detail": "Invalid authentication credentials"}`.

Public routes: `GET /health`, `GET /version`, and FastAPI's generated docs/OpenAPI routes (`/docs`, `/redoc`,
`/openapi.json`, `/docs/oauth2-redirect`). Every other business route requires the Bearer token.

There is no dedicated token-verification endpoint. Use `GET /health` for startup reachability only (unauthenticated).
Use `GET /version` when the UI needs the running API release string (same value as `ci/VERSION` and OpenAPI
`info.version`); do not treat it as a health probe. Learn whether credentials are accepted from the first protected
request you need (e.g., `GET /books` or `GET /dashboard`); a **403** means the token is missing or invalid.

---

# CORS

Default allowed origins are the local Vite origins `http://localhost:5173` and `http://127.0.0.1:5173`. For a
deployed frontend, set `CORS_ORIGINS` to a JSON array of exact origins (scheme, hostname, and port; no path or
trailing slash), for example:

```dotenv
CORS_ORIGINS=["https://library.john-shade.spir.es"]
```

CORS does not replace authentication. The middleware handles browser preflight; frontend code should not send
`OPTIONS` manually. `Authorization` and `Content-Type` may be sent cross-origin. `Content-Disposition` is exposed
so download filenames are readable from JavaScript. Credentialed CORS (cookies) is disabled. A disallowed origin
can still reach the server, but browser JS cannot read the response.

---

# Error and validation semantics

| Status | Meaning beyond the OpenAPI label |
| ------ | -------------------------------- |
| `400`  | Malformed or empty GUID on loan reads (`GET /loans/{id}` path, or `book_id` query); |
|        | malformed or empty `wishlist_id` / membership `book_id` on wishlist routes; |
|        | malformed or empty `shelf_id` on shelf update/delete; |
|        | empty/whitespace `isbn`, `author`, or `title` on `GET /books`; |
|        | partial or invalid `skip`/`take` on list endpoints; |
|        | invalid `sortBy` or `sortOrder` on `GET /books`; invalid or blank `field` on |
|        | `GET /dashboard/incomplete-metadata/books`; unknown `shelf_name` on book create/update; |
|        | `shelf_name` that normalizes to `removed` on book create/update; |
|        | create/rename/delete of system shelves `unknown` / `removed`, or rename to those names |
| `403`  | Missing or invalid Bearer token |
| `404`  | Book missing, or soft-deleted on checkout / check-in / mark-read / `PATCH` / second delete; |
|        | unknown book for `GET /loans?book_id=...`; unknown loan for `GET /loans/{id}`; |
|        | unknown wishlist, or unknown book when adding a wishlist membership; |
|        | unknown shelf for `PATCH` / `DELETE /shelves/{shelf_id}` |
| `409`  | Restore an active book; checkout when already on loan; check-in with no active loan; |
|        | duplicate shelf `common_name` on create/rename; delete shelf while books remain |
| `412`  | Checkout when the book has `status=display_only` (`"Book is display only"`); |
|        | add a book with any shelf membership, including `unknown` / `removed`, to a wishlist |
|        | (`"Existing books cannot be added to a wishlist"`); |
|        | assign `shelf_name` on book create/update when the book is on any wishlist |
|        | (`"The book must be removed from the wishlist before it can be placed on a shelf"`) |
| `422`  | Body/query validation; invalid ISBN; invalid rating/pages; omitted mark-read body; |
|        | unsupported wishlist membership `status`; blank `shelf_name` on book create; |
|        | null or blank `shelf_name` on book update; |
|        | null or blank shelf `common_name` on shelf create/update |
| `500`  | Backup dump failed, or (edge case) unhandled parse of bad stored loan timestamps |
| `502`  | ISBN metadata provider transport/`5xx` failure |
| `504`  | ISBN metadata provider timeout |

Explicit API errors use string `detail`. FastAPI framework validation uses the usual `detail` array. Invalid ISBN
lookup is a special case: **422** with string `detail` because the route raises that error explicitly.

Request models ignore unknown JSON properties. Date and timestamp fields are plain strings -- the API does not
validate format, timezone, ordering, or calendar correctness. Clients should still send dates as `YYYY-MM-DD` and
UTC timestamps as ISO 8601 (e.g., `2026-08-08T10:00:00.000Z`), because borrowing statistics parse them as datetimes.
Malformed stored loan timestamps can later cause an unhandled **500** when those statistics run.

There are no WebSocket, SSE, subscription, or push endpoints. `GET /backup` is the only streaming response (a finite
SQL attachment).

List endpoints (`GET /books`, `GET /loans`, `GET /wishlists`, `GET /wishlists/{wishlist_id}/books`, and
`GET /dashboard/incomplete-metadata/books`) support optional offset/limit pagination. Send both `skip` and `take`
together, or omit both for the full filtered result set. When paginated, `total` is still the count of all rows
matching filters (not the page size). Partial params (`skip` only or `take` only), negative `skip`, or non-positive
`take` return **400**.

`GET /shelves` is **not** a paginated list envelope: it returns a plain JSON array (see Shelves below).

---

# Book lifecycle (behavioral)

Loan status and reading status are independent of soft-delete:

```text
available --checkout--> on_loan --check-in--> available
unread --mark-read--> read
active --DELETE--> soft-deleted --restore--> active
```

Soft-deleted books:

* set `deletion_date` on delete; restore clears `deletion_date`
* are omitted from `GET /books` unless `include_deleted=true` (then they count in `total` too)
* remain readable via `GET /books/{id}` (including `shelf_name` of `removed` and a non-null `deletion_date`)
* are rejected by checkout, check-in, mark-read, and `PATCH` (**404**)
* keep loan and reading data
* have shelf membership moved to the system shelf `removed` on delete; restore moves membership to `unknown`
  (the pre-delete shelf is not restored)

Deleting an on-loan book leaves its active loan open; restore the book before check-in will complete that loan.

Prefer dedicated endpoints over reproducing their effects with `PATCH`:

* checkout / check-in / mark-read / restore / lookup

`PATCH` bumps `updated_date` via a SQLite trigger when the handler does not set it explicitly (the column still
changes on successful update). Do not send `null` for DB-required fields such as `title`, `authors`,
`category`, `is_read`, or `status`. `shelf_name` must not be JSON `null` on update (**422**); omit the field to leave
membership unchanged. Assigning `shelf_name` on create or update returns **412**
`{"detail": "The book must be removed from the wishlist before it can be placed on a shelf"}` when the book is on
any wishlist; delete the wishlist first (there is no membership-level DELETE).

Books use `shelf_name` (maps to `shelves.common_name`), not a hard-coded shelf enum and not a book-level `shelf`
column. Create may omit `shelf_name` to leave the book with no `books_shelves` membership (required for wishlist
add). Incoming names are trimmed then lowercased (max length 32 after trim). Unknown names and names that
normalize to `removed` return **400** on create/update -- only `DELETE /books/{id}` assigns `removed`. JSON `null`
`shelf_name` on create is treated as omitted. `shelf_name` must not be JSON `null` on update (**422**); omit the
field to leave membership unchanged. See Shelves for list and catalog CRUD behavior.

Books default to author ascending (`sortBy=author`, `sortOrder=asc` when omitted). Allowed `sortBy` values:
`author`, `title`, `creationDate`, `shelf`. Shelf sorting is lexical on `shelves.common_name`. Allowed `sortOrder`
values: `asc`, `desc`. Invalid values return **400**. A stable tie-breaker on book `id` keeps paginated pages
consistent. The previous implicit title sort is no longer the default; pass `sortBy=title` when title order is
required.

Path `{id}` accepts any string and returns **404** when no row matches.

Optional `isbn`, `author`, and `title` on `GET /books` support catalog lookup. `isbn` retains its existing literal
substring match against stored `isbn13` and is not normalized like create/lookup. `author` and `title` use
case-insensitive substring matching. Empty or whitespace-only values for any of these filters return **400**.

The filters compose with each other, `category`, `include_deleted`, pagination, and sorting. When multiple filters
are supplied, all predicates must match. No matches return an empty `BookList` (`items: []`, `total: 0`), not
**404**. When paginated, `total` remains the count of all matching rows before pagination.

For alternate-copy lookup, use the existing `isbn` filter to find copies sharing an ISBN. To look for another
edition of the same work, use `author` and `title`; the API has no dedicated alternate-edition or work resource.
The frontend should exclude the current book and prefer `status=available` when presenting a checkout substitute.

Optional `category` on `GET /books` filters by exact `Category` enum value. This is the API surface used when the
frontend needs to narrow the catalog by collection/category; there is no separate `collection` query parameter.
Invalid category values are rejected by FastAPI validation with **422**. A valid category with no matches returns
an empty `BookList` (`items: []`, `total: 0`), not **404**. The category filter composes with `isbn`, `author`,
`title`, `include_deleted`, pagination, and sorting; when paginated, `total` remains the count of all matching rows
before pagination.

---

# Shelves

Shelves are a separate catalog resource. Book placement is membership (`books_shelves`), exposed to clients as
`shelf_name` on book create/update/read -- not as a free-form book column.

`GET /shelves`:

* requires Bearer authentication (same as other business routes)
* returns an unpaginated JSON **array** of `ShelfRead` objects (fields in OpenAPI), not `{ "items", "total" }`
* includes system shelves `unknown` and `removed`
* orders by `common_name` ascending, then `shelf_id` ascending

Write routes (same Bearer auth):

* `POST /shelves` -- create with required `common_name` (trimmed/lowercased, max 32) and optional
  `location` / `description`; returns **201** `ShelfRead`. Reserved names `unknown` / `removed` are **400**;
  duplicate `common_name` is **409**.
* `PATCH /shelves/{shelf_id}` -- update provided fields; returns **200** `ShelfRead`. Malformed id **400**;
  missing **404**. System shelves cannot be renamed (**400**), but `location` / `description` may change.
  Rename to a reserved name is **400**; rename conflict is **409**.
* `DELETE /shelves/{shelf_id}` -- remove an empty non-system shelf (**204**). System shelves **400**; any
  remaining book membership **409** (books are unchanged).

Refresh `GET /shelves` after create/update/delete so pickers stay current. New `common_name` values are
immediately assignable on book create/update via `shelf_name`.

For book forms: load `GET /shelves`, present `common_name` values (exclude `removed` for create/update), and
submit the chosen name as `shelf_name`. Omit `shelf_name` on `POST /books` when creating a wishlist-only catalog
row (no membership). Omit `shelf_name` on `PATCH` when membership should not change. Assigning `shelf_name` while
the book is on any wishlist returns **412**. After soft-delete, expect `shelf_name: "removed"` and a non-null
`deletion_date`; after restore, expect `shelf_name: "unknown"` and `deletion_date: null`.

`GET /books` inner-joins shelf membership, so unshelved (wishlist-only) books are omitted from the list. Fetch them
with `GET /books/{id}` (response `shelf_name` is `unknown` when membership is missing).

Dashboard incomplete-shelf / `missing_shelf` means membership on `unknown` (not `removed`).

---

# ISBN lookup and normalization

`GET /books/lookup` does not create or modify a book. Unknown ISBNs return **200** with `found: false` and
`draft: null` (not an error) so the UI can fall through to manual entry. The draft is editable and not persisted.

Accepted forms include ISBN-10, ISBN-13, and values with spaces or hyphens. Values are normalized to ISBN-13 when
possible. The same normalization applies to create/update `isbn13`. Blank ISBN on create/update is stored as `null`;
a blank lookup query is **422**.

Current limitations:

* ISBN-13 check digits are validated; ISBN-10 check digits are not. A 10-character value with nine numeric leading
  characters is converted from those nine digits even if the ISBN-10 check digit is wrong.
* Metadata provider / timeout / API-key settings exist in config but are not wired to this route; lookup always uses
  Open Library with a three-second timeout.
* Unexpected non-404 provider `4xx` responses and malformed provider JSON are not normalized to **502** and can
  surface as unhandled **500**.

Recommended add-book flow: FE captures ISBN → `GET /books/lookup` → editable draft → user confirms →
`POST /books`. Include `shelf_name` when placing the book in the collection. Omit `shelf_name` (or send JSON
`null`) when creating a wishlist-only catalog row, then `POST /wishlists/{wishlist_id}/books`. Lookup is optional;
manual create without lookup is fine.

---

# Checkout, check-in, loans, mark-read

**Checkout:** only `borrower` is required (1-255 chars; whitespace-only is not rejected). Omitted `checked_out_at`
defaults to current UTC. Formats for `checked_out_at` / `due_at` / `notes` are not validated. Success sets book
`status=on_loan` and creates a `Loan` with `returned_at=null`. Borrower and checkout timestamps live only on the
loan row. A book with `status=display_only` is rejected with **412**
`{"detail": "Book is display only"}`; no loan is created and its status is unchanged. The frontend may use the
`isbn` and/or `author` + `title` list filters to offer another copy or edition. Conflict when book `status` is
`on_loan` or an active loan already exists: `{"detail": "Book is already checked out"}`.

**Check-in:** body optional (`{}`, omit, or `null`). Omitted or explicit-null `returned_at` uses current UTC.
Completes the active loan and sets book `status=available`. Conflict is based on active loan existence, not only
book `status`: `{"detail": "Book is not checked out"}`. Soft-deleted or missing book → **404**.

**Loans:** `GET /loans` returns all loans (active and returned), including loans for soft-deleted books, unless
`skip`/`take` paginate the result. Default order is stored `checked_out_at` text descending, then loan `id` descending
(chronological only when clients use one consistent timestamp format). Optional `book_id` filters to that book's loans
(including soft-deleted books; empty list when the book exists but has no loans). `GET /loans/{id}` returns a single
loan.
For both the path `{id}` and the `book_id` query param: **400** when the value is empty or not a valid GUID;
**404** when the GUID is well-formed but unknown (book for `book_id`, loan for `{id}`). No create/update/delete
loan HTTP endpoints; loans are created by checkout and completed by check-in. Active loan ⇒ `returned_at: null`.

Prefer loan reads over book fields for borrower and checkout timing:

* `GET /loans?book_id={id}` for a book's loans
* `GET /loans/{id}` when a specific loan id is known

**Mark-read:** body required but all fields optional -- send at least `{}` (omitted body → **422**). Sets
`is_read=true`; uses supplied `completion_date` or today's UTC date when unset; applies `rating` / `review` when
supplied. Explicit `null` clears those fields; a cleared `completion_date` is not replaced with today in that
request. Soft-deleted or missing book → **404**.

**BookRead borrow stats:** `times_borrowed` counts loan rows; `last_borrowed_at` is the lexically greatest stored
`checked_out_at` (chronologically latest only with consistent formatting); `average_loan_days` uses returned loans
only (`null` when none).

**Dashboard:** `GET /dashboard` remains the high-level summary used for collection, borrowing, and reading widgets.
Soft-deleted books are excluded from all dashboard counts; loan metrics use only loans tied to non-deleted books.
Averages are `null` when there is insufficient data. `recent_window_days` is currently `30`.
`reading.books_read` / `books_unread` match top-level `read` / `unread`.

`GET /dashboard/breakdowns` provides active-catalog totals plus counts by category, shelf, and creation year.
`on_loan` uses active books whose stored `status` is `on_loan`, matching the summary's `checked_out` definition.
Category buckets use stored category strings. Shelf buckets use `shelves.common_name` via membership. Creation-year
buckets are derived from `creation_date`. Zero-count buckets are omitted because the response is built from existing
grouped rows.

`GET /dashboard/incomplete-metadata` reports cleanup counts for missing category, shelf, pages, publisher,
publication year, and ISBN. Category is missing when stored as `unknown`. Shelf is missing when membership is on
`common_name = unknown` (not `removed`). Publisher, `publication_date`, and `isbn13` are missing when `null` or blank;
pages are missing when `null`.
`missing_year` refers to `publication_date`, while the breakdown's creation-year chart uses `creation_date`.
`total_incomplete` counts distinct active books missing at least one tracked field and is not the sum of the
individual field counts.

`GET /dashboard/incomplete-metadata/books` returns the full `BookList` / `BookRead` representation for books
missing at least one tracked field, including calculated borrow statistics. Soft-deleted books are excluded.
Optional `field` values are `category`, `shelf`, `pages`, `publisher`, `year`, and `isbn`. Invalid or blank values
return **400**. There is no `section` metadata field or query value. Default order is `creation_date` descending,
then book `id` ascending. Optional `skip` / `take` pagination follows the normal paired-parameter rules, and
`total` remains the unpaginated matching count.

---

# Wishlists

Wishlist routes are authenticated. There is no soft-delete for wishlists. `GET /wishlists` returns wishlists newest
first by `created_date`, then `wishlist_id`, both descending.

`GET /wishlists/{wishlist_id}/books` returns membership rows, not full `BookRead` objects. Memberships reference
existing catalog books by `book_id`. The default order is priority ascending with `null` priorities last, then
`created_date` ascending and `wishlist_book_id` ascending.

`POST /wishlists` creates a wishlist. `PATCH /wishlists/{wishlist_id}` is partial and preserves omitted fields;
`last_updated_date` is bumped by a SQLite trigger when the handler does not set it. `DELETE /wishlists/{wishlist_id}`
permanently deletes its membership rows before deleting the wishlist itself; catalog books are not deleted.

`POST /wishlists/{wishlist_id}/books` adds a catalog book that has **no** `books_shelves` membership. `status`
defaults to `wanted`; allowed values are `wanted`, `ordered`, `owned`, and `dropped` (see `WishlistBookStatus` in
OpenAPI). Duplicate `(wishlist_id, book_id)` memberships are permitted. A book that is already on any shelf
(including system shelves `unknown` and `removed`) is rejected with **412**
`{"detail": "Existing books cannot be added to a wishlist"}`. Create the catalog row with omitted `shelf_name`, then
add it to the wishlist. Soft-deleted books cannot be added because delete moves them to `removed`. The current API
does not provide membership-level PATCH or DELETE endpoints; to place a wishlisted book on a shelf, delete the
wishlist first, then `PATCH` `shelf_name`.

For path `wishlist_id` and membership `book_id`: **400** when empty or not a valid GUID; **404** when the GUID is
well-formed but unknown.

---

# Backup download (browser)

`GET /backup` returns an `application/sql` attachment (not JSON), including soft-deleted books and historical loans.
Filename pattern: `Shade Library - YYYY-mm-dd_HH-MM-SS_Z.sql` (UTC; literal `Z`). Dump failure → **500** with
`{"detail": "Failed to generate database backup"}`.

Direct navigation cannot attach the Bearer token. Use authenticated `fetch`, `response.blob()`, and a programmatic
`<a download>`, copying the UTF-8 filename from `Content-Disposition`:

```javascript
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
```

---

# Frontend vs API ownership

| Responsibility | Owner |
| -------------- | ----- |
| Barcode/camera/manual ISBN capture, editable drafts, forms, presentation | Frontend |
| Display of API release/version from `GET /version` | Frontend |
| Shelf picker UI from `GET /shelves`; submit chosen `common_name` as `shelf_name` | Frontend |
| Shelf catalog management UI (create / rename / edit metadata / delete empty shelves) | Frontend |
| Wishlist list/create/add UI; create unshelved catalog rows before add-to-wishlist | Frontend |
| Auth, ISBN normalize/validate (ISBN-13), metadata lookup, persistence | API |
| Canonical project version (`ci/VERSION` via `GET /version`) | API |
| Soft delete/restore, loan records, checkout/check-in, reading state | API |
| Shelf catalog CRUD (`/shelves`) and book membership via `shelf_name` | API |
| Wishlist/shelf mutual exclusion (**412** when both would apply) | API |
| Borrowing and dashboard statistics | API |

Recommended borrowing/returning: FE collects borrower (or selects loan/book) → `POST .../checkout` or
`POST .../checkin` → refresh loan state via `GET /loans?book_id=...` (or `GET /loans/{id}`) and display returned
`BookRead` status. Do not drive loan state through generic `PATCH`.

Recommended shelf assignment: FE loads `GET /shelves` → user picks a `common_name` (not `removed` for create/update)
→ send as `shelf_name` on `POST /books` or `PATCH /books/{id}`. Omit `shelf_name` on create for a wishlist-only
row. If assign returns **412** `"The book must be removed from the wishlist before it can be placed on a shelf"`,
the book is still on a wishlist; delete that wishlist before placing it on a shelf. Manage the catalog with
`POST` / `PATCH` / `DELETE /shelves`, then refresh `GET /shelves`. After delete/restore, re-read the book (or list)
for updated `shelf_name` and `deletion_date`; do not assume the prior shelf is restored.

Recommended wishlist add: `POST /books` without `shelf_name` → `POST /wishlists/{wishlist_id}/books` with
`{ "book_id" }`. Adding a book that already has shelf membership returns **412**
`"Existing books cannot be added to a wishlist"`. Join membership `book_id` to `GET /books/{id}` for title/authors
(unshelved books are omitted from `GET /books`). Do not invent membership remove/edit; delete the wishlist to
clear memberships.
