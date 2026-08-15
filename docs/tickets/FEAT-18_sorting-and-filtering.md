# FEAT-18 -- Collection category filter and full `/books` list controls

## Objective

Augment `/books` so the active collection can filter by category and sort by shelf, and so the page uses the
backend `GET /books` list filters and sort options that the typed client can already (or will) pass through.
Filtering and sorting must happen on the server via query parameters -- never by re-sorting or filtering a full
client-side dump of the library.

## Dependencies

FEAT-04 collection browse, infinite scroll, and URL-backed sort controls are complete. Prefer landing
`docs/tickets/FEAT-10_update-api.md` first when that ticket is still open: it already specifies `booksApi.list`
`author` / `title` / `category` query wiring, query-key isolation, and `sortBy=shelf` in `booksListModel` /
`BooksListControls`, while explicitly deferring category filter **UI** to a later ticket (this one).

If FEAT-10 has not yet shipped those API and sort-model pieces, implement them here as prerequisites rather than
blocking. Do not pull wishlists, dashboard reports, FEAT-12 hardening, journey automation, CI, Podman, release
artifacts, or FEAT-17 About/homepage routing into FEAT-18.

## Contract references

Treat these as complementary:

- `../technical-reference/openapi.json` -- `GET /books` query params: `include_deleted`, `isbn`, `author`, `title`,
  `category` (`Category` enum), paired `skip`/`take`, `sortBy`, `sortOrder`.
- `../technical-reference/API-for-FE.md` -- behavioral rules OpenAPI does not fully express:
  - Default sort: `sortBy=author`, `sortOrder=asc` when omitted.
  - Allowed `sortBy`: `author`, `title`, `creationDate`, `shelf` (shelf is lexical on stored shelf codes).
  - Allowed `sortOrder`: `asc`, `desc`. Invalid sort values → **400**.
  - `category`: exact enum match; invalid → **422**; valid with no rows → empty `BookList` (`items: []`, `total: 0`),
    not **404**.
  - `author` / `title`: case-insensitive substring; empty/whitespace → **400** (omit blanks client-side).
  - `isbn`: literal substring on stored `isbn13` (not create/lookup normalization). Empty/whitespace → **400**.
  - Filters compose with each other, pagination, and sorting; when paginated, `total` is the full matching count.
  - Soft-deleted books stay omitted unless `include_deleted=true` (admin only; not part of `/books` browse).

Confirm against a representative running backend `/openapi.json` before locking transport types; record drift as a
blocker rather than inventing frontend semantics.

## Current baseline

Already in place and should be reused (not rebuilt):

- `/books` via `BooksPage` + `useInfiniteBooks({ sortBy, sortOrder })`, batch size from shared infinite-scroll config.
- URL search params today: `sortBy`, `sortOrder` only (`updateListParams` clears stale `page`). Defaults omit
  `sortBy=author` and `sortOrder=asc` from the URL.
- `booksListModel`: `BookSortBy` is `'author' | 'title' | 'creationDate'` (no `shelf` yet unless FEAT-10 landed);
  parse helpers, labels, `flattenInfiniteBookPages`.
- `BooksListControls`: labelled sort-by and sort-direction selects only (no category or text filters).
- `booksApi.list` / `useBooks` / `useInfiniteBooks` / `queryKeys.books.list` / `infiniteList`: optional
  `includeDeleted`, `isbn`, pagination, `sortBy`, `sortOrder`. `author` / `title` / `category` are **not** wired
  unless FEAT-10 already added them -- verify before editing.
- Collection cards already display category and shelf with `enumDisplayValue` (safe unknown-enum fallback).
- Active collection never sends `include_deleted`; deleted browse stays on `/admin/deleted`.
- Shared form/select primitives (`Field`), empty / loading / `QueryErrorState`, and `.books-page__*` styles in
  `components.css`.

## Product intent

On `/books`, an operator should be able to:

1. **Filter by category** -- choose a `Category` enum value (or clear to "All categories") and see only matching
   active books. The list count (`total`) and infinite pages must reflect the filtered set from the API.
2. **Sort by shelf** -- offer Shelf alongside Author, Title, and Date added, with ascending/descending direction,
   still persisted in the URL and still applied server-side.
3. **Use the other catalog list filters the API exposes for browse** -- optional author and title substring filters
   on the same controls surface, composed with category and sort. Prefer compact labelled fields that update URL
   params and refetch; do not invent client-only search indexes.
4. **Keep empty states honest** -- unfiltered `total === 0` remains "library is empty" + Add Book. A filtered
   query that returns `total === 0` must explain that nothing matched and offer a clear way to reset filters, not
   imply the whole library is empty.

Tone and layout: extend the existing controls row; do not turn `/books` into a dashboard of filter chips or a
modal-heavy filter drawer unless existing design notes force it. Reuse `Field` + native `<select>` / text inputs.

## Remaining scope (file-level plan)

### 1. Typed list helpers -- pass every browse-relevant `GET /books` filter

Skip or no-op any row already completed by FEAT-10; implement anything still missing.

| File | Change |
| ---- | ------ |
| `src/api/booksApi.ts` | Extend `ListBooksOptions` with optional `author?: string`, `title?: string`, and `category?: Category` (or `string` constrained by callers). Serialize `author`, `title`, and `category`. Omit each when `undefined`, `''`, or whitespace-only (same rule as `isbn`) so the FE never triggers documented **400** empty-filter errors. Preserve `includeDeleted` / `isbn` / `skip` / `take` / `sortBy` / `sortOrder`. Accept `sortBy: 'shelf'` as an ordinary string. |
| `src/api/queryKeys.ts` | Include optional `author`, `title`, and `category` in `books.list` and `books.infiniteList` when present (mirror the `isbn` omit-empty pattern) so filtered/sorted caches do not collide. |
| `src/api/booksQueries.ts` | Thread the new optional filters through `useBooks` / `useInfiniteBooks` into `booksApi.list` and query keys. Default behavior when omitted stays unchanged. |
| `src/api/booksApi.test.ts` | Cover serialization and blank omission for `author` / `title` / `category`; composition with `isbn`, pagination, and `sortBy=shelf`; existing unfiltered / isbn-only cases still pass. |
| `src/api/booksQueries.test.tsx` | Assert hooks forward filters into keys and `list` calls; changing `category` (or author/title) produces a distinct infinite-query key. |

Do not add `include_deleted` to the `/books` page. Do not require an ISBN filter control on `/books` (ISBN list
filter remains the checkout Find path); wiring `isbn` on the helper for other callers is fine if already present.

### 2. List model -- shelf sort and URL/filter parsing

| File | Change |
| ---- | ------ |
| `src/features/books/booksListModel.ts` | Add `'shelf'` to `BookSortBy`, `SORT_BY_VALUES`, and `sortByLabel` (e.g., `"Shelf"`). Keep `DEFAULT_SORT_BY = 'author'` and `DEFAULT_SORT_ORDER = 'asc'`. Add category URL helpers: parse a known `Category` from the `category` search param (invalid/missing → no filter / "all"); optional helpers for author/title params that trim and treat blank as unset. Export shared `CATEGORY_FILTER_VALUES` (or reuse a single source of truth with `BookForm`) so the filter select and card display stay aligned with `apiTypes.Category`. |
| `src/features/books/booksListModel.test.ts` | Cover `parseSortByParam('shelf')`, shelf label, invalid category → unset, valid category round-trip, and blank author/title → unset. |

### 3. Controls UI -- category filter, shelf sort, author/title filters

| File | Change |
| ---- | ------ |
| `src/features/books/components/BooksListControls.tsx` | Extend props beyond sort: category (or `null` / `'all'`), `onCategoryChange`; optional author and title string values with change handlers (debounce is optional -- prefer URL updates on change/blur or short debounce if typing feels noisy; never send whitespace-only queries). Add a Category `<select>` with an "All categories" option plus every `Category` enum value, labelled via the same humanization used on cards/forms when practical. Ensure Shelf appears in the sort-by select. Keep controls keyboard-accessible and labelled through `Field`. |
| `src/styles/components.css` | Extend `.books-page__controls` / add a filter row (e.g., `.books-page__filters`) so category + optional text filters + sort wrap cleanly at 320px without overlapping 44px targets. Reuse tokens; no new CSS framework. |

### 4. `BooksPage` -- wire URL, query, empty states

| File | Change |
| ---- | ------ |
| `src/features/books/routes/BooksPage.tsx` | Read `category` (and author/title if exposed) from `useSearchParams` via the list model parsers. Pass them into `useInfiniteBooks` with `sortBy` / `sortOrder`. Extend `updateListParams` to set/clear `category` (omit default "all" from the URL), set/clear `author` / `title` when blank, and continue clearing stale `page`. Distinguish empty library vs empty filter result: only show the Add Book empty state when no browse filters are active and `total === 0`; when filters are active and `total === 0`, show a filtered empty message plus a control/link that clears filters (and preserves or resets sort per product choice -- prefer clearing filters only). Heading copy should reflect filtered `total` when filters apply (existing "{n} books in the library" is fine if `n` is API `total`). |
| `src/features/books/routes/BooksPage.test.tsx` | Cover: `sortBy=shelf` URL persistence and request param; category filter updates URL and `GET /books?category=...`; composed category + sort; filtered empty state vs library-empty state; clearing category restores the unfiltered list key; author/title filters (if shipped) omit blanks and compose with category; infinite scroll still requests subsequent pages with the same filters/sort; existing sort and rating card coverage stays green. |

### 5. Documentation (when the feature lands)

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Note `/books` URL-backed category (and author/title if shipped) filters plus `sortBy` including `shelf`; update `booksApi` / `queryKeys` / `BooksPage` / `BooksListControls` / `booksListModel` inventory. Prefer ticket presence under `docs/tickets/` over `docs/ToDo.md` when judging completion. |
| `docs/ToDo.md` | Mark the "filtering on category & sorting on shelf" checklist item done when maintainers still use that file. |
| `docs/tickets/FEAT-10_update-api.md` | If still present after FEAT-10 work: note that category filter UI and full `/books` control surface moved to FEAT-18 (avoid duplicate "do not add category filter" instructions conflicting with this ticket). |

### Explicit non-goals for implementation

- Do not filter or sort solely in the browser after fetching the full unpaginated list.
- Do not add `include_deleted` to `/books` (deleted admin stays `/admin/deleted`).
- Do not build wishlists, dashboard incomplete-metadata reports, random-book, or physical-shelf visualizations from
  product vision docs.
- Do not add a separate `collection` query param (API has none; category is the surface).
- Do not invent sort keys beyond the documented set (`author`, `title`, `creationDate`, `shelf`).
- Do not change checkout ISBN Find beyond what FEAT-10 already owns; optional reuse of `author`/`title` helpers
  from checkout remains FEAT-10's concern.

## Suggested control behavior

Exact copy is implementer-owned; keep it accurate:

1. **Category** -- select: All categories | Unknown | Religion | Philosophy | Fiction | Nonfiction (match enum
   codes in the request: `unknown`, `religion`, `philosophy`, `fiction`, `nonfiction`).
2. **Author** / **Title** (recommended for "various" API filters) -- optional text fields; trim; omit from URL and
   request when blank.
3. **Sort by** -- Author | Title | Date added | Shelf.
4. **Sort direction** -- Ascending | Descending.
5. Changing any filter or sort replaces the infinite-query key (React Query remounts pages from `skip=0`); do not
   append filtered pages onto a previous filter's cache.

## Acceptance criteria

- `/books` can filter the active collection by `category` via `GET /books?category=...` (exact enum); clearing the
  filter omits `category` and shows the full active list again.
- `/books` can sort by shelf (`sortBy=shelf`) with `sortOrder` asc/desc; default remains author ascending when sort
  params are omitted.
- Author and title list filters are available on `/books` (or documented as deferred only if intentionally cut --
  prefer shipping them in this ticket) and never send blank/whitespace values.
- Filter and sort state persist in the URL and compose with infinite pagination (`total` and next pages match the
  same predicates).
- Filtered `total === 0` does not reuse the "library is empty / Add Book" empty state; unfiltered empty library
  still does.
- Invalid category values are not sent; unknown URL category params fall back to "all" without crashing.
- Soft-deleted books remain excluded on `/books`.
- Colocated model, API, and `BooksPage` tests cover the new behavior; `make check` passes.
- `docs/AGENTS.md` (and ToDo as needed) reflect the new `/books` controls.

## Plan coverage

Extends Workstream collection browse (`PLAN.md` `/books`) with server-backed category filter and shelf sort, using
the expanded `GET /books` query surface from the current OpenAPI / `API-for-FE.md`. Completes the product UI that
`FEAT-10_update-api` deferred for category filtering.

## Out of scope

- Client-only catalog search indexes, fuzzy search, or filter-by-shelf enum (API has no `shelf=` filter -- shelf is
  a **sort** key only unless a future backend adds a shelf filter).
- ISBN filter UI on `/books` (checkout Find remains the ISBN list-filter consumer).
- Cover images, wish lists, multi-select facet drawers, saved filter presets, or random-book flows.
- Dashboard breakdown / incomplete-metadata product UI.
- Changing auth, runtime config, or connection bootstrap.
- FEAT-12+ hardening, CI, Podman, or release packaging.
