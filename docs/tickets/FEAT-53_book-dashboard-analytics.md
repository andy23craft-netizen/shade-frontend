# FEAT-53 -- Book Dashboard Analytics

**Status:** Ready

**Depends on:** Dedicated backend aggregates/series with book-only semantics.

## Objective

Add understandable book collection and reading analytics without calculating incomplete totals from paginated browser data.

## Acceptance criteria

- [ ] Dashboard displays Pages Owned, Pages Turned, books acquired/read this year, books/pages read over time, and books read by shelf/category.
- [ ] Unknown page counts and partial dates use contract-defined inclusion rules and honest explanatory labels.
- [ ] Time-series interval, timezone/year boundary, empty buckets, sorting, and category multi-membership semantics come from the contract.
- [ ] Charts provide equivalent accessible summaries/tables and intentional desktop/mobile compositions.
- [ ] Each panel isolates loading/error/empty state; unified Refresh refetches all book dashboard sources.
- [ ] No album values, shelf-capacity inference, invented totals, or full-catalog client aggregation is used.

## Out of scope

Album analytics, recommendations, external benchmarks, and shelf capacity.

## Open questions

1. What default time range and bucket size should the two over-time charts use?
- all time. whole catalog. 

2. Does Pages Turned include rereads and partially read books, or only `pages` for completed reading events?
- no to re-reads. 

3. Should category/shelf charts show all buckets or a top-N plus accessible remainder?
- mirror the way we did categories on the current dashboard.