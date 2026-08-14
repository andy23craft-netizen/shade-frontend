# FEAT-04 -- Infinite scroll for books and loans

## Objective

Replace page-based pagination on `/books` and `/loans` with infinite scrolling. Remove Previous/Next controls and
range text ("Showing x-y of z books"). Fetch the next batch when the user scrolls within the bottom N rows of the
currently loaded content. Use a batch size of 30 (down from 50 on `/books`). Expose batch size and prefetch-row
threshold as easy-to-change configuration constants shared by both pages.

## Dependencies

FEAT-04 (collection browse), FEAT-08 (loan history), and FEAT-03 (typed API + React Query) are complete. Reuse existing
`booksApi.list`, `loansApi.list`, query keys, and mutation invalidation. Do not introduce a component library, virtual
scroll library, or second state store. TanStack React Query 5 is already mounted; use `useInfiniteQuery` rather than
hand-rolling page state.

Historical note: the original FEAT-04 ticket file is gone; this ticket reuses the `FEAT-04` prefix for infinite-scroll
work only.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for `GET /books` and `GET /loans` list schemas (`BookList`,
  `LoanList` with `{ items, total }`), optional `skip` / `take` query params, and book sort params (`sortBy`,
  `sortOrder`).
- `../technical-reference/API-for-FE.md` -- behavioral guidance: send `skip` and `take` together or omit both; partial
  params return **400**; `total` is always the full filtered count; book default sort is author ascending with id
  tie-breaker; loan default sort is `checked_out_at` descending then loan `id` descending.

Confirm against a running backend `/openapi.json` before locking behavior; record drift as a blocker.

## Current baseline

### `/books` (`BooksPage`)

- Paginated via `useBooks({ skip, take: 50, sortBy, sortOrder })` and URL search params (`page`, `sortBy`,
  `sortOrder`).
- `booksListModel.ts` defines `BOOKS_PAGE_SIZE = 50`, page/skip helpers, and range formatting.
- `BooksListControls.tsx` renders sort selects plus Previous/Next buttons and `formatBooksRange` text.
- Initial load shows a full-page `LoadingState`; only one page of items is rendered at a time.
- Colocated tests assert `skip`/`take: 50`, range text, and button enablement.

### `/loans` (`LoansPage`)

- Loads the full loan list via unpaginated `useLoans()` and the full book list via unpaginated `useBooks()` for title
  joins. There is no pagination UI today, but the backend already supports `skip` / `take` on `GET /loans`.
- Client splits accumulated loans into Active (`returned_at === null`) and Returned sections.
- Colocated tests cover section rendering, book-title join fallback, and error/empty states -- not pagination.

### API layer

- `booksApi.list` already serializes `skip`, `take`, `sortBy`, and `sortOrder`.
- `loansApi.list` accepts `bookId` only; it does not yet serialize `skip` / `take`.
- `queryKeys.books.list` includes pagination and sort fields; `queryKeys.loans.list` includes `bookId` only.
- `useBooks` wraps `useQuery`; `useLoans` wraps `useQuery`. Neither uses `useInfiniteQuery` yet.

## Design decisions

### Shared configuration

Add one module both pages import so batch size and prefetch threshold are changed in a single place:

| Constant | Default | Meaning |
|----------|---------|---------|
| `INFINITE_SCROLL_BATCH_SIZE` | `30` | Items requested per `take` param |
| `INFINITE_SCROLL_PREFETCH_ROWS` | `5` | Fetch the next batch when the user reaches this many rows from the bottom of loaded content |

Suggested location: `src/features/shared/infiniteScrollConfig.ts` (export both constants and a short comment block
describing their effect). Feature list models (`booksListModel.ts`, new `loansListModel.ts`) may re-export these for
local ergonomics but must not duplicate numeric literals.

### Infinite query shape

Use TanStack `useInfiniteQuery` with:

- `initialPageParam: 0` (first `skip`).
- `queryFn` calling the existing typed list helper with `{ skip: pageParam, take: INFINITE_SCROLL_BATCH_SIZE, ... }`.
- `getNextPageParam(lastPage, allPages)` returning the next `skip` (`sum of loaded item counts`) when
  `loadedCount < lastPage.total`, otherwise `undefined`.
- Flatten `data.pages.flatMap((page) => page.items)` in the route for rendering.

Query keys must identify the filter/sort dimensions but **not** individual page offsets (infinite queries manage
pages internally). Example books key: `['books', { includeDeleted, isbn, sortBy, sortOrder, take: BATCH_SIZE }]`.

Keep ordinary `useBooks` / `useLoans` for callers that still need a single unpaginated or explicitly paginated fetch
(checkout ISBN find, check-in eligibility, `useLoans({ bookId })`, etc.). Add parallel `useInfiniteBooks` and
`useInfiniteLoans` hooks rather than overloading the existing ones.

### Scroll trigger

Add a small shared hook, e.g. `useInfiniteScrollTrigger` in `src/hooks/useInfiniteScrollTrigger.ts`:

- Accept `{ enabled, hasNextPage, isFetchingNextPage, fetchNextPage, itemCount }`.
- Attach a callback ref to the list row at index `max(0, itemCount - INFINITE_SCROLL_PREFETCH_ROWS)` (or to a dedicated
  sentinel element placed at that position).
- Use `IntersectionObserver` with the viewport as root; when the observed row intersects and `hasNextPage &&
  !isFetchingNextPage`, call `fetchNextPage()`.
- Disconnect on unmount; disable observation while `enabled` is false.
- Do not fire duplicate fetches while a next-page request is in flight.

Prefer `IntersectionObserver` over scroll-event listeners for performance and testability. Colocate unit tests that
mock `IntersectionObserver` and assert `fetchNextPage` is invoked when the sentinel intersects.

### Sort and filter resets

- `/books`: keep `sortBy` and `sortOrder` in URL search params. **Remove** the `page` param entirely. Changing sort
  resets the infinite query automatically via query-key change (fresh first page).
- `/loans`: no sort UI today; changing `bookId` filter (only used outside `LoansPage` via `useLoans({ bookId })`) must
  remain a separate finite query. The loans history page uses unfiltered infinite loans.

### Loading and error UX

- **Initial load** (no cached pages): keep the existing full-page `LoadingState` on each route.
- **Subsequent pages**: append rows inline; show a compact bottom `LoadingState` (or polite `role="status"` text) while
  `isFetchingNextPage`. Do not replace already-rendered rows.
- **Next-page failure**: keep loaded rows visible; show a retry control near the bottom (`QueryErrorState` or a inline
  alert + Retry button calling `fetchNextPage()`). Page-level error handling stays for first-page failures.
- **End of list**: render nothing extra when `!hasNextPage` (no "Showing x-y of z" text).

### Book joins on `/loans`

Continue using unpaginated `useBooks()` on `LoansPage` for the `booksById` join map. Loan rows paginate; book titles
resolve from the full in-memory book list already cached by React Query. This matches `docs/AGENTS.md` guidance that
collection browse paginates while other callers may still fetch unpaginated lists. Document in code that a future ticket
could optimize joins if book count becomes a bottleneck.

## File-by-file changes

### New files

#### `src/features/shared/infiniteScrollConfig.ts`

Export `INFINITE_SCROLL_BATCH_SIZE = 30` and `INFINITE_SCROLL_PREFETCH_ROWS = 5`. Single source of truth for both
routes.

#### `src/hooks/useInfiniteScrollTrigger.ts`

Shared `IntersectionObserver` hook described above. Export the callback ref factory and any small helpers needed by
routes.

#### `src/hooks/useInfiniteScrollTrigger.test.ts`

Mock `IntersectionObserver`; verify prefetch fires once, respects `hasNextPage` / `isFetchingNextPage`, and uses
`INFINITE_SCROLL_PREFETCH_ROWS`.

### API transport

#### `src/api/loansApi.ts`

Extend `ListLoansOptions` with optional `skip?: number` and `take?: number`. Serialize both query params the same way
`booksApi.list` does (stringified integers). Continue omitting either param when `undefined`. Send **both** together
when paginating.

#### `src/api/loansApi.test.ts`

Add cases mirroring `booksApi.test.ts` pagination coverage: both params present, omitted when not requested, combined
with `bookId`.

#### `src/api/queryKeys.ts`

- **`books.list`**: add an `infiniteList(...)` helper (or a boolean flag) whose key includes `take: BATCH_SIZE` and
  sort/filter fields but excludes `skip`.
- **`loans.list`**: extend to `{ bookId?, take? }` for infinite queries; keep backward-compatible unfiltered keys for
  existing `useLoans()` callers.

#### `src/api/booksQueries.ts`

Add `useInfiniteBooks(options)`:

```typescript
// Pseudocode -- implement with project import/style conventions
useInfiniteQuery({
  queryKey: queryKeys.books.infiniteList({ includeDeleted, isbn, sortBy, sortOrder, take: INFINITE_SCROLL_BATCH_SIZE }),
  initialPageParam: 0,
  queryFn: ({ pageParam, signal }) =>
    booksApi.list({ includeDeleted, isbn, skip: pageParam, take: INFINITE_SCROLL_BATCH_SIZE, sortBy, sortOrder, signal }),
  getNextPageParam: (lastPage, allPages) => {
    const loaded = allPages.reduce((n, p) => n + p.items.length, 0)
    return loaded < lastPage.total ? loaded : undefined
  },
})
```

Preserve existing `useBooks` unchanged for non-infinite callers.

#### `src/api/booksQueries.test.tsx`

Add coverage for page chaining (`skip` 0 then 30), `getNextPageParam` termination when `loaded >= total`, and query-key
separation between sort variants.

#### `src/api/loansQueries.ts`

Add `useInfiniteLoans(options?)` with the same infinite-query pattern (optional `bookId` filter for reuse; `LoansPage`
calls it without `bookId`). Preserve existing `useLoans` for check-in and other finite list needs.

#### `src/api/loansQueries.test.tsx` (new or extend `serverStateQueries.test.tsx`)

Cover infinite loan fetch chaining and `bookId` filter keying if not already present in `serverStateQueries.test.tsx`.

### Books feature

#### `src/features/books/booksListModel.ts`

- Replace `BOOKS_PAGE_SIZE = 50` with `BOOKS_BATCH_SIZE` imported from `infiniteScrollConfig` (or re-exported constant
  alias).
- **Remove** page-oriented exports no longer needed: `pageToSkip`, `skipToPage`, `buildBooksListQuery`, `parsePageParam`,
  `clampPage`, `formatBooksRange`.
- **Keep** sort parsing/labels: `parseSortByParam`, `parseSortOrderParam`, `sortByLabel`, `sortOrderLabel`, defaults.

#### `src/features/books/booksListModel.test.ts`

Drop page/range/clamp tests; keep sort parsing tests; assert `BOOKS_BATCH_SIZE === 30`.

#### `src/features/books/components/BooksListControls.tsx`

Strip pagination props and UI:

- Remove `page`, `pageSize`, `skip`, `total`, `itemsOnPage`, `onPreviousPage`, `onNextPage`.
- Remove the `books-page__pagination` block (range paragraph and button group).
- Keep labelled sort selects only. Consider renaming the file/component to `BooksListSortControls` (optional; update
  imports if renamed).

#### `src/features/books/routes/BooksPage.tsx`

- Remove `page` search-param parsing, `clampPage` effect, and `buildBooksListQuery`.
- Switch to `useInfiniteBooks({ sortBy, sortOrder })`.
- Derive `books` from flattened pages; keep `total` from `data.pages[0]?.total` (or last page -- all pages share the
  same `total`).
- Pass sort handlers that update URL params (`sortBy`, `sortOrder` only) -- no page reset param.
- Wire `useInfiniteScrollTrigger` to the book list items.
- Render bottom loading/error/footer states for next-page fetch as described above.
- Keep header copy `{total} books in the library.` (aggregate count is still useful).

#### `src/features/books/routes/BooksPage.test.tsx`

- Replace pagination expectations with infinite-scroll behavior:
  - First fetch uses `{ skip: 0, take: 30, sortBy, sortOrder }`.
  - No Previous/Next buttons; no "Showing ..." text.
  - Mock `useInfiniteBooks` (or integration-test with MSW) to simulate multi-page flattening and sentinel-triggered
    `fetchNextPage`.
  - Sort change issues a new first-page request with updated sort and `skip: 0`.
- Update any hard-coded `take: 50` assertions to `30`.

### Loans feature

#### `src/features/loans/loansListModel.ts` (new, optional but recommended)

Thin module re-exporting `INFINITE_SCROLL_*` constants and any loan-specific helpers (e.g. flattening pages). Keeps
parity with the books list model.

#### `src/features/loans/routes/LoansPage.tsx`

- Replace `useLoans()` with `useInfiniteLoans()` for the history list.
- Flatten pages before splitting into `activeLoans` / `returnedLoans`.
- Keep `useBooks()` unpaginated for `booksById`.
- Attach `useInfiniteScrollTrigger` to the combined rendered rows. Because the DOM is two sections, either:
  - observe the sentinel on the last rendered loan row across both sections (recommended: compute `itemCount` from
    flattened loans and place the observer ref on the correct global index as sections render), or
  - append a single sentinel after the Returned section when it exists, otherwise after Active -- but still base
    prefetch math on total flattened `loans.length`.
- Add bottom next-page loading/error UI consistent with `/books`.

#### `src/features/loans/routes/LoansPage.test.tsx`

- Mock `useInfiniteLoans` instead of `useLoans`.
- Add tests for multi-page flattening into Active/Returned sections, bottom loading indicator, and `fetchNextPage` on
  sentinel intersection (hook mocked).
- Ensure existing empty/error/section tests still pass with infinite query result shape.

### Styles

#### `src/styles/components.css`

- Remove or simplify `.books-page__pagination`, `.books-page__range`, and `.books-page__pagination-actions` if nothing
  else uses them.
- Adjust `.books-page__controls` grid if the layout was two-column solely to accommodate pagination actions; sort-only
  layout may be a single column or a simpler row.
- Add a shared class for bottom infinite-scroll status (e.g. `.infinite-scroll__footer`) if both routes need consistent
  spacing for the inline loader/retry strip.

### Documentation (post-implementation)

#### `docs/AGENTS.md`

Update the inventory bullets for `BooksPage`, `BooksListControls`, `booksListModel`, `LoansPage`, `loansApi`,
`loansQueries`, and query keys to describe infinite scroll, batch size 30, and removed page params. Not required to
land the feature, but should be done before closing the ticket.

## Out of scope

- Virtualized rendering (e.g. `react-window`) for very long DOM lists.
- Infinite scroll on `/admin/deleted`, checkout book pickers, or other `useBooks` / `useLoans` callers.
- Changing backend default sort orders or adding new filters.
- Pulling FEAT-09 reading UI, FEAT-10 admin, or FEAT-11 dashboard into this ticket.
- Paginating the book join on `/loans` (keep unpaginated `useBooks()` unless a separate perf ticket says otherwise).

## Acceptance criteria

- `/books` and `/loans` load an initial batch of 30 items (`take=30`, `skip=0`).
- Neither page shows Previous/Next buttons or "Showing x-y of z ..." range text.
- Scrolling within the bottom 5 rows of currently loaded items triggers the next batch fetch automatically.
- `INFINITE_SCROLL_BATCH_SIZE` and `INFINITE_SCROLL_PREFETCH_ROWS` live in one shared module; changing them updates
  both pages without hunting for magic numbers.
- `/books` retains sort controls and URL persistence for `sortBy` / `sortOrder`; the `page` URL param is removed.
- Sort changes on `/books` reset to the first batch under the new ordering.
- `/loans` still splits loaded rows into Active and Returned sections with existing labels, links, and fallbacks.
- Initial load errors still use page-level `QueryErrorState` with retry; loaded content survives next-page errors with a
  bottom retry affordance.
- A bottom loading indicator appears while the next batch is fetching; no duplicate concurrent fetches.
- When all items are loaded (`loaded >= total`), no further requests fire.
- Existing finite `useBooks` / `useLoans` callers (checkout, check-in, ISBN find) behave unchanged.
- Mutation invalidation (`invalidateBookCaches`, loan invalidation on checkout/check-in) still refreshes infinite lists.
- Colocated unit and route tests cover the new hooks, scroll trigger, and both pages' infinite behavior.
- `make check` passes.

## Test plan

1. `/books` with 65 books: initial 30 render; scroll to row 26+ triggers fetch with `skip=30`; final batch shows 5
   items; no extra fetch after end.
2. Change sort on `/books`: list resets to 30 items with new ordering; no stale page-2 rows.
3. `/loans` with 40 loans spanning active and returned: sections correct across batches; book titles resolve via join.
4. Simulate next-page network failure: rows remain; retry succeeds and appends.
5. Run `yarn test` for touched files and `make check` before handoff.

## Plan coverage

Collection browse UX improvement; complements FEAT-03 list transport and FEAT-12 large-library hardening baselines.
