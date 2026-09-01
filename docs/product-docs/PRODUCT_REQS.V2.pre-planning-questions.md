# Shade Library UI V2 — Remaining Pre-Planning Questions

**Status:** Frontend/product questions still open after reconciliation with the backend feature definition and the
September 1, 2026 product-answer pass.

Settled decisions have been moved into `PRODUCT_REQS.V2.definitive.md` and removed from this file. This is not an
implementation plan. Questions remain only where research, observation, collector input, a prototype, or a concrete
ticket-level decision is still required.

## Final scope boundary

1. Which unshipped ideas in the older pass-1/pass-2 documents remain V2 after the planned fresh review? In particular,
   confirm the fate of Discover/New Releases, Surprise Me, Reading History, Categories, Library Journal, On This Day,
   weather recommendations, and any other idea not listed in the definitive completion checklist.
   -- review updated docs. 

## Setup, locations, and library settings

2. What final user-facing location noun should the album UI use after collector/future-user interviews: **crate**,
   **bin**, or another term? The underlying V2 model is now settled as one shared `location` concept with
   media-specific presentation terminology.

3. What exact TSV layout(s) will the first-run bootstrap accept, and what validation/error-report format should be
   documented? Inline correction before commit is no longer required; rejected source data is corrected outside Shade
   and re-imported.

## Album contract and presentation

4. Which album artwork provider is acceptable under its current API and artwork-licensing terms? The product contract
   is settled: album artwork mirrors book covers with authenticated reads, owner upload/remove, and backend-owned
   provider fallback. Research is needed only to choose/approve the provider and assign the owning backend ticket.

## V2 visual direction

5. What concrete reference designs/assets are approved for the book area, album area, library-wide Home, and each hosted
   library identity after owner/user review? The ownership and broad design rules are settled; implementation still
   needs an approved brief and asset inventory.

## Media-aware Bulk Add

6. Which remaining gaps in the current book implementation are required for V2 after final ticket review? Durable local
   sessions and navigation protection are already product requirements; identify any remaining status-filter or
   implementation gaps.

## UUID QR labels and circulation scanning

7. Which concrete browser-print template should ship first for the approximately **3 × 3 inch** labels: one label per
   page/card, a standard adhesive-label sheet, or a custom multi-label sheet? Final margins and pagination should be
   chosen from a physical print/phone-scan prototype.

8. Which decorative QR implementation wins the prototype bake-off? Test QuickChart first, QRCode Monkey as a hosted
   comparison, and `qr-code-styling` as the leading self-hosted candidate. Acceptance is reliable decoding on supported
   phones at intended print size; conventional QR remains the fallback.

## Borrower ratings and reviews

9. What exact same-work boundary should the backend apply automatically for **translations, abridgements, adaptations,
   and substantially revised editions**? The internal Work entity and owner-facing **Group as Same Work / Separate from
   Work** correction model are settled; this question determines the default grouping rules and reversal/audit details.

## Media navigation

10. What is the concrete responsive interaction and visual design for the doorway/hallway media switcher, and how is the
    selected media area represented in URLs?

## Restore from backup

11. What free-space threshold must be met before restoration begins, and how should insufficient-space failure be
    presented? Authorization, tenant scoping, recovery-token behavior, and pre-restore-copy retention are already
    defined by the backend direction.

## Persistent list controls

12. After reviewing Discogs and other references, should the wide Books/Shelves rail sit left or right, and at what
    breakpoint does it replace the mobile modal?
13. When the rail is taller than the viewport, does it scroll independently beneath the app header or release its sticky
    position so the document reaches every control?
14. In the mobile modal, do URL-backed results update immediately or only after an explicit Apply action?

## Planning readiness

An end-to-end V2 implementation plan is ready when the older product-document scope review is complete; album
terminology and artwork-provider research are settled; approved visual briefs/assets exist; the remaining book Bulk Add
gaps are ticketed; the QR print/render prototype is chosen; work-group edge cases are defined; media navigation and
persistent-rail behavior are confirmed; and the restore-space preflight has concrete acceptance criteria.

# Questions from User:

Can we change the URLs to be easier to type manually? Specifically categories are tied to the UUID. 
ie, `https://shade.library.spir.es/books?category_id=842f7e13-8466-5d86-a61b-12f9d5b999fe` for `thriller`
to become 
`https://shade.library.spir.es/books?category=thriller`

similarly, anything currently using a UUID in the URL. It would be nice to be able to just know the URL if I wanted to send it to someone. 

I need a way to mark books that need to be re-shelved, if i realize they're in the wrong category but i'm not at home. just a little tag or a place on the dashboard to pin them. 

I want to add non-required editor, illustrator, and translator fields to the book details form. but i only want them to show up on the finished, rendered version if they're filled. if there's no editor listed, it shouldn't show up as a null field on the metadata list. But it should be available to add after the fact if you decide you want it later. 

The current filter box on the books page on mobile looks fantastic. i want to mirror that on the new left justified filter set on the redesigned books page. 

I would like the ability to link a google image search (or another image search other than google, if there is one. I'd prefer not to use google). Either for searching for books without barcodes/isbn's, or also for tracking down missing metadata once it's already been added. This may be V3. 


I love the new native camera feature. In v2 i'd like to make it feel even more native. Like the part around the view finder in the wooden brown of the header, the buttons stylized in our CSS, etc. 

