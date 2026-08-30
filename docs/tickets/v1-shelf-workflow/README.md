# V1 Shelf Workflow Ticket Packet

These tickets capture the post-use review of Bulk Add, shelf management, and physical shelf reorganization.

## Proposed order

1. [Fix Bulk Add author metadata population](01-bulk-add-author-metadata.md)
2. [Add Cancel Shelf with queue preservation](02-bulk-add-cancel-shelf.md)
3. [Add search to the Shelves page](03-shelves-search.md)
4. [Expose Shelf as a Books-page filter](04-books-shelf-filter.md)
5. [Fix compact shelf-card publication-year clipping](05-compact-card-year.md)
6. [Backend pre-ticket: model Stash and add atomic APIs](06-backend-stash-contract.md)
7. [Build the Stash view and Apply Stash workflow](07-stash-ui.md)
8. [Build shared post-placement shelf reconciliation](08-shelf-reconciliation.md)
9. [Integrate all multi-book placement entry points](09-placement-integrations.md)

## V1 product rules

- Stash is an intentional unresolved-placement state, not a physical shelf and not the existing `unknown` shelf.
- Applying a stash may resolve any selected subset; the entire stash never has to be resolved at once.
- A shelf-reconciliation prompt is triggered when at least two books are placed onto a shelf that already contained at least one book.
- Bulk Add keeps its post-shelf review checkpoint. Whether Bulk Add should retain its current one-book sensitivity is called out as a product decision in the reconciliation ticket.
- V2 surname-range and intelligent placement suggestions are explicitly out of scope for this packet.

