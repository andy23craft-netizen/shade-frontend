# Shade Frontend -- Master Implementation Context

Slim always-on context for ChatGPT or any assistant without direct repository access.

This document is the complete self-contained operating baseline for the Shade frontend. It covers working rules,
architecture, non-negotiables, current product state, the backend contract summary, and the minimum reference index
needed to continue development safely. Start from this file alone for that baseline -- do not require a second project
context file. Attach the current feature ticket (when one exists) and the checked-in API contract only when the task
needs them.

A current sequenced feature ticket, when one exists, is supplied separately. Do not assume this document replaces the
ticket or the checked-in API contract. Informal UI feedback notes under `docs/tickets/` are not sequenced build
tickets -- treat them as notes unless the user asks to implement items from them. When no ticket is supplied, check
`docs/tickets/` for open sequenced work (currently FEAT-01, OCR catalog search). Ask which work to take next rather
than inventing a follow-on feature.

**Context pack version:** 2026-09-11
**Backend contract:** checked-in OpenAPI `info.version` **1.3.0** (LibraryV2). `API-for-FE.md` may still say
**1.2.8** in places -- prefer OpenAPI when versions disagree and treat prose drift as a docs blocker, not new FE
semantics.
**Frontend package:** currently **1.9.9**

**Current QR project:** Book and album QR generation and browser print flows are shipped. Labels encode only
deterministic, tenant-free payloads (`shade:v1:book:<book_id>` / `shade:v1:album:<album_id>`) and are generated
locally with `qr-code-styling` (`src/features/books/labelQrOptions.ts`). `/books/labels` and `/albums/labels` print
the conventional 3 x 3 inch, two-by-three US Letter template, with selected/all-catalog batches and a starting sheet
position. Room Loans pages use `CatalogCodeResolver` against authenticated `POST /catalog/resolve-code` with the
active media type; unique Shade copies open their existing item flow and commercial multi-copy results require an
explicit choice. It does not locally infer tenant identity or decode UUIDs. Physical printer stock, Lexmark alignment,
supported-phone scans, camera/hardware behavior, and re-arm review remain open review work.

---

## 0. Context pack recipe

Load only what the task needs.

Always:

- this Master Implementation Context;
- the current feature ticket, when one exists.

If work touches API behavior:

- `docs/technical-reference/openapi.json`;
- `docs/technical-reference/API-for-FE.md`;
- running backend `/openapi.json` when drift verification is useful.

If UI/design is in question:

- `docs/product-docs/UI_DESIGN_NOTES.MD`;
- `docs/product-docs/UI_DESIGN_NOTES.ALBUM_ANALOGIES.md` when Listening Room / album UI work is in scope.

If repository contents are not visible:

- request only the minimum exact files / command output needed.

If deployment / packaging is involved:

- `README.md`.

Do not paste a full API re-synthesis or large requirements documents into every conversation. Prefer the checked-in
contract and the minimum relevant source files.

---

# 1. Repository visibility and authority

ChatGPT does not automatically have access to the repository.

This context is a dated baseline. It does not prove that a specific source file still has exactly the shape described
here.

Unless the relevant current file or command output is available:

- do not pretend to have inspected it;
- do not invent current implementation details;
- do not assume a planned file exists;
- do not tell the user to edit unseen code when its current contents matter;
- ask for the minimum repository evidence required to continue safely.

When files are needed, give a concise **What I need from you** list with:

- exact paths;
- why each file is needed;
- whether the entire file or a section is enough;
- exact terminal commands when command output is better than a file.

Do not request the whole repository.

## Authority order

When sources disagree:

1. Current repository contents supplied in the conversation
2. Current feature ticket / explicit user requirement
3. Running backend OpenAPI and observed backend behavior
4. `docs/technical-reference/openapi.json`
5. `docs/technical-reference/API-for-FE.md`
6. This context
7. Older plans / historical docs

Explain discrepancies rather than silently forcing an older plan onto the current codebase.

---

# 2. Working style

The user is a junior software engineer working under senior guidance.

Prefer:

**what we're doing → why → exact code → what it does → how to test it**

Provide:

- exact file paths;
- complete copy/pasteable snippets;
- explicit "add this after X" / "replace Y with Z" instructions;
- complete contents when creating a new file;
- exact terminal commands;
- expected results;
- manageable implementation steps.

Do not say "update the component accordingly."

Avoid unnecessary theory, but explain architectural decisions and relevant React / TypeScript / API / testing /
accessibility concepts.

If multiple approaches are reasonable, explain the tradeoff and recommend one.

Do not silently expand the scope of the current ticket.

---

# 3. Project one-pager

**Repository:** `shade-frontend`

**Purpose:** Browser UI for the Shade home-library FastAPI backend.

## Stack

- React 19
- TypeScript 6 strict
- Vite 8
- React Router 7
- TanStack React Query 5
- generated OpenAPI TypeScript types
- Yarn 4 / Corepack
- Node.js 26.7.0
- ESLint flat config
- Vitest + Testing Library + jsdom
- Playwright + axe
- plain CSS with project design tokens
- `qr-code-styling` for book/album QR labels
- native ESM

No Next.js, Tailwind, component library, Redux/alternate state store, or form library.

## Backend

Separate FastAPI repository.

Default local URL:

```text
http://127.0.0.1:8000
```

No `/api` prefix.

Authoritative frontend contract:

```text
docs/technical-reference/openapi.json
docs/technical-reference/API-for-FE.md
```

Checked-in OpenAPI is LibraryV2 with `info.version` currently **1.3.0**. Existing book, wishlist, and loan response
shapes remain stable aside from additive fields and the people/contributor reshape. Shipped surfaces include:

- Book `book_id` (no `id` alias), shared `/people` catalog (SPA `authorsApi` / `artistsApi`; no `/authors` or
  `/artists` routes), book role lists (`author_ids` required; optional `illustrator_ids` / `editor_ids` /
  `translator_ids`), many-to-many categories, expanded `GET /books` filters (including `placement_state`), bulk book
  routes (move-to-shelf, lookup/import, stash/apply-stash, availability), mark-unread, book covers, and hard delete.
- Typed loans (`book_id` / `album_id`, `media_type`, `feedback_present`), loan borrower `PATCH`, returned-loan
  feedback (`PUT` / `DELETE /loans/{id}/feedback`), and paginated book/album borrower-review lists.
- Wishlist `wishlist_item_id`, mixed wishlist `/items`, typed book and album membership routes, and atomic album
  wishlist `move-to-shelf`.
- Album catalog CRUD with **permanent** delete (no album restore), genres, lookup, artwork get/upload/delete/refetch,
  circulation (checkout / check-in / mark-played), bulk lookup/import, collection membership, album `person_ids`, and
  additive album dashboard fields.
- Hostname-scoped multi-tenant routing (`X-Forwarded-Host`, with `shade` remapped to tenant `andy`).
- `/library` setup and settings (`enable_loans`, book TBR shelf IDs, reserved shelf).
- `/quotes` tenant Home quote library (list/create/update/delete/reorder/restore-defaults).
- `/works` identity corrections (read / merge / split / reassign).
- `/catalog/resolve-code`, `/catalog/recent-additions`, and `/catalog/search-image` (OCR catalog search).
- Additive read fields: `work_id`, `borrower_rating`, `isbn_not_applicable`, album `artwork_present`, plus album
  dashboard/loan fields. Book reads expose `BookPersonRead[]` role lists with `person_id`.

Cover and artwork resolution -- including Open Library ISBN fallback and Cover Art Archive refetch -- happens
server-side. `GET /books/{book_id}/cover` and `GET /albums/{album_id}/artwork` return **200** image bytes or **404**.
There is no separate backend handoff document: OpenAPI plus `API-for-FE.md` are the contract. Regenerating client types
does not implement UI; follow the active ticket when extending product surfaces.

Identifier and loan rules:

- Book responses and exact-ID list filter use `book_id`. Path parameters use `{book_id}`; the URL is still
  `/books/<uuid>`.
- Wishlist membership reads and typed membership PATCH/DELETE use `wishlist_item_id`.
- Loans keep their own `id`. Exactly one of `book_id` / `album_id` is non-null. Reading-room Loans request
  `media_type=book`; listening-room Loans request `media_type=album`. Never put `album_id` into a book detail or
  check-in URL (or the reverse).
- Book and album check-in **require** `CheckinRequest.rating` (integer 1--5). Check-in records initial returned-loan
  feedback atomically. Owner catalog `rating`/`review` and borrower feedback are separate.
- Duplicate wishlist add is **409**; refresh membership instead of retrying as a new add.

Shared shelf / placement / availability rules:

- Exclude `removed` from every placement picker. Surface mixed-media **412** detail without inventing a shelf
  `media_type` field: `A book cannot be placed on an album shelf`, `An album cannot be placed on a book shelf`,
  `Books cannot be added to an album collection`, `Albums cannot be added to a book collection`.
- Shelf delete **409** applies when books or albums remain.
- Books expose `placement_state` (`shelved` default list, `stashed`, `unshelved`). `GET /books/{book_id}` no longer
  synthesizes `shelf_name: "unknown"` for missing membership. Albums do not support `stashed`.
- When `enable_loans=false`, new book and album checkouts return **412** `Loans are disabled for this library`.
- Checkout of `reserved` or `reading` books requires `availability_override=true`; `display_only` is never overridable.
- Deploy with matching backend **1.3.0** and any rehearsed retained-data migration; the frontend cannot compensate for
  an older database schema.

Tenant and media storage (shipped; do not invent alternatives):

- The trusted reverse proxy (or Vite `SHADE_API_PROXY`) sets `X-Forwarded-Host`; browser JS must not send that header or
  `Library-Username`. Missing/unknown host context returns **400** `Invalid or unknown library host`; an empty header
  returns **400** `X-Forwarded-Host must be a non-empty string`. Auth failures take precedence on protected routes.
- Book covers live under `data/covers-for-books/<username>/`; album artwork under
  `data/covers-for-albums/<username>/<album_id>/` (relative to `DB_DIR`). Tenant username comes from hostname routing.
- Album barcode lookup falls through Discogs miss **and** Discogs failures/timeouts to MusicBrainz; explicit Discogs
  release IDs have no MusicBrainz substitute (**502** / **504**). Artwork refetch uses Cover Art Archive front images
  only (never Discogs artwork). Behavioral detail lives in `API-for-FE.md`.

Optional same-origin Vite proxy (`SHADE_API_PROXY=1`) forwards the current API surface, including `/health`, `/ready`,
catalog routes, album/people/genre routes, library/quotes/works/catalog routes, and API documentation. It derives
`X-Forwarded-Host` from the browser host (defaults bare local origins to `andy.localhost`) and excludes the removed
browser backup route. Tenant identity remains owned by the proxy rather than the browser.

Generated types:

```text
src/api/generated/openapi.ts
```

Regenerate generated types from the checked-in OpenAPI contract (`yarn api:generate` / `yarn api:check`); never edit
them manually. Album/people/genre/library/work/quote aliases may already be exported from `src/api/apiTypes.ts` when
product code needs them. Do not combine book and album dashboard totals; keep Reading Dashboard book-only and Listening
Dashboard album-oriented.

Prefer dedicated lifecycle endpoints over generic `PATCH` for checkout, check-in, initial mark-read, mark-unread
(API exists; no product UI yet), mark-played, availability, bulk shelf move, bulk stash/apply-stash, cover
upload/delete, and album artwork upload/delete/refetch.

---

# 4. Current product baseline

The application uses dedicated product pages (not route placeholders). The live shell is room-based: Home chooses
Reading Room or Listening Room; shared Manage / Collections / Wishlists act as hallway spaces.

## Routes

Current registered product routes include:

```text
/                              Home (room chooser + mixed-media discovery)
/about                         About (library information)
/reading-room                  Reading Room landing
/listening-room                Listening Room landing
/reading-room/dashboard        Reading Dashboard (legacy /dashboard redirects here)
/listening-room/dashboard      Listening Dashboard
/reading-room/loans            Book loans (legacy /loans redirects here)
/listening-room/loans          Album loans
/books                         Book Browse
/books/category/:categorySlug  Books browse path alias
/books/shelf/:shelfToken       Books browse path alias
/books/new
/books/bulk-add
/books/labels
/books/:bookId
/books/:bookId/edit
/books/:bookId/delete
/books/:bookId/mark-read
/books/:bookId/reading
/albums                        Album Browse
/albums/new
/albums/bulk-add
/albums/labels
/albums/:albumId
/albums/:albumId/edit
/stash                         Book Stash
/catalog/image-search          OCR catalog image search (FEAT-01)
/collection/manage             Manage (hallway)
/collections
/wishlists
/quotes                        Quote Library
/shelves
/library/setup
/library/settings
/checkout                      compatibility redirect
/checkin                       compatibility redirect to /reading-room/loans
*
```

There is no `/admin/deleted` route. Books are hard-deleted through `DELETE /books/{book_id}`; deletion is permanent.
Albums are permanently deleted through `DELETE /albums/{album_id}` (no album restore route; only quotes have
`POST /quotes/restore-defaults`).

## Navigation

* `/` is Home: room-entrance imagery plus mixed-media discovery (quotes, New Additions, New Releases, Current Reading,
  featured categories, Staff Picks).
* `/about` is library information (`AboutPage` + `CatalogGuide`).
* Brand recovers to Home (`/`): `AppShell` uses library-context branding (image or display name). Home hides the header
  nav.
* Inside Reading or Listening Room, primary nav is room-scoped:
  * Dashboard (room-specific href)
  * Collection drawer: Browse (`/books` or `/albums`), Search by image (`/catalog/image-search`), Stash with live
    count (Reading Room only), Manage, Collections, Wishlists
  * Loans as a direct link (room-specific href) -- there is no Circulation drawer
* Hallway routes (`/collection/manage`, `/collections`, `/wishlists`) expose Reading Room / Listening Room links.
* About is reachable from Home, not a separate primary-nav item.
* `/collection/manage` links Print Every Book/Album Label, Build the Collection (`/library/setup`), Add Book, Bulk Add
  books, Shelves, Library Settings, Quote Library, Add Album, and Bulk Add Albums, plus decorative
  `Manage_Collection_Pen.webp`.

There are no standalone Checkout or Check-in primary-nav items.

## Home and About

Home answers: which room am I entering, and what might I want to browse, read, or listen to?

Primary implementation:

```text
src/features/home/routes/HomePage.tsx
src/features/home/homeDiscoveryModel.ts
src/features/home/homeQuotes.ts
src/features/home/homeQuoteHeadings.ts
src/features/home/components/
src/features/rooms/routes/
src/features/about/routes/AboutPage.tsx
src/features/about/components/CatalogGuide.tsx
src/features/collection/routes/ManageCollectionPage.tsx
src/features/library/routes/
src/features/quotes/
src/features/catalog/
src/features/albums/
src/api/catalogQueries.ts
src/api/quotesQueries.ts
```

Home includes:

* image-based entrances to `/reading-room` and `/listening-room`;
* mixed New Additions via `useRecentAdditions` (`GET /catalog/recent-additions`);
* New Releases (books + albums), Current Reading, featured categories, Staff Picks;
* Home quotes from `useQuotes` (`GET /quotes`) with built-in `homeQuotes` fallback when the API list is empty,
  all-disabled, or unavailable;
* cover/artwork thumbnails on discovery tracks via shared authenticated media components.

Optional counts/metadata failures must not blank core category browsing.

About retains dedication, lending policy, purpose, and the accessible Catalog Guide.

---

# 5. Authentication, runtime config, and API client

## Auth

Authenticated API requests send:

```text
Authorization: Bearer <VITE_API_SECRET_KEY>
```

The token is build-time configuration from repository-root `.env`.

Every business route requires Bearer auth **and** tenant resolution via proxy-owned `X-Forwarded-Host` (leftmost label
lowercased; `shade` → `andy`; allowlisted in `data/tenants.cfg`). Public `GET /health` and `GET /version` omit auth and
do not require tenant context. `GET /ready` omits auth but is hostname-scoped.

Do not introduce:

* runtime token entry;
* `sessionStorage` token storage;
* a connection-settings token form;
* browser-set `X-Forwarded-Host` or `Library-Username`.

CORS allows local Vite origins plus `andy`/`dalmo`/`jamie` localhost and deployed `shade`/`dalmo`/`jamie` library
hosts. Allowed request headers are `Authorization` and `Content-Type`. `Content-Disposition` is exposed so
cover/artwork download filenames are readable from JavaScript. Credentialed CORS (cookies) is disabled.

## Runtime config

`public/config.js` provides:

```ts
window.__SHADE_CONFIG__
```

including:

* `apiBaseUrl`;
* optional diagnostics configuration.

Application version comes from `package.json` via `APP_VERSION`, not runtime config.

## Connection behavior

Startup connectivity checks public liveness and then tenant-aware readiness:

```text
GET /health
GET /ready
```

`GET /ready` may return **503** with `Retry-After: 1` when the tenant database is unavailable. Missing/unknown/empty
tenant host context returns **400** (same strings as protected routes). OpenAPI currently under-documents those
`/ready` failure codes; prefer `API-for-FE.md`. Do not poll `/ready`.

Connection states:

```text
checking
connected
unauthorized
unreachable
```

Do not use `/protected` as the startup connectivity check. Use `GET /version` only for the footer API release string;
do not treat it as a health probe.

## API client

Reuse `src/api/apiClient.ts`.

It handles:

* Bearer auth;
* omission of browser-owned tenant headers (the proxy supplies routing context);
* timeout;
* abort signals;
* JSON helpers (`getJson` / `requestJson`);
* authenticated `get` / `request` for non-JSON bodies;
* unauthorized handling;
* typed API errors;
* diagnostics reporting.

Cover get uses authenticated `client.get` + `response.blob()`. Cover upload uses `client.request` with multipart
`FormData` (field `file`). Do not force cover bytes through JSON parsers, and do not invent a second HTTP stack.

Do not invent a second transport layer.

---

# 6. API / React Query architecture

Shared API/types/query infrastructure includes:

```text
src/api/api.ts
src/api/apiTypes.ts
src/api/apiClient.ts
src/api/apiErrors.ts
src/api/apiRedaction.ts
src/api/queryKeys.ts
src/api/requestFields.ts
src/api/generated/openapi.ts
```

Server state uses React Query. Extend existing query-key families and hooks; do not create a parallel cache/state
system.

Global query behavior includes:

* 30s stale time;
* refetch on focus/reconnect;
* no retry for inappropriate auth/validation/cancelled cases;
* mutations do not automatically retry.

---

# 7. Books catalog -- current state

`/books` uses infinite pagination with a shared batch size of 30.

Primary implementation:

```text
src/api/booksApi.ts
src/api/booksQueries.ts
src/features/books/booksListModel.ts
src/features/books/components/BooksListControls.tsx
src/features/books/components/BookCover.tsx
src/features/books/routes/BooksPage.tsx
```

## URL-backed filtering

Books currently understands:

```text
category_id   repeated, AND semantics
author
title
isbn
shelf_name
is_read
cleanup_field
sortBy
sortOrder
```

Visible Books controls include:

* Category
* Author
* Title
* Read status

  * All
  * Read
  * Unread
* Sort field
* Sort direction

Default sort when omitted is author ascending (`sortBy=author`, `sortOrder=asc`).

`shelf_name` is URL-driven rather than a visible general Books filter.

Example:

```text
/books?shelf_name=e4
```

Shelf and Read may compose:

```text
/books?shelf_name=e4&is_read=false
```

ISBN remains URL/hardware-driven rather than a typed filter control.

A sole valid ISBN result automatically replace-navigates to Book Details.
Multiple/partial matches remain on the filtered Books list.

## Cleanup mode

Dashboard metadata-health links enter Books through:

```text
/books?cleanup_field=category
/books?cleanup_field=shelf
/books?cleanup_field=pages
/books?cleanup_field=publisher
/books?cleanup_field=year
/books?cleanup_field=isbn
```

Cleanup mode uses:

```text
GET /dashboard/incomplete-metadata/books
useInfiniteIncompleteMetadataBooks(...)
```

rather than normal `GET /books`.

While `cleanup_field` is active:

* ordinary Books filter controls are hidden;
* the normal catalog query is disabled;
* the cleanup infinite query supplies the list;
* a contextual missing-field notice appears;
* Clear cleanup filter returns to normal Books browsing;
* stale ISBN/shelf notices are not shown;
* ISBN unique-auto-open does not run.

The same normal Book cards/details navigation are reused.

## Bulk selection

Books supports explicit bulk-selection mode.

Relevant implementation:

```text
src/features/books/useBulkSelection.ts
src/features/books/utils/bulkSelectionModel.ts
src/features/books/components/BookSelectionControl.tsx
src/features/books/components/BooksBulkActions.tsx
src/features/books/routes/BooksPage.tsx
```

Behavior:

* selection controls are absent until bulk-selection mode is entered;
* individual loaded books can be selected/deselected;
* Select All selects currently loaded eligible books only;
* Clear Selection clears the current selection;
* exiting selection mode clears selection;
* changing catalog filter identity clears selection;
* sorting alone preserves selection;
* selection is `book_id`-based rather than tied to card instances.

Do not silently change Select All into an all-pages/server-wide operation.

## Bulk move to shelf

Bulk-selected Books may be moved to a destination shelf through the backend atomic mutation:

```text
POST /books/bulk/move-to-shelf
```

Request:

```json
{
  "book_ids": ["..."],
  "shelf_name": "a1"
}
```

Response includes:

```text
book_ids
moved_count
shelf_name
```

Frontend support includes:

```text
booksApi bulk move method
useBulkMoveBooksToShelf
BulkMoveToShelfControl
BooksBulkActions
```

Behavior:

* destination shelves come from the live shelf catalog;
* `unknown` is assignable;
* `removed` is excluded from ordinary assignment;
* no destination is assumed automatically;
* Move to Shelf stays disabled until a destination is chosen;
* confirmation displays selected-book count and destination;
* all selected IDs are sent in one atomic backend request;
* duplicate submission is blocked while pending;
* success displays confirmation and clears the completed selection;
* failure displays the error and preserves selection/destination for recovery;
* relevant Books/shelf/dashboard server state is invalidated after mutation.

Do not replace this with one PATCH request per selected book.

Bulk-move UI supports normal and narrow responsive layouts.

## Book create and edit

Primary implementation:

```text
src/features/books/components/BookForm.tsx
src/features/books/components/bookFormModel.ts
src/features/books/routes/NewBookPage.tsx
src/features/books/routes/EditBookPage.tsx
src/features/books/routes/bookEditModel.ts
src/features/books/authorDisplay.ts
src/api/authorsApi.ts
src/api/authorsQueries.ts
```

Behavior:

* create and edit share `BookForm`;
* pages gate on successful `useShelves`, `useCategories`, and `useAuthors` before mounting the form;
* authors / people are normalized: ordered `author_ids` (and optional role ID lists) from `GET /people` via
  `authorsApi`, not free-form strings on book payloads;
* `BookRead.authors` (and illustrators/editors/translators) are structured `BookPersonRead[]` with `person_id`;
  display uses `formatBookAuthors`;
* create requires at least one author and an explicit shelf (`shelf_name` from selected `common_name`);
* edit sends a minimal `BookUpdate` patch only for changed fields;
* omit unchanged `category_ids`, `shelf_name`, and `author_ids`; send `category_ids: []` to clear categories;
* never send JSON `null` for `shelf_name`, `category_ids`, or `author_ids` on update (**422**);
* never send `status`, reading fields, or loan-driving values through edit;
* ISBN lookup on create may return textual `draft.authors`; applying the draft resolves/reuses/creates people
  via `useCreateAuthor` (`POST /people`) before submit;
* wishlist-only catalog rows omit `shelf_name` on `POST /books` (see Wishlists).

Frontend people catalog admin outside inline book/wishlist/album flows is outside V1 unless explicitly requested.

---

# 8. Categories and people

## Categories

Backend categories are normalized many-to-many data.

Frontend support is dynamic:

```text
GET /categories
categoriesApi
categoriesQueries
useCategories
categoryDisplay
BookForm category_ids
```

Book create/edit supports multiple category assignments.

Books filtering sends repeated:

```text
?category_id=...
```

with AND semantics.

Do not:

* use a singular hard-coded category enum;
* use `?category=`;
* hard-code the taxonomy into the SPA.

Frontend category administration is outside V1 unless explicitly requested.

## People (authors / album credits)

Backend people are a shared catalog for book contributors and album credits. There is **no** `/authors` or `/artists`
path -- SPA helpers call `/people`.

Frontend support:

```text
GET /people
authorsApi / artistsApi
authorsQueries
useAuthors
useCreateAuthor
authorDisplay.formatBookAuthors
BookForm authorIds -> author_ids (+ illustrator/editor/translator IDs)
Album forms artistIds -> person_ids
```

Rules:

* `GET /people` returns `{ items, total }` with no pagination params (ordered by surname, first name, `person_id`);
* SPA aliases `AuthorRead` / `ArtistRead` = `PersonRead`;
* `BookCreate.author_ids` requires at least one GUID; optional `illustrator_ids` / `editor_ids` / `translator_ids`;
* `BookUpdate` role lists replace membership only when present; `author_ids` may not be empty when sent;
* role lists may not be null or contain duplicates;
* unknown people IDs on create/update return **422** with object `detail`;
* deleting a referenced person returns **409**;
* album create/update uses ordered `person_ids` and `genre_ids` against the same people/genre catalogs;
* `GET /books?author=` remains a text filter over linked people names;
* default Books sort is author ascending (`sortBy=author`);
* ISBN / album lookup drafts do not create people automatically -- resolve or create via `POST /people` first;
* inline `useCreateAuthor` is used on create lookup apply and wishlist add flows.

Do not:

* send free-form author strings on `BookCreate` / `BookUpdate`;
* hard-code person names in the SPA;
* invent separate `/authors` or `/artists` clients against those paths.

Frontend people catalog admin (dedicated management page) is outside V1 unless explicitly requested.

Book and album Bulk Add UIs use `POST /books/bulk/lookup` + `POST /books/bulk/import` and
`POST /albums/bulk/lookup` + `POST /albums/bulk/import` respectively. Prefer those batch endpoints over looping
single lookup/create calls.

---

# 9. Book covers

Authenticated cover routes:

```text
GET    /books/{book_id}/cover
PUT    /books/{book_id}/cover
DELETE /books/{book_id}/cover
```

Behavioral detail beyond OpenAPI schemas lives in `docs/technical-reference/API-for-FE.md` (Book covers). Cover
resolution -- including the Open Library ISBN fallback -- happens server-side behind the authenticated cover endpoint
(OpenAPI `1.3.0`; cover routes since `0.2.11+`). Local cover files are stored under
`data/covers-for-books/<username>/` (relative to `DB_DIR`); the SPA never constructs paths from that layout.

Rules:

* `BookRead.cover_image_path` is an optional **filename** (e.g., `{book_id}.webp`), not a URL and not browser-ready.
* It is set only by successful `PUT` and cleared by `DELETE`.
* Create/update JSON cannot set it. Never PATCH `cover_image_path`.
* Non-null `cover_image_path` means a local file exists. `null` does **not** mean "no cover available" -- `GET` may
  still return an ISBN-derived cover fetched server-side.
* `PUT` uses multipart form field `file` (required); JPEG / PNG / WebP only; max **10 MB**; empty or bytes/type
  mismatch → **422** (string `detail`); success → **200** `BookRead`.
* `DELETE` clears on-disk files and `cover_image_path` (**204**).
* `GET` behavior:
  1. local file → **200** image bytes + matching `Content-Type`;
  2. no local file, but `isbn13` and Open Library returns usable artwork → backend fetches server-side and returns
     **200** image bytes;
  3. otherwise → **404** `"Book cover not found"`;
  4. missing or deleted book → **404** `"Book not found"`.
* Local uploads always take priority over ISBN-derived artwork.
* Open Library timeout / network / missing / non-image responses resolve to the normal **404** cover state.
* Missing or hard-deleted books reject cover get/upload/delete (**404**).

Browser display cannot put `Authorization` on an `<img src>`. Use authenticated `fetch` to
`GET /books/{book_id}/cover`:

* **200** → `response.blob()` and an object URL for `<img>` (revoke on cleanup);
* **404** → intentional placeholder.

Do not invent cover URLs from `cover_image_path`. Do not call Open Library from the SPA. The backend owns
local-versus-ISBN resolution.

SPA surface:

* `booksApi.getCover` / `uploadCover` / `removeCover`;
* `queryKeys.bookCovers`, `useBookCover`, `useUploadBookCover`, `useRemoveBookCover`;
* shared `BookCover` (lazy IntersectionObserver load unless `eager`, blob object URL, status stamp, placeholder) on Book
  Details, Books list, Home New Additions / Staff Picks, and Collections memberships;
* `BookCoverManager` upload/remove on Book Details;
* styles under `.book-cover*` in `src/styles/components.css`.

Cover loading stays independent of core book queries. Non-JSON binary responses today are
`GET /books/{book_id}/cover` and `GET /albums/{album_id}/artwork` (album SPA uses authenticated artwork helpers).

---

# 10. Shelves -- current state

Shelf catalog API:

```text
GET    /shelves
POST   /shelves
PATCH  /shelves/{shelf_id}
DELETE /shelves/{shelf_id}
```

Frontend:

```text
shelvesApi
useShelves
useCreateShelf
useUpdateShelf
useDeleteShelf
ShelvesPage
```

Book placement payloads use:

```text
shelf_name: string
```

There is no hard-coded Shelf enum.

## Shelf behavior

* Add/Edit Book shelf options come from the API.
* UI retains `shelf_id` for selection but submits `common_name` as `shelf_name`.
* Bulk Move follows the same live shelf catalog and assignment rules.
* Shelf names are displayed in Title Case.
* Create requires an explicit shelf selection.
* `unknown` is selectable.
* `removed` is excluded from ordinary assignment.
* Mixed-media placement returns **412** (`A book cannot be placed on an album shelf`). Surface the server `detail` and
  preserve form input. There is no shelf `media_type` field.
* Edit may preserve/surface current `removed` membership.
* System shelves `unknown` and `removed` cannot be renamed or deleted; allowed metadata edits remain supported.
* Shelf delete **409** if any books or albums remain.

## Shelves page counts and navigation

`ShelvesPage` uses:

```text
useDashboardBreakdowns()
```

and maps `by_shelf` buckets to the shelf catalog.

For each shelf:

* its current book count is displayed;
* omitted breakdown buckets display `0`;
* singular/plural `book` / `books` is handled;
* shelf name and count link to: `/books?shelf_name=<common_name>`.

If the breakdown-count query fails, Shelves shows a retryable count error instead of pretending all counts are zero.

The Shelves catalog is responsive:

* desktop: 3 cards per row;
* medium: 2;
* small/mobile: 1.

---

# 11. Dashboard -- current state

Reading and Listening dashboards are separate routes:

```text
/reading-room/dashboard
/listening-room/dashboard
```

Legacy `/dashboard` redirects into the Reading Dashboard. The Reading Dashboard remains a desk layout with indexed
paper panels (`.dashboard-desk` / `.dashboard-paper*`). The desk background uses `Dashboard_Background.webp` via CSS
variable `--dashboard-desk-image`. The dedicated Listening Dashboard is shipped as a record-counter composition with
album format/crate breakdowns, listening/borrowing metrics, and a local random shelved-album dashboard selection;
that selection never changes playback or listening history.

Queries:

```text
useDashboard()
useDashboardBreakdowns()
useDashboardIncompleteMetadata()
```

`useInfiniteIncompleteMetadataBooks()` is consumed by Books cleanup mode rather than mounted by Dashboard.

## Paper I -- Collection

Shows API-provided collection statistics.

Do not recalculate dashboard statistics from `GET /books`. Summary responses include additive album fields
(`total_albums`, `albums_checked_out`, `albums_recently_added`, `album_borrowing`, `listening`) and book `stash_count`.
Breakdowns include `total_albums`, `albums_on_loan`, `albums_by_media_format`, `albums_by_shelf`, and
`albums_by_creation_year`. Keep Reading papers book-only and Listening statistics album-oriented; do not combine book
and album totals. Incomplete-metadata routes remain book-only.

## Paper II -- Circulation

Shows borrowing/circulation summary.

Loan history links to the room-specific loans route (`/reading-room/loans` or `/listening-room/loans`).

## Paper III -- Reading Record

Contains the Read/Unread visualization and metrics.

Both Read and Unread counts deep-link to Books:

```text
Read   -> /books?is_read=true
Unread -> /books?is_read=false
```

API top-level `read` / `unread` values remain the display source.

## Paper IV -- Basic Stats

Uses `useDashboardBreakdowns()`.

Displays:

* Total Books;
* On Loan;
* category-assignment donut.

The category donut:

* sorts buckets descending;
* shows the top 7 dynamically;
* combines the rest into `Other`;
* hard-codes no category names;
* represents category assignments, not mutually-exclusive shares of books.

Creation Year is intentionally not rendered.

`by_shelf` is consumed by `ShelvesPage`, not rendered here.

## Paper V -- Healing Metadata

Displays:

* total books needing metadata;
* missing Category;
* missing Shelf;
* missing Pages;
* missing Publisher;
* missing Publication Year;
* missing ISBN.

Each per-field count links to Books cleanup mode (`/books?cleanup_field=`). There is no Dashboard-local affected-book
browser, field filter, or infinite cleanup list on this page.

## Refresh/error behavior

Unified Refresh refetches:

* dashboard summary;
* dashboard breakdowns;
* incomplete-metadata summary.

Preserve offline/stale state, paper-level errors, and independent report failure behavior. Hardware collection ISBN jump
(`useCollectionIsbnJump`) is also wired on Dashboard.

---

# 12. Reading and circulation flows

## Checkout

Product checkout lives on Book Details through `CheckoutDialog`.

`/checkout` is compatibility routing only.

Do not simulate checkout with generic PATCH.

Book Details shows cover art via shared `BookCover` (eager) and upload/remove via `BookCoverManager` when the book is
active. Cover fetch stays independent of the core `useBook` query. Never use `cover_image_path` as a browser URL.

## Check-in

Product check-in lives on the room-specific loans pages.

`/checkin` is compatibility routing only and redirects to Reading-room Loans while preserving search.

`/reading-room/loans?bookId=...` opens the book check-in workflow. Album check-in lives under
`/listening-room/loans`.

Book and album check-in **require** a borrower rating from 1 through 5 (`CheckinRequest.rating`). Optional
`returned_at` may be omitted. Check-in records initial returned-loan feedback atomically.

Reading Loans load `useInfiniteLoans({ mediaType: 'book' })`; Listening Loans load `mediaType: 'album'`. Loan wrappers
accept `bookId`, `albumId`, and `mediaType`; include supplied filters in query keys. Guard nullable `book_id` /
`album_id` on loan rows. Join books only on `loan.book_id === book.book_id` and albums only on
`loan.album_id === album.album_id`.

There is no strict user-facing due-date workflow.

## Reading

Unread active books may be marked read through the dedicated mark-read route.

Already-read books use Reading Edit for later completion/rating/review changes.

Do not introduce Mark Unread unless explicitly requested.

---

# 13. Wishlists and Collections

## Wishlists

Wishlists are mixed-media. Membership identity is `wishlist_item_id` (not `wishlist_book_id`). Rows expose nullable
`book_id` and `album_id` (exactly one non-null for typed rows). Prefer `GET /wishlists/{wishlist_id}/items` for mixed
lists rather than merging separate book and album list requests.

Book notes / membership updates stay on `/wishlists/{wishlist_id}/books/{wishlist_item_id}`. Album membership uses
typed album routes, including notes PATCH and atomic
`POST /wishlists/{wishlist_id}/albums/{wishlist_item_id}/move-to-shelf`.

Book add flow:

```text
POST /books without shelf_name (author_ids required)
then wishlist membership POST
```

Wishlist book add resolves textual author input to `author_ids` via `useAuthors` / `useCreateAuthor` before the
unshelved catalog create.

Book move-to-shelf:

```text
DELETE /wishlists/{wishlist_id}/books/{wishlist_item_id}
then PATCH book { shelf_name }
```

This ordering is required by shelf/wishlist exclusivity for books. Album move-to-shelf uses the atomic album endpoint
instead. Do not assign `shelf_name` before removing book wishlist membership.

## Curated Collections

`/collections` supports typed book and album membership:

* create / edit name/description / delete;
* add existing shelved catalog books or owned albums;
* reorder / remove membership;
* Book Details and Album Details add-to-collection flows where implemented.

Collections are orthogonal to shelf placement. Book membership uses `collection_book_id`; album membership uses
`collection_album_id`. Empty collections are untyped; mixed membership returns **412**.

Book membership rows join title/authors via `GET /books/{book_id}` and show shared `BookCover`. Album rows use
authenticated artwork plus album-native metadata. Location uses `displayCollectionBookLocation`: **Wishlist** when
`on_wishlist`; otherwise Title Case shelf. Membership `shelf_name` may be JSON `null` for unshelved rows -- do not
expect BookRead's synthesized `"unknown"`.

---

# 14. Hard delete and backup boundary

Books use permanent hard delete via `DELETE /books/{book_id}`.

Product delete lives at:

```text
/books/:bookId/delete
```

The frontend blocks delete when the book is on loan (`status === 'on_loan'` or an active loan exists), even though the
backend would allow it. Hard delete removes the book and dependent memberships server-side; it cannot be restored.

There is no browser backup endpoint. Database export and seed synchronization are operator-owned workflows.

There is no browser Backup page/API caller.

Never inspect, log, cache, or upload SQL dump or backup contents from frontend code.

---

# 15. Scanner behavior

Camera barcode/ISBN scanning is used on book create (`/books/new`), album create/bulk-add flows where wired, and
catalog image-search capture (`/catalog/image-search`). It is not a checkout capture surface.

Hardware wedge collection scanning is mounted on Reading Room surfaces such as:

```text
/reading-room/dashboard
/books
/reading-room/loans
```

`useCollectionIsbnJump`:

* ignores editable targets;
* compacts accepted ISBN input;
* prefetches Books by ISBN;
* opens a unique match;
* otherwise navigates to `/books?isbn=...`.

Do not add checkout camera scanning or a second scanner architecture.

A NewBookPage camera-scanner test has shown occasional full-suite timing flakiness while passing independently. Do not 
treat an isolated timeout waiting for the asynchronously loaded scanner as a product regression without reproduction.

---

# 16. Testing and quality gate

Canonical full gate:

```sh
make check
```

It includes:

* ESLint;
* strict TypeScript;
* generated OpenAPI drift check;
* Vitest;
* enforced coverage;
* Playwright;
* axe accessibility checks;
* production build;
* bundle-size check.

Coverage floors (enforced in `vite.config.ts`):

```text
statements 20%
branches   20%
functions  20%
lines      20%
```

Bundle budget:

```text
warn above 120 kB gzip main entry
fail above 150 kB gzip main entry
```

Preserve the existing test architecture.

## Current verification coverage

Focused coverage includes:

* Books URL filters (`shelf_name` / `is_read` / `cleanup_field`);
* Shelves / Dashboard deep links into filtered Books;
* API bulk mutation (`POST /books/bulk/move-to-shelf`);
* React Query bulk mutation;
* bulk-selection model/hook;
* `BulkMoveToShelfControl`;
* `BooksPage` bulk-selection integration;
* author/people resolution on create/edit/wishlist add (`author_ids` / `person_id`, `useAuthors`, `useCreateAuthor`);
* `ConfirmationDialog`;
* Home discovery (`HomePage` / discovery-model tests), including mixed recent additions and quote fallbacks;
* cover helpers / hooks / `BookCover` / `BookCoverManager` and cover wiring on Books, Home, Collections, and Book
  Details;
* album labels / bulk add / artwork surfaces where present.

The backend OpenAPI contract includes (non-exhaustive):

```text
GET  /people
POST /people
GET  /genres
POST /catalog/search-image
GET  /quotes
POST /books/bulk/move-to-shelf
POST /books/bulk/lookup
POST /books/bulk/import
POST /books/bulk/stash
POST /books/bulk/apply-stash
POST /books/bulk/availability
POST /books/{book_id}/availability
POST /books/{book_id}/mark-unread
GET  /books/{book_id}/cover
PUT  /books/{book_id}/cover
DELETE /books/{book_id}/cover
GET  /books/{book_id}/borrower-reviews
GET  /albums
GET  /albums/lookup
POST /albums/bulk/lookup
POST /albums/bulk/import
GET  /albums/{album_id}/artwork
GET  /albums/{album_id}/borrower-reviews
GET  /wishlists/{wishlist_id}/items
POST /wishlists/{wishlist_id}/albums/{wishlist_item_id}/move-to-shelf
GET  /loans?media_type=book|album
PUT  /loans/{id}/feedback
GET  /library/setup
GET  /library/settings
GET  /works/{work_id}
POST /catalog/resolve-code
GET  /catalog/recent-additions
```

Checked-in OpenAPI (`info.version` `1.3.0`) and generated types should match (`yarn api:check`). Album, library,
quotes, catalog, people, and room surfaces are live in the SPA; extend existing feature modules rather than inventing
parallel ones.

Treat an open sequenced ticket under `docs/tickets/` (for example `FEAT-01_ocr-catalog-search.md`),
explicit user direction, or a green `make check` as the current open-work signal. Re-run `make check` before claiming a
new change is release-ready.

---

# 17. Accessibility and responsive baseline

Preserve:

* route title changes;
* focused route `h1` using `tabIndex={-1}`;
* skip link;
* visible focus;
* field-linked errors;
* dialog focus trap/restoration;
* reduced-motion behavior;
* no color-only status information;
* 320px usability;
* long-content wrapping.

Bulk Move uses the existing accessible confirmation-dialog architecture.

Success messaging uses a polite status announcement; errors use alert semantics.

Automated axe complements manual keyboard/responsive checks; it does not replace them.

Do not claim untested browsers/devices passed.

---

# 18. CSS / visual architecture

CSS layers:

```text
tokens -> base -> shell -> components
```

Primary component styling lives in:

```text
src/styles/components.css
```

That file also owns Home (`.home-page*`), Manage Collection (`.manage-collection-page*`), dashboard desk/paper layout
(`.dashboard-desk`, `.dashboard-paper*`, `.dashboard-metric*`, `.dashboard-breakdowns`, `.dashboard-healing*`),
collections, wishlists, and book-cover (`.book-cover*`) layout classes. Shell owns brand image classes
(`.app-brand` / `.app-brand__image`). Use existing design tokens where possible.

Leftover `.dashboard-drawer*` rules may still appear in `components.css` but are unused by current `DashboardPage`
markup -- prefer `.dashboard-paper*` when extending the dashboard.

Card-catalog / paper surfaces use light cardstock tokens such as:

```css
--color-surface
--color-surface-muted
--color-surface-text
--color-surface-text-muted
```

Do not use dark-page `--color-text` for text/links on light cardstock surfaces.

Bulk-selection actions use the existing card-catalog visual language. `BulkMoveToShelfControl` has its own grid spacing
so its status, destination field, and action do not crowd each other.

Bundled WebP imagery under `src/assets/`:

* `Shade_Library_Header.webp` -- `AppShell` brand
* `Shade_Library_Hero.webp` -- Home hero → `/about`
* `Dashboard_Background.webp` -- Dashboard desk background
* `Manage_Collection_Pen.webp` -- Manage Collection decorative pen
* `Books_List_Glasses.webp` / `Loans_Stamp.webp` -- present but currently unused (removed from Books / Loans pages)

---

# 19. Non-negotiables

## API / data

* Backend contract wins.
* Do not invent undocumented routes.
* Do not hand-edit generated OpenAPI types.
* Reuse existing API helpers and React Query keys.
* Do not duplicate server state into a second state store.
* Do not silently recalculate API-owned dashboard metrics or combine book and album dashboard fields.
* Preserve proxy-owned tenant routing: send only the Bearer token from the browser; never set `X-Forwarded-Host` or
  `Library-Username`. Treat missing/unknown host **400** and `/ready` tenant failures as connection/configuration
  problems, not inventable SPA workarounds.
* Prefer dedicated lifecycle endpoints (checkout, check-in, mark-read, mark-played, availability, bulk shelf move,
  bulk stash/apply-stash, cover upload/delete, album artwork upload/delete/refetch -- never simulate those with
  generic `PATCH`).
* Bulk shelf movement must use the dedicated atomic endpoint, not repeated single-book PATCH requests.
* Covers use `GET` / `PUT` / `DELETE /books/{book_id}/cover` only. Never invent browser URLs from `cover_image_path`,
  call Open Library from the SPA, or set covers through create/update JSON.
* Album artwork uses authenticated `/albums/{album_id}/artwork` routes only. Do not construct browser URLs from
  private storage paths or call Discogs / MusicBrainz / Cover Art Archive from the SPA.
* Always send check-in `rating` (1--5). Do not combine owner catalog rating/review with borrower feedback.
* JSON `null` `shelf_name`, `category_ids`, or `author_ids` on book update is **422** -- omit those fields instead
  (OpenAPI may still show `null` as a schema option).
* Book create requires ordered `author_ids`; do not send free-form author strings on book payloads.
* Catalog identity is `book_id` / `album_id` / `wishlist_item_id` as documented. Do not read retired `book.id` or
  `wishlist_book_id`.

## Product behavior

* `/` is discovery Home; `/about` is library information.
* Brand recovers to Home via the header image, not About.
* No strict lending due-date pressure.
* No standalone Checkout page.
* No standalone Check-in page.
* No browser Backup page.
* No hard-coded category vocabulary.
* No category or people catalog admin pages in V1 unless explicitly requested.
* No Mark Unread product UI unless explicitly requested (`POST /books/{book_id}/mark-unread` and hooks exist).
* No wishlist/shelf overlap.
* Collections do not replace shelf placement; keep book and album membership routes typed and isolated.
* `removed` is not an ordinary shelf-assignment destination.
* Cover display/upload stays on the authenticated cover routes and shared `BookCover` / `BookCoverManager` surfaces.
* Album artwork stays on authenticated album artwork routes and shared album artwork components.
* Extend existing album / library / room / quotes / catalog surfaces under the active ticket; do not reinvent them from
  OpenAPI alone.
* Surface mixed-media **412** detail on shelf/collection writes; do not invent a shelf `media_type` field.

## Scope discipline

Do not invent the next product feature merely because the API already supports it. When no ticket is supplied, check
`docs/tickets/` for open sequenced work or ask which work should be taken next rather than guessing.

---

# 20. Open work / tickets

Sequenced feature tickets live under `docs/tickets/` while open and are removed after completion. Informal UI feedback
notes may also live there; they are not sequenced build tickets unless the user asks to implement items from them.
Prefer the supplied ticket, an explicit user request, or product docs when choosing further work.

Current open sequenced work:

* FEAT-01 -- OCR catalog search (implemented; awaiting opt-in live API validation).

Album catalog UI is largely shipped under `src/features/albums/`. Extend those surfaces; do not re-implement Browse /
Add / Details from the contract alone.

Current product capabilities are described in the sections above, including:

* room-based Reading / Listening navigation with Search by image and Reading-room Stash;
* Books URL filters, cleanup mode, stash, availability, bulk add, and labels;
* album Browse / Add / Details / Bulk Add / Labels / artwork / circulation;
* OCR catalog image search at `/catalog/image-search`;
* Quote Library at `/quotes`;
* Shelves / Dashboard deep links;
* bulk selection and atomic bulk move-to-shelf;
* Home room chooser with mixed-media discovery and API-backed quotes (built-in fallback);
* desk/paper Reading Dashboard with healing deep links into Books cleanup mode;
* library setup and settings;
* mixed wishlists and typed Collections membership;
* brand/header and page imagery under `src/assets/` / library branding helpers;
* book covers and album artwork on authenticated binary routes;
* shared `/people` catalog via `author_ids` / role lists and album `person_ids`;
* the canonical `make check` quality gate.

Do not invent the next product feature merely because the API already supports it. Keep covers and artwork on the
authenticated binary routes.

## Remaining planned work

```text
docs/tickets/FEAT-01_ocr-catalog-search.md -- OCR catalog search (live API validation)
```

Open review topics without sequenced ticket files (do not invent implementation from these alone):

* book/album QR label stock / printer validation;
* book and album code-resolution and circulation review;
* scanner focus / re-arm behavior on supported devices.
---

# 21. Condensed source inventory

Verify before editing, but these are known architectural locations.

## API

```text
src/api/api.ts
src/api/apiClient.ts
src/api/apiErrors.ts
src/api/apiTypes.ts
src/api/albumsApi.ts
src/api/albumsQueries.ts
src/api/artistsApi.ts
src/api/artistsQueries.ts
src/api/authorsApi.ts
src/api/authorsQueries.ts
src/api/booksApi.ts
src/api/booksQueries.ts
src/api/catalogApi.ts
src/api/catalogQueries.ts
src/api/categoriesApi.ts
src/api/categoriesQueries.ts
src/api/collectionsApi.ts
src/api/collectionsQueries.ts
src/api/dashboardApi.ts
src/api/dashboardQueries.ts
src/api/generated/openapi.ts
src/api/genresApi.ts
src/api/genresQueries.ts
src/api/libraryApi.ts
src/api/libraryQueries.ts
src/api/loansApi.ts
src/api/loansQueries.ts
src/api/queryKeys.ts
src/api/quotesApi.ts
src/api/quotesQueries.ts
src/api/requestFields.ts
src/api/shelvesApi.ts
src/api/shelvesQueries.ts
src/api/wishlistsApi.ts
src/api/wishlistsQueries.ts
src/api/worksApi.ts
```

Note: some helpers (for example `authorsApi`, `catalogApi`, `libraryApi`, `quotesApi`, `worksApi`) construct clients
directly from `apiClient` rather than only through `createApi()`. `createApi()` does wire `albums`, `artists`, and
`genres` alongside the book/shared helpers. `authorsApi` and `artistsApi` both hit `/people`.

## Books

```text
src/features/books/authorDisplay.ts
src/features/books/booksListModel.ts
src/features/books/labelCode.ts
src/features/books/labelQrOptions.ts
src/features/books/useBulkSelection.ts
src/features/books/utils/bulkSelectionModel.ts
src/features/books/components/BookCover.tsx
src/features/books/components/BookCoverManager.tsx
src/features/books/components/BookForm.tsx
src/features/books/components/bookFormModel.ts
src/features/books/components/BookSelectionControl.tsx
src/features/books/components/BooksBulkActions.tsx
src/features/books/components/BooksListControls.tsx
src/features/books/components/BulkMoveToShelfControl.tsx
src/features/books/routes/BooksPage.tsx
src/features/books/routes/BookDetailsPage.tsx
src/features/books/routes/BookLabelsPage.tsx
src/features/books/routes/BulkAddPage.tsx
src/features/books/routes/NewBookPage.tsx
src/features/books/routes/EditBookPage.tsx
src/features/books/routes/bookEditModel.ts
src/features/books/routes/DeleteBookPage.tsx
src/features/books/routes/StashPage.tsx
```

## Dashboard / rooms / albums / library / catalog / quotes

```text
src/features/dashboard/routes/DashboardPage.tsx
src/features/dashboard/routes/ListeningDashboardPage.tsx
src/features/rooms/
src/features/albums/
src/features/library/
src/features/catalog/
src/features/quotes/
src/features/seasonal/
```

## Shelves

```text
src/features/shelves/routes/ShelvesPage.tsx
src/features/shelves/routes/ShelvesPage.test.tsx
src/features/shelves/shelfDisplay.ts
src/features/shelves/shelfFormModel.ts
```

## Circulation

```text
src/features/loans/
src/features/scanning/CatalogCodeResolver.tsx
```

## Home / About

```text
src/features/home/routes/HomePage.tsx
src/features/home/homeDiscoveryModel.ts
src/features/home/homeQuotes.ts
src/features/home/homeQuoteHeadings.ts
src/features/home/components/
src/features/about/routes/AboutPage.tsx
src/features/about/components/CatalogGuide.tsx
```

## Collections / wishlists

```text
src/features/collections/
src/features/wishlists/
```

## Shared / layout

```text
src/components/
src/layout/AppShell.tsx
src/layout/DrawerNavMenu.tsx
src/routes/routes.tsx
src/routes/routeMetadata.ts
src/styles/components.css
src/styles/shell.css
src/styles/tokens.css
src/assets/Shade_Library_Header.webp
src/assets/Shade_Library_Hero.webp
src/assets/Dashboard_Background.webp
src/assets/Manage_Collection_Pen.webp
src/assets/Books_List_Glasses.webp
src/assets/Loans_Stamp.webp
src/features/collection/routes/ManageCollectionPage.tsx
```
## Contract verification

```text
docs/technical-reference/openapi.json
docs/technical-reference/API-for-FE.md
scripts/contractSmoke.test.ts
```

---

# 22. Ticket implementation procedure

When a feature ticket exists under `docs/tickets/`:

1. **Understand**

   * acceptance criteria;
   * API requirements;
   * prerequisites;
   * contradictions;
   * scope boundaries.

2. **Inspect**

   * request only the minimum current files needed;
   * do not infer unseen implementation details.

3. **Plan**

   * break work into small architectural steps;
   * identify tests that should change before coding.

4. **Implement**

   * extend current abstractions;
   * avoid parallel infrastructure;
   * give exact copy/paste edits.

5. **Verify incrementally**

   * targeted typecheck/tests after meaningful steps;
   * visually inspect UI changes when appropriate.

6. **Run the authoritative gate**

   ```sh
   make check
   ```

7. **Update this context** (and any other frontend-owned docs that describe the changed baseline) only where behavior
   genuinely changed.

When no ticket is supplied and no open sequenced ticket under `docs/tickets/` applies, ask which work to take next
rather than inventing a follow-on feature.

Treat failing assertions carefully: determine whether they expose a real regression, expected contract drift, or
intentional current behavior.

---

# 23. Document index -- attach on demand

| Need                                   | Document                                          |
| -------------------------------------- | ------------------------------------------------- |
| API paths, schemas, methods, enums     | `docs/technical-reference/openapi.json`           |
| API behavioral guidance                | `docs/technical-reference/API-for-FE.md`          |
| UI/design decisions                    | `docs/product-docs/UI_DESIGN_NOTES.MD`            |
| Album UI analogies                     | `docs/product-docs/UI_DESIGN_NOTES.ALBUM_ANALOGIES.md` |
| Product requirements drafts            | `docs/product-docs/PRODUCT_REQS.*.md`             |
| Current sequenced product work         | relevant ticket under `docs/tickets/`             |
| Setup / local development / release    | `README.md`                                       |

This Master Implementation Context is the complete always-on baseline for day-to-day implementation guidance. It stands
alone: do not require a second project context file for operating rules or inventory. Attach the rows above only when
the task needs their contents (API schemas, design notes, an open ticket, or setup/release notes). Prefer the current
sequenced ticket (when one exists) and the checked-in API contract over planning notes that may lag. When no sequenced
feature ticket remains, ask which work to take next.

---

# 24. Final working principle

Build Shade incrementally and in a way the user understands.

Be explicit, practical, conservative about architecture, honest about what repository state is visible, respectful of
the backend contract, and focused on the current work.

Use complete code and exact paths.

Explain why.

Do not invent requirements.

Do not invent undocumented behavior that contradicts this baseline.

Do not invent the next product feature merely because the API already supports it.

When information is missing, request the minimum evidence needed to proceed.
