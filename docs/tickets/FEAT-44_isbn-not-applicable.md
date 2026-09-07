# FEAT-44 -- ISBN Not Applicable

**Status:** Ready against OpenAPI 1.1.3.

**Depends on:** Book create/edit, Build Mode, detail, and incomplete-metadata queries.

## Objective

Represent pre-ISBN editions intentionally without treating them as incomplete catalog records.

## Acceptance criteria

- [ ] Create, edit, and Build review expose **ISBN not applicable (pre-ISBN edition)**.
- [ ] A non-empty ISBN and `isbn_not_applicable: true` cannot be submitted together.
- [ ] Marking an ISBN-bearing record not applicable requires confirmation and clears ISBN in the same update.
- [ ] Restoring applicability leaves ISBN blank and invites entry/lookup without fabricating a value.
- [ ] Details display “ISBN not applicable”; cleanup and missing-ISBN counts/lists exclude these books per backend behavior.
- [ ] Lookup drafts, partial bulk results, validation errors, and minimal update payloads are tested.

## Out of scope

Changing ISBN validation or external metadata providers.

## Open questions

1. Should “ISBN not applicable” be visible by default on create, or live under optional metadata?
