# Shade Library UI V2 — Remaining Pre-Planning Questions

**Status:** Frontend/product questions still open after reconciliation with the backend feature definition on August 31, 2026.

Settled backend answers have been moved into `PRODUCT_REQS.V2.definitive.md` and removed from this file. This is not an implementation plan. Questions below remain only where the backend definition does not determine the frontend/product choice or where a ticket still needs a concrete UI/operations decision.

## Final scope boundary

1. Which unshipped ideas in the older pass-1/pass-2 documents remain V2 after the planned fresh review? In particular, confirm the fate of Discover/New Releases, Surprise Me, Reading History, Categories, Library Journal, On This Day, weather recommendations, and any other idea not listed in the definitive completion checklist.

## Setup, locations, and library settings

2. What is the shared physical-location model behind media-specific words such as shelf, crate, cabinet, or bin? Are these labels only presentation over one location resource, or are location types and hierarchy required in V2?
- I think internally we'll just label it as "location" with the UI actually showing the media specific term. Bins/crates for music, shelves for books and dvds. I'll also talk to some collectors/future users and see what terminology they prefer. 

3. Which TSV layouts are accepted during first-run bootstrap, how are they validated and previewed, and can an owner correct rejected rows before committing the import?
- I don't see this being a big issue, except when i make it open source. but i think it's recommended that people make sure their data is in good shape before import rather than allowing for edits prior to commiting. 


## Album contract and presentation

4. Which album artwork provider is acceptable under its API and artwork-licensing terms, and which backend ticket owns authenticated artwork read/upload/remove plus provider fallback?
- need to do research on *which*, but i want to mirror the backend/frontend contract that we creted for the book artwork. 

5. How does a shelf or collection advertise its established media type when the locked backend plan keeps shared catalog rows without a `media_type` column and prohibits mixed membership?
- the frontend will change based on which media type you're viewing. So it should be apparent what you're looking at. 

## V2 visual direction

6. Who will define and approve the single V2 art direction for books, albums, the library-wide Home, and each hosted library identity? Which reference designs and assets are available?
- I'll work with my future users to make sure it fits the vibe they want for their UI. 

7. What performance/asset-size budget applies to the V2 visual packages?
- No idea. suggestions? 

8. Which administrative surfaces remain visually neutral—Bulk Add, first-run setup, circulation, settings, and restore—and how much book/album identity should they retain?
- yeah, i see having the same basic options in the manage collection page with the visual aesthetic being the clue that you're somewhere different. I don't want to change names of stuff except for maybe "shelves" to whatever nomenclature we settle on for each media type. 


## Media-aware Bulk Add

9. For albums, which lookup result fields block import and which missing fields merely produce Needs Review? Capture itself is now defined to accept barcode, Discogs release ID, or manual artist/title input.
- title and artist are the two most important fields, i think, just like title and author in books. That's the bare minimum you want to know about an album. 

10. How does destination selection consume the eventual physical-location model while keeping the existing book Build Mode contract stable?
- rephrase or explain on next pass. 

11. Which remaining gaps in the current book implementation are required for V2 after final ticket review? Durable local sessions and navigation protection are already product requirements; identify any remaining status-filter or implementation gaps.

## UUID QR labels and circulation scanning

12. Which concrete browser-print label sheet/template should V2 ship first (dimensions, margins, and pagination)? Generated PDF is not required by the backend definition, and human-readable fallback text is not required.
- so far the only input i have here is that i want the labels to be about 3x3 inches and i might want them to look like my grandpa's face. 

13. Which UI entry points generate labels: item detail, Browse bulk selection, Bulk Add completion, location view, or a smaller initial set?
- when fully implemented, a QR could should be generated after the book is added. Since it's being retroactively added, we'll also need a `generate all` and a bulk select option to generate multiple at a time for replacements. this would be located in `manage collection`. 

14. What is the final scanner-first circulation interaction when exact-item QR, ambiguous commercial barcodes, reserved/reading override, and per-library Enable Loans behavior coexist?
- rephrase or explain in next pass. 

15. What should the UI show after a well-formed QR resolves to an item that is missing, display-only, already on loan, or otherwise ineligible? Cross-library/unknown labels use the generic not-found behavior.
16. Which QR rendering library/style can support the optional portrait-inspired treatment while retaining robust phone scanning and a conventional fallback?

## Reservation follow-on

17. When should structured pickup name/note metadata on the committed general Reserved/will-call shelf be cleared: on shelf exit, checkout, explicit owner action, or some combination?

## Quote-coordinated Home presentation

18. Which future Home modules beyond New Additions, Browse the Stacks, and Staff Picks opt into quote-specific heading pairs?
19. Which bounded decorative accents may a quote mapping select in V2? Define the allowed asset/treatment set so this enhancement does not become a second skin or rearrange Home.

## Borrower ratings and reviews

20. Should written reviews display the borrower's first name or initials? Full typed names remain visible on the loan record itself.
21. What frontend correction UI should expose the backend's owner-correctable same-work grouping for borrower-rating aggregates (merge/split or equivalent)?

## Media navigation

22. What is the concrete responsive interaction and visual design for the doorway/hallway media switcher, and how is the selected media area represented in URLs?

## Restore from backup

23. What free-space threshold must be met before restoration begins, and how should insufficient-space failure be presented? Authorization, tenant scoping, recovery-token behavior, and pre-restore-copy retention are already defined by the backend direction.

## Persistent list controls

24. After reviewing Discogs and other references, should the wide Books/Shelves rail sit left or right, and at what breakpoint does it replace the mobile modal?
25. When the rail is taller than the viewport, does it scroll independently beneath the app header or release its sticky position so the document reaches every control?
26. In the mobile modal, do URL-backed results update immediately or only after an explicit Apply action?

## Planning readiness

An end-to-end V2 implementation plan is ready when the older product-document scope review is complete; the remaining location/bootstrap/album-artwork contracts are settled; art direction exists for each supported area; media navigation and persistent-rail behavior are confirmed; the initial QR print/circulation UX is chosen; and the remaining ticket-level work-grouping, reservation-clearing, and restore-space decisions have concrete acceptance criteria.
