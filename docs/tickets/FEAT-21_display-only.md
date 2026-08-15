# FEAT-21 -- Display-only checkout errors and alternate-copy offers

## Objective

Handle the backend's checkout **412** when a book is `status=display_only`, and when that happens (or when the
operator is already looking at a display-only book on `/checkout`) use `GET /books` list filters to find another
copy or edition that **can** be checked out instead.

This ticket owns the product UX for display-only checkout recovery. `docs/tickets/FEAT-10_update-api.md` may already
cover regenerating OpenAPI types, wiring `author` / `title` list params into `booksApi`, and a defensive **412**
refetch path; if those pieces landed there, reuse them and implement the alternate-copy offer here. If they have not
landed, implement the prerequisites listed below rather than blocking.

## Dependencies

FEAT-07 checkout, FEAT-05 ISBN Find on `/checkout`, and CHORE-01 `booksApi.list({ isbn })` / `useBooks({ isbn })` are
complete. Prefer landing FEAT-10's typed-list and contract sync first when that ticket is still open.

Do not pull FEAT-12 hardening, FEAT-13 journey automation, FEAT-14 CI, FEAT-15 Podman, FEAT-16 release artifacts,
FEAT-17 About/homepage, FEAT-18 collection filter/sort UX, FEAT-19 wishlists, or FEAT-20 dashboard reports into this
ticket. Do not invent a dedicated "alternate edition" or "work" API -- the backend has none.

## Contract references

Treat these as complementary:

- `../technical-reference/openapi.json` -- `POST /books/{id}/checkout` responses include **412** (precondition
  failed). `GET /books` accepts optional `isbn`, `author`, and `title` query params (plus existing pagination/sort /
  `include_deleted` / `category`). `Status` enum includes `display_only`.
- `../technical-reference/API-for-FE.md` -- behavioral rules OpenAPI does not fully express:
  - Checkout of `status=display_only` → **412** `{"detail": "Book is display only"}`; no loan is created; status is
    unchanged.
  - Empty/whitespace `isbn`, `author`, or `title` on `GET /books` → **400** (omit blanks client-side).
  - `isbn`: literal substring match on stored `isbn13` (not create/lookup normalization).
  - `author` / `title`: case-insensitive substring match; both may be sent together (all predicates must match).
  - For alternate-copy lookup: use `isbn` for shared-ISBN copies; use `author` + `title` for another edition of the
    same work. Exclude the current book and prefer `status=available` when presenting a checkout substitute.
  - Soft-deleted books stay omitted unless `include_deleted=true` (do not use that flag for checkout substitutes).

Confirm against a representative running backend `/openapi.json` before locking transport types; record drift as a
blocker rather than inventing frontend semantics.

## Current baseline

Already in place and should be reused (not rebuilt):

- `/checkout` via `CheckoutPage` + `checkoutModel` + `useCheckoutBook` / `booksApi.checkout`.
- Eligibility: `deletion_date === null` and `status === 'available'` (`isCheckoutEligible`). Soft-deleted and
  non-available books (including `display_only`) are not offered in the selector.
- Detail "Check Out" gated the same way on `BookDetailsPage` (no link when `display_only`).
- ISBN Find on `/checkout` via checksum-gated `useBooks({ isbn })` / `compactIsbnForListFilter` (never
  `GET /books/lookup` for library selection).
- `handleCheckoutError` special-cases **422** (Field-linked), **409** (already checked out + stale refetch), and
  **404** (missing + stale refetch). **412** currently falls through to a generic `error.message` path and does not
  refetch or offer substitutes.
- `booksApi.list` / `useBooks` / `queryKeys.books.list`: optional `isbn` today. `author` / `title` may already be
  wired by FEAT-10 -- verify before editing; if missing, add them as a prerequisite in this ticket.
- Shared UI: `Alert`, `AppLink`, `Button`, `Field`, `LoadingState`, `QueryErrorState`, `ConfirmationDialog`.
- Status display already includes `display_only` in `BookDetailsPage` `STATUS_VALUES` / `enumDisplayValue`.

## Product intent

When checkout is blocked because the selected book is display-only, the operator should:

1. **Understand why** -- see a clear message that this copy is display-only and cannot be checked out (server detail
   `Book is display only` is acceptable; do not invent a different status code or invent loan creation).
2. **Keep their form** -- borrower and optional checkout fields stay filled after the **412** (same preservation
   pattern as **404** / **409**).
3. **See alternate copies/editions that can be checked out** -- the UI queries:
   - `GET /books?isbn={substring}` when the blocked book has a usable `isbn13` (compact punctuation only via
     `compactIsbnForListFilter`; do not rewrite digits or call lookup), and/or
   - `GET /books?author={authors}&title={title}` using the blocked book's authors and title strings (trimmed;
     omit a filter when blank so the FE never triggers **400**).
4. **Switch to an eligible substitute** -- from those results, exclude the blocked book id, keep only
   FEAT-07-eligible rows (`deletion_date === null` and `status === 'available'`), and let the operator select one
   (update `?bookId=` / selection the same way ISBN Find single/multi-match does). Prefer showing ISBN matches first
   when both strategies return rows; author+title is the fallback for other editions.
5. **Get an honest empty outcome** -- if no eligible alternate exists, say so without implying checkout succeeded or
   inventing a second catalog search product.

Also cover the pre-mutate path: a deep-linked or stale-selected `display_only` book should use the existing
non-eligible warning UI, mention display-only explicitly, and may run the same alternate lookup without requiring a
failed mutate first.

Tone and layout: extend the existing checkout page (alerts + short chooser, same spirit as ISBN Find multi-match).
Do not build a general catalog search UI, modal library, or `/books` filter surface (that is FEAT-18).

## Out of scope

- Changing which books appear in the main eligible selector (still `available` only).
- Allowing checkout of `display_only` books, or simulating checkout with generic `PATCH`.
- Collection browse filters/sort on `/books` (FEAT-18).
- Wishlists, dashboard reports, editing a book's status to/from `display_only` as a dedicated admin tool (edit
  metadata may already send `status` only if FEAT-10 / edit flows allow it -- do not expand that here).
- Multi-library / multi-copy product features beyond "offer another matching row from `GET /books`".

## Remaining scope (file-level plan)

### 1. Prerequisite -- list filters and contract (only if FEAT-10 incomplete)

| File | Change |
| ---- | ------ |
| `src/api/generated/openapi.ts` | Ensure regenerated so checkout **412** and `GET /books` `author` / `title` params are typed. Do not hand-edit; use `yarn api:generate`. |
| `scripts/contractSmoke.test.ts` | Keep expected paths in sync with checked-in OpenAPI if regenerate requires it. |
| `src/api/booksApi.ts` | If missing: extend `ListBooksOptions` with optional `author?: string` and `title?: string`; serialize query params; omit `undefined` / `''` / whitespace-only (same rule as `isbn`). |
| `src/api/queryKeys.ts` | Include optional `author` / `title` in `books.list` / `infiniteList` keys when present (mirror `isbn`). |
| `src/api/booksQueries.ts` | Thread `author` / `title` through `useBooks` / `useInfiniteBooks`. |
| `src/api/booksApi.test.ts` / `booksQueries.test.tsx` | Cover serialization, blank omission, and key isolation for the new filters. |
| `src/api/booksApi.conflicts.test.ts` (and/or `booksApi.test.ts`) | Assert `POST .../checkout` **412** surfaces as `ApiError` with `status: 412` and detail `Book is display only` (same pattern as existing **409** coverage). |

Skip this section when FEAT-10 already delivered these pieces; verify in-repo before duplicating.

### 2. Alternate-copy lookup model (pure helpers)

| File | Change |
| ---- | ------ |
| `src/features/loans/displayOnlyAlternatives.ts` (new) | Pure helpers, e.g.: `buildIsbnAlternateQuery(book)` → compacted isbn or `null`; `buildAuthorTitleAlternateQuery(book)` → `{ author, title }` or `null` when either required string is blank after trim; `filterCheckoutAlternatives(items, blockedBookId)` → eligible books excluding `blockedBookId`, `deletion_date === null`, `status === 'available'`; optional merge helper that prefers ISBN hits then author+title hits without duplicate ids. Reuse `isCheckoutEligible` logic (export shared eligibility from `CheckoutPage` into a small shared module if needed to avoid drift -- e.g., `checkoutEligibility.ts` -- only if it stays small). |
| `src/features/loans/displayOnlyAlternatives.test.ts` (new) | Unit tests: blank isbn/authors/title → no query; punctuation-only isbn compaction; exclude blocked id; drop non-available / deleted; dedupe when both strategies overlap. |

Do not call the network from these helpers; pages/hooks own fetching.

### 3. Checkout page -- **412** handling and alternate offer UI

| File | Change |
| ---- | ------ |
| `src/features/loans/routes/CheckoutPage.tsx` | In `handleCheckoutError`, treat **412** like a documented precondition failure: refetch eligible books/loans (reuse `refetchStaleLoanState`), preserve form values, set a clear display-only form error (server detail acceptable). Then enable alternate lookup for the blocked `bookId` (from detail cache / selected book): when isbn query is available, `useBooks({ isbn, enabled })`; when author+title query is available, `useBooks({ author, title, enabled })` (two queries or sequential -- prefer enabled flags driven by "blocked display-only" state so idle checkout does not spam filters). Present eligible alternatives in a short chooser (title / authors / status / shelf as needed); selecting one updates selection / `?bookId=` without clearing borrower fields. If both queries return zero eligible rows, show an explicit "no other available copy" message. For pre-mutate deep-link / selected `display_only`, reuse non-eligible warning copy that names display-only and may run the same alternate path. |
| `src/features/loans/routes/CheckoutPage.test.tsx` | Cover: mutate **412** preserves form, refreshes state, shows display-only messaging; alternate ISBN query offers an available sibling and selection switches book; author+title fallback when isbn absent or ISBN query has no eligible rows; zero alternatives messaging; `display_only` never appears in the main eligible list; existing **404** / **409** / **422** / ISBN Find cases remain green. |
| `src/features/loans/checkoutEligibility.ts` (optional extract) | If extracting `isCheckoutEligible` from `CheckoutPage`, move it here with a colocated test and import from both the page and `displayOnlyAlternatives`. |

### 4. Detail page gating (confirm-only unless copy is wrong)

| File | Change |
| ---- | ------ |
| `src/features/books/routes/BookDetailsPage.tsx` | Confirm "Check Out" remains gated to active + `available` only (no link for `display_only`). Update nearby copy only if the page currently implies every non-loaned book can be checked out. Optional: short status note that display-only copies stay in the library but cannot be loaned -- keep minimal. |
| `src/features/books/routes/BookDetailsPage.test.tsx` | Assert no Check Out action when `status === 'display_only'` (add if missing). |

### 5. Error presentation

| File | Change |
| ---- | ------ |
| `src/api/apiErrors.ts` | No new `ApiErrorKind` required for **412** (keep `http`). Prefer page-level copy in `CheckoutPage` over changing `formatApiQueryError` globally. |
| `src/api/apiClient.test.ts` | Optional: one assertion that a **412** JSON body maps to `ApiError` kind `http` with detail preserved. |

### 6. Docs hygiene (after implementation)

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Document checkout **412** / display-only handling and that `/checkout` may offer substitutes via `isbn` and `author`+`title` list filters. Note `displayOnlyAlternatives` (and any eligibility extract). Mark this ticket complete or remove the file per project convention when done. |
| `docs/tickets/FEAT-10_update-api.md` | If still present: treat its "optional alternate copies" line as superseded by this ticket so implementers do not build the offer twice. |
| `docs/ToDo.md` | Optional checklist line; prefer ticket presence under `docs/tickets/` as the source of truth. |

## Acceptance criteria

- Checkout mutate **412** with detail `Book is display only` is handled explicitly: form input preserved, eligible
  books/loans refreshed, and an understandable display-only message is shown.
- After a display-only block (mutate **412** and/or selected/deep-linked `display_only` book), the UI queries
  `GET /books?isbn=...` when `isbn13` is usable and/or `GET /books?author=...&title=...` using the blocked book's
  authors and title.
- Blank/whitespace filters are never sent.
- Alternate results exclude the blocked book and only offer FEAT-07-eligible (`available`, not deleted) rows.
- Selecting an alternate updates checkout selection without clearing borrower/optional fields.
- Zero eligible alternates produces an honest empty message (no invented success).
- Main eligible selector and detail "Check Out" still never offer `display_only` as check-out-ready.
- Never simulate checkout with generic `PATCH`; never use `GET /books/lookup` for alternate selection.
- Colocated tests cover helpers, **412** handling, ISBN and author+title alternate paths, and empty alternates.
- `make check` passes.

## Plan coverage

Display-only checkout recovery against the documented **412** contract, plus alternate-copy/edition offers using
existing `GET /books` filters. Explicitly excludes collection filter UX, wishlists, and unrelated FEAT-12..20 work.
