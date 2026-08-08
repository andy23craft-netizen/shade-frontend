# FEAT-13 — Workflow and accessibility tests

## Objective

Prove critical user journeys, accessibility, cache behavior, and error recovery before packaging.

## Dependencies

FEAT-12.

## Scope

- Complete API mock coverage for every route, success response, and documented status.
- Complete unit coverage for parsing, formatting, validation, form conversion, patch generation, invalidation, and scanner
  state.
- Add component/integration coverage for loading, empty, success, validation, conflict, stale, offline, and retry states.
- Add automated accessibility checks for routes, forms, dialogs, notifications, and destructive confirmations.
- Add isolated browser-level journeys for connection setup, manual add, ISBN lookup/edit, checkout/check-in, reading,
  delete/restore, and updated dashboard values.
- Exercise direct navigation/refresh with an SPA fallback in the browser-test host.
- Create keyboard, 320-pixel phone, tablet, desktop, and manual scanner/device checklists.
- Establish meaningful unit/integration and browser coverage thresholds that fail on regression.
- Keep `make check` as the single local quality gate and include all non-manual suites it requires.

## Acceptance criteria

- Tests assert user outcomes and accessibility rather than internal implementation details.
- No critical journey depends on test ordering or shared mutable backend records.
- Browser journeys cover every MVP outcome and relevant dedicated lifecycle endpoint.
- Automated scans have no serious or critical known accessibility violations.
- Network, authentication, validation, conflict, lookup, empty-data, and stale-resource recovery are represented.
- Scanner behavior that cannot be automated is covered by a completed manual device matrix.
- The full suite passes from a clean immutable dependency install.
- Any quarantined or manual-only release check has an owner, rationale, and explicit gate status.
- `make check` passes.

## Plan coverage

Workstream 11; product, quality, and integration gates; all cross-cutting edge cases in section 10.
