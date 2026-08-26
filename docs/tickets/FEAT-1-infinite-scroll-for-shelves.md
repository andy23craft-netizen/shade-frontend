# FEAT — Incremental Shelf Rendering / Infinite Scroll

## Summary

Change the Shelves page so that shelf showcases are rendered incrementally
instead of rendering the entire shelf catalog at once.

The shelf catalog itself is already returned as a relatively small metadata
payload. This ticket does NOT require backend pagination of `GET /shelves`.

Instead, paginate the rendered shelf showcases on the frontend so that only
a bounded number of shelves — and therefore only a bounded number of shelf
preview queries and book-cover requests — can become active at one time.

This should preserve the current Shelves page design and behavior while
preventing rapid scrolling from causing a burst of simultaneous shelf-preview
requests.

---

## Current Behavior

`ShelvesPage` currently:

- loads the shelf catalog with `useShelves()`;
- loads shelf counts with `useDashboardBreakdowns()`;
- filters the reserved `removed` shelf from the visible list;
- renders every remaining shelf immediately with `shelves.map(...)`;
- renders either the shelf editor or a `ShelfShowcase` for every shelf.

Each `ShelfShowcase`:

- lazy-loads its preview with an `IntersectionObserver`;
- begins loading when the showcase comes within 500px of the viewport;
- requests at most 12 books using:
  - `skip: 0`
  - `take: 12`
  - `sortBy: 'title'`
  - `sortOrder: 'asc'`;
- renders book covers for the returned preview books;
- provides a link to browse the complete shelf on `/books?shelf_name=...`.

The preview itself is therefore already bounded. The scalability problem is
that all shelf showcases exist in the DOM simultaneously, allowing many
independent preview observers to trigger in rapid succession.

---

## Goal

Bound the amount of shelf-preview work that can become active at one time by
incrementally rendering shelves as the user moves down the Shelves page.

The page should continue to feel like one continuous shelf catalog rather
than conventional numbered pagination.

---

## Requirements

### 1. Incrementally render shelf showcases

Do not render the complete `shelves` array immediately.

Introduce a fixed shelf-render batch size and initially render only the first
batch.

Example shape:

- full filtered shelf catalog remains available in memory;
- `visibleShelfCount` controls how many shelves are rendered;
- `visibleShelves = shelves.slice(0, visibleShelfCount)`.

Choose a reasonable batch size based on the existing page layout. The exact
number may be adjusted during implementation/testing, but it should be small
enough to meaningfully limit simultaneous preview work.

A starting value around 4–6 shelves is appropriate.

Do not change the backend shelves endpoint solely to implement this behavior.

### 2. Load another shelf batch near the bottom

Use the project's existing infinite-scroll infrastructure rather than
introducing a separate scrolling system unless that hook proves unsuitable.

When the user approaches the end of the currently rendered shelf batch:

- increase the visible shelf count by one batch;
- render the newly exposed shelf showcases;
- move the infinite-scroll sentinel into the newly rendered batch;
- stop requesting additional batches once every shelf is rendered.

Only one shelf-render expansion should occur for a given sentinel trigger.

Rapid scrolling must not cause repeated duplicate expansions for the same
rendered batch.

### 3. Preserve `ShelfShowcase` preview lazy loading

Do NOT replace the existing per-shelf lazy-loading behavior.

A newly rendered `ShelfShowcase` should continue to:

- wait until it approaches the viewport;
- request only its 12-book preview;
- avoid a book query for an empty shelf;
- show its existing loading/error states;
- retain its horizontal book carousel.

This ticket adds a second level of bounding:

1. only a subset of shelves exist in the DOM;
2. only shelf showcases near the viewport fetch their previews.

### 4. Preserve existing shelf order

Incremental rendering must not change the current order supplied by the
Shelves page.

Loading the next batch should append shelves to the existing rendered list.
Previously rendered shelves must not disappear, reorder, or remount
unnecessarily.

### 5. Preserve shelf management behavior

Existing shelf management behavior must continue to work for every rendered
shelf:

- Add shelf
- Edit shelf
- Delete eligible shelf
- System-shelf restrictions
- shelf metadata
- shelf counts
- success/error notices
- confirmation dialog behavior

Entering edit mode must not reset the currently rendered shelf batch.

Completing or cancelling an edit must not collapse the page back to the first
batch.

### 6. Handle shelf catalog mutations safely

If adding/deleting/refetching shelves changes the number of available shelves:

- never allow the visible shelf count to produce an invalid render state;
- newly available shelves may become visible according to the normal batching
  behavior;
- deleting a shelf must not leave a broken sentinel or permanently prevent
  later shelves from loading.

Do not introduce scroll-position jumps as part of normal shelf mutations.

### 7. Preserve existing shelf navigation

Shelf names and counts must continue linking to:

`/books?shelf_name=<common_name>`

The existing "Browse all N books" behavior inside `ShelfShowcase` must remain
unchanged.

### 8. Loading and end-of-list behavior

While another shelf batch is being exposed, avoid replacing the existing
shelves with a page-level loading state.

Previously rendered shelves remain usable.

Once all shelves have been rendered:

- disable/remove the infinite-scroll trigger;
- do not continue generating render expansions;
- no explicit "end of shelves" message is required unless it improves the
  existing design.

This is frontend rendering pagination, so exposing the next batch should not
require a new `/shelves` network request.

---

## Implementation Guidance

Prefer adapting the existing `useInfiniteScrollTrigger` hook used by the Books
page.

The hook already:

- calculates a sentinel index near the end of the rendered collection;
- uses `IntersectionObserver`;
- prevents duplicate requests while a request/expansion is active;
- resets its guard when the sentinel moves.

For Shelves, the "fetch next page" operation can simply increase
`visibleShelfCount`.

The implementation does not need TanStack `useInfiniteQuery` because the full
shelf metadata collection is already available from `useShelves()`.

If the existing hook's `isFetchingNextPage` contract does not map cleanly onto
a synchronous visible-count expansion, make the smallest reusable adjustment
necessary rather than duplicating the observer logic inside `ShelvesPage`.

---

## Testing Requirements

Extend `ShelvesPage.test.tsx` to cover incremental rendering.

At minimum verify:

1. Only the initial shelf batch is rendered when the page first loads.

2. Shelves beyond the initial batch are not initially present in the DOM.

3. Triggering the infinite-scroll sentinel exposes the next batch.

4. Repeated triggering does not expose multiple unintended batches from the
   same sentinel.

5. Additional batches continue loading until the complete shelf catalog is
   rendered.

6. No further expansion occurs after every shelf is visible.

7. The reserved `removed` shelf remains excluded before pagination/batching is
   calculated.

8. Shelf counts continue to correspond to the correct shelves after additional
   batches are rendered.

9. Entering/editing/cancelling a shelf does not reset the visible batch.

10. Existing create/delete behavior remains functional with incremental
    rendering.

11. Empty shelf catalogs retain the existing `No shelves yet` state.

Retain the existing `ShelfShowcase` tests for:

- 12-book preview query;
- empty shelves not enabling their book query;
- preview loading/error states;
- Browse All behavior;
- horizontal scrolling controls;
- edit/delete controls.

---

## Regression Requirements

The following existing behavior must remain unchanged:

- shelf preview size remains 12;
- shelf preview sort remains title ascending;
- shelf book cards and covers retain their current presentation;
- shelf names/counts continue navigating to filtered `/books` results;
- `removed` is not displayed;
- system shelves retain their restrictions;
- Add/Edit/Delete shelf workflows continue to work;
- accessibility semantics of the shelf catalog and showcases are preserved.

No backend or API contract change should be required.

---

## Acceptance Criteria

- The Shelves page no longer mounts every shelf showcase at initial render.
- Only a bounded initial batch of shelf showcases exists in the DOM.
- Additional shelves appear automatically as the user approaches the bottom
  of the rendered list.
- Shelf batches append without replacing or reordering existing shelves.
- A rapid scroll cannot cause every shelf preview in the catalog to begin
  loading simultaneously.
- Each individual shelf continues to request no more than its existing
  12-book preview.
- Empty shelves continue to make no preview-book request.
- Existing shelf management and navigation behavior is preserved.
- All updated unit tests pass.
- `make check` passes.
