# FEAT-30 -- V1 catalog filter plumbing and shelf deep links

## Objective

Expose the finalized backend's useful V1 Book filters through one centralized, URL-addressable frontend filter model.

Keep the Books page as the canonical filtered-catalog surface. Shelves and the future Home page should deep-link into that same model rather than building separate catalog implementations.

## Dependencies

- FEAT-29 dynamic multi-category support is complete.
- Backend universal Book filtering is finalized and documented.
- Relevant filters compose server-side with pagination and sorting.
- The final OpenAPI contract identifies the actual query parameter names, types, null/blank behavior, and status/read representations.

Do not guess filter parameter names from this ticket. Verify them against `openapi.json`, `API-for-FE.md`, and the running backend before implementation.

## Required V1 filter set

At minimum expose frontend support for:

- categories, including multiple categories using the finalized AND/intersection semantics;
- author;
- title;
- ISBN/search-derived state already supported by the scanner/deep-link flow;
- shelf;
- read status;
- availability/catalog status;
- any additional field that the finalized backend contract and current V1 product design identify as necessary for Home/Shelves/core browse.

The backend may support more fields than V1 needs visible controls for. Do **not** add a control for every database column merely because the backend can filter it.

## Required scope

### 1. Centralized filter model

Create or extend one Books filter model responsible for:

- parsing URL search params;
- trimming/normalizing values;
- serializing filter state back to the URL;
- representing multi-value categories correctly;
- preserving sort state;
- clearing filters intentionally;
- producing the options passed to Books queries.

Adding another backend filter later should be a small extension rather than another page-specific state system.

### 2. API/query integration

Extend:

- `booksApi.list`;
- `useBooks` / `useInfiniteBooks`;
- Books query keys;
- associated tests

for every filter exposed by V1.

Blank/whitespace values must be omitted rather than sent as invalid empty query values.

Sorting and pagination/infinite scrolling must continue working while filters are active.

### 3. Books controls

Retain the useful existing filter interactions and add V1 controls for the finalized visible filter set.

Requirements:

- multiple filters compose rather than replace one another;
- controls reflect URL state after reload;
- Clear Filters removes active filters while preserving only intentional non-filter route state;
- ISBN hardware/deep-link behavior remains compatible with the canonical Books URL;
- no-match state remains distinct from an empty library;
- controls can reflow/collapse on small screens without losing semantics.

### 4. Shelf -> Books navigation

Selecting/browsing a shelf from `/shelves` must take the user to the canonical Books route already filtered to that shelf.

Do not build a second shelf-specific catalog list.

The resulting URL must behave exactly like manually selecting the equivalent Books shelf filter.

### 5. Home-ready category links

Provide a stable helper/API for producing canonical category-filtered Books URLs so FEAT-33 Home can use the same representation.

FEAT-30 does not build Home itself.

## Likely implementation areas

Verify exact files before editing.

| Area | Expected change |
| --- | --- |
| `src/api/booksApi.ts` | Finalized visible filter query params and normalization. |
| `src/api/booksQueries.ts` | Filter options for standard/infinite queries. |
| `src/api/queryKeys.ts` | Stable keys containing normalized filter state. |
| `src/features/books/booksListModel.ts` | Canonical parse/serialize/reset/filter-to-query model. |
| `BooksListControls.tsx` | V1 visible controls. |
| `BooksPage.tsx` | URL orchestration, no-match state, composed filtering. |
| `ShelvesPage.tsx` | Navigate to canonical shelf-filtered `/books` URL. |
| shared link helper | Canonical Books filtered URL construction if useful for Shelves/Home. |
| e2e mock API | Honor the finalized filter set and composition semantics used by browser tests. |

## Acceptance criteria

- Refreshing a filtered Books URL restores the same filters and sort state.
- At least two filters can be active together with sorting and produce the composed backend result set.
- Multi-category filtering preserves FEAT-29 AND semantics.
- Shelf, read status, and availability/status use the backend's finalized values rather than frontend-invented translations.
- Blank/whitespace filter values are not sent.
- Clear Filters returns to the unfiltered catalog while preserving only intentional non-filter state.
- No-match and empty-library states remain distinct.
- Existing ISBN scan/deep-link behavior still works.
- Clicking a shelf from `/shelves` lands on `/books` with the correct canonical shelf filter.
- The same shelf URL survives refresh/back navigation.
- A canonical category-filter URL helper/state is available for FEAT-33 Home.
- Infinite scrolling and sorting still work while filters are active.
- Controls are keyboard accessible and usable at 320 px.
- `make check` passes.

## Testing expectations

- API tests for each frontend-exposed filter and omission of blank values.
- Query-key tests proving equivalent normalized filters produce stable keys and distinct filter sets do not collide.
- Pure model tests for URL parse/serialize, multiple categories, clear behavior, and sort preservation.
- BooksPage tests for URL initialization, changes, combined filters, no-match state, and clear behavior.
- ShelvesPage tests asserting the canonical resulting Books URL.
- Regression tests for existing public filter URLs that remain supported.
- Browser-level or integration coverage for at least one composed filter + sort path.
- Run targeted tests while iterating, then `make check`.

## Out of scope

- A visible control for every backend-filterable database field.
- Separate shelf-specific catalog rendering.
- Home page implementation (FEAT-33).
- Bulk selection/movement (FEAT-31/32).
- Frontend category CRUD.
