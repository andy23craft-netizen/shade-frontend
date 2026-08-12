# FEAT-03 — Typed API and server state

## Objective

Provide one contract-checked, tested API and cache layer for all product features.

## Dependencies

FEAT-02 is complete. Do not rebuild runtime config, connection setup, the shared Bearer client shell, the
connection-invalidation seam, React Query mounting, query-client defaults, or the books query/mutation surface already
in place.

Do not add a second state store, component library, CSS framework, or form library in this ticket. Product feature
workflows belong to later tickets; this ticket finishes the remaining typed-client and server-state gaps they will use.

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

### Request shaping

Transport schema aliases and generation are done. Finish request-side contract safety:

- Serialize only documented request properties because backend request models silently ignore unknown fields. Do not
  use `BookRead.updated_date` as a concurrency token because generic `PATCH` currently does not update it.
- Serialize date-only form values as `YYYY-MM-DD` and timestamps as normalized UTC ISO 8601 strings when helpers accept
  form-adjacent inputs. Preserve year-only lookup `publication_date` as a string. Never pass arbitrary loan timestamp
  text through to the API; malformed stored timestamps can later surface as an unhandled `500` on statistics.
- Request builders must not send `null` for DB-required fields such as `title`, `authors`, `category`, `shelf`,
  `is_read`, or `status` -- the schema may accept it, but commit can fail.
- Keep preserving unknown response fields at runtime (do not strip undeclared JSON keys) and continue rendering future
  enum values through `enumDisplayValue` (or equivalent).

### Typed route client completion

Route helpers and backup blob metadata exist for every documented business path. Finish the remaining gaps:

- Prefer dedicated lifecycle helpers over reproducing those effects with `PATCH` (already the pattern; keep it).
- Continue modeling books and loans as full `{ items, total }` result sets with no client pagination assumptions.
- Route connection health/protected checks through the typed helpers once that swap can replace `connectionApi` without
  regressing FEAT-02 behavior.
- Extend helper/fixture coverage for lookup `found: false`, mark-read with `{}`, check-in with omitted body, and
  restore/checkout/check-in `409` bodies (happy-path path wiring and DELETE `204` are already tested).

### Error model completion

The `ApiError` shape, `422` field mapping, and client-level status normalization tests exist. Finish safety gaps:

- Populate `correlationId` when the API supplies one. Neither OpenAPI nor `API-for-FE.md` currently documents a
  correlation header or body field; do not invent one. Wire population only when a representative backend supplies a
  safe value (FEAT-12 owns broader diagnostics presentation).
- Treat lookup `found: false` as a normal manual-entry path, not an error.
- Add redaction helpers / assertions so logs and errors never contain request headers, tokens, borrower names, notes,
  reviews, ISBN drafts, backup contents, or full bodies.

### Server state

- Write returned `BookRead` values into the detail cache on successful mutations, then invalidate affected aggregates
  per `../product-docs/PLAN.md` section 7.5 (lists, detail, loans, and dashboard as applicable). Invalidation already
  matches that matrix; the missing piece is the returned-book cache write.
- Add loans and dashboard query hooks (or equivalent shared query-key helpers) so feature tickets consume the same
  cache keys the mutations already invalidate.
- Ensure aborted or stale requests cannot overwrite newer route or form state.
- Add reusable API mocks and builders for every route and documented error family above.

## Acceptance criteria

- Typed helpers and fixtures cover every documented business route edge case still open above: lookup `found: false`,
  mark-read with `{}`, check-in with omitted body, and restore/checkout/check-in `409` bodies.
- Connection health/protected checks go through the typed helpers without regressing FEAT-02 connection behavior.
- Returned `BookRead` values are written into the detail cache on successful mutations, and invalidation continues to
  match the mutation matrix in `../product-docs/PLAN.md` section 7.5.
- Loans and dashboard data are readable through shared React Query helpers that use the same keys mutations invalidate.
- Aborted or stale requests cannot overwrite newer route or form state.
- Logs and errors contain no request headers, tokens, borrower names, notes, reviews, ISBN drafts, backup contents, or
  full bodies.
- A contract smoke test passes against a representative API (or against the checked-in OpenAPI fixtures when live
  comparison is unavailable), and drift is fixed in the owning system or recorded as an explicit blocker. Keep
  `yarn api:check` green for generated types.
- The no-pagination API is exercised with a representative large personal library and a practical limit is recorded.
- Bundle-size expectations are established for later regression checks.
- `make check` passes.

## Plan coverage

Sections 7.2, 7.5, 7.6, 7.9, 8, and 13; typed-client portions of Workstream 2 and the integration gate.
