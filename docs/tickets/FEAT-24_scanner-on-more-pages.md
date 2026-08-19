# FEAT-24 -- Hardware ISBN scan on Dashboard, Books, and Loans

## Objective

On Dashboard (`/dashboard`), Books (`/books`), and Loans (`/loans`), a hardware barcode scan (or equivalent
keyboard-wedge digit burst) should take the operator to the matching book. After a checksum-valid scan, query
`GET /books?isbn=` with the compacted ISBN and inspect the returned list length **before** choosing a destination. If
that filter returns exactly one book, navigate directly to `/books/{bookId}` so detail is the only new history entry
and Back returns to the page the operator scanned from. If it returns zero or many books, navigate to
`/books?isbn={compactedIsbn}` so the operator sees the filtered collection. Never push `/books?isbn=` onto the history
stack when the prefetch already resolved to a single match -- the operator must not hit Back and land on a list page
they never saw rendered.

This is a second hardware-capture surface (alongside `/books/new`). It does not add camera UI, does not call
`GET /books/lookup`, and never creates or checks out a book from a successful scan.

## Dependencies

FEAT-04 collection browse and hardware ISBN scanning are complete:

- `useHardwareIsbnScanner` / `IsbnScannerParser` (Enter terminator, inter-key timeout, checksum via `isbn.ts`)
- `compactIsbnForListFilter` and `useBooks({ isbn })` / `useInfiniteBooks({ isbn })` / `booksApi.list({ isbn })`
- `/books` via `BooksPage` + `useInfiniteBooks({ category, author, title, sortBy, sortOrder })` with URL-backed
  category / author / title filters and sort params

FEAT-18 collection filters is complete; do not reference its removed ticket file.

FEAT-17 About homepage is complete: `/` is About; the dashboard is `/dashboard`. Capture belongs on `DashboardPage`
at `/dashboard`, not on `/`.

FEAT-22 check-in consolidation is complete: product check-in is `CheckinForm` on `/loans` (`?bookId=`), including a
return-time `datetime-local` field. FEAT-23 checkout consolidation is complete (ticket file removed): product checkout
is `CheckoutDialog` on `BookDetailsPage`; `/checkout` is `LegacyCheckoutRedirect` only; Circulation drawer is Loans
only. Do not restore `CheckoutPage`, add ISBN Find / camera to checkout, or listen on `/books/:bookId`. Camera and New
Book hardware capture stay on `/books/new` only.

Do not pull FEAT-25 backup removal, FEAT-26 wishlist move-to-shelf, or FEAT-27 Collections into this implementation.

`/books` already has category / author / title filter fields and sort `<select>`s. `/dashboard` has the Healing
Metadata field `<select>`. `/loans` has the Return Card return-time input when `CheckinForm` is open. This listener
must ignore editable targets so those controls stay usable.

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
  (default 100ms), and emits only checksum-valid ISBN-10 / ISBN-13. `IsbnScannerParserResult` is
  `{ isbn: string | null }` (no `consumed` flag yet). `useHardwareIsbnScanner` listens on `window` `keydown` with
  `enabled` and `onDetected` only (no `ignoreEditableTargets` / `preventDefaultWhenConsumed`). Today it is mounted only
  from `NewBookPage`. That caller does **not** ignore focused inputs (a scan can fill the ISBN field) and does **not**
  `preventDefault` ("ordinary typing is not swallowed").
- Camera capture is lazy-loaded from `/books/new` only (`IsbnCameraScanner`). There is no checkout capture surface.
- `/dashboard` `DashboardPage`: summary / breakdown / healing drawers, Refresh, and a Healing Metadata field `<select>`
  (`#dashboard-incomplete-field`). After client-side navigation, `AppShell` focuses `main` (not the `h1`). `/` is the
  About homepage, not the dashboard.
- `/books` `BooksPage`: infinite active collection, sort `<select>`s, and URL-backed category / author / title filter
  controls (`BooksListControls`). URL search today: `sortBy`, `sortOrder`, `category`, `author`, `title` -- not `isbn`.
  `useInfiniteBooks` already accepts `isbn` but the page never passes it. `updateListParams` lives in `BooksPage.tsx`
  (clears stale `page`; does not yet set/clear `isbn`). Unfiltered `total === 0` is "Your library is empty." + Add Book
  (`/books/new`). Filtered `total === 0` is "No books match these filters."
- `/loans` `LoansPage`: infinite active/returned loans plus `CheckinForm` when `?bookId=` is set (Return date and time
  `input type="datetime-local"`). Circulation nav is Loans only.
- ISBN helpers: `isValidIsbn` / `compactIsbnForListFilter` in `src/features/books/utils/isbn.ts`.
- Shared UI: `Alert`, `AppLink`, `Button`, `EmptyState`, `LoadingState`, `QueryErrorState`. Collection card CSS
  already on `BooksPage`.
- Playwright `e2e/support/mockApi.ts` list `isbn` exact-matches `isbn13`. That is enough for full-ISBN e2e.
- `docs/ToDo.md` has no checklist line for this ticket yet. `docs/AGENTS.md` documents
  capture on `/books/new` and `/checkout`; this ticket adds hardware collection-jump on Dashboard / Books / Loans.

The gap: a wedge scan on Dashboard, Books, or Loans is ignored (no listener). Operators must open Add Book to use the
scanner, which is the wrong destination when they already own the book and want its details. `docs/AGENTS.md` still
describes camera/hardware on `/checkout`; that page is gone -- this ticket's docs hygiene should drop that and describe
the collection-jump surface instead.

## Product intent

1. **Scan-to-book on Dashboard, Books, and Loans** -- If the operator scans a Bookland / ISBN barcode (keyboard wedge
   ending in Enter) on `/dashboard`, `/books`, or `/loans`, Shade should open that copy's details when the library has
   exactly one match. These pages have some form controls (Books filters/sorts, Dashboard field select, Loans return
   time); they are not blank canvases. Ignore those targets (see item 4).
2. **Check list length before navigation** -- on a completed scan, call `GET /books?isbn=` (via `booksApi.list` or an
   equivalent query helper) and read `total` (or equivalent list length) **before** pushing any route. Branch on that
   result:
   - `total === 1`: navigate directly to `/books/{bookId}`. Do **not** push `/books?isbn=` first. Back from detail
     must return to Dashboard, Loans, or the prior `/books` browse state the operator actually saw -- not an
     intermediate one-row filtered list that never rendered.
   - `total !== 1`: navigate to `/books?isbn={compacted}` so zero- or many-match outcomes stay on the filtered
     collection.
   Prefetch-then-branch is required; navigate-then-redirect (list URL on the stack, then replace with detail) is wrong.
3. **Complete a scan before filtering** -- "begins typing numbers" means hardware-wedge / keyboard capture of ISBN
   characters on these pages, not navigation on the first digit. `GET /books?isbn=` is a **substring** match on
   `isbn13`. Filtering or opening detail on a prefix (e.g., `9`) would jump to the wrong book or fire on accidental
   keypresses. Reuse the existing parser: ISBN characters + Enter terminator + checksum. Invalid checksums are
   dropped silently, same as `/books/new` hardware paths.
4. **Do not steal typing from form controls** -- ignore `keydown` when the event target is an editable control
   (`input`, `textarea`, `select`, or `contenteditable`). That covers Books sort/filter controls, the Dashboard Healing
   Metadata field select, and the Loans return-time field. Modifier chords (`Ctrl` / `Meta` / `Alt`) must not start a
   scan.
5. **Do not activate focused buttons** -- Dashboard Refresh and nav links can have focus. `preventDefault` consumed
   ISBN keys and a completing Enter so the scan does not click Refresh or follow a focused link. This preventDefault
   behavior is **opt-in** for this capture surface only; leave New Book "ordinary typing is not swallowed" as it is
   today.
6. **Honest zero / many outcomes** -- no match: filtered empty state, not "library is empty". Several copies sharing
   an ISBN: show the filtered collection; do not pick a winner. Soft-deleted copies stay excluded (active collection).
7. **No camera, no lookup, no mutate** -- no "Scan ISBN" button on these pages. Do not call `GET /books/lookup`.
   Never `POST /books` or checkout/check-in from this flow.

Suggested composition (implementer-owned layout; keep ISBN out of a typed search box):

- Shared hook `useCollectionIsbnJump` called from `DashboardPage`, `BooksPage`, and `LoansPage` only.
- On detect: compact the ISBN, await prefetch `GET /books?isbn={compacted}`, then branch on `total` before any
  navigation. If `total === 1` and the sole item has an id, `navigate` to `/books/{bookId}` only -- never push
  `/books?isbn=` first. Push from `/dashboard` or `/loans`; from `/books`, push detail so Back returns to the prior
  browse state. If `total !== 1`, build search params -- when `location.pathname === '/books'`, start from
  `location.search` and `set('isbn', compacted)` (preserve sort and other list filters) and `replace`; otherwise push
  `{ pathname: '/books', search: { isbn: compacted } }`. Show a brief in-flight state if needed while prefetching.
- `BooksPage` reads `isbn` from the URL when the operator lands on a filtered list (`total !== 1`, zero matches, or a
  direct `/books?isbn=` bookmark). Pass `isbn` to `useInfiniteBooks` with the existing filters and sort. **Unique-open
  fallback:** when the URL already has a checksum-valid `isbn`, query succeeds, and `total === 1`, replace-navigate to
  detail once per isbn value (ref) so bookmarked filtered URLs still collapse. Scans that prefetched a unique match
  must not rely on this path -- they must never put `/books?isbn=` on the stack in the first place. Guard with a ref so
  refetch does not loop. Do not unique-open for a non-ISBN `isbn` param (substring-only URLs just filter).
- While `isbn` is set and unique-open has not fired, show a short status (e.g., "Showing books matching ISBN ...")
  plus a Clear control that deletes `isbn` and keeps sort and other filters. Not a text field.
- Polite live region when the filter applies, so a screen reader hears that the collection changed.

Tone: extend scanning and `BooksPage`; do not add a global AppShell listener (scanners stay local to feature pages,
matching New Book). Do not add a typed ISBN search box (author/title/category filters already live on `/books`; this
ticket owns scan-driven `isbn` URL param only).

## Out of scope

- Camera capture on Dashboard, Books, or Loans.
- `GET /books/lookup`, ISBN-10 → ISBN-13 conversion, or changing `compactIsbnForListFilter`.
- Creating, checking out, or checking in from scan success.
- Typed ISBN search box or changes to existing author/title/category filter UI, or `include_deleted` on `/books`.
- Listening on `/books/:bookId`, `/books/new`, `/shelves`, admin, or other routes (CheckoutDialog on details stays
  out of this capture surface).
- Changing New Book lookup enablement (except sharing parser/hook option types).
- Restoring `CheckoutPage`, Circulation Check Out nav, or FEAT-21 alternate-copy offers.
- FEAT-25 / FEAT-26 / FEAT-27 product work.

## Remaining scope (file-level plan)

### 1. Parser / hardware hook -- opt-in ignore and preventDefault

| File | Change |
| ---- | ------ |
| `src/features/scanning/isbnScannerParser.ts` | Extend `IsbnScannerParserResult` with `consumed: boolean` (`true` when the key was an ISBN character appended to the buffer, or Enter that ran `finish()`, including invalid/empty finish). Non-ISBN keys stay `consumed: false` with `isbn: null`. Do not change checksum rules or the 100ms timeout reset. |
| `src/features/scanning/isbnScannerParser.test.ts` | Cover `consumed` for digits, `X`, hyphen/space, Enter (valid and invalid), and ignored keys (e.g., `a`, `Tab`). Existing ISBN-10 / ISBN-13 / timeout cases stay green. |
| `src/features/scanning/useHardwareIsbnScanner.ts` | Add optional `ignoreEditableTargets?: boolean` (default `false`) and `preventDefaultWhenConsumed?: boolean` (default `false`). When ignore is on, skip `handleKey` if the event has `ctrlKey` / `metaKey` / `altKey` or the target is `input`, `textarea`, `select`, or `contentEditable`. When preventDefault is on, call `event.preventDefault()` only if the parser marked the key `consumed`. Keep `enabled` and `onDetected` as today. New Book omits both flags (current behavior). |
| `src/features/scanning/useHardwareIsbnScanner.test.ts` | Cover: ignore focused `input` / `select` does not emit; `Ctrl`+digit does not emit; `preventDefaultWhenConsumed` prevents default on digits and completing Enter, not on `a`; defaults still capture while an input is focused (existing case). Disabled / unmount / invalid ISBN cases stay. |

Do not replace the parser. Do not change camera code.

### 2. Collection-jump hook (local to the three pages)

| File | Change |
| ---- | ------ |
| `src/features/scanning/useCollectionIsbnJump.ts` (new) | Call `useNavigate` / `useLocation`, `useConnection().apiClient` (or `booksApi.list`), and `useHardwareIsbnScanner` with `ignoreEditableTargets` and `preventDefaultWhenConsumed` true. `onDetected`: `compactIsbnForListFilter(isbn)`; **await** prefetch `GET /books?isbn={compacted}` (active collection only); **then** branch on `total` before any navigation. If `total === 1` and `items[0].id` exists, `navigate(`/books/${id}`)` only -- never push `/books?isbn=` first. Push from `/dashboard` or `/loans`; from `/books`, push detail so Back returns to prior browse. If `total !== 1`, build search params -- when `location.pathname === '/books'`, start from `location.search` and `set('isbn', compacted)` (preserve sort and other list filters) and `replace`; otherwise push `{ pathname: '/books', search: { isbn: compacted } }`. Show a brief in-flight state if needed while prefetching. |
| `src/features/scanning/useCollectionIsbnJump.test.tsx` (new) | Memory-router harness plus mocked list API: from `/dashboard` a valid ISBN+Enter with one match navigates directly to `/books/{id}` and history does **not** include `/books?isbn=`; with zero or many matches navigates to `/books?isbn=...`; from `/loans` same; from `/books?sortBy=title` with many matches replaces and keeps `sortBy`; hyphenated scan is compacted; invalid checksum does not navigate; focused input does not navigate. Assert prefetch completes before `navigate` is called. |
| `src/features/dashboard/routes/DashboardPage.tsx` | Call `useCollectionIsbnJump()` unconditionally (all branches of the page, including loading / error, so a scan still works). |
| `src/features/loans/routes/LoansPage.tsx` | Same: call `useCollectionIsbnJump()` on the page, including loading / error / empty / Return Card. |
| `src/features/books/routes/BooksPage.tsx` | Call `useCollectionIsbnJump()` in addition to the URL/query work in section 3. |
| `src/layout/AppShell.tsx` | No scanner import. Keep heading/main focus as-is (focused `h1` / `main` are not editable, so a scan after navigation is heard). |

Optional: a tiny `isEditableKeyTarget(target: EventTarget | null)` helper colocated with the hardware hook if the
ignore logic would otherwise duplicate.

### 3. Books page -- `isbn` URL filter and unique-open

| File | Change |
| ---- | ------ |
| `src/features/books/booksListModel.ts` | Add `parseIsbnParam(value: string | null): string | undefined` -- trim, `compactIsbnForListFilter`, blank → `undefined`. |
| `src/features/books/booksListModel.test.ts` | Blank / whitespace / punctuation-only compact; hyphenated ISBN round-trip; `null` → unset. |
| `src/features/books/routes/BooksPage.tsx` | Extend local `updateListParams` so ISBN can be set or cleared (`delete('isbn')` when unset) without dropping sort or other filters, and keep clearing stale `page`. Read `isbn` via `parseIsbnParam(searchParams.get('isbn'))`. Pass `isbn` into `useInfiniteBooks` with existing filters/sort (omit when unset so the query key stays unfiltered). Treat `isbn` as an active filter for empty-state branching (`hasActiveFilters`). **Unique-open fallback (URL only):** when `isbn` is set, `isValidIsbn(isbn)`, query `isSuccess`, `total === 1`, and flattened `books[0]` exists, `navigate(`/books/${books[0].id}`, { replace: true })` once per isbn value (ref) -- for bookmarked `/books?isbn=` URLs, not for scans handled by `useCollectionIsbnJump`. Do not unique-open while pending or on error. **Empty states:** unfiltered `total === 0` stays library-empty + Add Book; `isbn` set and `total === 0` is a filtered empty message plus Clear ISBN (do not imply the library has no books). **Status:** when `isbn` is set and unique-open did not run, show matching-ISBN copy, `total` as the filtered count, and Clear. Preserve sort and category/author/title controls. Infinite scroll keeps the same `isbn` on later pages. |
| `src/features/books/routes/BooksPage.test.tsx` | `useInfiniteBooks` receives `{ isbn }` from `/books?isbn=...`; unique-open navigates to `/books/{id}` when loaded directly with `total === 1` and isbn is valid; `total === 0` with isbn shows filtered empty, not Add Book empty; `total > 1` stays on the list with both titles; invalid/partial isbn param filters but does not unique-open; Clear removes `isbn` and keeps `sortBy`; loading/error do not navigate. Existing sort, ratings, and Title Case shelf coverage stays green. |
| `src/features/books/components/BooksListControls.tsx` | No typed ISBN field. Optional: a read-only status + Clear can live on `BooksPage` instead of this controls row if that keeps sort layout alone. |
| `src/styles/components.css` | Only if the ISBN status/Clear row needs spacing the existing `.books-page__*` classes do not provide. Reuse tokens; no new framework. |

Use API `total === 1` (full matching count), not "first page has one row while `total` is larger".

### 4. Wiring / browser journeys

| File | Change |
| ---- | ------ |
| `src/features/dashboard/routes/DashboardPage.test.tsx` | Keep existing metric tests. Add (or share with the hook suite) one `renderAppTree(['/dashboard'])` journey: mock
  `GET /books?isbn=` to a single fixture book, fire ISBN-13 keydowns + Enter, expect direct navigation to `/books/{id}`
  (not an intermediate `/books?isbn=` entry). Spy `useCollectionIsbnJump` only if a full journey is too heavy -- prefer
  a real keydown through the mounted page so a missing hook call fails the test. |
| `src/features/loans/routes/LoansPage.test.tsx` | Same wiring guarantee: scan from `/loans` with one match reaches `/books/{id}` directly; many-match reaches
  `/books?isbn=`. Keep existing infinite-scroll and Check In tests. |
| `e2e/isbn-collection-jump.spec.ts` (new) | Playwright: from `/dashboard`, type a fixture ISBN + Enter; with one matching `isbn13` in `mockApi`, land on that
  book's detail heading and assert Back returns to Dashboard (not a one-row list). Second case: two books sharing the
  ISBN stay on `/books` with both titles (extend `mockApi` seed if needed). Reuse `installMockApi`; do not invent a
  second fake API. Optional axe pass on the filtered many-match list. |
| `e2e/support/mockApi.ts` | List `isbn` today exact-matches `isbn13`. That is enough for full-ISBN e2e. Optional: substring `includes` to closer match the API; not required if tests send the full compacted ISBN. Do not add lookup calls. |
| `e2e/dashboard.smoke.spec.ts` / `e2e/accessibility.spec.ts` | No required change unless the new spec is a better home for the dashboard scan journey. Do not add camera steps. |

### 5. Docs hygiene (as part of this ticket, not a follow-up)

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Drop `/checkout` as a camera/hardware capture surface (that page is gone). Scanning also lives on Dashboard /
  Books / Loans via `useCollectionIsbnJump` (hardware only; no camera there). Keep `/books/new` as the camera + New Book
  hardware page. Prefetch `GET /books?isbn=` and branch on list length before navigation: unique match opens detail
  without pushing `/books?isbn=`; zero or many matches go to the filtered collection. `/books` URL may include `isbn`;
  bookmarked unique-open may still collapse via BooksPage replace-navigate. Still: scan never creates or checks out.
  Camera still only `/books/new`. Note ignore-editable + preventDefault on this surface only. |
| `docs/full-project-context.md` | Same capture and `/books?isbn=` notes when that pack is kept current. Drop stale `/checkout` capture if present. |
| `docs/ToDo.md` | Add a checklist line for this ticket. |

## Acceptance criteria

- On `/dashboard`, `/books`, and `/loans`, a checksum-valid hardware ISBN (digits / `X` / hyphens, Enter terminator)
  prefetches `GET /books?isbn={compactIsbnForListFilter(isbn)}` and inspects list length before navigating. Invalid
  checksums do not navigate.
- When the prefetch returns `total === 1`, navigate directly to `/books/{bookId}` without ever pushing `/books?isbn=`
  onto the history stack. Back from detail after a scan from Dashboard or Loans returns to that page, not an unseen
  one-row list.
- When the prefetch returns `total !== 1`, navigate to `/books?isbn={compactIsbn}` (preserve sort and other list
  filters when already on `/books`). `/books` passes that `isbn` to `useInfiniteBooks` / `GET /books?isbn=` (active
  collection only; no `include_deleted`).
- Bookmarked or shared `/books?isbn=` URLs with `total === 1` may still collapse to detail via the BooksPage
  unique-open fallback (replace-navigate). Scan flows must not depend on that fallback.
- If `total === 0`, stay on `/books` with a filtered empty state and a way to clear `isbn` (not the Add Book
  library-empty state). If `total > 1`, stay on the filtered list.
- No typed ISBN field is added. Camera is not mounted on these pages. `GET /books/lookup` is not called. Scan
  success does not create, check out, or check in.
- Keystrokes in `input` / `textarea` / `select` / `contenteditable` are not captured. `Ctrl` / `Meta` / `Alt` chords
  are not captured. Consumed scan keys `preventDefault` so focused Refresh / links are not activated.
- `/books/new` hardware behavior is unchanged (still capture while the ISBN field is focused; still no preventDefault
  unless that page opts in later).
- Colocated parser, hook, `BooksPage`, and page-wiring tests cover the flow. Playwright covers scan-from-dashboard
  unique-open and Back behavior. `make check` passes.
- `docs/AGENTS.md` describes this capture surface and the prefetch-before-navigate history rule, and no longer lists
  `/checkout` as a capture route.

## Plan coverage

Extends hardware capture beyond `/books/new`, using the existing `GET /books?isbn=` substring filter as the collection
jump. Prefetch, inspect list length, then navigate keeps the history stack honest when a scan resolves to a single
book. Explicitly excludes camera, lookup, mutations, restoring checkout-as-a-page, and FEAT-25 through FEAT-27 product
work. Ignore-editable is required for existing Books filters, the Dashboard field select, and the Loans return-time
field.
