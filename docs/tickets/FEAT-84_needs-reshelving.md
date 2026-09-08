# FEAT-84 -- Needs Reshelving Queue

**Status:** Blocked on backend FEAT-16 (`is_flagged` mark + flagged-list endpoints).

**Depends on:** `shade-backend/docs/tickets/FEAT-16_book-is-flagged.md` (to be implemented). Backend storage is a
boolean `books.is_flagged` with no reason/note or marked-at. Product label remains "Needs Reshelving".

## Objective

Let an owner mark or clear placement attention on a book without changing catalog, shelf, category, or circulation
state, and show every flagged book on the Dashboard.

## Backend contract (FEAT-16)

- Mark/clear: dedicated book flag write (e.g. `POST /books/{book_id}/flag` with `{ "is_flagged": true | false }`).
- Dashboard list: dedicated flagged-list endpoint returning all flagged books across placements (e.g.
  `GET /dashboard/flagged-books` as `{ items, total }`). Do not build the queue from a `GET /books` query param.
- Book reads expose `is_flagged` for Book Details.

## Acceptance criteria

- [ ] Book Details can mark Needs Reshelving and clear it explicitly via the mark endpoint (confirmation on clear
      is a UI concern; no resolved-history record).
- [ ] Dashboard shows a pinned, deterministic Needs Reshelving list from the flagged-list endpoint (book identity
      and current placement from the book payload; no reason or marked-time fields).
- [ ] Mark/clear are idempotent; failures never masquerade as saved state.
- [ ] Completing a shelf/category edit does not clear the flag (backend does not auto-clear; UI must not either).
- [ ] Deleted books, pagination/limits, stale state, loading, empty, retry, mobile, zoom, and keyboard behavior are
      covered.
- [ ] The flag is never represented as a book status or synthetic shelf.

## Out of scope

- Reason, note, marked-at, or resolved-history UI
- General task management, notifications, and automatic catalog correction
- Album flagging

## Open questions

None for the backend boolean contract. Remaining UI polish (clear confirmation copy, empty-state wording) can be
decided during implementation.
