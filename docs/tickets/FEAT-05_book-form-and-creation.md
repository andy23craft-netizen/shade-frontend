# FEAT-05 — Book form and creation

## Objective

Create books through typed ISBN lookup or fully manual entry without depending on external metadata success.

## Dependencies

FEAT-04 is complete. Reuse FEAT-03 typed helpers (`booksApi.create` / `lookup`, `useCreateBook`, `useBookLookup`) and
mutation/cache invalidation. Do not invent a second create/lookup client.

Extend the existing create UI in `src/features/books/routes/NewBookPage.tsx` and
`src/features/books/components/BookForm.tsx` rather than replacing them. Scanner capture belongs to FEAT-06; reading
completion and mark-read belong to FEAT-09; metadata edit belongs to FEAT-10.

## Explicitly out of scope (owned by later tickets)

| Later ticket | Owns (do not pull into FEAT-05)                                      |
|--------------|----------------------------------------------------------------------|
| FEAT-06      | Camera / hardware barcode capture feeding the create form            |
| FEAT-09      | Mark-read and later reading-field edit UI                            |
| FEAT-10      | Edit route wiring that reuses this form for `PATCH /books/{id}`      |

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for `GET /books/lookup`, `POST /books`, `BookCreate`,
  `BookLookupResponse`, `BookLookupDraft`, `BookRead`, and enums (`Category`, `Shelf`, `Status`).
- `../technical-reference/API-for-FE.md` -- behavioral guidance OpenAPI does not fully express (ISBN normalization and
  the ISBN-10 check-digit gap, lookup `found: false`, provider `502` / `504` / unexpected `500`, blank-ISBN rules, and
  FE vs API ownership of capture vs persistence).

### Documented contract facts for remaining work

Confirm against a representative running backend `/openapi.json` before locking behavior; record drift as a blocker.

- `POST /books` accepts `BookCreate` and returns `201` with `BookRead`. Documented error responses are `403` and `422`
  (FastAPI `detail[]`). There is no documented duplicate-ISBN conflict (`409` or otherwise); do not invent frontend
  rejection of duplicate ISBNs unless a later contract change adds it.
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

## Current baseline

Already in place and should be extended, not replaced:

- `NewBookPage` (`/books/new`): mounts `BookForm` with `bookFormDefaults`, creates via `useCreateBook`, shows a generic
  create error `Alert`, disables submit/cancel while pending, navigates to `/books/:bookId` on success, and cancels back
  to `/books`.
- `useCreateBook` already writes the returned `BookRead` into the detail cache and invalidates list/detail/dashboard
  (FEAT-03 / PLAN 7.5).
- `BookForm` + `bookFormDefaults`: manual entry for title, authors, ISBN, publisher, publication date, pages, category,
  shelf, tags, purchase date, purchase price, acquisition source, and notes. Blank text optionals become `null` on edit.
  Category and shelf are enum selects. Non-blank title/authors are required client-side; title/authors are trimmed on
  submit. Submit buttons honor `isSubmitting`.
- Component tests cover form field rendering, initial values, empty title/authors rejection, submit payload shaping,
  trim, cancel, submitting disabled state, and new-book create/navigate/cancel paths.

## Remaining scope

### Form model and create-field discipline

- Separate reusable book-form values and conversion logic from `BookCreate` / `BookLookupDraft` transport models so
  FEAT-10 edit can share the same form shape later. Today `BookForm` is typed directly against `BookCreate`.
- Align the create UI with this ticket: leave `status` / `is_read` at create defaults and do not expose borrower,
  `datetime_loaned_out`, or reading-completion controls (`completion_date`, `rating`, `review`, and the read checkbox)
  on create. The current form still renders Status, Read, Completion date, Rating, and Review -- remove or gate those
  for create (FEAT-09 / FEAT-10 own reading and edit workflows). Never use create/`PATCH` to simulate checkout,
  check-in, or mark-read.
- Enforce documented 255-character title/authors limits, positive integer pages (`exclusiveMinimum: 0`), and accessible
  field/summary errors (not only a single top-of-form string).
- Validate ISBN-10 and ISBN-13 check digits before lookup or creation. Preserve separators in the submitted value and
  rely on the API for canonical normalization; strip separators internally only for checksum calculation.
- Define and test deterministic tag trimming, empty-tag removal, duplicate handling, and ordering (UI currently trims
  and drops empties on change only).
- Convert blank optionals to `null` (or omit when that matches the typed helper) through an explicit form→`BookCreate`
  conversion path covered by tests. Keep user-entered dates as `YYYY-MM-DD`. Preserve a year-only lookup
  `publication_date` as an editable API string rather than inventing a month and day (today's `type="date"` control
  cannot hold year-only values).

### ISBN lookup on `/books/new`

- Add optional `GET /books/lookup?isbn=...` beside manual entry. Preserve the submitted ISBN exactly for API validation;
  do not normalize it in the frontend.
- On successful lookup (`found: true`), populate an editable draft from `BookLookupDraft` (and retain the user's
  submitted ISBN string in the form). Support partial metadata.
- Handle progress, cancel, `found: false`, string-detail `422`, `502`, `504`, unexpected lookup failure (including
  possible `500`), timeout, retry, and manual fallback. Always retain the ISBN and keep the form editable.
- Create only after explicit confirmation with `POST /books`. Map create `422 detail[].loc` entries to fields; preserve
  input, focus an error summary, and link field errors.

## Acceptance criteria

- Manual creation works without invoking lookup.
- ISBN-10, ISBN-13, spaces, and hyphens are sent without frontend normalization assumptions.
- Invalid ISBN-10 check digits are rejected before the backend's documented validation gap can accept them.
- `found: false`, provider failure (`502` / `504`), timeout, unexpected lookup errors, and string-detail `422` retain
  the ISBN and open editable manual entry.
- Every imported value can be changed before save; lookup never persists a record.
- Recoverable failures and backend validation preserve user input, focus an error summary, and link field errors.
- The creation form cannot edit borrower, loan timestamp, on-loan state, or reading-completion fields.
- Slow requests, cancellation, route changes, and duplicate clicks have deterministic tested behavior.
- Checksum tests cover valid and invalid ISBN-10 values, including an `X` check digit, plus valid and invalid ISBN-13.
- Success (`201` `BookRead`) updates relevant caches and navigates to the new detail page (cache+navigate already in
  baseline; keep green when adding lookup and stricter validation).
- Tests cover blank-optional-to-`null` conversion, year-only `publication_date` passthrough, and unconstrained
  `purchase_price` number/`null` serialization without inventing currency fields.
- `make check` passes.

## Plan coverage

Workstream 4; sections 7.7, 8, 10, and the add-book outcomes and traceability entries.
