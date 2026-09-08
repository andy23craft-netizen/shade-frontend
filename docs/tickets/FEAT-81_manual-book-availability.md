# FEAT-81 -- Manual Book Availability and Checkout Overrides

**Status:** Partially ready; single-book behavior is shipped, atomic bulk changes depend on `BACKEND-HANDOFF-PLAN-03`.

**Depends on:** `POST /books/{book_id}/availability`, checkout/check-in, active-loan queries, and later bulk availability contract.

## Objective

Let owners deliberately set Available, Reserved, Reading, Missing, or Display Only without using bibliographic edit or corrupting loan lifecycle state.

## Acceptance criteria

- [ ] Book Details uses the dedicated availability endpoint; `on_loan` and `unknown` are not manual choices.
- [ ] Active loans block manual changes and stale `409` responses refetch while preserving context.
- [ ] Missing atomically moves the copy to `unknown`; other status changes preserve location per contract.
- [ ] Display Only and Missing cannot check out; Reserved and Reading require an explicit confirmation before checkout.
- [ ] Availability never changes reading completion, owner rating, review, or unrelated metadata.
- [ ] Browse bulk actions use one atomic backend operation, report per-request success/failure honestly, and never loop single-book requests.

## Out of scope

TBR automation, reservation pickup details, and generic `PATCH` status mutation.

## Open questions

1. Which availability actions belong in the Browse bulk menu at launch: all five, or a smaller high-frequency set?
2. What exact warning copy should Reserved and Reading checkout share or distinguish?
