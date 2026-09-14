# Feat-12 - Mobile shelf-map workflow

**Status:** Proposed  
**Owner:** Frontend  
**Dependencies:** Feat-01, Feat-02, Feat-06, and Feat-11.

## Goal

Let an authorized user maintain a physical shelf map from Shade without silently replacing the published map.

## Scope

- Add a phone-friendly map route entered from authorized shelf context.
- Show expected shelf contents, current revision/freshness, ordering and normalized-boundary editing.
- Present inline overlap, gap, missing/unexpected, duplicate, and stale-source validation.
- Add explicit review and publish confirmation, plus stale-map recovery after a placement change.

## Acceptance criteria

- A user can create/revise a map draft, review validation, and explicitly publish it.
- Current maps remain visible and intact while a draft is incomplete, invalid, or abandoned.
- The experience is touch-friendly, keyboard accessible, and has no device configuration controls.

## Out of scope

Photo capture/analysis and Kinbote calibration management.
