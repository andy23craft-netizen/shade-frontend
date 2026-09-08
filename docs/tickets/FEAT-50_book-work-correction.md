# FEAT-50 -- Book Work Grouping and Correction

**Status:** Ready against OpenAPI 1.1.3, pending interaction decisions.

**Depends on:** Shipped Work read/item/merge/split routes and book `work_id`.

## Objective

Let owners preview and correct which physical book copies belong to the same Work, atomically and reversibly.

## Acceptance criteria

- [x] Edit Book exposes **Group as Same Work** and **Separate from Work** using book-only candidates. Candidates are restricted to exact ISBN or matching title and author.
- [x] The confirmation previews the selected physical copies and reminds the owner to verify title, author, and shelf before mutation.
- [x] Merge/split use dedicated Work endpoints and refetch affected books, loans, borrower feedback, and Work data.
- [x] Cross-media items are never selectable; mutation errors retain the owner's selection and correction context.
- [x] Original loans and feedback are not rewritten in frontend state; the UI accepts refetched backend truth.
- [x] A completed correction has a practical inverse path: separate a grouped copy or group a separated copy again.

## Out of scope

Automatic clustering UI, cross-media Works, and editing historical loans.

## Open questions

1. Where should owners discover Work correction: Book Details only, or also duplicate-resolution flows?
- Book details is fine. 

2. What minimum preview evidence makes a merge/split safe enough to confirm?
- title and author and shelf, for physical check. 

3. Does “reversible” require a dedicated undo action, or is an inverse merge/split workflow sufficient?
- the latter

## Follow-up note

Surface possible duplicate Work candidates from the Dashboard in a future, separately scoped slice. Do not add that Dashboard entry point as part of this ticket's implementation.
