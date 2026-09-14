# Feat-08 - Book Details Find on shelf

**Status:** Proposed  
**Owner:** Frontend  
**Dependencies:** Feat-01, Feat-02, Feat-04, and Feat-07.

## Goal

Add the first Shade physical-library control: a truthful one-book Find on shelf action on Book Details.

## Scope

- Show the permission-aware action only when Shade reports a current usable map and display capability.
- Start, replace, clear, and monitor the session through Shade's API only.
- Present acceptance, active, expiry, replacement, clear, controller-unavailable, map-stale, and failed outcomes in
  plain language.
- Test accepted, rejected, expired, and simulated controller-outage responses.

## Acceptance criteria

- The page remains useful when the action is unavailable or fails.
- The interface does not imply lights are active merely because a request was submitted.
- The client performs no device calculation or direct controller call.

## Out of scope

Filtered-result display, mapping, and multi-shelf UI.
