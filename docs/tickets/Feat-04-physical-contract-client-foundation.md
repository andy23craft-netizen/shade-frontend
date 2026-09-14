# Feat-04 - Physical contract client foundation

**Status:** Proposed  
**Owner:** Frontend  
**Dependencies:** Feat-01, Feat-02, and Feat-03 must be complete first.

## Goal

Prepare the Shade client to consume the physical-library contract without exposing a live physical control yet.

## Scope

- Update typed API models, fixtures, and contract tests for stable shelf identity, map summary/revision, stale reason,
  display capability, Kinbote availability, and physical-session states.
- Add shared plain-language status presentation for accepted, active, partial, stale, unavailable, failed, expired,
  replaced, and cleared.
- Preserve existing catalog behavior when physical data is absent or Kinbote is unavailable.

## Acceptance criteria

- Fixtures can render all supported map/service/session states.
- A shelf rename does not change the client identity used for a physical reference.
- No controller address, credential, pixel calculation, or direct device call exists in the client.

## Out of scope

Shelf routing, display actions, mapping screens, and photograph workflow.
