# Ticket 08: Build shared post-placement shelf reconciliation

## Status

**Complete for operation sources with authoritative occupancy data in frontend version 1.0.3.**

## Dependency

Use the implemented Stash occupancy semantics documented in [Pre-ticket
06](06-backend-stash-contract.md).

**Important contract boundary:** Apply Stash already returns race-safe
destination occupancy. The supplied backend contract does not establish
the same response fields for Bulk Add or Books-page bulk move. Build the
shared frontend model so those sources can plug in later, but do not
fabricate occupancy for an operation whose backend response does not
provide it.

## Problem

Placing several books onto an occupied shelf may displace books already
there. This applies across workflows and should not become
feature-specific page logic.

## Shared result model

Create one frontend reconciliation input that can represent a completed
placement operation, for example conceptually:

``` ts
type PlacementReconciliationResult = {
  source: 'apply-stash' | 'bulk-move' | 'bulk-add' | string
  placedBookIds: string[]
  placedCount: number
  destinationShelf: string
  destinationPreexistingCount: number
  destinationWasOccupied: boolean
}
```

The exact TypeScript shape may follow generated API types, but occupancy
must come from authoritative operation-result data rather than a later
independent count query.

For Apply Stash, map directly from:

-   `book_ids`;
-   `applied_count`;
-   `destination_shelf`;
-   `destination_preexisting_count`;
-   `destination_was_occupied`.

## Trigger

For V1, prompt when:

-   at least two books were successfully placed; and
-   `destination_preexisting_count > 0`.

Equivalent use of `destination_was_occupied` is acceptable, but the
count should remain available for explanatory copy.

Do not trigger from failed mutations.

## Requirements

-   Create one shared post-placement result model and reconciliation UI.
-   Explain both the number placed and the destination's previous
    occupancy.
-   Offer `Done` and `Review <shelf>`.
-   `Review <shelf>` opens the destination shelf in Books
    bulk-selection/review mode.
-   Review actions include:
    -   `Move to Shelf`
    -   `Stash Books`
    -   `Finish Review`
-   `Stash Books` must use `POST /books/bulk/stash`, not individual
    updates.
-   Only currently shelved books may be stashed; surface atomic
    stale-state failures honestly.
-   Moving or applying another group may emit another reconciliation
    result, allowing a shelf shuffle to continue.
-   Never infer pre-operation occupancy by subtracting counts from
    independently timed list queries.
-   Canceling/closing/navigating away must only dismiss review state; it
    must never replay the completed placement mutation.
-   Keep reconciliation state separate from the mutation request so
    browser/navigation behavior cannot accidentally resubmit the
    operation.

## Suggested copy

> You moved 24 books to E4. E4 already contained 31 books. Do you need
> to move or stash any books from E4?

For Apply Stash, `24` and `31` must come from the successful apply
response.

## Cache behavior

After a Stash action performed during review, invalidate/refetch:

-   book lists, including placement-filtered lists;
-   affected book details;
-   dashboard summary/breakdowns/incomplete metadata;
-   relevant shelf consumers;
-   collection membership views that render joined placement.

The shared layer should expose a consistent invalidation path rather
than duplicating this logic per screen.

## Acceptance criteria

-   Apply Stash uses its backend-returned occupancy fields and never
    performs a second count request to decide whether to prompt.
-   The trigger fires for a qualifying Apply Stash result and does not
    fire when the destination was previously empty.
-   `Done` closes the checkpoint without changing placement.
-   `Review E4` shows E4 books with bulk selection active.
-   Users can move or stash only the displaced subset they explicitly
    select.
-   Stashing from review uses the atomic bulk-stash endpoint.
-   A subsequent qualifying placement can continue the reconciliation
    chain.
-   Canceling or navigating away never repeats the original mutation.
-   Dialog and review controls are keyboard and mobile accessible.
-   The shared result model is source-agnostic enough for Bulk Add and
    Books bulk move once those operations provide authoritative
    occupancy data.

## Product decision before full integration

Bulk Add has previously used a one-book occupied-shelf checkpoint
because it also supports alphabetical review. Decide during Ticket 09
whether to preserve that exception or adopt the universal two-or-more
trigger.

Do not resolve that product choice by inventing backend occupancy data.

## Backend follow-up gate for other operation sources

Before Ticket 09 wires Bulk Add or Books bulk move into this shared
trigger, inspect their generated OpenAPI response types.

If either operation lacks authoritative pre-operation destination
occupancy, add/complete a backend contract follow-up that returns
equivalent race-safe fields. Do not substitute a post-mutation shelf
query.
