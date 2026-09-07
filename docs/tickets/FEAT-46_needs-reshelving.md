# FEAT-46 -- Needs Reshelving Queue

**Status:** Blocked on `BACKEND-HANDOFF-PLAN-03` reshelving contract.

**Depends on:** Durable book task state plus Dashboard list support.

## Objective

Let an owner mark or clear a small placement-attention task without changing book catalog, shelf, category, or circulation state.

## Acceptance criteria

- [ ] Book Details can mark Needs Reshelving with a bounded optional reason/note and clear it explicitly.
- [ ] Dashboard shows a pinned, deterministic queue with book identity, current placement, reason, and marked time.
- [ ] Mark/clear are idempotent or define conflict handling; failures never masquerade as saved state.
- [ ] Completing a shelf/category edit does not silently clear the task unless the contract explicitly says so.
- [ ] Deleted books, pagination/limits, stale state, loading, empty, retry, mobile, zoom, and keyboard behavior are covered.
- [ ] The task is never represented as a book status or synthetic shelf.

## Out of scope

General task management, notifications, and automatic catalog correction.

## Open questions

1. Is the reason optional free text only, or should there be a small reason vocabulary plus note?
- yeah, i think i just need to be able to say, `in wrong section` or just whatever the reason is. Just free text. 

2. Should clearing require confirmation, and should resolved tasks remain visible in history?
- Yes to confirmation, no to historical record. 
