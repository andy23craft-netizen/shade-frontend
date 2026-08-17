# FEAT-14 — Continuous integration quality pipeline

## Objective

Run the complete local quality gate reproducibly on pull requests and the default branch, including contract-checked
suites from earlier tickets, without leaking API secrets or private library data through CI logs or artifacts.

## Dependencies

FEAT-13 is complete. Reuse the existing `make check` gate (`yarn check`: lint, type-check, Vitest with V8 coverage
thresholds, Playwright browser journeys and axe checks, production build). Do not reinvent those suites. Packaging the
same commands in CI is this ticket; Podman remains FEAT-15 and versioned release tarballs remain FEAT-16. Do not pull
FEAT-15 through FEAT-21 product or packaging work into FEAT-14.

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
  lint with zero warnings, type-check, unit/integration tests with coverage thresholds, accessibility checks, browser
  journeys, production build) so a clean checkout and CI produce the same successful `dist/`.
- Contract fixtures and typed helpers from FEAT-03 are part of that gate: CI fails when they disagree with the
  checked-in OpenAPI (paths, methods, status families, schemas, enums, nullability, `204` empty body, and backup
  `application/sql` + `Content-Disposition`). `scripts/contractSmoke.test.ts` and `yarn api:check` are the existing
  drift surfaces -- keep them green in CI (fold `api:check` into the gate if it is not already covered by the CI
  command set).
- Browser journeys and accessibility suites from FEAT-13 (`e2e/`, mocked API under `e2e/support/mockApi.ts`) run in CI
  with isolated data. They must not depend on execution order or a shared mutable live library. Responses they assert
  against stay aligned with OpenAPI success/error shapes and `API-for-FE.md` semantics (including both `422` detail
  shapes, lookup `found: false`, dedicated lifecycle endpoints, shelves CRUD status families, and backup generation
  `500`).

#### Secrets, credentials, and CI environment

- Auth is Bearer-only; there is no login/logout/session. The default PR/default-branch pipeline must not require a live
  protected API or a checked-in `API_SECRET_KEY`. Prefer mocks/fixtures that satisfy OpenAPI.
- Playwright's webServer already injects a documented dummy `VITE_API_SECRET_KEY=test-api-token` for browser journeys.
  Production-build steps (and any CI step that runs `vite build` / `make build`) must supply a documented dummy
  `VITE_API_SECRET_KEY` the same way. Assert the repo-root `.env` file is **not** copied into `dist/` (covered today by
  `scripts/productionBuildTokenInspection.test.ts`). Embedded build-time token values in JS bundles are expected; do
  not fail the build solely because a dummy secret appears in compiled assets. CI fails when `.env` itself appears in
  `dist/` or CI-uploaded build artifacts.
- Production packaging intentionally excludes `.env` and any other secrets. FEAT-16 owns the versioned release tarball,
  but the same rule applies: the tarball must never include `.env` or secrets. Deployment is owned by a different
  project; that project places a `.env` file next to the `.DLL` file(s) on production. Do not bake secrets into
  frontend CI artifacts or the release tarball "for convenience."
- If an optional live contract smoke job exists (against a representative API), supply credentials only through the CI
  secret store, never through the repository, workflow defaults, build args, or runtime-config templates committed for
  CI. Prefer public `GET /health` for reachability; use protected routes only when the smoke explicitly needs them.

#### Privacy denylist for logs and retained artifacts

CI stdout/stderr, uploaded artifacts, coverage reports, traces, screenshots, HAR/network dumps, and failure
diagnostics must never retain:

- Bearer tokens and `Authorization` headers
- Runtime connection secrets or token presence/value beyond a safe boolean already used in product UI
- Borrower names, book/loan notes, reviews, and ISBN lookup drafts
- SQL backup contents or database dump files
- Full request/response bodies from protected routes

Failure artifacts may keep redacted status codes, safe `detail` strings, and route/path identifiers needed to debug.
Do not snapshot or upload backup blobs "for debugging." Playwright already writes `playwright-report/` and
`test-results/` (gitignored); retain them only when needed for failure investigation and scrub them against the
denylist before upload.

#### CORS and browser-test hosts

- Default API CORS allows local Vite origins only. Browser-test hosts used in CI must either match an allowed exact
  origin (scheme, hostname, and port; no path or trailing slash) when hitting a real API, or use mocks so CORS is
  irrelevant (current FEAT-13 journeys use mocks). Do not rely on credentialed CORS (cookies); it is disabled.
- When a CI browser job exercises authenticated backup against a real API, verify that `Content-Disposition` remains
  readable under the configured exact origin (or same-origin proxy). Do not invent undocumented response headers.

#### Bundle-size reporting

`docs/baselines/FEAT-03_performance.md` currently records the FEAT-12 re-check (main JS entry **124.98 kB** gzip;
soft-warning budget **120 kB**, hard-failure candidate **150 kB**). Encode those budgets into CI reporting/enforcement,
then **delete** `docs/baselines/FEAT-03_performance.md` -- do not update it with new measurements or CI ownership notes.
Soft-warning exceedance is already accepted for the current product surface; treat further sustained growth of the main
entry (or crossing the hard-failure candidate) as a CI signal, not a silent pass. After deletion, CI (and any remaining
docs that must mention budgets) is the source of truth for those numbers.

## Current baseline

Already in place and should be reused (not rebuilt):

- Local quality gate: `make check` -> `yarn check` runs lint, type-check, `yarn test:coverage` (V8 thresholds:
  statements 87%, branches 80%, functions 92%, lines 87%), `yarn test:e2e`, and `yarn build`. Documented in
  `docs/baselines/FEAT-13_testing.md`.
- Playwright: `playwright.config.ts` (Chromium; CI retries/workers; webServer with dummy `VITE_API_SECRET_KEY`),
  `e2e/{accessibility,book.creation,dashboard.smoke,library.lifecycle}.spec.ts`, and
  `e2e/support/{mockApi,accessibility}.ts`.
- Contract smoke: `scripts/contractSmoke.test.ts` (part of Vitest) and `yarn api:check` (not yet a separate CI step).
- Production build token inspection: `scripts/productionBuildTokenInspection.test.ts`.
- Pinned toolchain: Node 26.7.0 (`.nvmrc` / `package.json` `engines`), Yarn 4.18.0 (`packageManager`), Corepack.
- No `.github/workflows/` yet in this repository. Sibling `shade-backend` has `.github/workflows/check.yml` (immutable
  install + `make check` pattern) and `ci/` build scripts -- adapt layout, pinning, caching, and privacy-safe
  diagnostics to Yarn/`make check` rather than copying wholesale.
- Bundle-size baselines and suggested budgets live temporarily in `docs/baselines/FEAT-03_performance.md`; this ticket
  moves reporting/enforcement into CI and deletes that baseline file (do not update it).
- README documents local `make check` / `make build` but does not yet document required branch checks or CI.

## Remaining scope

- Add pull-request and default-branch CI with immutable Yarn installation (`yarn install --immutable`).
- Follow patterns in the sibling `shade-backend` GitHub Actions workflow and `ci/` scripts where they fit this
  frontend, adapted to Yarn/`make check`.
- Run the existing local gate in CI: lint, type-check, unit/integration tests (including OpenAPI/fixture contract
  checks), coverage thresholds, accessibility checks, browser journeys, and production build.
- Cache dependencies/build inputs without weakening lockfile semantics.
- Use the repository-pinned Node 26.7.0 and Yarn 4.18.0 versions.
- Keep `make check` as the single local quality gate and make CI invoke the same underlying commands.
- Make the README, Make targets, package scripts, and CI use consistent command names; document required branch checks
  and whether any live-API smoke job is optional vs required.
- Record production build size in CI and report material regressions against the FEAT-03 / FEAT-12 baseline budgets
  (soft-warning **120 kB** gzip / hard-failure candidate **150 kB** gzip for the main JS entry; current accepted size
  **124.98 kB** gzip).
- Delete `docs/baselines/FEAT-03_performance.md` once those budgets are encoded in CI; do not update that file.
- Retain test and build diagnostics needed to investigate failures without publishing credentials or private library
  data (see denylist above).
- Do not invent a production release tarball here: package only what CI needs for verification; FEAT-16 owns the
  versioned tarball Make target and checksum/manifest. CI-produced `dist/` (and any CI-uploaded build artifact) must
  never include the repo-root `.env` file or other secrets. The future release tarball follows the same rule:
  deployment is a different project that places `.env` next to the `.DLL` file(s) on production.

## Acceptance criteria

- A clean checkout runs the complete documented pipeline with pinned prerequisites and an unchanged lockfile.
- CI fails on lockfile drift, lint warnings, type errors, tests, coverage-threshold regressions, OpenAPI/fixture
  contract drift, accessibility/browser regressions, `.env` or other secrets packaged into `dist/` or CI build
  artifacts, or build failure.
- CI and `make check` execute equivalent required checks and produce the same successful production build.
- Dependency caching cannot bypass immutable installation or alter lockfile semantics.
- Browser tests use isolated data and do not depend on execution order or a shared mutable backend library.
- The default required pipeline does not need a live Bearer secret; any optional live smoke stores credentials only in
  CI secrets and never logs them.
- CI output and retained artifacts contain no token, Authorization header, borrower/notes/review/ISBN-draft content,
  SQL backup body, or full protected request/response payloads.
- Required branch checks are documented, including any contract-smoke or live-API job status (required vs optional).
- Production build size is recorded in CI and material regressions against the encoded FEAT-03 / FEAT-12 budgets are
  reported; `docs/baselines/FEAT-03_performance.md` is deleted (not updated).
- Documentation states that production packaging excludes `.env`/secrets and that a separate deployment project places
  `.env` next to the `.DLL` file(s) on production.
- `make check` passes from a clean checkout.

## Plan coverage

The CI portion of Workstream 12; automated portions of the production quality and integration gates that belong in the
reproducible pipeline (immutable install, `make check` equivalence, contract fixture agreement, privacy-safe
diagnostics, bundle-size reporting with deletion of `docs/baselines/FEAT-03_performance.md`).
