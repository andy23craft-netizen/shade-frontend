# FEAT-03 — Typed API and server state

## Objective

Provide one contract-checked, tested API and cache layer for all product features.

## Dependencies

FEAT-02 is complete. Do not rebuild runtime config, connection setup, the shared Bearer client shell, the
connection-invalidation seam, React Query mounting, query-client defaults, or the books query/mutation surface already
in place.

Do not add a second state store, component library, CSS framework, or form library in this ticket. Product feature
workflows belong to later tickets; this ticket finishes the remaining typed-client and server-state gaps they will use.

## Explicitly out of scope (owned by later tickets)

Do not implement or expand FEAT-03 into work already scheduled below. Later tickets reuse this ticket's helpers,
hooks, query keys, and invalidation matrix; they own product UI, forms, journeys, and release hardening.

| Later ticket | Owns (do not pull into FEAT-03) |
| ------------ | ------------------------------- |
| FEAT-04 | Active collection and detail UI, loading/empty/`404`/soft-deleted presentation, date display formatting |
| FEAT-05 | Book form model, create/lookup UI, ISBN checksums, blank-optional conversion, form date serialization, form abort / route-change / duplicate-submit behavior |
| FEAT-06 | Camera/scanner capture and handoff into FEAT-05 |
| FEAT-07 | Checkout UI, borrower/notes collection, checkout timestamp/`due_at` form serialization, conflict UX |
| FEAT-08 | Check-in UI, loan-history UI, return-time form serialization, overdue presentation |
| FEAT-09 | Mark-read / reading-edit UI, review privacy in that workflow |
| FEAT-10 | Edit/delete/restore/backup UI, minimal patch generation, backup download UX and CORS verification |
| FEAT-11 | Dashboard page UI and metric presentation (null averages, distinct `checked_out` vs `active_loans`) |
| FEAT-12 | Production diagnostics/reporting, browser matrix, a11y audit across routes, recording large-library and bundle regressions against FEAT-03 baselines, correlation ID in user-visible diagnostics |
| FEAT-13 | Full route/status mock matrix, browser journeys, accessibility suites, coverage thresholds |
| FEAT-14 | CI pipeline, CI privacy for logs/artifacts, bundle-size regression reporting in CI |
| FEAT-15 | Podman development/preview images |
| FEAT-16 | Versioned release tarballs and deployment handoff |

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for paths, methods, status codes, request/response schemas,
  enums, and nullability (OpenAPI 3.1; LibraryV2). Prefer generating or fixture-checking TypeScript models from this
  file.
- `../technical-reference/API-for-FE.md` -- behavioral guidance OpenAPI does not fully express (auth/CORS notes, error
  meanings, lifecycle rules, ISBN lookup quirks, backup download pattern, FE vs API ownership).

Before locking transport types, compare both with a representative running backend `/openapi.json`. Record drift as a
blocker in the owning system rather than inventing frontend semantics.

API routes are rooted at the configured base URL with no `/api` prefix. Default local base in the API notes is
`http://127.0.0.1:8000`.

## Current baseline

Already in place and should be extended, not replaced:

- OpenAPI generation: `openapi-typescript` plus `yarn api:generate` / `yarn api:check` writing
  `src/api/generated/openapi.ts` from the checked-in OpenAPI document.
- `src/api/apiTypes.ts`: exported aliases for documented schemas (`BookCreate` / `BookUpdate` / `BookRead` / `BookList`,
  lookup types, loan types, dashboard nesting, health/protected, validation/error schemas, and enums). Colocated
  `apiTypes.test.ts` asserts BookRead vs LoanRead audit names, list wrappers, lookup `found: false`, and nullable
  dashboard averages.
- `src/api/enumDisplay.ts`: `enumDisplayValue` for rendering known vs unknown enum strings through a neutral fallback.
- `src/api/apiClient.ts`: `createApiClient` with Bearer injection, path joining at the configured base URL (no `/api`
  prefix), configurable timeout (default 10s), caller cancellation via `AbortSignal`, `get` / `request` /
  `getJson` / `requestJson`, `204` without JSON parse, invalid-JSON `invalid_response` errors, and protected `403`
  handling via `onUnauthorized`.
- `src/api/apiErrors.ts`: `ApiError` kinds `unreachable`, `timeout`, `cancelled`, `unauthorized`, `validation`,
  `invalid_response`, `server`, and `http`; optional `detail`, `correlationId`, and `fieldErrors`;
  `mapValidationFieldErrors` for FastAPI `422 detail[]` locations. Correlation ID is modeled but not yet populated from
  responses.
- Typed route helpers via `createApi` in `src/api/api.ts`:
  - `booksApi`: `list` (optional `includeDeleted` -> `include_deleted`), `create`, `lookup`, `get`, `update`, `remove`,
    `restore`, `checkout`, `checkin` (optional body omitted when undefined), `markRead`
  - `loansApi.list`, `dashboardApi.get`, `healthApi.get` (public), `protectedApi.get`
  - `backupApi.get` returns `{ blob, filename }` for authenticated `/backup`, parsing UTF-8 `Content-Disposition`
    (`filename*=UTF-8''...`) with a `backup.sql` fallback when the header is missing or malformed
- Colocated happy-path tests for those route helpers (`booksApi.test.ts`, `loansApi.test.ts`, `dashboardApi.test.ts`,
  `healthApi.test.ts`, `protectedApi.test.ts`, `backupApi.test.ts`, `api.test.ts`), plus restored `apiClient.test.ts`
  coverage for Bearer injection, public requests, `403`, `404`, `409`, both `422` detail shapes, `5xx` (including
  `500` / `502` / `504`), network failure, timeout, cancellation, invalid JSON, binary backup success, and `204`.
- Connection layer still uses ad hoc `connectionApi` fetches for `GET /health` and `GET /protected`; prefer routing
  those through the typed helpers.
- `ConnectionProvider` exposes `apiClient` and clears the token through `onUnauthorized`;
  `subscribeToConnectionInvalidation` / `notifyConnectionInvalidated` remains the seam for clearing cached protected
  data. `AppProviders` creates a shared `QueryClient` and subscribes
  `subscribeQueryClientToConnectionInvalidation` so forgotten or rejected tokens clear the cache.
- `createQueryClient` configures `staleTime` (30s), `refetchOnWindowFocus`, `refetchOnReconnect`, query retry that never
  retries validation / authentication / cancelled / invalid-response errors, and `mutations.retry: false`.
- React Query surface in `src/api/booksQueries.ts`: `useBooks`, `useBook`, `useBookLookup`, plus mutations
  `useCreateBook`, `useUpdateBook`, `useDeleteBook`, `useRestoreBook`, `useCheckoutBook`, `useCheckinBook`, and
  `useMarkBookRead`. Successful mutations invalidate books lists (including `include_deleted` via the shared
  `['books']` prefix), detail, dashboard, and loans when checkout/check-in succeed. They do not yet write the returned
  `BookRead` into the detail cache. There are no dedicated loans or dashboard query hooks yet.

## Remaining scope

### Transport request safety

Transport schema aliases and generation are done. Finish shared request-side contract safety for typed helpers (not
feature forms -- FEAT-05 / FEAT-07 / FEAT-09 / FEAT-10 own form conversion and field UX):

- Typed helpers and any shared request builders must serialize only documented request properties because backend
  request models silently ignore unknown fields. Do not use `BookRead.updated_date` as a concurrency token because
  generic `PATCH` currently does not update it.
- Keep preserving unknown response fields at runtime (do not strip undeclared JSON keys) and continue rendering future
  enum values through `enumDisplayValue` (or equivalent).
- Optional shared primitives (e.g., date-only `YYYY-MM-DD` or UTC ISO 8601 normalizers) may land here only as reusable
  utilities for later tickets. Do not build create/checkout/check-in/mark-read/edit forms or their blank-optional /
  null-required-field conversion in this ticket.

### Typed route client completion

Route helpers and backup blob metadata exist for every documented business path. Finish the remaining gaps:

- Prefer dedicated lifecycle helpers over reproducing those effects with `PATCH` (already the pattern; keep it).
- Continue modeling books and loans as full `{ items, total }` result sets with no client pagination assumptions.
- Route connection health/protected checks through the typed helpers once that swap can replace `connectionApi` without
  regressing FEAT-02 behavior.
- Extend typed-helper / colocated fixture coverage for the open transport edge cases: lookup `found: false` (success,
  not an `ApiError`), mark-read with `{}`, check-in with omitted body, and restore/checkout/check-in `409` bodies
  (happy-path path wiring and DELETE `204` are already tested). Do not expand this into FEAT-13's full route/status
  mock matrix or browser journeys.

### Error model completion

The `ApiError` shape, `422` field mapping, and client-level status normalization tests exist. Finish safety gaps in the
API/error layer only:

- Populate `correlationId` when the API supplies one. Neither OpenAPI nor `API-for-FE.md` currently documents a
  correlation header or body field; do not invent one. Wire population only when a representative backend supplies a
  safe value. FEAT-12 owns user-visible diagnostics presentation and optional production reporting that consume this
  field.
- Keep lookup `found: false` modeled as a successful `BookLookupResponse` at the transport layer (not an `ApiError`).
  FEAT-05 owns the manual-entry UI path that consumes it.
- Add redaction helpers / assertions on the API/error seam so client logging of `ApiError` and related diagnostics never
  contain request headers, tokens, borrower names, notes, reviews, ISBN drafts, backup contents, or full bodies. FEAT-12
  owns wiring those helpers into production reporting and the cross-route privacy audit. FEAT-07, FEAT-08, and FEAT-09
  keep workflow-specific private fields out of their own logs.

### Server state

- Write returned `BookRead` values into the detail cache on successful mutations, then invalidate affected aggregates
  per `../product-docs/PLAN.md` section 7.5 (lists, detail, loans, and dashboard as applicable). Invalidation already
  matches that matrix; the missing piece is the returned-book cache write. Feature tickets (FEAT-05+) call these
  mutations and present results; they must not invent a parallel invalidation path.
- Add loans and dashboard query hooks (or equivalent shared query-key helpers) so FEAT-08 and FEAT-11 consume the same
  cache keys the mutations already invalidate. Do not implement `/loans` or `/` page UI here.
- Ensure aborted or stale React Query results cannot overwrite newer cached server state for the same query key. Form
  draft / route-local overwrite guards remain FEAT-05+; FEAT-13 exercises abort/stale recovery in journeys.
- Add only the reusable builders/fixtures needed to finish the typed-helper and query-hook tests above. FEAT-13 owns
  complete API mock coverage for every documented route and status family.

### Baselines for later hardening (not FEAT-12 / FEAT-14 work)

- Exercise the no-pagination list helpers with a representative large personal-library fixture and record a practical
  responsiveness baseline. FEAT-12 records regressions against that baseline; FEAT-14 reports bundle-size regressions
  in CI against the budget set here.
- Establish bundle-size expectations for later regression checks. Do not add CI reporting or production diagnostic
  plumbing here.

## Acceptance criteria

- Typed helpers and colocated fixtures cover the open transport edge cases above: lookup `found: false`, mark-read with
  `{}`, check-in with omitted body, and restore/checkout/check-in `409` bodies.
- Connection health/protected checks go through the typed helpers without regressing FEAT-02 connection behavior.
- Returned `BookRead` values are written into the detail cache on successful mutations, and invalidation continues to
  match the mutation matrix in `../product-docs/PLAN.md` section 7.5.
- Loans and dashboard data are readable through shared React Query helpers that use the same keys mutations invalidate.
- Aborted or stale React Query results cannot overwrite newer cached server state for the same query key.
- API/error-layer logs and redaction helpers never retain request headers, tokens, borrower names, notes, reviews, ISBN
  drafts, backup contents, or full bodies (FEAT-12 consumes this seam for production diagnostics).
- A contract smoke test passes against a representative API (or against the checked-in OpenAPI fixtures when live
  comparison is unavailable), and drift is fixed in the owning system or recorded as an explicit blocker. Keep
  `yarn api:check` green for generated types.
- A large-library responsiveness baseline and bundle-size expectations are recorded for FEAT-12 / FEAT-14 to measure
  against.
- `make check` passes.
- No FEAT-04 through FEAT-16 product UI, form workflow, full mock matrix, CI, Podman, or release-artifact work lands in
  this ticket.

## Plan coverage

Sections 7.2, 7.5, 7.6, 7.9, 8, and 13; typed-client portions of Workstream 2 and the integration gate.
)