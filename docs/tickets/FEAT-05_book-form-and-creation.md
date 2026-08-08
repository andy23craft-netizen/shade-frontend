# FEAT-05 — Book form and creation

## Objective

Create books through typed ISBN lookup or fully manual entry without depending on external metadata success.

## Dependencies

FEAT-04.

## Contract gate

Before implementation, verify OpenAPI and backend behavior for nullable-value clearing, year-only publication dates,
purchase-price currency/precision/range, duplicate ISBNs, and purchase/completion date chronology. Record unresolved
differences as blockers; do not invent frontend semantics.

## Scope

- Build reusable book-form values and conversion logic separately from API transport models.
- Include title, authors, ISBN, publisher, publication date, pages, category, shelf, tags, purchase date, purchase price,
  acquisition source, and notes.
- Require title and authors; enforce documented lengths, positive integer pages, valid enums, and accessible errors.
- Define and test deterministic tag trimming, empty-tag removal, duplicate handling, and ordering.
- Convert blank optionals to the API's verified `null` or omitted representation.
- Implement `/books/new` with manual entry and optional `GET /books/lookup?isbn=...`.
- Preserve the submitted ISBN exactly for API validation; do not normalize it in the frontend.
- Populate an editable draft after successful lookup and support partial metadata.
- Handle progress, cancel, `found: false`, `422`, `502`, `504`, timeout, retry, and manual fallback.
- Create only after explicit confirmation with `POST /books`; prevent duplicate submissions and navigate to the result.

## Acceptance criteria

- Manual creation works without invoking lookup.
- ISBN-10, ISBN-13, spaces, and hyphens are sent without frontend normalization assumptions.
- `found: false`, provider failure, and timeout retain the ISBN and open editable manual entry.
- Every imported value can be changed before save; lookup never persists a record.
- Recoverable failures and backend validation preserve user input, focus an error summary, and link field errors.
- The generic form cannot edit borrower, loan timestamp, or on-loan state.
- Slow requests, cancellation, route changes, and duplicate clicks have deterministic tested behavior.
- Success updates relevant caches and navigates to the new detail page.
- `make check` passes.

## Plan coverage

Workstream 4; sections 7.7, 8, 10, and the add-book outcomes and traceability entries.
