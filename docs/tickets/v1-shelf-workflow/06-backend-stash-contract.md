# Pre-ticket 06: Backend Stash domain model and atomic APIs

## Purpose

This is a prerequisite for the frontend Stash and shared reconciliation tickets. The current bulk-move endpoint requires a real destination shelf, and existing `unknown` semantics do not represent intentional temporary displacement.

## Product invariants

- Stash is not a shelf.
- Stash is not missing shelf metadata and must not be represented by `unknown`.
- A stashed book remains an active catalog book.
- Stashed books have no current physical shelf membership.
- Stash and wishlist membership must remain mutually consistent with existing placement rules.
- Users can resolve any subset of the stash without resolving all of it.
- Bulk operations must be atomic; do not loop individual book updates.
- Preserve the previous shelf as provenance if practical.

## Requested backend design

Define an explicit placement state or equivalent domain representation that distinguishes at least:

- physically shelved;
- intentionally stashed;
- other existing unshelved cases required by wishlist behavior.

Provide contract support for:

1. Atomically stash selected catalog books.
2. List/filter stashed books using normal book sorting, especially author surname.
3. Atomically apply selected stashed books to a real shelf.
4. Return enough operation context for post-placement reconciliation: selected IDs, affected count, destination shelf, and the destination's pre-operation occupied count or an equivalent race-safe signal.
5. Expose stash count for persistent navigation/UI affordances.
6. Preserve or expose previous-shelf provenance if adopted.

## Contract questions to resolve

- Should placement state be an enum on Book, a separate placement record, or another normalized representation?
- Can a stashed book be on a wishlist? The recommended answer is no, consistent with intentional collection ownership.
- Should ordinary book detail/list responses expose `shelf_name: null` plus placement state, or use a dedicated placement object?
- What happens when a selected book is on loan, removed, already stashed, missing, or concurrently moved?
- Should applying Stash use a dedicated endpoint or a generalized atomic placement endpoint?
- How should previous-shelf provenance be cleared or updated after placement?

## Acceptance criteria

- Stash is represented independently from shelves and `unknown`.
- Bulk stash and bulk apply are atomic and validate every selected book before mutation.
- Partial stash resolution is supported.
- Book list/detail contracts unambiguously distinguish stashed books.
- Destination occupancy information is race-safe enough to drive the reconciliation prompt.
- Query/filter support returns stashed books in deterministic author/title order.
- Dashboard/shelf counts exclude stashed books from physical shelves and can expose stash count separately.
- OpenAPI, contract tests, migration notes, and exclusivity rules are updated.

## Copy-ready prompt for the backend agent

> Implement a first-class Stash workflow for temporary book displacement during physical shelf reorganization. Stash must not be modeled as a shelf or as the existing `unknown` shelf. A stashed book remains an active owned catalog book but has no current physical shelf and is explicitly awaiting placement. Add an atomic bulk-stash operation, list/filter support for stashed books with deterministic author-surname sorting, an atomic operation to apply any selected subset of stashed books to a real shelf, and a stash count suitable for navigation. Placement results must include enough race-safe destination context to tell the frontend whether multiple books were placed onto an already occupied shelf. Preserve previous-shelf provenance if the domain model supports it. Maintain current shelf/wishlist exclusivity, define behavior for loans/removed/already-stashed/concurrently changed books, update OpenAPI and contract tests, and document any migration. Before implementation, report the proposed data model and endpoint schemas so the frontend contract can be reviewed.

