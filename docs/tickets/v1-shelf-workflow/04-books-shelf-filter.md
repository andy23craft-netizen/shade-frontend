# Ticket 04: Expose Shelf as a Books-page filter

## Problem

The Books page supports URL-driven `shelf_name` filtering, but users cannot select a shelf from the visible filter controls.

## Requirements

- Add a visible Shelf filter using the live shelf catalog.
- Use shelf IDs for UI selection and `common_name` in the Books URL/API model.
- Format shelf names consistently with the rest of the application.
- Keep `shelf_name` integrated with all existing category, text, read-state, sort, pagination, and clear-filter behavior.
- Preserve deep links from Shelves, Bulk Add, and reconciliation workflows.
- Exclude non-browsable destinations consistently with current shelf rules.

## Acceptance criteria

- Selecting E4 updates the URL with `shelf_name=e4` and filters results.
- Loading a shelf deep link initializes the visible filter correctly.
- Clearing Shelf removes only `shelf_name` unless the user invokes Clear All.
- Shelf selection composes correctly with the other Books filters.
- Unknown or deleted shelf values in old URLs degrade safely.
- Mobile controls expose the same shelf filter.

