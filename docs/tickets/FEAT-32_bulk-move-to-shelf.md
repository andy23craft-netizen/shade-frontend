# FEAT-32 -- Bulk move selected books to a shelf

## Objective

Use the FEAT-31 selection framework to move multiple selected catalog books to one destination shelf safely.

The operation must report partial failure honestly and keep failed books recoverable for retry.

## Dependencies

- FEAT-31 reusable Books bulk-selection framework is complete.
- Shelf catalog and single-book shelf reassignment are finalized.
- Backend universal filtering is stable.
- If the finalized backend exposes a true bulk shelf endpoint, use it.
- If no bulk endpoint exists, the frontend may orchestrate bounded individual Book update mutations using the documented single-book shelf update contract.

Confirm the final backend contract before choosing the mutation strategy.

## Required scope

### Move to Shelf action

Add **Move to Shelf** to the bulk-action shell.

The action must:

- require at least one selected eligible book;
- load destinations from the live shelf catalog;
- exclude non-assignable/system destinations such as `removed`;
- require an explicit destination;
- show selected count;
- require confirmation before mutation;
- disable duplicate submission while active.

### Execution

Prefer a documented backend bulk endpoint if available.

Otherwise:

- execute documented single-book updates with bounded concurrency;
- do not fire an unbounded number of simultaneous requests;
- track success/failure per selected book;
- never roll back a successful server mutation merely because another book failed.

Do not invent a generic lifecycle shortcut.

### Completion behavior

All success:

- report the number moved;
- clear completed selection;
- refresh affected views without a page reload.

Partial failure:

- report `N succeeded / M failed`;
- identify failed books by durable ID and useful title when available;
- retain or reconstruct selection for failed rows so the user can retry;
- do not label the whole operation successful.

### Cache consistency

After successful updates, refresh/invalidate all frontend data whose visible meaning may change, including as appropriate:

- Books lists;
- affected Book details;
- shelf-related views/catalog;
- Dashboard data.

Use the existing mutation/cache architecture rather than ad-hoc manual state rewrites when possible.

## Likely implementation areas

Verify actual post-FEAT-31 structure.

| Area | Expected change |
| --- | --- |
| bulk action component | Add Move to Shelf destination/confirm flow. |
| bulk move model/orchestrator | Normalize selected items, bounded execution, result summary, retryable failed set. |
| Book/shelf query layer | Reuse documented update operation or add wrapper for backend bulk endpoint if one exists. |
| BooksPage | Wire completion/failed-selection behavior. |
| query invalidation | Books/details/shelves/dashboard refresh after success/partial success. |
| styles | Responsive bulk action/dialog summary. |
| tests | Full/partial failure, pending disable, retry, multiple IDs. |

## Acceptance criteria

- A user can filter Books, select several visible books, choose a destination shelf, confirm, and move them without a page reload.
- Shelf options come from the live shelf catalog.
- Non-assignable/system destinations are not offered.
- Confirmation names the destination and selected count.
- Duplicate submission is impossible while the operation is pending.
- Successful rows reflect the new shelf after cache refresh.
- A partial failure does not report global success.
- Successful moves remain successful.
- Failed rows remain identifiable and can be retried without reselecting successful books.
- Soft-deleted/ineligible books cannot be included through the normal selection UI.
- Books, relevant details, shelf views, and Dashboard do not remain stale after successful mutations.
- The operation works for multiple books; it does not accidentally stop after the first row.
- Keyboard/focus behavior and 320 px layout remain usable.
- `make check` passes.

## Testing expectations

- Pure/orchestrator tests for all-success, one-failure, multiple-failure, and bounded execution behavior if client-orchestrated.
- Component tests for destination required, confirmation, pending disable, success summary, and partial failure summary.
- Query invalidation tests for Books, details as applicable, shelves, and Dashboard.
- Integration test selecting multiple books and verifying every successful book receives the update.
- Integration test forcing one failure and proving successful rows remain moved while failure stays retryable.
- Browser smoke if the existing e2e architecture can represent the mutation cleanly.
- Run targeted tests while iterating, then `make check`.

## Out of scope

- Arbitrary bulk editing of Book fields.
- Bulk mark-read/add-to-collection.
- Cross-page/unbounded selection.
- Undo history beyond moving a book again.
- Creating or editing shelves from the bulk dialog.
