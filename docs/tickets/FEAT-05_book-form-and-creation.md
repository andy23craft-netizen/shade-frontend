# FEAT-05 — Book form and creation

## Objective

Create books through typed ISBN lookup or fully manual entry without depending on external metadata success.

## Dependencies

FEAT-04 is complete. Reuse FEAT-03 typed helpers (`booksApi.create` / `lookup`, `useCreateBook`, `useBookLookup` /
`useLookupBook`) and mutation/cache invalidation. Do not invent a second create/lookup client.

Consolidate create UI around `src/features/books/components/BookForm.tsx` (and `bookFormDefaults` /
`bookFormModel`) rather than keeping a parallel inline form on `NewBookPage`. Scanner capture belongs to FEAT-06;
reading completion and mark-read belong to FEAT-09; metadata edit belongs to FEAT-10.

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

- `NewBookPage` (`/books/new`): inline create form (does **not** mount `BookForm`). Creates via `useCreateBook`,
  navigates to `/books/:bookId` on success, cancels back to `/books`, and shows a generic create error `Alert`. Manual
  create works without lookup.
- ISBN lookup UI is already on `/books/new` via `useBookLookup`: progress label, `found: false` info alert, lookup
  error alert with manual-fallback copy, and an "Apply Lookup" control that copies draft fields into the form. Lookup
  never persists a book.
- `useCreateBook` already writes the returned `BookRead` into the detail cache and invalidates list/detail/dashboard
  (FEAT-03 / PLAN 7.5).
- `BookForm` / `bookFormDefaults` / `bookFormModel.formValuesToBookCreate` exist as a reusable path for FEAT-10, but
  `NewBookPage` duplicates its own form state and submit mapping instead of using them. `BookForm` still converts
  inline and does not call `formValuesToBookCreate`.
- Create UI still exposes status, read, completion date, rating, and review on `NewBookPage` (and status / read on
  `BookForm`). Those must be gated or removed from create so defaults stay `status=available` and `is_read=false`.
- `BookForm` uses a single top-of-form validation string for empty title/authors; Field `error` wiring and an error
  summary are not used. Publication date remains `type="date"` on both forms (cannot hold year-only lookup values).
  Tags exist only on `BookForm` (trim / drop empties on change); `NewBookPage` has no tags field.
- `src/features/books/utils/isbn.ts`: `isValidIsbn10` / `isValidIsbn13` / `isValidIsbn` strip separators only for
  checksum calculation. Colocated tests cover valid and invalid ISBN-10 (including an `X` check digit), formatted
  values, and ISBN-13. These helpers are not yet called from `NewBookPage`, `BookForm`, or lookup.
- Route / component tests cover basic create submit/navigate/cancel, form field rendering, empty title/authors
  rejection, and ISBN unit cases. Lookup-flow tests, create `422` field mapping, blank-optional-to-`null`, year-only
  `publication_date`, and purchase-price serialization coverage are still missing or incomplete.

## Remaining scope

### Form model and create-field discipline

- Mount `BookForm` from `NewBookPage` (or otherwise share one values shape and conversion) so FEAT-10 can reuse the
  same model. Wire `formValuesToBookCreate` (or equivalent) from submit; drop duplicate inline `BookCreate` mapping.
- Gate create fields: remove editable status, borrower/loan, read, completion, rating, and review from create. Keep
  create defaults for `status` / `is_read` in the conversion path; never use create/`PATCH` to simulate checkout,
  check-in, or mark-read.
- Enforce documented 255-character title/authors limits, positive integer pages (`exclusiveMinimum: 0`), and accessible
  field/summary errors (not only a single top-of-form string or browser `required`).
- Wire `isbn.ts` into lookup and create so invalid ISBN-10 / ISBN-13 check digits are rejected before the request.
  Preserve separators in the submitted value and rely on the API for canonical normalization.
- Define and test deterministic tag trimming, empty-tag removal, duplicate handling, and ordering; expose tags on the
  shared create form.
- Cover blank-optional-to-`null` conversion, year-only lookup `publication_date` passthrough as an editable API string
  (do not invent month/day; replace or supplement today's `type="date"` control), and unconstrained `purchase_price`
  number/`null` serialization without inventing currency fields. Align `BookForm.test.tsx` with the gated create UI.

### ISBN lookup hardening on `/books/new`

- Keep optional `GET /books/lookup?isbn=...` beside manual entry (reuse `useLookupBook` / `useBookLookup`). Preserve the
  user's submitted ISBN string in the form; do not overwrite it with the draft's normalized `isbn13` on apply.
- On successful lookup (`found: true`), populate an editable draft from `BookLookupDraft` (partial metadata allowed).
- Harden progress, cancel, `found: false`, string-detail `422`, `502`, `504`, unexpected lookup failure (including
  possible `500`), timeout, retry, and manual fallback. Always retain the ISBN and keep the form editable.
- Create only after explicit confirmation with `POST /books`. Map create `422 detail[].loc` entries to fields; preserve
  input, focus an error summary, and link field errors.
- Add route tests for lookup success / `found: false` / failure / checksum rejection paths.

## Acceptance criteria

- ISBN-10, ISBN-13, spaces, and hyphens are sent without frontend normalization assumptions.
- Invalid ISBN-10 check digits are rejected before the backend's documented validation gap can accept them (via wired
  `isbn.ts` helpers).
- `found: false`, provider failure (`502` / `504`), timeout, unexpected lookup errors, and string-detail `422` retain
  the ISBN and open editable manual entry.
- Every imported value can be changed before save; lookup never persists a record.
- Recoverable failures and backend validation preserve user input, focus an error summary, and link field errors.
- Slow requests, cancellation, route changes, and duplicate clicks have deterministic tested behavior.
- Tests cover blank-optional-to-`null` conversion, year-only `publication_date` passthrough, and unconstrained
  `purchase_price` number/`null` serialization without inventing currency fields.
- Existing create success path (cache write + navigate to detail) and ISBN checksum unit tests stay green.
- `make check` passes.

## Plan coverage

Workstream 4; sections 7.7, 8, 10, and the add-book outcomes and traceability entries.
