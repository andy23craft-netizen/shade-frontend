# Ticket 02: Add Cancel Shelf with queue preservation

## Problem

After a Bulk Add shelf session begins, the selected shelf is effectively locked even when the wrong shelf was chosen or physical reorganization changes the intended destination.

## Requirements

- Add a prominent `Cancel Shelf` action during an active shelf session.
- When there are no unresolved scans, return directly to shelf selection.
- When unresolved scans exist, present two explicit choices:
  - `Keep scans and choose another shelf`
  - `Discard scans and cancel shelf`
- Keeping scans returns to shelf selection while preserving queue items, lookup results, editable drafts, categories, and item errors.
- Discarding clears the current session only after confirmation.
- Already submitted books remain submitted and are never undone by Cancel Shelf.
- Keep the active shelf identity visible on mobile during long sessions.

## Acceptance criteria

- Canceling an empty session returns to shelf selection without a warning.
- Choosing a new shelf after `Keep scans` submits preserved items to the newly selected shelf.
- `Discard scans` clears only unresolved items after confirmation.
- Canceling the dialog leaves the session unchanged.
- Saved books are not duplicated or removed when the remaining session is canceled.
- Keyboard focus returns to the appropriate shelf or scan control.

## Open UX detail

If a mixed session contains both saved and unresolved items, the confirmation copy must state that saved books remain on their submitted shelf and only unresolved scans are being preserved or discarded.

