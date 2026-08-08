# FEAT-11 — Library dashboard

## Objective

Provide an accurate, read-only overview of collection, borrowing, and reading activity.

## Dependencies

FEAT-10.

## Scope

- Implement `/` using `GET /dashboard`.
- Display total books, checked out, read, unread, and recently added.
- Include the API-provided recent-window length in the recently-added label.
- Display active loans, lifetime loans, average returned-loan duration, books read/unread, and average rating.
- Link actionable summaries to existing relevant routes where the destination preserves the metric's meaning.
- Add explicit refresh plus loading, empty, stale, retry, offline, and null-average states.
- Reuse the mutation invalidation established in earlier tickets so values refresh after every relevant lifecycle action.

## Acceptance criteria

- All business statistics are displayed directly from the API and are not recalculated in the browser.
- Null averages display “Not enough data,” not zero.
- The client does not add deleted records into any metric.
- The page refreshes after create, edit, delete, restore, checkout, check-in, mark-read, and reading-field changes.
- Summary links lead to useful existing pages and do not imply unsupported filtering.
- The page is understandable without charts, remains readable at 320 CSS pixels, and does not rely on color.
- Tests cover complete, all-zero, null-average, loading, stale, failure/retry, and post-mutation refresh states.
- `make check` passes.

## Plan coverage

Workstream 10; dashboard outcome, traceability entry, product gate, and cache integration gate.
