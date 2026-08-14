# CHORE-01 -- Sync frontend to latest backend API

## Objective

Bring the frontend transport layer and contract-facing docs in line with the latest checked-in backend OpenAPI and
`API-for-FE.md`. Expect little or no product-UI work: most of the recent contract is already implemented.

## Background

`docs/technical-reference/openapi.json` and `docs/technical-reference/API-for-FE.md` were refreshed from the backend.
Relative to the previous frontend baseline, the meaningful contract deltas are:

1. **Book loan fields removed from book schemas.** `BookCreate`, `BookRead`, and `BookUpdate` no longer include
   `borrower` or `datetime_loaned_out`. Borrower and checkout timestamps live only on loan rows. Checkout still
   accepts `borrower` on `CheckoutRequest`; success still sets book `status=on_loan` and creates a `Loan`.
2. **Loan reads already documented and wired.** Optional `GET /loans?book_id=...`, `GET /loans/{id}`, and related
   `400` / `404` semantics were covered by the earlier loans CHORE and are already in `loansApi` / `useLoans` /
   `useLoan`. Do not rebuild that work.
3. **Optional ISBN filter on book list (new in the latest refresh).** `GET /books` accepts optional query `isbn`
   (literal substring match against stored `isbn13`; empty/whitespace-only → `400`; no matches → empty
   `BookList`, not `404`). Soft-delete rules still apply unless `include_deleted=true`. OpenAPI also documents
   `400` on this route.

Generated types (`src/api/generated/openapi.ts`) currently drift from the checked-in OpenAPI only on the new
`isbn` list query and the `GET /books` `400` response. Book schemas in the generated file already omit
`borrower` / `datetime_loaned_out`. Product UI already reads borrower / checkout timing from loans on check-in
(`CheckinPage` via `useLoans({ bookId })`), not from `BookRead`.

## Dependencies

- Checked-in `docs/technical-reference/openapi.json` and `docs/technical-reference/API-for-FE.md` (already updated).
- Prior loans API wiring is complete: `loansApi.list({ bookId })`, `loansApi.get`, `useLoans({ bookId })`,
  `useLoan`, Check In deep-link `/checkin?bookId=...`. Treat that as done.
- Do not block on FEAT-08 through FEAT-11 product UI. This chore is transport + doc alignment only.

## Contract references

Treat these as complementary:

- `../technical-reference/openapi.json` -- authoritative paths, schemas, enums, nullability, status codes
  (OpenAPI 3.1; LibraryV2). Prefer `yarn api:generate` over hand-editing generated types.
- `../technical-reference/API-for-FE.md` -- behavioral guidance OpenAPI does not fully express (auth, CORS, error
  meanings, lifecycle rules, ISBN quirks, loan ownership, FE vs API ownership).

Confirm against a representative running backend `/openapi.json` when available; record drift as a blocker rather
than inventing frontend semantics.

### Documented contract facts relevant to this chore

- Prefer loan reads for borrower and checkout timing: `GET /loans?book_id={id}` or `GET /loans/{id}`. Do not expect
  `borrower` / `datetime_loaned_out` on `BookRead`.
- Soft-deleted books still accept generic `PATCH` for metadata including `status` / `is_read`, but that does not
  create or update loans. Dedicated checkout / check-in / mark-read / restore / lookup endpoints remain required.
- Optional `isbn` on `GET /books` is a list filter, not a replacement for `GET /books/lookup`. Catalog
  search/filter/sort UI remains out of scope for MVP unless a later ticket explicitly requires it.
- Date/timestamp fields remain plain strings; clients should still send `YYYY-MM-DD` and UTC ISO 8601.

## Current baseline (already aligned -- do not rebuild)

Verify before changing; reuse as-is when still correct:

- `src/api/requestFields.ts` -- `BOOK_CREATE_KEYS` / `BOOK_UPDATE_KEYS` already omit loan fields; checkout / check-in /
  mark-read pickers already match the dedicated request schemas.
- `src/api/booksApi.ts` -- lifecycle helpers (`create`, `update`, `checkout`, `checkin`, `markRead`, `lookup`, etc.)
  already target the dedicated endpoints.
- `src/api/loansApi.ts` / `loansQueries.ts` / `queryKeys.loans` -- already support filtered list and detail.
- Feature UI: checkout sends `CheckoutRequest.borrower`; check-in displays `activeLoan.borrower` /
  `checked_out_at`; book detail shows `status`, borrow stats (`times_borrowed`, `last_borrowed_at`), not book-level
  borrower fields.
- `scripts/contractSmoke.test.ts` -- already expects `/loans` and `/loans/{id}` among OpenAPI paths.

## Required / likely changes

### 1. Regenerate OpenAPI types (required)

**File:** `src/api/generated/openapi.ts`

**Action:** Run `yarn api:generate` (or pass `yarn api:check`). Do not hand-edit.

**Expected delta:** `operations` for `GET /books` gain optional query `isbn?: string | null` and response `400`
(`ErrorDetail`). Schema aliases in `apiTypes.ts` should continue to compile without renaming exports.

### 2. Typed books list helper -- optional `isbn` (recommended, thin)

**Files:**

- `src/api/booksApi.ts` -- extend `ListBooksOptions` with optional `isbn?: string`; when non-empty after the same
  omit-empty pattern used for loans `bookId`, append `isbn` via `URLSearchParams`.
- `src/api/queryKeys.ts` -- extend `queryKeys.books.list` so cache entries distinguish `includeDeleted` and `isbn`
  (keep `['books']` as the invalidation prefix).
- `src/api/booksQueries.ts` -- pass optional `isbn` through `useBooks` options into the list helper and query key.

**Why:** Keeps the typed client surface matched to OpenAPI without inventing catalog UI. Callers that never pass
`isbn` keep today's behavior.

**Not required for MVP UI:** Do not add books-page search/filter UI here. Catalog search/filter/sort remains out of
scope unless a later ticket owns it.

### 3. Tests for the thin list filter (if step 2 is done)

**Files:**

- `src/api/booksApi.test.ts` -- assert `list({ isbn })` hits `/books?isbn=...`, omit empty/`undefined`, combine with
  `includeDeleted` when both are set, and preserve abort-signal behavior.
- `src/api/booksQueries.test.tsx` and/or `serverStateQueries.test.tsx` -- assert query key / `enabled` behavior only
  if `useBooks` options change in a way that needs coverage.

No new feature-route tests are required solely for type regeneration.

### 4. Contract docs and ticket wording that still assume book-level loan fields (should)

Stale references still mention clearing or editing `borrower` / `datetime_loaned_out` on books. Update wording to
match the current API (loan rows own borrower / checkout timing; book `status` still flips on checkout/check-in):

- `docs/tickets/FEAT-08_checkin-and-loan-history.md` -- success/conflict notes that still say book
  `borrower` / `datetime_loaned_out` are cleared or patched.
- `docs/tickets/FEAT-09_reading-tracking.md` -- "never include loan-related properties" list.
- `docs/tickets/FEAT-10_book-edit-delete-and-restore.md` -- PATCH / edit-payload exclusions and soft-delete PATCH
  notes that still list `borrower`.
- `docs/product-docs/PLAN.md` -- generic-form guidance that still names `datetime_loaned_out` as a book field to
  hide (rephrase to "do not drive loan state via book PATCH / do not invent book-level borrower fields").
- `docs/AGENTS.md` (and `docs/prompt-master-context.md` if it still mirrors the same inventory) -- only if this chore
  changes API-layer inventory (e.g., `booksApi.list` optional `isbn`) or the "next / in progress" CHORE status.

Do not rewrite product intent beyond contract accuracy. Prefer small surgical edits.

### 5. Source audit (verify; change only if something fails)

Confirm no application code still types or renders `BookRead.borrower` / `BookRead.datetime_loaned_out`. Current
product paths appear clean; fixtures that place `borrower` on `LoanRead` / `CheckoutRequest` are correct and should
stay.

If `yarn api:generate` or `make typecheck` surfaces a real type error, fix the offending call site rather than
widening types.

## Files summary

| Path | Change |
|------|--------|
| `src/api/generated/openapi.ts` | Regenerate from checked-in OpenAPI (`yarn api:generate`) |
| `src/api/booksApi.ts` | Optional: `ListBooksOptions.isbn` → `?isbn=` |
| `src/api/queryKeys.ts` | Optional: list key includes `isbn` when used |
| `src/api/booksQueries.ts` | Optional: `useBooks({ isbn })` passthrough |
| `src/api/booksApi.test.ts` (and query tests if needed) | Optional: cover isbn query encoding / omission |
| `docs/tickets/FEAT-08_*.md`, `FEAT-09_*.md`, `FEAT-10_*.md` | Fix stale book loan-field wording |
| `docs/product-docs/PLAN.md` | Fix stale book loan-field wording if still present |
| `docs/AGENTS.md` | Update only if inventory / CHORE status changes |

Unlikely to need changes: `apiTypes.ts` aliases, `requestFields.ts`, `loansApi.ts`, checkout / check-in / loans
feature UI, connection/auth, backup download, ISBN lookup create flow.

## Implementation notes

- Authority order for disagreements: current repo → this ticket → running `/openapi.json` → checked-in OpenAPI →
  `API-for-FE.md` → planning docs.
- Never simulate checkout, check-in, mark-read, or restore with generic `PATCH`.
- Prefer omitting empty optional query params (`isbn`, `book_id`) rather than sending blank strings (blank `isbn` is
  documented as `400`).
- `API-for-FE.md` may say schemas live in `docs/openapi.json` (backend-relative). Frontend generation continues to
  use `docs/technical-reference/openapi.json` via `package.json` scripts; do not move that path in this chore.
- Keep secrets and redaction behavior unchanged (`borrower` remains a redacted diagnostic field because checkout and
  loans still carry it).

## Acceptance criteria

1. `yarn api:check` passes (generated `openapi.ts` matches OpenAPI with no hand edits).
2. Typecheck succeeds with the regenerated schemas; no remaining references to removed book fields as
   `BookRead` / `BookCreate` / `BookUpdate` properties.
3. Existing loans helpers still work unchanged (`list` / `list({ bookId })` / `get`).
4. If optional `isbn` list support is added: empty/`undefined` omits the query param; non-empty values call
   `GET /books?isbn=...`; existing `includeDeleted` callers keep working; tests cover the encoding.
5. Ticket/PLAN/AGENTS wording no longer instructs the FE to read or PATCH book-level `borrower` /
   `datetime_loaned_out`.
6. No new catalog search UI, pagination, or out-of-scope product features are introduced.
7. `make check` passes (or the same quality gate the repo currently requires before handoff).

## Out of scope

- FEAT-08 remaining check-in / loan-history UI polish (eligibility, Field-linked `422`, due/overdue presentation).
- FEAT-09 reading completion UI, FEAT-10 edit/delete/restore/backup UI, FEAT-11 dashboard UI.
- Catalog search/filter/sort surfaces that would consume `isbn` filtering in the books page.
- Backend changes, OpenAPI authoring in the backend repo, or inventing correlation-id / pagination behavior.
- Replacing Yarn, React Query, or the FEAT-03 typed client.

## Risks

- **Doc-only drift:** Leaving FEAT-08/09/10 wording stale will cause the next feature agent to reintroduce book-level
  borrower fields. Prefer fixing those sentences in this chore.
- **Query-key shape:** If `isbn` is added to `useBooks`, ensure invalidation via `queryKeys.books.all` still covers
  all list variants (same prefix pattern as today).
- **False "large update" scope:** Resist rewriting loans or checkout; they already match the current contract.

## Plan coverage

Supports PLAN borrowing / loan ownership and FEAT-03 transport hygiene. Not a product workstream by itself.
