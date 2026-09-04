# Shade Library UI V2 -- Remaining Pre-Planning Questions

**Status:** Two frontend visual-design questions remain. Album MVP UI, hostname multi-tenant
routing, and book Build Mode are shipped; these questions block approved visual-identity and
album location-noun tickets, not the shipped MVP contracts.

**Last updated:** September 4, 2026

Settled decisions live in `PRODUCT_REQS.V2.definitive.md` and are intentionally absent here.
This is not an implementation plan. Questions remain only where research, observation,
collector input, a prototype, or a concrete ticket-level decision is still required.

## Setup, locations, and library settings

1. What final user-facing location noun should the album UI use after collector/future-user
   interviews: **crate**, **bin**, or another term? The underlying V2 model is settled as one
   shared `location` concept with media-specific presentation terminology. The shipped album
   MVP still uses shared `shelf_name` / "Shelf" labels and casual "bin" marketing copy; that
   is not an approved final noun.

## V2 visual direction

2. What concrete reference designs/assets are approved for the book area, album area,
   library-wide Home, and each hosted library identity after owner/user review? Ownership
   rules and broad design direction are settled in the definitive document,
   `UI_DESIGN_NOTES.MD`, and `UI_DESIGN_NOTES.ALBUM_ANALOGIES.md`. Implementation still needs
   an approved brief and asset inventory. `FEAT-02` explicitly leaves that polish out of MVP
   closeout unless a follow-up asks for it.

## Planning readiness

Visual-identity and album location-noun tickets are ready to finalize when these two
questions are settled and approved briefs/assets exist. Broader V2 readiness also still
depends on backend-owned TSV column lists and restore-space rules, plus a six-label
print/render prototype that passes its phone-scan acceptance matrix.
