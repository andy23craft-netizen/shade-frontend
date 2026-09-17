# Feat-10 - View on shelves and session panel

**Status:** Proposed  
**Owner:** Frontend  
**Dependencies:** Feat-01, Feat-02, Feat-04, and Feat-09. Before multi-shelf display ships, the backend must provide
the transactional placement-event outbox, idempotent Kinbote delivery, and reconciliation contract drafted in
`Kinbote-frontend-api-contract-draft.md`.

## Goal

Extend Shade catalog workflows with an honest physical-display experience for current results and explicit selections.

## Scope

- Add **View on shelves** for already-resolved catalog results and explicit book selections.
- Submit only the selected/resolved stable IDs to Shade.
- Add a compact session panel for matched, unmapped, stale, unavailable, failed, active, expiry, replacement, and
  clear results, including safe per-shelf outcomes and correlation ID where it helps support recovery.
- Add optional, non-blocking physical-destination and map-freshness cues to bulk-move and intake confirmations.
- Treat an accepted placement mutation as successful even if its physical invalidation is delayed or fails; show only
  the server's safe, optional freshness/delivery status and a reconciliation-ready stale state.
- Cover mixed mapping, stale maps, replacement, and service outage in end-to-end tests.

## Acceptance criteria

- Ordinary filtering, intake, and moves remain usable if physical output is unavailable.
- The UI accurately communicates partial results across supported shelves.
- A missed/retried physical event never changes the displayed Shade catalog truth or blocks its successful mutation.
- No filtering rule, calibration, pixel calculation, or provider detail is duplicated in the client.

## Out of scope

Map editing, photo assistance, and controller administration.
