# Friction Batch Implementation Plan

## Status

Approved and implemented for the current-patch scope. The V2 New Additions follow-up remains deferred.

## Scope decision

This batch contains three current-patch frontend fixes and one intentional V2 deferral:

| Ticket | Decision | Backend dependency |
| --- | --- | --- |
| Book-cover crop/positioning control | Current patch: display the complete image with `object-fit: contain`; do not build a crop editor | None |
| Category Add-action list order | Current patch in both Add/Edit Book and Bulk Add | None |
| Dashboard Reading Record legend values | Current patch | None |
| New Additions long unbroken titles | No isolated V1 patch; address in the V2 Home responsive-density work | None |

The current-patch items are independent at runtime and may be implemented together. The cover-display change has the
widest visual reach because every cover consumer uses the shared `BookCover` component, so it receives the broadest
visual validation.

## Verified current behavior

### Book covers

`BookCover` always renders resolved artwork in the shared 2:3 `.book-cover__frame`. `.book-cover__image` uses
`object-fit: cover`, which necessarily crops source images whose aspect ratio differs from 2:3. The same component is
used on Book Details, Books, Home, and Collections.

A persisted crop/focal-point editor would introduce product state, accessible pointer/keyboard editing, and a backend
contract. It is disproportionate to the reported need when showing the complete source image solves the loss of title
and edge content. A client-only position preference is also unsuitable because it would not carry between browsers or
viewers.

### Category action order

Both `BookForm` and the per-item category picker in `BulkAddPage` render the conditional `+ Add …` button before
matching category options. Because the DOM and visual orders match, keyboard users encounter the create action before
existing matches. Reordering the existing nodes is sufficient; no focus-management system or `tabindex` changes are
needed.

### Reading Record legend

`DashboardPage` renders each legend item as a linked numeric value followed by `read` or `unread`. Immediately below,
the `Books Read` and `Books Unread` metrics expose the same linked quantities. The legend can retain its colored keys
and labels while leaving values and navigation in the metrics.

### New Additions titles

New Additions uses a horizontally scrolling carousel of fixed 17rem compact cards. Wide layouts reserve an 8rem cover
column; the mobile rule reduces that column to 5.5-6.5rem. Titles are ordinary link text and wrap naturally. An
isolated eleven-letter wrap is visually awkward but remains complete and accessible.

Truncation would hide identity, per-string font scaling would create unstable hierarchy and zoom/localization issues,
and automatic/marquee motion would add readability and reduced-motion problems. Card geometry should be reconsidered
with the larger V2 Home composition rather than patched for one string.

## Implementation phases

### Phase 1: Deterministic interaction and content cleanup

Implement the two lowest-risk DOM changes first.

1. In `BookForm`, move the existing conditional create-category button after `visibleCategories.map(...)`. Preserve
   search filtering, selected state, inline category editing, loading/disabled state, exact-match suppression, and the
   existing create mutation behavior.
2. In `BulkAddPage`, make the equivalent ordering change in every review-row category picker. Preserve its shared
   search state, pending and error messaging, exact-match suppression, and automatic selection of a newly created
   category.
3. Keep native sequential focus order: search input, each matching category checkbox and its adjacent Edit action
   where present, then Add Category. Do not add positive `tabindex` or move focus programmatically.
4. In `DashboardPage`, replace the legend's linked numeric values and lowercase nouns with the plain visible labels
   `Read` and `Unread`. Preserve the key markers, pie percentage and accessible label, metric values, metric links, and
   `/books?is_read=` destinations below the chart.

Validation:

- Extend `BookForm` and `BulkAddPage` component tests to assert actual DOM order when existing matches and a create
  action coexist.
- Add a keyboard test using real Tab navigation to confirm category matches precede Add Category. Cover both surfaces
  because their implementations are separate.
- Retain regression assertions for selection and successful category creation.
- Scope Dashboard assertions to `.dashboard-reading-chart__legend` and `.dashboard-metrics` so repeated labels do not
  produce false positives. Confirm legend values are absent and metric values remain linked.
- Add or update one Playwright keyboard journey for category ordering and retain the dashboard accessibility scan.

### Phase 2: Non-cropping shared cover display

1. Change `.book-cover__image` from `object-fit: cover` to `object-fit: contain` while retaining the 2:3 frame and its
   existing muted background for letterboxing.
2. Do not change authenticated blob loading, lazy loading, cancellation, error/placeholder behavior, decorative alt
   text, status stamps, or upload/remove behavior.
3. Do not introduce fit toggles, drag controls, destructive image processing, or presentation metadata.

Validation:

- Add a stable style-contract check for the shared image fit rule. Prefer an existing CSS inspection convention if the
  suite has one; otherwise validate the computed style in Playwright rather than coupling a component test to source
  text.
- Exercise portrait 2:3, tall/narrow, square, and landscape fixtures. Each fixture should include recognizable edge
  content so the check demonstrates that the entire image remains visible rather than merely loading successfully.
- Inspect Book Details, a compact Books/Home card, and a Collections membership at desktop and narrow mobile widths.
- Confirm letterbox contrast and status-stamp legibility, including `available`, `on_loan`, and other existing status
  treatments.
- Preserve existing `BookCover` load, failure, cancellation, decorative-alt, and placeholder tests.

### Phase 3: V2 long-title follow-up only

Do not change the current New Additions card in this patch. During the V2 Home responsive-density implementation:

1. Prototype card geometry with short titles, ordinary multi-word titles, 11-20-character unbroken words, and very
   long titles.
2. Validate at 320px, intermediate mobile/tablet widths, desktop widths, and 200% text zoom.
3. Prefer resilient content allocation and natural wrapping. Do not add automatic/marquee motion or per-title font
   scaling.
4. If visible truncation is eventually approved, preserve the full accessible name and provide a non-hover-only way
   to read the complete title.
5. Preserve minimum control targets, visible focus, horizontal containment, carousel pause behavior, and
   reduced-motion behavior.

The definitive V2 requirements now record this constraint under the Home responsive-density requirement. No further
V2 documentation change is proposed for this batch.

## Files changed by the approved implementation

Current patch:

- `src/features/books/components/BookForm.tsx`
- `src/features/books/components/BookForm.test.tsx`
- `src/features/books/routes/BulkAddPage.tsx`
- `src/features/books/routes/BulkAddPage.test.tsx`
- `src/features/dashboard/routes/DashboardPage.tsx`
- `src/features/dashboard/routes/DashboardPage.test.tsx`
- `src/styles/components.css`
- Relevant Playwright specs/fixtures under `e2e/`, selected after inspecting the closest existing journeys

Planning/V2 documentation already changed in this batch:

- `docs/product-docs/PRODUCT_REQS.V2.definitive.md`
- The four source ticket documents and this consolidated plan under `docs/tickets/`

No OpenAPI regeneration, generated API types, dependency change, backend ticket, or runtime configuration change is
expected.

## Completion gate

1. Run focused Vitest suites for `BookForm`, `BulkAddPage`, `DashboardPage`, and `BookCover`/Home consumers.
2. Run the focused Playwright journeys, including keyboard order, cover proportions, narrow viewport, and accessibility
   checks.
3. Run `make check`.
4. Review the final diff for unrelated changes, generated artifacts, and accidental alteration of the deferred New
   Additions layout.
5. Update or remove completed ticket documents according to the repository ticket workflow only after the work and
   documentation are accepted.

## Scope boundary

Only Phases 1 and 2 belong to the current friction patch. Phase 3 remains a documented V2 constraint and does not
authorize a redesign of Home.
