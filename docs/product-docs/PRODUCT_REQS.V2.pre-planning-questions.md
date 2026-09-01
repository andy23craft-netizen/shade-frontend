# Shade Library UI V2 — Remaining Pre-Planning Questions

**Status:** Frontend/product questions still open after consolidation into the definitive V2 scope and the September 1,
2026 owner-answer pass.

Settled decisions live in `PRODUCT_REQS.V2.definitive.md` and are intentionally absent here. This is not an
implementation plan. Questions remain only where research, observation, collector input, a prototype, or a concrete
ticket-level decision is still required.

## Setup, locations, and library settings

1. What final user-facing location noun should the album UI use after collector/future-user interviews: **crate**,
   **bin**, or another term? The underlying V2 model is settled as one shared `location` concept with media-specific
   presentation terminology.
2. What exact TSV layout(s) will the first-run bootstrap accept, and what validation/error-report format should be
   documented? Inline correction before commit is not required; rejected source data is corrected outside Shade and
   re-imported.

## Album contract and presentation

3. Which album artwork provider is acceptable under its current API and artwork-licensing terms? The product contract
   is settled: album artwork mirrors book covers with authenticated reads, owner upload/remove, and backend-owned
   provider fallback. Research is needed only to choose/approve the provider and assign the owning backend ticket.

## V2 visual direction

4. What concrete reference designs/assets are approved for the book area, album area, library-wide Home, and each hosted
   library identity after owner/user review? The ownership and broad design rules are settled; implementation still
   needs an approved brief and asset inventory.

## Media-aware Bulk Add

5. Which remaining gaps in the current book implementation are required for V2 after final ticket review? Durable local
   sessions and navigation protection are already product requirements; identify any remaining status-filter or
   implementation gaps.

## UUID QR labels and circulation scanning

6. Which concrete browser-print template should ship first for the approximately **3 × 3 inch** labels: one label per
   page/card, a standard adhesive-label sheet, or a custom multi-label sheet? Final margins and pagination should be
   chosen from a physical print/phone-scan prototype.
7. Which decorative QR implementation wins the prototype bake-off? Test QuickChart first, QRCode Monkey as a hosted
   comparison, and `qr-code-styling` as the leading self-hosted candidate. Acceptance is reliable decoding on supported
   phones at intended print size; conventional QR remains the fallback.

## Borrower ratings and reviews

8. What exact same-work boundary should the backend apply automatically for **translations, abridgements, adaptations,and substantially revised editions?** The internal Work entity and owner-facing **Group as Same Work / Separate from Work** correction model are settled; this question determines the default grouping rules and reversal/audit details.
- abridgments are not the same work. Adaptations are an edge case, but are not the same work. Revised editions *are* the same work, as are translations across languages, while translations within the same language are different works. If that's a workable model. 

## Media navigation

9. What is the concrete responsive interaction and visual design for the doorway/hallway media switcher, and how is the
   selected media area represented in URLs?
   - since the homepage will take you to any of the media areas, i think the URLs should only change to having a preceding /books before /loans or /dashboard, and a preceding /albums in the same way. 
   - I like the idea of a record spinning on the screen as the record area loads and pages turning in in a book (with the book on its back and the pages splayed in an arc) when moving to the books side. At least for V2. Eventually I would like it to feel more like you're moving from room to room, but for v2, i'm okay with page to page. 

## Restore from backup

10. What free-space threshold must be met before restoration begins, and how should insufficient-space failure be
    presented? Authorization, tenant scoping, recovery-token behavior, and pre-restore-copy retention are already
    defined by the backend direction.
	- you mean server side? I'm not sure. Provide examples or options to consider. 

## Persistent list controls

11. At what breakpoint does the left-aligned wide Books/Shelves rail replace the mobile modal?
- if you mean screen size, i want the modal to be on smaller ipads, too. can provide a version number if needed. if you don't mean size, reword or explain. 

12. When the rail is taller than the viewport, does it scroll independently beneath the app header or release its sticky
    position so the document reaches every control?
	- I don't know what this question is referring to. 
	
13. In the mobile modal, do URL-backed results update immediately or only after an explicit Apply action?
- like metadata and covers? the quicker the better. 


## Planning readiness

An end-to-end V2 implementation plan is ready when album terminology and artwork-provider research are settled;
approved visual briefs/assets exist; the remaining book Bulk Add gaps are ticketed; the QR print/render prototype is
chosen; work-group edge cases are defined; media navigation and persistent-rail behavior are confirmed; and the
restore-space preflight has concrete acceptance criteria.
