# Feat-08 - Book Details Find on shelf

**Status:** Proposed  
**Owner:** Frontend  
**Dependencies:** Feat-04 and Feat-07.

## Goal

Add the first Shade physical-library control: a truthful one-book Find on shelf action on Book Details.

## Scope

- Show the permission-aware action only when Shade reports a current usable map and its server-determined physical
  capability. The browser must not infer home-Wi-Fi status.
- Start, replace, clear, and monitor a versioned, bounded session through Shade's API only, using the contract's
  idempotency and correlation fields. Clear must be safe to retry.
- Present acceptance, active, expiry, replacement, clear, controller-unavailable, map-stale, and failed outcomes in
  plain language.
- Test accepted, rejected, unmapped, unavailable, failed, expired, duplicate/retried, and simulated controller-outage
  responses.

## Acceptance criteria

- The page remains useful when the action is unavailable or fails.
- The interface does not imply lights are active merely because a request was submitted.
- Physical failure or expiry leaves the book detail and every underlying library operation intact.
- The client performs no device calculation or direct controller call.

## Out of scope

Filtered-result display, mapping, and multi-shelf UI.
