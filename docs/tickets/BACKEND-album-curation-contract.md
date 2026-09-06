# Backend handoff — Album curation contract

**Status:** Needed to complete frontend FEAT-04.

## Context

Backend 1.1.0 supports mixed wishlist reads plus album add/remove, but it does not expose the remaining mutation contracts required by `FEAT-04_album-wishlists-and-collections.md`. The frontend must not send album identifiers through book-only routes or implement a delete-then-patch move that can lose membership data.

## Required wishlist additions

- Add an album-specific membership update route for notes, with explicit `notes: string | null` semantics and omission/empty-body validation matching the existing book membership update.
- Add one atomic operation that moves an album wishlist membership to an eligible album crate. It must validate the wishlist, typed album membership, album, and destination before changing state.
- On every validation, conflict, or persistence failure, preserve the source membership and all membership metadata, including notes, priority, status, URL, and creation/order data.
- Reject wrong-media memberships and book shelves with the established typed `404` / mixed-media `412` behavior.
- Return a response shape sufficient for the frontend to refresh or directly update album detail, album lists, mixed wishlist items, shelves, and dashboard caches.

## Required Collection additions

- Define explicitly typed album Collection membership schemas; do not overload `CollectionBookRead`, `CollectionBookCreate`, or `collection_book_id` ambiguously.
- Add list/add/update-order/update-notes/remove routes for album memberships.
- Preserve existing Collection CRUD and allow one Collection to contain the media types chosen by product design. If mixed Collections are permitted, expose a typed mixed-item list with exactly one of `book_id` / `album_id` non-null. If Collections are media-specific, expose that type in the Collection schema and enforce it consistently.
- Support catalog search/add of owned, non-deleted albums and adding the current album from Album Details.
- Return duplicate membership as `409`, stale/missing typed resources as `404`, validation as `422`, and mixed-media policy conflicts as documented `412` responses.
- Collection membership changes must not alter crate placement, wishlist membership, deletion state, played state, or circulation state.
- Include membership notes with `string | null` clearing semantics and stable positive ordering with an atomic reorder operation.

## Contract deliverables

- Update the backend OpenAPI document and `API-for-FE.md` together.
- Add integration coverage for success, duplicate, stale ID, wrong-media ID, cross-collection/cross-wishlist ID, conflict rollback, notes clearing, reorder, and tenant isolation.
- Provide retained-data migration notes if new tables or columns are required.

Once this contract ships, refresh the frontend checked-in OpenAPI types before completing and removing FEAT-04.
