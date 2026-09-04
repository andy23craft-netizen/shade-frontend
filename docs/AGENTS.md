# Agents.md: LLM Project Context

Use this document as the complete baseline context when working on the Shade frontend in a fresh LLM chat. It covers
operating rules, the backend contract, architecture, and the current codebase inventory (baseline as of 2026-09-03 --
verify against the repository before editing). Start from this file alone for that baseline; it does not depend on any
other LLM prompt or agents guide (`docs/full-project-context.md` is a slim ChatGPT pack, not required here). Attach
product tickets, OpenAPI, and other `docs/` references only when the current task needs them. Inspect the current
repository before making changes because the code may have changed since this document was written. A user's explicit
request takes precedence over general guidance here.

## Project Summary

Shade is a browser UI for a personal home-library FastAPI backend. Current functionality includes:

- Application shell, shared UI primitives, runtime config, build-time Bearer auth, and typed OpenAPI + React Query
  server state (mutation invalidation of lists, detail, dashboard, and loans on checkout/check-in; bulk shelf-move
  also invalidates books/shelf/dashboard caches).
- Diagnostics via `createDiagnosticReporter` from `RuntimeConfig.diagnostics` + `APP_VERSION` (from `package.json`
  `version`), wired through `RootErrorBoundary`, `AppProviders`, `ConnectionProvider`, and `apiClient`
  `onRequestFailure`; allowlisted/redacted via `assertSafeApiDiagnostic`; defaults disabled in `public/config.js`.
- Discovery Home on `/` (`HomePage`): hero brand image (`Shade_Library_Hero.webp`) linking to `/about` with an
  `sr-only` "Shade Library" heading, featured category drawers (top buckets from `useDashboardBreakdowns` joined to
  `useCategories` via `homeDiscoveryModel`), New Additions (`useRecentBooks`), Staff Picks (named Collections
  membership carousel), randomized quote with optional expandable context (`homeQuotes`), and secondary links to
  Browse / Collections / Wishlists / About. About library-information content lives at `/about` (`AboutPage` +
  `CatalogGuide`). Brand image in `AppShell` recovers to `/` (Home). About is reachable from Home (hero and secondary
  links), not as a separate primary-nav item.
- Primary navigation: Dashboard plus Collection and Circulation `DrawerNavMenu` drawers (`AppShell` /
  `DrawerNavMenu`). Drawer cards share one axis without per-item stagger. Collection includes Browse, Manage,
  Collections, and Wishlists; Circulation is Loans only.
  `/collection/manage` links Add Book and Shelves only.
- Dashboard on `/dashboard` (`DashboardPage`): desk layout with five indexed paper panels
  (`.dashboard-desk` / `.dashboard-paper*`, background `Dashboard_Background.webp`) -- summary metrics
  (`useDashboard` / `GET /dashboard`) for Collection, Circulation, and Reading Record (read/unread pie with deep
  links to `/books?is_read=`); catalog breakdowns (`useDashboardBreakdowns` / `GET /dashboard/breakdowns`, including
  category donut); and incomplete-metadata healing (`useDashboardIncompleteMetadata` /
  `GET /dashboard/incomplete-metadata`) showing per-field counts that deep-link into Books cleanup mode
  (`/books?cleanup_field=`). The infinite incomplete-metadata book list lives on `/books` cleanup mode
  (`useInfiniteIncompleteMetadataBooks`), not on the Dashboard itself. Unified Refresh refetches summary and report
  queries; panel-level errors do not blank other papers. Display API numbers only (null averages as "Not enough
  data"; contract warnings without inventing totals).
- Active collection and book details (`/books`, `/books/:bookId`) with infinite scroll, URL-backed multi-`category_id`
  (AND/intersection) / author / title / ISBN / `shelf_name` / `is_read` filtering, optional `cleanup_field` mode,
  shelf sort, Read/Unread, and ratings. Visible Books controls cover category / author / title / read status / sort;
  `shelf_name` and ISBN remain URL/deep-link (or hardware) driven. Category vocabulary loads from `GET /categories`
  (`useCategories`); list/detail display uses `formatBookCategories` on `BookRead.categories`. Cleanup mode hides
  ordinary filters and uses incomplete-metadata books. Do not invent page-local filter stacks or hard-coded category
  taxonomy; frontend category and author catalog admin remain out of V1.
- Explicit bulk selection on `/books` (`useBulkSelection` / `BookSelectionControl` / `BooksBulkActions`) and atomic
  bulk move-to-shelf via `POST /books/bulk/move-to-shelf` (`booksApi.moveToShelf` / `useBulkMoveBooksToShelf` /
  `BulkMoveToShelfControl`). Select All covers currently loaded eligible books only. Do not loop per-book `PATCH` for
  bulk placement.
- Book create/edit (`/books/new`, `/books/:bookId/edit`) via shared `BookForm` / `bookFormModel` / `bookEditModel`,
  normalized author picker (`author_ids` from `GET /authors`; inline `POST /authors` on create lookup and wishlist
  add), ISBN lookup on create (draft textual `authors` resolved/reused/created before submit), API-fed shelf pickers
  (`shelf_name`; create requires an explicit shelf), and multi-category checkboxes (`category_ids`; zero allowed).
  Create/edit gate on shelves, categories, and authors load failure. Edit uses a minimal `BookUpdate` patch (blank ISBN
  → `null`; omit unchanged `category_ids` / `shelf_name` / `author_ids`; send `[]` to clear categories; never send
  JSON `null` for `shelf_name`, `category_ids`, or `author_ids` -- **422**; never send `status`, reading fields, or
  loan-driving values); Field-linked **422**; `404` refetch; no-op rejection; deleted warning. List/detail display uses
  `formatBookAuthors` on structured `BookRead.authors` (`BookAuthorRead[]`).
- ISBN camera capture lazy-loaded from `/books/new` only; hardware-scanner capture under `src/features/scanning/`
  for create lookup on `/books/new` and collection jump on `/dashboard`, `/books`, and `/loans`
  (`useCollectionIsbnJump`). Collection jump opens a unique match or filters `/books?isbn=`; it never creates or
  checks out from scan success alone. There is no checkout capture surface.
- Checkout on book details via `CheckoutDialog` (`POST /books/{book_id}/checkout`); eligibility via `isCheckoutEligible`
  (`status === 'available'`); borrower and notes only (timestamps computed client-side);
  Field-linked **422**; `404`/`409`/`412` stale-state refetch with preserved borrower/notes. Display-only **412** does
  not offer alternate copies. `/checkout` is a compatibility redirect (`LegacyCheckoutRedirect`), not a product page.
- Check-in and loan history on `/loans` via `CheckinForm` (`POST /books/{book_id}/checkin`); eligibility via
  `findActiveLoan` / `isCheckinEligible` (not book `status` alone); blank return time omits body; active vs returned
  sections with due/overdue labels and durable `Book {id}` fallback. `/checkin` is a compatibility redirect, not a
  product page.
- Reading completion and later edits (`/books/:bookId/mark-read`, `/books/:bookId/reading`); initial unread-to-read
  via `POST /books/{book_id}/mark-read` only; later edits via `PATCH`; no mark-unread. Collection cards show Read/Unread
  plus rating (`N / 5`, or an em dash when null).
- Hard delete on `/books/:bookId/delete` (`DELETE /books/{book_id}` permanently removes the book). On-loan blocking via
  `status === 'on_loan'` or `findActiveLoan`. Hard delete also invalidates `queryKeys.collections.all` (server removes
  collection memberships). Database backup is an operator workflow, not a browser API or product page; never inspect,
  log, cache, or upload dump contents.
- Shelves catalog CRUD on `/shelves` (`shelvesApi` / `useShelves` / write mutations) with system-shelf protection
  (`unknown` / `removed`); book payloads use `shelf_name` (string; no hard-coded `Shelf` enum). Title Case
  `common_name` labels; `unknown` allowed on books; `removed` excluded except edit may surface current membership.
  Shelf rows show counts from `useDashboardBreakdowns` `by_shelf` and deep-link into `/books?shelf_name=`. No shelf
  CRUD on book forms.
- Wishlists on `/wishlists` (`wishlistsApi` / `useWishlists` / `useWishlistBooks` / write mutations): Collection-drawer
  link, nested memberships joined via `GET /books/{book_id}` (not `GET /books`), add via unshelved `POST /books` (omit
  `shelf_name`; `author_ids` required -- text input resolved/reused/created via `useAuthors` / `useCreateAuthor`) then
  `POST /wishlists/{id}/books`, and move-to-shelf via `MoveWishlistBookToShelfControl` /
  `useMoveWishlistBookToShelf` (membership `DELETE` then `PATCH { shelf_name }`). Shelf/wishlist exclusivity is
  enforced with documented **412** responses. Membership contextual descriptions are editable through
  `PATCH /wishlists/{id}/books/{wishlist_item_id}` with `WishlistBookUpdate.notes`; `null` clears notes.
- Curated Collections on `/collections` (`collectionsApi` / `useCollections` / `useCollectionBooks` / write
  mutations): Collection-drawer link, create/edit/delete collections (`useUpdateCollection` for name/description;
  blank description clears via explicit JSON `null`), add shelved catalog books via `GET /books` search then
  `POST /collections/{id}/books`, update membership notes/reorder/remove memberships, and join title/authors via
  `GET /books/{book_id}`. `CollectionBookUpdate` preserves omitted fields and accepts `notes: null` to clear notes.
  Membership lists show shelved and wishlisted books (**Wishlist** location when `on_wishlist`; membership
  `shelf_name` may be JSON `null` for unshelved rows -- do not expect BookRead's synthesized `"unknown"`);
  duplicate add is **409**; library delete drops memberships server-side
  (`useDeleteBook` invalidates `queryKeys.collections.all`). Orthogonal to shelf/wishlist placement (no
  shelf/wishlist overlap **412**; no move-to-shelf on collection rows). Book Details adds the current active book via
  `AddBookToCollectionDialog` (`useAddCollectionBook` with the detail `book.book_id`; no catalog search).
- Book covers via authenticated `GET` / `PUT` / `DELETE /books/{book_id}/cover` (`booksApi.getCover` / `uploadCover` /
  `removeCover`, `useBookCover` / `useUploadBookCover` / `useRemoveBookCover`, `queryKeys.bookCovers`). Shared
  `BookCover` (lazy authenticated blob + status stamp + placeholder) on Book Details, Books list, Home New
  Additions / Staff Picks, and Collections memberships; upload/remove via `BookCoverManager` on Book Details.
  Backend resolves local vs ISBN Open Library artwork server-side (**200** image bytes or **404**); the SPA must
  not invent `cover_image_path` browser URLs or call Open Library directly. Never set covers through create/update
  JSON. Cover downloads share one six-request concurrency limit, preserve cancellation while queued or active, and
  lazy-load with a 100-pixel viewport margin. A database-pool **503** remains a transient query error; it is not a
  no-cover result, and a later remount or explicit invalidation may retry it.
- `booksApi.list` / `useInfiniteBooks` / `useBooks` wire `author` / `title` / repeated `category_id` / `isbn` /
  `shelf_name` / `is_read` (plus sort/pagination) through the centralized Books URL model (`booksListModel`). Broader
  contract filters (publisher, ranges, `status`, etc.) stay out unless a product need explicitly requires them.
  Collection browse also supports URL-backed `?isbn=` (hardware jump or deep link) and `?cleanup_field=` (Dashboard
  healing).
- Quality gate: Playwright (`playwright.config.ts`) with axe accessibility checks, isolated stateful API fixtures
  under `e2e/support/`, MVP and lifecycle browser journeys, mock/fixture coverage of documented status and error
  families, enforced V8 coverage thresholds, and Playwright in the canonical `make check` gate. Hardware-scanner and
  evergreen-browser manual checks remain in this document (scanner and browser-support matrices below). Product
  routes are fully implemented (no `RoutePlaceholder` feature pages).
- Continuous integration: `.github/workflows/check.yml` for pull requests and pushes to `main` (Node from `.nvmrc`,
  Corepack/Yarn, immutable install, Playwright Chromium, dummy `VITE_API_SECRET_KEY=test-api-token`, canonical
  `make check`) and main-entry gzip budget enforcement via `scripts/checkBundleSize.mjs` (`yarn bundle:check` /
  `make bundle-check`, included in `make check`). The default workflow does not retain `dist/`, coverage, Playwright
  reports, or secrets as artifacts. Host-owned HTTPS/CSP, SPA fallback, and production configuration notes live in
  `README.md`.
- Deployed-development container: `ci/Containerfile` (runtime-only `nginx:1.31-alpine`, HTTP 8080, copies host-built
  `dist/`, no Node/Yarn/Vite stage, no `.env` COPY), `ci/nginx.conf` (SPA `try_files`, no-cache `index.html` /
  `config.js`, long-lived hashed `/assets/`), `ci/container-entrypoint.sh` (start-time `config.js` from
  `SHADE_API_BASE_URL`, `SHADE_DIAGNOSTICS_ENABLED`, `SHADE_DIAGNOSTICS_ENDPOINT`), `.containerignore`, and Make
  `ci` / `ci/build-local.sh` (image `shade-frontend`, tags `latest` and `package.json` `version`). This is
  Compose-oriented development with the backend, not host Vite and not production. Do not add containerized Vite/HMR or
  collapse production into this image.
- Versioned release artifacts: `scripts/packRelease.ts` and Make `publish` / `ci/build-prod.sh` (`yarn release:pack`)
  package host-built `dist/` as gitignored `ci/artifacts/shade-frontend-<package.json version>.tar.gz` plus a SHA-256
  sidecar and a release manifest (version, commit, build time, runtime-config shape, hosting requirements). Packing is
  opt-in (not default CI upload). Production is the tarball plus the deployment repository, not another Podman image.
  HTTPS/CSP, atomic install, supervision, and rollback remain host-owned (`README.md`).

Prefer dedicated lifecycle endpoints; never simulate checkout, check-in, initial mark-read, mark-played, cover
upload/delete, or album artwork upload/delete/refetch with generic `PATCH`. Sequenced feature tickets live under
`docs/tickets/` while open and are removed after completion. Open sequenced work currently includes
`docs/tickets/FEAT-01_long-titles.md` and `docs/tickets/FEAT-02_album-support.md`. Informal UI feedback such as
`docs/tickets/ui-nits.md` is not a sequenced build ticket -- treat it as notes unless the user asks to implement items
from it. When no sequenced feature ticket remains (directory holds only `.gitkeep` and/or informal notes), wait for an
explicit request rather than inventing the next feature. Do not invent undocumented routes, realtime channels, or
lifecycle shortcuts. Never invent a second telemetry transport or fabricate correlation IDs.

Product intent, sequencing, and acceptance criteria live under `docs/`. Prefer the current sequenced ticket (when one
exists), then the product requirements docs when deciding what to build next. Album UI is `FEAT-02`; do not start it
from the shipped album contract alone.

## Technology

- React 19
- TypeScript 6 in strict mode
- Vite 8
- React Router 7 (`react-router-dom`), integrated in `src/main.tsx`
- TanStack React Query 5 (`QueryClientProvider` mounted under `AppProviders` with configured client defaults,
  books/loans/dashboard/shelves/categories/authors/wishlists/collections hooks including infinite-list pagination where
  applicable, and mutation detail-cache writes)
- `openapi-typescript` for generating `src/api/generated/openapi.ts` from the checked-in OpenAPI document
- `@zxing/browser` + `@zxing/library` for camera ISBN decode (lazy-loaded from `/books/new` only; not on the critical
  path for ordinary navigation)
- Vitest with jsdom
- Testing Library and jest-dom
- Playwright (`@playwright/test`) with `@axe-core/playwright` for browser journeys and accessibility checks
  (`yarn test:e2e`; included in `make check`)
- Vitest V8 coverage with enforced global floors (statements 87%, branches 80%, functions 92%, lines 87%)
- ESLint flat configuration
- Yarn 4 through Corepack (`yarn@4.18.0` in `package.json`)
- Node.js 26.7.0
- Make command wrappers

The package uses native ECMAScript modules through `"type": "module"`. No Next.js, Tailwind, component library, or form
library.

## Backend Contract

The backend is a separate repository. Default local API base is `http://127.0.0.1:8000` with **no** `/api` prefix. Treat
these as complementary sources of truth:

- `docs/technical-reference/openapi.json`: paths, methods, status codes, request/response schemas, enums, nullability
  (OpenAPI 3.1; LibraryV2; currently `info.version` `1.0.16`). Prefer generating or fixture-checking TypeScript models
  from this file.
- `docs/technical-reference/API-for-FE.md`: behavioral guidance OpenAPI does not fully express (auth, CORS, error
  meanings, lifecycle rules, ISBN quirks, album lookup/artwork/circulation, mixed wishlists, book covers **200** image
  bytes / multipart semantics, SQL backup dump handling, FE vs API ownership). Prefer this document (and live
  router/`detail` strings) when OpenAPI is incomplete for a shared status code, or when a schema shows `null` as
  allowed but validators reject it at runtime.

Compare with a running backend `/openapi.json` before locking transport types; record drift as a blocker rather than
inventing frontend semantics. Do not invent backend behavior from product docs alone. There is no separate backend
handoff: OpenAPI plus `API-for-FE.md` are the contract; `docs/tickets/FEAT-02_album-support.md` is the frontend album
implementation ticket.

### Backend 1.0.16 contract (2026-09-03)

The checked-in contract matches backend **1.0.16**. Album catalog CRUD, soft-delete/restore, artist/genre catalogs,
checkout/check-in/mark-played, Discogs/MusicBrainz lookup, private artwork get/upload/delete/refetch, additive
dashboard album fields, and typed mixed wishlist membership are shipped. Existing book, wishlist-book, and collection
HTTP shapes stay compatible; album collection membership is not shipped.

`FEAT-02` now activates the album catalog UI: `/albums` browse, add, detail, and edit routes; artist/genre-backed
metadata entry and release lookup; private artwork management; checkout/check-in, mark-played, soft-delete/restore,
album loan history, separate dashboard listening statistics, and typed mixed-wishlist API/query support. The Vite
development proxy includes `/albums`, `/artists`, and `/genres`. Collections remain book-only. Existing book-specific
wishlist rendering and notes editing remain isolated from album membership operations.

Identifier and loan rules from 1.0.8 remain in force:

- All book responses use `book_id` (no `id` alias); exact-ID list requests use `book_id`, with `bookId` in list query
  keys.
- Wishlist memberships use `wishlist_item_id` for notes/removal/moves. Their `book_id` and `album_id` fields are
  nullable; book rows have non-null `book_id` and null `album_id`. Book controls guard these references.
- Loans retain their own `id`. Exactly one of `book_id` / `album_id` is non-null. The global Loans page requests
  `media_type=book`; per-book history uses `book_id`. Loan wrappers/hooks/cache keys support `bookId`, `albumId`, and
  `mediaType`. Never substitute `album_id` into book detail or check-in URLs.
- Duplicate wishlist adds (**409**) refresh membership queries without optimistic duplicates. A destination conflict
  preserves the source membership and notes.
- React Query state is memory-only, so a hard reload fetches current response shapes without a persistence migration.

Book-only UI still needs the shared shelf/error adjustments: exclude `removed` from every placement picker; surface
mixed-media **412** detail (`A book cannot be placed on an album shelf`, `Books cannot be added to an album
collection`) without inventing a shelf `media_type` field. Shelf delete **409** applies when books or albums remain.

Deploy frontend album UI with matching backend 1.0.16 and the separately rehearsed retained-data migration (including
`album_artwork`). The frontend cannot compensate for an older database schema.

When implementing `FEAT-02`, treat that ticket plus OpenAPI and `API-for-FE.md` as the work plan: add `/albums`,
`/artists`, and `/genres` to the optional Vite proxy when the browser first needs them; lookup then resolve
artists/genres then create; serve artwork only through authenticated album artwork routes; keep typed identifiers
distinct; use `GET /wishlists/{wishlist_id}/items` for mixed lists (book notes stay on the book membership PATCH);
keep collections book-only; add album dashboard widgets as separate album statistics.

### Book identifiers (`id` vs `book_id`)

- Catalog rows expose identity as `BookRead.book_id` (UUID string). There is no `id` alias on `BookRead`.
- Path `/books/{book_id}` and lifecycle routes require a GUID: **400** when empty or malformed (including
  spreadsheet-style codes like `SL-0001`); **404** when the GUID is well-formed but unknown.
- Child resources keep the FK field name `book_id` (loans query `?book_id=`, wishlist membership create/read,
  collection membership create/read). Values are the same UUID as `BookRead.book_id`.
- Frontend helpers: `isGuid` (`src/api/guid.ts`), `isBookIdentityError` / `isMalformedBookId`
  (`src/api/bookIdentity.ts`). Treat **400** and **404** from book-identity lookups as "book not available".
- Do not hard-code `SL-*` deeplinks or fixtures against a live API. Unit/e2e mocks may still use opaque strings
  when they do not enforce GUID validation.

### Authors (normalized resources; OpenAPI `0.2.12+`, checked-in `info.version` currently `1.0.16`)

Authors are backend data, not free-form book text. Books no longer store a string `authors` field on create/update.

- `GET /authors`: authenticated; returns `{ "items": [...], "total": <int> }` (`AuthorList` in OpenAPI). No `skip` /
  `take`; always the full catalog ordered by surname, first name, then `author_id`.
- Author catalog CRUD: `POST /authors` (**201**), `GET /authors/{author_id}`, `PATCH /authors/{author_id}`,
  `DELETE /authors/{author_id}` (**204** when unreferenced). Referenced authors return **409**
  `{"detail": "Author is referenced by one or more books"}`.
- `BookRead.authors`: structured `BookAuthorRead[]` (`author_id`, `first_name`, `surname`) preserving book order.
- `BookCreate.author_ids`: required array with at least one author GUID. `BookUpdate.author_ids`: omit to preserve
  membership; send a non-empty ordered list to replace. `author_ids` may not be null, empty, or contain duplicates.
  Unknown IDs return **422** with object `detail` (`message` plus missing `author_ids`).
- `GET /books?author=` remains a text filter for frontend convenience; it searches normalized author names
  (case-insensitive substring over linked `first_name` + `surname`). Default sort is `sortBy=author` ascending using the
  first-listed author's surname and first name.
- `GET /books/lookup` draft may include textual `draft.authors` from the metadata provider; that does not create author
  records. Resolve/reuse matching authors or create them with `POST /authors` before `POST /books`.
- Do not hard-code author names. Load vocabulary from `GET /authors` (`useAuthors`) and submit stable GUIDs as
  `author_ids`. Frontend author catalog admin (create/edit/delete outside inline book flows) is out of V1.

SPA surface: `authorsApi` / `authorsQueries`, `authorDisplay.formatBookAuthors`, create/edit/wishlist author pickers,
inline `useCreateAuthor` on ISBN lookup apply and wishlist add, and list/detail/join display. Do not send free-form
author strings on `BookCreate` / `BookUpdate`.

### Categories (normalized resources; OpenAPI `0.2.8+`, checked-in `info.version` currently `1.0.16`)

Categories are backend data, not a fixed frontend enum. Checked-in OpenAPI does not define a singular `Category`
string enum.

- `GET /categories`: authenticated, unpaginated JSON **array** of `CategoryRead` (`category_id`, `name`, `slug`,
  `created_date`, `updated_date`); same list pattern as `GET /shelves`.
- `BookRead.categories`: array of `BookCategoryRead` (`category_id`, `name`, `slug`). A book may have zero, one, or
  many memberships.
- `BookCreate.category_ids` / `BookUpdate.category_ids`: array of category GUIDs. Create may omit or send `[]`
  (zero categories allowed). On update: omit to preserve memberships; send `[]` to clear; send a list to replace.
- `GET /books` accepts repeated `category_id` query params. One value requires membership in that category; multiple
  values use **AND / intersection** (book must belong to every requested category). Duplicate IDs are rejected.
  Blank/absent selection sends no category filter. Unknown or malformed IDs follow the OpenAPI contract; a valid
  selection with no matches returns an empty `BookList`, not **404**.
- Do not hard-code category names or slugs. Load vocabulary from `GET /categories` (`useCategories`) and submit stable
  GUIDs as `category_ids`. Frontend category catalog admin (create/rename/merge/delete) is out of V1.
- Dashboard: `by_category` buckets use category display names; a multi-category book contributes once per applicable
  bucket. Incomplete-metadata "missing category" means **no memberships** (empty `categories`, not a sentinel string).

SPA surface: generated types, `categoriesApi` / `useCategories`, create/edit multi-assignment, Books multi-`category_id`
URL filters, and list/detail display. Do not use a singular `category` / `Category` enum.

### Catalog list filters (`GET /books`)

Optional filters form one composable catalog-query surface (AND across different filter types). They compose with
  supported sorting, and `skip` / `take`. No matches → empty `BookList` (`items: []`, `total: 0`),
not **404**. When paginated, `total` remains the full matching count.

Documented filter families (see OpenAPI + `API-for-FE.md` for exact params and status codes):

- Text (case-insensitive substring except `isbn`): `isbn` (literal substring on stored `isbn13`), `author`, `title`,
  `publisher`, `acquisition_source`. Blank/whitespace text filters → **400**.
- Exact/state: `book_id` (Book GUID; malformed → **400**; well-formed miss → empty list), `shelf_name`
  (trimmed/lowercased membership; unknown valid name → empty list), `is_read`, `status`, repeated `category_id`
  (above).
- Inclusive numeric ranges (either bound alone; inverted range → **400**): `pages_*`, `rating_*`,
  `purchase_price_*`, `publication_year_*`.
- Inclusive `YYYY-MM-DD` date ranges (either bound alone; invalid syntax → **422**; inverted → **400**):
  `purchase_date_*`, `completion_date_*`, `creation_date_*`, `updated_date_*`.

Intentionally not normal V1 list filters: `notes`, `review`, `tags` (JSON text), and derived loan stats
(`times_borrowed`, `last_borrowed_at`, `average_loan_days`).

**Books URL filters:** collection browse wires `author` / `title` / repeated `category_id` / `isbn` / `shelf_name` /
`is_read` / `cleanup_field` (plus sort) through the centralized Books URL model. Visible controls cover category /
author / title / read status / sort; `shelf_name` and ISBN stay URL/deep-link/hardware driven. Broader contract filters
(publisher, ranges, `status`, etc.) stay out unless a product need explicitly requires them. Do not invent page-local
filter stacks.

### Book covers (OpenAPI `0.2.11+`)

Authenticated cover routes: `GET` / `PUT` / `DELETE /books/{book_id}/cover`. Behavioral detail lives in
`docs/technical-reference/API-for-FE.md` (Book covers). Cover resolution -- including the Open Library ISBN fallback
-- happens server-side behind the authenticated cover endpoint.

- `BookRead.cover_image_path`: optional **filename** (e.g., `{book_id}.webp`), not a URL and not browser-ready. Set
  only by successful `PUT`; cleared by `DELETE`. Create/update JSON cannot set it. Non-null means a local file exists;
  `null` does **not** mean "no cover" -- `GET` may still return an ISBN-derived cover fetched server-side.
- `PUT /books/{book_id}/cover`: multipart form field `file` (required); JPEG / PNG / WebP only; max **10 MB**; empty or
  bytes/type mismatch → **422** (string `detail`); success **200** `BookRead` with updated `cover_image_path`.
- `DELETE /books/{book_id}/cover`: clears on-disk files and `cover_image_path` (**204**).
- `GET /books/{book_id}/cover`: (1) local file → **200** image bytes + matching `Content-Type`; (2) no local file but
  `isbn13` and Open Library returns usable artwork → backend fetches server-side and returns **200** image bytes;
  (3) otherwise → **404** `"Book cover not found"`; missing book → **404** `"Book not found"`. Local
  uploads win over ISBN-derived artwork. Open Library timeout/network/missing/non-image responses resolve to the
  normal **404** cover state.
- Database-pool saturation may return **503** with `Retry-After: 1`. Keep that as an error rather than a successful
  no-cover result. Cover queries do not automatically retry; a later remount or explicit invalidation may retry.
- Missing books reject cover get/upload/delete (**404**), same as checkout / check-in / mark-read / `PATCH` /
  bulk shelf move.
- Browser `<img src>` cannot send `Authorization`. Use authenticated `fetch` to `GET /books/{book_id}/cover`: **200** →
  `response.blob()` + object URL (revoke on cleanup); **404** → intentional placeholder. Do not invent URLs from
  `cover_image_path`. Do not call Open Library from the SPA.
- Non-JSON binary responses today: `GET /books/{book_id}/cover` (image bytes) and
  `GET /albums/{album_id}/artwork` (image bytes; no SPA caller until `FEAT-02`).

SPA surface: `booksApi` cover helpers, React Query hooks, shared `BookCover`, `BookCoverManager` on Book Details, and
cover display on Books / Home / Collections. Extend those surfaces; do not invent a second cover client.

### Authority when sources disagree

1. Current repository contents
2. Current ticket and its acceptance criteria
3. Running backend `/openapi.json`, when relevant
4. Checked-in `docs/technical-reference/openapi.json`
5. `docs/technical-reference/API-for-FE.md`
6. This document and other planning docs

### Authentication

- Shared Bearer token: `Authorization: Bearer <API_SECRET_KEY>`
- Protected browser requests send only the shared Bearer token; tenant headers are proxy-owned.
- Public `GET /health`, `GET /ready`, and `GET /version` omit authentication (`authenticated: false`).
- No login, logout, user accounts, sessions, or roles
- Token comes from a repository-root `.env` file via `VITE_API_SECRET_KEY`; Vite injects it at dev-server and
  production build time into JS bundles (`.env` stays gitignored; `.env.example` is committed)
- Fail-fast bootstrap: `readApiToken()` in `src/main.tsx` throws before the app shell mounts when the variable is
  missing or blank
- No `sessionStorage`, no connection settings screen, and no runtime token entry
- Missing or invalid credentials return `403`; describe generically as "API access was rejected"
- On `403`, show a page-level error via `QueryErrorState` / `formatApiQueryError`; do not clear the query cache or
  loop back into loading
- Startup connectivity checks public `GET /health` first and tenant-aware `GET /ready` second; do not verify auth with
  `GET /protected`
- `GET /ready` verifies the selected tenant's database readiness and may return **503** with `Retry-After: 1`; do not
  poll it
- Use public `GET /version` for the footer API release string only; do not treat it as a health probe
- Never commit the token, put it in URLs, log Authorization headers, or send it to analytics
- A build-time token in JS bundles is inspectable by anyone with device or artifact access; that is an accepted risk
  for this trusted personal deployment and is not real multi-user authentication

### Lifecycle endpoints (never simulate with generic PATCH)

| Operation          | Endpoint                                       |
|--------------------|------------------------------------------------|
| Create             | `POST /books`                                  |
| Edit metadata      | `PATCH /books/{book_id}`                            |
| Delete             | `DELETE /books/{book_id}`                           |
| Checkout           | `POST /books/{book_id}/checkout`                    |
| Check-in           | `POST /books/{book_id}/checkin`                     |
| Mark read          | `POST /books/{book_id}/mark-read`                   |
| Bulk move to shelf | `POST /books/bulk/move-to-shelf`               |
| Cover get          | `GET /books/{book_id}/cover`                        |
| Cover upload       | `PUT /books/{book_id}/cover` (multipart `file`)     |
| Cover delete       | `DELETE /books/{book_id}/cover`                     |
| ISBN lookup        | `GET /books/lookup?isbn={isbn}`                |
| Bulk ISBN lookup   | `POST /books/bulk/lookup` (API only; no SPA)    |
| Bulk import        | `POST /books/bulk/import` (API only; no SPA)    |
| Album catalog      | `/albums` CRUD + restore (no SPA until `FEAT-02`) |
| Album circulation  | album checkout / check-in / mark-played (no SPA until `FEAT-02`) |
| Album lookup       | `GET /albums/lookup` (no SPA until `FEAT-02`) |
| Album artwork      | album artwork GET/PUT/DELETE/refetch (no SPA until `FEAT-02`) |
| Artists / genres   | `/artists`, `/genres` CRUD (no SPA until `FEAT-02`) |
| Mixed wishlist     | `GET .../items` and album membership routes (no SPA until `FEAT-02`) |

Bulk shelf move is atomic: validate destination and every selected book before changing any membership. Do **not**
implement bulk movement by looping individual `PATCH /books/{book_id}` requests. Destination follows ordinary `shelf_name`
rules (`unknown` allowed; `removed` rejected). Wishlist conflict → documented **412** (API does not auto-remove
wishlist membership). Do **not** set covers through create/update JSON (`cover_image_path` is read-only); use cover
`PUT` / `DELETE` only.

### Frontend compensations for known backend limits

- Validate ISBN-10 check digits (backend does not do this correctly).
- Send normalized `YYYY-MM-DD` dates and UTC ISO 8601 timestamps.
- Do not send `null` for required DB fields (title, `author_ids` on create, shelf_name on create, is_read, status).
  Category membership is optional (`category_ids` omit/`[]` allowed); never send a singular `category` enum field. JSON
  `null` `shelf_name`, `category_ids`, or `author_ids` on book update is **422** (omit those fields instead; OpenAPI
  may still show `null` as a schema option). Do not set covers through create/update JSON -- use
  `PUT` / `DELETE /books/{book_id}/cover`.
- Load shelves from `GET /shelves` for book placement; send selected `common_name` as `shelf_name` (never Title Case
  display strings). Collection create on `/books/new` requires an explicit shelf. Wishlist-only catalog rows omit
  `shelf_name` on `POST /books`. Manage the catalog on `/shelves` with documented `POST` / `PATCH` / `DELETE` (do not
  invent shelf CRUD on Add/Edit Book).
- Load categories from `GET /categories` (`useCategories`); submit GUIDs as `category_ids`. Load authors from
  `GET /authors` (`useAuthors`); submit ordered GUIDs as `author_ids`. Do not hard-code category or author vocabulary
  or invent hard-coded labels as fake options.
- Prevent blank title, at least one author (`author_ids`), borrower, and (on create) unselected shelf.
- Prevent deletion of on-loan books (backend allows it; frontend must not).
- Render unknown enum values safely (see `enumDisplayValue`).
- Display API-provided dashboard statistics; do not recalculate business metrics. If an average is `null`, show
  something like "Not enough data" -- do not invent zero. Do not combine book and album dashboard totals; ignore
  additive album keys until `FEAT-02` widgets exist.
- Surface mixed-media **412** detail on shelf or collection writes (`A book cannot be placed on an album shelf`,
  `Books cannot be added to an album collection`) and preserve form input. Shelves have no client `media_type` field.

### Scope

**In scope for MVP:** discovery Home at `/` with About at `/about`, dashboard (summary plus breakdown /
incomplete-metadata reports and Books deep links), active books with multi-`category_id` / author / title / ISBN /
`shelf_name` / `is_read` / cleanup-mode filtering and URL-backed sorting, bulk selection and atomic bulk
move-to-shelf, detail (including cover display/upload), manual/ISBN/camera/scanner add flows, hardware ISBN
collection jump on Dashboard / Books / Loans, edit, checkout on book details (display-only **412** messaging without
alternate-copy offers), check-in, loan history, reading tracking, hard delete, authenticated
SQL backup at the API host (not a browser download), runtime API config, CI, Podman preview, versioned production
artifacts, wishlists, wishlist move-to-shelf, curated Collections (create/edit/delete/add/reorder/remove on
`/collections`, plus Book Details add-to-collection), dynamic multi-category UI, Books filter plumbing through
`shelf_name` / `is_read` / cleanup deep links, cover images across book surfaces, and the regression / deployment
quality gate (`make check`).

**Out of scope unless explicitly requested:** album catalog/circulation/artwork/mixed-wishlist UI except as
`FEAT-02`, UPC, true multi-library tenancy, overdue notifications, Goodreads/StoryGraph, user accounts/roles, realtime
sync, loan CRUD, mark-unread, Build Mode bulk lookup/import UI (`POST /books/bulk/lookup`, `POST /books/bulk/import`),
frontend author/category/artist/genre catalog admin pages, and remote Ansible/systemd/TLS/rollback orchestration.
Categories are many-to-many via `GET /categories` and `category_ids`; authors are many-to-many via `GET /authors` and
`author_ids` -- do not hard-code taxonomy or invent a second filter stack. Broader catalog filters beyond the current
Books controls stay out unless a product need explicitly requires them. Collection browse (`BooksPage`) and loan
history (`LoansPage`) use infinite scroll with backend pagination; other callers still fetch unpaginated full lists
when needed.

Do not expand a ticket into out-of-scope features. Do not invent the next product feature merely because the API
supports it.

## Agent Operating Rules

- Work only inside the frontend repository.
- The related backend and orchestrator repositories may be read when cross-project context is necessary.
- Do not mutate Git state. Do not stage, unstage, commit, check out, push, pull, add, remove, or delete through Git. Ask
  before stashing or unstashing.
- Use read-only Git commands only when needed to understand the working tree or history.
- Do not overwrite or revert unrelated user changes.
- Use Yarn rather than npm.
- Do not edit `yarn.lock` manually; update dependencies through Yarn.
- Keep secrets, local databases, dependencies, coverage, and build output untracked.
- Make focused changes and avoid unrelated refactoring.
- Add or update tests when behavior changes.
- Run checks appropriate to the change. Prefer the complete `make check` quality gate before handoff.
- Treat the existing implementation and requirements as evidence, not assumptions. Call out conflicts or unclear
  requirements instead of silently inventing behavior.
- Do not casually replace Yarn, Make, Vitest, or the existing quality gate. Extend `make check` rather than replace it.

When writing Markdown:

- Use straight quotation marks and apostrophes.
- Use `...` instead of the ellipsis character.
- Use `--` instead of an em dash and `-` instead of an en dash.
- Follow "e.g.," and "i.e.," with a comma.
- Keep lines at or below 120 characters, excluding Markdown tables.
- End files with a newline.

## Runtime Architecture

The browser startup and styling flow is:

```text
index.html
  -> /config.js (sets window.__SHADE_CONFIG__)
  -> src/main.tsx
       -> readApiToken() (fail fast when missing)
       -> readRuntimeConfig()
            -> on failure: RuntimeConfigScreen (retry)
            -> on success:
                 createDiagnosticReporter(runtime diagnostics + APP_VERSION from package.json)
                 RootErrorBoundary (reports redacted render failures)
                   -> AppProviders (shared DiagnosticReporter)
                        -> NotificationsProvider
                        -> QueryClientProvider (createQueryClient())
                        -> ConnectionProvider (createApiClient + onRequestFailure reporter, token, GET /health + /ready)
                             -> RouterProvider(router from src/routes/routes.tsx)
                                  -> AppShell (layout route)
                                       -> Suspense + Outlet (lazy feature route pages)
       -> src/index.css
            -> src/styles/tokens.css
            -> src/styles/base.css
            -> src/styles/shell.css
            -> src/styles/components.css
```

`index.html` creates the `#root` mount point, loads `/config.js`, then loads `src/main.tsx`. When runtime config is
valid, the bootstrap module creates a `DiagnosticReporter`, then renders `RouterProvider` inside `RootErrorBoundary`
and `AppProviders` in `StrictMode`. Missing or malformed config shows `RuntimeConfigScreen` instead of the shell.

`AppShell` owns document title updates (`{route title}` plus an em dash and ` Shade`), skip link, primary navigation
(Dashboard link; Collection `DrawerNavMenu` Browse/Manage/Collections/Wishlists; Circulation `DrawerNavMenu` Loans
only; brand is `Shade_Library_Header.webp` linking to Home `/`), the main `Outlet`, footer (`Release` from
`package.json` `version` via `APP_VERSION`, plus API version from public `GET /version` when available), and heading
focus after client-side navigations. Live product UI today: `/` (`HomePage` discovery with hero brand image, featured
categories, New Additions, Staff Picks, quotes, and cover display), `/about` (`AboutPage` + `CatalogGuide`),
`/dashboard` (`DashboardPage` with desk/paper panels for summary, breakdown, and incomplete-metadata counts, Books
cleanup deep links, and hardware collection ISBN jump), `/books` (`BooksPage`, including cover thumbnails, Read/Unread
and rating on collection cards, URL-backed filters including `?isbn=` / `?shelf_name=` / `?is_read=` /
`?cleanup_field=`, bulk selection / bulk move-to-shelf, and collection ISBN jump), `/collection/manage`
(`ManageCollectionPage` hub for Add Book / Shelves, with decorative pen asset),
`/books/:bookId` (`BookDetailsPage`, including `BookCover` / `BookCoverManager`, reading-field display, gated Check
Out via `CheckoutDialog`, Check In, Mark Read / Edit Reading / Edit Book / Delete Book), `/books/new` (`NewBookPage`
+ `BookForm` / `bookFormModel` with ISBN lookup plus camera/hardware scanner capture), `/books/:bookId/edit`
(`EditBookPage` + `bookEditModel`), `/books/:bookId/delete` (`DeleteBookPage`), `/books/:bookId/mark-read`
(`MarkReadPage` + `markReadModel`), `/books/:bookId/reading` (`ReadingEditPage` + `readingEditModel`), `/checkout`
(`LegacyCheckoutRedirect` to `/books` or `/books/{book_id}?checkout=1`), `/checkin` (`LegacyCheckinRedirect` to `/loans`,
forwards search), `/loans` (`LoansPage` + `CheckinForm` + `loanTemporal` + collection ISBN jump), `/shelves`
(`ShelvesPage` + `useShelves` / write mutations + `by_shelf` counts / Books deep links), `/wishlists` (`WishlistsPage` + `AddWishlistBookControl` + `MoveWishlistBookToShelfControl`;
memberships via `useBook` / `GET /books/{book_id}`), and `/collections` (`CollectionsPage` + `AddCollectionBookControl` +
`CollectionMembershipRow` with cover display; memberships via `useBook` / `GET /books/{book_id}`). Feature routes use
dedicated page components; `RoutePlaceholder.tsx` exists as an unused helper only.

TypeScript checks source code but emits no JavaScript. Vite transforms modules during development and creates the
production bundle. The CSS import order is intentional: later layers use tokens and defaults declared by earlier layers.

## Project Structure

This inventory covers every project-owned file outside `docs/`. Do not assume generated or dependency directories are
source code. In particular, omit `node_modules/`, `dist/`, `coverage/`, `.vite/`, `.yarn/`, and `.git/` from normal code
changes. Prefer regenerating `src/api/generated/openapi.ts` with `yarn api:generate` rather than hand-editing it.

### Browser Application

- `index.html`: Vite's HTML entrypoint. Defines page metadata, creates `#root`, loads `/config.js`, then `src/main.tsx`.
- `public/config.js`: Runtime config assigned to `window.__SHADE_CONFIG__` (`apiBaseUrl`, optional
  `diagnostics: { enabled, endpoint }`). Not bundled; edit for local or deployed environments. Diagnostics default to
  `enabled: false` / `endpoint: null` so reporting can be enabled or retargeted without rebuilding. Application release
  comes from `package.json` `version` (not runtime config).
- `public/favicon.png`: Static favicon served as-is (not bundled).
- `src/main.tsx`: Browser bootstrap. Calls `readApiToken()` (throws when missing), reads runtime config, either mounts
  `RuntimeConfigScreen` or creates `createDiagnosticReporter` (using `APP_VERSION`) then mounts `RootErrorBoundary` ->
  `AppProviders` -> `RouterProvider` in `StrictMode`, and imports global CSS.
- `src/AppProviders.tsx`: Application-wide providers. Wraps `NotificationsProvider`, `QueryClientProvider`
  (`createQueryClient()`), and `ConnectionProvider` (requires validated `runtimeConfig` and shared
  `diagnosticReporter`).
- `src/RootErrorBoundary.tsx`: Class error boundary with a recoverable fallback (retry and return home); reports
  redacted render failures through `diagnosticReporter.reportRenderFailure()`.
- `src/vite-env.d.ts`: Adds Vite client, asset, `__APP_VERSION__`, and `window.__SHADE_CONFIG__`
  (`diagnostics?: unknown`) declarations to TypeScript. It has no runtime behavior.
- `src/assets/`: Bundled WebP brand and page imagery imported by feature/layout modules:
  `Shade_Library_Header.webp` (`AppShell` brand), `Shade_Library_Hero.webp` (Home hero → `/about`),
  `Dashboard_Background.webp` (Dashboard desk CSS variable), `Manage_Collection_Pen.webp` (Manage Collection
  decorative pen). `Books_List_Glasses.webp` and `Loans_Stamp.webp` remain in the tree but are currently unused
  (removed from Books / Loans page markup).

### Runtime Configuration

- `src/config/appVersion.ts`: Exports `APP_VERSION` from `package.json` `version` (injected at build/dev time via
  Vite `define` in `vite.config.ts`).
- `src/config/runtimeConfig.ts`: Validates and normalizes `apiBaseUrl` and optional `diagnostics`
  (`RuntimeDiagnosticConfig`: `enabled`, `endpoint`); throws `RuntimeConfigError`. Omitted `diagnostics` defaults to
  disabled with a null endpoint; when `enabled` is true, `endpoint` must be a valid HTTP(S) URL. Does not own release
  versioning (`package.json` / `APP_VERSION` does).
- `src/config/runtimeConfigState.ts`: `readRuntimeConfig()` returns `{ config, error }` without throwing.
- `src/config/RuntimeConfigScreen.tsx`: Blocking UI when config is missing or invalid, with retry.
- `src/config/apiToken.ts`: `readApiToken()` reads `import.meta.env.VITE_API_SECRET_KEY` (trimmed); throws
  `ApiTokenError` when missing or blank.

### Diagnostics (extend, do not replace)

- `src/diagnostics/diagnosticReporter.ts`: `createDiagnosticReporter({ config, release })` returns a
  `DiagnosticReporter` with `reportApiFailure` / `reportRenderFailure`. Callers pass `APP_VERSION` as `release`. When
  disabled or endpoint is null, methods are no-ops. Enabled reporters POST allowlisted JSON (`api_request_failure` or
  `render_failure`) after `assertSafeApiDiagnostic`; fetch failures are swallowed so diagnostics never interfere with
  recovery. Do not invent a second telemetry transport or fabricate correlation IDs.
- `src/diagnostics/diagnosticReporter.test.ts`: Disabled/enabled reporting, redaction assertions, and failure
  isolation coverage.
- Wiring: `main.tsx` creates the reporter; `RootErrorBoundary` reports render failures; `ConnectionProvider` passes
  `onRequestFailure` into `createApiClient` so API failures call `reportApiFailure`; `renderAppTree` supplies a
  reporter in tests.

### API Layer

- `src/api/generated/openapi.ts`: Generated OpenAPI types. Do not hand-edit; use `yarn api:generate` / `yarn api:check`.
- `src/api/apiTypes.ts`: Exported schema aliases (`BookCreate` / `BookUpdate` / `BookRead` / `BookList`, lookup, loan,
  `BulkShelfMoveRequest` / `BulkShelfMoveResponse`, `DashboardSummary` / `DashboardBreakdowns` /
  `DashboardCountBucket` / `DashboardIncompleteMetadata`, health, version, `AuthorRead` / `AuthorList` /
  `BookAuthorRead`, `CategoryRead` / `BookCategoryRead`, `ShelfCreate` / `ShelfUpdate` / `ShelfRead`,
  `WishlistCreate` / `WishlistUpdate` / `WishlistRead` / `WishlistList`, `WishlistBookCreate` / `WishlistBookRead` /
  `WishlistBookList` / `WishlistBookUpdate` / `WishlistBookStatus`, `CollectionCreate` / `CollectionUpdate` / `CollectionRead` /
  `CollectionList`, `CollectionBookCreate` / `CollectionBookRead` / `CollectionBookList` / `CollectionBookUpdate`,
  validation/error schemas, `Status`). Book payloads use `shelf_name` (string); there is no hard-coded `Shelf` enum.
  Catalog identity is `BookRead.book_id` (UUID); loans / wishlist / collection memberships reference that UUID as `book_id`.
  Wishlist and loan reads also expose nullable `album_id`; do not export album/artist/genre schema aliases from
  `apiTypes.ts` until `FEAT-02` consumes them. Dashboard summary/breakdown types include required album fields; fixtures
  may zero them. Book category memberships are `BookRead.categories` (`BookCategoryRead[]`); create/update use
  `category_ids` (GUID array). Book author memberships are `BookRead.authors` (`BookAuthorRead[]`); create/update use
  `author_ids` (ordered GUID array). There is no singular `Category` enum alias. `BookRead.cover_image_path` is an
  optional read-only filename (not a browser URL); covers are mutated only via `PUT` / `DELETE /books/{book_id}/cover`
  (helpers in `booksApi` / cover queries).
- `src/api/guid.ts` / `bookIdentity.ts`: GUID check for book path/query ids; `isBookIdentityError` /
  `isMalformedBookId` map API **400** / **404** for malformed or unknown book identity.
- `src/api/enumDisplay.ts`: `enumDisplayValue` for known vs unknown enum strings with a neutral fallback.
- `src/api/apiCallOptions.ts`: Shared optional `AbortSignal` options type used by typed route helpers.
- `src/api/apiClient.ts`: `createApiClient` with Bearer injection on authenticated
  requests, path joining at the configured base URL (no `/api`
  prefix), timeout (default 10s), caller `AbortSignal`, `get` / `request` / `getJson` / `requestJson`, empty `204`
  handling, invalid-JSON errors, `403` via `onUnauthorized`, and optional `onRequestFailure` for allowlisted/redacted
  diagnostic reporting of request failures. Cover get uses authenticated `client.get` + `response.blob()`; cover
  upload uses `client.request` with multipart `FormData` (do not force cover bytes through `requestJson`). Do not
  invent a second HTTP client for binary routes.
- `src/api/apiErrors.ts`: `ApiError` kinds (`unreachable`, `timeout`, `cancelled`, `unauthorized`, `validation`,
  `invalid_response`, `server`, `http`), optional `detail` / `correlationId` / `fieldErrors`,
  `mapValidationFieldErrors` for FastAPI `422 detail[]`, `formatApiQueryError` for page-level error messages
  (appends `Request ID:` only when `correlationId` is present), and `isUnauthorizedQueryError` for `403` handling.
  `correlationId` stays unset until the backend documents a safe source (do not invent a header or body field).
- `src/api/apiRedaction.ts`: Safe diagnostic projection and assertions so API/error logs never retain headers, tokens,
  borrower names, notes, reviews, ISBN drafts, backup contents, or full bodies.
- `src/api/requestFields.ts` / `dateTime.ts`: Documented request-field picking for typed helpers and reusable
  `YYYY-MM-DD` / UTC ISO 8601 normalizers used by form tickets. Book create/update pickers allowlist `category_ids` and
  `author_ids` (not singular `category` or free-form author strings). Author create/update pickers allowlist
  `first_name` / `surname` (`pickAuthorCreate` / `pickAuthorUpdate`). Bulk shelf-move picker allowlists `book_ids` /
  `shelf_name` (`pickBulkShelfMoveRequest`). Colocated unit tests cover both modules.
- `src/api/queryKeys.ts`: Shared React Query keys for books (`all`,
  `list({ includeDeleted, isbn?, author?, title?, categoryIds?, shelfName?, isRead?, skip?, take?, sortBy?,
  sortOrder? })`, `infiniteList({ includeDeleted, isbn?, author?, title?, categoryIds?, shelfName?, isRead?, sortBy?,
  sortOrder?, take })`, `detail(id)`, `lookup(isbn)`), loans (`all`, `list(bookId?, { albumId?, mediaType? })`,
  `infiniteList({ bookId?, albumId?, mediaType?, take })`, `detail(id)`), dashboard (`all`, `breakdowns()`,
  `incompleteMetadata()`,
  `incompleteMetadataBooks({ field?, skip?, take? })`), version, shelves (`all`, `list()` unpaginated), categories
  (`all`, `list()` unpaginated), and authors (`all`, `list()` unpaginated `{ items, total }` envelope). Blank/whitespace
  `isbn` / `author` / `title` / `shelfName` / category IDs / incomplete-metadata `field` are omitted from keys (trimmed
  when present; `categoryIds` de-duped and sorted). Wishlists: `all`, `list()` unpaginated, `books(wishlistId)`. Collections: `all`, `list()` unpaginated,
  `books(collectionId)`. Book covers: `bookCovers.all`, `bookCovers.detail(id)` (invalidated after upload/remove).
- `src/api/api.ts`: `createApi` aggregates typed helpers (`books`, `loans`, `shelves`, `categories`, `dashboard`,
  `health`, `version`, `wishlists`, `collections`) plus the underlying `client`.
- `src/api/categoriesApi.ts` / `categoriesQueries.ts`: `list()` (`GET /categories`) returns a plain `CategoryRead[]`
  array (no pagination params); `useCategories({ enabled? })` keyed by `queryKeys.categories.list()`.
- `src/api/authorsApi.ts` / `authorsQueries.ts`: `list()` (`GET /authors`) returns `AuthorList` (`items`, `total`; no
  pagination params); `get`, `create` (**201**), `update`, `remove` (**204**). Hooks: `useAuthors`, `useAuthor`,
  `useCreateAuthor`, `useUpdateAuthor`, `useDeleteAuthor`. Not wired through `createApi()` -- hooks construct
  `createAuthorsApi(apiClient)` directly. Create/update/delete invalidate `queryKeys.authors.all`.
- `src/api/booksApi.ts`: `list` (optional `isbn`, `author`, `title`, `categoryIds` as repeated
  `category_id`, `shelfName` → `shelf_name`, `isRead` → `is_read`, `skip`, `take`, `sortBy` including `shelf`,
  `sortOrder`; omit empty/whitespace text filters and blank category IDs; send `skip`/`take` together when
  paginating), `create`, `moveToShelf` (`POST /books/bulk/move-to-shelf`), `lookup`, `get`, `getCover` (authenticated
  binary → `Blob`), `uploadCover` (multipart `FormData` field `file` → `BookRead`), `removeCover` (**204**), `update`,
  `remove`, `checkout` (including documented **412** `Book is display only`), `checkin` (optional body),
  `markRead` (defaults to `{}`). Helpers accept optional `AbortSignal` and serialize only documented request fields
  (including `shelf_name`, `category_ids`, `author_ids`, and bulk `book_ids` / `shelf_name`). Do not use singular
  `category` query/body fields or free-form author strings on book payloads. Do not implement bulk move as per-book
  `PATCH` loops. Do not invent cover URLs from `cover_image_path`. Bulk lookup/import routes exist in OpenAPI but have
  no SPA callers yet.
- `src/api/loansApi.ts`: `list()` (`GET /loans`, optional `bookId` → `?book_id=`, `albumId` → `?album_id=`,
  `mediaType` → `?media_type=book|album`, optional `skip`/`take` together). The Loans page passes `mediaType: 'book'`.
  `get(id)` is `GET /loans/{id}`.
- `src/api/shelvesApi.ts`: `list()` (`GET /shelves`) returns a plain `ShelfRead[]` array (no pagination params);
  `create` (`POST` → **201**), `update` (`PATCH` → **200**), and `remove` (`DELETE` → **204**) serialize only
  documented `ShelfCreate` / `ShelfUpdate` fields.
- `src/api/dashboardApi.ts`: `get()` (`GET /dashboard`); `getBreakdowns()` (`GET /dashboard/breakdowns`);
  `getIncompleteMetadata()` (`GET /dashboard/incomplete-metadata`); `listIncompleteMetadataBooks({ field?, skip?,
  take? })` (`GET /dashboard/incomplete-metadata/books`; omit blank `field`; send `skip`/`take` together).
- `src/api/healthApi.ts`: `get()` for public liveness (`GET /health`) and `getReady()` for tenant-aware database
  readiness (`GET /ready`); both omit authentication.
- `src/api/versionApi.ts` / `versionQueries.ts`: `get()` public (`GET /version`, `authenticated: false`) and
  `useVersion` for the AppShell footer API release string (not a health probe).
- `src/api/queryClient.ts`: `createQueryClient()` sets `staleTime` 30s, `refetchOnWindowFocus`, `refetchOnReconnect`,
  query retry that skips validation / auth / cancelled / invalid-response errors, and `mutations.retry: false`.
- `src/api/booksQueries.ts`: `useBooks` (optional `{ isbn, author, title, categoryIds, shelfName,
  isRead, skip, take, sortBy, sortOrder, enabled }`), `useInfiniteBooks` (optional `{ isbn, author,
  title, categoryIds, shelfName, isRead, sortBy, sortOrder, enabled }`; batch size 30 via shared config),
  `useRecentBooks` (newest 10 by `creationDate` desc for Home), `useBook`, `useBookCover` (authenticated cover blob;
  `retry: false`; optional `enabled` for lazy load), `useBookLookup` (query), `useLookupBook` (lookup mutation for
  wishlist add), plus mutations (including `useCreateBook`, `useUpdateBook`, `useDeleteBook`,
  `useCheckoutBook`, `useCheckinBook`, `useMarkBookRead`, `useBulkMoveBooksToShelf`, `useUploadBookCover`, and
  `useRemoveBookCover`) that write returned `BookRead` into the detail cache (except delete / bulk move / cover
  remove) and invalidate lists via the `['books']` prefix, detail, dashboard, and loans
  on checkout/check-in. Bulk move invalidates books / shelves / dashboard caches. Cover upload/remove invalidate
  `queryKeys.bookCovers.detail(id)` (and book detail after upload). `useDeleteBook` also invalidates
  `queryKeys.collections.all` (server removes collection memberships on hard delete).
- `src/api/loansQueries.ts` / `dashboardQueries.ts` / `shelvesQueries.ts`: `useLoans` (optional `{ bookId, albumId,
  mediaType, enabled }`), `useInfiniteLoans` (optional `{ bookId, albumId, mediaType, enabled }`; batch size 30),
  `useLoan(id)` (disabled when falsy), `useDashboard`, `useDashboardBreakdowns`, `useDashboardIncompleteMetadata`,
  `useInfiniteIncompleteMetadataBooks({ field?, enabled? })` (batch size 30 via shared config), `useShelves({ enabled?
  })`, plus `useCreateShelf` / `useUpdateShelf` / `useDeleteShelf` that invalidate `queryKeys.shelves.all` (and
  books/dashboard when a rename includes `common_name`).
- `src/api/wishlistsApi.ts` / `wishlistsQueries.ts`: `list` / `create` (**201**) / `update` / `remove` (**204**) /
  `listBooks` / `addBook` / `updateBook` / `removeBook` (**204** membership `DELETE`); optional `skip`/`take` together; documented
  fields only. Hooks: `useWishlists`, `useWishlistBooks` (disabled when id is empty), `useCreateWishlist`,
  `useUpdateWishlist`, `useDeleteWishlist`, `useAddWishlistBook`, `useUpdateWishlistBook`, `useRemoveWishlistBook`,
  `useMoveWishlistBookToShelf` (`MoveWishlistBookToShelfError` with `membershipRemoved` for partial-failure retry).
  Create/update/delete invalidate `queryKeys.wishlists.all`; add/remove invalidate that wishlist's books key.
  Move-to-shelf runs membership `DELETE` then minimal `booksApi.update({ shelf_name })` (skip delete when
  `membershipRemoved`); on success writes detail cache and invalidates wishlist books, `books.all`, book detail, and
  dashboard. Add-to-wishlist creates an unshelved catalog row (`useCreateBook`, omit `shelf_name`) then
  `useAddWishlistBook`. **412** `"Existing books cannot be added to a wishlist"` and edit/move **412**
  `"The book must be removed from the wishlist before it can be placed on a shelf"` are surfaced honestly.
- `src/api/collectionsApi.ts` / `collectionsQueries.ts`: `list` / `create` (**201**) / `update` / `remove` (**204**) /
  `listBooks` / `addBook` (**201**) / `updateBook` / `reorderBook` / `removeBook` (**204**); optional `skip`/`take` together;
  documented fields only (`pickCollectionCreate` / `pickCollectionUpdate` / `pickCollectionBookCreate` /
  `pickCollectionBookUpdate`). Hooks: `useCollections`, `useCollectionBooks` (disabled when id is empty),
  `useCreateCollection`, `useUpdateCollection`, `useDeleteCollection`, `useAddCollectionBook`,
  `useUpdateCollectionBook`, `useReorderCollectionBook`, `useRemoveCollectionBook`. Create/update/delete invalidate `queryKeys.collections.all`;
  membership add/reorder/remove invalidate that collection's books key. `useDeleteBook` also invalidates
  `queryKeys.collections.all` (server drops memberships on hard delete). Product UI uses create/edit/delete/add/
  reorder/remove on `/collections` plus Book Details `AddBookToCollectionDialog` (`useUpdateCollection` /
  `useAddCollectionBook`).

### Routing and Layout

- `src/routes/routeMetadata.ts`: Path, document-title fragment, and heading metadata for every registered route
  (`home` `/`, `about` `/about`, `dashboard`, books/wishlists/collections/shelves/loans/admin routes, plus path-only
  compatibility `checkout` / `checkin`).
- `src/routes/routes.tsx`: `createBrowserRouter` configuration. `AppShell` is the parent layout. Feature route pages
  and `NotFoundPage` load via `React.lazy` wrappers in `lazyRoutePages.tsx` so they stay out of the main JS entry;
  legacy checkout/checkin redirects stay eager. Registered paths are `/`, `/dashboard`, `/books`,
  `/collection/manage`, `/books/new`, `/books/:bookId`, `/books/:bookId/mark-read`, `/books/:bookId/reading`,
  `/books/:bookId/edit`, `/books/:bookId/delete`, `/checkout` (`LegacyCheckoutRedirect`), `/checkin`
  (`LegacyCheckinRedirect` to `/loans`), `/loans`, `/wishlists`, `/collections`, `/shelves`, and
  `*` (not found).
- `src/routes/lazyRoutePages.tsx`: `React.lazy` / dynamic `import()` wrappers for every feature route page and
  `NotFoundPage` (keeps route config free of Fast Refresh export conflicts).
- `src/routes/LegacyCheckoutRedirect.tsx`: Compatibility path only. Replace-navigates `/checkout?bookId=` to
  `/books/{book_id}?checkout=1` and bare `/checkout` to `/books`. `routeMetadata.checkout` is path-only (no title/heading).
- `src/routes/LegacyCheckinRedirect.tsx`: Compatibility path only. Replace-navigates `/checkin` to `/loans` and
  forwards the current search string. `routeMetadata.checkin` is path-only (no title/heading).
- `src/routes/RoutePlaceholder.tsx`: Minimal route-body helper (`h1` with `tabIndex={-1}`). Unused by current feature
  routes; keep only if a future ticket needs a temporary placeholder.
- `src/routes/NotFoundPage.tsx`: Not-found message plus a link back home (`/`).
- `src/routes/createMemoryRouter.ts`: Exports `createTestRouter` for tests; builds a memory router from `routeConfig`.
- `src/layout/AppShell.tsx`: Application frame with skip link, header (brand `NavLink` to Home `/` rendering
  `Shade_Library_Header.webp` via `.app-brand__image`; no text "est. 2026" label), primary navigation (Dashboard
  link; Collection `DrawerNavMenu` Browse/Manage/Collections/Wishlists; Circulation `DrawerNavMenu` Loans only),
  `Suspense` around `Outlet` (`LoadingState` fallback while a lazy route chunk loads), footer
  (`Release ${APP_VERSION}` from `package.json`, plus `API {version}` from `useVersion` / `GET /version` when
  available, joined with a middle dot), document title, and heading focus on location change.
  Collection `activePrefixes` include `/books`, `/shelves`, `/collection` (covers
  `/collection/manage` and `/collections`), and `/wishlists`.
- `src/layout/DrawerNavMenu.tsx`: Accessible drawer-style dropdown for grouped nav items (`aria-expanded`, outside click
  and Escape dismiss, `data-active` when a child route prefix matches). Used for Collection and Circulation menus.
- `src/layout/package.json`: Nested npm manifest next to `AppShell`; not a Yarn workspace and not imported by the
  application. Ignore it.

### Feature Modules

Route ownership under `src/features/*/routes/`. Product routes:

Implemented:

- `src/features/shared/infiniteScrollConfig.ts`: `INFINITE_SCROLL_BATCH_SIZE` (30) and
  `INFINITE_SCROLL_PREFETCH_ROWS` (5) shared by `/books` and `/loans`
- `src/hooks/useInfiniteScrollTrigger.ts`: shared `IntersectionObserver` hook for prefetching the next batch near the
  bottom of loaded rows; colocated `useInfiniteScrollTrigger.test.ts`
- `src/features/books/routes/BooksPage.tsx` (`/books`, infinite scroll + ratings + filters / collection jump / bulk):
  active collection via `useInfiniteBooks({ categoryIds, author, title, isbn, shelfName, isRead, sortBy, sortOrder })`
  with URL-backed multi-`category_id` (AND) / author / title / ISBN / `shelf_name` / `is_read` filters and sort state;
  optional `cleanup_field` mode switches to `useInfiniteIncompleteMetadataBooks` and hides ordinary filter controls;
  `useCategories` for filter options; `useCollectionIsbnJump` for hardware wedge navigation; bulk selection via
  `useBulkSelection` + `BooksBulkActions` / `BulkMoveToShelfControl`; sort controls include Author, Title, Date added,
  and Shelf (default author ascending); filtered and unfiltered empty states remain distinct; active `?isbn=` shows a
  polite Clear ISBN status; when an ISBN filter resolves to exactly one book, replace-navigate to detail (skipped in
  cleanup mode); loading, error+retry, and list rows link to detail with shared `BookCover` thumbnails,
  `formatBookCategories` for `book.categories`, safe enum display for status, Title Case `shelf_name` via
  `formatShelfCommonNameForDisplay`, Read/Unread state, and rating (`N / 5`, or an em dash when null); bottom
  next-page loading and retry affordances.
- `src/features/books/routes/BookDetailsPage.tsx` (`/books/:bookId`): detail via `useBook`;
  loading, not-found / error recovery, and field presentation including shared `BookCover` (eager) plus
  `BookCoverManager` (upload/remove when active), `formatBookCategories` for `book.categories`, Title Case
  `shelf_name`, `is_read`, `completion_date`, `rating`, and `review`. Cover fetch stays independent of the core
  book query; never use `cover_image_path` as a URL. "Edit Book" links to `/books/:bookId/edit` when active. "Add to
  Collection" opens `AddBookToCollectionDialog` for the current active book (picker + optional notes; no catalog
  search). "Check Out" is a button that opens `CheckoutDialog` when `isCheckoutEligible` (active and `available`).
  Deep link `?checkout=1` opens that dialog then replace-clears the search flag. "Check In" links to
  `/loans?bookId=...` when active and check-in eligible via `isCheckinEligible` (active loan present, not deleted).
  "Mark Read" links to `/books/:bookId/mark-read` when active and unread. "Edit Reading" links to
  `/books/:bookId/reading` when active and already read. "Delete Book" links to `/books/:bookId/delete` when active
  and not on loan (`status !== 'on_loan'` and no `findActiveLoan`).
- `src/features/books/components/BookCover.tsx` / `BookCoverManager.tsx`: shared cover display (lazy
  IntersectionObserver load unless `eager`, blob object URL + revoke, status stamp including wishlist, intentional
  placeholder) and Book Details upload/remove controls (`useUploadBookCover` / `useRemoveBookCover`, multipart
  `file`, surfaced **422** `detail`). Colocated `BookCover.test.tsx` / `BookCoverManager.test.tsx`. Styles under
  `.book-cover*` in `components.css`.
- `src/features/books/routes/EditBookPage.tsx` / `bookEditModel.ts` / `bookEditModel.test.ts`
  (`/books/:bookId/edit`): metadata edit via shared `BookForm` + `useUpdateBook` / `booksApi.update` + `useShelves` +
  `useCategories` + `useAuthors`; populate with `bookFormValuesFromBook` (seeds `shelfId` from `shelf_name`,
  `categoryIds` from `categories`, and `authorIds` from `authors`); minimal patch via `bookFormValuesToUpdate` (blank
  ISBN → `null`; omit unchanged `shelf_name` / `category_ids` / `author_ids`; send `category_ids: []` to clear; never
  send `status`, reading fields, or loan-driving values); reject no-op submits; Field-linked `422` / **400** shelf
  errors; `404` refetch with preserved form input; in-flight disable; success to detail; full-page shelves, categories,
  and authors load/error gates before the form. Reading fields stay on mark-read / reading-edit flows.
- `src/features/books/routes/DeleteBookPage.tsx` (`/books/:bookId/delete`): hard delete via `useDeleteBook` /
  `booksApi.remove` with `ConfirmationDialog`; blocks when `status === 'on_loan'` or `findActiveLoan` is present;
  not-found / loan-status error recovery; success navigates away from the deleted detail. Never
  simulate delete with generic `PATCH`.
- `src/features/home/routes/HomePage.tsx` (`/`): discovery front door with hero brand image
  (`Shade_Library_Hero.webp` linking to `/about`), `sr-only` "Shade Library" heading, randomized quote with optional
  expandable context (`homeQuotes`), New Additions (`useRecentBooks` / `HomeBookTrack` with `BookCover`), featured
  category drawers (`topHomeCategories` from breakdowns + `useCategories`; `homeCategoryHref` →
  `/books?category_id=`), Staff Picks carousel (Collections named "Staff Picks"; `HomeStaffPick` with `BookCover`),
  and secondary Browse / Collections / Wishlists / About links. Optional counts/metadata failures must not blank core
  category browsing. Colocated `HomePage.test.tsx`.
- `src/features/home/homeDiscoveryModel.ts` / `homeQuotes.ts`: featured-category selection / href helpers and quote
  bucket; colocated `homeDiscoveryModel.test.ts`.
- `src/features/home/components/`: `HomeCategoryDrawer`, `HomeBookTrack`, `HomeBookCarousel`, `HomeRecentBook`,
  `HomeStaffPick` (plus colocated component tests where present; cover display via shared `BookCover`).
- `src/features/about/routes/AboutPage.tsx` (`/about`) + `src/features/about/components/CatalogGuide.tsx`: library
  information (dedication, lending policy, purpose) and accessible card-catalog-style How to Use dialog with in-app
  workflow links (Administration links Manage Collection only; no `/admin/backup`).
- `src/features/collection/routes/ManageCollectionPage.tsx` (`/collection/manage`): collection maintenance hub with
  links to Add Book and Shelves only, plus decorative `Manage_Collection_Pen.webp`. Colocated
  `ManageCollectionPage.test.tsx` asserts those links and the absence of any Backup Library affordance.
- `src/features/dashboard/routes/DashboardPage.tsx` (`/dashboard`): desk/paper UI (`Dashboard_Background.webp` via
  `--dashboard-desk-image`) with `useDashboard` summary papers (Collection, Circulation, Reading Record with
  read/unread pie chart and `/books?is_read=` deep links); `useDashboardBreakdowns` Basic Stats paper (totals plus
  category donut; Creation Year is not rendered; API `by_shelf` is not rendered here); `useDashboardIncompleteMetadata`
  Healing Metadata paper (per-field counts deep-linking to `/books?cleanup_field=` only -- no in-dashboard infinite
  cleanup list or field filter). Incomplete-metadata book rows load on Books cleanup mode via
  `useInfiniteIncompleteMetadataBooks`. `useCollectionIsbnJump` for hardware wedge jump to a unique book or
  `/books?isbn=`. Null averages as "Not enough data"; API inconsistency warning without recalculation; unified
  Refresh; offline/stale status; paper-level `QueryErrorState` recovery. Styles in `src/styles/components.css`
  (`.dashboard-desk`, `.dashboard-paper*`, `.dashboard-metric*`, `.dashboard-breakdowns`, `.dashboard-healing*`).
- `src/features/books/routes/MarkReadPage.tsx` / `markReadModel.ts` (`/books/:bookId/mark-read`): initial
  unread-to-read via `useMarkBookRead` / `booksApi.markRead` / `pickMarkReadRequest`; optional
  date-only completion date, rating 1-5, and review; omit blanks; `ConfirmationDialog` before mutate; Field-linked
  `422`; `404` refetch with preserved form input; in-flight disable; success navigates to detail. Active unread books
  only; deleted / already-read warning UI. Never simulate this transition with generic `PATCH`.
- `src/features/books/routes/ReadingEditPage.tsx` / `readingEditModel.ts` / `readingEditModel.test.ts`
  (`/books/:bookId/reading`): later reading-field edits via `useUpdateBook` / `booksApi.update` /
  `pickBookUpdate`; populate from `BookRead`; send only changed `completion_date` / `rating` / `review` (blank →
  `null`); reject no-op submits; `ConfirmationDialog`; Field-linked `422`; `404` refetch with preserved form input;
  success to detail. Active already-read books only; deleted / unread warning UI. Does not offer mark-unread.
- `src/features/books/routes/NewBookPage.tsx` (`/books/new`): loads `useShelves`, `useCategories`, and `useAuthors`
  first (loading / full-page `QueryErrorState` without mounting `BookForm` on any failure); mounts shared `BookForm`
  with shelves, categories, and authors, optional ISBN lookup via `useBookLookup` (checksum-gated; apply draft resolves
  textual lookup authors via reuse/`useCreateAuthor` into `authorIds`; progress/cancel/retry and manual fallback),
  creates via `useCreateBook`, maps create `422` `shelf_name` / `category_ids` / `author_ids` and **400** shelf errors
  into the form summary, disables controls while pending, and navigates to the new detail on success. Camera ("Scan
  ISBN") and hardware scanner capture hands one ISBN into the same lookup path (never calls `POST /books` from scanner
  success); hardware listening is disabled while the camera UI is open or lookup is fetching
- `src/features/books/components/BookForm.tsx` / `bookFormDefaults.ts` / `bookFormModel.ts`: reusable create/edit form
  model (title, ordered `authorIds` via multi-select author picker from `GET /authors`, ISBN, publisher, publication
  date as text for year-only values, pages, multi-`categoryIds` checkboxes from API categories, `shelfId` from
  `GET /shelves`, tags, purchase fields, notes). Create UI omits status/read/loan/review; create conversion always sends
  `status=available` and `is_read=false`, resolves `shelfId` → `shelf_name` (`common_name`), sends ordered
  `author_ids`, and sends `category_ids` (including `[]`). Create defaults to empty shelf selection (explicit pick
  required, including `unknown`) and empty categories/authors. Shelf options use Title Case labels; exclude `removed`
  except edit may surface current `removed` membership as a disabled selected option. No inline shelf, category, or
  author catalog CRUD pages. Edit conversion lives in `bookEditModel` (minimal patch; never status/reading/loan
  fields). Client validation, Field-linked errors, error summary focus, tag normalization, and `formValuesToBookCreate`
  blank-optional-to-`null` conversion. Submit label is "Save Book". Colocated `BookForm.test.tsx` /
  `bookFormModel.test.ts` cover gating, validation, conversion, and server error linking
- `src/features/books/authorDisplay.ts`: `formatAuthorName` and `formatBookAuthors` for structured
  `BookAuthorRead[]` display across list/detail/join surfaces
- `src/features/books/categoryDisplay.ts`: `formatBookCategories` (comma-joined names or "None"), `categoryIdsEqual`,
  and `sortCategoriesByName`; colocated `categoryDisplay.test.ts`
- `src/features/shelves/shelfDisplay.ts`: Title Case `formatShelfCommonNameForDisplay`, assignable-shelf helpers
  (`unknown` allowed; `removed` excluded), system-shelf rename/delete guards, and id↔`common_name` lookup; colocated
  `shelfDisplay.test.ts`
- `src/features/shelves/shelfFormModel.ts`: create/edit form values, client validation, `ShelfCreate` /
  changed-fields `ShelfUpdate` conversion; colocated `shelfFormModel.test.ts`
- `src/features/shelves/routes/ShelvesPage.tsx` (`/shelves`): shelf catalog via `useShelves` with create /
  edit / delete through `useCreateShelf` / `useUpdateShelf` / `useDeleteShelf`; Title Case names; system-shelf
  labelling and protection for `unknown` / `removed` (no rename/delete; metadata edits allowed);
  `ConfirmationDialog` for delete; Field-linked **422** plus **400** / **404** / **409** mapping; loading /
  `QueryErrorState` / empty states. Maps `useDashboardBreakdowns` `by_shelf` counts onto catalog rows and deep-links
  into `/books?shelf_name=`. Book forms do not create or edit shelves.
- `src/features/books/booksListModel.ts`: `BOOKS_BATCH_SIZE` (from shared infinite-scroll config), sort types
  (`author` | `title` | `creationDate` | `shelf`), sort and filter URL parsing (`parseCategoryIdParams` for repeated
  `category_id`, `parseTextFilterParam`, `parseIsbnParam` via `compactIsbnForListFilter`, `parseReadStatusParam`,
  `parseCleanupFieldParam`), labels, and page flattening helper; colocated `booksListModel.test.ts`. No hard-coded
  `CATEGORY_FILTER_VALUES` or singular `?category=`.
- `src/features/books/components/BooksListControls.tsx`: multi-category checkboxes (from `useCategories` options) plus
  author / title / read-status filter controls and sort selects for `BooksPage` (including Shelf); drafts apply
  explicitly and can be cleared independently of sort state. ISBN and `shelf_name` filters are URL/hardware/deep-link
  driven (status + Clear ISBN on `BooksPage`), not typed controls here.
- `src/features/books/useBulkSelection.ts` / `utils/bulkSelectionModel.ts`: explicit bulk-selection mode helpers
  (loaded-row Select All, toggle, clear, filter-identity reconcile); colocated unit tests.
- `src/features/books/components/BookSelectionControl.tsx` / `BooksBulkActions.tsx` /
  `BulkMoveToShelfControl.tsx`: selection UI and atomic move-to-shelf control (live shelves; `unknown` allowed;
  `removed` excluded; confirmation; pending guard; preserve selection on failure). Colocated
  `BulkMoveToShelfControl.test.tsx`.
- `src/features/books/utils/isbn.ts`: ISBN-10 / ISBN-13 checksum helpers plus `compactIsbnForListFilter` (punctuation
  strip only for `GET /books?isbn=`); used by lookup, create, scanner capture, collection jump, and `/books` ISBN list
  filtering. Not used by checkout. Colocated unit tests
- `src/features/loans/components/CheckoutDialog.tsx` (Check Out on `BookDetailsPage`): checkout via `useCheckoutBook`
  / `checkoutModel` / `checkoutEligibility`. Native `<dialog>` with borrower and notes only (`checked_out_at` is
  computed client-side; optional `due_at` is not displayed, computed, or sent); Field-linked `422`; `404`/`409`/`412` stale-state refetch
  with preserved borrower/notes (`412` for `display_only`, without alternate-copy offers); in-flight disable; success
  closes the dialog and stays on detail. Non-`available` books (including `display_only`) do not get a
  Check Out button. `CheckoutPage` is gone. Colocated `CheckoutDialog.test.tsx`
- `src/features/loans/checkoutModel.ts`: borrower validation, optional notes, omit blank notes, set `checked_out_at`
  to now, and omit optional `due_at`; colocated `checkoutModel.test.ts`
- `src/features/loans/checkoutEligibility.ts`: `isCheckoutEligible` (`status === 'available'`); used by
  `BookDetailsPage` and `CheckoutDialog`; colocated `checkoutEligibility.test.ts`
- `src/features/loans/checkinEligibility.ts`: `findActiveLoan` and `isCheckinEligible` (active loan on the book;
  eligibility is not book `status` alone); colocated `checkinEligibility.test.ts`
- `src/features/loans/checkinModel.ts`: blank return time → omitted body, supplied values as UTC ISO 8601, client
  validation; colocated `checkinModel.test.ts`
- `src/features/loans/loanTemporal.ts`: `displayLoanDate`, `getLoanDueState`, and `LoanDueState` for due/overdue
  presentation on loan history; colocated `loanTemporal.test.ts`
- `src/features/loans/components/CheckinForm.tsx` (Return Card on `/loans`): check-in via `useCheckinBook` /
  `checkinModel` / `checkinEligibility`. Shows borrower / checked-out from `findActiveLoan`; blank return time omits
  body / supplied values as UTC ISO 8601; `ConfirmationDialog` before mutate; Field-linked `422`; documented `409`
  detail messaging (`Book is not checked out`); in-flight disable; success clears `bookId` and stays on `/loans`;
  non-eligible warning UI; `404`/`409` refetch with preserved return-time input. Colocated
  `CheckinForm.test.tsx`. `CheckinPage` is gone.
- `src/features/loans/loansListModel.ts`: re-exports shared infinite-scroll constants and loan page flattening helper
- `src/features/loans/routes/LoansPage.tsx` (`/loans`, infinite scroll + check-in + collection ISBN jump):
  `useInfiniteLoans({ mediaType: 'book' })` plus unpaginated `useBooks()` joins; `useCollectionIsbnJump` for hardware
  wedge jump; active vs
  returned sections from `returned_at`; due/overdue labels via `loanTemporal`; durable `Book {id}` fallback when the
  book is missing; empty / loading / retryable error states; bottom next-page loading and retry affordances. Eligible
  Active Loans rows offer Check In (`?bookId=`), which mounts `CheckinForm`; returned / missing / ineligible rows do
  not. In-page loan/book when Check In is opened from Active Loans; otherwise `useLoans({ bookId })` plus `useBooks()`
  cache, with `useBook(bookId)` only on cache miss. Targeted queries are not mounted when `bookId` is unset. Colocated
  `LoansPage.test.tsx`
- `src/features/wishlists/routes/WishlistsPage.tsx` (`/wishlists`): `useWishlists` plus nested `useWishlistBooks`;
  membership catalog join via `useBook` / `GET /books/{book_id}` (not `useBooks()` / `GET /books`, which omits unshelved
  rows) with durable `Book {id}` fallback; create form with Field-linked **422**; add via `AddWishlistBookControl`
  (`POST /books` omitting `shelf_name`, then `useAddWishlistBook`); move onto a shelf via
  `MoveWishlistBookToShelfControl` per membership row; permanent delete via `ConfirmationDialog` +
  `useDeleteWishlist` (memberships removed, catalog books remain). Status via `enumDisplayValue`. No membership
  field edit and no standalone membership remove outside move-to-shelf. Collection `/books` has no add-to-wishlist
  control.
- `src/features/wishlists/components/AddWishlistBookControl.tsx` /
  `src/features/wishlists/wishlistFormModel.ts` / `src/features/wishlists/wishlistDisplay.ts`: unshelved catalog create
  (title plus textual authors input resolved to `author_ids` via `useAuthors` / `useCreateAuthor`; optional ISBN lookup
  via `useLookupBook`) then membership add; **404** refetch, **412** exclusivity, Field-linked **422**; safe http(s)
  URL rendering for membership links
- `src/features/wishlists/components/MoveWishlistBookToShelfControl.tsx` /
  `src/features/wishlists/moveWishlistBookModel.ts`: per-row shelf picker (`filterAssignableShelves`, Title Case
  labels, empty default) and "Add to Collection" with `ConfirmationDialog`; validates via
  `validateMoveWishlistBookFormValues` / `shelfIdToShelfNameUpdate`; calls `useMoveWishlistBookToShelf` (membership
  `DELETE` then `PATCH { shelf_name }` only); shelves load/error gate; Field-linked **400** / **422**; **404** /
  **412** refetch; partial-failure retry when membership already removed; success navigates to `/books/{bookId}`.
  Colocated `MoveWishlistBookToShelfControl.test.tsx` / `moveWishlistBookModel.test.ts`
- `src/features/collections/routes/CollectionsPage.tsx` (`/collections`): `useCollections` plus nested
  `useCollectionBooks`; create form with Field-linked **422**; edit via `EditCollectionForm` /
  `useUpdateCollection` (name/description; blank description → explicit `null`; cancel without mutation;
  Field-linked **422**); add via `AddCollectionBookControl` (shelved-only `GET /books` search by ISBN / title /
  author, then `useAddCollectionBook`); membership rows via `CollectionMembershipRow` (join `useBook` /
  `GET /books/{book_id}`, durable `Book {id}` fallback, missing-book error row, shared `BookCover`, **Wishlist** vs Title Case
  shelf location -- membership `shelf_name` may be JSON `null` for unshelved rows; do not treat as BookRead
  `"unknown"`), Move up/down, Remove with `ConfirmationDialog`); permanent collection delete via
  `ConfirmationDialog` + `useDeleteCollection` (memberships removed, catalog books remain). Intro copy distinguishes
  curated lists from Browse and Wishlists. No shelf pickers or move-to-shelf on collection rows.
- `src/features/collections/components/AddCollectionBookControl.tsx` /
  `src/features/collections/collectionFormModel.ts` / `src/features/collections/collectionDisplay.ts`: shelved
  catalog find (`useBooks`, no unshelved wishlist-only rows) then membership add with optional
  notes; **404** / **409** duplicate / Field-linked **422**; location helpers
  (`displayCollectionBookLocation` treats membership `shelf_name: null` as Unknown, not BookRead `"unknown"`;
  wishlist emphasis class); create and edit form validation/conversion
  (`collectionEditFormValuesFromCollection`, `formValuesToCollectionUpdate`). Copy links to `/wishlists` for books
  not yet on a shelf. Colocated tests cover create/edit/add/display helpers and controls.
- `src/features/collections/components/AddBookToCollectionDialog.tsx`: Book Details dialog to add the current active
  book to a chosen collection (`useCollections` picker, optional notes, `useAddCollectionBook` with `book.book_id`; no
  catalog search or create). Empty-collections state links to `/collections`. Surfaces **409** duplicate and **412**
  **412** exclusivity honestly; does not change shelf, wishlist, reading, or circulation state. Distinct from wishlist
  move-to-shelf "Add to Collection" copy on `MoveWishlistBookToShelfControl`. Colocated
  `AddBookToCollectionDialog.test.tsx`.

Scanning feature (extend, do not replace):

- `src/features/scanning/IsbnCameraScanner.tsx`: Camera UI lazy-loaded from `NewBookPage` via `React.lazy` /
  `Suspense`. Uses `@zxing/browser` (`BrowserMultiFormatReader`) + `@zxing/library`. Permission requested only after
  the explicit "Scan ISBN" action; unsupported / insecure / permission / timeout paths keep manual ISBN entry usable
- `src/features/scanning/isbnCameraCapture.ts`: Secure-context / getUserMedia capability checks, Bookland EAN-13
  filter, decode hints, and scan timeout helpers
- `src/features/scanning/isbnScannerParser.ts` / `useHardwareIsbnScanner.ts`: Keyboard-wedge hardware capture with
  Enter terminator, inter-key timeout, and checksum via `isbn.ts`. Optional `ignoreEditableTargets` (skip focused
  inputs / contentEditable and modifier chords) and `preventDefaultWhenConsumed` for collection-jump pages
- `src/features/scanning/useCollectionIsbnJump.ts`: Shared hardware jump for `/dashboard`, `/books`, and `/loans`.
  Compacts via `compactIsbnForListFilter`, prefetches `GET /books?isbn=` through `createBooksApi`, opens a sole match
  at `/books/{book_id}`, otherwise navigates to `/books?isbn=` (replace when already on `/books`). Failed prefetch does not
  navigate. Never creates, checks out, or calls lookup. Colocated `useCollectionIsbnJump.test.tsx`
- Colocated scanning tests plus `NewBookPage` handoff tests for camera and hardware captures; `BooksPage` /
  `DashboardPage` / `LoansPage` tests cover collection jump

Capture modes: camera accepts Bookland EAN-13 (`978` / `979`) only (UPC and other symbologies are filtered out);
hardware wedges accept ISBN-10 / ISBN-13 with spaces or hyphens (Enter terminator, inter-key timeout, checksum via
`isbn.ts`); typed ISBN stays available on `/books/new`, including when camera fails. Successful create-path captures
hand one ISBN into create lookup; collection-jump captures open or filter matching books. Scanning never calls
`POST /books` or checkout. There is no checkout capture surface. Camera remains `/books/new` only.

Camera browser matrix (secure context required: `https:` or `http://localhost` / loopback; permission only after
"Scan ISBN"):

| Platform        | Browser                         | Status      | Notes                                               |
|-----------------|---------------------------------|-------------|-----------------------------------------------------|
| Desktop macOS   | Current Chrome                  | Supported   | Preferred desktop verification target               |
| Desktop macOS   | Current Firefox                 | Supported   |                                                     |
| Desktop macOS   | Current Safari                  | Supported   |                                                     |
| Desktop Windows | Current Chrome / Edge           | Supported   |                                                     |
| Desktop Linux   | Current Chrome / Firefox        | Supported   |                                                     |
| iOS             | Current Mobile Safari           | Supported   | Requires HTTPS outside localhost                    |
| iOS             | Current Chrome (WebKit)         | Supported   | Same engine limits as Mobile Safari                 |
| Android         | Current Chrome                  | Supported   | Preferred phone verification target                 |
| Android         | Current Firefox                 | Supported   |                                                     |
| Any             | Insecure `http:` (non-loopback) | Unsupported | UI explains secure-context requirement              |
| Any             | No `mediaDevices.getUserMedia`  | Unsupported | UI explains unsupported browser; manual entry stays |

Unsupported in the MVP: Internet Explorer, EdgeHTML, browsers without getUserMedia, and UPC-only product
scanners used as the camera target.

Dedicated hardware scanners: USB/Bluetooth wedges that end with Enter and emit ISBN-10 or ISBN-13 text are
supported (focus may remain in an input on `/books/new`; on Dashboard / Books / Loans, collection jump ignores
editable targets so ordinary typing is not swallowed; invalid checksums are dropped before lookup or jump; parser
generation/reset plus first-frame camera guard avoid duplicate scans). Wedges without an Enter terminator are
unsupported (buffer clears on inter-key timeout; configure the scanner for Enter).

Failure and recovery: permission denied, missing camera, unsupported browser, and insecure context show an error
(camera does not start; Cancel and typed ISBN remain usable). No readable ISBN within timeout shows a warning with
"Keep scanning" while video stays available. Multiple cameras: a camera select appears after start; switching stays
in flow.

Manual device checklist (run against a connected API for each supported row available):

- Create path (`/books/new`): desktop Chrome Scan ISBN happy path; desktop Safari or Firefox same path; Android Chrome
  rear-camera Bookland scan; iOS Safari (HTTPS) permission prompt plus successful scan or clear denial; multi-camera
  switch without leaving the flow; hardware wedge with Enter (valid ISBN triggers lookup; invalid checksum ignored);
  deny camera permission (accessible error; typed lookup still works); insecure non-loopback origin if available
  (secure-context message; typed entry works); unreadable barcode until timeout (warning; Keep scanning and manual
  entry work); UPC-only product barcode not accepted as an ISBN capture.
- Collection jump (`/dashboard`, `/books`, `/loans`): hardware wedge with Enter opens a unique match at detail; multiple
  matches land on `/books?isbn=` with Clear ISBN; typing in an input on those pages is not consumed; Back from a unique
  jump returns to the page that was scanned.

Connection feature (build-time Bearer auth, complete):

- `src/features/connection/connectionTypes.ts`: Connection status union (`checking`, `connected`, `unauthorized`,
  `unreachable`).
- `src/features/connection/connectionToken.ts`: Reads the build-time token once via `readApiToken()`;
  `getCurrentToken()` returns it for `createApiClient`.
- `src/features/connection/connectionApi.ts`: Public `GET /health` liveness followed by tenant-aware `GET /ready`
  through typed `healthApi`, with connection error mapping.
- `src/features/connection/ConnectionContext.ts` / `useConnection.ts`: Context value and hook (`status`, `apiBaseUrl`,
  `release` from `APP_VERSION`, `errorMessage`, `apiClient`).
- `src/features/connection/ConnectionProvider.tsx`: Owns status, `apiClient`, startup liveness/readiness verification,
  `onUnauthorized` page error state, and optional `diagnosticReporter` wired through `createApiClient`
  `onRequestFailure` (no connect / forget / retry / `hasToken`). Exposes `release: APP_VERSION` (not runtime config).

### Shared Components

Import shared UI from `src/components/index.ts` rather than deep paths when writing application or feature code.

- `src/components/Alert.tsx`: Status alert; `error` uses `role="alert"`, other variants use `role="status"`.
- `src/components/AppLink.tsx`: React Router `Link` wrapper with optional visual variants.
- `src/components/Button.tsx`: Button primitive with `primary`, `secondary`, and `danger` variants.
- `src/components/ConfirmationDialog.tsx`: Modal confirmation dialog on the native `<dialog>` element, with labelled
  description, focus trap, Escape cancel, and focus restoration.
- `src/components/EmptyState.tsx`: Empty-content section with optional supporting text and action slot.
- `src/components/Field.tsx`: Labelled control wrapper that wires `id`, help text, and error associations.
- `src/components/LoadingState.tsx`: Polite live-region loading indicator.
- `src/components/QueryErrorState.tsx`: Shared query error alert with `formatApiQueryError` messaging; hides Retry on
  `403` and shows `.env` / rebuild guidance for unauthorized errors.
- `src/components/Notifications.tsx`: `NotificationsProvider` and dismissible toast list (per-item live roles).
- `src/components/NotificationsContext.ts`: Notification types and React context.
- `src/components/useNotifications.ts`: Hook that reads the notifications context (throws outside the provider).
- `src/components/index.ts`: Barrel re-exports for the shared components and notifications API.

These components apply the class names defined in `src/styles/components.css`. Books list/detail (including covers),
create/edit form, scanner capture, checkout, check-in, loan history, mark-read, reading edit, hard delete,
wishlists, collections, home discovery, and dashboard already use them in product UI (including `QueryErrorState` for
API errors); keep reusing these primitives rather than inventing parallel UI kits.

### Styling

- `src/index.css`: Global CSS entrypoint imported by `src/main.tsx`. It imports all style layers in order.
- `src/styles/tokens.css`: Design tokens for typography, spacing, sizing, colors, borders, focus, shadows, and motion.
- `src/styles/base.css`: Element defaults and accessibility foundations, including box sizing, controls, links, focus
  visibility, page typography, skip links, and reduced motion.
- `src/styles/shell.css`: Application-frame classes for header (including `.app-brand` / `.app-brand__image`),
  navigation (including `.drawer-nav-menu` drawer panels), main content, footer, route pages, and responsive layouts.
- `src/styles/components.css`: Shared class-based primitives for buttons, links, forms, alerts, status views, dialogs,
  notifications, Home (`.home-page*`), Manage Collection (`.manage-collection-page*`), dashboard desk/paper layout
  (`.dashboard-page`, `.dashboard-desk`, `.dashboard-paper*`, `.dashboard-metric*`, `.dashboard-breakdowns`,
  `.dashboard-healing*`, and related charts), collections layout (`.collections-page*`, `.collection-card*`,
  `.collection-form*`, `.collection-membership*`, including `.collection-membership--wishlist`), wishlists layout
  (`.wishlists-page*`, `.wishlist-*`), and book covers (`.book-cover*`). They use BEM-like naming and are referenced by
  the shared component modules, `HomePage`, `DashboardPage`, `ManageCollectionPage`, `CollectionsPage`,
  `WishlistsPage`, and `BookCover`. Long-content wrapping (`overflow-wrap: anywhere`, `min-width: 0` on
  book/circulation cards and details) lives here. Leftover `.dashboard-drawer*` rules may still appear in this file
  but are unused by current `DashboardPage` markup -- prefer `.dashboard-paper*` when extending the dashboard.

Choose the CSS layer based on responsibility:

- Shared values belong in `tokens.css`.
- HTML element defaults belong in `base.css`.
- Application frame and navigation layout belong in `shell.css`.
- Reusable UI patterns belong in `components.css`.
- Feature-specific styles may be colocated once a feature needs styles that do not belong in the shared layers;
  home, manage-collection, dashboard, collections, wishlists, and book-cover styles currently live in
  `components.css`.

Preserve the import order in `src/index.css`: tokens, base, shell, components.

### Tests

- `src/App.test.tsx`: Document title and heading-focus behavior for client-side navigations (including drawer-menu
  hops) via `renderAppTree`.
- `src/RootErrorBoundary.test.tsx`: Recoverable root error-boundary fallback and redacted render-failure reporting.
- `src/layout/AppShell.test.tsx`: Landmarks, drawer navigation (Collection Browse/Manage/Collections/Wishlists,
  Circulation Loans only with no Check Out or Check In items, Dashboard current-page and trunk `data-active`
  including `/wishlists` and `/collections`), footer `Release` from `package.json` plus API version, drawer-to-route
  navigation with heading focus, not-found recovery, `/checkin` → `/loans` compatibility redirect (search forwarded),
  and `/checkout` → `/books` or `/books/{book_id}?checkout=1` compatibility redirect.
- `src/components/SharedState.test.tsx`: Field associations plus alert, loading, and empty-state semantics.
- `src/components/ConfirmationDialog.test.tsx`: Dialog labelling, focus, Escape, confirm, and restoration.
- `src/components/Notifications.test.tsx`: Live-region roles, dismissal, and provider hook usage.
- `src/config/runtimeConfig.test.ts` / `runtimeConfigState.test.ts`: Config validation (including optional
  diagnostics; no runtime `release` field) and read helpers.
- `src/config/apiToken.test.ts`: `readApiToken()` missing, blank, and trimmed success cases.
- `scripts/appVersionConsistency.test.ts`: Asserts `APP_VERSION` matches `package.json` `version`.
- `src/diagnostics/diagnosticReporter.test.ts`: Disabled/enabled reporters, allowlisted payloads, redaction
  assertions, and swallowed transport failures.
- `src/api/apiClient.test.ts`: Bearer injection without browser-owned tenant headers, public requests omitting auth, `403`,
  `404`, `409`, both `422` detail shapes, `5xx`
  (including `500` / `502` / `504`), network failure, timeout, cancellation, invalid JSON, binary backup success,
  `204`, and `onRequestFailure` diagnostic hooks.
- `src/api/authorsApi.test.ts`: Author list/get/create/update/remove request shaping and paths.
- `src/api/apiErrors.test.ts` / `apiTypes.test.ts` / `api.test.ts` / `apiRedaction.test.ts`: Error, schema alias,
  `createApi`, and redaction coverage.
- `src/api/booksApi.test.ts` / `booksApi.conflicts.test.ts` / `booksApi.largeLibrary.test.ts` / `loansApi.test.ts` /
  `dashboardApi.test.ts` / `healthApi.test.ts` / `versionApi.test.ts` / `categoriesApi.test.ts`: Typed route helper
  coverage including dashboard summary and report paths, lookup `found: false`, mark-read `{}`, omitted check-in body,
  checkout/check-in `409` bodies, repeated `category_id` list filters, cover get blob / multipart upload /
  delete, and a 2_000-row list timing guard.
- `src/api/requestFields.test.ts` / `dateTime.test.ts`: Request-field picking and date/time normalizer coverage.
- `src/api/queryClient.test.ts` / `booksQueries.test.tsx` / `serverStateQueries.test.tsx` / `queryStaleGuard.test.tsx`:
  Query client defaults, books/loans/dashboard hooks (including `useBookCover` / cover upload/remove invalidation),
  detail-cache writes, and abort/stale overwrite guards.
- `src/api/queryKeys.test.ts`: Books/loans/dashboard/shelves/categories/wishlists/collections/version key shape
  coverage including `author` / `title` / `categoryIds` omission of blank filters, dashboard nested report keys,
  `infiniteList` isolation, and shelves / categories / wishlists / collections list isolation.
- `src/api/shelvesApi.test.ts` / `shelvesQueries.test.tsx`: `GET` / `POST` / `PATCH` / `DELETE /shelves` helpers and
  `useShelves` / write mutation hooks (including rename invalidation of books/dashboard).
- `src/api/wishlistsApi.test.ts` / `wishlistsQueries.test.tsx`: wishlist list/create/update/delete/listBooks/addBook/
  removeBook helpers including **400** / **404** / **412** / **422**, plus hook keys, disabled empty-id books query,
  create/add/remove invalidation, and `useMoveWishlistBookToShelf` order (DELETE then PATCH), success invalidation,
  and partial-failure `membershipRemoved` retry.
- `src/api/collectionsApi.test.ts` / `collectionsQueries.test.tsx`: collections list/create/update/delete/listBooks/
  addBook/reorderBook/removeBook helpers including path encoding and pagination, plus hook keys, disabled empty-id
  books query, create/update/delete invalidation of `collections.all`, and membership write invalidation of
  `collections.books(collectionId)`.
- `scripts/contractSmoke.test.ts`: Checked-in OpenAPI path/type smoke when live backend comparison is unavailable
  (includes `/authors`, `/authors/{author_id}`, `/categories`, `/shelves`, `/shelves/{shelf_id}`, `/version`,
  `/books/{book_id}/cover`, `/books/bulk/lookup`, `/books/bulk/import`, wishlist paths including membership DELETE,
  Collections paths, dashboard-report paths, and existing lifecycle routes).
- `src/features/connection/ConnectionProvider.test.tsx` / `connectionToken.test.ts`: Health startup check,
  unauthorized handling without cache clear, and build-time token wiring.
- `src/features/books/routes/BooksPage.test.tsx` / `BookDetailsPage.test.tsx` / `NewBookPage.test.tsx`: Collection
  infinite scroll (batch size 30, sort URL persistence, flattened pages, bottom loading/retry, Read/Unread and rating
  on cards, Title Case `shelf_name`, multi-`category_id` / `is_read` / `shelf_name` / `cleanup_field` URL filters /
  Clear Filters, `formatBookCategories`, URL `isbn` filter / Clear ISBN / unique-match auto-open, collection jump,
  bulk selection / bulk move wiring, `BookCover` wiring), detail (including `BookCover` / `BookCoverManager`, gated
  Check Out via `CheckoutDialog` / `?checkout=1`, Mark Read / Edit Reading / Edit Book / Delete Book with active-loan
  gating, and multi-category display), and create-route behavior (shelves, categories, and authors load gates /
  failure blocks form, loading/error/empty, navigation, create success with `shelf_name`, `author_ids`, and
  `category_ids`, lookup success / `found: false` / provider failure / checksum rejection / lookup-author resolution,
  create `422` field mapping, camera and hardware scanner handoff into lookup)
- `src/features/books/components/BookCover.test.tsx` / `BookCoverManager.test.tsx`: cover display (blob / placeholder /
  object-URL cleanup / lazy load) and upload/remove control behavior
- `src/features/shelves/routes/ShelvesPage.test.tsx` / `shelfDisplay.test.ts` / `shelfFormModel.test.ts`: Shelves
  catalog loading/error/empty, Title Case labels, system-shelf badges and rename/delete guards, create/edit/delete
  flows with Field-linked errors and confirmation, `by_shelf` counts and `/books?shelf_name=` deep links, plus
  display/assignable/form-model helper coverage
- `src/features/books/routes/EditBookPage.test.tsx` / `bookEditModel.test.ts`: Edit eligibility (active books only),
  shelves, categories, and authors load gates, populate-from-book (including `categoryIds` and `authorIds`), minimal
  changed-fields patch (blank ISBN → `null`; omit unchanged `category_ids` / `author_ids`; send `[]` to clear; no
  status/reading/loan fields), no-op rejection, Field-linked `422`, mutation `404`, pending disable, and success
  navigation
- `src/features/books/categoryDisplay.test.ts`: `formatBookCategories`, `categoryIdsEqual`, and `sortCategoriesByName`
- `src/features/books/useBulkSelection.test.ts` / `utils/bulkSelectionModel.test.ts` /
  `components/BulkMoveToShelfControl.test.tsx`: bulk selection lifecycle and atomic move-to-shelf control behavior
- `src/features/books/routes/DeleteBookPage.test.tsx`: Delete confirmation, on-loan blocking via status and
  `findActiveLoan`, not-found warnings, success navigation, and mutation error recovery
- `src/features/home/routes/HomePage.test.tsx` / `homeDiscoveryModel.test.ts`: Home discovery rendering, featured
  category hrefs, optional metadata failure fallbacks, secondary links, and About content living at `/about` (not on
  `/`)
- `src/features/about/routes/AboutPage.test.tsx`: About page at `/about` rendering, `CatalogGuide` dialog open/close
  and focus management, in-app workflow links (no Backup Library / `/admin/backup`), and document title / heading focus
- `src/features/about/components/CatalogGuide.test.tsx`: Catalog guide dialog open/close, labelled description,
  keyboard focus trap and restoration, and in-app workflow links
- `src/features/collection/routes/ManageCollectionPage.test.tsx`: Manage Collection hub links (Add Book, Shelves)
  and no Backup Library / backup affordance
- `src/features/dashboard/routes/DashboardPage.test.tsx`: Summary metric rendering, breakdown buckets, category /
  read-status deep links, incomplete metadata counts (without summing field totals into `total_incomplete`),
  `/books?cleanup_field=` healing deep links, healing empty state, paper-level error recovery, unified Refresh, null-
  average "Not enough data", inconsistency warning without recalculation, offline / stale status, summary
  `QueryErrorState` recovery, and hardware collection ISBN jump wiring. (Dashboard does not mount the incomplete-
  metadata infinite list; that belongs to Books cleanup mode.)
- `src/features/books/routes/MarkReadPage.test.tsx` / `markReadModel.test.ts`: Mark-read eligibility (active unread
  only; already-read warnings), confirmation, success navigation, client validation, rating bounds, request
  conversion, Field-linked `422`, mutation `404`, pending disable, and form conversion
- `src/features/books/routes/ReadingEditPage.test.tsx` / `readingEditModel.test.ts`: Reading-edit eligibility (active
  already-read only; unread warnings), populate-from-book, changed-fields-only patch (including clearing
  fields to `null`), no-op rejection, confirmation, success navigation, Field-linked `422`, mutation `404`, and pending
  disable
- `src/features/loans/components/CheckoutDialog.test.tsx` / `checkoutModel.test.ts` / `checkoutEligibility.test.ts`:
  Checkout dialog on book details (borrower and notes only; no ISBN Find, dates, or alternate copies), eligibility,
  success staying on detail, client validation, field-mapped `422`, mutation `404`/`409`/`412` (display only without
  substitutes), network failure, and `?checkout=1` deep-link open on eligible books only
- `src/features/loans/components/CheckinForm.test.tsx` / `checkinModel.test.ts` / `checkinEligibility.test.ts`:
  Check-in on `/loans` (`?bookId=` Return Card), active-loan eligibility (including status-independent cases),
  non-eligible warnings, blank and supplied return time, confirmation, success staying on `/loans`,
  Field-linked `422`, documented `409` detail messaging, generic mutation errors, pending disable, and form conversion
- `src/features/loans/routes/LoansPage.test.tsx` / `loanTemporal.test.ts`: Infinite loan pagination into active vs
  returned sections, Check In on eligible Active Loans rows, due/overdue labels, durable missing-book fallback, empty /
  loading / retryable error states, explicit empty active and returned sections, bottom loading/retry, due-date
  display, and hardware collection ISBN jump wiring
- `src/features/wishlists/routes/WishlistsPage.test.tsx` / `AddWishlistBookControl.test.tsx` /
  `MoveWishlistBookToShelfControl.test.tsx` / `moveWishlistBookModel.test.ts` / `wishlistFormModel.test.ts` /
  `wishlistDisplay.test.ts`: wishlists loading/error/empty, create, nested memberships with `GET /books/{book_id}` join
  and missing-book fallback, add omitting `shelf_name`, move-to-shelf shelf picker / confirmation / success navigation
  / **412** / **404** / partial-failure retry, **412** exclusivity, Field-linked **422**, pending disable, and no
  collection add-to-wishlist affordance
- `src/features/collections/routes/CollectionsPage.test.tsx` / `AddCollectionBookControl.test.tsx` /
  `CollectionMembershipRow.test.tsx` / `collectionFormModel.test.ts` / `collectionDisplay.test.ts`: collections
  loading/error/empty, create, nested memberships with `GET /books/{book_id}` join and missing-book fallback, shelved vs
  **Wishlist** location labels, shelved-only add search / select, reorder bounds, remove confirm, collection delete,
  **409** / Field-linked **422**, and missing-book membership error row
- `src/features/books/components/BookForm.test.tsx` / `bookFormModel.test.ts`: Form field rendering, API-fed shelf
  options (Title Case labels; `removed` excluded; required shelf), gated create controls, initial values, empty
  title/authors and ISBN rejection, submit payload shaping via `formValuesToBookCreate` (`shelf_name`),
  blank-optional-to-`null`, year-only `publication_date`, purchase-price number serialization, tags normalization,
  cancel, submitting disabled state, and linked server field errors
- `src/features/books/utils/isbn.test.ts`: ISBN-10 / ISBN-13 checksum acceptance and rejection cases, plus
  `compactIsbnForListFilter` punctuation-only compaction
- `src/features/scanning/IsbnCameraScanner.test.tsx` / `isbnCameraCapture.test.ts` / `isbnScannerParser.test.ts` /
  `useHardwareIsbnScanner.test.ts` / `useCollectionIsbnJump.test.tsx`: Camera UI, capture helpers, keyboard-wedge
  parser, hardware hook options (`ignoreEditableTargets` / `preventDefaultWhenConsumed`), and collection-jump
  prefetch / unique-open / multi-match `/books?isbn=` coverage
- `playwright.config.ts`: Playwright browser-journey config (Chromium; Vite `yarn dev` webServer on `127.0.0.1:4173`
  with `VITE_API_SECRET_KEY=test-api-token`; list + HTML reporters; CI retries and a single CI worker). Included in
  `make check` via `yarn test:e2e`.
- `e2e/dashboard.smoke.spec.ts`: Dashboard browser smoke at `/dashboard` (heading/title, null-average and populated
  fixtures, axe serious/critical gate) via mocked API
- `e2e/book.creation.spec.ts`: Manual book-creation journey through `/books/new` into the created detail page
- `e2e/isbn-collection-jump.spec.ts`: Hardware collection jump from `/dashboard` -- unique match opens detail (Back
  returns to dashboard); multiple matches land on `/books?isbn=` with Clear ISBN
- `e2e/library.lifecycle.spec.ts`: Checkout/check-in, mark-read, and hard-delete browser journeys against the
  stateful mock API (dedicated lifecycle endpoints, not generic `PATCH`). Checkout follows detail "Check Out" into
  `CheckoutDialog`; check-in follows detail "Check In" onto `/loans?bookId=` (`CheckinForm` Return Card). Neither
  uses a dedicated `/checkout` or `/checkin` page.
- `e2e/accessibility.spec.ts`: Per-route axe serious/critical scans for books list, add book, book detail, and
  loans. Automated axe supplements keyboard, responsive-layout, and assistive-technology review; it does not replace
  them.
- `e2e/support/mockApi.ts`: Stateful Playwright route mock for `http://127.0.0.1:8000/**` (health, version, shelves,
  categories, books with repeated `category_id` AND filters and `category_ids` on create/update, loans, dashboard
  summary, lookup, and lifecycle mutations). No wishlist, Collections, dashboard-report, or backup fixtures exist;
  backup is an operator-only workflow.
- `e2e/support/accessibility.ts`: `expectNoSeriousAccessibilityViolations` via `@axe-core/playwright`
- `src/test/setup.ts`: Global Vitest setup that installs jest-dom matchers for every test.
- `src/test/renderAppTree.tsx`: Shared helpers (`renderAppTree`, `renderWithProviders`, `mockReachableApi`,
  `testRuntimeConfig`) that mount under `AppProviders` with a mocked reachable API (including dashboard report routes,
  empty wishlists, and empty collections) and a diagnostic reporter. `renderAppTree` is async and waits until the
  AppShell route `Suspense` fallback (`Loading page…`) clears so callers see the settled lazy page.
- `scripts/productionBuildTokenInspection.test.ts`: Production build env inspection; asserts `.env` is not copied into
  `dist/` or the release tarball and that `VITE_API_SECRET_KEY` is embedded in generated JS bundles (accepted risk).
- `scripts/packRelease.ts` / `packRelease.test.ts`: Deterministic `dist/` tarball, SHA-256 sidecar, and release
  manifest (`make publish` / `yarn release:pack`; gitignored `ci/artifacts/shade-frontend-<version>.tar.gz`).
- `scripts/productionLikeHost.ts` / `productionLikeHost.test.ts`: Production-like static host plus mock API checks
  for SPA fallback, HTML/config revalidation, immutable `/assets/`, CORS preflight, Bearer access, and backup
  `Content-Disposition`.

Evergreen browser targets: desktop Firefox / Chrome / Edge / Safari latest; mobile Safari on iOS and Chrome on
Android. Smoke scope: shell and primary nav, route-title updates, heading focus, keyboard-only navigation, skip
link, forms and linked validation, confirmation-dialog focus, live status announcements, books list/detail,
checkout dialog and check-in, loans, deleted-books administration, 404 recovery, 320px / tablet / desktop
layouts, long user content, and reduced-motion.

| Browser / device | Result     | Notes                                                                                                                    |
|------------------|------------|--------------------------------------------------------------------------------------------------------------------------|
| Firefox desktop  | Pass       | Manual smoke completed at 320px, tablet, and desktop widths (keyboard, focus, dialogs, forms, wrapping, reduced-motion). |
| Chrome desktop   | Not tested | Chrome is not available in the current local test environment.                                                           |
| Edge desktop     | Pending    | Planned verification on an available Windows/Edge environment.                                                           |
| Safari macOS     | Pending    | Planned verification by another maintainer with access to macOS/Safari.                                                  |
| Safari iOS       | Blocked    | No iOS/Safari test environment currently available.                                                                      |
| Chrome Android   | Blocked    | No Android/Chrome test environment currently available.                                                                  |

Unavailable browser/device environments are recorded explicitly rather than assumed to pass. Any browser-specific
failure discovered before release should be fixed or tracked as an explicit release blocker.

A frontend change is release-ready when `make check` passes, coverage stays above the enforced floors, relevant
manual gates (scanner device checklist and evergreen browser smoke above) are completed when the change affects
those surfaces, no known critical or serious accessibility regression remains, and any deferred verification is
documented with its rationale.

Tests use a jsdom browser simulation for Vitest (except the Node-environment production-build inspection). Prefer
semantic Testing Library queries such as `getByRole()` and test user-visible behavior instead of implementation
details. Route tests should use `createTestRouter` / `renderAppTree` and must not mutate `window.history` across
cases. Browser journeys live under `e2e/` and run through Playwright (`yarn test:e2e`); keep mocks aligned with
OpenAPI / `API-for-FE.md` rather than inventing a second fake-API stack.

The test flow is:

```text
yarn test
  -> Vitest reads vite.config.ts
  -> jsdom supplies browser APIs
  -> src/test/setup.ts installs shared matchers
  -> colocated *.test.tsx / *.test.ts files render through Testing Library

yarn test:coverage
  -> same as yarn test, plus V8 coverage with enforced global thresholds

yarn test:e2e
  -> Playwright reads playwright.config.ts
  -> starts Vite webServer (or reuses one outside CI)
  -> runs e2e/*.spec.ts against Chromium

make check / yarn check
  -> lint -> typecheck -> api:check -> test:coverage -> test:e2e -> build -> bundle:check
```

### Dependencies and Commands

- `package.json`: Package metadata (canonical frontend `version` drives `APP_VERSION` and the footer `Release` label),
  Node and Yarn requirements, scripts (including `api:generate` / `api:check`, `test:e2e`, `bundle:check`,
  `release:pack`), runtime dependencies, and development dependencies.
- `yarn.lock`: Yarn-generated exact dependency resolutions and checksums. Never edit it manually.
- `Makefile`: Stable wrappers around Yarn scripts for installation, development, checks, tests, builds,
  `bundle-check`, `ci` (Podman image via `ci/build-local.sh`), and `publish` (versioned production tarball via
  `ci/build-prod.sh`).
- `.nvmrc`: Exact Node.js version used by `nvm use`.
- `.yarnrc.yml`: Configures Yarn to use the `node_modules` linker instead of Plug'n'Play.

### Build, Type Checking, and Linting

- `vite.config.ts`: Shared Vite and Vitest configuration. Enables React, jsdom tests (`src/**` and `scripts/**` test
  files), global test setup, V8 coverage thresholds, `__APP_VERSION__` from `package.json`, and an optional
  tenant-aware same-origin API proxy when `SHADE_API_PROXY=1` (optional `SHADE_API_PROXY_TARGET`). The proxy accepts
  `*.localhost`, derives `X-Forwarded-Host` from the browser host, defaults bare local origins to `andy.localhost`, and
  forwards the current API surface under either `/api/*` or root paths. It does not proxy `/backup`.
- `eslint.config.js`: Flat ESLint configuration for TypeScript and React Hooks. It ignores `dist/`, `coverage/`,
  `node_modules/`, and `ci/artifacts/` and treats warnings as failures through the package script.
- `tsconfig.json`: TypeScript solution file that references the application and Node/tooling configurations.
- `tsconfig.app.json`: Strict browser and React type checking for `src/`. It includes Vite, Vitest, and jest-dom types
  and emits no files.
- `tsconfig.node.json`: Strict Node-side type checking for `vite.config.ts` and `scripts/**/*.ts`. It emits no files.
- `scripts/checkBundleSize.mjs`: Main-entry gzip budget enforcement after `dist/` exists; warns above 120 kB and fails
  above 150 kB (`yarn bundle:check` / `make bundle-check`; also part of `make check`).
- `scripts/packRelease.ts`: Opt-in production tarball from `dist/` (`yarn release:pack` / `make publish`). Writes
  `ci/artifacts/shade-frontend-<package.json version>.tar.gz`, `.sha256`, and `.manifest.json`. Not part of default
  CI artifact upload.

### Podman image (extend, do not replace)

Deployed-development image for Compose with the backend. Not host Vite (`make run`) and not the production
tarball (`make publish`). Preserve (do not rebuild or regress):

- `ci/Containerfile`: Runtime-only `nginx:1.31-alpine`. HTTP on 8080. Copies host-built `dist/`. No Node/Yarn/Vite
  stage. Does not `COPY` `.env`. Healthcheck is `wget` against `http://127.0.0.1:8080/` and `/config.js` (no protected
  API routes).
- `ci/nginx.conf`: React Router SPA `try_files` fallback; `Cache-Control: no-cache` for `index.html` and `config.js`;
  long-lived `/assets/` cache for hashed Vite output.
- `ci/container-entrypoint.sh`: Writes `/usr/share/nginx/html/config.js` at start from `SHADE_API_BASE_URL`,
  `SHADE_DIAGNOSTICS_ENABLED` (`true`/`false`), and `SHADE_DIAGNOSTICS_ENDPOINT` (empty → `null`). Changing those
  values does not require an image rebuild. Application release stays `package.json` `version` from the image build.
- `.containerignore`: Build context is the repo root; only `dist/` and the `ci/` files above are included.
- Make `ci` / `ci/build-local.sh`: runs `make build`, tags `shade-frontend:latest` and
  `shade-frontend:<package.json version>`. Compose should pull `shade-frontend`. The Compose file lives in the
  orchestrator, not this repo. Optional `SHADE_API_PROXY=1` remains host `make run` only. Local smoke testing outside
  Compose uses direct `podman run` / `podman stop` / `podman rm` / `podman rmi` commands (see `README.md`).

### Production tarball (extend, do not replace)

Versioned static archive for the deployment repository. Not host Vite and not the Compose development image. Preserve:

- `scripts/packRelease.ts`: Deterministic gzip/ustar of `dist/` (sorted members, zero mtime, portable gzip header).
  Refuses `.env`, source trees, `node_modules/`, coverage, Playwright output, Podman/dev files, SQL dumps, and
  database files. Requires `index.html` and `config.js`.
- Make `publish` / `ci/build-prod.sh` / `yarn release:pack`: runs `make build`, writes gitignored
  `ci/artifacts/shade-frontend-<package.json version>.tar.gz`, `.sha256`, and `.manifest.json`.
- Manifest fields: `version` / `appVersion` (same as `APP_VERSION`), `commit`, `buildTime`, `checksumSha256`,
  runtime-config shape (`apiBaseUrl` plus optional `diagnostics`), hosting requirements (SPA fallback, HTML/config
  revalidation, immutable hashed assets, HTTPS/CSP, network restriction, atomic install/rollback/supervision/health,
  checksum retention).
- Inspection: `scripts/packRelease.test.ts`, extended `scripts/productionBuildTokenInspection.test.ts`, and
  `scripts/productionLikeHost.ts` (test-only static host; not a production server). Default CI does not upload
  `ci/artifacts/`.

### Repository Guidance

- `README.md`: Concise human onboarding for the three interaction paths -- **local development** (`make run`),
  **deployed development** (this Podman image in Compose), and **deployed production** (versioned tarball plus the
  deployment repository) -- plus prerequisites (including Podman for the image path), setup, local CORS-or-proxy
  options, `.env` token configuration (build-time for the image and tarball; bind-mounting `.env` at container
  start does not change the baked token), checks, Playwright Chromium install, CI, image name/tags/Make
  `ci` / port 8080/runtime-config env vars/CORS/healthcheck/podman cleanup, `make publish` artifact names/checksum/manifest,
  production-host HTTPS / CSP / SPA fallback / cache headers / network restriction / atomic install, and the
  production smoke checklist. Browser support and scanner hardware checks live in this document.
-   `.github/workflows/check.yml`: GitHub Actions quality gate for pull requests and pushes to `main`. Uses the Node
  version from `.nvmrc`, Corepack/Yarn, immutable `yarn install`, Playwright Chromium
  (`yarn playwright install --with-deps chromium`), `VITE_API_SECRET_KEY=test-api-token`, and `make check`. Does not
  upload `dist/`, `ci/artifacts/`, coverage, Playwright reports, or secrets as artifacts.
- `.env.example`: Committed template for `VITE_API_SECRET_KEY`; copy to gitignored `.env` for local dev and builds.
- `.gitignore`: Excludes dependencies, generated output (`dist/`, `coverage/`, `.vite/`, `playwright-report/`,
  `test-results/`, `ci/artifacts/`), secrets, local data, editor files, and OS metadata.
- `.gitattributes`: Normalizes text files to LF line endings and marks common binary extensions.
- `.cursor/rules/documentation-style.mdc`: Markdown punctuation, line-length, and newline rules for Cursor.
- `.cursor/rules/grep-tool.mdc`: Requires `grep` rather than the `rg` shell command in this environment.
- `.cursor/rules/readonly-git.mdc`: Prohibits Cursor from changing Git state.
- `.cursor/rules/scope.mdc`: Defines allowed repository read/write boundaries and related Shade repositories.

The `.cursor` rules control AI-assisted work. They are not loaded by the application or included in builds.

Useful documents under `docs/` when a task needs them. This file is the complete LLM baseline on its own; do not treat
another project prompt as required reading before starting. Attach the items below only when the current work requires
their contents (for example, the active ticket's acceptance criteria or the OpenAPI schemas for an API change).

- `docs/tickets/`: Sequenced feature ticket files live here while open and are removed after completion. Current open
  sequenced work: `FEAT-01_long-titles.md`, `FEAT-02_album-support.md` (album MVP frontend implementation against
  backend 1.0.16). Informal UI feedback such as `ui-nits.md` may also live here; it is not a sequenced build ticket
  unless the user asks to implement items from it. When the directory holds only `.gitkeep` and/or informal notes, ask
  which work to take next rather than inventing a follow-on feature.
- `docs/product-docs/PRODUCT_REQS.*.md`: Product requirements drafts and notes.
- `docs/product-docs/UI_DESIGN_NOTES.MD`: UI and design decisions; consult when visual design is in question.
- `docs/product-docs/UI_DESIGN_NOTES.ALBUM_ANALOGIES.md`: Album UI analogy notes; consult with `FEAT-02`.
- `docs/technical-reference/openapi.json`: Authoritative backend OpenAPI 3.1 schemas (LibraryV2; currently
  `info.version` `1.0.16` -- see Backend Contract), including book `book_id` / covers / filters / bulk routes,
  loans with nullable `book_id`/`album_id` and `media_type`, wishlist `wishlist_item_id` plus mixed `/items` and album
  membership routes, album catalog/lookup/artwork/circulation, `/artists`, `/genres`, and additive album dashboard
  fields.
- `docs/technical-reference/API-for-FE.md`: Behavioral API guidance complementary to `openapi.json` (including
  normalized author/category/artist/genre catalog rules, album lookup/artwork/circulation, mixed wishlists, atomic bulk
  shelf-move rules, Build Mode bulk lookup/import semantics, wishlist **412** semantics, mixed-media shelf/collection
  **412**, collection membership `shelf_name` null for unshelved rows, and Book covers display/upload guidance for
  authenticated **200** image bytes / multipart `file`).
- `docs/technical-reference/bash-reference.md`: Shell command reference notes for maintainers.
- `docs/full-project-context.md`: Optional slim always-on pack for chats without repo access (not required when
  this file is already loaded).

## Development Commands

Initial setup:

```sh
nvm use
corepack enable
make install
```

Common commands:

- `make install`: Runs `yarn install --immutable`; fails when the manifest and lockfile disagree.
- `make run`: Starts the Vite development server with hot reloading.
- `yarn preview`: Serves an existing production build.
- `make lint`: Runs ESLint with zero warnings allowed.
- `make typecheck`: Runs TypeScript build mode across both TypeScript configurations.
- `make test`: Runs all Vitest tests once.
- `yarn test:watch`: Runs Vitest in watch mode during development.
- `yarn test:e2e`: Runs Playwright browser journeys under `e2e/` (also part of `make check`). Requires Chromium via
  `yarn playwright install --with-deps chromium` on a new machine.
- `yarn test:coverage`: Runs Vitest with V8 coverage and enforced global thresholds (also part of `make check`).
- `make build`: Type-checks and writes an optimized application to `dist/`.
- `make bundle-check`: Enforces the main-entry gzip budget against an existing `dist/` (`yarn bundle:check`).
- `make ci`: Runs `ci/build-local.sh` (`make build`, then builds `shade-frontend:latest` and
  `shade-frontend:<package.json version>` from `ci/Containerfile`).
- `make publish`: Runs `ci/build-prod.sh`, then writes `ci/artifacts/shade-frontend-<package.json version>.tar.gz` plus
  SHA-256 and manifest sidecars (`yarn release:pack`). Opt-in; not part of `make check` beyond inspection tests.
- `make check`: Runs lint, type checking, generated OpenAPI drift checking, Vitest with coverage, Playwright e2e, the
  production build, and bundle-size enforcement (`yarn check`); this is also the GitHub Actions quality gate.
- `yarn api:generate`: Regenerates `src/api/generated/openapi.ts` from `docs/technical-reference/openapi.json`.
- `yarn api:check`: Regenerates types and fails if the generated file differs from git. Keep callers aligned with the
  checked-in OpenAPI (including `AuthorRead` / `author_ids` / `BookAuthorRead`, `CategoryRead` / `category_ids` /
  repeated `category_id`); do not hand-edit generated types.

`make check` currently performs type checking twice because `make build` also type-checks. This is expected.

Local API connectivity: by default `public/config.js` points at `http://127.0.0.1:8000` and the backend allows the Vite
origins, so no proxy is required. Optional same-origin proxy: set `apiBaseUrl` to the Vite origin and run
`SHADE_API_PROXY=1 make run` (optional `SHADE_API_PROXY_TARGET`).

The build flow is:

```text
make build
  -> yarn build
       -> tsc -b
            -> tsconfig.app.json
            -> tsconfig.node.json
       -> vite build
            -> follows imports from index.html and src/main.tsx
            -> writes dist/
```

## Implementation Conventions

- Keep TypeScript strict and avoid `any` unless an unavoidable boundary is documented.
- Prefer semantic HTML. Add ARIA only when native semantics cannot express the behavior.
- Preserve landmarks, visible keyboard focus, labels linked to errors, skip link, dialog focus restoration, document
  title plus heading focus on route change, no color-only status, usable 320px viewports, 44-pixel control targets, and
  reduced-motion support.
- Reuse design tokens and existing shared CSS classes before adding new values or primitives.
- Shared CSS follows `.component`, `.component__element`, and `.component--modifier` naming.
- Import global CSS once through `src/index.css`; do not scatter global imports across components.
- Import shared components from `src/components/index.ts`.
- Colocate component tests using `*.test.tsx` (and colocated `*.test.ts` for non-UI modules).
- Use extensionless relative TypeScript imports, matching current source style.
- Follow the existing TypeScript style: single quotes, no semicolons, and trailing commas where supported.
- Keep feature UI behind the existing `src/features/*/routes/` ownership; extend implemented pages rather than
  inventing a parallel tree. Leave diagnostics under
  `src/diagnostics/diagnosticReporter.ts` wired through `RootErrorBoundary` / `AppProviders` / `ConnectionProvider` /
  `apiClient` `onRequestFailure` and optional runtime config (`public/config.js` / `RuntimeConfig.diagnostics`); never
  fabricate correlation IDs, invent a second telemetry transport, or log denylisted fields. Leave primary navigation
  under `AppShell` / `DrawerNavMenu` (Dashboard link; Collection Browse/Manage/Collections/Wishlists and Circulation
  Loans only; brand image link to Home `/`). Leave discovery Home under `HomePage` / `homeDiscoveryModel` /
  `homeQuotes` and About under `AboutPage` / `CatalogGuide` at `/about`. Leave `/collection/manage` under
  `ManageCollectionPage` (Add Book, Shelves only). Leave Books catalog filtering / bulk actions under
  `BooksPage` /
  `booksListModel` / `BooksListControls` / `useBulkSelection` / `BooksBulkActions` / `BulkMoveToShelfControl` /
  `booksApi.moveToShelf` / `useBulkMoveBooksToShelf` (centralized URL filters including `shelf_name` / `is_read` /
  `cleanup_field`; atomic `POST /books/bulk/move-to-shelf` only -- never per-book `PATCH` loops). Leave edit under
  `EditBookPage` / `bookEditModel` (minimal `BookUpdate` patch; blank ISBN → `null`; omit unchanged `author_ids`; never
  send `status=on_loan`, reading fields, or loan-driving values). Leave delete under `DeleteBookPage` (`useDeleteBook` /
  `booksApi.remove`; block when `status === 'on_loan'` or `findActiveLoan` is present; invalidate
  `queryKeys.collections.all` on success).
  There is no browser backup page (`/admin/backup`,
  `BackupLibraryPage`, or `backupApi`); never inspect, log, cache, or upload SQL dump contents. Leave dashboard under
  `DashboardPage` / `useDashboard` / `useDashboardBreakdowns` / `useDashboardIncompleteMetadata` (display API stats
  only; null averages as "Not enough data"; do not recalculate from `GET /books`; do not combine book and album
  dashboard fields; deep-link into Books filters /
  cleanup mode; incomplete-metadata infinite list stays on Books via `useInfiniteIncompleteMetadataBooks`). Leave
  reading flows under `MarkReadPage` /
  `markReadModel` / `ReadingEditPage` / `readingEditModel`. Leave scanner code under `src/features/scanning/`: camera
  lazy-loaded from `/books/new` only; create-path hardware on `NewBookPage`; collection jump via
  `useCollectionIsbnJump` on `/dashboard`, `/books`, and `/loans` (unique match opens detail; otherwise
  `/books?isbn=`). Leave checkout under `CheckoutDialog` / `checkoutModel` / `checkoutEligibility` on
  `BookDetailsPage` (borrower and notes only; timestamps computed client-side; `412` `display_only` refetch/messaging
  without alternate copies; `/checkout` is `LegacyCheckoutRedirect` only). There is no standalone checkout page, ISBN
  Find on checkout, camera capture on checkout, or alternate-copy chooser. Leave check-in and loan history under
  `CheckinForm` / `checkinModel` / `checkinEligibility` / `LoansPage` / `loanTemporal` (check-in on `/loans`;
  `/checkin` is `LegacyCheckinRedirect` only). Leave shelves under `ShelvesPage` / `shelfDisplay` / `shelfFormModel` /
  `shelvesApi` / `useShelves` / write mutations (`/shelves` owns create/edit/delete with system-shelf protection; book
  forms use API-fed pickers with `shelf_name`, never shelf CRUD on Add/Edit Book; shelf counts deep-link to
  `/books?shelf_name=`). Leave wishlists under `WishlistsPage` / `AddWishlistBookControl` /
  `MoveWishlistBookToShelfControl` / `moveWishlistBookModel` / `wishlistFormModel` / `wishlistDisplay` /
  `wishlistsApi` / `wishlistsQueries` (`/wishlists` owns catalog CRUD, add, and move-to-shelf; memberships via
  `useBook` / `GET /books/{book_id}`; add via unshelved create with resolved `author_ids` then membership; move via
  membership `DELETE` then `PATCH { shelf_name }`; no add-from-collection or membership field edit). Leave collections
  under `CollectionsPage` / `EditCollectionForm` / `AddCollectionBookControl` / `AddBookToCollectionDialog` /
  `CollectionMembershipRow` /
  `collectionFormModel` / `collectionDisplay` / `collectionsApi` / `collectionsQueries` (`/collections` owns
  create/edit/delete, shelved-only add search, reorder/remove; Book Details owns add-current-book via
  `AddBookToCollectionDialog`; memberships via `useBook` / `GET /books/{book_id}`; duplicate
  **409**; no shelf/wishlist overlap **412**; no move-to-shelf on collection rows). Keep Vitest / Testing Library /
  `renderAppTree` coverage, Playwright `e2e/` (`playwright.config.ts`, stateful `mockApi`, axe helper), enforced
  coverage floors, and `make check` integration (`test:coverage` + `test:e2e` + `bundle:check`). Extend those suites
  rather than inventing a parallel fake-API stack or removing them from the gate. Keep `.github/workflows/check.yml`
  and `scripts/checkBundleSize.mjs` in the canonical gate; do not add secret-bearing CI artifacts. Keep
  `ci/Containerfile`, `ci/nginx.conf`, `ci/container-entrypoint.sh`, `.containerignore`, and Make `ci` /
  `ci/build-local.sh`; do not add containerized Vite/HMR or a Compose file in this repo. Keep `scripts/packRelease.ts`,
  Make `publish` / `ci/build-prod.sh`, gitignored `ci/artifacts/`, and the production-like host inspection tests; do
  not upload secret-bearing archives from default CI or treat the Compose image as production. Do not invent FE-only
  cover providers. Never
  simulate checkout, check-in, initial mark-read, mark-played, cover upload/delete, or album artwork
  upload/delete/refetch with generic `PATCH`. Never
  implement bulk shelf moves as per-book `PATCH` loops. Do not start album UI except under `FEAT-02` or an explicit
  request.
- Reuse the typed client, query keys, mutation invalidation, and redaction helpers; do not introduce a second
  state store, component library, CSS framework, or form library unless a product need explicitly requires it.
- Keep forms, scanner, and dialogs local; keep connection state application-wide; invalidate affected queries after
  mutations. There is no realtime API.
- For API-dependent work, treat `docs/technical-reference/openapi.json` as the schema source of truth and
  `docs/technical-reference/API-for-FE.md` as behavioral guidance. Prefer a running backend `/openapi.json` for drift
  checks when available; do not invent lifecycle behavior with generic `PATCH`. Leave authors under `authorsApi` /
  `authorsQueries` / `authorDisplay` / `BookForm` ordered `author_ids` assignment and inline `useCreateAuthor` on
  lookup/wishlist flows; do not send free-form author strings on book payloads or invent a second author model. Leave
  categories under `categoriesApi` / `useCategories` / `categoryDisplay` / `BookForm` multi-assignment / Books
  multi-`category_id` filters and centralized Books URL filters including `shelf_name` / `is_read` / `cleanup_field`;
  do not use singular `category` enum selectors or hard-coded taxonomy. Leave bulk shelf moves under
  `booksApi.moveToShelf` / `useBulkMoveBooksToShelf` / `BulkMoveToShelfControl` against
  `POST /books/bulk/move-to-shelf` only. Leave covers under `booksApi.getCover` / `uploadCover` / `removeCover`, `useBookCover` / `useUploadBookCover` /
  `useRemoveBookCover`, shared `BookCover`, and `BookCoverManager` against authenticated `GET` / `PUT` /
  `DELETE /books/{book_id}/cover` per `API-for-FE.md` (**200** blob or **404**; multipart `file`); never invent browser
  URLs from `cover_image_path`, call Open Library from the SPA, or PATCH cover fields onto `BookUpdate`.
- Prefer product-domain names over vague folders such as `helpers` or `misc`.
- Never commit the API token (keep `.env` gitignored), put it in URLs, log Authorization headers, render API text as
  HTML, or upload SQL backup contents to telemetry. The token is injected at build time and appears in JS bundles by
  design. SQL backups are sensitive.

## Change Workflow

1. Inspect the relevant source, tests, configuration, and current working tree.
2. Identify the smallest complete change and any behavior that requires a test.
3. Implement without modifying unrelated work.
4. Run focused tests or checks while iterating.
5. Run `make check` when proportionate to the change.
6. Review the final diff for correctness, accidental generated files, secrets, and stale documentation.
7. Report changed files, verification performed, and any remaining uncertainty.

If a new file, command, dependency, architecture pattern, or runtime flow is introduced, update this context so the next
fresh chat does not begin with stale assumptions.
