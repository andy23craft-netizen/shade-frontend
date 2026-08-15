# FEAT-12 — Operational and browser hardening

## Objective

Harden the completed product for supported browsers and safe production diagnosis before full release testing.

## Dependencies

FEAT-11 is complete (ticket file removed). Reuse FEAT-02 / FEAT-03 / FEAT-05 connection, error-model, and redaction
seams. Do not invent a second diagnostic transport or assume undocumented backend headers, cookies, or push channels.
Browser journey automation and coverage thresholds remain FEAT-13; CI packaging of those checks remains FEAT-14;
deployment-owned HTTPS/CSP rollout remains FEAT-16. Do not pull those into FEAT-12.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for documented paths, status codes, `ErrorDetail` /
  `HTTPValidationError` shapes, and the only response headers OpenAPI declares (`Content-Disposition` on
  `GET /backup`).
- `../technical-reference/API-for-FE.md` -- behavioral guidance OpenAPI does not fully express (Bearer-only auth with
  no session, exact-origin CORS, error-status meanings, no realtime/pagination, backup blob download, and privacy-
  sensitive payload fields).

Confirm against a representative running backend `/openapi.json` before locking behavior; record drift as a blocker.

### Documented contract facts still relevant

- Cross-origin browser requests may send `Authorization` and `Content-Type`. Credentialed CORS (cookies) is disabled.
  Frontend code must not send `OPTIONS` manually. `Content-Disposition` is exposed so backup filenames are readable
  when the exact frontend origin is in backend `CORS_ORIGINS`. A same-origin reverse proxy remains an optional
  alternative.
- Explicit API errors use string `detail`; FastAPI validation uses a `detail` array. Preserve HTTP status and safe
  server `detail` in the UI error model; never forward raw request headers, tokens, or full bodies to diagnostics.
- Neither OpenAPI nor `API-for-FE.md` documents a request/correlation ID. Do not invent one. Include a backend-
  supplied ID in user-visible errors and diagnostics only when a representative backend actually provides one.
- There is no realtime API. Refresh remains route-entry, mutation invalidation, explicit refresh, and stale
  focus/online refetch from FEAT-03.
- `GET /backup` is a finite `application/sql` attachment. Prefer exposed UTF-8 `filename*`; use the documented
  fallback when missing/malformed. Always revoke object URLs. Never inspect, log, cache, upload, or send dump
  contents to diagnostics.

#### Privacy denylist (still required for any new reporting path)

Never appear in logs, diagnostics, analytics, or error reports by default: Bearer tokens / `Authorization` headers,
runtime connection secrets, borrower names, book and loan notes, reviews, ISBN drafts, SQL backup contents, and full
request/response bodies. Safe allowlisted context may include HTTP status, error kind, route/operation name, release
identifier, and a backend-supplied correlation ID when one exists.

## Current baseline

Already in place and should be reused (not rebuilt):

- Shared `ApiError` / `formatApiQueryError` / `QueryErrorState` recovery for `403`, `404`, `409`, both `422` shapes,
  backup generation `500`, lookup `502` / `504`, network / timeout / invalid JSON, unexpected `5xx`, empty `204`, and
  backup `application/sql` success.
- `apiRedaction.ts` (`toSafeApiErrorDiagnostic`, `serializeSafeApiErrorDiagnostic`, `assertSafeApiDiagnostic`) with
  colocated denylist tests. `correlationId` stays unset until the backend documents a safe source.
- `RootErrorBoundary` recoverable fallback (retry / return home) without a blank screen. It does not yet report through
  a redacted diagnostic hook.
- Authenticated backup download via `backupApi.get` / `BackupLibraryPage` with programmatic `<a download>` and
  `URL.revokeObjectURL` on success and failure paths; UI tests assert no download after `403` / generation `500` /
  network failure.
- Production connectivity notes in `README.md` and `docs/MAINTAINERS.md` (exact-origin `CORS_ORIGINS` or same-origin
  proxy; permitted `Authorization` / `Content-Type`; readable backup `Content-Disposition`; disabled credentialed
  CORS). Accepted build-time token risk and no-realtime refresh expectations are documented in AGENTS / MAINTAINERS /
  README. CSP and related host security-header assumptions are not yet finalized here.
- Scanner browser / device matrix and manual checklist: `docs/baselines/FEAT-06_scanner-support.md`. Broader evergreen
  product smoke matrix is still outstanding.
- Large-library and bundle-size expectations: `docs/baselines/FEAT-03_performance.md` (including
  `booksApi.largeLibrary.test.ts`). FEAT-12 has not yet re-recorded comparable results against that baseline.
- Feature routes already follow shared landmarks, heading focus, Field-linked errors, live regions, and reduced-motion
  conventions from earlier tickets. A deliberate cross-route hardening audit and long-content checks are still open.

## Remaining scope

- Add a redacted diagnostic hook interface and optional production error reporting configured only at runtime (for
  example via `public/config.js` / `RuntimeConfig`) so reporting can be disabled or retargeted without rebuilding.
  Wire root-boundary and request-failure recovery through it using the existing redaction helpers; enforce the privacy
  denylist on every path.
- Include safe correlation/request IDs in user-visible error details and diagnostics only when a representative backend
  actually supplies them; do not fabricate IDs.
- Audit every route for semantic landmarks, heading hierarchy, focus order, labels, help text, linked errors, live
  regions, hit targets, reduced motion, and non-color status indicators. Fix gaps found by the audit.
- Test representative long titles, authors, borrower names, tags, notes, and reviews so content wraps or truncates
  accessibly without hiding required actions.
- Finalize supported evergreen desktop and mobile browser/device documentation (beyond the FEAT-06 scanner matrix) and
  record smoke results or explicit blockers.
- Re-run large-library responsiveness and production bundle-size checks against `docs/baselines/FEAT-03_performance.md`;
  fix material regressions or create explicit tracked release blockers, and update the baseline document when the
  numbers move for a known reason.
- Document deployment-host security-header assumptions owned outside this repo (HTTPS, restrictive CSP compatible with
  camera use and the configured API origin, and related browser headers), alongside the existing CORS / proxy /
  no-realtime / token-risk notes.

## Acceptance criteria

- Runtime reporting can be disabled and changing its endpoint/configuration does not require rebuilding.
- Deliberately thrown render and request failures recover without a blank screen or private-data disclosure.
- Diagnostics expose only allowlisted context and safely include a correlation ID only when a backend-supplied value is
  present.
- All routes are usable with keyboard only and at 320-pixel, tablet, and desktop widths after the audit fixes.
- Current supported evergreen desktop and mobile browsers pass the documented smoke matrix (or blockers are explicit).
- Long content wraps or truncates accessibly without hiding required actions.
- Bundle and large-library results are documented against the expectations set in FEAT-03.
- Production-facing docs state exact-origin `CORS_ORIGINS` (or same-origin proxy), permitted
  `Authorization`/`Content-Type`, readable backup `Content-Disposition`, disabled credentialed CORS, no-realtime
  refresh expectations, accepted browser-token risk, and host-owned HTTPS/CSP/security-header assumptions.
- No unresolved high-severity privacy, browser, performance, or operational issue remains untracked.
- `make check` passes.

## Plan coverage

Sections 7.4, 7.8, 7.9, 10, 12, and 13; operational visibility and cross-cutting release-gate requirements.
