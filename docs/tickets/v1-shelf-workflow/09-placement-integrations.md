# Ticket 09: Integrate all multi-book placement entry points

## Dependencies

- [Ticket 07: Stash UI](07-stash-ui.md)
- [Ticket 08: Shared shelf reconciliation](08-shelf-reconciliation.md)

## Goal

Route every qualifying multi-book placement through the shared reconciliation result instead of maintaining feature-specific prompt logic.

## Entry points

- Bulk Add shelf submission.
- Books-page bulk move.
- Apply Stash.
- Any shelf-management bulk placement introduced in V1.
- Future collection-management placement actions should consume the same contract.

## Requirements

- Replace the Bulk Add-specific popup/message protocol with the shared workflow where practical.
- Preserve Bulk Add's post-shelf review checkpoint and its ability to continue to the next shelf.
- Ensure Books bulk move and Apply Stash produce identical trigger behavior and copy.
- Centralize query invalidation for Books, shelf counts, dashboard counts, stash count, and affected details.
- Prevent recursive/noisy prompts for no-op moves or moves where every selected book was already on the destination.

## Acceptance criteria

- Each listed entry point triggers the same checkpoint for the same operation result.
- No workflow contains a private reimplementation of destination occupancy calculations.
- A complete physical sequence works: Bulk Add to A, review A, stash displaced books, continue Bulk Add, apply part of Stash to B, then review B.
- Browser navigation, direct shelf links, popup/tab behavior, and mobile state remain coherent.
- End-to-end coverage exercises at least one chained reconciliation sequence.

## Out of scope

- Automatic or suggested surname-range placement.
- Automatic movement of any book without explicit user selection and confirmation.

