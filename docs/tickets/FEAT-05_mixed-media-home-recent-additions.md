# FEAT-05 -- Mixed-media Home Recent Additions

**Status:** Blocked on the catalog recent-additions contract or an explicit decision that the
shipped APIs are sufficient.

**Dependency group:** Library-wide Home discovery.

**Depends on:** Backend/shared entry decision for a typed mixed-media recent-additions feed;
Home presentation work derived from PLAN-03.

## Objective

Make Home's Recent Additions intentionally library-wide by presenting active owned books and
albums through one typed, stable ordering contract.

## Acceptance criteria

- [ ] Recent Additions can return typed book and album summaries together, newest first.
- [ ] Deleted albums, wishlist-only records, and other non-owned entries are excluded.
- [ ] Each card uses the correct typed route, identity, cover/artwork loader, title, creator
      presentation, and location terminology.
- [ ] The frontend does not synthesize the feed by merging dashboard counters or unrelated
      paginated media requests.
- [ ] Loading, partial-media failure, empty, responsive, keyboard, and assistive-technology
      behavior is defined and tested.
- [ ] Staff Picks remains a book-backed Collection and Dashboard media totals remain
      explicitly scoped.

## Out of scope

Mixed-media global text search, album Collections, external recommendation feeds, and
weather-aware discovery.
