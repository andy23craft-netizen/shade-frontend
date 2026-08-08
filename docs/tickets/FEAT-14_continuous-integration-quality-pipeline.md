# FEAT-14 — Continuous integration quality pipeline

## Objective

Run the complete local quality gate reproducibly on pull requests and the default branch.

## Dependencies

FEAT-13.

## Scope

- Add pull-request and default-branch CI with immutable Yarn installation.
- Run lint, type-check, unit/integration tests, production build, accessibility checks, and browser journeys.
- Cache dependencies/build inputs without weakening lockfile semantics.
- Use the repository-pinned Node 26.7.0 and Yarn 4.1.0 versions.
- Keep `make check` as the single local quality gate and make CI invoke the same underlying commands.
- Make the README, Make targets, package scripts, and CI use consistent command names.
- Record production build size and report material regressions against the budget established in FEAT-03.
- Retain test and build diagnostics needed to investigate failures without publishing credentials or private test data.

## Acceptance criteria

- A clean checkout runs the complete documented pipeline with pinned prerequisites and an unchanged lockfile.
- CI fails on lockfile drift, lint warnings, type errors, tests, accessibility/browser regressions, or build failure.
- CI and `make check` execute equivalent required checks and produce the same successful production build.
- Dependency caching cannot bypass immutable installation or alter lockfile semantics.
- Browser tests use isolated data and do not depend on execution order.
- CI output and retained artifacts contain no token or private application data.
- Required branch checks are documented.
- `make check` passes from a clean checkout.

## Plan coverage

The CI portion of Workstream 12 and the automated portions of the production quality gate.
