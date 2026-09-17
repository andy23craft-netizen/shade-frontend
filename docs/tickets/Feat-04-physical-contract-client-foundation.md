# Feat-04 - Physical contract client foundation

**Status:** Proposed  
**Owner:** Frontend  
**Dependencies:** Feat-03 must be complete first.

## Goal

Prepare the Shade client to consume the physical-library contract without exposing a live physical control yet.

## Scope

- Adopt the draft Shade-facing contract in `Kinbote-frontend-api-contract-draft.md`: typed models, fixtures, and
  contract tests for stable shelf identity, map summary/revision, stale reason, server-determined physical capability,
  safe service health, and display-session states.
- Add shared plain-language status presentation for accepted, active, partial, clearing, completed, stale, unmapped,
  unavailable, failed, expired, replaced, and cleared.
- Model the server-issued correlation ID and client-generated idempotency key required for a bounded display session;
  never derive the home-LAN capability from browser information.
- Preserve existing catalog behavior when physical data is absent or Kinbote is unavailable.

## Acceptance criteria

- Fixtures can render all supported map/service/session states.
- A shelf rename does not change the client identity used for a physical reference.
- The client sends requests only to Shade, has no Kinbote credential/configuration, and can safely retry a clear or
  same idempotent request.
- No controller address, credential, pixel calculation, or direct device call exists in the client.

## Out of scope

Shelf routing, display actions, mapping screens, and photograph workflow.
