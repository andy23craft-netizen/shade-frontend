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
  - this Master Implementation Context
  - the current feature ticket, when one exists

If work touches API behavior:
  - docs/technical-reference/openapi.json
  - docs/technical-reference/API-for-FE.md
  - running backend /openapi.json when drift verification is useful

If UI/design is in question:
  - docs/product-docs/UI_DESIGN_NOTES.MD

If repository contents are not visible:
  - request only the minimum exact files / command output needed

If deployment / packaging is involved:
  - README.md
  - docs/MAINTAINERS.md when production-host ownership matters


Do not paste a full API re-synthesis or large requirements documents into every
conversation. Prefer the checked-in contract and the minimum relevant source
files.

---

# 1. Repository visibility and authority

ChatGPT does not automatically have access to the repository.

This context is a dated baseline. It does not prove that a specific source file
still has exactly the shape described here.

Unless the relevant current file or command output is available:

* Do not pretend to have inspected it.
* Do not invent current implementation details.
* Do not assume a planned file exists.
* Do not tell the user to edit unseen code when its current contents matter.
* Ask for the minimum repository evidence required to continue safely.

When files are needed, give a concise **What I need from you** list with:

* exact paths;
* why each file is needed;
* whether the entire file or a section is enough;
* exact terminal commands when command output is better than a file.

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

* exact file paths;
* complete copy/pasteable snippets;
* explicit "add this after X" / "replace Y with Z" instructions;
* complete contents when creating a new file;
* exact terminal commands;
* expected results;
* manageable implementation steps.

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

* React 19
* TypeScript 6 strict
* Vite 8
* React Router 7
* TanStack React Query 5
* generated OpenAPI TypeScript types
* Yarn 4 / Corepack
* Node.js 26.7.0
* ESLint flat config
* Vitest + Testing Library + jsdom
* Playwright + axe
* plain CSS with project design tokens
* native ESM

No Next.js, Tailwind, component library, Redux/alternate state store, or form
library.

## Backend

Separate FastAPI repository.

Default local URL:


http://127.0.0.1:8000


No `/api` prefix.

Authoritative frontend contract:

```text
docs/technical-reference/openapi.json
docs/technical-reference/API-for-FE.md
```

Checked-in OpenAPI baseline is currently `0.2.8`.

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

### Navigation

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

* `apiBaseUrl`
* optional diagnostics configuration

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

It already handles:

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

Generated OpenAPI types live under:

```text
src/api/generated/openapi.ts
```

Regenerate them; never hand-edit them.

Shared API/types/query infrastructure includes:

```text
src/api/api.ts
src/api/apiTypes.ts
src/api/apiClient.ts
src/api/apiErrors.ts
src/api/apiRedaction.ts
src/api/queryKeys.ts
src/api/requestFields.ts
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

## Current URL-backed filtering

The Books list now supports:

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

### Visible controls

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

Read status maps to:

```text
/books?is_read=true
/books?is_read=false
```

Clearing Read status removes the parameter.

### Intentionally hidden filters

`shelf_name` is URL-driven only. There is no visible shelf filter on the Books
page.

Example:

```text
/books?shelf_name=e4
```

The page shows a contextual shelf-filter notice and a clear action.

Shelf and Read may compose:

```text
/books?shelf_name=e4&is_read=false
```

### ISBN

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
* a contextual "Showing books missing …" notice appears;
* Clear cleanup filter returns to normal Books browsing;
* stale ISBN/shelf notices are not shown;
* ISBN unique-auto-open does not run.

The same normal Book cards/details navigation are reused.

## Remaining filter note

This session plumbed `shelf_name` and `is_read`.

A visible/general `status` filter was **not** added during this work. If the
current FEAT-30 ticket still requires `status`, verify that acceptance criterion
before declaring FEAT-30 complete.

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

Book payloads use:

```text
shelf_name: string
```

There is no hard-coded Shelf enum.

## Shelf behavior

* Add/Edit Book shelf options come from the API.
* UI retains `shelf_id` for selection but submits `common_name` as
  `shelf_name`.
* Shelf names are displayed in Title Case.
* Create requires an explicit shelf selection.
* `unknown` is selectable.
* `removed` is excluded from ordinary assignment.
* Edit may preserve/surface current `removed` membership.
* System shelves `unknown` and `removed` cannot be renamed or deleted;
  allowed metadata edits remain supported.

## Shelves page counts and navigation

`ShelvesPage` now also uses:

```text
useDashboardBreakdowns()
```

and maps `by_shelf` buckets to the shelf catalog.

For each shelf:

* its current book count is displayed;
* omitted breakdown buckets display `0`;
* singular/plural `book` / `books` is handled;
* shelf name links to:
  `/books?shelf_name=<common_name>`;
* count links to the same filtered Books list.

If the breakdown-count query fails, Shelves shows a retryable count error
instead of pretending all counts are zero.

## Layout

The Shelves catalog is a responsive grid:

* desktop: 3 cards per row;
* medium: 2;
* small/mobile: 1.

This replaced the visually sparse single-column card list.

---

# 10. Dashboard — current state

`/dashboard` remains a five-drawer card-catalog dashboard.

Queries:

```text
useDashboard()
useDashboardBreakdowns()
useDashboardIncompleteMetadata()
```

`useInfiniteIncompleteMetadataBooks()` is **no longer mounted by Dashboard**.
It is now consumed by Books cleanup mode.

## Drawer I — Collection

Shows API-provided collection statistics.

Do not recalculate dashboard statistics from `GET /books`.

## Drawer II — Circulation

Shows borrowing/circulation summary.

Loan history links to `/loans`.

## Drawer III — Reading Record

Contains the Read/Unread visualization and metrics.

Both Read and Unread counts now deep-link to Books:

```text
Read   -> /books?is_read=true
Unread -> /books?is_read=false
```

The links are present in both the chart legend and metric values.

API top-level `read` / `unread` values remain the display source. If duplicate
nested API totals disagree, show the existing contract warning rather than
recalculating.

## Drawer IV — Basic Stats

Uses `useDashboardBreakdowns()`.

Currently displays:

* Total Books
* On Loan
* category-assignment donut

### Category donut

The previous long category bucket list was replaced because a large category
catalog made Drawer IV excessively tall.

Current behavior:

* sort category buckets descending by count;
* show the top **7** categories dynamically;
* combine every category after #7 into `Other`;
* no category names are hard-coded;
* as collection composition changes, the displayed top categories change
  automatically;
* donut wedges are proportional to category assignment counts;
* center shows total category assignments;
* legend shows category name and count;
* muted multi-slice palette is defined through CSS custom properties;
* note explicitly says books may belong to more than one category.

The chart represents **category assignments**, not mutually-exclusive shares of
books.

Creation Year is currently **not rendered** in Drawer IV. The backend
`by_creation_year` data remains available but was intentionally removed from
the UI because it is not currently useful.

Backend `by_shelf` is also not rendered on Dashboard; it is consumed by
`ShelvesPage` for counts.

## Drawer V — Healing Metadata

Uses only the incomplete-metadata count summary on Dashboard.

Displays:

* total books needing metadata;
* missing Category;
* missing Shelf;
* missing Pages;
* missing Publisher;
* missing Publication Year;
* missing ISBN.

Each per-field count is a link to Books cleanup mode.

The old Dashboard-local:

* field dropdown;
* inline affected-book list;
* Edit links;
* infinite scrolling;
* pagination retry UI

have been removed.

Affected books now belong on the normal Books route through
`cleanup_field`.

## Refresh/error behavior

Unified Refresh refetches:

* dashboard summary;
* dashboard breakdowns;
* incomplete-metadata summary.

It no longer refetches an inline cleanup-book query.

Preserve:

* paused/offline state;
* stale-state notice;
* drawer-level query errors;
* summary drawers remaining visible when a report query fails.

---

# 11. Reading and circulation flows

## Checkout

Product checkout lives on Book Details through `CheckoutDialog`.

`/checkout` is compatibility routing only.

Eligible active/available books get a Check Out button.

Display-only **412** is surfaced without restoring the retired alternate-copy
chooser.

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

Do not simulate initial mark-read with generic PATCH.

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

Collections are orthogonal to shelf placement; do not copy the wishlist
move-to-shelf workflow onto collections.

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

Preserve the existing:

* Vitest / Testing Library architecture;
* `renderAppTree` / project test helpers;
* stateful Playwright mock API;
* axe helper.

Do not invent a parallel fake API/test system.

## Latest reported gate

After the 2026-08-23 Books / Dashboard / Shelves work:

* Dashboard targeted suite: green, 23/23.
* Books and Shelves targeted suites: green.
* The full project gate was rerun after stale Dashboard assertions were
  corrected and was reported passing.

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

Do not use the dark-page `--color-text` token for text/links sitting on the
light cardstock surface.

Current targeted contrast overrides exist for linked values on:

* Healing Metadata counts;
* Shelf cards.

Dashboard IV/V may use larger minimum drawer height than I–III to accommodate
their denser report content.

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

## Scope discipline

Do not implement later tickets merely because the API already supports them.

When no current ticket is supplied, ask which work should be taken next rather
than guessing.

---

# 19. Current ticket / remaining-work status

Completed historical product tickets through FEAT-29 should not be
reimplemented.

Current FEAT-30-era work now includes:

* Books `shelf_name` query plumbing;
* hidden shelf deep links;
* Books visible Read status filter;
* `is_read` URL plumbing;
* Books cleanup mode;
* Dashboard Read/Unread deep links;
* Dashboard Healing Metadata deep links;
* removal of Dashboard inline cleanup-book browser;
* Shelves book counts from dashboard `by_shelf`;
* Shelves deep links into filtered Books;
* responsive Shelves grid;
* Drawer IV category-assignment donut;
* Creation Year removed from current Dashboard presentation.

Verify the current FEAT-30 ticket before marking it complete, especially whether
a `status` filter/control remains required.

Later planned work in the previous V1 outline:

```text
FEAT-31 bulk selection
FEAT-32 bulk move-to-shelf
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
src/features/books/components/BooksListControls.tsx
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

   * break the work into small architectural steps;
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
regression or merely describe intentionally retired behavior.

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

