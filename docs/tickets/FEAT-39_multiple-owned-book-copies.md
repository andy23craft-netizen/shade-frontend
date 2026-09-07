# FEAT-39 -- Multiple-Owned-Copy Book Intake

**Status:** Ready against OpenAPI 1.1.3.

**Depends on:** Shipped book create, lookup, bulk lookup/import, Wishlist acquisition, and Build Mode.

## Objective

Make copy identity explicit when create/import encounters an ISBN already owned, so another physical copy can be added without accidentally reusing an existing catalog row.

## Acceptance criteria

- [ ] Create and Build Mode distinguish **add another copy**, **use an existing copy**, and Wishlist acquisition where each action is valid.
- [ ] Every new copy receives its own backend `book_id`; shared ISBN and edition metadata never imply shared shelf, availability, loan history, cover ownership, or QR identity.
- [ ] Ambiguous bulk lookup results present the returned `catalog_book_ids` and preserve the draft until the owner chooses an action.
- [ ] Repeated ISBNs in one batch follow the documented ordered partial-success behavior and never silently collapse.
- [ ] Recovery, retry, 320px, 200% zoom, keyboard, and screen-reader behavior are tested.

## Out of scope

Work grouping, QR printing, and changing backend duplicate policy.

## Open questions

1. Should ordinary single-book create warn before adding another owned copy, or only explain the result after save?
- before

2. Which existing-copy facts are needed in the duplicate chooser beyond title, authors, shelf, status, and creation date?
- that's enough. 
