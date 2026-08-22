# FEAT-30 -- V1 catalog filter plumbing and shelf deep links

## Objective

Expose the remaining useful V1 Book filters through the existing centralized, URL-addressable Books filter model.

Keep `/books` as the canonical filtered-catalog surface. Shelves and the future Home page should deep-link into that
same model rather than building separate catalog implementations.

## Dependencies

- FEAT-29 dynamic multi-category support is complete (ticket file removed).
- Backend universal Book filtering is finalized in checked-in `openapi.json` / `API-for-FE.md`.
- Relevant filters compose server-side with pagination and sorting.

Do not guess filter parameter names. Verify them against `openapi.json`, `API-for-FE.md`, and the running backend
before implementation.

## Current baseline (already shipped; extend, do not rebuild)

| Area | Location / behavior |
| ---- | ------------------- |
| URL / list model | `booksListModel.ts` -- `parseCategoryIdParams`, `parseTextFilterParam`, `parseIsbnParam`, sort parse/labels |
| Books API / queries | `booksApi.list` / `useInfiniteBooks` / query keys send `isbn`, `author`, `title`, repeated `category_id`, sort, pagination |
| List controls | `BooksListControls.tsx` -- multi-category checkboxes, author/title, Apply/Clear, sort |
| Books page | `BooksPage.tsx` -- URL orchestration, ISBN deep-link banner, clear filters, no-match vs empty library, infinite scroll |
| Categories | FEAT-29 AND/intersection via repeated `category_id`; blank/whitespace text filters omitted |
| e2e | `e2e/support/mockApi.ts` honors `isbn` / `author` / `title` / `category_id` composition (not yet shelf/read/status) |

Contract query params still missing from the frontend list path: `shelf_name`, `is_read`, `status`.

## Remaining V1 filter set

Add frontend support for:

- `shelf_name` -- exact shelf membership (`common_name`; backend trims/lowercases);
- `is_read` -- exact boolean;
- `status` -- exact OpenAPI `Status` enum (`unknown`, `available`, `on_loan`, `missing`, `display_only`,
  `reserved`, `reading`).

Already shipped and must keep working: multi-`category_id` (AND), `author`, `title`, ISBN/search-derived state,
sort, pagination/infinite scroll.

The backend also supports publisher, acquisition_source, id, numeric ranges, publication year, and date ranges.
Do **not** add visible controls for those unless current V1 product design explicitly needs them for Home/Shelves/core
browse.

## Remaining scope

### 1. Extend the centralized filter model

Extend `booksListModel` (and Books URL orchestration) for:

- parsing/serializing `shelf_name`, `is_read`, and `status`;
- trimming/normalizing values and omitting blank/invalid empties;
- preserving existing category/author/title/ISBN/sort behavior;
- clearing the new filters with Clear Filters;
- producing options passed to Books queries.

Adding another backend filter later should remain a small extension of this model.

### 2. API/query integration

Extend `booksApi.list`, `useBooks` / `useInfiniteBooks`, Books query keys, and tests for `shelf_name`, `is_read`,
and `status`. Blank/whitespace string values must be omitted. Sorting and infinite scrolling must continue working
while filters are active.

### 3. Books controls

Add visible V1 controls for shelf, read status, and catalog status alongside the existing category/author/title
controls.

Requirements:

- multiple filters compose rather than replace one another;
- controls reflect URL state after reload;
- Clear Filters removes active filters while preserving only intentional non-filter route state;
- ISBN hardware/deep-link behavior remains compatible;
- no-match state remains distinct from an empty library;
- controls can reflow/collapse on small screens without losing semantics.

### 4. Shelf -> Books navigation

Selecting/browsing a shelf from `/shelves` must navigate to `/books` already filtered with the canonical
`shelf_name` param.

Do not build a second shelf-specific catalog list. The resulting URL must behave exactly like manually selecting the
equivalent Books shelf filter.

### 5. Home-ready filtered URL helper

Provide a stable helper for producing canonical Books URLs (at least category-filtered, and reusable for shelf) so
FEAT-33 Home can deep-link into the same representation.

FEAT-30 does not build Home itself.

## Likely implementation areas

| Area | Expected change |
| ---- | --------------- |
| `src/api/booksApi.ts` | Add `shelf_name`, `is_read`, `status` list params and blank omission |
| `src/api/booksQueries.ts` / `queryKeys.ts` | Plumb new filter options into stable keys |
| `src/features/books/booksListModel.ts` | Parse/serialize/reset for shelf/read/status |
| `BooksListControls.tsx` / `BooksPage.tsx` | Visible controls + URL orchestration |
| `ShelvesPage.tsx` | Navigate to canonical shelf-filtered `/books` |
| shared Books URL helper | Canonical filtered URL construction for Shelves/Home |
| `e2e/support/mockApi.ts` | Honor shelf/read/status filters used by browser tests |

## Acceptance criteria

- Refreshing a Books URL with shelf, read, and/or status filters restores the same filters and sort state.
- Shelf, read status, and/or status can compose with existing category/author/title/ISBN filters and sorting.
- Multi-category filtering continues to use FEAT-29 AND semantics.
- Shelf, read, and status use backend contract values (`shelf_name`, `is_read`, OpenAPI `Status`), not
  frontend-invented translations.
- Blank/whitespace filter values are not sent.
- Clear Filters clears the new filters as well as the existing ones while preserving only intentional non-filter
  state.
- No-match and empty-library states remain distinct.
- Existing ISBN scan/deep-link behavior still works.
- Clicking a shelf from `/shelves` lands on `/books` with the correct canonical `shelf_name` filter.
- The same shelf URL survives refresh/back navigation.
- A canonical filtered-Books URL helper is available for FEAT-33 Home (at least category deep links).
- Infinite scrolling and sorting still work while the new filters are active.
- Controls are keyboard accessible and usable at 320 px.
- `make check` passes.

## Testing expectations

- API tests for `shelf_name`, `is_read`, and `status`, plus omission of blank values.
- Query-key tests for the new normalized filter state.
- Pure model tests for URL parse/serialize, clear behavior, and sort preservation with the new params.
- BooksPage tests for URL initialization, combined filters, clear behavior, and no-match state with the new
  controls.
- ShelvesPage tests asserting the canonical resulting Books URL.
- e2e mock coverage for the new filters when browser tests need them.
- Run targeted tests while iterating, then `make check`.

## Out of scope

- A visible control for every backend-filterable database field (publisher, ranges, date bounds, etc.).
- Separate shelf-specific catalog rendering.
- Home page implementation (FEAT-33).
- Bulk selection/movement (FEAT-31/32).
- Frontend category CRUD.
