# FEAT-13 Testing and Release-Confidence Baseline

## Automated quality gate

The canonical automated verification command is:

```bash
make check
````

The gate runs:

1. ESLint
2. TypeScript type checking
3. Vitest with V8 coverage
4. Playwright browser tests
5. Production build

All automated checks must pass before release.

## Unit and integration tests

Vitest covers API behavior, query behavior, route/component behavior,
validation, stale-state recovery, lifecycle conflicts, connection handling,
backup behavior, ISBN lookup, scanner parsing, diagnostics, and other
application logic.

Current verified suite:

* 69 test files
* 657 tests
* all passing

## Coverage regression gate

V8 coverage is enforced with the following global minimums:

* Statements: 87%
* Branches: 80%
* Functions: 92%
* Lines: 87%

The thresholds are intended as regression floors rather than aspirational
coverage targets. New functionality should include meaningful tests and
must not cause the repository to fall below these thresholds.

Baseline at FEAT-13 completion:

* Statements: 87.70%
* Branches: 81.29%
* Functions: 92.77%
* Lines: 87.65%

## Browser end-to-end tests

Playwright uses isolated mocked API state and exercises the application
through the real browser UI.

The browser suite verifies:

* manual book creation and navigation to the created book
* checkout and check-in lifecycle
* initial mark-read lifecycle
* delete and restore lifecycle
* dedicated lifecycle endpoints rather than generic PATCH transitions
* dashboard rendering with populated data
* dashboard rendering with valid all-zero data
* direct route navigation through the SPA
* automated accessibility checks across critical application routes
* automated accessibility checks for check-in and deleted-book administration

Current verified suite:

* 10 Playwright tests
* all passing in Chromium

## Accessibility

`@axe-core/playwright` checks critical application routes for serious and
critical automated accessibility violations.

Accessibility scans are isolated by route so failures identify the affected
surface and do not depend on one long-running aggregate scan.

Automated accessibility testing supplements rather than replaces keyboard,
responsive-layout, and assistive-technology review.

## Contract and error coverage

Automated tests cover the documented API behavior required by the frontend,
including:

* 403 unauthorized handling
* 404 and stale-state recovery
* 409 lifecycle conflicts
* structured and fallback 422 validation handling
* ISBN lookup `found: false`
* ISBN lookup upstream failure behavior
* backup success and failure behavior
* SQL backup content type and filename handling
* UTF-8 `Content-Disposition` filenames
* object-URL cleanup after backup download
* request timeout behavior
* Bearer-token injection
* production-build token inspection

## Manual verification

Manual verification remains appropriate where automation cannot faithfully
represent the target hardware or browser environment.

Existing baselines remain authoritative:

* `FEAT-06_scanner-support.md` — scanner and device support
* `FEAT-12_browser-support.md` — supported browsers, responsive layout,
  accessibility smoke testing, and browser-specific verification

These manual gates should be repeated when changes materially affect their
respective surfaces.

## Release-confidence rule

A frontend change is release-ready when:

1. `make check` passes.
2. Coverage remains above the enforced regression thresholds.
3. Relevant manual gates have been completed when the change affects a
   manual-only surface.
4. No known critical or serious accessibility regression remains.
5. Any intentionally deferred verification is documented with its rationale.

````

Then:

```bash
git diff --check
git status --short
git diff --stat