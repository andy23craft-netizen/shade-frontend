# FEAT-03 — Typed API and server state

## Objective

Provide one contract-checked, tested API and cache layer for all product features.

## Dependencies

FEAT-02.

## Scope

- Compare `docs/API-for-FE.md` with a representative running backend OpenAPI document before implementation.
- Generate TypeScript models from OpenAPI when a stable repository-owned command is practical; otherwise add explicit
  transport types and contract fixtures checked against OpenAPI.
- Model nullable fields, dates, timestamps, enums, list wrappers, lookup unions, and `204 No Content` exactly.
- Preserve unknown response fields and render future enum values through a neutral fallback.
- Implement all documented routes with configurable timeout and cancellation behavior.
- Normalize HTTP, FastAPI validation, invalid JSON, timeout, network, and unexpected server failures into a safe UI error.
- Map `422 detail[].loc` entries to fields while retaining HTTP status, safe detail, and correlation ID when supplied.
- Add a query/cache provider, query keys, stale policy, route-entry refresh, explicit refresh, and stale focus/online refetch.
- Add mutation helpers that update returned books and invalidate affected book lists, detail, loans, and dashboard data.
- Add reusable API mocks and builders for every route and documented error family.

## Acceptance criteria

- Tests cover `403`, `404`, `409`, `422`, `502`, `504`, network failure, timeout, invalid JSON, unexpected `5xx`, and
  `204` without attempting to parse an empty body.
- Retry rules never retry validation, authentication, or unsafe mutations automatically.
- Aborted or stale requests cannot overwrite newer route or form state.
- Logs and errors contain no request headers, tokens, borrower names, notes, reviews, ISBN drafts, or full bodies.
- Query invalidation matches the mutation matrix in `docs/PLAN.md` section 7.5.
- A contract smoke test passes against a representative API, and drift is fixed in the owning system or recorded as an
  explicit blocker.
- The no-pagination API is exercised with a representative large personal library and a practical limit is recorded.
- Bundle-size expectations are established for later regression checks.
- `make check` passes.

## Plan coverage

Sections 7.2, 7.5, 7.6, 7.9, and 13; typed-client portions of Workstream 2 and the integration gate.
