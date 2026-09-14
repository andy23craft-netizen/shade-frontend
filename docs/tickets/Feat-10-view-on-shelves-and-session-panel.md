# Feat-10 - View on shelves and session panel

**Status:** Proposed  
**Owner:** Frontend  
**Dependencies:** Feat-01, Feat-02, Feat-04, and Feat-09.

## Goal

Extend Shade catalog workflows with an honest physical-display experience for current results and explicit selections.

## Scope

- Add **View on shelves** for already-resolved catalog results and explicit book selections.
- Submit only the selected/resolved stable IDs to Shade.
- Add a compact session panel for matched, unmapped, stale, unavailable, failed, active, expiry, replacement, and
  clear results.
- Add optional, non-blocking physical-destination and map-freshness cues to bulk-move and intake confirmations.
- Cover mixed mapping, stale maps, replacement, and service outage in end-to-end tests.

## Acceptance criteria

- Ordinary filtering, intake, and moves remain usable if physical output is unavailable.
- The UI accurately communicates partial results across supported shelves.
- No filtering rule, calibration, pixel calculation, or provider detail is duplicated in the client.

## Out of scope

Map editing, photo assistance, and controller administration.
