# FEAT-05 — Book form and creation

## Objective

Create books through typed ISBN lookup or fully manual entry without depending on external metadata success.

## Dependencies

FEAT-04.

## Contract gate

Before implementation, verify purchase-price currency/precision/range and duplicate-ISBN behavior against OpenAPI and
the running backend. Record unresolved differences as blockers; do not invent frontend semantics.

## Scope

- Build reusable book-form values and conversion logic separately from API transport models.
- Include title, authors, ISBN, publisher, publication date, pages, category, shelf, tags, purchase date, purchase price,
  acquisition source, and notes.
- Require non-blank title and authors; enforce documented 255-character limits, positive integer pages, valid enums,
  and accessible errors even though the API currently accepts empty required strings.
- Validate ISBN-10 and ISBN-13 check digits before lookup or creation. Preserve separators and rely on the API for
  canonical normalization; separators may be removed internally only for checksum calculation. The client-side ISBN-10
  check is required because the backend currently does not verify it.
- Define and test deterministic tag trimming, empty-tag removal, duplicate handling, and ordering.
- Convert blank optionals to the API's documented `null` or omitted representation. Never send `null` for required
  database fields such as title, authors, category, shelf, `is_read`, or status.
- Serialize user-entered date values as `YYYY-MM-DD`, while preserving a year-only lookup `publication_date` as an
  editable API string rather than inventing a month and day.
- Implement `/books/new` with manual entry and optional `GET /books/lookup?isbn=...`.
- Preserve the submitted ISBN exactly for API validation; do not normalize it in the frontend.
- Populate an editable draft after successful lookup and support partial metadata.
- Handle progress, cancel, `found: false`, string-detail `422`, `502`, `504`, unexpected lookup failure, timeout, retry,
  and manual fallback.
- Create only after explicit confirmation with `POST /books`; prevent duplicate submissions and navigate to the result.

## Acceptance criteria

- Manual creation works without invoking lookup.
- ISBN-10, ISBN-13, spaces, and hyphens are sent without frontend normalization assumptions.
- Invalid ISBN-10 check digits are rejected before the backend's documented validation gap can accept them.
- `found: false`, provider failure, timeout, and unexpected lookup errors retain the ISBN and open editable manual
  entry.
- Every imported value can be changed before save; lookup never persists a record.
- Recoverable failures and backend validation preserve user input, focus an error summary, and link field errors.
- The generic form cannot edit borrower, loan timestamp, or on-loan state.
- Slow requests, cancellation, route changes, and duplicate clicks have deterministic tested behavior.
- Checksum tests cover valid and invalid ISBN-10 values, including an `X` check digit, plus valid and invalid ISBN-13.
- Success updates relevant caches and navigates to the new detail page.
- `make check` passes.

## Plan coverage

Workstream 4; sections 7.7, 8, 10, and the add-book outcomes and traceability entries.
