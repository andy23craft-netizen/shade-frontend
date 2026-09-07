# FEAT-51 -- Persistent Book Controls and Back to Top

**Status:** Ready; frontend-only.

**Depends on:** Existing URL-backed Books model, bulk selection, and progressive list surfaces.

## Objective

Use one persistent wide-screen control language and one accessible return-to-top behavior across progressive book-oriented lists.

## Acceptance criteria

- [ ] At 75rem/1200 CSS pixels or wider, Books filters/sort occupy a persistent left rail; narrower layouts use an equivalent modal/control surface.
- [ ] URL-backed changes apply immediately, preserve browser history semantics, and cancel/debounce stale requests.
- [ ] Bulk-selection actions join the rail without obscuring filters or result counts.
- [ ] A shared Back to Top appears after meaningful movement on Books/cleanup, book Loans, Collections, Wishlists, and progressively revealed Shelves.
- [ ] Return restores useful focus, respects reduced motion and safe areas, and never obscures actions.
- [ ] Responsive boundaries, 320px, 200% zoom, keyboard, touch, forced colors, and rapid filter changes are tested.

## Out of scope

New filters, album list adoption, and replacing infinite loading with pagination.

## Open questions

1. Should URL filter changes replace history while typing and push history on committed picker changes?
- yes
2. What scroll distance or sentinel should make Back to Top appear consistently?
- when the second set of books loads, feels like a reasonable cutoff. So after 30 books. 
