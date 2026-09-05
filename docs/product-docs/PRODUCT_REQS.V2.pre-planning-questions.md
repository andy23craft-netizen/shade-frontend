# Shade Library UI V2 -- Resolved Pre-Planning Questions

**Status:** Resolved. Album MVP UI, hostname multi-tenant routing, and book Build Mode are
shipped. The decisions below have been reconciled into `PRODUCT_REQS.V2.definitive.md`.

**Last updated:** September 5, 2026

This file retains the final pre-planning answers as a decision record. The authoritative
scope lives in `PRODUCT_REQS.V2.definitive.md`; this is not an implementation plan.

## Setup, locations, and library settings

1. What final user-facing location noun should the album UI use after collector/future-user
   interviews: **crate**, **bin**, or another term? The underlying V2 model is settled as one
   shared `location` concept with media-specific presentation terminology. The shipped album
   MVP still uses shared `shelf_name` / "Shelf" labels and casual "bin" marketing copy.

   - **Decision:** *Crate* is the final choice. Existing transport field names do not change.

## V2 visual direction

2. What concrete reference designs/assets are approved for the book area, album area,
   library-wide Home, and each hosted library identity after owner/user review? Ownership
   rules and broad design direction are settled in the definitive document,
   `UI_DESIGN_NOTES.MD`, and `UI_DESIGN_NOTES.ALBUM_ANALOGIES.md`. Implementation still needs
   an approved brief and asset inventory. The shipped album MVP left that polish for
   follow-up work.

   - **Decision:** Close this as an up-front planning dependency. Resolve reference, art
     direction, and asset choices one bounded surface at a time during implementation, and
     record the necessary decisions and acceptance criteria in the owning ticket.

## Planning readiness

The two frontend pre-planning questions are settled. Visual-identity work may be decomposed
without a complete up-front brief or asset inventory, and album presentation should use
**crate**. Broader V2 delivery still depends on backend-owned TSV column lists and
restore-space rules, plus a six-label print/render prototype that passes its phone-scan
acceptance matrix; those are implementation dependencies, not unanswered questions in this
document.
