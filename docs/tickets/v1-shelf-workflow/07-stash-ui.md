# Ticket 07: Build the Stash view and Apply Stash workflow

## Dependency

Blocked by [Pre-ticket 06](06-backend-stash-contract.md) and its finalized OpenAPI contract.

## Problem

Users need a persistent staging area for books displaced during physical reorganization when their final destinations are not yet known.

## Requirements

- Add a persistent Stash entry point with an unresolved-book count.
- Display every stashed book using normal library book information.
- Default to author-surname ordering and support relevant normal Books sorting.
- Support bulk selection across the stash.
- Allow the selected subset to be applied to a live, assignable shelf.
- Leave all unselected books stashed.
- Show previous-shelf provenance if the backend exposes it.
- Handle stale selections and atomic-operation errors honestly.

## Acceptance criteria

- A user can open a stash of 60 books, select 18, apply them to E3, and leave 42 stashed.
- Applying a subset never silently affects unselected books.
- The list remains deterministically sorted after partial application.
- Stash count updates after stash/apply operations.
- Empty, loading, error, partial-stale, and retry states are covered.
- Successful multi-book placement emits the shared reconciliation result required by Ticket 08.

