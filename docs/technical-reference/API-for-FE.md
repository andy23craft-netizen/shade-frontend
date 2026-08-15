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

Public routes: `GET /health` and FastAPI's generated docs/OpenAPI routes (`/docs`, `/redoc`, `/openapi.json`,
`/docs/oauth2-redirect`). Every other business route requires the Bearer token.

There is no dedicated token-verification endpoint. Use `GET /health` for startup reachability only (unauthenticated).
Learn whether credentials are accepted from the first protected request you need (e.g., `GET /books` or
`GET /dashboard`); a **403** means the token is missing or invalid.

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
|        | empty/whitespace `isbn`, `author`, or `title` on `GET /books`; partial or invalid `skip`/`take` on list endpoints; |
|        | invalid `sortBy` or `sortOrder` on `GET /books`; invalid or blank `field` on |
|        | `GET /dashboard/incomplete-metadata/books` |
| `403`  | Missing or invalid Bearer token |
| `404`  | Book missing, or soft-deleted on checkout / check-in / mark-read / second delete; |
|        | unknown book for `GET /loans?book_id=...`; unknown loan for `GET /loans/{id}`; |
|        | unknown wishlist, or unknown book when adding a wishlist membership |
| `409`  | Restore an active book; checkout when already on loan; check-in with no active loan |
| `412`  | Checkout when the book has `status=display_only` |
| `422`  | Body/query validation; invalid ISBN; invalid rating/pages; omitted mark-read body; |
|        | unsupported wishlist membership `status` |
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

---

# Book lifecycle (behavioral)

Loan status and reading status are independent of soft-delete:

```text
available --checkout--> on_loan --check-in--> available
unread --mark-read--> read
active --DELETE--> soft-deleted --restore--> active
```

Soft-deleted books:

* are omitted from `GET /books` unless `include_deleted=true` (then they count in `total` too)
* remain readable via `GET /books/{id}`
* are rejected by checkout, check-in, and mark-read (**404**)
* keep loan and reading data
* still accept generic `PATCH` (including `status` / `is_read`) without creating or updating loans

Deleting an on-loan book leaves its active loan open; restore the book before check-in will complete that loan.

Prefer dedicated endpoints over reproducing their effects with `PATCH`:

* checkout / check-in / mark-read / restore / lookup

`PATCH` bumps `updated_date` via a SQLite trigger when the handler does not set it explicitly (the column still
changes on successful update). Do not send `null` for DB-required fields such as `title`, `authors`,
`category`, `shelf`, `is_read`, or `status` -- that can cause an unhandled server error on commit.

Books default to author ascending (`sortBy=author`, `sortOrder=asc` when omitted). Allowed `sortBy` values:
`author`, `title`, `creationDate`, `shelf`. Shelf sorting is lexical on the stored shelf codes. Allowed `sortOrder`
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
`POST /books`. Lookup is optional; manual create without lookup is fine.

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
Category and shelf buckets use their stored enum strings. Creation-year buckets are derived from `creation_date`.
Zero-count buckets are omitted because the response is built from existing grouped rows.

`GET /dashboard/incomplete-metadata` reports cleanup counts for missing category, shelf, pages, publisher,
publication year, and ISBN. Category and shelf are missing when their stored value is `unknown`. Publisher,
`publication_date`, and `isbn13` are missing when `null` or blank; pages are missing when `null`.
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

`POST /wishlists/{wishlist_id}/books` adds an existing catalog book to a wishlist. `status` defaults to `wanted`;
allowed values are `wanted`, `ordered`, `owned`, and `dropped` (see `WishlistBookStatus` in OpenAPI). Duplicate
`(wishlist_id, book_id)` memberships are permitted. Soft-deleted catalog books may be referenced because existence,
not active/deleted state, is the rule. The current API does not provide membership-level PATCH or DELETE endpoints.

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
| Auth, ISBN normalize/validate (ISBN-13), metadata lookup, persistence | API |
| Soft delete/restore, loan records, checkout/check-in, reading state | API |
| Borrowing and dashboard statistics | API |

Recommended borrowing/returning: FE collects borrower (or selects loan/book) → `POST .../checkout` or
`POST .../checkin` → refresh loan state via `GET /loans?book_id=...` (or `GET /loans/{id}`) and display returned
`BookRead` status. Do not drive loan state through generic `PATCH`.
