# FEAT-29 -- Dynamic multi-category frontend support

## Objective

Adapt the frontend to the finalized V1 many-to-many category model.

Categories are backend data, not frontend enum values. The frontend must discover the available taxonomy dynamically, allow a book to carry zero/one/multiple categories, display those assignments cleanly, and prepare category filtering to use the backend's multi-category intersection semantics.

This ticket replaces the current single-category assumptions across API types, forms, display, and category-specific Books state. It does **not** add frontend category administration.

## Dependencies

- Backend V1 category expansion is complete.
- The backend exposes the finalized category-list contract and Book create/read/update category representation.
- `GET /books` category filtering supports the finalized multi-category representation and AND/intersection semantics.
- Checked-in OpenAPI and API-for-FE documentation have been refreshed for the new contract.
- Final V0 migration preserves the intended category assignments.

Before implementation, compare checked-in OpenAPI with the running backend. If the representation differs, record the drift and follow the backend contract rather than inventing a frontend adapter shape.

## Product rules

- Categories are dynamic persisted data.
- Do not maintain a hard-coded frontend list of category values.
- A book may have zero, one, or multiple categories.
- Multiple selected category filters mean **intersection / AND**, not OR.
- Category hierarchy, synonyms, and automatic implication are not part of V1.
- `Signed Edition` and `Special Edition` are not normal categories. Do not recreate them as frontend category options merely because legacy data once used those labels.
- Frontend category creation, rename, merge, and deletion are explicitly deferred beyond V1.

## Required scope

### 1. OpenAPI and typed API integration

After the backend contract lands:

- refresh/verify `docs/technical-reference/openapi.json`;
- regenerate `src/api/generated/openapi.ts` through the existing workflow;
- update `src/api/apiTypes.ts` aliases as required;
- add/extend the typed category API helper and React Query hooks required to retrieve available categories;
- update Book request-field allowlisting for the new create/update category representation;
- remove obsolete single-category enum assumptions;
- preserve `yarn api:check` drift enforcement.

Do not hand-edit generated OpenAPI types.

### 2. Dynamic category discovery

The frontend must load category options from the backend.

Category option loading must support:

- loading state;
- retryable failure;
- stable identity from the backend contract;
- display names supplied by the backend;
- no rebuild requirement when the backend taxonomy later gains another category.

Do not introduce a second hard-coded fallback taxonomy that can silently drift.

### 3. Add/Edit Book forms

Replace the current single-category control with an accessible multi-category assignment control suitable for roughly 50-60 categories and future growth.

The user must be able to:

- see categories currently assigned to the book;
- add one or more available categories;
- remove an assigned category;
- submit the resulting category set;
- intentionally submit no categories when the backend permits it.

Use the existing Book form architecture. Do not create separate Add and Edit category implementations.

If category loading is required to submit safely, failure to load categories must block category editing with an explicit retry path rather than silently submitting stale/partial values.

### 4. Book display

Update every current display surface that assumes one category string.

At minimum:

- Books list rows/cards;
- Book Details;
- Add/Edit form initial values;
- any shared book display/model helper using a singular category value.

Three or four assigned categories must remain readable at narrow widths.

### 5. Multi-category Books state

Replace the existing singular category URL/model assumption with the finalized multi-category representation.

Selected categories must:

- round-trip through the URL;
- survive refresh/back/forward navigation;
- be stable in query keys;
- compose with existing author/title/ISBN and sort state;
- preserve AND/intersection semantics.

The broader set of new V1 filters is handled in FEAT-30. This ticket should make category state correct under the new model without prematurely redesigning every filter control.

### 6. Dashboard compatibility

Continue rendering category breakdown data supplied by the backend.

Do not hard-code the taxonomy and do not recalculate backend category counts from `GET /books`.

A multi-category book may contribute to multiple backend category buckets; the frontend should display the supplied values without trying to force totals to equal the number of books.

## Likely implementation areas

Verify exact current files before editing.

| Area | Expected change |
| --- | --- |
| `src/api/generated/openapi.ts` | Regenerate from finalized backend OpenAPI. |
| `src/api/apiTypes.ts` | Replace/extend singular category aliases with finalized types; expose Category read/list types as needed. |
| `src/api/requestFields.ts` | Serialize only documented Book category fields. |
| category API/query files | Add backend-driven category list retrieval if not already present. |
| `src/api/booksApi.ts` / `booksQueries.ts` / `queryKeys.ts` | Adopt finalized multi-category request/query representation. |
| `src/features/books/booksListModel.ts` | Parse/serialize multiple selected categories in URL state. |
| shared Book form/model | Multi-category form values, validation, initial values, create/update conversion. |
| `BooksListControls` / `BooksPage` | Replace singular category UI/state with multi-category selection. |
| Book Details / Books display helpers | Render multiple categories. |
| Dashboard tests | Ensure category buckets remain backend-driven. |
| e2e mock API | Match finalized category contracts and intersection behavior where browser tests depend on it. |

## Acceptance criteria

- No user-facing category selector relies on a hard-coded frontend taxonomy.
- A backend-provided category appears in Add/Edit and Books filtering without a frontend rebuild/code change.
- Add Book can submit multiple categories.
- Edit Book initializes all current categories and can add/remove assignments.
- Books list and Book Details display multiple categories without assuming a singular string.
- Selecting `Fantasy` filters to Fantasy books; adding `Horror` narrows to books possessing both categories according to backend semantics.
- Removing one selected category broadens the result appropriately.
- Multi-category selection survives URL refresh/back/forward navigation.
- Category state composes with existing author/title/ISBN filtering and sorting.
- Blank or absent category selection sends no invalid empty filter.
- Dashboard category breakdowns remain backend-driven and render correctly when category totals overlap.
- Obsolete enum-specific category logic is removed where the new contract supersedes it.
- Existing generated-contract drift checking remains green.
- Category controls are keyboard accessible and usable at 320 px.
- `make check` passes.

## Testing expectations

- API tests for category-list retrieval and finalized Book category serialization.
- Request-field tests proving only documented category fields are sent.
- React Query/query-key tests for category lists and multi-category Book filters.
- Form model/component tests for zero, one, and multiple assignments; add/remove; initial Edit values; category-load failure.
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
