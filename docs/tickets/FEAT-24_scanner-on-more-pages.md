# FEAT-24 -- Hardware ISBN scan on Dashboard, Books, and Loans

## Objective

On Dashboard (`/dashboard`), Books (`/books`), and Loans (`/loans`), a hardware barcode scan (or equivalent keyboard-wedge
digit burst) should take the operator to the matching book. Navigate to `/books?isbn={compactedIsbn}`, filter the
active collection with `GET /books?isbn=`, and if that filter returns exactly one book, open `/books/{bookId}`.

This is a third hardware-capture surface. It does not add camera UI, does not call `GET /books/lookup`, and never
creates or checks out a book from a successful scan.

## Dependencies

FEAT-04 collection browse, FEAT-06 scanning, and checkout ISBN Find are complete:

- `useHardwareIsbnScanner` / `IsbnScannerParser` (Enter terminator, inter-key timeout, checksum via `isbn.ts`)
- `compactIsbnForListFilter` and `useBooks({ isbn })` / `useInfiniteBooks({ isbn })` / `booksApi.list({ isbn })`
- `/books` via `BooksPage` + `useInfiniteBooks({ sortBy, sortOrder })` with URL params `sortBy` and `sortOrder` only

Do not pull FEAT-15 Podman, FEAT-16 release artifacts, FEAT-17 About / homepage, FEAT-18 category/author/title filter
UI, FEAT-19 wishlists, FEAT-20 dashboard reports, FEAT-21 display-only alternate copies, FEAT-22 check-in
consolidation, or FEAT-23 checkout-on-details into this implementation. Update sibling tickets that currently say
ISBN list-filter lives only on checkout (FEAT-18) so later work does not fight this URL param.

FEAT-17 About homepage is complete: `/` is About; the dashboard is `/dashboard`. Capture belongs on `DashboardPage`
at `/dashboard`, not on `/`. FEAT-18 category/author/title filter UI is complete on `/books`; this listener must
ignore editable targets so those fields stay usable. FEAT-22 may add a return-time field on `/loans`; same ignore
rule.

## Contract references

No new backend endpoints. Treat these as complementary and leave them in place:

- `../technical-reference/openapi.json` -- `GET /books` optional `isbn` (plus existing pagination and sort).
- `../technical-reference/API-for-FE.md` -- `isbn` is a literal substring on stored `isbn13` (not create/lookup
  normalization). Empty/whitespace `isbn` → **400** (omit blanks client-side). No matches → empty `BookList`
  (`items: []`, `total: 0`), not **404**. Soft-deleted books stay omitted unless `include_deleted=true` (never send
  that from `/books`). Do not convert ISBN-10 to ISBN-13 in the list filter (`compactIsbnForListFilter` strips
  punctuation only).

Do not invent a dedicated "find book by scan" API. Collection filter is `GET /books?isbn=`. Detail is
`GET /books/{id}` after unique-match navigation.

## Current baseline

Already in place and should be reused (not rebuilt):

- Hardware wedge capture: `IsbnScannerParser` buffers `[0-9Xx -]`, finishes on Enter, resets on inter-key timeout
  (default 100ms), and emits only checksum-valid ISBN-10 / ISBN-13. `useHardwareIsbnScanner` listens on `window`
  `keydown`. Today it is mounted only from `NewBookPage` and `CheckoutPage`. Those callers do **not** ignore focused
  inputs (a scan can fill the ISBN field) and do **not** `preventDefault` ("ordinary typing is not swallowed").
- Camera capture stays lazy-loaded from `/books/new` and `/checkout` only (`IsbnCameraScanner`). Support matrix:
  `docs/baselines/FEAT-06_scanner-support.md`.
- `/dashboard` `DashboardPage`: metrics, Refresh, no text fields. After client-side navigation, `AppShell` focuses
  the `h1`. `/` is the About homepage, not the dashboard.
- `/books` `BooksPage`: infinite active collection, sort `<select>`s, and URL-backed category / author / title filter
  controls (`BooksListControls`). URL search today: `sortBy`, `sortOrder`, and filter params -- not `isbn`.
  `useInfiniteBooks` already accepts `isbn` but the page never passes it. Unfiltered `total === 0` is "Your library
  is empty" + Add Book (via Collection → Manage or direct `/books/new`).
- `/loans` `LoansPage`: infinite active/returned loans, no text fields (until FEAT-22).
- Checkout ISBN Find: checksum-gated `useBooks({ isbn })` with `compactIsbnForListFilter`; single eligible match
  auto-selects. That Find path stays on checkout; this ticket does not change checkout.
- ISBN helpers: `isValidIsbn` / `compactIsbnForListFilter` in `src/features/books/utils/isbn.ts`.
- Shared UI: `Alert`, `AppLink`, `Button`, `EmptyState`, `LoadingState`, `QueryErrorState`. Collection card CSS
  already on `BooksPage`.

The gap: a wedge scan on Dashboard, Books, or Loans is ignored (no listener). Operators must open Add Book or
Check Out to use the scanner, which is the wrong destination when they already own the book and want its details.

## Product intent

1. **Scan-to-book on the three no-text-field pages** -- Dashboard, Books, and Loans. If the operator scans a
   Bookland / ISBN barcode (keyboard wedge ending in Enter), Shade should open that copy's details when the library
   has exactly one match.
2. **Books list is the filter surface** -- the scan always applies `isbn` on `/books` first
   (`/books?isbn={compacted}`). Unique-match then replace-navigates to `/books/{bookId}`. Zero or many matches stay
   on the filtered list so the operator can choose or clear.
3. **Complete a scan before filtering** -- "begins typing numbers" means hardware-wedge / keyboard capture of ISBN
   characters on these pages, not navigation on the first digit. `GET /books?isbn=` is a **substring** match on
   `isbn13`. Filtering or unique-opening on a prefix (e.g., `9`) would jump to the wrong book or fire on accidental
   keypresses. Reuse the existing parser: ISBN characters + Enter terminator + checksum. Invalid checksums are
   dropped silently, same as `/books/new` and `/checkout` hardware paths.
4. **Do not steal typing from form controls** -- ignore `keydown` when the event target is an editable control
   (`input`, `textarea`, `select`, or `contenteditable`). Books already has sort selects and FEAT-18 filter fields;
   FEAT-22 may add a return-time field on `/loans`. Modifier chords (`Ctrl` / `Meta` / `Alt`) must not start a scan.
5. **Do not activate focused buttons** -- Dashboard Refresh and nav links can have focus. `preventDefault` consumed
   ISBN keys and a completing Enter so the scan does not click Refresh or follow a focused link. This preventDefault
   behavior is **opt-in** for this capture surface only; leave New Book / Checkout "ordinary typing is not
   swallowed" as they are today.
6. **Honest zero / many outcomes** -- no match: filtered empty state, not "library is empty". Several copies sharing
   an ISBN: show the filtered collection; do not pick a winner. Soft-deleted copies stay excluded (active collection).
7. **No camera, no lookup, no mutate** -- no "Scan ISBN" button on these pages. Do not call `GET /books/lookup`.
   Never `POST /books` or checkout/check-in from this flow.

Suggested composition (implementer-owned layout; keep ISBN out of a typed search box):

- Shared hook `useCollectionIsbnJump` called from `DashboardPage`, `BooksPage`, and `LoansPage` only.
- On detect: compact the ISBN, set `/books?isbn=...`. If already on `/books`, keep `sortBy` / `sortOrder` and
  replace the current entry. If coming from `/dashboard` or `/loans`, push `/books?isbn=...` (Back returns to the
  page they scanned from).
- `BooksPage` reads `isbn` from the URL, passes it to `useInfiniteBooks({ isbn, sortBy, sortOrder })`. When the
  query succeeds, `total === 1`, and the param is a checksum-valid ISBN, replace-navigate to that book's detail so
  Back skips the one-row list. Guard with a ref so refetch does not loop. Do not unique-open for a non-ISBN `isbn`
  param (substring-only URLs just filter).
- While `isbn` is set and unique-open has not fired, show a short status (e.g., "Showing books matching ISBN …")
  plus a Clear control that deletes `isbn` and keeps sort. Not a text field.
- Polite live region when the filter applies, so a screen reader hears that the collection changed.

Tone: extend scanning and `BooksPage`; do not add a global AppShell listener (scanners stay local to feature pages,
matching New Book / Checkout). Do not add a typed ISBN search box (FEAT-18 owns typed author/title/category filters;
this ticket owns scan-driven `isbn` URL param only).

## Out of scope

- Camera capture on Dashboard, Books, or Loans.
- `GET /books/lookup`, ISBN-10 → ISBN-13 conversion, or changing `compactIsbnForListFilter`.
- Creating, checking out, or checking in from scan success.
- Typed ISBN search box or changes to FEAT-18 author/title/category filter UI, or `include_deleted` on `/books`.
- Listening on `/books/:bookId`, `/books/new`, `/checkout`, `/shelves`, admin, or other routes.
- Changing New Book lookup or Checkout Find enablement (except sharing parser/hook option types).
- FEAT-21 alternate copies, FEAT-22 / FEAT-23 circulation IA (beyond the ignore-editable rule those tickets will
  need).

## Remaining scope (file-level plan)

### 1. Parser / hardware hook -- opt-in ignore and preventDefault

| File | Change |
| ---- | ------ |
| `src/features/scanning/isbnScannerParser.ts` | Extend `IsbnScannerParserResult` with `consumed: boolean` (`true` when the key was an ISBN character appended to the buffer, or Enter that ran `finish()`, including invalid/empty finish). Non-ISBN keys stay `consumed: false` with `isbn: null`. Do not change checksum rules or the 100ms timeout reset. |
| `src/features/scanning/isbnScannerParser.test.ts` | Cover `consumed` for digits, `X`, hyphen/space, Enter (valid and invalid), and ignored keys (e.g., `a`, `Tab`). Existing ISBN-10 / ISBN-13 / timeout cases stay green. |
| `src/features/scanning/useHardwareIsbnScanner.ts` | Add optional `ignoreEditableTargets?: boolean` (default `false`) and `preventDefaultWhenConsumed?: boolean` (default `false`). When ignore is on, skip `handleKey` if the event has `ctrlKey` / `metaKey` / `altKey` or the target is `input`, `textarea`, `select`, or `contentEditable`. When preventDefault is on, call `event.preventDefault()` only if the parser marked the key `consumed`. Keep `enabled` and `onDetected` as today. New Book / Checkout omit both flags (current behavior). |
| `src/features/scanning/useHardwareIsbnScanner.test.ts` | Cover: ignore focused `input` / `select` does not emit; `Ctrl`+digit does not emit; `preventDefaultWhenConsumed` prevents default on digits and completing Enter, not on `a`; defaults still capture while an input is focused (existing case). Disabled / unmount / invalid ISBN cases stay. |

Do not replace the parser. Do not change camera code.

### 2. Collection-jump hook (local to the three pages)

| File | Change |
| ---- | ------ |
| `src/features/scanning/useCollectionIsbnJump.ts` (new) | Call `useNavigate` / `useLocation` and `useHardwareIsbnScanner` with `ignoreEditableTargets` and `preventDefaultWhenConsumed` true. `onDetected`: `compactIsbnForListFilter(isbn)`; build search params -- if `location.pathname === '/books'`, start from `location.search` and `set('isbn', compacted)` (preserve sort); otherwise `{ isbn: compacted }` only. `navigate({ pathname: '/books', search })` with `replace: location.pathname === '/books'`. Do not fetch here; `BooksPage` owns the list query and unique-open. |
| `src/features/scanning/useCollectionIsbnJump.test.tsx` (new) | Memory-router harness: from `/dashboard` a valid ISBN+Enter navigates to `/books?isbn=9780441172719` (or the
  compacted form); from `/loans` same; from `/books?sortBy=title` replaces and keeps `sortBy`; hyphenated scan is
  compacted; invalid checksum does not navigate; focused input does not navigate. Do not require the full dashboard
  tree for these cases. |
| `src/features/dashboard/routes/DashboardPage.tsx` | Call `useCollectionIsbnJump()` unconditionally (all branches of the page, including loading / error, so a scan still works). |
| `src/features/loans/routes/LoansPage.tsx` | Same: call `useCollectionIsbnJump()` on the page, including loading / error / empty. |
| `src/features/books/routes/BooksPage.tsx` | Call `useCollectionIsbnJump()` in addition to the URL/query work in section 3. |
| `src/layout/AppShell.tsx` | No scanner import. Keep heading focus as-is (focused `h1` is not editable, so a scan after navigation is heard). |

Optional: a tiny `isEditableKeyTarget(target: EventTarget | null)` helper colocated with the hardware hook if the
ignore logic would otherwise duplicate.

### 3. Books page -- `isbn` URL filter and unique-open

| File | Change |
| ---- | ------ |
| `src/features/books/booksListModel.ts` | Add `parseIsbnParam(value: string | null): string | undefined` -- trim, `compactIsbnForListFilter`, blank → `undefined`. Extend `updateListParams` (or a sibling) so ISBN can be set or cleared (`delete('isbn')` when unset) without dropping sort, and keep clearing stale `page`. |
| `src/features/books/booksListModel.test.ts` | Blank / whitespace / punctuation-only compact; hyphenated ISBN round-trip; `null` → unset. |
| `src/features/books/routes/BooksPage.tsx` | Read `isbn` via `parseIsbnParam(searchParams.get('isbn'))`. Pass `isbn` into `useInfiniteBooks` with sort (omit when unset so the query key stays unfiltered). **Unique-open:** when `isbn` is set, `isValidIsbn(isbn)`, query `isSuccess`, `total === 1`, and flattened `books[0]` exists, `navigate(`/books/${books[0].id}`, { replace: true })` once per isbn value (ref). Do not unique-open while pending or on error. **Empty states:** unfiltered `total === 0` stays library-empty + Add Book; `isbn` set and `total === 0` is a filtered empty message plus Clear ISBN (do not imply the library has no books). **Status:** when `isbn` is set and unique-open did not run, show matching-ISBN copy, `total` as the filtered count, and Clear. Preserve sort controls. Infinite scroll keeps the same `isbn` on later pages. |
| `src/features/books/routes/BooksPage.test.tsx` | `useInfiniteBooks` receives `{ isbn }` from `/books?isbn=...`; unique-open navigates to `/books/{id}` when `total === 1` and isbn is valid; `total === 0` with isbn shows filtered empty, not Add Book empty; `total > 1` stays on the list with both titles; invalid/partial isbn param filters but does not unique-open; Clear removes `isbn` and keeps `sortBy`; loading/error do not navigate. Existing sort, ratings, and Title Case shelf coverage stays green. |
| `src/features/books/components/BooksListControls.tsx` | No typed ISBN field. Optional: a read-only status + Clear can live on `BooksPage` instead of this controls row if that keeps sort layout alone. |
| `src/styles/components.css` | Only if the ISBN status/Clear row needs spacing the existing `.books-page__*` classes do not provide. Reuse tokens; no new framework. |

Use API `total === 1` (full matching count), not "first page has one row while `total` is larger".

### 4. Wiring / browser journeys

| File | Change |
| ---- | ------ |
| `src/features/dashboard/routes/DashboardPage.test.tsx` | Keep existing metric tests. Add (or share with the hook suite) one `renderAppTree(['/dashboard'])` journey: mock
  `GET /books?isbn=` to a single fixture book, fire ISBN-13 keydowns + Enter, expect `/books/{id}` (or the filtered
  list then detail). Spy `useCollectionIsbnJump` only if a full journey is too heavy -- prefer a real keydown through
  the mounted page so a missing hook call fails the test. |
| `src/features/loans/routes/LoansPage.test.tsx` | Same wiring guarantee: scan from `/loans` reaches `/books?isbn=` / unique detail. Keep existing infinite-scroll tests. |
| `e2e/isbn-collection-jump.spec.ts` (new) | Playwright: from `/dashboard`, type a fixture ISBN + Enter; with one matching `isbn13` in `mockApi`, land on that
  book's detail heading. Second case: two books sharing the ISBN stay on `/books` with both titles (extend `mockApi`
  seed if needed). Reuse `installMockApi`; do not invent a second fake API. Optional axe pass on the filtered
  many-match list. |
| `e2e/support/mockApi.ts` | List `isbn` today exact-matches `isbn13`. That is enough for full-ISBN e2e. Optional: substring `includes` to closer match the API; not required if tests send the full compacted ISBN. Do not add lookup calls. |
| `e2e/dashboard.smoke.spec.ts` / `e2e/accessibility.spec.ts` | No required change unless the new spec is a better home for the dashboard scan journey. Do not add camera steps. |

### 5. Docs hygiene (as part of this ticket, not a follow-up)

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Scanning also lives on Dashboard / Books / Loans via `useCollectionIsbnJump` (hardware only). `/books` URL may include `isbn`; unique-match opens detail. Still: scan never creates or checks out. Update "Next" remaining tickets to include FEAT-24 until the file is removed after completion. |
| `docs/full-project-context.md` | Same capture and `/books?isbn=` notes when that pack is kept current. |
| `docs/ToDo.md` | Add a checklist line for this ticket. |
| `docs/baselines/FEAT-06_scanner-support.md` | Third capture surface: Dashboard, Books, Loans hardware jump into `/books?isbn=` then unique detail. Camera still
  only `/books/new` and `/checkout`. Manual checklist: scan from `/dashboard`, `/books`, and `/loans`. Note
  ignore-editable + preventDefault on this surface only. |
| `docs/tickets/FEAT-18_sorting-and-filtering.md` | Drop "ISBN filter UI on `/books` is out of scope / checkout-only". FEAT-24 owns scan-driven `isbn` URL +
  unique-open + filtered empty. FEAT-18 still must not add a typed ISBN box; author/title fields must remain usable
  (this ticket's ignore-editable rule). Filtered empty must compose if both ship (`isbn` with category/author/title). |

## Acceptance criteria

- On `/dashboard`, `/books`, and `/loans`, a checksum-valid hardware ISBN (digits / `X` / hyphens, Enter terminator)
  navigates to `/books?isbn={compactIsbnForListFilter(isbn)}`. Invalid checksums do not navigate.
- `/books` passes that `isbn` to `useInfiniteBooks` / `GET /books?isbn=` (active collection only; no
  `include_deleted`). Sort params are preserved when the scan happens on `/books`.
- If the filtered result has `total === 1` and the `isbn` param is a valid ISBN, the app replace-navigates to
  `/books/{bookId}` for that row. Back from detail after a scan that started on Dashboard or Loans returns to that
  page, not a one-row list.
- If `total === 0`, stay on `/books` with a filtered empty state and a way to clear `isbn` (not the Add Book
  library-empty state). If `total > 1`, stay on the filtered list.
- No typed ISBN field is added. Camera is not mounted on these pages. `GET /books/lookup` is not called. Scan
  success does not create, check out, or check in.
- Keystrokes in `input` / `textarea` / `select` / `contenteditable` are not captured. `Ctrl` / `Meta` / `Alt` chords
  are not captured. Consumed scan keys `preventDefault` so focused Refresh / links are not activated.
- `/books/new` and `/checkout` hardware behavior is unchanged (still capture while the ISBN field is focused; still
  no preventDefault unless those pages opt in later).
- Colocated parser, hook, `BooksPage`, and page-wiring tests cover the flow. Playwright covers scan-from-dashboard
  unique-open. `make check` passes.
- `docs/AGENTS.md` and FEAT-06 / FEAT-18 notes describe this capture surface.

## Plan coverage

Extends FEAT-06 hardware capture beyond create/checkout Find, using the existing `GET /books?isbn=` substring filter
as the collection jump. Explicitly excludes camera, lookup, mutations, and FEAT-19 through FEAT-23 product work except
the sibling-doc and ignore-editable notes those tickets need.
