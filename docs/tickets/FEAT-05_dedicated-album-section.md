# FEAT-05 -- Dedicated Album Section

**Status:** Ready to be implemented.

**Dependency group:** Room-level navigation and album section composition.

**Depends on:** All earlier ready album tickets: `FEAT-01` Album Bulk Add, `FEAT-02` album
browse completion, `FEAT-03` album visual identity and crate language, and `FEAT-04` Album
Wishlists and Collections. This ticket is implemented last among the ready album tickets so
its room navigation can target completed routes.

## Objective

Organize Shade as a shared Home with two distinct rooms: the existing book area becomes the
**Reading Room**, and the album area becomes the **Listening Room**. Shared Home is the only
route between the two rooms. Inside either room, navigation, color palette, assets, and
visual metaphors belong to that room while their overall information architecture and
interaction quality remain parallel.

Use `docs/product-docs/UI_DESIGN_NOTES.ALBUM_ANALOGIES.md` as design direction. The initial
section uses the global album palette and identity; per-library variants remain later work.

## Acceptance criteria

- [ ] Shared Home clearly offers entry into either the Reading Room or the Listening Room;
      it does not silently choose a room or behave as either room's internal landing page.
- [ ] The Listening Room has a dedicated landing experience rather than dropping users
      directly into a book-like catalog list. It provides clear entry points to Browse, Add
      Album, Bulk Add, Wishlists, Collections, album circulation, and listening statistics.
- [ ] The Reading Room retains the setup and destinations of the existing book area. The
      Listening Room mirrors that setup with album-native routes and controls rather than
      reusing book identities, copy, or transport.
- [ ] Direct navigation from the Reading Room to the Listening Room, or from the Listening
      Room to the Reading Room, is not exposed. A user returns to shared Home before entering
      the other room.
- [ ] Each room's navigation bar contains that room's destinations plus a clear, accessible
      route back to shared Home. Room changes are predictable and preserve ordinary browser
      Back/Forward behavior.
- [ ] Entering a room changes the complete room-level presentation: navigation treatment,
      color palette, imagery/assets, terminology, and visual metaphors. The Reading Room uses
      the library language; the Listening Room uses record-shop/listening-room language.
- [ ] The album section uses the record-shop/listening-room visual language and complementary
      global palette defined by `FEAT-03`, while preserving recognizable Shade branding.
- [ ] Album discovery modules use album-native artwork, title, artist, format, played state,
      and **crate** language; no book-only labels or identifiers leak into the section.
- [ ] Browse remains the task-focused grid owned by `FEAT-02`; the landing experience does
      not duplicate its filters, pagination state, or results model.
- [ ] Direct links enter the correct room shell and browser history preserves the distinction
      among shared Home, room landing pages, browse, detail, create/edit, Wishlist,
      Collection, and circulation destinations.
- [ ] Responsive, keyboard, focus, reduced-motion, contrast, 200% text zoom, loading, empty,
      and partial-error behavior meet the shared application standard.
- [ ] Automated tests cover Home-to-room entry, mandatory room-to-Home exit, the absence of
      direct cross-room navigation, deep links, navigation and theme state, landmark
      structure, mobile behavior, and representative discovery cards.

## Out of scope

A fully navigable virtual room, time/weather simulation, ambient audio, per-library album
themes, global cross-media search, and replacement of the shared Shade shell.
