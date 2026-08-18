# FEAT-18 -- Collection category filter and full `/books` list controls

## Objective

Augment `/books` so the active collection can filter by category (and optional author/title substring filters) via
server-backed `GET /books` query parameters. Filtering must happen on the server -- never by filtering a full
client-side dump of the library.

Shelf **sort** (`sortBy=shelf`) and the typed `author` / `title` / `category` list helpers are already shipped. This
ticket owns the remaining **category (and author/title) filter UI** on `/books`.

## Dependencies

FEAT-04 collection browse, infinite scroll, and URL-backed sort controls are complete. API contract sync already
shipped `booksApi.list` `author` / `title` / `category` query wiring, query-key isolation, and `sortBy=shelf` in
`booksListModel` / `BooksListControls`. CHORE-01 shelves catalog CRUD is complete (`/shelves`, API-fed book shelf
pickers, `shelf_name` string membership) -- do not reinvent shelf management on `/books`. FEAT-17 About homepage is
complete (`/` is About; dashboard is `/dashboard`) -- do not relocate those routes.

Do not pull wishlists (FEAT-19), dashboard reports (FEAT-20), display-only alternate-copy UX (FEAT-21), later
tickets (FEAT-22+), journey automation, CI, Podman, or release artifacts into FEAT-18.

## Contract references

Treat these as complementary:

- `../technical-reference/openapi.json` -- `GET /books` query params: `include_deleted`, `isbn`, `author`, `title`,
  `category` (`Category` enum: `unknown`, `religion`, `philosophy`, `fiction`, `nonfiction`), paired `skip`/`take`,
  `sortBy`, `sortOrder`.
- `../technical-reference/API-for-FE.md` -- behavioral rules OpenAPI does not fully express:
  - Default sort: `sortBy=author`, `sortOrder=asc` when omitted.
  - Allowed `sortBy`: `author`, `title`, `creationDate`, `shelf` (shelf is lexical on `shelves.common_name`).
  - Allowed `sortOrder`: `asc`, `desc`. Invalid sort values → **400**.
  - `category`: exact enum match; invalid → **422**; valid with no rows → empty `BookList` (`items: []`, `total: 0`),
    not **404**.
  - `author` / `title`: case-insensitive substring; empty/whitespace → **400** (omit blanks client-side).
  - `isbn`: literal substring on stored `isbn13` (not create/lookup normalization). Empty/whitespace → **400**.
  - Filters compose with each other, pagination, and sorting; when paginated, `total` is the full matching count.
  - Soft-deleted books stay omitted unless `include_deleted=true` (admin only; not part of `/books` browse).
  - Books use `shelf_name` (membership `common_name`), not a hard-coded shelf enum. There is **no** `shelf=` list
    filter -- shelf is a sort key only. Catalog create/edit/delete lives on `/shelves`.

Confirm against a representative running backend `/openapi.json` before locking transport types; record drift as a
blocker rather than inventing frontend semantics.

## Current baseline

Already in place and should be reused (not rebuilt):

- `/books` via `BooksPage` + `useInfiniteBooks({ sortBy, sortOrder })` only (filters are not passed from the page).
  Batch size 30 from shared infinite-scroll config; prefetch via `useInfiniteScrollTrigger`.
- URL search params today: `sortBy`, `sortOrder` only (`updateListParams` clears stale `page`). Defaults omit
  `sortBy=author` and `sortOrder=asc` from the URL.
- `booksListModel`: `BookSortBy` is `'author' | 'title' | 'creationDate' | 'shelf'`; parse helpers, labels,
  `flattenInfiniteBookPages`. Shelf sort label is `"Shelf"`. No category / author / title URL parsers yet.
- `BooksListControls`: labelled sort-by (including Shelf) and sort-direction selects only. No category or text
  filters.
- `booksApi.list` / `useBooks` / `useInfiniteBooks` / `queryKeys.books.list` / `infiniteList`: optional
  `includeDeleted`, `isbn`, `author`, `title`, `category`, pagination, `sortBy` (including `shelf`), `sortOrder`.
  Blank/whitespace `isbn` / `author` / `title` / `category` are omitted from requests and keys. Do not rebuild these
  helpers; page-level tests should assert the page passes filters through.
- Collection cards display category via `enumDisplayValue` (Title Case known values) and Title Case `shelf_name` via
  `formatShelfCommonNameForDisplay`. `CATEGORY_VALUES` is duplicated in `BooksPage`, `BookDetailsPage`, and
  `BookForm` (`unknown` / `religion` / `philosophy` / `fiction` / `nonfiction`). BookForm option labels are raw enum
  codes; prefer card-style Title Case labels on the filter select.
- `total === 0` currently returns the "library is empty" / Add Book `EmptyState` **before** list controls render.
  That must change once filters exist.
- Active collection never sends `include_deleted`; deleted browse stays on `/admin/deleted`.
- Shelves catalog UI and book form shelf pickers are complete under `/shelves` and `BookForm`.
- Shared form/select primitives (`Field`), empty / loading / `QueryErrorState`, and `.books-page__controls` /
  `.books-page__sort` in `components.css` (no `.books-page__filters` row yet).
- `BooksPage.test.tsx` already covers default author-ascending sort, URL sort (including `sortBy=shelf`), sort-change
  refetch, infinite flattening, Title Case shelf labels, Read/Unread, ratings, and unknown category display.

## Product intent

On `/books`, an operator should be able to:

1. **Filter by category** -- choose a `Category` enum value (or clear to "All categories") and see only matching
   active books. The list count (`total`) and infinite pages must reflect the filtered set from the API.
2. **Use the other catalog list filters the API exposes for browse** -- optional author and title substring filters
   on the same controls surface, composed with category and sort. Prefer compact labelled fields that update URL
   params and refetch; do not invent client-only search indexes.
3. **Keep empty states honest** -- unfiltered `total === 0` remains "library is empty" + Add Book. A filtered
   query that returns `total === 0` must explain that nothing matched and offer a clear way to reset filters, not
   imply the whole library is empty. Treat "filters active" as any browse filter this page owns (category, author,
   title), not category-only.

Preserve existing shelf sort (Author, Title, Date added, Shelf; URL persistence; server-side `sortBy=shelf`). Do not
regress it.

Tone and layout: extend the existing controls row; do not turn `/books` into a dashboard of filter chips or a
modal-heavy filter drawer unless existing design notes force it. Reuse `Field` + native `<select>` / text inputs.

## Remaining scope (file-level plan)

### 1. List model -- category / author / title URL parsing

| File | Change |
| ---- | ------ |
| `src/features/books/booksListModel.ts` | Add category URL helpers: parse a known `Category` from the `category` search param (invalid/missing → no filter / "all"); optional helpers for author/title params that trim and treat blank as unset. Export shared `CATEGORY_FILTER_VALUES` (or reuse a single source of truth with `BookForm` / card display) so the filter select and card display stay aligned with `apiTypes.Category`. Do not change existing sort parse/label helpers. |
| `src/features/books/booksListModel.test.ts` | Cover invalid category → unset, valid category round-trip, and blank author/title → unset (shelf sort coverage already exists). |

### 2. Controls UI -- category filter and author/title filters

| File | Change |
| ---- | ------ |
| `src/features/books/components/BooksListControls.tsx` | Extend props beyond sort: category (or `null` / `'all'`), `onCategoryChange`; author and title string values with change handlers (debounce is optional -- prefer URL updates on change/blur or short debounce if typing feels noisy; never send whitespace-only queries). Add a Category `<select>` with an "All categories" option plus every `Category` enum value, labelled via the same Title Case humanization used on collection cards. Do not remove Shelf from the sort-by select. Keep controls keyboard-accessible and labelled through `Field`. |
| `src/styles/components.css` | Extend `.books-page__controls` / add a filter row (e.g., `.books-page__filters`) so category + text filters + sort wrap cleanly at 320px without overlapping 44px targets. Reuse tokens; no new CSS framework. |

### 3. `BooksPage` -- wire URL, query, empty states

| File | Change |
| ---- | ------ |
| `src/features/books/routes/BooksPage.tsx` | Read `category`, `author`, and `title` from `useSearchParams` via the list model parsers. Pass them into `useInfiniteBooks` with `sortBy` / `sortOrder`. Extend `updateListParams` to set/clear `category` (omit default "all" from the URL), set/clear `author` / `title` when blank, and continue clearing stale `page`. Distinguish empty library vs empty filter result: only show the Add Book empty state when no browse filters are active and `total === 0`; when filters are active and `total === 0`, still show the controls (or an equivalent clear action), a filtered empty message, and a control/link that clears filters only (preserve sort). Heading copy should reflect filtered `total` when filters apply (existing "{n} books in the library" is fine if `n` is API `total`). |
| `src/features/books/routes/BooksPage.test.tsx` | Cover: category filter updates URL and `useInfiniteBooks({ category })`; composed category + sort (including existing `sortBy=shelf`); filtered empty state vs library-empty state; clearing category restores the unfiltered list key; author/title filters omit blanks and compose with category; infinite scroll still requests subsequent pages with the same filters/sort; existing sort, Title Case shelf labels, and rating card coverage stays green. |

### 4. Documentation (when the feature lands)

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Note `/books` URL-backed category (and author/title) filters plus existing `sortBy` including `shelf`; update `BooksPage` / `BooksListControls` / `booksListModel` inventory. Prefer ticket presence under `docs/tickets/` over `docs/ToDo.md` when judging completion. |
| `docs/full-project-context.md` | Same `/books` filter notes when that pack is kept current. |
| `docs/ToDo.md` | Mark the filtering checklist item done when maintainers still use that file. |

### Explicit non-goals for implementation

- Do not filter or sort solely in the browser after fetching the full unpaginated list.
- Do not add `include_deleted` to `/books` (deleted admin stays `/admin/deleted`).
- Do not add a typed ISBN search box on `/books`. Checkout Find remains the typed ISBN list-filter consumer; do not
  implement scan-driven `/books?isbn=` or unique-open (later ticketed work). Filtered empty should still be based on
  "any active browse filter" so an `isbn` param can compose later without rewriting empty-state rules.
- Do not build wishlists, dashboard incomplete-metadata reports, random-book, or physical-shelf visualizations from
  product vision docs.
- Do not add a separate `collection` query param (API has none; category is the surface).
- Do not invent sort keys beyond the documented set (`author`, `title`, `creationDate`, `shelf`).
- Do not reimplement shelves catalog CRUD or book shelf pickers (already on `/shelves` and `BookForm`).
- Do not change checkout ISBN Find; optional reuse of `author`/`title` helpers from checkout remains existing
  product behavior / FEAT-21 alternate-copy concerns.

## Suggested control behavior

Exact copy is implementer-owned; keep it accurate:

1. **Category** -- select: All categories | Unknown | Religion | Philosophy | Fiction | Nonfiction (match enum
   codes in the request: `unknown`, `religion`, `philosophy`, `fiction`, `nonfiction`).
2. **Author** / **Title** -- optional text fields; trim; omit from URL and request when blank.
3. **Sort by** -- Author | Title | Date added | Shelf (already present; keep).
4. **Sort direction** -- Ascending | Descending (already present; keep).
5. Changing any filter or sort replaces the infinite-query key (React Query remounts pages from `skip=0`); do not
   append filtered pages onto a previous filter's cache.

## Acceptance criteria

- `/books` can filter the active collection by `category` via `GET /books?category=...` (exact enum); clearing the
  filter omits `category` and shows the full active list again.
- Existing `/books` shelf sort (`sortBy=shelf` with `sortOrder` asc/desc) continues to work; default remains author
  ascending when sort params are omitted.
- Author and title list filters are available on `/books` (or documented as deferred only if intentionally cut --
  prefer shipping them in this ticket) and never send blank/whitespace values.
- Filter and sort state persist in the URL and compose with infinite pagination (`total` and next pages match the
  same predicates).
- Filtered `total === 0` does not reuse the "library is empty / Add Book" empty state; unfiltered empty library
  still does. Filtered empty still exposes a way to clear filters (controls must not disappear).
- Invalid category values are not sent; unknown URL category params fall back to "all" without crashing.
- Soft-deleted books remain excluded on `/books`.
- Colocated model and `BooksPage` tests cover the new behavior; existing API helper coverage stays green;
  `make check` passes.
- `docs/AGENTS.md` (and ToDo / full-project context as needed) reflect the new `/books` controls.

## Plan coverage

Extends Workstream collection browse (`PLAN.md` `/books`) with server-backed category filter UI, using the expanded
`GET /books` query surface already wired in the typed client. Completes the product UI that earlier API contract sync
deferred for category filtering.

## Out of scope

- Client-only catalog search indexes, fuzzy search, or filter-by-shelf (API has no `shelf=` filter -- shelf is a
  **sort** key only unless a future backend adds a shelf filter).
- Shelves catalog management (already `/shelves`).
- Typed ISBN search box on `/books` (checkout Find remains the typed ISBN list-filter consumer).
- Cover images, wish lists, multi-select facet drawers, saved filter presets, or random-book flows.
- Dashboard breakdown / incomplete-metadata product UI.
- Changing auth, runtime config, connection bootstrap, or About/dashboard routing.
- Journey automation, CI, Podman, or release packaging.
