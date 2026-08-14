# FEAT-05 — ISBN selection on checkout

## Objective

Let the checkout page find an eligible library book by ISBN, primarily via hardware barcode scanner or camera scan
(with typed entry as a fallback), using the backend `GET /books?isbn=` filter, then continue the existing FEAT-07
checkout form and mutation.

## Dependencies

- Historical FEAT-05 (book create / metadata lookup on `/books/new`) is complete; its ticket file was removed. This
  ticket reuses the FEAT-05 number for a distinct checkout feature -- do not reopen create/lookup work.
- FEAT-06 is complete: reuse `src/features/scanning/` (lazy `IsbnCameraScanner`, `useHardwareIsbnScanner`,
  `isbn.ts` checksum helpers). Do not move scanner ownership onto `/checkout` or call `POST /books` from a scan.
- FEAT-07 is complete: extend `CheckoutPage` / `checkoutModel`; keep `useCheckoutBook` / `booksApi.checkout` /
  `pickCheckoutRequest`, confirmation, Field-linked `422`, and `404`/`409` stale-state handling.
- CHORE-01 (or equivalent API work) already added optional `booksApi.list({ isbn })`, `useBooks({ isbn })`, and
  `queryKeys.books.list({ includeDeleted, isbn? })`. Reuse those; do not invent a second list client.
- Do not pull FEAT-08 check-in ISBN selection, FEAT-09 reading, or FEAT-10 edit/delete into this ticket unless a later
  ticket explicitly extends the same capture pattern.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for `GET /books` query params (`isbn`, `include_deleted`),
  `BookList` / `BookRead`, `POST /books/{id}/checkout`, and error schemas.
- `../technical-reference/API-for-FE.md` -- behavioral guidance: optional `isbn` is a literal substring contains on
  stored `isbn13` (not create/lookup normalization); empty or whitespace-only `isbn` is **400**; no matches return an
  empty `BookList` (not **404**); soft-delete rules still apply unless `include_deleted=true`.

Do **not** use `GET /books/lookup` for this feature. Lookup returns external metadata drafts for add-book; checkout
must resolve a book already in the library via `GET /books?isbn=...`.

### Documented contract facts for this ticket

Confirm against a representative running backend `/openapi.json` before locking behavior; record drift as a blocker.

- `GET /books?isbn={value}` filters active books (default `include_deleted=false`) whose stored `isbn13` contains the
  given string literally. Substring matches are allowed (e.g., a trailing digit run can match a full stored ISBN-13).
- Empty string or whitespace-only `isbn` → **400** with documented invalid-isbn detail. The FE must never submit blank
  or whitespace-only filter values (typed helpers already omit `undefined` / `''`; still gate the UI so enabled queries
  never pass whitespace-only strings).
- Zero matches → `200` with `{ items: [], total: 0 }`.
- Soft-deleted books are omitted unless `include_deleted=true`. Checkout must not offer soft-deleted books; keep the
  default list filter and continue to require `deletion_date === null` and `status === 'available'` before selection
  or submit (same eligibility as FEAT-07).
- Stored `isbn13` values are normalized on create/update (typically compact ISBN-13). The list filter does **not**
  normalize hyphens/spaces like lookup. Before querying, strip spaces, hyphens, and similar punctuation from the
  scanned or typed value so a formatted barcode still matches stored compact ISBN-13. Do **not** convert ISBN-10 to
  ISBN-13, prepend `978`/`979`, or otherwise add digits -- search with the compact scanned/typed string as-is.
  Scans are nearly always ISBN-13 Bookland barcodes; ISBN-10 edge cases are out of scope for this Find path.
- Prefer checksum-gated values for Find / scan handoff (reuse `isValidIsbn` from `src/features/books/utils/isbn.ts`);
  do not send blank, whitespace-only, or invalid-checksum values.
- Checkout mutation remains `POST /books/{id}/checkout` with existing request shaping. ISBN search only selects `id`;
  it does not change the checkout payload.

## Current baseline

Already in place and should be reused (not rebuilt):

- `booksApi.list({ isbn })` and colocated tests for query encoding / omit-empty behavior (`src/api/booksApi.ts`,
  `src/api/booksApi.test.ts`).
- `useBooks({ isbn })` and `queryKeys.books.list({ includeDeleted, isbn? })` (`src/api/booksQueries.ts`,
  `src/api/queryKeys.ts`).
- `/checkout` via `CheckoutPage` + `checkoutModel`: eligible select (`deletion_date === null` and
  `status === 'available'`), `?bookId=` deep-link, `ConfirmationDialog`, `useCheckoutBook`, Field-linked `422`,
  `404`/`409` refetch with preserved form input, success navigation to detail.
- FEAT-06 scanning modules under `src/features/scanning/`, already lazy-loaded from `NewBookPage` with hardware
  listening disabled while the camera UI is open or lookup is fetching. Mirror that enablement pattern for checkout
  search pending / camera-open states.
- Support matrix: `docs/baselines/FEAT-06_scanner-support.md` (manual device checks still apply when checkout becomes a
  second capture surface).

## Scope

### Product behavior

- On `/checkout`, keep the existing eligible-book `<select>` (and `?bookId=` deep-link). Add an adjacent ISBN find path
  aimed at barcode capture: hardware-wedge listening when appropriate, "Scan ISBN" camera control, plus a typed ISBN
  field and Find action as fallback.
- On a successful Find / scan:
  1. Compact the value by stripping spaces, hyphens, and similar punctuation only; validate with `isValidIsbn`. Do not
     rewrite the digit string (no ISBN-10→ISBN-13 conversion, no added prefix digits).
  2. Query `useBooks({ isbn: <compacted> })` (or an equivalent one-shot refetch through the same helper). Do not call
     `useBookLookup` / `booksApi.lookup`.
  3. From results, keep only FEAT-07-eligible books.
  4. Zero eligible matches: accessible explanation (none in library vs found but not available / soft-deleted), keep
     manual select usable, do not clear borrower/optional fields.
  5. Exactly one eligible match: select it via the existing `selectBook(id)` / `?bookId=` path and move focus toward
     the borrower field (or an equivalent clear next step).
  6. Multiple eligible matches: present a short chooser (reuse list semantics; do not invent catalog search beyond this
     ISBN result set), then select one.
- Camera and hardware captures hand one ISBN into the same Find path (never checkout, never create). Disable hardware
  listening while the camera UI is open or an ISBN search is in flight, matching `/books/new`.
- Lazy-load `IsbnCameraScanner` from `CheckoutPage` the same way `NewBookPage` does, so ordinary `/checkout` navigation
  does not pay the ZXing cost until Scan is opened.
- Preserve FEAT-07 checkout confirm / mutate / error behavior after selection. ISBN UX is selection only.
- Optional (in scope if cheap): `?isbn=` deep-link that runs the same Find once on load; omit if it complicates
  `bookId` precedence -- prefer `bookId` when both are present.

### Files to change

| File | Change |
|------|--------|
| `src/features/loans/routes/CheckoutPage.tsx` | Primary UI work: ISBN field + Find, lazy camera scanner, hardware scanner hook, `useBooks({ isbn })` (or enabled-when-set search state), eligibility filtering of ISBN results, multi/zero/one match handling, wire selection into existing `selectBook` / form. Keep full eligible list query for the `<select>` unless a measured reason says otherwise (two queries: unfiltered eligible list + ISBN-filtered search is fine). |
| `src/features/loans/routes/CheckoutPage.test.tsx` | Cover typed Find success (single eligible), zero matches, ineligible-only matches, client checksum rejection, blank prevention (no request), camera/hardware handoff into Find (mirror `NewBookPage` scanner tests), and that checkout mutate path is unchanged after ISBN selection. |
| `src/features/loans/checkoutModel.ts` | Only if ISBN draft/validation helpers belong outside the page. Prefer page-local search state unless shared compact helpers grow; do not fold ISBN into `CheckoutRequest`. Update `checkoutModel.test.ts` only if model helpers are added. |
| `src/features/books/utils/isbn.ts` | Reuse `isValidIsbn`. Export a small shared "compact for list filter" helper (strip spaces/hyphens/punctuation only -- never rewrite digits) only if Checkout would otherwise duplicate strip logic; add colocated unit coverage if exported. |
| `src/features/scanning/*` | Prefer reuse as-is. Change only if checkout needs a documented shared enablement prop or handoff helper; do not specialize scanners for checkout payloads. |
| `src/api/booksApi.ts` / `booksQueries.ts` / `queryKeys.ts` | Expect no transport changes if CHORE-01 is present. If `isbn` list support is missing in the working tree, add omit-empty `isbn` on `list`, `useBooks({ isbn })`, and list query-key shape, plus API/query tests -- then proceed with UI. |
| `docs/baselines/FEAT-06_scanner-support.md` | Optionally note `/checkout` as a second capture surface in the manual matrix; do not rewrite the matrix. |
| `docs/AGENTS.md` | After implementation: document checkout ISBN Find / scan handoff into `useBooks({ isbn })`, and that this ticket is complete (distinct from historical create FEAT-05). |
| `docs/ToDo.md` / `docs/product-docs/PLAN.md` | Update only if maintainers want the checklist/roadmap to mention checkout ISBN selection; not required to ship the feature. |

### Out of scope

- Creating books from checkout when ISBN is unknown (link to `/books/new` at most; do not embed create).
- Using `GET /books/lookup`, catalog-wide title search, UPC, or multi-copy inventory.
- Converting ISBN-10 to ISBN-13 (or any other digit rewriting) before `GET /books?isbn=`; strip punctuation only.
- Changing checkout request fields, loan history, or check-in ISBN selection (check-in can mirror later).
- Rebuilding FEAT-06 scanners or FEAT-07 confirmation/mutation flow.
- Backend OpenAPI or filter semantics changes (substring contains and 400-on-blank stay as documented).

## Acceptance criteria

- From `/checkout`, a user can scan (camera or hardware wedge) or type a valid ISBN, run Find, and select the matching
  available library book without using the full eligible dropdown when a single eligible match exists.
- Find sends the compacted scan/type string (punctuation stripped only) to `GET /books?isbn=`; it never invents or
  rewrites digits (no ISBN-10→ISBN-13 conversion).
- Camera "Scan ISBN" and hardware-wedge capture on `/checkout` feed the same Find path; unsupported/denied camera paths
  leave typed Find and the eligible `<select>` usable.
- Invalid checksum / blank ISBN never calls `GET /books?isbn=`; blank/whitespace never produce a **400** from this UI.
- Soft-deleted and non-`available` matches are not selectable or submittable; messaging explains not found vs not
  eligible without blocking the rest of the form.
- Existing `?bookId=` deep-link, confirmation, `useCheckoutBook`, Field-linked `422`, and `404`/`409` refresh behavior
  still pass.
- Colocated `CheckoutPage` tests cover the ISBN paths above; `make check` (or focused lint/typecheck/test plus build
  when proportionate) passes.
- No secrets, ISBN drafts, or borrower fields appear in diagnostics beyond existing redaction rules.

## Implementation notes

- Primary capture path is barcode scanner / camera; typed Find is the fallback. Design enablement and focus flow for
  scan-first use (hardware listening when safe; lazy camera until Scan is opened).
- Prefer two React Query usages on the page: `useBooks()` for the eligible `<select>`, and `useBooks({ isbn })` with
  `enabled: Boolean(activeSearchIsbn)` for Find results. Avoid filtering the full in-memory list as a substitute for
  the API filter once ISBN Find is invoked -- the point of the backend change is server-side `isbn` search.
- Compact helper must only remove punctuation (spaces, hyphens, and similar). Do not call lookup normalization or add
  prefix digits so ISBN-10 values become ISBN-13.
- When applying a Find result, reuse `setSearchParams({ bookId })` so refresh and detail deep-links stay consistent.
- Keep lines of product copy short; reuse `Alert`, `Field`, `Button`, and `LoadingState` from
  `src/components/index.ts`.
- After shipping, remove or archive this ticket file only when maintainers follow the same FEAT-01..07 cleanup pattern;
  until then, prefer ticket presence under `docs/tickets/` over `docs/ToDo.md` when judging completion.
