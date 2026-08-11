# FEAT-03 — Typed API and server state

## Objective

Provide one contract-checked, tested API and cache layer for all product features.

## Dependencies

FEAT-02 is complete. Do not rebuild runtime config, connection setup, the shared Bearer client shell, or the
connection-invalidation seam already in place.

Do not add a component library, CSS framework, state store outside the chosen query/cache layer, or form library in
this ticket. Product feature workflows belong to later tickets; this ticket supplies the typed client and server-state
primitives they will use.

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
- FEAT-02 already uses public `GET /health` and protected `GET /protected`; reuse those through typed helpers rather
  than duplicating ad hoc fetches.

## Remaining scope

### Transport types

- Generate TypeScript models from the checked-in OpenAPI when a stable repository-owned command is practical; otherwise
  add explicit transport types and contract fixtures checked against `openapi.json`.
- Model every documented schema exactly, including nullable fields, temporal strings, enums (`Status`, `Category`,
  `Shelf`), list wrappers (`BookList` / `LoanList` as `{ items, total }`), lookup
  (`BookLookupResponse` / `BookLookupDraft`), dashboard nesting (`DashboardSummary`, `DashboardBorrowing`,
  `DashboardReading`), the SQL backup attachment, and `204 No Content`.
- Preserve book audit and lifecycle transport names from `BookRead`: `creation_date`, `updated_date`, `deletion_date`,
  `datetime_loaned_out`, `times_borrowed`, `last_borrowed_at`, and `average_loan_days`. Preserve loan audit names from
  `LoanRead`: `created_date` and `last_updated_date`. Do not rename them in transport types.
- Preserve unknown response fields and render future enum values through a neutral fallback.
- Serialize only documented request properties because backend request models silently ignore unknown fields. Do not
  use `BookRead.updated_date` as a concurrency token because generic `PATCH` currently does not update it.
- Serialize date-only form values as `YYYY-MM-DD` and timestamps as normalized UTC ISO 8601 strings when helpers accept
  form-adjacent inputs. Preserve year-only lookup `publication_date` as a string. Never pass arbitrary loan timestamp
  text through to the API; malformed stored timestamps can later surface as unhandled `500` on statistics.
- Request builders must not send `null` for DB-required fields such as `title`, `authors`, `category`, `shelf`,
  `is_read`, or `status` -- the schema may accept it, but commit can fail.

### Typed route client

Extend the shared client with typed helpers for every documented business route, with configurable timeout and
cancellation:

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

### Error model

Normalize HTTP, FastAPI validation, invalid JSON, timeout, network, and unexpected server failures into a safe UI error
(extend `ApiError` rather than inventing a parallel type). Preserve HTTP status, safe detail, and correlation ID when
supplied.

Map documented statuses with their API meanings:

- `403` -- missing or invalid Bearer (`{"detail": "Invalid authentication credentials"}`)
- `404` -- missing book, or soft-deleted on checkout / check-in / mark-read / second delete
- `409` -- restore of an active book; checkout when already on loan; check-in with no active loan
- `422` -- FastAPI `detail[]` validation **or** string `detail` (invalid ISBN lookup is the explicit string case)
- `500` -- backup dump failure (and rare unhandled cases); treat as error, never as binary success for `/backup`
- `502` / `504` -- ISBN metadata provider failure / timeout on lookup

Map `422 detail[].loc` entries to fields. Treat lookup `found: false` as a normal manual-entry path, not an error.

### Server state

- Add a query/cache provider under `AppProviders`, query keys, stale policy, route-entry refresh, explicit refresh, and
  stale focus/online refetch. There is no realtime API.
- Subscribe to the connection-invalidation seam so forgotten or rejected tokens clear cached protected data.
- Add mutation helpers that update returned `BookRead` values and invalidate affected book lists (active and
  `include_deleted`), detail, loans, and dashboard data per `../product-docs/PLAN.md` section 7.5.
- Add reusable API mocks and builders for every route and documented error family above.

## Acceptance criteria

- Typed helpers and fixtures cover every route in the table above, including `include_deleted`, lookup `found: false`,
  mark-read with `{}`, restore/checkout/check-in `409` bodies, and `DELETE` `204`.
- Tests cover `403`, `404`, `409`, both `422` detail shapes, backup `500`, lookup `502` / `504`, network failure,
  timeout, invalid JSON, unexpected `5xx`, a binary backup success, and `204` without attempting to parse an empty body.
- Backup success is a non-empty `application/sql` blob. Missing or malformed filename headers produce safe metadata for
  a fallback filename, while a JSON generation `500` is handled as an error and never as binary success.
- Transport fixtures distinguish `BookRead` (`creation_date` / `updated_date`) from `LoanRead` (`created_date` /
  `last_updated_date`) and round-trip borrowing statistics and nullable dashboard averages without renaming.
- Retry rules never retry validation, authentication, or unsafe mutations automatically.
- Aborted or stale requests cannot overwrite newer route or form state.
- Logs and errors contain no request headers, tokens, borrower names, notes, reviews, ISBN drafts, backup contents, or
  full bodies.
- Query invalidation matches the mutation matrix in `../product-docs/PLAN.md` section 7.5.
- A contract smoke test passes against a representative API (or against the checked-in OpenAPI fixtures when live
  comparison is unavailable), and drift is fixed in the owning system or recorded as an explicit blocker.
- The no-pagination API is exercised with a representative large personal library and a practical limit is recorded.
- Bundle-size expectations are established for later regression checks.
- `make check` passes.

## Plan coverage

Sections 7.2, 7.5, 7.6, 7.9, 8, and 13; typed-client portions of Workstream 2 and the integration gate.
