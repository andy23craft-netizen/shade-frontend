# FEAT-50 -- Book Work Grouping and Correction

**Status:** Ready against OpenAPI 1.1.3, pending interaction decisions.

**Depends on:** Shipped Work read/item/merge/split routes and book `work_id`.

## Objective

Let owners preview and correct which physical book copies belong to the same Work, atomically and reversibly.

## Acceptance criteria

- [ ] Book Details exposes **Group as Same Work** and **Separate from Work** using book-only candidates.
- [ ] The confirmation previews source/target Works, affected copies, canonical title, and aggregate implications before mutation.
- [ ] Merge/split use dedicated Work endpoints and refetch affected books, feedback summaries/reviews, and Work data.
- [ ] Cross-media items are never selectable; stale, missing, validation, and concurrent-change responses retain the owner's context.
- [ ] Original loans and feedback are not rewritten in frontend state; aggregates are accepted from refetched backend truth.
- [ ] A completed correction exposes a practical reversal path and accessible success summary.

## Out of scope

Automatic clustering UI, cross-media Works, and editing historical loans.

## Open questions

1. Where should owners discover Work correction: Book Details only, or also duplicate-resolution flows?
2. What minimum preview evidence makes a merge/split safe enough to confirm?
3. Does “reversible” require a dedicated undo action, or is an inverse merge/split workflow sufficient?
