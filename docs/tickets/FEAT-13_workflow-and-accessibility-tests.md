# FEAT-13 — Workflow and accessibility tests

## Objective

Prove critical user journeys, accessibility, cache behavior, and error recovery against the documented backend
contract before packaging.

## Dependencies

FEAT-01 through FEAT-12 and CHORE-01 (shelves catalog CRUD) are complete. Reuse existing typed helpers, page tests,
redaction seams, shelves coverage, and the FEAT-06 / FEAT-12 manual matrices. Do not invent undocumented routes,
realtime channels, or lifecycle shortcuts through generic `PATCH`. Browser journey automation and coverage thresholds
are this ticket; packaging those checks in CI remains FEAT-14. Do not pull FEAT-14 CI packaging, FEAT-15 Podman,
FEAT-16 release artifacts, or FEAT-17 through FEAT-21 product work into FEAT-13. Wishlist and dashboard-report paths
exist in OpenAPI but have no product UI yet -- do not add journeys or product mocks for them until FEAT-19 / FEAT-20.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for every documented path, method, status code, request/
  response schema, and the only declared response header (`Content-Disposition` on `GET /backup`). Prefer fixtures and
  mocks checked against this file rather than inventing status families.
- `../technical-reference/API-for-FE.md` -- behavioral guidance OpenAPI does not fully express (auth/CORS, string vs
  array `422` detail, soft-delete visibility, independent loan/reading/delete axes, ISBN `found: false`, backup blob
  download, pagination `skip`/`take` rules, checkout `412` `display_only`, shelves catalog / `shelf_name` membership,
  and FE vs API ownership).

Reuse existing typed helpers, builders, and mocks as the single fake-API surface for unit/integration tests. Browser
journeys may use those mocks or a representative API; either way, responses must match OpenAPI success/error shapes and
`API-for-FE.md` semantics. Extend the existing Playwright `e2e/` mock surface rather than inventing a second stack.

Confirm mocks and fixtures against a representative running backend `/openapi.json` before locking the suite; record
drift as a blocker.

### Documented contract facts for this ticket

#### Route and response matrix (mocks / journeys must cover these MVP paths)

| Method | Path | Success | Documented errors |
| ------ | ---- | ------- | ----------------- |
| `GET` | `/health` | `200` JSON | (public; no auth error) |
| `GET` | `/books` | `200` `BookList` | `400`, `403`, `422` |
| `POST` | `/books` | `201` `BookRead` | `403`, `422` |
| `GET` | `/books/lookup` | `200` `BookLookupResponse` | `403`, `422`, `502`, `504` |
| `GET` | `/books/{id}` | `200` `BookRead` | `403`, `404`, `422` |
| `PATCH` | `/books/{id}` | `200` `BookRead` | `403`, `404`, `422` |
| `DELETE` | `/books/{id}` | `204` empty body | `403`, `404`, `422` |
| `POST` | `/books/{id}/restore` | `200` `BookRead` | `403`, `404`, `409`, `422` |
| `POST` | `/books/{id}/checkout` | `200` `BookRead` | `403`, `404`, `409`, `412`, `422` |
| `POST` | `/books/{id}/checkin` | `200` `BookRead` | `403`, `404`, `409`, `422` |
| `POST` | `/books/{id}/mark-read` | `200` `BookRead` | `403`, `404`, `422` |
| `GET` | `/loans` | `200` `LoanList` | `400`, `403` |
| `GET` | `/loans/{id}` | `200` `LoanRead` | `400`, `403`, `404` |
| `GET` | `/dashboard` | `200` `DashboardSummary` | `403` |
| `GET` | `/shelves` | `200` `ShelfRead[]` (plain array) | `403` |
| `POST` | `/shelves` | `201` `ShelfRead` | `400`, `403`, `409`, `422` |
| `PATCH` | `/shelves/{shelf_id}` | `200` `ShelfRead` | `400`, `403`, `404`, `409`, `422` |
| `DELETE` | `/shelves/{shelf_id}` | `204` empty body | `400`, `403`, `404`, `409` |
| `GET` | `/backup` | `200` `application/sql` + `Content-Disposition` | `403`, `500` |

Non-JSON successes that mocks and assertions must not treat as JSON parse failures: `DELETE` `204` (books and shelves),
and backup `application/sql` blob. Backup generation failure is JSON `500` with
`{"detail": "Failed to generate database backup"}` -- never a binary success.

`GET /books` and `GET /loans` support optional paired `skip`/`take` pagination. When those params are omitted, the API
returns the full matching `{ items, total }` set. Partial, negative, or non-positive pagination params are `400`.
Collection browse and loan history use paginated infinite scroll; some other callers still fetch unpaginated lists.
`include_deleted=true` includes soft-deleted books in `total`. Soft-deleted books are excluded from `GET /dashboard`.
`GET /shelves` is **not** a paginated envelope -- it returns a plain `ShelfRead[]` array (no `skip`/`take`).

Do not require wishlist or dashboard-report journey coverage in this ticket.

#### Error and recovery families tests must represent

- `403` -- missing/invalid Bearer (`{"detail": "Invalid authentication credentials"}`); show page-level error without
  retry or destructive cache clearing.
- `404` -- missing book, soft-deleted target on checkout / check-in / mark-read, second delete (`Book already deleted`),
  missing restore/delete target (`Book not found`), unknown loan for `GET /loans/{id}`, or unknown shelf for
  `PATCH` / `DELETE /shelves/{shelf_id}`. Soft-deleted rows remain readable via `GET /books/{id}` (expect
  `shelf_name: "removed"`) and may still appear in `GET /loans` history.
- `409` -- restore when already active (`Book is not deleted`); checkout when already on loan or active loan exists
  (`Book is already checked out`); check-in when no active loan (`Book is not checked out`); duplicate shelf
  `common_name` on create/rename; delete shelf while books remain. Cover both underlying checkout causes even though
  the detail string is shared.
- `412` -- checkout when `status=display_only` (`{"detail": "Book is display only"}`); no loan is created. Existing
  product UI refetches and surfaces the message; alternate-copy offers remain FEAT-21.
- `422` -- FastAPI `detail[]` field validation **and** string `detail` (explicit invalid ISBN lookup); null/blank
  `shelf_name` on book create/update; null/blank shelf `common_name` on shelf create/update. Mark-read omitted body
  is `422` (client helpers default to `{}`).
- `400` -- malformed loan GUID / `book_id`, empty/whitespace book filters, invalid `skip`/`take` pairs on list
  endpoints, malformed or empty `shelf_id`, unknown `shelf_name` on book create/update, `shelf_name` that normalizes to
  `removed` on book create/update, or create/rename/delete of system shelves `unknown` / `removed` (and rename to
  those names).
- `500` -- backup dump failure; unexpected/unhandled cases (e.g., borrowing-statistics failure from malformed stored
  loan timestamps on dashboard) remain retryable and never invent substitute metrics.
- `502` / `504` -- ISBN metadata provider failure / timeout on lookup.
- Network, timeout, invalid JSON, aborted/stale responses, and offline/retry paths from existing API / hardening tests.

#### Behavioral cases that product mocks and journeys must exercise

- Auth is Bearer-only; there is no login/logout/session. Public `GET /health` vs protected business routes.
- Lookup `found: false` / `draft: null` is a successful `200` manual-entry path, not an error.
- Prefer dedicated lifecycle endpoints in journeys: checkout, check-in, mark-read, restore, lookup. Do not assert that
  generic `PATCH` creates loans, completes returns, performs initial mark-read, or restores soft-deleted books.
- Loan and reading axes are independent of soft-delete. Deleting an on-loan book leaves the active loan open until
  restore + check-in (UI already blocks that delete; tests still cover the stale/API `404` paths).
- Mark-read requires a body (at least `{}`); check-in body is optional. Temporal strings on the wire are plain strings;
  client serialization in journeys must still use `YYYY-MM-DD` and UTC ISO 8601 where forms collect those values.
- Backup: authenticated blob only; UTF-8 `filename*=UTF-8''...` preferred; documented fallback when missing/malformed;
  object-URL revoke; no download after failed responses; never parse, log, cache, snapshot, or upload SQL contents.
  Production-like preflight/`Content-Disposition` exposure assumes exact-origin `CORS_ORIGINS` (credentialed CORS
  disabled).
- Dashboard null averages display "Not enough data"; all-zero summary is valid data; `checked_out` and
  `borrowing.active_loans` stay distinct; `recent_window_days` comes from the API response.
- Shelves: book forms load `GET /shelves` and submit `common_name` as `shelf_name`; `/shelves` owns catalog
  create/edit/delete with system-shelf protection (`unknown` / `removed`). Soft-delete moves membership to `removed`;
  restore moves membership to `unknown` (prior shelf is not restored). Add/Edit Book block the page when shelves fail
  to load.

## Current baseline

Already in place and should be reused (not rebuilt):

- Broad Vitest / Testing Library unit and route coverage under `src/**` and `scripts/` for shipped product features:
  typed route helpers (including pagination, ISBN / author / title / category filters, `sortBy=shelf`, shelves CRUD,
  checkout `412`, lookup `found: false`, mark-read `{}`, omitted check-in body, restore/checkout/check-in `409`,
  backup filename parsing, `204`, and large-library timing), React Query invalidation / stale guards, connection /
  auth recovery, form models, scanner helpers, and feature pages (collection infinite scroll, detail gating,
  create/edit/delete/restore, shelves catalog, checkout ISBN Find, check-in, loans, mark-read / reading edit,
  dashboard, backup).
- Shared test helpers: `src/test/renderAppTree.tsx`, `createTestRouter`, and colocated `*.test.ts(x)` files. Prefer
  extending that surface rather than inventing a parallel fake-API stack.
- Playwright scaffolding (extend, do not replace): `playwright.config.ts`, `e2e/dashboard.smoke.spec.ts`,
  `e2e/support/mockApi.ts`, `e2e/support/accessibility.ts` (`@axe-core/playwright`), and `yarn test:e2e`. Not yet
  part of `make check`.
- OpenAPI path/type smoke: `scripts/contractSmoke.test.ts` (includes `/shelves` and `/shelves/{shelf_id}`) plus
  `yarn api:check`.
- Production build token inspection: `scripts/productionBuildTokenInspection.test.ts`.
- Manual scanner/device matrix: `docs/baselines/FEAT-06_scanner-support.md`.
- Manual evergreen browser smoke (including keyboard, 320px / tablet / desktop, long content, reduced motion) with
  explicit pending/blocked rows: `docs/baselines/FEAT-12_browser-support.md`.
- Local quality gate: `make check` runs lint, type-check, Vitest, and production build. It does not yet run automated
  accessibility or browser-journey suites.

## Remaining scope

- Fill any remaining mock / fixture gaps so journeys and integration tests can represent every MVP route and status
  family in the matrix above (including `412`, shelves CRUD, `GET /loans/{id}`, paired `skip`/`take`, and non-JSON
  `204` / SQL success shapes) without inventing wishlist or report product coverage.
- Add automated accessibility checks for routes, forms, dialogs, notifications, and destructive confirmations
  (including `/shelves` and Add/Edit Book shelf pickers).
- Add isolated browser-level journeys for `.env` token setup, manual add (including shelf selection from
  `GET /shelves`), ISBN lookup/edit (including unknown ISBN → manual entry), checkout/check-in via dedicated
  endpoints (including display-only `412` recovery), mark-read / reading edit, delete/restore, shelves create/edit/
  delete (system-shelf protection and non-empty delete `409`), authenticated SQL backup (success and generation
  `500`), loans, collection/detail, and updated dashboard values after mutations.
- Exercise direct navigation/refresh with an SPA fallback in the browser-test host (include `/shelves`).
- Reuse FEAT-06 / FEAT-12 manual matrices for scanner and evergreen smoke; extend them only where automation still
  cannot cover a release-critical path, with owner, rationale, and explicit gate status.
- Establish meaningful unit/integration and browser coverage thresholds that fail on regression.
- Keep `make check` as the single local quality gate and include all non-manual suites it requires (so FEAT-14 can
  invoke the same commands), folding in `yarn test:e2e` (or equivalent) once journeys/a11y are ready.

## Acceptance criteria

- Tests assert user outcomes and accessibility rather than internal implementation details.
- No critical journey depends on test ordering or shared mutable backend records.
- Browser journeys cover every MVP outcome and every dedicated lifecycle endpoint (lookup, checkout, check-in,
  mark-read, restore, delete, backup) plus shelves catalog CRUD, env verification, collection/detail, loans, and
  dashboard.
- Mocks and fixtures cover the full MVP OpenAPI route/status matrix above; non-JSON successes (`204`, SQL blob) are
  never JSON-parsed as errors.
- Network, authentication (`403`), validation (both `422` shapes), conflict (`409` with documented detail strings),
  checkout `412` display-only, lookup (`found: false`, `502`, `504`), empty-data, soft-delete/`404`, pagination
  edge cases, and stale-resource recovery are represented.
- Backup coverage verifies a non-empty SQL attachment, UTF-8 and fallback filename handling, object-URL cleanup,
  generation `500` with detail `Failed to generate database backup`, and no download after failure. It includes
  missing/malformed filenames, interrupted download, production-like preflight/header exposure, and a safe fallback
  filename.
- Tests never parse, log, cache, snapshot, upload, or otherwise expose SQL backup contents, tokens, borrower names,
  notes, reviews, or ISBN drafts.
- Journeys never drive loan state, initial mark-read, or restore through generic `PATCH`.
- Scanner behavior that cannot be automated remains covered by the FEAT-06 manual device matrix (or an explicit
  extension with owner and gate status).
- Automated accessibility checks and browser journeys are part of `make check` (or documented equivalent local gate
  commands that FEAT-14 will mirror).
- Coverage thresholds fail the gate on regression.
- The full suite passes from a clean immutable dependency install.
- Any quarantined or manual-only release check has an owner, rationale, and explicit gate status.
- `make check` passes.

## Plan coverage

Workstream 11; product, quality, and integration gates; all cross-cutting edge cases in section 10.
