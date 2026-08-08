# FEAT-12 — Operational and browser hardening

## Objective

Harden the completed product for supported browsers and safe production diagnosis before full release testing.

## Dependencies

FEAT-11.

## Scope

- Audit every route for semantic landmarks, heading hierarchy, focus order, labels, help text, linked errors, live regions,
  hit targets, reduced motion, and non-color status indicators.
- Make root-boundary and route-level recovery behavior consistent for startup and post-load API failures.
- Add a redacted diagnostic hook interface and optional production error reporting configured only at runtime.
- Include safe correlation/request IDs in user-visible error details and diagnostics when supplied by the backend.
- Enforce the privacy denylist: tokens, connection state, borrower names, notes, reviews, ISBN drafts, SQL backup
  contents, and full bodies. Never inspect, log, cache, upload, or send backup contents to diagnostics/error reporting.
- Finalize supported browser/device documentation and scanner limitations.
- Test representative long titles, authors, borrower names, tags, notes, and reviews.
- Record large-library responsiveness and bundle-size results; fix material regressions or create explicit release blockers.
- Document no-realtime behavior, accepted browser-token risk, exact-origin backend CORS or same-origin proxy
  requirements, exposed backup filename headers, and security-header assumptions.

## Acceptance criteria

- Runtime reporting can be disabled and changing its endpoint/configuration does not require rebuilding.
- Deliberately thrown render and request failures recover without a blank screen or private-data disclosure.
- Diagnostics expose only allowlisted context and safely include a correlation ID when present.
- All routes are usable with keyboard only and at 320-pixel, tablet, and desktop widths.
- Current supported evergreen desktop and mobile browsers pass the documented smoke matrix.
- Long content wraps or truncates accessibly without hiding required actions.
- Backup downloads leave no retained object URL or application cache entry, and diagnostics never inspect or report SQL
  contents.
- Bundle and large-library results are documented against the expectations set in FEAT-03.
- No unresolved high-severity privacy, browser, performance, or operational issue remains untracked.
- `make check` passes.

## Plan coverage

Sections 7.8, 7.9, 10, 12, and 13; operational visibility and cross-cutting release-gate requirements.
