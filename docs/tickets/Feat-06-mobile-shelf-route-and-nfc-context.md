# Feat-06 - Mobile shelf route and NFC context

**Status:** Proposed  
**Owner:** Frontend  
**Dependencies:** Feat-01, Feat-02, and Feat-05 must be complete first.

## Goal

Make a stable Shade shelf link a safe, mobile-friendly library entry point.

## Scope

- Add a normal shelf-browse route addressed by `shelf_id`.
- Render safe recovery for invalid, unknown, retired, unauthenticated, and unauthorized links.
- Pass selected shelf context into supported Bulk Add and Bulk Move entries while retaining ordinary pickers.
- Test direct navigation, bad links, device-size behavior, and context preservation.

## Acceptance criteria

- A valid shelf link opens the correct authorized shelf on a phone.
- A bad/retired link offers recovery without leaking data or changing catalog state.
- No NFC tag is required to ship or use the route.

## Out of scope

Live-light controls, mapping, and any direct Kinbote/device connection.
