# FEAT-98 -- Review: Book TBR and Reserved-Shelf Automation

**Status:** Review ticket. Implementation is complete against the checked-in 1.2.4 contract; live-backend verification and reporting remain.

**Depends on:** Library settings, shelf IDs, bulk shelf move, book availability, checkout, and the remaining automation contract.

## Review objective

Verify the shipped tenant-configured TBR and Reserved shelf automation against a running backend. Shelf, status, and reservation metadata remain atomic and backend-owned.

## Acceptance criteria

- [x] Moving to a configured TBR shelf relies on backend-applied status; the frontend does not calculate or repair Reserved/Available state.
- [x] Reading and Display Only precedence is rendered from the backend response without frontend repair.
- [x] Reserve via the configured Reserved shelf: the UI collects required pickup name and optional note through the atomic `POST /books/{id}/availability` Reserved transition, which the contract says moves the book to the configured Reserved shelf. The dedicated availability flow is the approved entry point; no shelf-picker reservation dialog is needed.
- [ ] Verify live-backend clearing of reservation details after checkout and after moving away from TBR/Reserved shelves. No frontend clearing behavior should be added.
- [x] Bulk shelf moves invalidate books, individual details, shelves, dashboard, collections, and library settings-dependent views.
- [ ] Verify recovery behavior against a running backend: deleted configured-shelf references, disabled-loans behavior, `409`, and server validation errors.

## Out of scope

Reservation queues, borrower accounts, notifications, and settings administration itself.

## Superseded design notes

1. Which shelves are TBR shelves for each tenant, and which single shelf—if any—is the general Reserved/will-call shelf?
- I think these need to be system shelves. Currently i just have a "liz tbr" for my wife, but to do this the right way, it seems like that needs to be a technical status rather than a physical shelf -- though it's both. Reserved, however, will need to retain its current shelf status so I can find it when someone comes to get it. Unforseen problem though, i will need to be able to see which shelf it came off of when it's no longer tbr or reserved to put it back away. So give me your opinion on how to handle this. 
2. Should pickup name/note be requested before a move begins or in a follow-up dialog after destination selection?
- follow-up dialog. 
