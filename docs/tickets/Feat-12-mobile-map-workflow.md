# Feat-12 - Mobile shelf-map workflow

**Status:** Proposed  
**Owner:** Frontend  
**Dependencies:** Feat-06 and Feat-11.

## Goal

Let an authorized user maintain a physical shelf map from Shade without silently replacing the published map.

## Scope

- Add a phone-friendly map route entered from authorized shelf context.
- Show Shade-authorized expected shelf contents, current immutable revision/freshness, and ordering and
  normalized-boundary editing. Address all mapping resources by stable `shelf_id` and `book_id`, never display names.
- Present inline overlap, gap, missing/unexpected, duplicate, and stale-source validation.
- Add explicit review and publish confirmation, plus stale-map recovery after a placement change. Publish must carry
  the expected source revision/content snapshot and present a server stale/conflict result without guessing repairs.

## Acceptance criteria

- A user can create/revise a map draft, review validation, and explicitly publish it.
- Current maps remain visible and intact while a draft is incomplete, invalid, or abandoned.
- A placement change makes a map inspectable-but-stale; the UI never presents it as current or precise output until
  Kinbote accepts a newly confirmed revision.
- The experience is touch-friendly, keyboard accessible, and has no device configuration controls.

## Out of scope

Photo capture/analysis and Kinbote calibration management.
