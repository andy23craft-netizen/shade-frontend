# FEAT-22 -- Consolidate check-in onto the loans page

## Objective

Product check-in now lives on `/loans`. Remaining work is documentation: stop describing `/checkin` as a live feature
route. Do not change the backend contract: check-in remains `POST /books/{id}/checkin`.

## Dependencies

FEAT-08 check-in and loan history, plus this ticket's product IA, are complete (`CheckinForm` on `LoansPage`,
`checkinModel`, `checkinEligibility`, `loanTemporal`, infinite loan pagination, `/checkin` → `/loans` compatibility
redirect).

FEAT-19 wishlists and FEAT-21 display-only alternate-copy UX are complete; do not reference their removed ticket
files. Checkout on `/checkout` already offers substitutes after display-only blocks; do not rebuild that here.

Do not pull FEAT-15 Podman, FEAT-16 release artifacts, FEAT-17 About / homepage, FEAT-18 collection filters, or
FEAT-20 dashboard reports into this ticket.

This ticket may ship remaining docs in a separate PR from FEAT-23 (checkout consolidation). No FEAT-23 work is
required here.

## Contract references

No new backend endpoints. Treat these as complementary and leave them in place:

- `../technical-reference/openapi.json` -- `POST /books/{id}/checkin` (optional `CheckinRequest` with `returned_at`;
  **200** `BookRead`; **404** missing/soft-deleted; **409** no active loan; **422** validation). `GET /loans` and
  `GET /loans?book_id=...` remain the loan reads.
- `../technical-reference/API-for-FE.md` -- check-in of a book with no active loan → **409**
  `{"detail": "Book is not checked out"}`; blank return time omits the body so the API uses current UTC; never
  simulate check-in with generic `PATCH`. After check-in, refresh loan state via `GET /loans?book_id=...` (or
  `GET /loans/{id}` when a loan id is already known).

Do not invent loan-update or loan-delete APIs. Completing a loan is check-in only.

## Current baseline (shipped)

Already in place; reuse it. Docs below still lag this inventory.

- `/loans` via `LoansPage` + `useInfiniteLoans()` + unpaginated `useBooks()` joins. Active vs returned sections from
  `returned_at`; due/overdue labels via `loanTemporal`; durable `Book {id}` fallback; infinite-scroll prefetch.
- Check-in via `CheckinForm` on `LoansPage` (`checkinModel`, `checkinEligibility`, `useCheckinBook`). Eligible Active
  Loans rows offer Check In (`?bookId=`). Returned / missing / ineligible rows do not. `?bookId=` opens the Return
  Card: optional `datetime-local` return time, `ConfirmationDialog`, Field-linked **422**, **404** / **409**
  stale-state refetch with preserved return time, in-flight disable. Success clears `bookId` and stays on `/loans`.
- Efficient loan resolution: in-page loan/book when Check In is opened from Active Loans; otherwise
  `useLoans({ bookId })` plus `useBooks()` cache, with `useBook(bookId)` only on cache miss. Targeted queries are not
  mounted when `bookId` is unset.
- Eligibility is `findActiveLoan` / `isCheckinEligible` (active loan on a non-deleted book), not book `status` alone.
- Blank return time → omitted body; supplied values as UTC ISO 8601 via `checkinFormValuesToRequest`.
- Detail "Check In" on `BookDetailsPage` links to `/loans?bookId=...` when `canCheckin`.
- `CatalogGuide` (About homepage How to Use dialog) links to `/loans`.
- Primary nav in `AppShell`: direct Dashboard link; Collection `DrawerNavMenu` (Browse, Manage, Wishlists); Circulation
  `DrawerNavMenu` with Check Out and Loans only (no Check In item).
- `/checkin` is not a product page. `routeMetadata.checkin` is path-only (no title/heading). `LegacyCheckinRedirect`
  replace-navigates to `/loans` and forwards the current search string.
- `CheckinPage` / `CheckinPage.test.tsx` are gone. Colocated coverage is `CheckinForm.test.tsx` and
  `LoansPage.test.tsx`. Playwright lifecycle returns through `/loans`; accessibility scans `/loans` (not `/checkin`).
- `.checkin-card-list` is gone. Shared UI and `.circulation-card` / `.circulation-record-card` / `.loans-card-list`
  remain.
- `useCheckinBook` already writes the returned `BookRead` into the detail cache and invalidates books, loans, and
  dashboard (PLAN.md 7.5). Do not change that invalidation.

## Out of scope

- Changing `booksApi.checkin`, `useCheckinBook`, OpenAPI types, or PLAN.md 7.5 invalidation.
- Simulating check-in with generic `PATCH`, or adding loan CRUD.
- Checkout ISBN Find, camera/hardware scanning, or rebuilding shipped display-only alternate-copy UX.
- FEAT-23 checkout consolidation (may land in another PR).
- Loan filters, sort controls, or changing infinite-scroll batch size.
- Relocating dashboard / About (FEAT-17) beyond retargeting workflow copy away from `/checkin` as a destination.
- Mark-unread, overdue notifications, or editing a completed loan.
- Reopening shipped product files (`LoansPage`, `CheckinForm`, `AppShell`, `BookDetailsPage`, `CatalogGuide`, routes,
  e2e) unless a doc edit uncovers a real mismatch.

## Remaining scope

### Docs hygiene

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Circulation is `/checkout` and `/loans` only. Detail Check In → `/loans?bookId=`. Inventory `CheckinForm` on `LoansPage`; `/checkin` is the `LegacyCheckinRedirect` compatibility path, not `CheckinPage`. Keep `checkinModel` / `checkinEligibility` / `POST /books/{id}/checkin`. Circulation drawer: Check Out and Loans only (no Check In item). Mark FEAT-22 product work complete; remaining tickets start at FEAT-23. |
| `docs/full-project-context.md` | Same route and nav notes when that pack is kept current. |
| `docs/ToDo.md` | Add a checklist line for this ticket (product complete; docs remaining, or complete once this hygiene lands). |
| `docs/product-docs/PLAN.md` | Target IA: drop `/checkin` as a user-facing destination; check-in lives on `/loans`. Shell persistent access: Dashboard link; Collection drawer (Browse, Manage, Wishlists); Circulation drawer (Check Out, Loans -- no Check In). Workstream 7 deliverable is "check-in on loan history" rather than a separate check-in page. |
| `docs/MAINTAINERS.md` | Registered product routes: `/checkin` is the `/checkin` → `/loans` compatibility redirect; primary IA is `/loans`. |

`docs/product-docs/PRODUCT_REQS.V1.md` still requires a Check In Book capability; satisfying it on `/loans` is enough.
Do not revive a separate page to match that heading.

## Acceptance criteria

- Product behavior above stays as shipped; this remaining pass is docs only.
- `docs/AGENTS.md` (and PLAN / ToDo / maintainer docs as listed) no longer describe `/checkin` as a live feature route.
- No in-app product copy in those docs still sends operators to a dedicated Check In page.
- Never simulate check-in with generic `PATCH`.

## Plan coverage

Workstream 7 shipped check-in and loan history; product IA cleanup (one circulation page, same lifecycle endpoint) is
also shipped. Explicitly excludes checkout changes (FEAT-23 may land separately) and already-shipped FEAT-15 through
FEAT-21 product work except remaining doc mentions of `/checkin` as a destination.
