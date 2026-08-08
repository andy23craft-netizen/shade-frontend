# FEAT-04 — Active collection and book details

## Objective

Let users browse the active library and understand a book's metadata and lifecycle state.

## Dependencies

FEAT-03.

## Scope

- Implement the title-ordered `/books` collection using `GET /books`.
- Implement `/books/:bookId` using `GET /books/{id}`.
- Present useful bibliographic and library metadata, including tags and acquisition information.
- Clearly distinguish available, on-loan, read/unread, missing, display-only, reserved, and reading states.
- Show times borrowed, last borrowed date, and average completed-loan duration.
- Add contextual links for edit, checkout/check-in, mark read, and delete only when valid.
- Implement loading, empty, stale, retry, not-found, deleted-between-navigation, and offline states.
- Add safe formatting for null values, date-only values, timestamps, long content, and unknown enums.

## Acceptance criteria

- Deleted books never appear in normal collection browsing.
- On-loan books are visibly unavailable and cannot begin another checkout.
- Null averages show an explanatory fallback rather than zero.
- A detail `404` refreshes stale collection data and offers safe navigation.
- Status is conveyed textually and semantically, not by color alone.
- Detail links and back navigation work at narrow and wide widths.
- API success and every relevant failure/empty state have component or integration tests.
- Date-only values do not shift days because of timezone conversion.
- `make check` passes.

## Plan coverage

Workstream 3; sections 5.2, 7.8, 10, and the active-browsing portions of the product gate.
