# FEAT-29 -- Dynamic multi-category frontend support

## Objective

Adapt the frontend to the finalized V1 many-to-many category model.

Categories are backend data, not frontend enum values. The frontend must discover the available taxonomy dynamically,
allow a book to carry zero/one/multiple categories, display those assignments cleanly, and filter with the backend's
multi-category intersection semantics.

This ticket replaces the current singular `Category` enum assumptions across API types, forms, display, Books URL
state, and e2e mocks. It does **not** add frontend category administration.

## Dependencies

- Backend V1 category expansion is complete in `shade-backend` (normalized `CategoryRead`, book `categories` /
  `category_ids`, `GET /categories`, repeated `category_id` list filter with AND/intersection).
- Frontend checked-in `docs/technical-reference/openapi.json` and `docs/technical-reference/API-for-FE.md` are still
  on the obsolete singular `Category` enum and must be refreshed from the backend contract as part of this ticket.
- Final V0 migration preserves the intended category assignments on the validation database.

Before implementation, compare the refreshed checked-in OpenAPI with the running backend. If the representation
differs, record the drift and follow the backend contract rather than inventing a frontend adapter shape.

## Contract references

Refresh frontend docs from the backend contract. Authoritative shapes today:

- `GET /categories` -- unpaginated JSON **array** of `CategoryRead` (`category_id`, `name`, `slug`, timestamps);
  same list pattern as `GET /shelves`.
- `BookRead.categories` -- array of `BookCategoryRead` (`category_id`, `name`, `slug`).
- `BookCreate.category_ids` / `BookUpdate.category_ids` -- array of category GUIDs. Create may omit or send `[]`
  (zero categories allowed). On update: omit to preserve memberships; send `[]` to clear; send a list to replace.
- `GET /books` -- repeated `category_id` query params; multiple values mean **AND/intersection**; duplicate IDs are
  rejected; blank/absent selection sends no category filter.
- Dashboard: `by_category` buckets use category display names; a multi-category book contributes once per bucket.
  Incomplete-metadata "missing category" means **no memberships** (not the old `unknown` enum value).

Do not invent frontend-only request shapes if the running backend contract differs; record drift as a blocker.

## Product rules

- Categories are dynamic persisted data.
- Do not maintain a hard-coded frontend list of category values (remove `CATEGORY_FILTER_VALUES` and enum selectors).
- A book may have zero, one, or multiple categories.
- Multiple selected category filters mean **intersection / AND**, not OR.
- Category hierarchy, synonyms, and automatic implication are not part of V1.
- `Signed Edition` and `Special Edition` are not normal categories. Do not recreate them as frontend category options
  merely because legacy data once used those labels.
- Frontend category creation, rename, merge, and deletion are explicitly deferred beyond V1.
- Prefer the shelves discovery pattern: load options from the API, submit stable IDs (GUIDs), display backend names.

## Current baseline (already shipped; replace, do not rebuild around the enum)

| Area | Location / behavior |
| ---- | ------------------- |
| OpenAPI / types | Checked-in OpenAPI still has singular `Category` enum; `apiTypes.Category` aliases it |
| Request pickers | `requestFields.ts` allowlists singular `category` on Book create/update |
| Books API / queries | `booksApi.list` / `useInfiniteBooks` send optional singular `category` query param |
| URL / list model | `booksListModel.ts` -- `CATEGORY_FILTER_VALUES`, `parseCategoryParam`, singular `?category=` |
| List controls | `BooksListControls.tsx` -- hard-coded singular `<select>` |
| Book form | `BookForm.tsx` / `bookFormModel.ts` / `bookEditModel.ts` -- singular category field |
| Display | Books list cards and `BookDetailsPage` render one `book.category` via `displayEnum` |
| Dashboard | Renders API `by_category` / `missing_category` without recalculation (keep that; adapt to new semantics) |
| e2e | `e2e/support/mockApi.ts` and creation specs still use singular `category: 'fiction'` |

No `categoriesApi` / `useCategories` / `queryKeys.categories` exist yet.

## Remaining scope

### 1. OpenAPI and typed API integration

- refresh `docs/technical-reference/openapi.json` and `API-for-FE.md` from the backend contract;
- regenerate `src/api/generated/openapi.ts` through the existing workflow;
- update `src/api/apiTypes.ts` (drop obsolete `Category` enum alias; add `CategoryRead` / `BookCategoryRead` as needed);
- add typed category list API + React Query hooks (`categoriesApi` / `categoriesQueries` / `queryKeys.categories`);
- update `requestFields.ts` for `category_ids` (and remove singular `category`);
- update `booksApi` / `booksQueries` / `queryKeys` for repeated `category_id` filters and `categories` on reads;
- preserve `yarn api:check` drift enforcement.

Do not hand-edit generated OpenAPI types.

### 2. Dynamic category discovery

Load category options from `GET /categories` with loading state, retryable failure, stable `category_id` identity,
and backend-supplied display names. Do not introduce a second hard-coded fallback taxonomy.

### 3. Add/Edit Book forms

Replace the singular category `<select>` with an accessible multi-category assignment control suitable for roughly
50-60 categories and future growth, using the shared `BookForm` architecture.

The user must be able to see, add, and remove assignments; submit the resulting `category_ids` set; and intentionally
submit zero categories. If category loading is required to submit safely, failure must block category editing with an
explicit retry path (same shelves-load gate idea) rather than silently submitting stale/partial values.

### 4. Book display

Update every surface that assumes one category string: Books list rows/cards, Book Details, Add/Edit initial values,
and any shared display helper. Three or four assigned categories must remain readable at narrow widths.

### 5. Multi-category Books state

Replace singular `?category=` / `CATEGORY_FILTER_VALUES` with URL-addressable multi-`category_id` selection that:

- round-trips through the URL and survives refresh/back/forward;
- is stable in query keys;
- composes with existing author/title/ISBN and sort state;
- preserves AND/intersection semantics;
- omits the filter entirely when none are selected (no invalid empty filter).

The broader set of new V1 filters is FEAT-30. Make category state correct under the new model without redesigning
every filter control.

### 6. Dashboard and e2e compatibility

Keep rendering backend-supplied category breakdown buckets without hard-coding the taxonomy or recalculating from
`GET /books`. Accept overlapping totals when multi-category books appear in multiple buckets. Align incomplete-
metadata copy/behavior with "no memberships". Update the stateful e2e mock and specs to the finalized contract.

## Likely implementation areas

| Area | Expected change |
| ---- | --------------- |
| `docs/technical-reference/openapi.json` / `API-for-FE.md` | Refresh from backend multi-category contract |
| `src/api/generated/openapi.ts` | Regenerate |
| `src/api/apiTypes.ts` | Category read types; remove singular enum alias |
| `src/api/requestFields.ts` | `category_ids` allowlisting |
| new `categoriesApi` / `categoriesQueries` / `queryKeys.categories` | `GET /categories` list |
| `booksApi.ts` / `booksQueries.ts` / `queryKeys.ts` | Repeated `category_id`; read `categories` |
| `booksListModel.ts` | Parse/serialize multiple category IDs in URL state |
| `bookFormModel.ts` / `bookEditModel.ts` / `BookForm.tsx` | Multi-category values and create/update conversion |
| `BooksListControls.tsx` / `BooksPage.tsx` | Multi-category filter UI/state |
| Book Details / list display | Render `book.categories` |
| Dashboard tests / healing field | Backend-driven buckets; missing = no memberships |
| `e2e/support/mockApi.ts` + specs | Finalized category contracts and intersection behavior |

## Acceptance criteria

- No user-facing category selector relies on a hard-coded frontend taxonomy.
- A backend-provided category appears in Add/Edit and Books filtering without a frontend rebuild/code change.
- Add Book can submit multiple `category_ids`, including an intentional empty set.
- Edit Book initializes all current categories and can add/remove assignments; omit vs `[]` vs replace follow the API.
- Books list and Book Details display multiple categories without assuming a singular string.
- Selecting one category filters to members of that category; adding a second narrows to books possessing both
  (backend AND/intersection via repeated `category_id`).
- Removing one selected category broadens the result appropriately.
- Multi-category selection survives URL refresh/back/forward navigation.
- Category state composes with existing author/title/ISBN filtering and sorting.
- Blank or absent category selection sends no category filter.
- Dashboard category breakdowns remain backend-driven and render correctly when category totals overlap.
- Obsolete enum-specific category logic (`Category`, `CATEGORY_FILTER_VALUES`, singular `?category=`) is removed.
- Existing generated-contract drift checking remains green.
- Category controls are keyboard accessible and usable at 320 px.
- `make check` passes.

## Testing expectations

- API tests for category-list retrieval and Book `category_ids` / `categories` serialization.
- Request-field tests proving only documented category fields are sent.
- React Query/query-key tests for category lists and multi-`category_id` Book filters.
- Form model/component tests for zero, one, and multiple assignments; add/remove; Edit initial values; load failure.
- Books model/page tests for URL round-trip and AND-filter state.
- Display tests for books with zero, one, three, and four categories.
- Dashboard regression tests ensuring supplied breakdown values are rendered without client recalculation.
- Update the existing stateful e2e mock to the finalized contract before browser coverage relies on the new model.
- Run `yarn api:check`, targeted tests, then `make check`.

## Out of scope

- Creating categories from Add/Edit Book.
- Category-management/admin pages.
- Renaming, merging, or deleting categories.
- Parent/child category hierarchy or inferred classifications.
- Synonyms or automatic implication such as `Literary Fiction -> Fiction`.
- Designing permanent copy/edition metadata for `Signed Edition` / `Special Edition`.
- Exposing every new backend Book filter; FEAT-30 handles the V1-visible filter set.
