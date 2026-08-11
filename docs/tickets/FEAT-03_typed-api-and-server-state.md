# FEAT-03 — Typed API and server state

## Objective

Provide one contract-checked, tested API and cache layer for all product features.

## Dependencies

FEAT-02 is complete. Do not rebuild runtime config, connection setup, the shared Bearer client shell, or the
connection-invalidation seam already in place.

`@tanstack/react-query` is already a dependency. Wire that query/cache layer under `AppProviders`; do not add a second
state store, component library, CSS framework, or form library in this ticket. Product feature workflows belong to later
tickets; this ticket finishes the typed client and server-state primitives they will use.

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
- `src/api/booksApi.ts`: typed `list()` only (`GET /books` without `include_deleted` yet). Other business routes still
  need typed helpers.
- Connection layer still uses ad hoc `connectionApi` fetches for `GET /health` and `GET /protected`; prefer routing
  those through typed helpers when the route client is complete.
- `ConnectionProvider` exposes `apiClient` and clears the token through `onUnauthorized`;
  `subscribeToConnectionInvalidation` / `notifyConnectionInvalidated` remains the seam for clearing cached protected
  data when the token is forgotten or rejected. Nothing yet subscribes that seam to a query cache.
- `AppProviders` wraps `NotificationsProvider` and `ConnectionProvider` only. React Query is installed but not wired.
- `src/api/apiClient.test.ts` currently duplicates the books `list()` mock test and no longer covers client Bearer,
  public requests, `403`, timeouts, invalid JSON, or `204` behavior. Restore and extend those client tests as part of
  this ticket.

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

### Typed route client

Extend the shared client with typed helpers for every documented business route (books already has `list()`; complete
the rest, including `include_deleted` on list):

| Method | Path | Notes for this layer |
| ------ | ---- | -------------------- |
| `GET` | `/health` | Public; reuse for reachability |
| `GET` | `/protected` | Credential check; `403` clears token via existing seam |
| `GET` | `/books` | Query `include_deleted` (default `false`); title order; no pagination |
| `POST` | `/books` | `201` + `BookRead` |
| `GET` | `/books/lookup` | Query `isbn`; `200` with `found: false` / `draft: null` is success, not an error |
| `GET` | `/books/{id}` | Soft-deleted books remain readable |
| `PATCH` | `/books/{id}` | Metadata/reading edits only; never simulate lifecycle transitions |
| `DELETE` | `/books/{id}` | `204` empty body; do not JSON-parse |
| `POST` | `/books/{id}/restore` | Dedicated restore; `409` when already active |
| `POST` | `/books/{id}/checkout` | Body requires `borrower`; `409` when already on loan |
| `POST` | `/books/{id}/checkin` | Body optional; `409` when no active loan |
| `POST` | `/books/{id}/mark-read` | Body required (send at least `{}`); omitted body is `422` |
| `GET` | `/loans` | All loans; lexical `checked_out_at` descending; no filter/pagination |
| `GET` | `/dashboard` | Soft-deleted books excluded; averages may be `null` |
| `GET` | `/backup` | Authenticated `application/sql` blob, not JSON |

Prefer dedicated lifecycle helpers (`checkout`, `checkin`, `mark-read`, `restore`, `lookup`) over reproducing those
effects with `PATCH`. Model books and loans as full `{ items, total }` result sets with no client pagination
assumptions.

Implement authenticated `/backup` as a blob response and safely return parsed UTF-8 `Content-Disposition` filename
metadata (`filename*=UTF-8''...`) to the feature layer, with a documented fallback filename when the header is missing
or malformed. Never parse the SQL body as JSON. Dump failure is `500` with string `detail`.

### Error model completion

The `ApiError` shape and `422` field mapping helpers exist. Finish normalization and safety:

- Populate `correlationId` when the API supplies one.
- Ensure HTTP, FastAPI validation (both `detail[]` and string `detail`), invalid JSON, timeout, network, and unexpected
  server failures remain safe UI errors through the client (restore client-level tests; do not invent a parallel type).
- Map documented statuses with their API meanings in helpers/tests:

  - `403` -- missing or invalid Bearer (`{"detail": "Invalid authentication credentials"}`)
  - `404` -- missing book, or soft-deleted on checkout / check-in / mark-read / second delete
  - `409` -- restore of an active book; checkout when already on loan; check-in with no active loan
  - `422` -- FastAPI `detail[]` validation **or** string `detail` (invalid ISBN lookup is the explicit string case)
  - `500` -- backup dump failure (and rare unhandled cases); treat as error, never as binary success for `/backup`
  - `502` / `504` -- ISBN metadata provider failure / timeout on lookup

- Treat lookup `found: false` as a normal manual-entry path, not an error.
- Add redaction helpers / assertions so logs and errors never contain request headers, tokens, borrower names, notes,
  reviews, ISBN drafts, backup contents, or full bodies.

### Server state

- Wire a React Query provider under `AppProviders`, query keys, stale policy, route-entry refresh, explicit refresh, and
  stale focus/online refetch. There is no realtime API.
- Subscribe to the connection-invalidation seam so forgotten or rejected tokens clear cached protected data.
- Add mutation helpers that update returned `BookRead` values and invalidate affected book lists (active and
  `include_deleted`), detail, loans, and dashboard data per `../product-docs/PLAN.md` section 7.5.
- Add reusable API mocks and builders for every route and documented error family above.

## Acceptance criteria

- Typed helpers and fixtures cover every route in the table above, including `include_deleted`, lookup `found: false`,
  mark-read with `{}`, restore/checkout/check-in `409` bodies, and `DELETE` `204`.
- Client tests again cover Bearer injection, public requests, `403`, `404`, `409`, both `422` detail shapes, backup
  `500`, lookup `502` / `504`, network failure, timeout, cancellation, invalid JSON, unexpected `5xx`, a binary backup
  success, and `204` without attempting to parse an empty body.
- Backup success is a non-empty `application/sql` blob. Missing or malformed filename headers produce safe metadata for
  a fallback filename, while a JSON generation `500` is handled as an error and never as binary success.
- Retry rules never retry validation, authentication, or unsafe mutations automatically.
- Aborted or stale requests cannot overwrite newer route or form state.
- Logs and errors contain no request headers, tokens, borrower names, notes, reviews, ISBN drafts, backup contents, or
  full bodies.
- Query invalidation matches the mutation matrix in `../product-docs/PLAN.md` section 7.5.
- A contract smoke test passes against a representative API (or against the checked-in OpenAPI fixtures when live
  comparison is unavailable), and drift is fixed in the owning system or recorded as an explicit blocker. Keep
  `yarn api:check` green for generated types.
- The no-pagination API is exercised with a representative large personal library and a practical limit is recorded.
- Bundle-size expectations are established for later regression checks.
- `make check` passes.

## Plan coverage

Sections 7.2, 7.5, 7.6, 7.9, 8, and 13; typed-client portions of Workstream 2 and the integration gate.
