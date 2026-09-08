# FEAT-82 -- Book TBR and Reserved-Shelf Automation

**Status:** Blocked on `BACKEND-HANDOFF-PLAN-03` atomic shelf/status/reservation semantics and pending tenant configuration decisions.

**Depends on:** Library settings, shelf IDs, bulk shelf move, book availability, checkout, and the remaining automation contract.

## Objective

Consume tenant-configured TBR and Reserved shelf IDs while keeping shelf, status, and reservation metadata atomic and backend-owned.

## Acceptance criteria

- [ ] Moving to any configured TBR shelf reflects backend-applied Reserved state; leaving all TBR shelves reflects Available when eligible.
- [ ] Reading and Display Only precedence is rendered without frontend attempts to repair state.
- [ ] Moving to the configured Reserved shelf collects required pickup name and optional note and submits structured reservation data.
- [ ] Reservation details clear according to the backend contract after checkout or leaving the Reserved shelf.
- [ ] Bulk move to a TBR shelf relies on the atomic bulk response and invalidates books, shelves, dashboard, and settings-dependent views.
- [ ] Missing settings, deleted shelf references, disabled loans, `409`, and validation failures have explicit recovery states.

## Out of scope

Reservation queues, borrower accounts, notifications, and settings administration itself.

## Open questions

1. Which shelves are TBR shelves for each tenant, and which single shelf—if any—is the general Reserved/will-call shelf?
- I think these need to be system shelves. Currently i just have a "liz tbr" for my wife, but to do this the right way, it seems like that needs to be a technical status rather than a physical shelf -- though it's both. Reserved, however, will need to retain its current shelf status so I can find it when someone comes to get it. Unforseen problem though, i will need to be able to see which shelf it came off of when it's no longer tbr or reserved to put it back away. So give me your opinion on how to handle this. 
2. Should pickup name/note be requested before a move begins or in a follow-up dialog after destination selection?
- follow-up dialog. 
