# Ticket 07: Build the Stash view and Apply Stash workflow

## Status

**Complete in frontend version 1.0.3.**

## Dependency

Blocked until the frontend prerequisite audit in [Pre-ticket
06](06-backend-stash-contract.md) is complete against the refreshed
OpenAPI contract.

The backend Stash APIs themselves are implemented.

## Goal

Provide a persistent staging area for books intentionally displaced
during physical shelf reorganization, with server-backed filtering, bulk
selection, and atomic partial application to a physical shelf.

## Backend contract to use

### Stash list

Load Stash through:

``` http
GET /books?placement_state=stashed
```

Do not fetch the normal Books list and filter client-side.

Normal Books filters, pagination, and sorting remain available. Default
ordering should remain author ascending.

### Placement fields

Use:

``` ts
placement_state: 'shelved' | 'stashed' | 'unshelved'
shelf_name: string | null
previous_shelf_name: string | null
```

A Stash row is identified by `placement_state === 'stashed'`, not by
`shelf_name === null`.

### Apply mutation

Use the dedicated atomic endpoint:

``` http
POST /books/bulk/apply-stash
```

Never loop individual `PATCH` calls.

The successful response supplies:

-   `applied_count`;
-   request-ordered `book_ids`;
-   normalized `destination_shelf`;
-   `destination_preexisting_count`;
-   `destination_was_occupied`.

These occupancy fields are the authoritative input for Ticket 08
reconciliation after Apply Stash.

### Persistent count

Use `GET /dashboard` → `stash_count` for the persistent navigation
badge/count.

## Requirements

-   Add a persistent Stash entry point with `stash_count`.
-   Display stashed books using normal library book information.
-   Default to author-surname ordering and support relevant normal Books
    sorting/filtering.
-   Support bulk selection across the Stash.
-   Allow any non-empty selected subset to be applied to a live physical
    shelf.
-   Do not allow `unknown` as an Apply Stash destination.
-   Leave every unselected book stashed.
-   Show `previous_shelf_name` when non-null; handle null provenance
    without implying an error.
-   Preserve normal circulation display/actions for stashed `on_loan`
    books.
-   Treat placement and circulation as independent UI state.
-   Preserve selected-book order when constructing the mutation.
-   After success, invalidate/refetch Stash/Books queries, affected
    details, dashboard data, shelf consumers, and joined collection
    placement consumers as applicable.
-   Do not hydrate `BookRead` detail caches from the apply response; it
    does not contain full book objects.
-   Feed the successful Apply Stash result into the shared
    reconciliation model from Ticket 08.
-   Handle atomic stale-state failures without pretending that a partial
    apply occurred.

## Error handling

Cover the implemented Apply Stash failures:

-   **400** shelf not found or malformed book GUID;
-   **404** missing/deleted book;
-   **409** one or more selected books are no longer stashed;
-   **412** destination is `unknown`;
-   **422** empty, duplicate, over-100 selection, or invalid shelf-name
    shape.

Because the mutation is atomic, a failed request leaves the whole
selected set unresolved. Refresh the relevant server state before asking
the user to retry stale selections.

## Acceptance criteria

-   A user can open a Stash of 60 books, select 18, apply them to E3,
    and leave 42 stashed.
-   The Stash request uses `placement_state=stashed`.
-   Applying a subset never silently affects unselected books.
-   `unknown` cannot be submitted as the destination.
-   The list remains deterministically sorted after partial
    application/refetch.
-   Previous-shelf provenance is shown when available.
-   An `on_loan` stashed book remains visibly on loan and can still
    participate in Stash placement operations.
-   `stash_count` updates after stash/apply mutations.
-   Empty, loading, error, stale-selection, and retry states are
    covered.
-   A failed atomic apply never renders a partial-success state.
-   A successful qualifying Apply Stash operation emits the shared
    reconciliation result required by Ticket 08 using the occupancy
    values from the mutation response.
