# FEAT-28 -- Collections follow-up: edit collections and add from Book Details

## Objective

Finish the two small Collections interactions intentionally left outside FEAT-27:

1. allow an existing collection's name and description to be edited after creation; and
2. allow the current catalog book to be added directly to a chosen collection from Book Details.

Keep `/collections` as the primary collection-management surface. Book Details should provide a focused membership action, not duplicate the full Collections UI.

## Dependencies

- FEAT-27 Curated Collections is complete and its API/query/component architecture is the baseline to extend.
- The finalized Collections backend contract remains authoritative.
- `PATCH /collections/{collection_id}` supports updating collection metadata.
- `POST /collections/{collection_id}/books` supports adding an existing active catalog book to a collection.
- Collection membership is orthogonal to shelf and wishlist placement: shelved and wishlisted books may belong to Collections.
- Existing shared `ConfirmationDialog`, form/error patterns, React Query invalidation, and Book Details action patterns should be reused.

Before implementation, verify the current repository state rather than assuming FEAT-27 landed with every planned filename unchanged.

## Contract references

Treat these as authoritative during implementation:

- `docs/technical-reference/openapi.json`
- `docs/technical-reference/API-for-FE.md`
- running backend `/openapi.json` when available

Known FEAT-27 semantics to preserve:

- collection update changes collection metadata only;
- adding a collection membership does not change the catalog book, shelf assignment, or wishlist membership;
- duplicate membership is non-destructive and must surface honestly;
- soft-deleted books cannot be newly added;
- deleting or removing collection membership must not be introduced into the Book Details shortcut.

Do not invent frontend-only request shapes if the final backend contract differs from the pre-ticket baseline.

## Product decisions

### Edit existing collection

On `/collections`, provide a clear Edit action for each existing collection.

The edit flow must support:

- changing the collection name;
- changing the description;
- clearing an existing description when the API supports explicit `null`;
- cancelling without mutation;
- field-linked validation and pending/error states consistent with existing forms.

Editing a collection must not alter membership ordering or membership contents.

### Add current Book Details book to a collection

On `/books/:bookId`, provide an **Add to Collection** action for the current active book.

The focused flow should:

- load the current collection list;
- require the user to choose a target collection;
- allow optional collection-membership notes when supported by the finalized contract;
- submit the current `bookId` directly rather than searching for the same book again;
- surface duplicate/already-member behavior clearly and non-destructively;
- preserve the book's current shelf or wishlist placement.

If no collections exist, show a useful empty state with a route to `/collections` rather than presenting a dead selector.

## Current baseline to reuse

- Book Details already owns book-specific lifecycle/actions; add this as another focused book action.
- FEAT-27 owns Collections API helpers, query keys/hooks, display/form helpers, `/collections`, collection membership behavior, and Collection drawer navigation.
- Shared API error mapping and React Query infrastructure should be extended rather than replaced.
- Existing collection create/delete/reorder/remove flows remain unchanged.

## Likely implementation areas

Verify exact filenames after FEAT-27 lands.

| Area | Expected change |
| --- | --- |
| Collections form/model | Add edit-form initialization/conversion if FEAT-27 create helpers do not already cover it. |
| Collections page/components | Add Edit action and focused edit form/dialog using the existing update mutation. |
| Book Details | Add **Add to Collection** action/dialog for the current book. |
| Collections queries | Reuse `useUpdateCollection` / `useAddCollectionBook`; ensure successful writes invalidate the affected collection keys. |
| Book Details tests | Cover collection loading, empty state, duplicate error, pending state, success, and preservation of shelf/wishlist state. |
| Collections tests | Cover editing name, description, clearing description, cancellation, validation, and mutation errors. |
| Styles | Minimal responsive styling consistent with existing Book Details and Collections controls. |

## Acceptance criteria

- An existing collection can be renamed from `/collections`.
- An existing collection description can be changed and, when supported by the backend contract, cleared.
- Cancelling collection edit leaves the original collection unchanged.
- Edit validation and backend validation errors are surfaced using existing accessible form patterns.
- Book Details exposes **Add to Collection** for an active book.
- The Book Details flow uses the current book ID directly and does not perform a redundant catalog search or create a book.
- A user can choose a collection, optionally enter membership notes when supported, and add the current book successfully.
- Duplicate membership produces a clear non-destructive message.
- A stale soft-deleted add failure is surfaced honestly and relevant queries are refreshed.
- Adding the book to a collection does not modify its shelf, wishlist membership, reading state, circulation state, or other catalog metadata.
- No-collection state provides a useful path to `/collections`.
- Controls are keyboard accessible, manage focus consistently with shared dialogs/forms, and remain usable at 320 px.
- Existing FEAT-27 create/delete/reorder/remove behavior remains green.
- `make check` passes.

## Testing expectations

- Model/helper tests for edit values and request conversion if new helpers are required.
- Collection page/component tests for edit success, cancel, validation, description clearing, pending state, and API errors.
- Book Details tests for collection-list loading/error/empty states, successful add, duplicate membership, stale-book failure, and optional notes.
- Query invalidation tests if FEAT-27's existing hooks do not already cover these call sites.
- Regression assertion that collection membership does not alter shelf/wishlist placement.
- Run targeted tests while iterating, then the authoritative `make check`.

## Out of scope

- Creating, renaming, merging, or deleting taxonomy categories.
- Editing membership notes after membership creation unless the backend later exposes that operation.
- Bulk add-to-collection.
- Drag-and-drop collection ordering.
- Featured collections on Home.
- Moving a collection membership to a shelf; Collections and shelf placement remain independent.
