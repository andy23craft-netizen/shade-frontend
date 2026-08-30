# Ticket 08: Build shared post-placement shelf reconciliation

## Dependency

Use the destination occupancy semantics finalized in [Pre-ticket 06](06-backend-stash-contract.md).

## Problem

Placing several books onto an occupied shelf may displace books already there. This applies across workflows and should not be implemented as Bulk Add-only page logic.

## Trigger

For V1, prompt when:

- at least two books were successfully placed; and
- the destination shelf contained at least one book before the operation.

## Requirements

- Create one shared post-placement result model and reconciliation UI.
- Explain both the number placed and the destination's previous occupancy.
- Offer `Done` and `Review <shelf>`.
- Reviewing opens the destination shelf in Books bulk-selection mode.
- The review bulk actions include `Move to Shelf`, `Stash Books`, and `Finish Review`.
- Moving or applying another group can emit another reconciliation result, allowing a shelf shuffle to continue.
- Do not infer occupancy by subtracting counts from independently timed list queries when the backend can return race-safe operation context.

## Suggested copy

> You moved 24 books to E4. E4 already contained 31 books. Do you need to move or stash any books from E4?

## Acceptance criteria

- The trigger behaves consistently for every integrated operation source.
- `Done` closes the checkpoint without changing placement.
- `Review E4` shows E4 books with bulk selection active.
- Users can move or stash only the displaced subset they select.
- A subsequent qualifying placement can continue the reconciliation chain.
- Canceling or navigating away never repeats the original mutation.
- Dialog and review controls are keyboard and mobile accessible.

## Product decision before implementation

Bulk Add currently prompts after one successful addition to an occupied shelf because the checkpoint also supports alphabetical review. Decide whether Bulk Add keeps that one-book exception or adopts the universal two-or-more trigger. Recommended default: preserve the Bulk Add exception until usage shows it is noisy.

