# FEAT-101 -- Provider-sourced book summaries

**Status:** Implemented; awaiting backend deployment and opt-in live validation.

**Dependency group:** Book work metadata.

**Depends on:** Backend FEAT-2's checked-in OpenAPI and API-for-FE contract updates; the existing book detail query
and cache conventions.

## Objective

Show a readable, provider-sourced plot summary on Book Details when the backend has one, and allow a user to request a
single ISBN-based refresh when a summary is absent and the backend says that refresh is possible.

## Product decisions

- Render the nullable `BookRead.summary` on the existing Book Details page as plain text, preserving paragraph breaks.
  Its absence is normal and is not a page error.
- Place the summary in a clearly labelled detail section and distinguish provider-sourced content from the library
  owner's rating and review.
- When no summary is present, expose a deliberate, user-triggered refresh action only when the response state permits
  it. The action calls `POST /books/{book_id}/summary/refresh`; it is never automatic on page load or performed in
  bulk.
- Consume the endpoint's typed summary state. Represent an ISBN-missing/non-requestable result, provider-declared
  `not_available`, timeout, and provider failure separately.
- Keep a displayed cached summary in place if a manual refresh fails. A successful response updates the relevant book
  detail and list caches from returned data or by refetching the detail endpoint.

## Acceptance criteria

- [ ] A present summary appears as escaped plain text, retains paragraph breaks, and is usable with keyboard and
      screen-reader navigation; it is never injected as HTML.
- [ ] An absent summary produces a calm empty state rather than an error, with an appropriately available refresh
      action.
- [ ] Refresh has an accessible pending state, prevents duplicate submission, and refreshes the local book state on
      success without a full-page reload.
- [ ] Books without an ISBN show the contract-appropriate non-requestable state and never issue an upstream-refresh
      request from the browser.
- [ ] A provider `not_available` state is presented as a successful absence and does not invite a misleading retry.
- [ ] Timeout (504) and provider failure (502) are distinguishable, retryable failures; any previously rendered cached
      summary remains visible.
- [ ] Missing/deleted book responses follow the established book-detail stale/not-found recovery behavior.
- [ ] Unit and route-level tests cover text rendering and paragraph preservation, all returned summary states,
      mutation/cache update behavior, duplicate-submit prevention, failed-refresh preservation, and accessible focus
      and announcements.

## Frontend implementation notes

- Regenerate OpenAPI client types after the backend contract lands. Add the summary-refresh transport and mutation to
  the existing books API/query layer, including targeted detail/list cache invalidation or response-cache writes.
- Treat server data and summary provenance/state as authoritative. The SPA must not call Open Library directly, scrape
  the web, cache a separate description locally, or infer a summary from title or authors.
- Reuse existing error normalisation and diagnostics safeguards. Do not place provider text in diagnostic payloads
  beyond the ordinary redaction policy.
- Verify the layout at narrow and wide breakpoints, including long multi-paragraph summaries.

## Out of scope

Title/author discovery, browser-side provider calls or scraping, user-authored summaries, HTML/rich-text rendering,
summary editing, automatic or scheduled refresh, bulk backfill, and changes to owner reviews or notes.
