# Ticket 01: Fix Bulk Add author metadata population

## Problem

Bulk Add metadata lookup can return otherwise usable book metadata without populating the author field on the review card. This makes lookup results incomplete and removes much of the value of scanning.

## Investigation

- Capture representative lookup responses where the provider returned authors but the review card did not.
- Trace `BulkBookLookupItemResult.draft.authors` through `draftFromQueueItem`, queue updates, draft initialization, and rendering.
- Verify whether the failure is response-shape normalization, state replacement, parsing, or provider data loss.
- Confirm how the bulk-import endpoint resolves textual authors against the normalized Authors table.

## Requirements

- Populate the review-card author field whenever lookup returns usable author information.
- Preserve provider author ordering and multiple-author data.
- Resolve or reuse normalized Author records during import; create missing authors through the established backend contract.
- Only mark author data missing when the provider returned no usable author information.
- Continue allowing the user to edit the populated value before submission.

## Acceptance criteria

- A successful lookup containing one author populates the author field.
- A successful lookup containing multiple authors populates all authors without merging them incorrectly.
- Existing normalized authors are reused during import.
- Missing authors are created once rather than duplicated by casing or whitespace differences.
- Lookups with no usable author remain visibly incomplete.
- Regression tests cover lookup-to-draft population and the submitted import payload.

## Scope note

Start as a frontend/API-boundary diagnosis. If the lookup or import response violates its documented contract, stop and produce a backend follow-up with captured payload evidence rather than masking the defect in UI code.

