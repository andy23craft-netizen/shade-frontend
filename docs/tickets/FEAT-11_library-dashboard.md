# FEAT-11 — Library dashboard

## Objective

Provide an accurate, read-only overview of collection, borrowing, and reading activity.

## Dependencies

FEAT-10.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for `GET /dashboard`, nested `DashboardSummary` /
  `DashboardBorrowing` / `DashboardReading`, and auth failure `ErrorDetail`.
- `../technical-reference/API-for-FE.md` -- behavioral guidance OpenAPI does not fully express (soft-deleted books
  excluded from every metric, null averages, `recent_window_days` currently `30`, duplicated read/unread fields,
  borrowing-statistics `500` from malformed stored timestamps, and FE vs API ownership of statistics).

Reuse FEAT-03 typed dashboard helpers and the mutation invalidation matrix from earlier tickets. Do not invent a second
dashboard client, and never recalculate business statistics in the browser.

### Documented contract facts for this ticket

Confirm against a representative running backend `/openapi.json` before locking behavior; record drift as a blocker.

- `GET /dashboard` requires Bearer auth and returns `200` with `DashboardSummary`. OpenAPI documents auth failure as
  `403` with string `ErrorDetail`. There is no dashboard-specific `404`, query string, filter, or pagination.
- Soft-deleted books are excluded from every dashboard metric. Lifetime loans and reading/borrowing averages already
  omit soft-deleted books on the server; the client must not add deleted records into any displayed value.
- `DashboardSummary` required fields: `total_books`, `checked_out`, `read`, `unread`, `recently_added`,
  `recent_window_days`, nested `borrowing` (`DashboardBorrowing`), and nested `reading` (`DashboardReading`). Bind
  transport property names without renaming them in the UI layer's data binding.
- `DashboardBorrowing` required fields: `active_loans`, `lifetime_loans`, and nullable `average_loan_days`.
- `DashboardReading` required fields: `books_read`, `books_unread`, and nullable `average_rating`.
- `reading.books_read` / `reading.books_unread` match top-level `read` / `unread`. Display either pair consistently;
  do not invent a third derived count when the two disagree in a fixture (treat mismatch as contract drift).
- Keep `checked_out` distinct from `borrowing.active_loans`. Backend semantics: `checked_out` counts active
  (non-deleted) books whose `status` is `on_loan`; `active_loans` counts active loan rows (`returned_at` null) joined
  to non-deleted books. Do not assume they are equal, and do not reconcile them client-side.
- `recent_window_days` is currently `30` on the backend, but the label must use the API-provided integer rather than a
  hardcoded frontend constant. `recently_added` counts non-deleted books whose `creation_date` falls inside that window.
- Averages are `null` when there is insufficient data: `borrowing.average_loan_days` when no returned loans exist for
  non-deleted books; `reading.average_rating` when no non-deleted book has a non-null `rating`. Display
  "Not enough data," never zero.
- Borrowing statistics parse stored loan timestamps as datetimes. Malformed stored values can surface as an unhandled
  `500` on this route; treat that as retryable failure and never calculate substitute metrics in the frontend.
- Statistics ownership belongs to the API. An all-zero `DashboardSummary` (including null averages) is valid dashboard
  data, not a missing-data empty state.

## Scope

- Implement `/` from `GET /dashboard` using the FEAT-03 typed helper and query cache.
- Display every `DashboardSummary` business field: `total_books`, `checked_out`, `read`, `unread`, `recently_added`
  (label includes `recent_window_days`), `borrowing.active_loans`, `borrowing.lifetime_loans`,
  `borrowing.average_loan_days`, `reading.books_read` / `books_unread` (or the matching top-level pair), and
  `reading.average_rating`.
- Keep `checked_out` and `borrowing.active_loans` visibly distinct so users are not led to treat them as one metric.
- Link actionable summaries only to existing routes that preserve the metric's meaning (for example collection,
  loans, checkout, check-in, or reading entry points already implemented). Do not imply unsupported list filtering,
  date-window browsing, or client-side recomputation of the recent window.
- Add explicit refresh plus loading, all-zero (valid data), stale, retry, offline, `403` (via existing unauthorized
  handling), and null-average states.
- Rely on mutation invalidation established in earlier tickets so values refresh after create, edit, delete, restore,
  checkout, check-in, mark-read, and reading-field changes. Do not add a parallel invalidation path.

## Acceptance criteria

- All business statistics are displayed directly from the API and are not recalculated in the browser.
- Null `borrowing.average_loan_days` and `reading.average_rating` display "Not enough data," not zero.
- Soft-deleted books remain excluded by the API response; the client does not inject deleted records into any metric.
- `checked_out` and `borrowing.active_loans` are presented as separate values and are not collapsed or reconciled.
- The recently-added label includes the API-provided `recent_window_days` value (not a hardcoded `30`).
- An all-zero response is valid dashboard data, not a missing-data empty state.
- The page refreshes after create, edit, delete, restore, checkout, check-in, mark-read, and reading-field changes, and
  on explicit user refresh.
- Summary links lead to useful existing pages and do not imply unsupported filtering.
- The page is understandable without charts, remains readable at 320 CSS pixels, and does not rely on color.
- Tests cover complete, all-zero, null-average, divergent `checked_out` vs `active_loans`, loading, stale,
  failure/retry (including unexpected `5xx` / borrowing-statistics failure), and post-mutation refresh states.
- An unexpected `5xx`, including borrowing-statistics failure from malformed stored timestamps, remains retryable and
  never causes the frontend to calculate substitute metrics.
- `make check` passes.

## Plan coverage

Workstream 10; dashboard outcome, traceability entry, product gate, and cache integration gate.
)
