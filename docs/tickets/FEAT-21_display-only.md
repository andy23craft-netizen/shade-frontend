# FEAT-21 -- Display-only checkout errors and alternate-copy offers

## Objective

When checkout is blocked because a book is `status=display_only` (**412**), offer another copy or edition that
**can** be checked out by querying `GET /books` with `isbn` and/or `author` + `title` filters.

Defensive **412** refetch/messaging, typed list filters, detail/checkout gating, and pre-mutate display-only warnings
are already shipped. This ticket owns the **alternate-copy offer UX** on `/checkout`.

## Dependencies

FEAT-07 checkout, checkout Find-by-ISBN (`useBooks({ isbn })`), and API list filters (`author` / `title` / `isbn`)
are complete. Shelves catalog CRUD on `/shelves` is complete -- alternate choosers may show Title Case `shelf_name`,
but do not invent shelf-based alternate search (API has no `shelf=` filter).

Do not pull journey automation, CI, Podman, release artifacts, FEAT-17 About/homepage, FEAT-18 collection
filter/sort UX, FEAT-19 wishlists, or FEAT-20 dashboard reports into this ticket. Do not invent a dedicated
"alternate edition" or "work" API -- the backend has none.

## Contract references

Treat these as complementary:

- `../technical-reference/openapi.json` -- `POST /books/{id}/checkout` responses include **412** (precondition
  failed). `GET /books` accepts optional `isbn`, `author`, and `title` query params (plus existing pagination/sort /
  `include_deleted` / `category`). `Status` enum includes `display_only`. Books expose `shelf_name` (string
  membership), not a shelf enum.
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

## Shipped baseline (reuse, do not rebuild)

- `/checkout` via `CheckoutPage` + `checkoutModel` + `useCheckoutBook` / `booksApi.checkout`. Reachable from the
  Circulation drawer and book-detail deep links.
- Eligibility: `deletion_date === null` and `status === 'available'` (`isCheckoutEligible` in `CheckoutPage`).
  Soft-deleted and non-available books (including `display_only`) are not offered in the main selector.
- Detail "Check Out" gated to active + `available` only on `BookDetailsPage` (tested; no link for `display_only`).
- ISBN Find on `/checkout` via checksum-gated `useBooks({ isbn })` / `compactIsbnForListFilter` (never
  `GET /books/lookup` for library selection).
- `handleCheckoutError` special-cases **412**: stale-state refetch (books + loans), preserved form input, and surfaces
  `Book is display only` with a pointer to Find by ISBN. It does **not** yet run author+title alternate queries or
  present an automatic substitute chooser.
- Pre-mutate deep links to `display_only` books show a warning that names display-only and points at Find by ISBN;
  they do **not** yet run automatic alternate lookup.
- `booksApi.list` / `useBooks` / `queryKeys.books.list`: optional `isbn`, `author`, `title`, `category`, pagination,
  and `sortBy` including `shelf` are wired; blank filters are omitted (covered in `booksApi.test.ts` and
  `booksApi.conflicts.test.ts` including checkout **412**).
- Shared UI: `Alert`, `AppLink`, `Button`, `Field`, `LoadingState`, `QueryErrorState`, `ConfirmationDialog`.
  Status display includes `display_only` via `enumDisplayValue`; reuse `formatShelfCommonNameForDisplay` when showing
  alternate rows.

## Product intent

When checkout is blocked because the selected book is display-only, the operator should:

1. **Understand why** -- keep the existing **412** message and pre-mutate warning; extend with substitutes rather
   than replacing the **412** path.
2. **Keep their form** -- borrower and optional checkout fields stay filled after the **412** (same preservation
   pattern as **404** / **409**).
3. **See alternate copies/editions that can be checked out** -- the UI queries:
   - `GET /books?isbn={substring}` when the blocked book has a usable `isbn13` (compact punctuation only via
     `compactIsbnForListFilter`; do not rewrite digits or call lookup), and/or
   - `GET /books?author={authors}&title={title}` using the blocked book's authors and title strings (trimmed;
     omit a filter when blank so the FE never triggers **400**).
4. **Switch to an eligible substitute** -- from those results, exclude the blocked book id, keep only
   checkout-eligible rows (`deletion_date === null` and `status === 'available'`), and let the operator select one
   (update `?bookId=` / selection the same way ISBN Find single/multi-match does). Prefer showing ISBN matches first
   when both strategies return rows; author+title is the fallback for other editions. Row presentation may include
   Title Case `shelf_name` for disambiguation.
5. **Get an honest empty outcome** -- if no eligible alternate exists, say so without implying checkout succeeded or
   inventing a second catalog search product.

Also cover the pre-mutate path: a deep-linked or stale-selected `display_only` book should run the same alternate
lookup without requiring a failed mutate first.

Tone and layout: extend the existing checkout page (alerts + short chooser, same spirit as ISBN Find multi-match).
Do not build a general catalog search UI, modal library, or `/books` filter surface (that is FEAT-18). Do not
route operators through `/shelves` for this recovery path.

## Out of scope

- Changing which books appear in the main eligible selector (still `available` only).
- Allowing checkout of `display_only` books, or simulating checkout with generic `PATCH`.
- Collection browse filters/sort on `/books` (FEAT-18).
- Shelves catalog CRUD (already `/shelves`).
- Wishlists, dashboard reports, editing a book's status to/from `display_only` as a dedicated admin tool.
- Multi-library / multi-copy product features beyond "offer another matching row from `GET /books`".

## Remaining scope (file-level plan)

### 1. Alternate-copy lookup model (pure helpers)

| File | Change |
| ---- | ------ |
| `src/features/loans/displayOnlyAlternatives.ts` (new) | Pure helpers, e.g.: `buildIsbnAlternateQuery(book)` → compacted isbn or `null`; `buildAuthorTitleAlternateQuery(book)` → `{ author, title }` or `null` when either required string is blank after trim; `filterCheckoutAlternatives(items, blockedBookId)` → eligible books excluding `blockedBookId`, `deletion_date === null`, `status === 'available'`; optional merge helper that prefers ISBN hits then author+title hits without duplicate ids. Reuse `isCheckoutEligible` logic (export shared eligibility from `CheckoutPage` into a small shared module if needed to avoid drift -- e.g., `checkoutEligibility.ts` -- only if it stays small). |
| `src/features/loans/displayOnlyAlternatives.test.ts` (new) | Unit tests: blank isbn/authors/title → no query; punctuation-only isbn compaction; exclude blocked id; drop non-available / deleted; dedupe when both strategies overlap. |

Do not call the network from these helpers; pages/hooks own fetching.

### 2. Checkout page -- alternate offer UI on top of existing **412** handling

| File | Change |
| ---- | ------ |
| `src/features/loans/routes/CheckoutPage.tsx` | Keep existing **412** refetch + messaging. Extend the display-only recovery path to enable alternate lookup for the blocked `bookId` (from detail cache / selected book): when isbn query is available, `useBooks({ isbn, enabled })`; when author+title query is available, `useBooks({ author, title, enabled })` (two queries or sequential -- prefer enabled flags driven by "blocked display-only" state so idle checkout does not spam filters). Present eligible alternatives in a short chooser (title / authors / status / Title Case shelf as needed); selecting one updates selection / `?bookId=` without clearing borrower fields. If both queries return zero eligible rows, show an explicit "no other available copy" message (stronger than only pointing at Find by ISBN). For pre-mutate deep-link / selected `display_only`, reuse non-eligible warning copy that names display-only and run the same alternate path. |
| `src/features/loans/routes/CheckoutPage.test.tsx` | Cover: mutate **412** preserves form, refreshes state, shows display-only messaging; alternate ISBN query offers an available sibling and selection switches book; author+title fallback when isbn absent or ISBN query has no eligible rows; zero alternatives messaging; pre-mutate `display_only` deep link runs alternate lookup; `display_only` never appears in the main eligible list; existing **404** / **409** / **422** / ISBN Find cases remain green. |
| `src/features/loans/checkoutEligibility.ts` (optional extract) | If extracting `isCheckoutEligible` from `CheckoutPage`, move it here with a colocated test and import from both the page and `displayOnlyAlternatives`. |

### 3. Documentation (when the feature lands)

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Document that `/checkout` offers substitutes via `isbn` and `author`+`title` list filters after display-only blocks. Note `displayOnlyAlternatives` (and any eligibility extract). Remove this ticket file per project convention when done. |
| `docs/full-project-context.md` | Same alternate-copy notes when that pack is kept current. |
| `docs/ToDo.md` | Mark the FEAT-21 checklist item done when maintainers still use that file. |

## Acceptance criteria

- After a display-only block (mutate **412** and/or selected/deep-linked `display_only` book), the UI queries
  `GET /books?isbn=...` when `isbn13` is usable and/or `GET /books?author=...&title=...` using the blocked book's
  authors and title.
- Blank/whitespace filters are never sent.
- Alternate results exclude the blocked book and only offer checkout-eligible (`available`, not deleted) rows.
- Selecting an alternate updates checkout selection without clearing borrower/optional fields.
- Zero eligible alternates produces an honest empty message (no invented success).
- Existing **412** handling (form preservation, refetch, display-only messaging), main eligible selector gating, and
  detail "Check Out" gating remain intact.
- Never simulate checkout with generic `PATCH`; never use `GET /books/lookup` for alternate selection.
- Colocated tests cover helpers, alternate ISBN and author+title paths, zero alternates, and pre-mutate lookup.
- `make check` passes.

## Plan coverage

Display-only checkout recovery against the documented **412** contract, plus alternate-copy/edition offers using
existing `GET /books` filters. Explicitly excludes collection filter UX, wishlists, shelves catalog work, and
unrelated FEAT-13..20 work.
