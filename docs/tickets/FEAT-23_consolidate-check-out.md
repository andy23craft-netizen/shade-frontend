# FEAT-23 -- Consolidate checkout onto book details

## Objective

Finish the remaining FEAT-23 payload and docs work. Checkout already lives in a popup on `/books/:bookId` (not a
dedicated page). The dialog still omits `due_at`. Send a computed due date of noon UTC on the calendar date 366 days
after the checkout day, from the same submit `now` as `checked_out_at`. Do not change the backend contract: checkout
remains `POST /books/{id}/checkout`.

## Dependencies

The IA and dialog work for this ticket is already in the tree (`CheckoutDialog` on `BookDetailsPage`,
`LegacyCheckoutRedirect`, Circulation drawer Loans-only, no `CheckoutPage`). Do not rebuild that surface.

FEAT-07 checkout, FEAT-21 display-only alternates, and FEAT-22 check-in consolidation are complete (those ticket files
are removed). Product check-in stays `CheckinForm` on `/loans`; `/checkin` stays `LegacyCheckinRedirect`. Do not
re-home a substitute chooser or ISBN Find onto checkout.

This ticket may ship in its own PR. Do not block on or bundle FEAT-24. Do not update `docs/AGENTS.md`,
`docs/full-project-context.md`, or `docs/MAINTAINERS.md`.

## Contract references

No new backend endpoints. Treat these as complementary and leave them in place:

- `../technical-reference/openapi.json` -- `POST /books/{id}/checkout` (`CheckoutRequest`: required `borrower`;
  optional `checked_out_at`, `due_at`, `notes`; **200** `BookRead`; **404** missing/soft-deleted; **409** already on
  loan; **412** display-only; **422** validation).
- `../technical-reference/API-for-FE.md` -- only `borrower` is required (1-255). Omitted `checked_out_at` defaults to
  current UTC. Formats for `checked_out_at` / `due_at` / `notes` are not validated (frontend still sends normalized
  UTC ISO 8601 and `YYYY-MM-DD`). Success sets `status=on_loan` and creates a `Loan` with `returned_at=null`. Never
  simulate checkout with generic `PATCH`.

Do not invent loan-create APIs. Creating a loan is checkout only.

## Current baseline

Already in place and should be reused (not rebuilt):

- Product checkout is `CheckoutDialog` on `BookDetailsPage`. "Check Out" is a `Button` gated by `isCheckoutEligible`
  (`deletion_date === null` and `status === 'available'`). Display-only, on-loan, and deleted books do not get the
  control. Detail "Check In" still links to `/loans?bookId=...` when `isCheckinEligible`.
- Dialog fields are Borrower (required) and Notes (optional). No book picker, date inputs, ISBN Find, nested
  `ConfirmationDialog`, or alternate-copy chooser. Focus Borrower on open. Submit label "Check Out Book" (pending:
  "Checking Out…"). Cancel / Escape closes without mutating. Success closes the dialog, resets the form, and stays on
  details (`useCheckoutBook` invalidation already flips the book to `on_loan`).
- `checkoutFormValuesToRequest(values, now)` already sends trimmed `borrower`, `checked_out_at` via
  `formatUtcIso8601(now)`, and trimmed `notes` when non-empty. It does **not** set `due_at`. Colocated tests currently
  assert that omission.
- `CheckoutDialog` maps Field-linked **422** onto borrower/notes; unmapped (computed-field) **422** lands on the
  dialog summary. **404** / **409** / **412** refetch books and loans and keep typed Borrower / Notes. In-flight
  submit is disabled. **412** copy does not mention Find by ISBN.
- `/checkout` is `LegacyCheckoutRedirect` (path-only `routeMetadata.checkout`; no "Check Out" document title):
  replace-navigate to `/books`, or `/books/{id}?checkout=1` when `bookId` is present. Eligible details with
  `?checkout=1` open the dialog once, then replace-clear the param. Ineligible / missing books do not open it.
- Circulation `DrawerNavMenu` is Loans only (no Check Out or Check In item). Loans empty state and `CatalogGuide`
  "Check Out" target `/books`. Camera / hardware capture remains on `/books/new` only.
- Playwright lifecycle checks out from the details dialog (no nested "Confirm checkout"), stays on the book heading,
  then checks in on `/loans`. `e2e/accessibility.spec.ts` does not scan a `/checkout` product route.
- `docs/ToDo.md` already has a completed checklist line for this ticket. Leave it.
- `docs/product-docs/PLAN.md` still lists `/checkout` as a user-facing destination and Circulation as Check Out plus
  Loans. Workstream 6 still describes a checkout page with operator-editable timestamps.
- `docs/AGENTS.md` still lists `/checkout` as a second ISBN capture surface.

## Product intent (remaining)

1. **Timestamps are computed at submit** -- when "Check Out Book" is pressed (after client validation passes), take a
   single `Date` `now` and send:
   - `checked_out_at`: `formatUtcIso8601(now)` (UTC ISO 8601 ending in `Z`) -- already shipped;
   - `due_at`: the UTC calendar date of noon on the day that is 366 days after the checkout day, as `YYYY-MM-DD`.
   Compute the due date by anchoring at noon UTC on the checkout calendar day (the UTC date portion of `now`), adding
   366 days, and formatting that instant's UTC date. Send both from the same submit so the due date matches the
   checkout timestamp's day anchor. Do not omit `due_at` so the API can pick a different default.
2. **Docs match the shipped IA** -- `PLAN.md` and the `docs/AGENTS.md` scanner notes must not describe `/checkout` as
   a live feature or capture route.

## Out of scope

- Changing `booksApi.checkout`, `useCheckoutBook`, OpenAPI types, or PLAN.md 7.5 invalidation.
- Simulating checkout with generic `PATCH`, or adding loan CRUD.
- Rebuilding `CheckoutDialog` / `LegacyCheckoutRedirect`, or restoring `CheckoutPage`.
- ISBN Find, camera, or hardware scanning as a checkout entry (leave those on `/books/new` only).
- Re-implementing FEAT-21 alternate-copy offers on details.
- Reverting FEAT-22 (`CheckinForm` on `/loans`, `/checkin` redirect, no Check In nav item).
- FEAT-24 scanner expansion, or updates to other open tickets.
- Updating `docs/full-project-context.md` or `docs/MAINTAINERS.md`. Limit `docs/AGENTS.md` edits in this ticket to
  dropping `/checkout` as a scanner capture surface.
- Editable due dates, loan-length settings, overdue notifications, or mark-unread.

## Remaining scope (file-level plan)

### 1. Computed `due_at`

| File | Change |
| ---- | ------ |
| `src/features/loans/checkoutModel.ts` | Add `dueAtOneYearFrom(now: Date): string`: take the UTC calendar date of `now`, construct noon UTC on that date, add 366 days, return that instant's UTC date as `YYYY-MM-DD`. Change `checkoutFormValuesToRequest` to always set `due_at` via `dueAtOneYearFrom(now)` from the same `now` already used for `checked_out_at`. |
| `src/features/loans/checkoutModel.test.ts` | Request always includes `checked_out_at` and `due_at` from the injected `now`. Due date is noon UTC on the calendar day 366 days after the checkout day (e.g., checkout day 2026-01-15 → due date 2027-01-16; include a leap-year checkout-day case). Stop asserting that `due_at` is omitted. |
| `src/features/loans/components/CheckoutDialog.test.tsx` | Submit payload includes `due_at` from `dueAtOneYearFrom`. Keep existing borrower/notes, error, and no-date-input coverage. Freeze `Date` (or inject `now`) when asserting timestamps. |

`src/api/dateTime.ts` already has `formatUtcIso8601` and `formatDateOnly` (`formatDateOnly` is local-time; do not use
it for `due_at` if checkout is UTC). Keep the 366-day noon-UTC math in `checkoutModel` unless a UTC `YYYY-MM-DD` helper
is clearly reused.

No dialog field for due date. Optional one-line help (checkout time is now; due date is one year plus one day later)
is implementer-owned; do not add date controls. **422** on computed `due_at` already has no input: keep showing it on
the dialog error summary.

### 2. Docs hygiene (as part of this ticket, not a follow-up)

| File | Change |
| ---- | ------ |
| `docs/product-docs/PLAN.md` | Target IA: drop `/checkout` as a user-facing destination; checkout lives on book details. Shell persistent access: Dashboard link; Collection drawer (Browse, Manage, Wishlists); Circulation drawer without Check Out (Loans). Workstream 6 deliverables: dialog on details, required borrower, optional notes, computed now + 366-day due date; no available-book selection page. |
| `docs/AGENTS.md` | Drop `/checkout` as a second capture surface; `/books/new` remains the documented capture page until FEAT-24. |

`docs/product-docs/PRODUCT_REQS.V1.md` still requires a Check Out Book capability; satisfying it on book details is
enough. Do not revive a separate page to match that heading. Do not retouch `docs/ToDo.md`.

## Acceptance criteria

- Submit uses `useCheckoutBook` / `POST /books/{id}/checkout` only. Payload: trimmed `borrower`; `checked_out_at` =
  UTC now at press time; `due_at` = UTC calendar date of noon on the day 366 days after the checkout day
  (`YYYY-MM-DD`); `notes` omitted when blank.
- Colocated model and dialog tests cover the computed `due_at` (including a leap-year checkout-day case in the model
  suite). Do not add date inputs.
- `docs/product-docs/PLAN.md` and `docs/AGENTS.md` scanner notes no longer describe `/checkout` as a live
  feature or capture route. Do not update `docs/full-project-context.md` or `docs/MAINTAINERS.md`
  in this ticket.
- Never simulate checkout with generic `PATCH`. `make check` passes.

## Plan coverage

Workstream 6 checkout is now a details dialog with the same lifecycle endpoint. Remaining work is sending the
computed 366-day `due_at` and aligning PLAN / AGENTS.md scanner copy with that IA.
