# FEAT-23 -- Consolidate checkout onto book details

## Objective

`/checkout` is an extra circulation destination. Operators already have an eligible book open on `/books/{bookId}`
when they want to loan it. Remove the dedicated checkout route and run checkout from a popup dialog on that details
page. The dialog collects only Borrower and Notes. Checkout time is `now` at submit; due date is one year later. Do
not change the backend contract: checkout remains `POST /books/{id}/checkout`.

## Dependencies

FEAT-07 checkout is complete (`CheckoutPage`, `checkoutModel`, `useCheckoutBook`, ISBN Find, `412` `display_only`
refetch/messaging). Book details already gates "Check Out" to active `available` books.

Sibling tickets still describe `/checkout` as a live product page (FEAT-17 About links and nav,
FEAT-19 primary nav, FEAT-21 alternate-copy UX, FEAT-22 check-in consolidation). Update those tickets in the same
change so later work does not rebuild the page.

FEAT-22 (check-in onto `/loans`) is a sibling, not a blocker. If FEAT-22 is not done yet, still retarget checkout
independently. If FEAT-22 is already written, drop its "Checkout stays on `/checkout`" / "Keep Check Out" nav notes
in this change -- this ticket supersedes them.

Do not pull FEAT-15 Podman, FEAT-16 release artifacts, FEAT-17 About / homepage, FEAT-18 collection filters,
FEAT-19 wishlists, FEAT-20 dashboard reports, or FEAT-21 alternate-copy offers into this implementation. Retarget
FEAT-21's planned surface only (see Out of scope).

## Contract references

No new backend endpoints. Treat these as complementary and leave them in place:

- `../technical-reference/openapi.json` -- `POST /books/{id}/checkout` (`CheckoutRequest`: required `borrower`;
  optional `checked_out_at`, `due_at`, `notes`; **200** `BookRead`; **404** missing/soft-deleted; **409** already on
  loan; **412** display-only; **422** validation).
- `../technical-reference/API-for-FE.md` -- only `borrower` is required (1-255). Omitted `checked_out_at` defaults to
  current UTC. Formats for `checked_out_at` / `due_at` / `notes` are not validated (frontend still sends normalized
  UTC ISO 8601 and `YYYY-MM-DD`). Success sets `status=on_loan` and creates a `Loan` with `returned_at=null`.
  `display_only` → **412** `{"detail": "Book is display only"}`. Already on loan → **409**
  `{"detail": "Book is already checked out"}`. Never simulate checkout with generic `PATCH`.

Do not invent loan-create APIs. Creating a loan is checkout only.

## Current baseline

Already in place and should be reused (not rebuilt):

- `/checkout` via `CheckoutPage` + `checkoutModel` + `useCheckoutBook`. Eligible-book picker from `useBooks` filtered
  by `deletion_date === null` and `status === 'available'`. Optional ISBN Find via checksum-gated
  `useBooks({ isbn })` with typed / camera / hardware handoff (lazy `IsbnCameraScanner`). `?bookId=` deep-link.
  Form fields: Book, Borrower, Checkout date and time (`datetime-local`, blank → omit so the API uses UTC now), Due
  date (`date`), Notes. `ConfirmationDialog` before mutate. Field-linked **422**. **404** / **409** / **412** stale
  refetch with preserved form input. Success navigates to `/books/{id}`.
- `checkoutFormValuesToRequest` omits blank optionals and normalizes a supplied checkout timestamp to UTC ISO 8601;
  due date stays date-only.
- Detail "Check Out" on `BookDetailsPage` is an `AppLink` to `/checkout?bookId=...` when `canCheckout` (active and
  `status === 'available'`). Display-only and on-loan books do not get the link.
- Primary nav in `AppShell` includes "Check Out" (`/checkout`).
- `LoansPage` empty state links "Check Out a Book" to `/checkout`.
- `useCheckoutBook` already writes the returned `BookRead` into the detail cache and invalidates books, loans, and
  dashboard (PLAN.md 7.5). Do not change that invalidation.
- Shared UI: `Alert`, `AppLink`, `Button`, `Field`, `LoadingState`, `QueryErrorState`, `EmptyState`,
  `ConfirmationDialog` (native `<dialog>`, focus trap, Escape, focus restoration). Dialog styles:
  `.confirmation-dialog` in `src/styles/components.css`.
- Scanning on `/books/new` is independent and stays. `/checkout` is the only other capture surface
  (`docs/baselines/FEAT-06_scanner-support.md`).

The overlap: operators who start from a book already know which copy they are loaning. The dedicated page exists
mainly to pick a book, type timestamps, and Find-by-ISBN -- none of which are needed once checkout lives on details.

## Product intent

1. **Checkout happens on the book** -- `/books/:bookId` is where an eligible book is loaned. There is no primary
   "Check Out" destination and no book picker.
2. **Popup, not a new route** -- pressing "Check Out" on details opens a modal dialog (native `<dialog>`, same
   accessibility contract as `ConfirmationDialog`: labelled title, focus trap, Escape cancel, restore focus to the
   Check Out control). The dialog is the form. Do not navigate away.
3. **Two operator fields** -- Borrower (required) and Notes (optional). No Book select, no checkout datetime input,
   no due date input.
4. **Timestamps are computed at submit** -- when "Check Out Book" is pressed (after client validation passes), take a
   single `Date` `now` and send:
   - `checked_out_at`: `formatUtcIso8601(now)` (UTC ISO 8601 ending in `Z`);
   - `due_at`: the UTC calendar date one year later as `YYYY-MM-DD`.
   Send both from that same instant so the due date matches the checkout timestamp. Do not omit `checked_out_at` and
   separately compute `due_at` from a different clock. Leap-day clamp: 29 February plus one year becomes 28 February
   in a non-leap year (UTC calendar arithmetic, not local `setFullYear` overflow to 1 March).
5. **Stay on details after success** -- close the dialog, reset the form, and let existing query invalidation flip
   the book to `on_loan` (Check Out hides; Check In / loan UI follows current gating). Do not `navigate` to another
   route.
6. **Honest stale outcomes** -- **409** `Book is already checked out`, **412** `Book is display only`, and **404**
   refetch the book (and loans) and keep typed Borrower / Notes. Drop checkout-page copy that tells the operator to
   "Use Find by ISBN". In-flight submit is disabled. Eligibility is still `deletion_date === null` and
   `status === 'available'`; do not offer Check Out for `display_only`.
7. **Old `/checkout` URLs** -- replace-navigate `/checkout` to `/books`, and `/checkout?bookId={id}` to
   `/books/{id}?checkout=1`. When details loads with `?checkout=1` and the book is eligible, open the dialog and
   replace-clear the search param so a refresh does not reopen it. If the book is missing, deleted, or not eligible,
   do not open the dialog; show the existing details warning / gating. The compatibility route must not keep a
   "Check Out" document title.
8. **ISBN Find is not a checkout surface** -- camera / hardware / typed Find-by-ISBN on `/checkout` go away with the
   page. Scanning remains on `/books/new` only. Operators choose the book from the collection, then check it out.

Suggested composition (implementer-owned layout; keep it on book details):

- "Check Out" in Book actions becomes a `Button` (not an `AppLink`). Same gating as today's `canCheckout`.
- Dialog title names the action and the book (e.g., "Check Out" plus the title in the body). Focus Borrower on open
  (not Cancel -- this is a form, unlike `ConfirmationDialog`).
- Optional one-line help: checkout time is now and the due date is one year later. No date controls.
- Submit label "Check Out Book" (pending: "Checking Out…"). Cancel / Escape closes without mutating.
- Do not stack a second `ConfirmationDialog` on top of the form dialog. The popup plus named submit is the
  confirmation. Reuse `ConfirmationDialog` only if you extract a shared dialog shell; do not force the form into
  `ConfirmationDialog`'s cancel-first confirm pattern.
- **422** on `borrower` / `notes` maps onto those fields. **422** on computed `checked_out_at` / `due_at` has no
  input: show it on the dialog error summary, never drop it.

Tone: extend `BookDetailsPage`; do not add a second checkout product. Check-in remains whatever FEAT-22 (or current
`/checkin`) already specifies.

## Out of scope

- Changing `booksApi.checkout`, `useCheckoutBook`, OpenAPI types, or PLAN.md 7.5 invalidation.
- Simulating checkout with generic `PATCH`, or adding loan CRUD.
- ISBN Find, camera, or hardware scanning as a checkout entry (leave those on `/books/new` only).
- FEAT-21 alternate-copy offers (no substitute chooser in this ticket). Update FEAT-21 so that work cannot assume
  `/checkout` or Find-by-ISBN; substitutes belong on the details dialog or as links to another book's details.
- Relocating dashboard / About (FEAT-17) beyond dropping `/checkout` from that ticket's planned links.
- Editable due dates, loan-length settings, overdue notifications, or mark-unread.
- Building a generic form-dialog primitive unless `CheckoutDialog` and `ConfirmationDialog` would otherwise
  duplicate focus-trap / Escape / restore logic in an unmaintainable way. Prefer a loans-owned `CheckoutDialog`
  first.

## Remaining scope (file-level plan)

### 1. Form model -- two fields plus computed timestamps

| File | Change |
| ---- | ------ |
| `src/features/loans/checkoutModel.ts` | Shrink `CheckoutFormValues` to `borrower` and `notes`. Drop `checked_out_at` / `due_at` from values, defaults, and `validateCheckoutFormValues` (keep borrower required / 255-cap; notes unconstrained client-side). Add `dueAtOneYearFrom(now: Date): string` (UTC calendar year + 1, leap-day clamp, `YYYY-MM-DD`). Change `checkoutFormValuesToRequest(values, now: Date)` to always set `borrower`, `checked_out_at` via `formatUtcIso8601(now)`, `due_at` via `dueAtOneYearFrom(now)`, and `notes` only when trimmed non-empty. |
| `src/features/loans/checkoutModel.test.ts` | Replace timestamp-input cases with: borrower validation still holds; blank notes omitted; notes trimmed; request always includes `checked_out_at` and `due_at` from the injected `now`; a non-leap anniversary of 29 Feb UTC is 28 Feb; a typical date plus one year is the same month/day. Do not keep `datetime-local` / invalid-due-date input tests. |
| `src/features/loans/checkoutEligibility.ts` (new, optional) | Move `isCheckoutEligible` out of `CheckoutPage` (`deletion_date === null` && `status === 'available'`). Import from `BookDetailsPage` and `CheckoutDialog` so gating cannot drift. Colocate `checkoutEligibility.test.ts`. If the helper stays tiny, it may live next to the dialog instead -- do not leave a second copy of the predicate on details. |

`src/api/dateTime.ts` already has `formatUtcIso8601` and `formatDateOnly` (`formatDateOnly` is local-time; do not use
it for `due_at` if checkout is UTC). Keep year math in `checkoutModel` unless a UTC `YYYY-MM-DD` helper is clearly
reused.

### 2. Checkout dialog on book details

| File | Change |
| ---- | ------ |
| `src/features/loans/components/CheckoutDialog.tsx` (new) | Native `<dialog>` form: Borrower `Field`, Notes `Field`, error summary focus, `validateCheckoutFormValues` / `checkoutFormValuesToRequest(values, new Date())`, `useCheckoutBook` mutate, Field-linked **422** for borrower/notes plus summary for computed-field **422**, **404** / **409** / **412** stale refetch with preserved Borrower / Notes, in-flight disable. Props: `book`, `open`, `onClose` (cancel / success). Guard: do not mutate if `!isCheckoutEligible(book)`. Success: `onClose`, no `navigate`. Port `mapCheckoutFieldErrors` / field ids from `CheckoutPage`; `CHECKOUT_FORM_FIELDS` for linking is `borrower` and `notes` only. **412** copy must not mention Find by ISBN. Reuse `Alert`, `Button`, `Field`. Style with existing dialog tokens; add `.checkout-dialog` in `components.css` only if `.confirmation-dialog` cannot host a form without breaking confirm-only uses. |
| `src/features/loans/components/CheckoutDialog.test.tsx` (new) | Port selected-book cases from `CheckoutPage.test.tsx` that still apply: render (title, borrower, notes; no date inputs; no book `<select>`); submit payload includes borrower, UTC `checked_out_at`, `due_at` one year later, optional notes; cancel / Escape does not mutate; **422** field mapping; **404** / **409** / **412** refresh + preserved input; generic mutate error; pending disable; ineligible book does not submit. Assert success calls `onClose` and does not navigate. Drop ISBN Find, camera/hardware handoff, eligible-book picker, deep-link-from-`/checkout`, and nested "Confirm checkout" cases. Freeze `Date` (or inject `now`) when asserting timestamps. |
| `src/features/books/routes/BookDetailsPage.tsx` | Replace the Check Out `AppLink` with a `Button` that opens `CheckoutDialog` when `canCheckout`. Derive `canCheckout` from `isCheckoutEligible` (same predicate as the dialog). Read `checkout` search param: if `1` (or any present flag) and eligible, open then `replace` to drop the param. Pass the loaded `book`. Keep other actions unchanged. |
| `src/features/books/routes/BookDetailsPage.test.tsx` | Expect a Check Out **button** (not a link to `/checkout`). Opening it shows the dialog with Borrower / Notes. Ineligible cases still hide Check Out (on-loan, display-only, deleted). `?checkout=1` on an eligible book opens the dialog; ineligible / display-only does not. Prefer dialog behavior coverage in `CheckoutDialog.test.tsx` so details tests stay about gating and wiring. |

### 3. Remove `/checkout` and retarget entry points

| File | Change |
| ---- | ------ |
| `src/routes/routeMetadata.ts` | Delete `checkout`. Book details title/heading unchanged. |
| `src/routes/routes.tsx` | Stop importing `CheckoutPage`. Remove the `routeMetadata.checkout` child. Add a compatibility child at path `/checkout` that replace-navigates to `/books` or, when `bookId` is in the search string, to `/books/{bookId}?checkout=1` (forward only `bookId`, as `checkout=1`). Do not give that redirect a "Check Out" `handle.title`. |
| `src/features/loans/routes/CheckoutPage.tsx` | Delete after the dialog extract. |
| `src/features/loans/routes/CheckoutPage.test.tsx` | Delete after cases live in `CheckoutDialog.test.tsx` / `BookDetailsPage.test.tsx`. Do not leave a suite that mounts `/checkout` as a real page. |
| `src/layout/AppShell.tsx` | Remove the primary "Check Out" `NavLink`. Keep Books, Add Book, and Loans (and Check In until FEAT-22 removes it). |
| `src/layout/AppShell.test.tsx` | Drop "Check Out" from the primary-nav label list. Assert there is no primary link to `/checkout`. Change the client-nav smoke that currently clicks Check Out and expects heading "Check Out Book" to use another remaining feature route (e.g., Loans). |
| `src/features/loans/routes/LoansPage.tsx` | Empty-state "Check Out a Book" should go to `/books` (collection), not `/checkout`. |
| `src/features/loans/routes/LoansPage.test.tsx` | Expect that empty-state link to `/books`. |

Optional: a tiny `CheckoutRedirect` component next to routes if inline `Navigate` in `routes.tsx` is awkward; keep it
out of `routeMetadata`.

### 4. Scanning, browser journeys, and styles

| File | Change |
| ---- | ------ |
| `src/features/scanning/*` | No behavior change. `NewBookPage` remains the only lazy `IsbnCameraScanner` / hardware-scanner consumer. Remove checkout-only comments if any. |
| `src/features/books/routes/NewBookPage.test.tsx` | Unchanged camera/hardware handoff into lookup. |
| `e2e/library.lifecycle.spec.ts` | From book details, Check Out is a button that opens a dialog (heading in the dialog, not a page `h1` "Check Out Book"). Fill Borrower, press "Check Out Book", assert `POST /books/{id}/checkout` via `mockApi` (no nested "Confirm checkout" unless you kept one). Stay on the same book heading after success; status `on_loan`. Then continue the existing check-in / mark-read journey. |
| `e2e/accessibility.spec.ts` | Remove the `/checkout?bookId=...` critical route. Keep book detail. If an open-checkout state is worth an axe pass, open the dialog from `/books/accessibility-book` (available fixture) -- not a separate product route. |
| `e2e/support/mockApi.ts` | No change to `POST /books/{id}/checkout` handling. |
| `src/styles/components.css` | Keep `.confirmation-dialog`. Add form-dialog rules only if the checkout popup needs field spacing the confirm dialog does not provide. Remove checkout-page-only classes if any become unused (circulation card classes stay for loans / check-in). |
| `docs/baselines/FEAT-06_scanner-support.md` | `/checkout` is no longer a capture surface. Matrix and manual checklist: `/books/new` only. |

### 5. Docs hygiene (as part of this ticket, not a follow-up)

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Circulation checkout is a details dialog, not `/checkout`. Scanning lazy-load list is `/books/new` only. Inventory `CheckoutDialog` on `BookDetailsPage`; delete `CheckoutPage` / `/checkout`. Keep `checkoutModel` / `POST /books/{id}/checkout` / `412` handling. Nav: no Check Out item. Detail Check Out is a button that opens the dialog. Update "Next" remaining tickets to include FEAT-23 until the file is removed after completion. Preserve FEAT-21 as not done (alternate copies still deferred). |
| `docs/full-project-context.md` | Same route, nav, and scanning notes when that pack is kept current. |
| `docs/ToDo.md` | Add a checklist line for this ticket. |
| `docs/product-docs/PLAN.md` | Target IA: drop `/checkout` as a user-facing destination; checkout lives on book details. Shell persistent access: drop Check Out (Dashboard, Books, Add Book, Loans -- plus Check In only until FEAT-22). Workstream 6 deliverables: dialog on details, required borrower, optional notes, computed now + one-year due date; no available-book selection page. |
| `docs/MAINTAINERS.md` | Registered product routes: replace `/checkout` with the `/checkout` → `/books` (or details) compatibility redirect if maintainers still list paths. |
| `docs/tickets/FEAT-17_about-page.md` | How-to links and nav: check out from a book's details page, not `/checkout`. Do not require a Check Out nav item. |
| `docs/tickets/FEAT-19_wishlists.md` | Primary nav baseline: drop Check Out. |
| `docs/tickets/FEAT-21_display-only.md` | Rebase the planned alternate-copy UX onto `CheckoutDialog` / book details (links to another eligible copy's `/books/{id}`), not `/checkout` or Find-by-ISBN. Keep **412** messaging. Do not implement substitutes in FEAT-23. |
| `docs/tickets/FEAT-22_consolidate-check-in.md` | Delete "Checkout stays on `/checkout`". Nav: do not "Keep Check Out". About copy: check out from book details, return on `/loans`. |

`docs/product-docs/PRODUCT_REQS.V1.md` still requires a Check Out Book capability; satisfying it on book details is
enough. Do not revive a separate page to match that heading.

## Acceptance criteria

- `/checkout` is not a product page. Visiting `/checkout` replace-navigates to `/books`. Visiting
  `/checkout?bookId={id}` replace-navigates to `/books/{id}?checkout=1`.
- Primary navigation has no Check Out item.
- Eligible book details show a Check Out **button** that opens a dialog with Borrower and Notes only (no checkout
  datetime, no due date, no book picker, no ISBN Find).
- Ineligible books (deleted, not `available`, including `display_only`) do not offer Check Out.
- `?checkout=1` on an eligible details URL opens the same dialog once, then clears the param.
- Submit uses `useCheckoutBook` / `POST /books/{id}/checkout` only. Payload: trimmed `borrower`; `checked_out_at` =
  UTC now at press time; `due_at` = that timestamp's UTC date plus one calendar year (`YYYY-MM-DD`, leap-day
  clamped); `notes` omitted when blank.
- **422** maps onto borrower/notes when those fields error; computed-field **422** appears on the dialog summary.
  **404**, **409** (`Book is already checked out`), and **412** (`Book is display only`) refetch and keep typed
  input. In-flight submit is disabled.
- Successful checkout leaves the operator on the same details page with the dialog closed; the book shows as on loan
  after invalidation.
- Never simulate checkout with generic `PATCH`.
- Camera / hardware ISBN capture is not reachable from checkout (still on `/books/new`).
- Colocated tests cover the dialog, details gating/wiring, nav, empty-loans retarget, and model timestamps.
  Playwright lifecycle checks out from the details dialog. `make check` passes.
- `docs/AGENTS.md` (and PLAN / ToDo / sibling tickets as listed) no longer describe `/checkout` as a live feature
  route.

## Plan coverage

Workstream 6 already shipped checkout as a dedicated page with optional timestamps and ISBN Find. This ticket is IA
cleanup plus a smaller form: one dialog on details, same lifecycle endpoint, computed now and one-year due date.
Explicitly excludes FEAT-21 alternate copies and FEAT-15 through FEAT-20 product work except doc/nav mentions of
`/checkout`.
