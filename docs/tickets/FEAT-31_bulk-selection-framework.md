# FEAT-31 -- Reusable Books bulk-selection framework

## Objective

Add an opt-in, reusable selection mode to the Books catalog without performing shelf mutations yet.

This ticket establishes safe row selection and a bulk-action shell that FEAT-32 can use for Move to Shelf and future tickets can reuse for actions such as mark read or add to collection.

## Dependencies

- FEAT-30 establishes the stable Books list/filter/URL model.
- Existing infinite-scroll Books rendering is the baseline; do not replace it with a new list implementation.

## Product decisions

- V1 selection applies only to the currently loaded/visible result set.
- No cross-page or unbounded server-side selection.
- Selection must never silently remain attached to books that disappear because filter/search result state changed.
- Prefer clearing selection when the canonical result/filter identity changes unless the current implementation can safely preserve only still-visible IDs with simpler behavior.
- Route changes must not leave hidden actionable selection behind.

## Required scope

### Selection mode

Add an explicit way to enter/exit bulk-selection mode on Books.

When active:

- each eligible visible book has a labelled selection control;
- selected state is programmatically exposed to assistive technology;
- selected count is always visible;
- Select All applies to the currently loaded/visible eligible result set;
- Clear Selection clears all selected IDs;
- exiting selection mode clears selection.

### Result-set changes

Define selection against the canonical current result set.

At minimum, clear stale selection when:

- filters change;
- search/ISBN state changes;
- a route change leaves Books;
- the user explicitly exits/clears selection.

Sorting may preserve selection if the same selected books remain in the loaded result set, but tests must lock whichever safe rule is chosen.

### Eligibility

The framework should support an eligibility predicate rather than assuming every row can participate in every future bulk action.

For the initial Books surface:

- do not select soft-deleted rows;
- do not surface hidden/non-rendered records as selected;
- expose enough selected book identity for downstream actions to show titles/IDs and retry failures.

### Bulk-action shell

Render a bulk-action area only when selection mode is active/appropriate.

For this ticket it may contain a disabled/placeholder or no concrete mutation action, but its component/model boundary must allow FEAT-32 to add **Move to Shelf** without rewriting selection state.

Do not ship a fake action that appears functional.

## Likely implementation areas

Verify the current Books row/component structure first.

| Area | Expected change |
| --- | --- |
| selection model/hook | New reusable selected-ID state, toggle, select-visible, clear, result-set transition behavior. |
| Books row/list | Opt-in labelled row checkboxes/selection controls. |
| BooksPage | Selection-mode lifecycle and selected-count/action shell wiring. |
| bulk action component | Reusable container/interface for later actions. |
| styles | Narrow-width selection/action layout and visible focus/selected affordances. |
| tests | Pure model plus Books component/page selection behavior. |

Avoid placing all selection logic directly in `BooksPage` if that makes future actions/page reuse difficult.

## Acceptance criteria

- Books has an explicit bulk-selection mode.
- Eligible visible rows can be selected/deselected individually by keyboard and pointer.
- Selected state is exposed accessibly.
- Select All selects every currently loaded/visible eligible row and does not imply unloaded pages were selected.
- Clear Selection empties the selection.
- Selected count is accurate after individual toggles, Select All, and Clear.
- Changing filters/search cannot leave invisible stale IDs armed for a later bulk action.
- Leaving Books or exiting selection mode leaves no hidden selection state.
- The mechanism can accept a future bulk action without replacing the selection model.
- Existing row/detail navigation remains usable when selection mode is off.
- Infinite scrolling remains functional.
- Layout remains usable at 320 px.
- `make check` passes.

## Testing expectations

- Pure tests for toggle, duplicate toggle safety, select-visible, clear, eligibility filtering, and result-set transitions.
- Component/page tests for selection mode, selected count, Select All wording/behavior, Clear, and route/filter reset.
- Accessibility assertions for labels, checked/selected state, focus behavior, and keyboard operation.
- Regression tests for ordinary Books navigation outside selection mode.
- Run targeted tests while iterating, then `make check`.

## Out of scope

- Moving books to shelves; FEAT-32.
- Any other bulk mutation.
- Cross-page/unbounded selection.
- Persisting selection in the URL, local storage, or across routes.
- Undo history.
