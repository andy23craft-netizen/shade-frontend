# FEAT-43 -- Book TBR and Reserved-Shelf Automation

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
2. Should pickup name/note be requested before a move begins or in a follow-up dialog after destination selection?
