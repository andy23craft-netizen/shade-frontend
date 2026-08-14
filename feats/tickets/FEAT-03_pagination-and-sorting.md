# FEAT-03 -- Pagination and sorting (books collection)

## Objective

Add offset pagination and user-controlled sorting to the `/books` collection route. Fetch 50 books per page from the
backend, expose Previous/Next page navigation, and let the user choose sort field and direction using the new
`GET /books` query parameters. This replaces the current "load the entire active collection in one request" behavior
on `BooksPage` only.

Infinite scrolling is explicitly deferred to the next feature; use conventional page controls for now.

## Dependencies

- Checked-in `docs/technical-reference/openapi.json` and `docs/technical-reference/API-for-FE.md` (updated for
  pagination and book sorting).
- FEAT-04 `BooksPage` (collection list UI), FEAT-03 typed API layer (`booksApi`, `queryKeys`, `useBooks`), and shared
  components (`Field`, `Button`, `LoadingState`, `QueryErrorState`, `EmptyState`).
- Do not change checkout, check-in, or loan-history list behavior in this ticket.

## Contract references

Treat these as complementary:

- `docs/technical-reference/openapi.json` -- authoritative for `GET /books` query params (`skip`, `take`, `sortBy`,
  `sortOrder`, plus existing `include_deleted`, `isbn`) and `BookList` (`items`, `total`).
- `docs/technical-reference/API-for-FE.md` -- behavioral guidance:
  - Send **both** `skip` and `take`, or omit **both**. Partial params, negative `skip`, or non-positive `take` return
    **400**.
  - When paginated, `total` is the count of all rows matching filters (not the page size).
  - Default sort when omitted: `sortBy=author`, `sortOrder=asc`. Allowed `sortBy`: `author`, `title`, `creationDate`.
    Allowed `sortOrder`: `asc`, `desc`. Invalid values return **400**. Stable tie-breaker on book `id`.
  - Omitted pagination returns the full filtered result set (still used by checkout/check-in callers).

`GET /loans` also supports `skip`/`take` but has no sort params. Loan pagination is out of scope here.

Regenerate types before implementation:

```sh
yarn api:generate
```

## Current baseline

Already in place:

- `BooksPage` calls `useBooks()` with no options, renders all `data.items`, and shows `data.total` in the heading.
- `booksApi.list` supports `includeDeleted` and `isbn` only; no pagination or sort query params.
- `queryKeys.books.list({ includeDeleted, isbn? })` does not include page or sort dimensions.
- `useBooks({ includeDeleted?, isbn?, enabled? })` forwards those options to `booksApi.list`.
- Other callers depend on unpaginated full lists:
  - `CheckoutPage`: `useBooks()` for eligible-book picker; `useBooks({ isbn })` for ISBN Find.
  - `CheckinPage`: `useBooks()` for eligible-book picker.
  - `LoansPage`: `useBooks()` to join loan rows with book metadata.
- Styles: `.books-page__heading`, `.books-list`, `.book-card*` in `src/styles/components.css`.
- Tests mock `useBooks()` at the page level; API tests cover list without pagination params.

## Scope

### 1. Regenerate OpenAPI types

| File | Change |
| ---- | ------ |
| `src/api/generated/openapi.ts` | Regenerate via `yarn api:generate` after confirming checked-in `openapi.json`. Do not hand-edit. |

### 2. API transport layer

| File | Change |
| ---- | ------ |
| `src/api/booksApi.ts` | Extend `ListBooksOptions` with optional `skip`, `take`, `sortBy`, `sortOrder`. In `list()`, append each defined param to `URLSearchParams` using wire names (`skip`, `take`, `sortBy`, `sortOrder`). Omit `undefined` values. When adding pagination params, always set both `skip` and `take` together (callers enforce this; the helper may assert or document the pairing). Preserve existing `include_deleted` / `isbn` behavior. |
| `src/api/booksApi.test.ts` | Add cases: paginated list (`skip=0&take=50`), sort params (`sortBy=title&sortOrder=desc`), combined filters (`isbn` + pagination + sort), and omission of pagination when not requested. |
| `src/api/booksApi.largeLibrary.test.ts` | Add a paginated fixture case (e.g., `take=50` with `total: 2000`, `items.length: 50`) so FEAT-12 can compare paginated vs full-list timings. Keep the existing 2_000-item full-list guard unless it becomes misleading; if retained, document that `BooksPage` no longer exercises the full-list path. |

Introduce shared constants/types (pick one location and stay consistent):

| File | Change |
| ---- | ------ |
| `src/features/books/booksListModel.ts` (new) | Export `BOOKS_PAGE_SIZE = 50`. Export `BookSortBy` (`'author' \| 'title' \| 'creationDate'`) and `BookSortOrder` (`'asc' \| 'desc'`) matching API allowed values. Export helpers: `pageToSkip(page)`, `skipToPage(skip)`, `buildBooksListQuery({ page, sortBy, sortOrder })` returning `{ skip, take, sortBy, sortOrder }`, and label helpers for UI (`sortByLabel`, `sortOrderLabel`). Colocate unit tests in `booksListModel.test.ts`. |

Alternatively, place constants in `src/api/` if preferred, but keep UI label mapping near the books feature.

### 3. React Query keys and hook

| File | Change |
| ---- | ------ |
| `src/api/queryKeys.ts` | Extend `books.list()` options with optional `skip`, `take`, `sortBy`, `sortOrder`. Include all provided dimensions in the key object so distinct pages/sorts cache separately. Keep `includeDeleted` and `isbn` behavior unchanged. |
| `src/api/booksQueries.ts` | Extend `useBooks` options with optional `skip`, `take`, `sortBy`, `sortOrder`. Pass them through to `queryKeys.books.list` and `booksApi.list`. Default behavior when omitted stays unpaginated (no `skip`/`take` sent) so existing callers are unaffected. |
| `src/api/booksQueries.test.tsx` | Assert hook passes pagination/sort options to `booksApi.list` and uses distinct query keys per page/sort. |
| `src/api/queryStaleGuard.test.tsx` | Update any `queryKeys.books.list()` fixtures if key shape changes. |

Mutation invalidation (`invalidateBookCaches` via `queryKeys.books.all`) remains correct; prefix invalidation covers all list variants.

### 4. `/books` route UI

| File | Change |
| ---- | ------ |
| `src/features/books/routes/BooksPage.tsx` | Replace bare `useBooks()` with paginated, sorted fetch. Read and write list state from URL search params (mirror checkout/check-in `useSearchParams` pattern): e.g. `page` (1-based, default `1`), `sortBy` (default `author`), `sortOrder` (default `asc`). On mount, parse params through `booksListModel` helpers; clamp invalid page to `1` or the last valid page after data loads. Call `useBooks({ skip, take: BOOKS_PAGE_SIZE, sortBy, sortOrder })`. Render a controls region above the list with: (1) a labelled sort-field `<select>` (`author`, `title`, `creationDate`); (2) a labelled sort-direction control (select or toggle group for `asc` / `desc`); (3) pagination summary text, e.g. "Showing 1-50 of 237 books"; (4) Previous / Next buttons using shared `Button`, disabled on first/last page. Changing sort resets `page` to `1`. Update URL with `setSearchParams` (replace, not push, to avoid history spam). Keep existing loading, error+retry, empty-library, and list-row rendering. Empty library (`total === 0`) still shows the FEAT-04 empty state without pagination controls. |
| `src/features/books/components/BooksListControls.tsx` (new, optional) | Extract sort + pagination controls from `BooksPage` if the route file grows too large. Accept current values, `total`, `pageSize`, `itemsOnPage`, and change handlers. Use `Field` for labelled selects. |
| `src/styles/components.css` | Add layout/styles for `.books-page__controls` (or equivalent): responsive row/stack for sort selects and pagination, spacing aligned with existing `.books-page__heading` and form patterns. Reuse existing button classes; do not introduce a component library. |

**URL param conventions (recommended):**

| Param | Values | Notes |
| ----- | ------ | ----- |
| `page` | integer >= 1 | Omitted or invalid -> `1` |
| `sortBy` | `author`, `title`, `creationDate` | Invalid -> `author` |
| `sortOrder` | `asc`, `desc` | Invalid -> `asc` |

**Display labels (recommended):**

| Wire value | UI label |
| ---------- | -------- |
| `author` | Author |
| `title` | Title |
| `creationDate` | Date added |
| `asc` | Ascending |
| `desc` | Descending |

### 5. Callers that must stay unpaginated

Do **not** pass `skip`/`take` from these files:

| File | Reason |
| ---- | ------ |
| `src/features/loans/routes/CheckoutPage.tsx` | Needs full eligible set and ISBN-filtered matches, not a paged slice. |
| `src/features/loans/routes/CheckinPage.tsx` | Needs full eligible set for selection. |
| `src/features/loans/routes/LoansPage.tsx` | Joins all loans with book metadata; unrelated to collection browse. |

No changes required unless type errors appear after hook signature changes.

### 6. Tests

| File | Change |
| ---- | ------ |
| `src/features/books/routes/BooksPage.test.tsx` | Mock `useBooks` with paginated responses. Cover: default first page with sort params passed; sort change resets page; Previous/Next enablement; range text ("Showing 51-100 of ..."); empty library unchanged; loading/error states unchanged. Prefer `MemoryRouter` with initial entries like `/books?page=2&sortBy=title&sortOrder=desc`. |
| `src/features/books/booksListModel.test.ts` (new) | Unit-test page/skip conversion, query builder, and invalid param normalization. |

Existing checkout/check-in/loans tests should remain green without modification.

### 7. Documentation updates (post-implementation)

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Remove "backend pagination" from out-of-scope list; note `BooksPage` paginates at 50 with sort controls; document extended `booksApi.list` / `useBooks` / `queryKeys.books.list` params. |
| `docs/baselines/FEAT-03_performance.md` | Note that collection browse uses paginated requests; adjust or supplement the 2_000-item full-list baseline accordingly. |
| `docs/tickets/FEAT-12_operational-and-browser-hardening.md` | Update the "no pagination" statement for `GET /books` collection UI (API still supports unpaginated calls). |
| `docs/product-docs/PLAN.md` | Update pagination/sorting status where it still claims no backend pagination (minimal delta; do not rewrite the roadmap). |

## Out of scope

- Infinite scrolling / "load more" (next feature).
- Pagination or sorting on `/loans` (`LoansPage`).
- Pagination on deleted-books admin (`FEAT-10` / `include_deleted=true`).
- Catalog search, text filters, or client-side re-sorting of fetched pages.
- Changing checkout/check-in ISBN Find or eligible-book lists to paginate.
- Virtualized lists or new dependencies.

## Acceptance criteria

- `BooksPage` requests `GET /books` with `skip`, `take=50`, `sortBy`, and `sortOrder` on every collection load.
- `skip` and `take` are always sent together; neither is sent alone.
- Default presentation matches API defaults: author ascending, page 1.
- User can change sort field (`author`, `title`, `creationDate`) and direction (`asc`, `desc`); the list refetches and
  page resets to 1 on sort change.
- Previous and Next navigate pages; controls disable appropriately on first/last page.
- Heading or adjacent summary shows total library count and the current visible range derived from `total`, `skip`, and
  `items.length`.
- List state is reflected in URL search params so refresh and share preserve page/sort.
- Empty library (`total === 0`) shows the existing empty state without pagination controls.
- Loading, error, and retry behavior match FEAT-04 patterns (`LoadingState`, `QueryErrorState`).
- Checkout, check-in, and loans flows continue to fetch unpaginated book lists and pass existing tests.
- Sort and pagination controls are keyboard accessible, labelled, and usable at 320px width.
- Colocated unit and route tests cover query building, API param serialization, and primary UI interactions.
- `yarn api:check` and `make check` pass.

## Verification

```sh
yarn api:generate
yarn api:check
yarn test src/api/booksApi.test.ts src/api/booksQueries.test.tsx src/features/books/
make check
```

Manual smoke: with a library larger than 50 books, confirm page 1 shows 50 items, Next loads the next slice, sort
changes reorder results, and the URL updates. With fewer than 50 books, confirm Next is disabled and range text is
correct.
