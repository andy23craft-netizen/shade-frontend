# FEAT-89 -- Dedicated Album Section

**Status:** In progress -- awaiting Listening Dashboard design feedback.

**Dependency group:** Room-level navigation and album section composition.

**Depends on:** All earlier ready album tickets: `FEAT-01` Album Bulk Add, `FEAT-02` album
browse completion, `FEAT-03` album visual identity and crate language, and `FEAT-04` Album
Wishlists and Collections. This ticket is implemented last among the ready album tickets so
its room navigation can target completed routes.

## Objective

Complete the final design treatment for the room-specific **Listening Dashboard**. The
dashboard is functionally separated from the Reading Dashboard and displays the shipped
album collection, circulation, format, crate, and listening statistics, but its final
composition and visual hierarchy are intentionally deferred until user feedback is
available.

Use `docs/product-docs/UI_DESIGN_NOTES.ALBUM_ANALOGIES.md` as design direction. The initial
section uses the global album palette and identity; per-library variants remain later work.

## Remaining acceptance criteria

- [ ] Gather user feedback on the Listening Dashboard's information hierarchy and visual
      metaphor.
- [ ] Refine the Listening Dashboard so album inventory, circulation, listening, format, and
      crate statistics are easy to scan and feel native to the record-shop/listening-room
      design language.
- [ ] Verify the final dashboard treatment for responsive layout, keyboard and focus behavior,
      reduced motion, contrast, 200% text zoom, loading, empty, and partial-error states.
- [ ] Add or update representative automated coverage for the approved dashboard composition.

## Implemented in the 1.2.0 work

- Shared Home has no application header and offers image-based entrances to `/reading-room`
  and `/listening-room`. Its existing discovery content remains book-oriented until the
  separately planned multimedia Home work.
- Reading Room and Listening Room have distinct landing pages, palettes, terminology, and
  mirrored room-specific navigation. The shared brand returns to Home.
- Manage, Collections, and Wishlists are neutral shared "hallway" spaces with links to both
  rooms. They are no longer required to route through Home before entering another room.
- Reading and Listening dashboards are separate routes. The temporary album panel was removed
  from the Reading Dashboard.
- Book and album loan histories are separate room-specific pages. Album circulation uses the
  typed album loan contract.
- Album Browse, Add/Edit, Details, and Bulk Add use the Listening Room palette and primary
  action treatment. Album cards, filters, normalized artist/genre pickers, artwork, crate
  language, and detail presentation are in place.
- The shared Manage page exposes both book and album intake actions.
- A separate Crates administration page was considered and deferred because `/shelves`
  currently exposes no media designation for reliably separating empty shelves from empty
  crates.

## Out of scope

A fully navigable virtual room, time/weather simulation, ambient audio, per-library album
themes, global cross-media search, multimedia Home discovery, a separate Crates catalog
without backend media typing, and replacement of the shared Shade shell.
