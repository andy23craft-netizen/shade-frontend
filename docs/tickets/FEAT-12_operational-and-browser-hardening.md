# FEAT-12 — Operational and browser hardening

## Objective

Harden the completed product for supported browsers and safe production diagnosis before full release testing.

## Dependencies

FEAT-11.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for documented paths, status codes, `ErrorDetail` /
  `HTTPValidationError` shapes, and the only response headers OpenAPI declares (`Content-Disposition` on
  `GET /backup`).
- `../technical-reference/API-for-FE.md` -- behavioral guidance OpenAPI does not fully express (Bearer-only auth with
  no session, exact-origin CORS, error-status meanings, no realtime/pagination, backup blob download, and privacy-
  sensitive payload fields).

Reuse FEAT-02 / FEAT-03 / FEAT-05 connection, error-model, and redaction seams. Do not invent a second diagnostic transport or
assume undocumented backend headers, cookies, or push channels.

### Documented contract facts for this ticket

Confirm against a representative running backend `/openapi.json` before locking behavior; record drift as a blocker.

#### Auth, CORS, and connectivity

- Protected business routes require `Authorization: Bearer <API_SECRET_KEY>`. There is no login, logout, or session
  system. Missing or invalid credentials return `403` with
  `{"detail": "Invalid authentication credentials"}`. Public routes are only `GET /health` and FastAPI's generated
  docs/OpenAPI routes.
- Default allowed browser origins are the local Vite origins. Deployed frontends must set backend `CORS_ORIGINS` to a
  JSON array of exact origins (scheme, hostname, and port; no path or trailing slash). CORS does not replace
  authentication.
- Cross-origin browser requests may send `Authorization` and `Content-Type`. Credentialed CORS (cookies) is disabled.
  Frontend code must not send `OPTIONS` manually. `Content-Disposition` is exposed so backup filenames are readable
  from JavaScript when the exact frontend origin is allowed.
- A same-origin reverse proxy remains an optional alternative to cross-origin CORS. Whichever arrangement is selected
  must be documented and verified for preflight (when applicable) and authenticated backup filename access.

#### Errors, diagnostics, and correlation

- Explicit API errors use string `detail` (`ErrorDetail`). FastAPI validation uses a `detail` array
  (`HTTPValidationError`). Preserve HTTP status and safe server `detail` in the UI error model; never forward raw
  request headers, tokens, or full bodies to diagnostics.
- Documented statuses that recovery paths must remain consistent for include `403`, `404`, `409`, both `422` shapes,
  backup generation `500`, lookup `502` / `504`, network/timeout/invalid JSON, and unexpected `5xx`. Handle `204` and
  backup `application/sql` success without treating them as JSON errors.
- Neither OpenAPI nor `API-for-FE.md` currently documents a request/correlation ID header or body field. Do not invent
  one. If a representative backend later supplies a safe ID (header or body), include it in user-visible error details
  and diagnostics; until then, omit it without failing diagnostics.

#### No realtime, full result sets, and backup privacy

- There are no WebSocket, SSE, subscription, or push endpoints. Document that multiple open clients do not update
  instantly; refresh remains route-entry, mutation invalidation, explicit refresh, and stale focus/online refetch from
  FEAT-03.
- `GET /books` and `GET /loans` return full result sets with no pagination. Large-library responsiveness checks from
  FEAT-03 remain the baseline; material regressions are release blockers or tracked follow-ups (backend pagination is
  out of MVP scope).
- `GET /backup` is the only streaming response: a finite `application/sql` attachment whose filename pattern is
  `Shade Library - YYYY-mm-dd_HH-MM-SS_Z.sql` (UTC; literal `Z`). Prefer the exposed UTF-8 `filename*` form; use a
  documented fallback when missing/malformed. Always revoke object URLs. Never inspect, log, cache, upload, or send dump
  contents to diagnostics or error reporting.

#### Privacy denylist fields

Fields and materials that must never appear in logs, diagnostics, analytics, or error reports by default:

- Bearer tokens and `Authorization` headers
- Runtime connection state (token presence/value, connection secrets)
- Borrower names
- Book and loan notes
- Reviews
- ISBN drafts from lookup
- SQL backup contents
- Full request and response bodies

Safe allowlisted diagnostic context may include HTTP status, error kind, route/operation name, release identifier, and a
backend-supplied correlation ID when one exists.

## Scope

- Audit every route for semantic landmarks, heading hierarchy, focus order, labels, help text, linked errors, live
  regions, hit targets, reduced motion, and non-color status indicators.
- Make root-boundary and route-level recovery behavior consistent for startup and post-load API failures across the
  documented status families above.
- Add a redacted diagnostic hook interface and optional production error reporting configured only at runtime.
- Include safe correlation/request IDs in user-visible error details and diagnostics only when a representative backend
  actually supplies them; do not fabricate IDs.
- Enforce the privacy denylist above for all diagnostic and reporting paths.
- Finalize supported browser/device documentation and scanner limitations.
- Test representative long titles, authors, borrower names, tags, notes, and reviews.
- Record large-library responsiveness and bundle-size results against FEAT-03 expectations; fix material regressions or
  create explicit release blockers.
- Document no-realtime behavior, accepted browser-token risk, exact-origin backend `CORS_ORIGINS` or same-origin proxy
  requirements, exposed backup `Content-Disposition`, and security-header assumptions owned by the deployment host
  (HTTPS, restrictive CSP compatible with camera use and the configured API origin, and related browser headers).

## Acceptance criteria

- Runtime reporting can be disabled and changing its endpoint/configuration does not require rebuilding.
- Deliberately thrown render and request failures recover without a blank screen or private-data disclosure.
- Diagnostics expose only allowlisted context and safely include a correlation ID only when a backend-supplied value is
  present.
- Documented API failure families (`403`, `404`, `409`, both `422` shapes, backup `500`, lookup `502`/`504`, network /
  unexpected `5xx`) recover through the shared error model without leaking denylisted fields.
- All routes are usable with keyboard only and at 320-pixel, tablet, and desktop widths.
- Current supported evergreen desktop and mobile browsers pass the documented smoke matrix.
- Long content wraps or truncates accessibly without hiding required actions.
- Backup downloads leave no retained object URL or application cache entry, and diagnostics never inspect or report SQL
  contents.
- Production-like documentation states exact-origin `CORS_ORIGINS` (or same-origin proxy), permitted
  `Authorization`/`Content-Type`, readable backup `Content-Disposition`, disabled credentialed CORS, and no-realtime
  refresh expectations.
- Bundle and large-library results are documented against the expectations set in FEAT-03.
- No unresolved high-severity privacy, browser, performance, or operational issue remains untracked.
- `make check` passes.

## Plan coverage

Sections 7.4, 7.8, 7.9, 10, 12, and 13; operational visibility and cross-cutting release-gate requirements.
