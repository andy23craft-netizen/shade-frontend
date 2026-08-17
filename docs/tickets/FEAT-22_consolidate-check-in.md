# FEAT-22 -- Consolidate check-in onto the loans page

## Objective

`/checkin` and `/loans` present the same circulation records in two places. Remove the dedicated check-in route and
keep `/loans` as the single circulation surface. Operators check a book back in from Active Loans (including a
`?bookId=` deep-link from book details). Do not change the backend contract: check-in remains
`POST /books/{id}/checkin`.

## Dependencies

FEAT-08 check-in and loan history are complete (`CheckinPage`, `checkinModel`, `checkinEligibility`, `LoansPage`,
`loanTemporal`, infinite loan pagination). Do not pull FEAT-15 Podman, FEAT-16 release artifacts, FEAT-17 About /
homepage, FEAT-18 collection filters, FEAT-19 wishlists, FEAT-20 dashboard reports, or FEAT-21 display-only alternate
copies into this ticket.

Sibling open tickets still mention `/checkin` in planned copy (FEAT-17 About links and nav,
FEAT-19 primary nav). Update those tickets in the same change so later work does not reintroduce the route.

## Contract references

No new backend endpoints. Treat these as complementary and leave them in place:

- `../technical-reference/openapi.json` -- `POST /books/{id}/checkin` (optional `CheckinRequest` with `returned_at`;
  **200** `BookRead`; **404** missing/soft-deleted; **409** no active loan; **422** validation). `GET /loans` and
  `GET /loans?book_id=...` remain the loan reads.
- `../technical-reference/API-for-FE.md` -- check-in of a book with no active loan → **409**
  `{"detail": "Book is not checked out"}`; blank return time omits the body so the API uses current UTC; never
  simulate check-in with generic `PATCH`.

Do not invent loan-update or loan-delete APIs. Completing a loan is check-in only.

## Current baseline

Already in place and should be reused (not rebuilt):

- `/loans` via `LoansPage` + `useInfiniteLoans()` + unpaginated `useBooks()` joins. Active vs returned sections from
  `returned_at`; due/overdue labels via `loanTemporal`; durable `Book {id}` fallback; infinite-scroll prefetch.
- `/checkin` via `CheckinPage` + `checkinModel` + `checkinEligibility` + `useCheckinBook`. Two modes:
  - no `bookId`: eligible-book picker from `useBooks` + `useLoans()` filtered by `isCheckinEligible`;
  - `?bookId=`: `useBook` + `useLoans({ bookId })`, Return Card form, optional `datetime-local` return time,
    `ConfirmationDialog`, Field-linked **422**, **404** / **409** stale-state refetch with preserved return time,
    in-flight disable, success navigates to `/books/{id}`.
- Eligibility is `findActiveLoan` / `isCheckinEligible` (active loan on a non-deleted book), not book `status` alone.
- Blank return time → omitted body; supplied values as UTC ISO 8601 via `checkinFormValuesToRequest`.
- Detail "Check In" on `BookDetailsPage` links to `/checkin?bookId=...` when `canCheckin`.
- Primary nav in `AppShell` includes both "Check In" (`/checkin`) and "Loans" (`/loans`).
- `useCheckinBook` already writes the returned `BookRead` into the detail cache and invalidates books, loans, and
  dashboard (PLAN.md 7.5). Do not change that invalidation.
- Shared UI: `Alert`, `AppLink`, `Button`, `Field`, `LoadingState`, `QueryErrorState`, `EmptyState`,
  `ConfirmationDialog`. Circulation card CSS (`.circulation-card`, `.circulation-record-card`, `.loans-card-list`)
  already styles both pages. `.checkin-card-list` is only used by the check-in picker.

The overlap: Active Loans on `/loans` is the same set as the check-in eligible-book picker (active, non-deleted
loans). Keeping both routes duplicates that list and splits the return action away from the history it updates.

## Product intent

1. **One circulation page** -- `/loans` is where operators see active loans, return a book, and review returned
   history. There is no primary "Check In" destination.
2. **Check in from an active loan** -- each eligible Active Loans row offers Check In. That action opens the existing
   Return Card flow (optional return date/time, confirmation, then `POST /books/{id}/checkin`). Returned rows never
   offer check-in.
3. **Deep-link from book details** -- "Check In" on `/books/:bookId` goes to `/loans?bookId={id}` and opens the same
   form for that book. Do not keep `/checkin`.
4. **Do not rely on infinite pages for a targeted book** -- a deep-linked `bookId` may not be in the first loan
   batch. When `bookId` is present, load that book and its loans with `useBook(bookId)` + `useLoans({ bookId })` (the
   current CheckinPage selected-book data path). The infinite list remains the history UI, not the eligibility source
   for the open form.
5. **Honest ineligible / stale outcomes** -- missing book, deleted book, or no active loan uses the current warning
   copy and refresh path; **409** `Book is not checked out` and **404** refetch with preserved return time stay.
6. **Old `/checkin` URLs** -- replace-navigate `/checkin` to `/loans`, preserving `?bookId=` so bookmarks and detail
   links that have not been rebuilt still work. The compatibility route must not keep a "Check In" document title.

Suggested composition (implementer-owned layout; keep it on `/loans`):

- Page `h1` remains "Loans" (route metadata unchanged).
- When `?bookId=` is set and the book is eligible, render the Return Card form above the Active / Returned sections
  (reuse `.circulation-card` markup from `CheckinPage`). Cancel clears `bookId` and leaves the operator on `/loans`
  (do not use `navigate(-1)`).
- When `?bookId=` is absent, Active Loans rows that pass `isCheckinEligible` show a Check In control that sets
  `?bookId=` to that loan's `book_id`. Omit the control when the joined book is missing or not eligible (deleted, or
  no active loan -- returned rows already have `returned_at`).
- After success: stay on `/loans`, clear `bookId`, and let existing query invalidation move the loan from Active to
  Returned. Do not navigate to book details (that was CheckinPage-only). Operators who started from details can use
  the book title link on the loan card.

Tone: extend `LoansPage`; do not add a second circulation product or a modal-only check-in that drops the return-time
field. Checkout stays on `/checkout`.

## Out of scope

- Changing `booksApi.checkin`, `useCheckinBook`, OpenAPI types, or PLAN.md 7.5 invalidation.
- Simulating check-in with generic `PATCH`, or adding loan CRUD.
- Checkout ISBN Find, camera/hardware scanning, or FEAT-21 alternate-copy UX.
- Loan filters, sort controls, or changing infinite-scroll batch size.
- Relocating dashboard / About (FEAT-17) beyond dropping `/checkin` from that ticket's planned links.
- Mark-unread, overdue notifications, or editing a completed loan.

## Remaining scope (file-level plan)

### 1. Extract the Return Card (keep behavior, drop the extra page)

| File | Change |
| ---- | ------ |
| `src/features/loans/components/CheckinForm.tsx` (new) | Move the selected-book Return Card from `CheckinPage`: optional return time `Field`, error summary focus, `validateCheckinFormValues` / `checkinFormValuesToRequest`, `ConfirmationDialog`, `useCheckinBook` mutate, Field-linked **422**, **404** / **409** stale refetch with preserved input, in-flight disable. Props: `book`, `loans` (or `activeLoan`), `onCancel` (clear `bookId`), `onSuccess` (clear `bookId`; stay on `/loans`). Reuse `mapCheckinFieldErrors` / `CHECKIN_FORM_FIELDS` as colocated helpers or a tiny `checkinFormErrors.ts` if the component file would otherwise mix too much mapping. Do not navigate to book details on success. |
| `src/features/loans/components/CheckinForm.test.tsx` (new) | Port selected-book cases from `CheckinPage.test.tsx`: form render (title, authors, borrower, blank return time); submit omitted body vs explicit UTC `returned_at`; confirmation cancel does not mutate; **422** field mapping; **404** / documented **409** `Book is not checked out` refresh + preserved input; generic mutate error; pending disable; status-inconsistent but active-loan eligible still submits; deleted / no-active-loan does not submit (parent may hide the form -- still guard inside). Assert success calls `onSuccess` and does not navigate to detail. |
| `src/features/loans/checkinModel.ts` / `checkinModel.test.ts` | Unchanged unless a small helper is needed. Keep blank → omitted body and UTC normalization. |
| `src/features/loans/checkinEligibility.ts` / `checkinEligibility.test.ts` | Unchanged. `DeleteBookPage` and `BookDetailsPage` keep importing `findActiveLoan` / `isCheckinEligible`. |

### 2. Loans page -- history plus check-in

| File | Change |
| ---- | ------ |
| `src/features/loans/routes/LoansPage.tsx` | Read `bookId` from search params. When set, enable `useBook(bookId)` + `useLoans({ bookId })` and render `CheckinForm` when eligible; when not eligible / **404**, keep the current CheckinPage warning + "refresh" that clears `bookId` and invalidates books/loans. When unset, do not mount those targeted queries. On each Active Loans row, if the joined book exists and `isCheckinEligible(book, loadedLoansForEligibility)`, add a Check In button that `setSearchParams({ bookId })`. Use the infinite list plus the targeted `useLoans({ bookId })` items when deciding eligibility for the open form -- do not require the targeted loan to appear in the current infinite page. Keep empty / loading / retry / next-page footer behavior. Heading stays "Loans". |
| `src/features/loans/routes/LoansPage.test.tsx` | Keep existing infinite-scroll, due/overdue, missing-book fallback, and empty-section tests. Add: Check In on an eligible active row sets `?bookId=`; returned rows have no Check In; deleted joined book has no Check In; `?bookId=` shows Return Card via `CheckinForm`; ineligible / not-found `bookId` warning; success leaves the operator on `/loans` without `bookId`. Mock `useCheckinBook` / `useBook` / `useLoans` only as needed (prefer rendering `CheckinForm` coverage in its own file so `LoansPage` tests stay about wiring). |

Do not reimplement the no-`bookId` eligible-book picker from `CheckinPage`. Active Loans replaces it.

### 3. Remove `/checkin` and retarget entry points

| File | Change |
| ---- | ------ |
| `src/routes/routeMetadata.ts` | Delete `checkin`. Keep `loans` title/heading "Loans". |
| `src/routes/routes.tsx` | Stop importing `CheckinPage`. Remove the `routeMetadata.checkin` child. Add a compatibility child at path `/checkin` that replace-navigates to `/loans` and forwards the current search string (`bookId` included). Do not give that redirect a "Check In" `handle.title`. |
| `src/features/loans/routes/CheckinPage.tsx` | Delete after the form extract. |
| `src/features/loans/routes/CheckinPage.test.tsx` | Delete after cases live in `CheckinForm.test.tsx` / `LoansPage.test.tsx`. Do not leave a suite that mounts `/checkin` as a real page. |
| `src/layout/AppShell.tsx` | Remove the primary "Check In" `NavLink`. Keep "Check Out" and "Loans". |
| `src/layout/AppShell.test.tsx` | Drop "Check In" from the primary-nav label list. Assert there is no primary link to `/checkin`. Keep Loans → `/loans`. |
| `src/features/books/routes/BookDetailsPage.tsx` | Change the gated "Check In" `AppLink` from `/checkin?bookId=` to `/loans?bookId=`. Eligibility gating stays `isCheckinEligible`. |
| `src/features/books/routes/BookDetailsPage.test.tsx` | Expect `/loans?bookId=...` on the Check In link (today around the `canCheckin` cases). Assert `/checkin` is not used. |

Optional: a tiny `CheckinRedirect` component next to routes if inline `Navigate` in `routes.tsx` is awkward; keep it
out of `routeMetadata`.

### 4. Browser journeys and styles

| File | Change |
| ---- | ------ |
| `e2e/library.lifecycle.spec.ts` | After checkout, detail "Check In" lands on `/loans` (heading "Loans") with the Return Card / Check In Book submit for that book. Confirm still uses `ConfirmationDialog` and `POST /books/{id}/checkin` (already asserted via `mockApi`). Then continue the mark-read journey from book details (navigate via the loan card title or `/books/{id}` -- do not assume check-in success still dumps the operator on detail). |
| `e2e/accessibility.spec.ts` | Keep the loans critical route. Do not add a `/checkin` scan. If a check-in-open state is worth an axe pass, use `/loans?bookId=...` with an on-loan fixture -- not a separate product route. |
| `e2e/support/mockApi.ts` | No change to `POST /books/{id}/checkin` handling. |
| `src/styles/components.css` | Remove `.checkin-card-list` if nothing references it after the picker goes away. Keep `.circulation-card` / `.circulation-record-card` / `.loans-card-list`. Add a loans-page modifier only if the inline Return Card needs spacing the existing circulation classes do not provide. |

### 5. Docs hygiene (as part of this ticket, not a follow-up)

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Circulation is `/checkout` and `/loans` only. Detail Check In → `/loans?bookId=`. Inventory `CheckinForm` on `LoansPage`; delete `CheckinPage` / `/checkin`. Keep `checkinModel` / `checkinEligibility` / `POST /books/{id}/checkin`. Update "Next" remaining tickets to include FEAT-22 until the file is removed after completion. Nav list: no Check In item. |
| `docs/full-project-context.md` | Same route and nav notes when that pack is kept current. |
| `docs/ToDo.md` | Add a checklist line for this ticket. |
| `docs/product-docs/PLAN.md` | Target IA: drop `/checkin` as a user-facing destination; check-in lives on `/loans`. Shell persistent access: Dashboard, Books, Add Book, Check Out, Loans (no Check In). Workstream 7 deliverable becomes "check-in on loan history" rather than a separate check-in page. |
| `docs/MAINTAINERS.md` | Registered product routes: replace `/checkin` with the `/checkin` → `/loans` compatibility redirect if maintainers still list paths; primary IA is `/loans`. |
| `docs/tickets/FEAT-17_about-page.md` | How-to links and nav: check in via `/loans`, not `/checkin`. Do not require a Check In nav item. About copy can say check out on `/checkout` and return books on `/loans`. |
| `docs/tickets/FEAT-19_wishlists.md` | Primary nav baseline: drop Check In. |

`docs/product-docs/PRODUCT_REQS.V1.md` still requires a Check In Book capability; satisfying it on `/loans` is enough.
Do not revive a separate page to match that heading.

## Acceptance criteria

- `/checkin` is not a product page. Visiting `/checkin` or `/checkin?bookId={id}` replace-navigates to `/loans` with
  the same search string.
- Primary navigation has Check Out and Loans, and has no Check In item.
- `/loans` still shows infinite-scrolled Active and Returned sections with due/overdue labels and `Book {id}`
  fallback.
- Eligible Active Loans rows offer Check In; returned rows and non-eligible (deleted / no active loan) rows do not.
- `?bookId=` on `/loans` opens the Return Card for that book using `useBook` + `useLoans({ bookId })`, even when that
  loan is not in the current infinite page.
- Optional return time: blank omits the body; supplied values are UTC ISO 8601. Confirmation is required before
  mutate. Submit uses `useCheckinBook` / `POST /books/{id}/checkin` only.
- **422** maps onto the return-time field; **404** and **409** (`Book is not checked out`) refetch and keep the typed
  return time. In-flight submit is disabled.
- Book details "Check In" (still gated by `isCheckinEligible`) links to `/loans?bookId=...`.
- Successful check-in leaves the operator on `/loans` without `bookId`; the loan shows as returned after invalidation.
- Never simulate check-in with generic `PATCH`.
- Colocated tests cover form behavior, loans-page wiring, nav, and detail retargeting. Playwright lifecycle goes
  through `/loans` for return. `make check` passes.
- `docs/AGENTS.md` (and PLAN / ToDo / sibling tickets as listed) no longer describe `/checkin` as a live feature
  route.

## Plan coverage

Workstream 7 already shipped check-in and loan history as two routes. This ticket is IA cleanup: one circulation
page, same lifecycle endpoint. Explicitly excludes checkout changes and FEAT-15 through FEAT-21 product work except
doc/nav mentions of `/checkin`.
