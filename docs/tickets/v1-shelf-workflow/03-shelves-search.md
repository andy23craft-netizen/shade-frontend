# Ticket 03: Add search to the Shelves page

## Problem

Locating a shelf currently requires scrolling through a progressively rendered list, which is slow during active physical reorganization.

## Requirements

- Add a visible shelf search/filter above the shelf list.
- Match `common_name` and its display-formatted value case-insensitively.
- Support partial input such as `E` as well as an exact identifier such as `E4`.
- Search the complete loaded shelf catalog, not only the currently rendered batch.
- Preserve existing system-shelf behavior and actions.
- Provide an intentional no-results state and an easy way to clear the query.

## Acceptance criteria

- Entering `E4` shows the matching shelf immediately.
- Entering `E` shows every matching E shelf.
- Clearing search restores the normal batched shelf list.
- Search works on mobile and is keyboard accessible.
- Existing create, edit, delete, count, and deep-link behavior remains intact.

