# Shade Frontend -- Master Implementation Context

Slim always-on context for ChatGPT or any assistant without direct repository access.

This document is the complete self-contained operating baseline for the Shade frontend. It covers working rules,
architecture, non-negotiables, current product state, the backend contract summary, and the minimum reference index
needed to continue development safely. Start from this file alone for that baseline. Do not require, request, or defer
to any other LLM prompt, project agents guide, or companion context file. Everything needed for day-to-day
implementation guidance is in this document. Attach the current feature ticket (when one exists) and the checked-in API
contract only when the task needs them.

A current feature ticket, when one exists, is supplied separately. Do not assume this document replaces the ticket or
the checked-in API contract. When `docs/tickets/` is empty (aside from `.gitkeep`), no sequenced feature ticket is
open -- ask which work to take next rather than inventing a follow-on feature.

**Context pack version:** 2026-08-24

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

- `docs/product-docs/UI_DESIGN_NOTES.MD`.

If repository contents are not visible:

- request only the minimum exact files / command output needed.

If deployment / packaging is involved:

- `README.md`;
- `docs/MAINTAINERS.md` when production-host ownership matters.

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

Checked-in OpenAPI is LibraryV2 with `info.version` currently `0.2.11` (includes many-to-many categories, expanded `GET
/books` filters, `POST /books/bulk/move-to-shelf`, `BookRead.cover_image_path`, and `GET` / `PUT` /
`DELETE /books/{id}/cover`). Cover resolution -- including the Open Library ISBN fallback -- happens server-side; `GET
/books/{id}/cover` returns **200** image bytes or **404**.

Generated types:

```text
src/api/generated/openapi.ts
```

Regenerate generated types from the checked-in OpenAPI contract (`yarn api:generate` / `yarn api:check`); never edit
them manually.

Prefer dedicated lifecycle endpoints over generic `PATCH` for restore, checkout, check-in, initial mark-read, bulk shelf
move, and cover upload/delete.

---

# 4. Current product baseline

The core V1 application uses dedicated product pages (not route placeholders).

## Routes

Current registered product routes include:

```text
/                         Home (discovery)
/about                    About (library information)
/dashboard
/books
/books/new
/books/:bookId
/books/:bookId/edit
/books/:bookId/delete
/books/:bookId/mark-read
/books/:bookId/reading
/collection/manage
/collections
/wishlists
/shelves
/loans
/admin/deleted
/checkout        compatibility redirect
/checkin         compatibility redirect
*
```

## Navigation

* `/` is discovery Home (`HomePage`).
* `/about` is library information (`AboutPage` + `CatalogGuide`).
* Brand link recovers to Home (`/`).
* Dashboard is `/dashboard` (direct primary-nav link).
* About is reachable from Home (hero and secondary links), not a separate primary-nav item.
* Collection drawer:

  * Browse
  * Manage
  * Collections
  * Wishlists
* Circulation drawer:

  * Loans only
* `/collection/manage` links:

  * Add Book
  * Shelves
  * Deleted Books

Circulation has no Checkout or Check-in nav items. Dashboard lives at
`/dashboard`, not `/`.

## Home and About

Home answers: what might I want to browse or read?

Primary implementation:

```text
src/features/home/routes/HomePage.tsx
src/features/home/homeDiscoveryModel.ts
src/features/home/homeQuotes.ts
src/features/home/components/
src/features/about/routes/AboutPage.tsx
src/features/about/components/CatalogGuide.tsx
```

Home includes:

* hero image linking to `/about`;
* randomized quote bucket (`homeQuotes`);
* New Additions via `useRecentBooks` (newest 10 by `creationDate` desc);
* featured category drawers from top `by_category` buckets joined to `useCategories` (`topHomeCategories` /
  `homeCategoryHref` → `/books?category_id=`);
* Staff Picks carousel from the Collections membership named `Staff Picks`;
* secondary links to Browse, Collections, Wishlists, and About;
* cover thumbnails on New Additions and Staff Picks via shared `BookCover`.

Optional counts/metadata failures must not blank core category browsing.

About retains dedication, lending policy, purpose, and the accessible Catalog Guide.

---

# 5. Authentication, runtime config, and API client

## Auth

Authenticated API requests send:

```text
Authorization: Bearer <VITE_API_SECRET_KEY>
Library-Username: shade
```

The token is build-time configuration from repository-root `.env`.

Do not introduce:

* runtime token entry;
* `sessionStorage` token storage;
* a connection-settings token form.

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

Startup reachability uses public:

```text
GET /health
```

Connection states:

```text
checking
connected
unauthorized
unreachable
```

Do not use `/protected` as the startup health check.

## API client

Reuse `src/api/apiClient.ts`.

It handles:

* Bearer auth;
* `Library-Username`;
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
* selection is ID-based rather than tied to card instances.

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

---

# 8. Categories

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

---

# 9. Book covers

Authenticated cover routes:

```text
GET    /books/{id}/cover
PUT    /books/{id}/cover
DELETE /books/{id}/cover
```

Behavioral detail beyond OpenAPI schemas lives in `docs/technical-reference/API-for-FE.md` (Book covers). Cover
resolution -- including the Open Library ISBN fallback -- happens server-side behind the authenticated cover endpoint
(OpenAPI `0.2.11+`).

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
  4. soft-deleted / missing book → **404** `"Book not found"`.
* Local uploads always take priority over ISBN-derived artwork.
* Open Library timeout / network / missing / non-image responses resolve to the normal **404** cover state.
* Soft-deleted books reject cover get/upload/delete (**404**).

Browser display cannot put `Authorization` on an `<img src>`. Use authenticated `fetch` to `GET /books/{id}/cover`:

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

Cover loading stays independent of core book queries. Non-JSON binary responses today are `GET /backup` and
`GET /books/{id}/cover`.

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
* Edit may preserve/surface current `removed` membership.
* System shelves `unknown` and `removed` cannot be renamed or deleted; allowed metadata edits remain supported.

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

`/dashboard` is a five-drawer card-catalog dashboard.

Queries:

```text
useDashboard()
useDashboardBreakdowns()
useDashboardIncompleteMetadata()
```

`useInfiniteIncompleteMetadataBooks()` is consumed by Books cleanup mode rather than mounted by Dashboard.

## Drawer I -- Collection

Shows API-provided collection statistics.

Do not recalculate dashboard statistics from `GET /books`.

## Drawer II -- Circulation

Shows borrowing/circulation summary.

Loan history links to `/loans`.

## Drawer III -- Reading Record

Contains the Read/Unread visualization and metrics.

Both Read and Unread counts deep-link to Books:

```text
Read   -> /books?is_read=true
Unread -> /books?is_read=false
```

API top-level `read` / `unread` values remain the display source.

## Drawer IV -- Basic Stats

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

## Drawer V -- Healing Metadata

Displays:

* total books needing metadata;
* missing Category;
* missing Shelf;
* missing Pages;
* missing Publisher;
* missing Publication Year;
* missing ISBN.

Each per-field count links to Books cleanup mode. There is no Dashboard-local affected-book browser.

## Refresh/error behavior

Unified Refresh refetches:

* dashboard summary;
* dashboard breakdowns;
* incomplete-metadata summary.

Preserve offline/stale state, drawer-level errors, and independent report failure behavior.

---

# 12. Reading and circulation flows

## Checkout

Product checkout lives on Book Details through `CheckoutDialog`.

`/checkout` is compatibility routing only.

Do not simulate checkout with generic PATCH.

Book Details shows cover art via shared `BookCover` (eager) and upload/remove via `BookCoverManager` when the book is
active. Cover fetch stays independent of the core `useBook` query. Never use `cover_image_path` as a browser URL.

## Check-in

Product check-in lives on `/loans`.

`/checkin` is compatibility routing only and redirects to Loans while preserving search.

`/loans?bookId=...` opens the relevant check-in workflow.

There is no strict user-facing due-date workflow.

## Reading

Unread active books may be marked read through the dedicated mark-read route.

Already-read books use Reading Edit for later completion/rating/review changes.

Do not introduce Mark Unread unless explicitly requested.

---

# 13. Wishlists and Collections

## Wishlists

Wishlists contain unshelved catalog books.

Add flow:

```text
POST /books without shelf_name
then wishlist membership POST
```

Move-to-shelf:

```text
DELETE wishlist membership
then PATCH book { shelf_name }
```

This ordering is required by shelf/wishlist exclusivity.

Do not add `shelf_name` before removing wishlist membership.

## Curated Collections

`/collections` supports:

* create;
* edit name/description;
* delete;
* add existing shelved catalog books;
* reorder;
* remove membership.

Book Details has Add to Collection.

Collections are orthogonal to shelf placement.

Membership rows join title/authors via `GET /books/{id}` and show shared `BookCover`. Location uses
`displayCollectionBookLocation`: **Wishlist** when `on_wishlist`; otherwise Title Case shelf. Membership `shelf_name`
may be JSON `null` for unshelved rows -- do not expect BookRead's synthesized `"unknown"`.

---

# 14. Delete / restore and backup boundary

Books use soft delete.

Use dedicated delete/restore endpoints.

Deleted Books admin lives at:

```text
/admin/deleted
```

Authenticated SQL backup is an API-host concern.

There is no browser Backup page/API caller.

Never inspect, log, cache, or upload backup contents from frontend code.

---

# 15. Scanner behavior

Camera ISBN scanning is on `/books/new` only.

Hardware wedge collection scanning is mounted on:

```text
/dashboard
/books
/loans
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

Coverage floors:

```text
statements 87%
branches   80%
functions  92%
lines      87%
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
* `ConfirmationDialog`;
* Home discovery (`HomePage` / discovery-model tests);
* cover helpers / hooks / `BookCover` / `BookCoverManager` and cover wiring on Books, Home, Collections, and Book
  Details.

The backend OpenAPI contract includes:

```text
POST /books/bulk/move-to-shelf
GET  /books/{id}/cover
PUT  /books/{id}/cover
DELETE /books/{id}/cover
```

Checked-in OpenAPI (`info.version` `0.2.11`) and generated types match. `contractSmoke.test.ts` includes the bulk-move
path and `/books/{id}/cover`.

Treat an empty `docs/tickets/` (aside from `.gitkeep`) plus a green `make check` as the current open-work signal. Re-run
`make check` before claiming a new change is release-ready.

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

That file also owns dashboard, collections, and book-cover (`.book-cover*`)
layout classes. Use existing design tokens where possible.

Card-catalog surfaces use light cardstock tokens such as:

```css
--color-surface
--color-surface-muted
--color-surface-text
--color-surface-text-muted
```

Do not use dark-page `--color-text` for text/links on light cardstock surfaces.

Bulk-selection actions use the existing card-catalog visual language. `BulkMoveToShelfControl` has its own grid spacing
so its status, destination field, and action do not crowd each other.

---

# 19. Non-negotiables

## API / data

* Backend contract wins.
* Do not invent undocumented routes.
* Do not hand-edit generated OpenAPI types.
* Reuse existing API helpers and React Query keys.
* Do not duplicate server state into a second state store.
* Do not silently recalculate API-owned dashboard metrics.
* Preserve tenant header behavior.
* Prefer dedicated lifecycle endpoints (restore, checkout, check-in, mark-read, bulk shelf move, cover upload/delete --
  never simulate those with generic `PATCH`).
* Bulk shelf movement must use the dedicated atomic endpoint, not repeated single-book PATCH requests.
* Covers use `GET` / `PUT` / `DELETE /books/{id}/cover` only. Never invent browser URLs from `cover_image_path`, call
  Open Library from the SPA, or set covers through create/update JSON.
* JSON `null` `shelf_name` or `category_ids` on book update is **422** -- omit those fields instead (OpenAPI may still
  show `null` as a schema option).

## Product behavior

* `/` is discovery Home; `/about` is library information.
* Brand recovers to Home, not About.
* No strict lending due-date pressure.
* No standalone Checkout page.
* No standalone Check-in page.
* No browser Backup page.
* No hard-coded category vocabulary.
* No category admin in V1 unless explicitly requested.
* No Mark Unread unless explicitly requested.
* No wishlist/shelf overlap.
* Collections do not replace shelf placement.
* `removed` is not an ordinary shelf-assignment destination.
* Cover display/upload stays on the authenticated cover routes and shared `BookCover` / `BookCoverManager` surfaces.

## Scope discipline

Do not invent the next product feature merely because the API already supports it. When `docs/tickets/` is empty (aside
from `.gitkeep`), no sequenced feature ticket is open.

When no current ticket is supplied, ask which work should be taken next rather than guessing.

---

# 20. Open work / tickets

When `docs/tickets/` holds only `.gitkeep`, no sequenced feature ticket is open. Prefer an explicit user request or
product docs when choosing further work. Ticket presence under `docs/tickets/` is more authoritative than stale
`docs/ToDo.md` entries.

Current product capabilities are described in the sections above, including:

* Books URL filters and cleanup mode;
* Shelves / Dashboard deep links;
* bulk selection and atomic bulk move-to-shelf;
* discovery Home at `/` with About at `/about`;
* book covers on Book Details, Books, Home, and Collections;
* the canonical `make check` quality gate.

Do not invent the next product feature merely because the API already supports it. Keep covers on the authenticated
cover routes.

## Remaining planned V1 work

```text
(none -- docs/tickets/ is empty aside from .gitkeep)
```

---

# 21. Condensed source inventory

Verify before editing, but these are known architectural locations.

## API

```text
src/api/api.ts
src/api/apiClient.ts
src/api/apiErrors.ts
src/api/apiTypes.ts
src/api/booksApi.ts
src/api/booksQueries.ts
src/api/categoriesApi.ts
src/api/categoriesQueries.ts
src/api/collectionsApi.ts
src/api/collectionsQueries.ts
src/api/dashboardApi.ts
src/api/dashboardQueries.ts
src/api/generated/openapi.ts
src/api/loansApi.ts
src/api/loansQueries.ts
src/api/queryKeys.ts
src/api/requestFields.ts
src/api/shelvesApi.ts
src/api/shelvesQueries.ts
src/api/wishlistsApi.ts
src/api/wishlistsQueries.ts
```

## Books

```text
src/features/books/booksListModel.ts
src/features/books/useBulkSelection.ts
src/features/books/utils/bulkSelectionModel.ts
src/features/books/components/BookCover.tsx
src/features/books/components/BookCoverManager.tsx
src/features/books/components/BookSelectionControl.tsx
src/features/books/components/BooksBulkActions.tsx
src/features/books/components/BooksListControls.tsx
src/features/books/components/BulkMoveToShelfControl.tsx
src/features/books/routes/BooksPage.tsx
src/features/books/routes/BookDetailsPage.tsx
src/features/books/routes/NewBookPage.tsx
src/features/books/routes/EditBookPage.tsx
```

## Dashboard

```text
src/features/dashboard/routes/DashboardPage.tsx
src/features/dashboard/routes/DashboardPage.test.tsx
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
```

## Home / About

```text
src/features/home/routes/HomePage.tsx
src/features/home/homeDiscoveryModel.ts
src/features/home/homeQuotes.ts
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
src/routes/routes.tsx
src/routes/routeMetadata.ts
src/styles/components.css
src/styles/tokens.css
src/assets/Shade_Library_Hero.webp
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

When no ticket is supplied and `docs/tickets/` is empty, ask which work to take next rather than inventing a follow-on
feature.

Treat failing assertions carefully: determine whether they expose a real regression, expected contract drift, or
intentional current behavior.

---

# 23. Document index -- attach on demand

| Need                                   | Document                                 |
| -------------------------------------- | ---------------------------------------- |
| API paths, schemas, methods, enums     | `docs/technical-reference/openapi.json`  |
| API behavioral guidance (incl. covers) | `docs/technical-reference/API-for-FE.md` |
| UI/design decisions                    | `docs/product-docs/UI_DESIGN_NOTES.MD`   |
| Category architecture notes            | `docs/product-docs/CATEGORY_NOTES.md`    |
| Current product work (when open)       | relevant file under `docs/tickets/`      |
| Setup / local development / release    | `README.md`                              |
| Production-host ownership              | `docs/MAINTAINERS.md`                    |
| Build checklist                        | `docs/ToDo.md` -- may lag tickets        |

This Master Implementation Context is the complete always-on baseline. Treat it as sufficient on its own: do not
require, request, or defer to any other project agents guide or companion LLM context file. Attach the rows above only
when the task needs their contents (API schemas, design notes, an open ticket, or deployment ownership). Prefer the
current ticket (when one exists) and the checked-in API contract over planning notes that may lag. When `docs/tickets/`
is empty, ask which work to take next.

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
