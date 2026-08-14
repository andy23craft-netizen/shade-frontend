# FEAT-14 — Continuous integration quality pipeline

## Objective

Run the complete local quality gate reproducibly on pull requests and the default branch, including contract-checked
suites from earlier tickets, without leaking API secrets or private library data through CI logs or artifacts.

## Dependencies

FEAT-13.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for paths, methods, status codes, and request/response schemas
  that FEAT-03 fixtures and FEAT-13 mocks assert against. Prefer CI failure when checked-in fixtures or generated types
  drift from this file rather than inventing a second contract source.
- `../technical-reference/API-for-FE.md` -- behavioral guidance OpenAPI does not fully express (Bearer-only auth, CORS
  exact-origin rules, privacy-sensitive payload fields, backup blob handling, and FE vs API ownership). Use it to shape
  what CI may log, cache, snapshot, or retain.

CI does not redefine the backend contract. It runs the same quality gate and suites that already encode that contract
(FEAT-03 transport/fixtures, FEAT-12 redaction, FEAT-13 journeys). Confirm fixture/OpenAPI agreement against a
representative running backend `/openapi.json` when locking or changing the gate; record drift as a blocker.

### Documented contract facts for this ticket

#### What the gate must keep equivalent

- `make check` remains the single local quality gate. CI invokes the same underlying commands (immutable Yarn install,
  lint with zero warnings, type-check, unit/integration tests, accessibility checks, browser journeys, production
  build) so a clean checkout and CI produce the same successful `dist/`.
- Contract fixtures and typed helpers from FEAT-03 are part of that gate: CI fails when they disagree with the
  checked-in OpenAPI (paths, methods, status families, schemas, enums, nullability, `204` empty body, and backup
  `application/sql` + `Content-Disposition`).
- Browser journeys and accessibility suites from FEAT-13 run in CI with isolated data. They must not depend on
  execution order or a shared mutable live library. Responses they assert against stay aligned with OpenAPI success/
  error shapes and `API-for-FE.md` semantics (including both `422` detail shapes, lookup `found: false`, dedicated
  lifecycle endpoints, and backup generation `500`).

#### Secrets, credentials, and CI environment

- Auth is Bearer-only; there is no login/logout/session. The default PR/default-branch pipeline must not require a live
  protected API or a checked-in `API_SECRET_KEY`. Prefer mocks/fixtures that satisfy OpenAPI.
- If an optional live contract smoke job exists (against a representative API), supply credentials only through the CI
  secret store, never through the repository, workflow defaults, build args, or runtime-config templates committed for
  CI. Prefer public `GET /health` for reachability; use protected routes only when the smoke explicitly needs them.
- Production-build inspection (updated for FEAT-05 `.env` auth): CI supplies a documented dummy `VITE_API_SECRET_KEY` for
  any step that runs `vite build`. Assert the repo-root `.env` file is **not** copied into `dist/` or packaged into the
  production release tarball. Embedded build-time token values in JS bundles are expected after FEAT-05; do not fail the
  build solely because a dummy secret appears in compiled assets. CI fails when `.env` itself appears in `dist/` or
  release artifacts.

#### Privacy denylist for logs and retained artifacts

CI stdout/stderr, uploaded artifacts, coverage reports, traces, screenshots, HAR/network dumps, and failure
diagnostics must never retain:

- Bearer tokens and `Authorization` headers
- Runtime connection secrets or token presence/value beyond a safe boolean already used in product UI
- Borrower names, book/loan notes, reviews, and ISBN lookup drafts
- SQL backup contents or database dump files
- Full request/response bodies from protected routes

Failure artifacts may keep redacted status codes, safe `detail` strings, and route/path identifiers needed to debug.
Do not snapshot or upload backup blobs "for debugging."

#### CORS and browser-test hosts

- Default API CORS allows local Vite origins only. Browser-test hosts used in CI must either match an allowed exact
  origin (scheme, hostname, and port; no path or trailing slash) when hitting a real API, or use mocks so CORS is
  irrelevant. Do not rely on credentialed CORS (cookies); it is disabled.
- When a CI browser job exercises authenticated backup against a real API, verify that `Content-Disposition` remains
  readable under the configured exact origin (or same-origin proxy). Do not invent undocumented response headers.

## Scope

- Add pull-request and default-branch CI with immutable Yarn installation.
- Run lint, type-check, unit/integration tests (including OpenAPI/fixture contract checks), production build,
  accessibility checks, and browser journeys from FEAT-13.
- Cache dependencies/build inputs without weakening lockfile semantics.
- Use the repository-pinned Node 26.7.0 and Yarn 4.18.0 versions.
- Keep `make check` as the single local quality gate and make CI invoke the same underlying commands.
- Make the README, Make targets, package scripts, and CI use consistent command names.
- Record production build size and report material regressions against the budget established in FEAT-03.
- Retain test and build diagnostics needed to investigate failures without publishing credentials or private library
  data (see denylist above).
- Package production release artifacts from `dist/` and deployable static assets only; **never** include the repo-root
  `.env` file in the production tarball (FEAT-16).
- Document required branch checks and whether any live-API smoke job is optional vs required.

## Acceptance criteria

- A clean checkout runs the complete documented pipeline with pinned prerequisites and an unchanged lockfile.
- CI fails on lockfile drift, lint warnings, type errors, tests, OpenAPI/fixture contract drift, accessibility/browser
  regressions, `.env` packaged into `dist/` or the production tarball, or build failure.
- CI and `make check` execute equivalent required checks and produce the same successful production build.
- Dependency caching cannot bypass immutable installation or alter lockfile semantics.
- Browser tests use isolated data and do not depend on execution order or a shared mutable backend library.
- The default required pipeline does not need a live Bearer secret; any optional live smoke stores credentials only in
  CI secrets and never logs them.
- CI output and retained artifacts contain no token, Authorization header, borrower/notes/review/ISBN-draft content,
  SQL backup body, or full protected request/response payloads.
- Required branch checks are documented, including any contract-smoke or live-API job status (required vs optional).
- `make check` passes from a clean checkout.

## Plan coverage

The CI portion of Workstream 12; automated portions of the production quality and integration gates that belong in the
reproducible pipeline (immutable install, `make check` equivalence, contract fixture agreement, privacy-safe
diagnostics).
