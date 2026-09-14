# Feat-14 - Photo-assisted map UI

**Status:** Proposed  
**Owner:** Frontend  
**Dependencies:** Feat-01, Feat-02, Feat-12, and Feat-13.

## Goal

Offer shelf-photo assistance as a clearly reviewable map-draft aid, not an authoritative automation.

## Scope

- Add photo capture/upload from the Shade mapping route with consent, retention information, progress, retry,
  deletion, and error states.
- Render proposal boundaries, candidate matches, confidence, and warnings separately from the current published map.
- Let users correct, reject, and confirm proposals before entering the normal review/publish flow.
- Test low-confidence, no-match, failed job, deletion, and confirmation flows.

## Acceptance criteria

- No proposal is visually or behaviorally presented as already published.
- A user can discard a proposal without affecting the current map.
- The workflow remains usable on the phone reference experience.

## Out of scope

Computer-vision implementation and direct access to Kinbote photo storage.
