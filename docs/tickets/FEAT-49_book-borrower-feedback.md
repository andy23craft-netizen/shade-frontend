# FEAT-49 -- Book Borrower Rating and Review

**Status:** Ready against OpenAPI 1.1.3.

**Depends on:** Shipped check-in, `PUT /loans/{id}/feedback`, book borrower-review list, and `FEAT-30` presentation.

## Objective

Require a 1–5 borrower rating for completed returns and support one optional, idempotently editable review without changing owner metadata.

## Acceptance criteria

- [ ] The check-in experience requires a rating, closes the loan first, then writes feedback as a separate operation.
- [ ] A failed feedback write never repeats or rolls back successful check-in and offers retry against the returned loan ID.
- [ ] `PUT` safely creates/replaces feedback; review clear/delete behavior follows the documented endpoint semantics.
- [ ] Loan cards show full typed borrower name and rating; review disclosures use backend `borrower_display_name` safely.
- [ ] Book Details shows backend borrower average/count and paginated reviews without mixing owner rating/review/read state.
- [ ] Partial success, reload recovery, duplicate submission, empty review, deletion, pagination, and accessibility are tested.

## Out of scope

Borrower authentication, signature capture, email requests, and public reviews.

## Open questions

1. After check-in succeeds but feedback fails, where should the durable retry entry live?
2. Should the UI expose feedback deletion, or only rating/review replacement and review clearing?
3. Should review attribution use backend display name verbatim or a frontend-derived initials presentation?
