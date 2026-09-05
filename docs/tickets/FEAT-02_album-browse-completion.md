# FEAT-02 -- Album browse completion

**Status:** Ready for frontend implementation against the shipped album list contract, with
contract additions required only where current query parameters are insufficient.

**Dependency group:** Catalog navigation and progressive-list controls.

**Depends on:** Shared persistent-control and Back to Top work derived from PLAN-03.

## Objective

Complete album browsing with album-owned URL state, progressive loading, and responsive
controls while preserving route history independently from Books.

## Acceptance criteria

- [ ] Album search and filters are URL-backed for artist, title, barcode, media format, and
      deleted state, subject to the authoritative shipped contract.
- [ ] Sort supports artist, title, release date, and creation date where the API contract
      exposes those orders.
- [ ] Album URL parsing, serialization, cache keys, and history are independent from the
      Books URL model and never display book-only fields.
- [ ] Returning from Books or Album Details restores the album browse state and progressive
      list position predictably.
- [ ] Wide layouts use the shared persistent left control rail; smaller layouts use the
      equivalent accessible modal treatment.
- [ ] Progressive loading uses the shared Back to Top behavior and preserves focus,
      cancellation, loading, empty, and error semantics.
- [ ] Automated tests cover URL round trips, history restoration, keyboard behavior, mobile
      layout, 200% text zoom, and progressive loading.

## Out of scope

Cross-media global search, Books filter reuse, album incomplete-metadata cleanup, and album
Collection membership.
