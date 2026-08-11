# FEAT-03 — Typed API and server state

## Objective

Provide one contract-checked, tested API and cache layer for all product features.

## Dependencies

FEAT-02 is complete. Do not rebuild runtime config, connection setup, the shared Bearer client shell, or the
connection-invalidation seam already in place.

Do not add a component library, CSS framework, state store outside the chosen query/cache layer, or form library in
this ticket. Product feature workflows belong to later tickets; this ticket supplies the typed client and server-state
primitives they will use.

## Current baseline

Already in place and should be extended, not replaced:

- `src/api/apiClient.ts`: `createApiClient` with Bearer injection, path joining at the configured base URL (no `/api`
  prefix), `get` / `request`, confirmed protected `403` handling via `onUnauthorized`, and basic unreachable / HTTP /
  server `ApiError` throws. No typed route helpers, JSON/body parsing, timeout, cancellation, or backup blob handling
  yet.
- `src/api/apiErrors.ts`: `ApiError` with kinds `unreachable`, `unauthorized`, `server`, and `http`. Not yet the full
  UI error model (`422` shapes, correlation ID, field mapping, timeout/invalid JSON kinds, or redaction helpers beyond
  client tests).
- `ConnectionProvider` exposes `apiClient` and clears the token through `onUnauthorized`;
  `subscribeToConnectionInvalidation` / `notifyConnectionInvalidated` is the FEAT-03 seam for clearing cached
  protected data when the token is forgotten or rejected.
- `AppProviders` wraps `NotificationsProvider` and `ConnectionProvider` only; there is no query/cache provider yet.
- Contract references: `docs/technical-reference/API-for-FE.md` and checked-in
  `docs/technical-reference/openapi.json`. Compare those with a representative running backend OpenAPI before locking
  transport types.

## Remaining scope

- Compare `../technical-reference/API-for-FE.md` and `../technical-reference/openapi.json` with a representative
  running backend OpenAPI document before implementation.
- Generate TypeScript models from OpenAPI when a stable repository-owned command is practical; otherwise add explicit
  transport types and contract fixtures checked against OpenAPI.
- Model nullable fields, temporal strings, enums, list wrappers, lookup unions, the SQL backup attachment, and `204 No
  Content` exactly.
- Serialize date-only form values as `YYYY-MM-DD` and timestamps as normalized UTC ISO 8601 strings. Preserve year-only
  lookup publication dates as strings and never pass arbitrary loan timestamp text through to the API.
- Serialize only documented request properties because backend request models silently ignore unknown fields. Do not
  use `BookRead.updated_date` as a concurrency token because generic `PATCH` currently does not update it.
- Model books and loans as `{ items, total }`, preserve the API's title and lexical `checked_out_at`-descending order,
  and assume no pagination or loan filtering.
- Preserve the transport names `created_date`, `last_updated_date`, `times_borrowed`, `last_borrowed_at`, and
  `average_loan_days`.
- Preserve unknown response fields and render future enum values through a neutral fallback.
- Extend the shared client to cover all documented routes with configurable timeout and cancellation behavior.
- Implement authenticated `/backup` as a blob response and safely return parsed UTF-8 `Content-Disposition` filename
  metadata to the feature layer, with no attempt to parse the SQL body as JSON.
- Normalize HTTP, FastAPI validation, invalid JSON, timeout, network, and unexpected server failures into a safe UI
  error (extend `ApiError` rather than inventing a parallel type).
- Map `422 detail[].loc` entries to fields and support string `detail` from invalid ISBN lookup while retaining HTTP
  status, safe detail, and correlation ID when supplied.
- Add a query/cache provider under `AppProviders`, query keys, stale policy, route-entry refresh, explicit refresh, and
  stale focus/online refetch. Subscribe to the connection-invalidation seam so forgotten or rejected tokens clear
  cached protected data.
- Add mutation helpers that update returned books and invalidate affected book lists, detail, loans, and dashboard data.
- Add reusable API mocks and builders for every route and documented error family.

## Acceptance criteria

- Tests cover `403`, `404`, `409`, both `422` detail shapes, backup `500`, `502`, `504`, network failure, timeout,
  invalid JSON, unexpected `5xx`, a binary backup success, and `204` without attempting to parse an empty body.
- Backup success is a non-empty `application/sql` blob. Missing or malformed filename headers produce safe metadata for
  a fallback filename, while a JSON generation `500` is handled as an error and never as binary success.
- Retry rules never retry validation, authentication, or unsafe mutations automatically.
- Aborted or stale requests cannot overwrite newer route or form state.
- Logs and errors contain no request headers, tokens, borrower names, notes, reviews, ISBN drafts, backup contents, or
  full bodies.
- Query invalidation matches the mutation matrix in `../product-docs/PLAN.md` section 7.5.
- A contract smoke test passes against a representative API, and drift is fixed in the owning system or recorded as an
  explicit blocker.
- The no-pagination API is exercised with a representative large personal library and a practical limit is recorded.
- Bundle-size expectations are established for later regression checks.
- `make check` passes.

## Plan coverage

Sections 7.2, 7.5, 7.6, 7.9, and 13; typed-client portions of Workstream 2 and the integration gate.
