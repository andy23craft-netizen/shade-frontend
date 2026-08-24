# Shade Frontend — Master Implementation Context

Slim always-on context for ChatGPT or any assistant without direct repository
access.

This document is the self-contained operating baseline for the Shade frontend.
It describes working rules, architecture, non-negotiables, current product
state, and the minimum reference index needed to continue development safely.

A current feature ticket, when one exists, is supplied separately. Do not
assume this document replaces the ticket or the checked-in API contract.

**Context pack version:** 2026-08-23

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

Do not paste a full API re-synthesis or large requirements documents into every
conversation. Prefer the checked-in contract and the minimum relevant source
files.

---

# 1. Repository visibility and authority

ChatGPT does not automatically have access to the repository.

This context is a dated baseline. It does not prove that a specific source file
still has exactly the shape described here.

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

Explain discrepancies rather than silently forcing an older plan onto the
current codebase.

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

Avoid unnecessary theory, but explain architectural decisions and relevant
React / TypeScript / API / testing / accessibility concepts.

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

No Next.js, Tailwind, component library, Redux/alternate state store, or form
library.

## Backend

Separate FastAPI repository.

Default local URL:

```text
http://127.0.0.1:8000
````

No `/api` prefix.

Authoritative frontend contract:

```text
docs/technical-reference/openapi.json
docs/technical-reference/API-for-FE.md
```

Generated types:

```text
src/api/generated/openapi.ts
```

Regenerate generated types from the checked-in OpenAPI contract; never edit
them manually.

---

# 4. Current product baseline

The core V1 application is live rather than placeholder UI.

## Routes

Current registered product routes include:

```text
/
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

* `/` is the About page.
* Dashboard is `/dashboard`.
* Brand link reaches About.
* Primary Dashboard link is direct.
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

Do not restore dedicated Checkout / Check-in navigation.

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

Application version comes from `package.json` via `APP_VERSION`, not runtime
config.

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
* JSON helpers;
* unauthorized handling;
* typed API errors;
* diagnostics reporting.

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

Server state uses React Query. Extend existing query-key families and hooks;
do not create a parallel cache/state system.

Global query behavior includes:

* 30s stale time;
* refetch on focus/reconnect;
* no retry for inappropriate auth/validation/cancelled cases;
* mutations do not automatically retry.

---

# 7. Books catalog — current state

`/books` uses infinite pagination with a shared batch size of 30.

Primary implementation:

```text
src/api/booksApi.ts
src/api/booksQueries.ts
src/features/books/booksListModel.ts
src/features/books/components/BooksListControls.tsx
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

Bulk-selected Books may be moved to a destination shelf through the backend
atomic mutation:

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

The bulk-move UI has been manually verified at normal and narrow responsive
layouts.

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

* restore a singular hard-coded category enum;
* revive `?category=`;
* hard-code the taxonomy into the SPA.

Frontend category administration remains outside V1 unless explicitly added by
a later ticket.

---

# 9. Shelves — current state

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
* UI retains `shelf_id` for selection but submits `common_name` as
  `shelf_name`.
* Bulk Move follows the same live shelf catalog and assignment rules.
* Shelf names are displayed in Title Case.
* Create requires an explicit shelf selection.
* `unknown` is selectable.
* `removed` is excluded from ordinary assignment.
* Edit may preserve/surface current `removed` membership.
* System shelves `unknown` and `removed` cannot be renamed or deleted;
  allowed metadata edits remain supported.

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
* shelf name and count link to:
  `/books?shelf_name=<common_name>`.

If the breakdown-count query fails, Shelves shows a retryable count error
instead of pretending all counts are zero.

The Shelves catalog is responsive:

* desktop: 3 cards per row;
* medium: 2;
* small/mobile: 1.

---

# 10. Dashboard — current state

`/dashboard` remains a five-drawer card-catalog dashboard.

Queries:

```text
useDashboard()
useDashboardBreakdowns()
useDashboardIncompleteMetadata()
```

`useInfiniteIncompleteMetadataBooks()` is consumed by Books cleanup mode rather
than mounted by Dashboard.

## Drawer I — Collection

Shows API-provided collection statistics.

Do not recalculate dashboard statistics from `GET /books`.

## Drawer II — Circulation

Shows borrowing/circulation summary.

Loan history links to `/loans`.

## Drawer III — Reading Record

Contains the Read/Unread visualization and metrics.

Both Read and Unread counts deep-link to Books:

```text
Read   -> /books?is_read=true
Unread -> /books?is_read=false
```

API top-level `read` / `unread` values remain the display source.

## Drawer IV — Basic Stats

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

## Drawer V — Healing Metadata

Displays:

* total books needing metadata;
* missing Category;
* missing Shelf;
* missing Pages;
* missing Publisher;
* missing Publication Year;
* missing ISBN.

Each per-field count links to Books cleanup mode.

The old Dashboard-local affected-book browser has been removed.

## Refresh/error behavior

Unified Refresh refetches:

* dashboard summary;
* dashboard breakdowns;
* incomplete-metadata summary.

Preserve offline/stale state, drawer-level errors, and independent report
failure behavior.

---

# 11. Reading and circulation flows

## Checkout

Product checkout lives on Book Details through `CheckoutDialog`.

`/checkout` is compatibility routing only.

Do not simulate checkout with generic PATCH.

## Check-in

Product check-in lives on `/loans`.

`/checkin` is compatibility routing only and redirects to Loans while
preserving search.

`/loans?bookId=...` opens the relevant check-in workflow.

No strict user-facing due-date workflow should be reintroduced.

## Reading

Unread active books may be marked read through the dedicated mark-read route.

Already-read books use Reading Edit for later completion/rating/review changes.

Do not introduce Mark Unread unless explicitly requested.

---

# 12. Wishlists and Collections

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

---

# 13. Delete / restore and backup boundary

Books use soft delete.

Use dedicated delete/restore endpoints.

Deleted Books admin lives at:

```text
/admin/deleted
```

Authenticated SQL backup remains an API-host concern.

There is no browser Backup page/API caller.

Never inspect, log, cache, or upload backup contents from frontend code.

---

# 14. Scanner behavior

Camera ISBN scanning remains on `/books/new` only.

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

A NewBookPage camera-scanner test has shown occasional full-suite timing
flakiness while passing independently. Do not treat an isolated timeout waiting
for the asynchronously loaded scanner as a product regression without
reproduction.

---

# 15. Testing and quality gate

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

## Current verification state

FEAT-31/32 focused tests are green, including:

* API bulk mutation;
* React Query bulk mutation;
* bulk-selection model/hook;
* `BulkMoveToShelfControl`;
* `BooksPage` bulk-selection integration;
* `ConfirmationDialog`.

Bulk Move has also been manually exercised successfully in the browser.

The backend OpenAPI contract now includes:

```text
POST /books/bulk/move-to-shelf
```

The frontend checked-in OpenAPI and generated types have been updated to match.

`contractSmoke.test.ts` required the new path to be added to its expected path
list after the contract update.

The final full-project `make check` rerun is not yet recorded as green for this
baseline. Do not claim the final gate passed until the current run confirms it.

---

# 16. Accessibility and responsive baseline

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

Success messaging uses a polite status announcement; errors use alert
semantics.

Automated axe complements manual keyboard/responsive checks; it does not replace
them.

Do not claim untested browsers/devices passed.

---

# 17. CSS / visual architecture

CSS layers:

```text
tokens -> base -> shell -> components
```

Primary component styling lives in:

```text
src/styles/components.css
```

Use existing design tokens where possible.

Card-catalog surfaces use light cardstock tokens such as:

```css
--color-surface
--color-surface-muted
--color-surface-text
--color-surface-text-muted
```

Do not use dark-page `--color-text` for text/links on light cardstock surfaces.

Bulk-selection actions use the existing card-catalog visual language.
`BulkMoveToShelfControl` has its own grid spacing so its status, destination
field, and action do not crowd each other.

---

# 18. Non-negotiables

## API / data

* Backend contract wins.
* Do not invent undocumented routes.
* Do not hand-edit generated OpenAPI types.
* Reuse existing API helpers and React Query keys.
* Do not duplicate server state into a second state store.
* Do not silently recalculate API-owned dashboard metrics.
* Preserve tenant header behavior.
* Prefer dedicated lifecycle endpoints.
* Bulk shelf movement must use the dedicated atomic endpoint, not repeated
  single-book PATCH requests.

## Product behavior

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

## Scope discipline

Do not implement later tickets merely because the API already supports them.

When no current ticket is supplied, ask which work should be taken next rather
than guessing.

---

# 19. Current ticket / remaining-work status

Completed historical product work through FEAT-29 should not be reimplemented.

Recent V1 work now includes:

* expanded Books filtering/deep-link plumbing;
* Books cleanup mode;
* Dashboard metadata/read deep links;
* Shelves counts and filtered-Books navigation;
* Dashboard category-assignment donut;
* FEAT-31 bulk-selection infrastructure;
* FEAT-32 atomic bulk move-to-shelf UI and API integration.

## FEAT-31 — implemented

Bulk selection is integrated into Books with loaded-row Select All, individual
selection, selection clearing, and filter/sort lifecycle behavior.

## FEAT-32 — implementation complete; final gate pending

Bulk Move to Shelf is implemented against:

```text
POST /books/bulk/move-to-shelf
```

Focused tests and manual UI verification are green.

The final authoritative `make check` result still needs to be recorded after
the OpenAPI/contract-smoke synchronization and unrelated scanner-test rerun.

## Remaining planned V1 work

```text
FEAT-33 Home discovery
FEAT-34 cover images stretch
FEAT-35 V1 regression / deployment gate
```

Ticket presence under `docs/tickets/` is more authoritative than stale
`docs/ToDo.md` entries.

---

# 20. Condensed source inventory

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
src/features/checkout/
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
```

## Contract verification

```text
docs/technical-reference/openapi.json
docs/technical-reference/API-for-FE.md
scripts/contractSmoke.test.ts
```

---

# 21. Ticket implementation procedure

For a feature ticket:

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

7. **Update docs only where behavior/baseline genuinely changed.**

Treat failing old assertions carefully: determine whether they expose a real
regression, expected contract drift, or intentionally retired behavior.

---

# 22. Document index — attach on demand

| Need                                | Document                                 |
| ----------------------------------- | ---------------------------------------- |
| API paths, schemas, methods, enums  | `docs/technical-reference/openapi.json`  |
| API behavioral guidance             | `docs/technical-reference/API-for-FE.md` |
| UI/design decisions                 | `docs/product-docs/UI_DESIGN_NOTES.MD`   |
| Category architecture notes         | `docs/product-docs/CATEGORY_NOTES.md`    |
| Current product work                | relevant file under `docs/tickets/`      |
| Setup / local development / release | `README.md`                              |
| Production-host ownership           | `docs/MAINTAINERS.md`                    |
| Build checklist                     | `docs/ToDo.md` — may lag tickets         |

Prefer the current ticket and API contract over old planning notes.

---

# 23. Final working principle

Build Shade incrementally and in a way the user understands.

Be explicit, practical, conservative about architecture, honest about what
repository state is visible, respectful of the backend contract, and focused on
the current work.

Use complete code and exact paths.

Explain why.

Do not invent requirements.

Do not silently revive retired behavior.

Do not implement later tickets early.

When information is missing, request the minimum evidence needed to proceed.
