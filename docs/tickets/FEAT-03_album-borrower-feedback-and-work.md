# FEAT-03 -- Album borrower feedback and Work correction

**Status:** Blocked on the shared borrower-feedback and Work contracts.

**Dependency group:** Borrower feedback and media-specific Work identity.

**Depends on:** Backend loan-feedback and Work grouping routes; `FEAT-30` for shared borrower
name presentation; Enable Loans settings work derived from PLAN-03.

## Objective

Extend shipped album circulation with borrower feedback and owner-correctable album Work
grouping while keeping borrower data separate from owner catalog data.

## Acceptance criteria

- [ ] Disabling loans prevents new album checkout without removing or hiding historical
      loans and feedback.
- [ ] Album check-in requires a 1--5 borrower rating and closes the loan before any optional
      written-review operation.
- [ ] Optional review submission is idempotent and cannot repeat or roll back check-in.
- [ ] Loan cards use the shared accessible cursive-style typed-name treatment from `FEAT-30`,
      show ratings, and expose reviews through an accessible disclosure using borrower
      initials.
- [ ] Borrower rating/review never changes the owner's album rating, review, or played state.
- [ ] Album detail shows the agreed rating count/average summary; individual reviews use the
      paginated album review contract.
- [ ] Every album copy belongs to one album-specific Work, and the owner can preview and
      execute Group as Same Work / Separate from Work corrections atomically.
- [ ] Work correction is audited, reversible, and reassigns historical aggregates without
      rewriting original loans or feedback.
- [ ] No Work can combine books and albums.

## Out of scope

Handwritten signature capture, borrower authentication, email review requests, public review
links, and borrower-derived recommendations.
