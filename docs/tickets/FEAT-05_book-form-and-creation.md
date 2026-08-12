# FEAT-05 — Book form and creation

## Objective

Create books through typed ISBN lookup or fully manual entry without depending on external metadata success.

## Dependencies

FEAT-04.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for `GET /books/lookup`, `POST /books`, `BookCreate`,
  `BookLookupResponse`, `BookLookupDraft`, `BookRead`, and enums (`Category`, `Shelf`, `Status`).
- `../technical-reference/API-for-FE.md` -- behavioral guidance OpenAPI does not fully express (ISBN normalization and
  the ISBN-10 check-digit gap, lookup `found: false`, provider `502` / `504` / unexpected `500`, blank-ISBN rules, and
  FE vs API ownership of capture vs persistence).

Reuse FEAT-03 typed helpers and mutation/cache invalidation. Do not invent a second create/lookup client.

### Documented contract facts for this ticket

Confirm against a representative running backend `/openapi.json` before locking behavior; record drift as a blocker.

- `POST /books` accepts `BookCreate` and returns `201` with `BookRead`. Documented error responses are `403` and `422`
  (FastAPI `detail[]`). There is no documented duplicate-ISBN conflict (`409` or otherwise); OpenAPI and the API notes
  do not require uniqueness on `isbn13`. Do not invent frontend rejection of duplicate ISBNs unless a later contract
  change adds it.
- `purchase_price` is an unconstrained nullable `number` in OpenAPI -- no currency, precision, `multipleOf`, or range.
  Present a sensible client control (e.g., decimal money input) and send a JSON number or `null`; do not invent API
  currency codes or server-side rounding rules.
- `GET /books/lookup?isbn=...` is protected, does not create or modify a book, and returns `200` with
  `BookLookupResponse`. Unknown ISBNs are success with `found: false` and `draft: null`, not an error.
- Lookup also documents string-`detail` `422` (invalid ISBN), `502` (provider transport/`5xx`), and `504` (provider
  timeout). Unexpected non-404 provider `4xx` and malformed provider JSON can surface as unhandled `500`.
- Lookup currently always uses Open Library with a three-second provider timeout. Client timeout must exceed that window
  and still offer retry or manual fallback.
- Accepted ISBN forms include ISBN-10, ISBN-13, spaces, and hyphens. The API normalizes to ISBN-13 when possible.
  ISBN-13 check digits are validated; ISBN-10 check digits are not -- the frontend must reject invalid ISBN-10 check
  digits before lookup or create. Blank `isbn` on lookup is `422`; blank create/update `isbn13` is stored as `null`.
- `BookLookupDraft` always includes `isbn13`; `title`, `authors`, `publisher`, `publication_date`, and `pages` may be
  null. `publication_date` may be year-only.
- `BookCreate` requires `title` and `authors` (`maxLength` 255) but currently accepts empty strings. Defaults when
  omitted: `category=unknown`, `shelf=unknown`, `is_read=false`, `status=available`. `pages` is a positive integer
  (`exclusiveMinimum: 0`) or `null`. `isbn13` allows `maxLength` 14. Request models ignore unknown properties.
- Never send `null` for DB-required fields such as `title`, `authors`, `category`, `shelf`, `is_read`, or `status`.
- Date and timestamp fields are plain strings; the API does not validate format. Still serialize user-entered dates as
  `YYYY-MM-DD`.

## Scope

### Form model (reusable)

- Build reusable book-form values and conversion logic separately from `BookCreate` / `BookLookupDraft` transport models
  so FEAT-10 edit can share the same form shape later.
- Creation UI fields: title, authors, ISBN (`isbn13`), publisher, publication date, pages, category, shelf, tags,
  purchase date, purchase price, acquisition source, and notes.
- Require non-blank title and authors; enforce documented 255-character limits, positive integer pages, valid `Category`
  / `Shelf` enums (with `unknown`), and accessible field/summary errors even though the API currently accepts empty
  required strings.
- Validate ISBN-10 and ISBN-13 check digits before lookup or creation. Preserve separators in the submitted value and
  rely on the API for canonical normalization; strip separators internally only for checksum calculation.
- Define and test deterministic tag trimming, empty-tag removal, duplicate handling, and ordering.
- Convert blank optionals to `null` (or omit when that matches the typed helper). Do not send `null` for
  title/authors/category/shelf/`is_read`/`status`.
- Serialize user-entered date values as `YYYY-MM-DD`. Preserve a year-only lookup `publication_date` as an editable API
  string rather than inventing a month and day.
- Do not expose borrower, `datetime_loaned_out`, on-loan simulation, or reading-completion controls on this form. Leave
  `status` / `is_read` at create defaults unless a later product decision adds a non-loan metadata status control; never
  use create/`PATCH` to simulate checkout, check-in, or mark-read.

### New-book route (`/books/new`)

- Implement `/books/new` with manual entry and optional `GET /books/lookup?isbn=...`.
- Preserve the submitted ISBN exactly for API validation; do not normalize it in the frontend.
- On successful lookup (`found: true`), populate an editable draft from `BookLookupDraft` (and retain the user's
  submitted ISBN string in the form). Support partial metadata.
- Handle progress, cancel, `found: false`, string-detail `422`, `502`, `504`, unexpected lookup failure (including
  possible `500`), timeout, retry, and manual fallback. Always retain the ISBN and keep the form editable.
- Create only after explicit confirmation with `POST /books`; prevent duplicate submissions; on `201`, update relevant
  caches (active list, detail, dashboard per FEAT-03 / PLAN 7.5) and navigate to `/books/:bookId` for the new `id`.
- Map create `422 detail[].loc` entries to fields; preserve input, focus an error summary, and link field errors.

## Acceptance criteria

- Manual creation works without invoking lookup.
- ISBN-10, ISBN-13, spaces, and hyphens are sent without frontend normalization assumptions.
- Invalid ISBN-10 check digits are rejected before the backend's documented validation gap can accept them.
- `found: false`, provider failure (`502` / `504`), timeout, unexpected lookup errors, and string-detail `422` retain
  the ISBN and open editable manual entry.
- Every imported value can be changed before save; lookup never persists a record.
- Recoverable failures and backend validation preserve user input, focus an error summary, and link field errors.
- The creation form cannot edit borrower, loan timestamp, or on-loan state.
- Slow requests, cancellation, route changes, and duplicate clicks have deterministic tested behavior.
- Checksum tests cover valid and invalid ISBN-10 values, including an `X` check digit, plus valid and invalid ISBN-13.
- Success (`201` `BookRead`) updates relevant caches and navigates to the new detail page.
- Tests cover blank-optional-to-`null` conversion, year-only `publication_date` passthrough, and unconstrained
  `purchase_price` number/`null` serialization without inventing currency fields.
- `make check` passes.

## Plan coverage

Workstream 4; sections 7.7, 8, 10, and the add-book outcomes and traceability entries.
