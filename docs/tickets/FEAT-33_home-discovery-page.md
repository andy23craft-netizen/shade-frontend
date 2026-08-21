# FEAT-33 -- Discovery-oriented Home page

## Objective

Make `/` a discovery-oriented front door for the library and move the current About content to `/about`.

Home should answer: **What might I want to browse/read?**

It should feature a deliberately small set of category entry points that deep-link into the canonical FEAT-30 Books filter state.

## Dependencies

- FEAT-29 dynamic categories is complete.
- FEAT-30 canonical Books filter/URL plumbing is complete.
- Backend category names/filtering are finalized.
- FEAT-27 Collections is complete.
- Existing About page content and accessibility behavior are the baseline to preserve.

UI design is materially involved in this ticket. Before implementation begins, inspect `docs/product-docs/UI_DESIGN_NOTES.MD` as required by the project context.

## Product decisions

- `/` becomes Home.
- Existing library-information content moves intact to `/about`.
- Home is for discovery, not a duplicate admin/navigation dashboard.
- About remains the home for purpose, dedication, lending policy, and catalog guide/information.
- Feature a curated subset of categories rather than every category.
- The featured category configuration should live in one obvious place.
- Category display names come from the finalized backend taxonomy.
- Home must still render usefully if optional counts/metadata fail.

The exact featured category names should be selected during implementation from the finalized migrated taxonomy and design notes; do not invent legacy combined category strings.

## Required scope

### 1. Route relocation

- Register Home at `/`.
- Move About to `/about`.
- Preserve About's existing content and accessible behavior.
- Update document titles/headings/route metadata.
- Update brand/About navigation so both routes remain intentionally reachable.
- Update any tests/links that currently assume `/` is About.

Do not move Dashboard back to `/`; it remains `/dashboard`.

### 2. Featured categories

Create a small configuration/data structure identifying the featured categories.

The page should resolve those entries against backend-provided category data where practical so labels/identity remain aligned with the dynamic taxonomy.

Each category card/link must navigate using the canonical Books URL/filter representation from FEAT-30.

### 3. Secondary discovery/navigation links

Provide useful secondary paths such as:

- Browse;
- Collections;
- Wishlists;
- About.

These should support discovery without simply duplicating the full primary navigation.

### 4. Optional counts/metadata

Counts are optional.

If included:

- use an existing stable backend response;
- do not fetch the entire catalog and count client-side just to decorate Home;
- failure of counts must not blank or disable the core category links.

### 5. Responsive/accessibility behavior

- readable single-column arrangement at 320 px;
- semantic links/cards;
- visible focus;
- route heading focus behavior consistent with the existing app;
- no interaction dependent on hover alone.

## Likely implementation areas

Verify current routing/nav files before editing.

| Area | Expected change |
| --- | --- |
| `src/routes/routeMetadata.ts` | Home `/`, About `/about`. |
| `src/routes/routes.tsx` | Register new Home and relocated About route. |
| Home feature/page | New discovery page and featured-category configuration. |
| About tests/page links | Preserve content after route relocation. |
| AppShell/brand/nav | Ensure About remains directly navigable and active behavior is correct. |
| canonical Books URL helper | Reuse FEAT-30 for category destinations. |
| styles | Card-catalog-aligned responsive discovery layout after design notes are inspected. |
| e2e | Home -> category -> filtered Books -> Back. |

## Acceptance criteria

- Visiting `/` shows Home, not About.
- Visiting `/about` shows the existing About content.
- About retains its dedication, lending policy, purpose, catalog guide, and existing accessibility behavior.
- Dashboard remains `/dashboard`.
- Home renders an intentionally curated category set, not the full taxonomy.
- Featured category labels come from the finalized category model.
- Every featured category opens the canonical `/books` route with the correct category filter.
- The filtered Books destination survives refresh/back/forward navigation.
- Secondary links to Browse, Collections, Wishlists, and About are useful but do not recreate the whole nav.
- Failure of optional discovery metadata/counts does not prevent core Home browsing.
- Home remains useful at 320 px.
- Existing route title/focus behavior remains correct.
- `make check` passes.

## Testing expectations

- Route/AppShell tests for `/` and `/about` title, heading, and navigation behavior.
- Regression tests preserving existing About content and Catalog Guide behavior after relocation.
- Home tests for featured-category rendering and canonical destination URLs.
- Failure/fallback test for any optional category metadata/count request.
- Browser journey: Home -> featured category -> filtered Books -> Back.
- Accessibility coverage consistent with the existing FEAT-13 architecture.
- Run targeted tests while iterating, then `make check`.

## Out of scope

- Category creation/edit/delete.
- Displaying every category on Home.
- Featured Collections carousel.
- New dashboard widgets.
- Client-side full-catalog counting.
- Cover images.
