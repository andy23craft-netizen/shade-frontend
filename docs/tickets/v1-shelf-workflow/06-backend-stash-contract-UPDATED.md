# Pre-ticket 06: Backend Stash contract --- implemented reference

## Status

**Complete.** The backend Stash contract has been implemented and the
refreshed OpenAPI document is now the source of truth.

This document is retained as the dependency/reference point for Tickets
07--09. It is no longer a backend implementation request.

## Implemented domain invariants

-   Stash is a first-class placement state, not a shelf.
-   Stash does not use the real `unknown` shelf.
-   Book placement is explicitly one of:
    -   `shelved`
    -   `stashed`
    -   `unshelved`
-   `BookRead.shelf_name` is nullable.
-   A stashed book has `shelf_name: null`.
-   A stashed book may expose its source shelf through
    `previous_shelf_name`.
-   Wishlist-style catalog rows are `unshelved`, not synthetic
    `unknown`.
-   Placement and circulation are independent. An `on_loan` book may be
    stashed or applied without altering its active loan.
-   Stash and wishlist membership are mutually exclusive.
-   Stash/apply operations are atomic.

## Implemented `BookRead` placement contract

``` ts
type PlacementState = 'shelved' | 'stashed' | 'unshelved'

type BookPlacementFields = {
  placement_state: PlacementState
  shelf_name: string | null
  previous_shelf_name: string | null
}
```

Valid states:

  -----------------------------------------------------------------------
  State                   `shelf_name`            `previous_shelf_name`
  ----------------------- ----------------------- -----------------------
  `shelved`               Current shelf,          `null`
                          including real          
                          `unknown`               

  `stashed`               `null`                  Source shelf, or `null`
                                                  if that shelf was
                                                  deleted

  `unshelved`             `null`                  `null`
  -----------------------------------------------------------------------

Frontend code must use `placement_state`, not `shelf_name` truthiness,
to distinguish Stash from unshelved catalog rows.

## Implemented list/filter contract

`GET /books` accepts `placement_state`.

``` http
GET /books?placement_state=stashed&sortBy=author&sortOrder=asc&skip=0&take=25
```

Behavior:

-   omitted or `shelved` → normal shelved-book list;
-   `stashed` → Stash;
-   `unshelved` → books with neither shelf nor Stash membership;
-   `shelf_name` combined with `stashed` or `unshelved` → **400**;
-   invalid placement state → **422**;
-   normal filters, sorting, pagination, and total counts continue to
    apply.

The frontend must add `placement_state` to its centralized Books
URL/filter model, request construction, and query keys. Stash must be
fetched server-side with `placement_state=stashed`, not filtered from
the normal Books list.

## Implemented atomic stash operation

``` http
POST /books/bulk/stash
```

Request:

``` json
{
  "book_ids": ["<guid>", "<guid>"]
}
```

Rules:

-   1--100 unique GUIDs;
-   every selected book must still be shelved;
-   the operation is all-or-nothing;
-   request order is preserved in the response;
-   successful items return `previous_shelf_name`;
-   stashing preserves circulation state.

Important failures include:

-   **400** malformed GUID;
-   **404** missing/deleted book;
-   **409** already stashed or otherwise not shelved;
-   **412** wishlist membership conflict;
-   **422** empty, duplicate, or over-limit selection.

## Implemented atomic Apply Stash operation

``` http
POST /books/bulk/apply-stash
```

Request:

``` json
{
  "book_ids": ["<guid>", "<guid>"],
  "shelf_name": "e3"
}
```

Any non-empty selected subset may be applied.

Successful responses include:

``` ts
{
  applied_count: number
  book_ids: string[]
  destination_shelf: string
  destination_preexisting_count: number
  destination_was_occupied: boolean
}
```

`destination_preexisting_count` is measured immediately before insertion
inside the serialized write transaction. For Apply Stash reconciliation,
this response is authoritative. Do not issue a second shelf-count
request.

The destination must be a real physical shelf; applying Stash to
`unknown` returns **412**.

## Other implemented write-path rules

-   `PATCH /books/{id}` cannot directly assign a shelf to a stashed
    book; use Apply Stash.
-   `POST /books/bulk/move-to-shelf` fails atomically if any selected
    book is stashed.
-   A stashed book cannot be added to a wishlist.
-   Checkout/check-in preserve Stash placement.
-   Hard delete removes Stash membership.
-   If a source shelf is deleted while a book is stashed,
    `previous_shelf_name` becomes `null`.

## Dashboard contract

`GET /dashboard` now includes:

``` ts
stash_count: number
```

Shelved + stashed books count as owned for the main dashboard ownership
metrics. Shelf breakdowns remain physical-shelf-only, so they may not
sum to `total_books` while Stash is non-empty.

Use `stash_count` for the persistent Stash navigation badge.

## Frontend prerequisite work before Ticket 07

Before implementing Stash UI:

-   regenerate TypeScript API types from refreshed OpenAPI;
-   audit all `BookRead.shelf_name` consumers for nullability;
-   add `placement_state` to centralized Books filters, URL parsing,
    request construction, and query keys;
-   add `stash_count` to dashboard/runtime fixtures;
-   define dedicated bulk stash/apply mutations;
-   ensure placement and circulation are treated independently;
-   update cache invalidation for book lists, affected details,
    dashboard data, shelf consumers, and joined collection views where
    placement is rendered.

## Known reconciliation contract boundary

The implemented contract explicitly provides race-safe destination
occupancy for **Apply Stash**.

This document does **not** establish equivalent race-safe occupancy
fields for Bulk Add shelf submission or the existing Books-page
`bulk/move-to-shelf` response. Tickets 08--09 must not assume those
operations already return the same result shape. If shared
reconciliation is required for those entry points, their actual OpenAPI
responses must be reviewed and, if necessary, a backend follow-up
contract added before integration.
