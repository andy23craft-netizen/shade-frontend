# Feat-15 - Multi-shelf health and recovery UI

**Status:** Proposed  
**Owner:** Frontend  
**Dependencies:** Feat-01, Feat-02, Feat-10, Feat-12, and a tested Kinbote multi-controller deployment.

## Goal

Make physical-library state understandable across installed shelves while keeping controller operation out of Shade.

## Scope

- Expand session and map-health views for multiple shelves, controllers, current/stale maps, and partial availability.
- Add authorized recovery entry points that consume friendly Shade/Kinbote status models, not controller configuration.
- Show insertion-gap guidance only when the backend reports a current, sufficiently reliable spatial result.
- Keep unavailable or uncalibrated expansion controls hidden/disabled rather than implying hardware is ready.

## Acceptance criteria

- Users can identify which shelves are active, stale, unmapped, or unavailable from a multi-shelf request.
- A supported service/controller failure has a clear recovery path and does not disrupt normal catalog use.
- The UI never exposes controller secrets, endpoint details, calibration values, or raw commands.

## Out of scope

Controller provisioning, calibration persistence, Home Assistant implementation, and Kinbote operations tooling.
