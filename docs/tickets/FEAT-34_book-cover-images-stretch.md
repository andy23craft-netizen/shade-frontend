# FEAT-34 -- Book cover images on Book Details (stretch)

## Objective

Investigate and, only if low-risk, add book cover art to Book Details using data already available on `BookRead`,
preferably `isbn13`.

This ticket is a **stretch goal**. V1 completion does not depend on it (FEAT-35 must not block on this work).

Stop and defer rather than creating a new image infrastructure project.

## Current status

Not started in the SPA.

- `BookRead` exposes nullable `isbn13` and has no cover URL / image field.
- `BookDetailsPage` (`/books/:bookId`) renders metadata and actions with no cover image, placeholder, or resolver.
- No cover helper, provider client, or cover-related styles/tests exist under `src/`.

## Release rule

This ticket must not become a V1 blocker.

Defer implementation if reliable cover support requires:

- a new backend proxy solely for cover images;
- server-side secrets;
- persistent image caching/storage;
- significant attribution/compliance UI;
- problematic provider rate-limit handling;
- backend Book schema changes solely to store cover data.

## Investigation requirements

Before writing product code, identify a candidate source and document:

- how it resolves a cover from existing book data (`BookRead.isbn13` is the primary candidate);
- whether ISBN-10/ISBN-13 handling is reliable enough given stored `isbn13` only;
- HTTPS support;
- URL stability;
- terms/attribution requirements;
- relevant request/rate limits;
- behavior for missing `isbn13`, unknown ISBNs, and missing covers;
- whether direct browser requests are acceptable.

Use current provider documentation; do not rely on stale assumptions.

## Implementation scope if investigation passes

### Book Details integration

- Cover loading is independent from the core `useBook` / Book Details API request.
- The title/actions/details remain usable while a cover loads or fails.
- Render a cover only when confidently available.
- Missing ISBN, no cover, network failure, and broken image must all have deterministic behavior.
- Avoid repeated retry/error loops.

### Fallback

Use either:

- an intentional placeholder; or
- clean omission with stable layout.

Do not render broken-image UI.

### Accessibility

If adjacent visible title text already identifies the book and the cover is decorative, `alt=""` is acceptable.

Otherwise provide concise useful alt text.

### Responsive layout

Book Details must remain stable with:

- a normal cover;
- a tall/wide unusual cover;
- no cover;
- image load failure;
- 320 px viewport.

## Likely implementation areas

Verify before editing.

| Area | Expected change |
| --- | --- |
| cover resolver/helper (new, e.g. under `src/features/books/`) | `isbn13` -> provider URL/request state; no secret material. |
| `src/features/books/routes/BookDetailsPage.tsx` | Non-blocking image/fallback rendering beside existing card layout. |
| `src/styles/components.css` (`.book-details-*`) | Stable responsive cover/details layout. |
| colocated tests | URL resolution, missing ISBN, load failure/fallback, accessibility behavior. |
| docs | Record provider dependency/attribution if implementation ships. |

Do not add a global image cache/library unless the investigation proves it is already necessary and still within the
ticket's release rule; otherwise defer.

## Acceptance criteria if implemented

- Book Details displays a cover when confidently available.
- Missing/unavailable covers render an intentional fallback or clean omission.
- Cover loading never blocks the core Book Details query or controls.
- Missing/broken cover does not cause repeated request/console-error storms.
- Accessible alt behavior is intentional.
- Layout is stable with and without a cover at desktop and 320 px.
- Provider terms/attribution requirements are satisfied and documented.
- No backend secret/proxy/storage/schema project was introduced solely for covers.
- `make check` passes.

## Completion outcome if deferred

This ticket may also close as **intentionally deferred** if the investigation hits a release-rule condition.

Record:

- provider(s) investigated;
- blocking requirement;
- why the work is not appropriate for V1;
- confirmation that no partial cover dependency remains in the product path.

Deferral does not affect the V1 completion definition.
