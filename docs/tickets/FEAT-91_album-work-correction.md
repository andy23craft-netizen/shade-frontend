# FEAT-91 -- Album Work-Correction Research

**Status:** Ready

**Dependency group:** Borrower feedback and media-specific Work identity.

**Depends on:** Backend loan-feedback and Work grouping routes; `FEAT-30` for shared borrower
name presentation; Enable Loans settings work derived from PLAN-02.

## Objective

Define an owner-correctable album Work-grouping workflow while keeping borrower data separate
from owner catalog data.

## Acceptance criteria

- [ ] Every album copy belongs to one album-specific Work, and the owner can preview and
      execute Group as Same Work / Separate from Work corrections atomically.
- [ ] Work correction is audited, reversible, and reassigns historical aggregates without
      rewriting original loans or feedback.
- [ ] No Work can combine books and albums.

## Out of scope

Handwritten signature capture, borrower authentication, email review requests, public review
links, and borrower-derived recommendations.


Match the exact setup of the book work correction work flow. it should be small, unobtrusive,
and fit in the edit album page without spanning the whole page. Match size, shape, layout, etc,
but make it match the album aesthetic. 