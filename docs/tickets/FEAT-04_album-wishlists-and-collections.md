# FEAT-04 -- Album Wishlists and Collections

**Status:** Ready to be implemented.

**Dependency group:** Album curation and acquisition.

**Depends on:** Shipped album catalog and mixed-wishlist support; the existing book Wishlist
and Collection interaction patterns; authoritative album Collection membership contract
before Collection writes are wired.

## Objective

Give albums the same first-class Wishlist and curated Collection workflows that books have,
while retaining album-specific identity, artwork, metadata, and **crate** terminology.

## Acceptance criteria

- [ ] Album users can create, rename, describe, and delete Wishlists and Collections through
      the same shared management patterns used for books.
- [ ] Wishlist views render book and album memberships as explicitly typed rows; album rows
      use `album_id`, authenticated artwork, title, artists, format, and album routes without
      passing album identifiers into book APIs or controls.
- [ ] Albums can be added to and removed from a Wishlist from album browse/detail flows, with
      duplicate and stale-state behavior matching the existing book experience.
- [ ] Album Wishlist membership notes can be added, edited, and cleared without changing
      book membership operations.
- [ ] A wishlisted album can be moved into an eligible crate through an atomic,
      album-specific operation that preserves the source membership and notes on conflict or
      failure.
- [ ] Album Collections mirror book Collection workflows: create/edit/delete a Collection,
      search and add owned albums, add the current album from Album Details, edit membership
      notes, reorder entries, and remove memberships.
- [ ] Collection membership transport remains explicitly typed. The frontend does not infer
      album support from book-only fields or send `album_id` through book Collection routes;
      any missing album Collection API is recorded and landed before those writes ship.
- [ ] Album Collection rows use authenticated artwork and album-native display metadata and
      routes. Collections do not change crate/Wishlist placement or album lifecycle state.
- [ ] Loading, empty, error, duplicate, conflict, responsive, keyboard, and assistive-
      technology states have unit and browser coverage for album membership workflows.

## Out of scope

Polymorphic catalog CRUD, automatic Collections, recommendation-generated membership,
cross-media drag-and-drop, and changing the existing book Collection contract.
