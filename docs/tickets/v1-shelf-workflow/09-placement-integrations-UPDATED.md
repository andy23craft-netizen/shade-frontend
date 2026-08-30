# Ticket 09: Integrate qualifying placement entry points

## Status

**Complete for the current backend contract in frontend version 1.0.3.** Apply Stash is integrated. Bulk Add and ordinary bulk move remain gated because their current responses do not expose authoritative pre-operation occupancy.

## Dependencies

-   [Ticket 07: Stash UI](07-stash-ui.md)
-   [Ticket 08: Shared shelf reconciliation](08-shelf-reconciliation.md)
-   Refreshed generated API types for every operation being integrated.

## Contract gate

Apply Stash is ready for integration: its response includes
authoritative pre-operation destination occupancy.

Before integrating **Bulk Add shelf submission** or **Books-page bulk
move**, inspect their current generated OpenAPI response types. The
supplied Stash backend contract does not establish equivalent occupancy
fields for those operations.

A source may join the shared reconciliation workflow only when its
completed mutation result can provide:

-   placed book IDs;
-   placed count;
-   normalized destination shelf;
-   race-safe destination preexisting count or equivalent authoritative
    occupied signal.

If an operation lacks those fields, create a backend follow-up contract
before wiring that source into the automatic shared prompt. Do not
reconstruct occupancy from a later list/count query.

## Goal

Route every placement operation with authoritative reconciliation
context through the shared post-placement result instead of maintaining
feature-specific occupancy calculations or prompts.

## Entry points

### Ready under the current Stash contract

-   Apply Stash.

### Integrate after contract verification

-   Bulk Add shelf submission.
-   Books-page bulk move.
-   Any other V1 shelf-management bulk placement.

### Future

-   Collection-management placement actions should consume the same
    shared result when they perform physical placement and expose
    equivalent authoritative context.

## Requirements

-   Wire Apply Stash directly into Ticket 08 using:
    -   `book_ids`;
    -   `applied_count`;
    -   `destination_shelf`;
    -   `destination_preexisting_count`;
    -   `destination_was_occupied`.
-   Verify Bulk Add and Books bulk-move response contracts before
    integration.
-   Where authoritative fields exist, adapt each operation result into
    the same shared frontend reconciliation model.
-   Where they do not exist, leave the operation behavior intact until
    the backend follow-up lands rather than adding client-side occupancy
    inference.
-   Replace feature-private reconciliation popup/message logic only
    after the shared result can preserve that workflow's required
    behavior.
-   Preserve Bulk Add's post-shelf review checkpoint and ability to
    continue to the next shelf.
-   Decide explicitly whether Bulk Add retains its one-book
    occupied-shelf exception or adopts the universal two-or-more
    trigger.
-   Use `POST /books/bulk/stash` for Stash actions from shelf review.
-   Never use normal book PATCH or `bulk/move-to-shelf` to place a
    currently stashed book; Apply Stash must use
    `POST /books/bulk/apply-stash`.
-   Treat stashed `on_loan` books as valid owned books; placement must
    not alter circulation.
-   Centralize post-mutation invalidation for:
    -   all Books lists, including placement-filtered/infinite queries;
    -   affected book details;
    -   dashboard summary/breakdowns/incomplete metadata and
        `stash_count`;
    -   shelf/count consumers;
    -   collection views that render joined placement.
-   Do not update full detail caches from Stash mutation responses
    because those responses do not contain full `BookRead` objects.
-   Prevent recursive/noisy prompts for failed mutations or operation
    results that do not meet the trigger.
-   Never repeat a completed mutation because a reconciliation dialog
    was canceled, revisited, or restored through navigation.

## Chained physical workflow

The intended completed flow remains:

1.  Bulk Add places books onto shelf A.
2.  A qualifying result opens review for A.
3.  The user selects displaced books and atomically stashes them.
4.  The user continues Bulk Add.
5.  Later, the user opens Stash and applies a selected subset to shelf
    B.
6.  Apply Stash returns B's preexisting occupancy.
7.  If the shared trigger qualifies, review opens for B.
8.  The user may move or stash another explicit subset, continuing the
    shelf shuffle.

Steps 1--2 depend on Bulk Add exposing authoritative occupancy context.
Steps 5--7 are supported by the implemented Stash contract.

## Acceptance criteria

-   Apply Stash triggers the shared checkpoint from its own successful
    response without a second occupancy request.
-   No integrated workflow privately reimplements destination occupancy
    calculations.
-   No integration infers pre-operation occupancy from post-operation
    shelf counts.
-   Bulk Add and Books bulk move are not treated as contract-equivalent
    to Apply Stash until their response schemas are verified.
-   Stash review actions use the atomic Stash endpoint.
-   Stashed books are applied only through the dedicated Apply Stash
    endpoint.
-   Placement mutations preserve independent circulation state.
-   Browser navigation, direct shelf links, popup/tab behavior, and
    mobile state remain coherent.
-   End-to-end coverage exercises at least one chained reconciliation
    sequence once all required operation contracts are available.

## Out of scope

-   Automatic or suggested surname-range placement.
-   Automatic movement of any book without explicit user selection and
    confirmation.
-   Client-side reconstruction of race-safe occupancy.
