# Shade Library UI V2 — Remaining Pre-Planning Questions

**Status:** Open questions only; reconciled with product answers on August 30, 2026.

Settled answers have been moved into `PRODUCT_REQS.V2.definitive.md` and removed from this file. This is not an
implementation plan. Questions deferred wholly to V3 are also omitted unless V2 needs a compatibility decision now.

## Final scope boundary

1. Which unshipped ideas in the older pass-1/pass-2 documents remain V2 after the planned fresh review? In particular,
   confirm the fate of Discover/New Releases, Surprise Me, Reading History, Categories, Library Journal, On This Day,
   weather recommendations, and any other idea not listed in the definitive completion checklist.
2. What effort threshold moves optional signature capture to V3? The product preference is to pursue it in V2, but it
   must not hold the release indefinitely if the backend/file lifecycle proves disproportionate.

## Setup, locations, and library settings

3. What is the shared physical-location model behind media-specific words such as shelf, crate, cabinet, or bin? Are
   these labels only presentation over one location resource, or are location types and hierarchy required in V2?
4. Which TSV layouts are accepted during first-run bootstrap, how are they validated and previewed, and can an owner
   correct rejected rows before committing the import?
5. Which Manage Collection settings require backend persistence in V2, beyond setup state and Enable Loans? Confirm
   whether scanner preferences and label-print defaults are library settings or device/browser preferences.

## Album contract and physical-copy identity

6. Which album artwork provider is acceptable under its API and artwork-licensing terms, and which backend ticket owns
   authenticated artwork read/upload/remove plus provider fallback?
7. How will the backend represent several owned physical copies of one commercial book edition or album release while
   preserving edition metadata, per-copy UUIDs, location, status, loans, and QR labels? Existing ISBN duplicate rules
   conflict with the settled V2 requirement.
8. How does a shelf or collection advertise its established media type when the locked backend plan keeps shared
   catalog rows without a `media_type` column and prohibits mixed membership?

## V2 visual direction

9. Who will define and approve the single V2 art direction for books, albums, the library-wide Home, and each hosted
   library identity? Which reference designs and assets are available?
10. What performance/asset-size budget applies to the V2 visual packages?
11. Which administrative surfaces remain visually neutral—Bulk Add, first-run setup, circulation, settings, and
    restore—and how much book/album identity should they retain?

## Media-aware Bulk Add

12. For albums, which identifiers can be scanned, which lookup result fields block import, and which missing fields
    merely produce Needs Review?
13. How does destination selection consume the new physical-location model while keeping the existing book Build Mode
    contract stable?
14. Beyond first-run browser persistence, should every unfinished Bulk Add session autosave locally? Define resume,
    expiry, explicit discard, storage failure, and cleanup after successful import.
15. How should intake resolve a commercial scan matching several releases or several owned physical copies?
16. Which remaining gaps in the current book implementation are required for V2: status filters, navigation
    protection, durable local sessions, hardware-scanner integration, and any differences found in final ticket review?

## UUID QR labels and circulation scanning

17. What versioned QR payload is encoded: an application URL, custom URI, signed opaque token, or another format? Must
    labels survive hostname/domain changes?
18. Is a stable physical-item UUID acceptable on the label, or should a revocable public label ID resolve to the
    private item UUID?
19. What may an unauthenticated phone see after scanning a Shade label, if anything?
20. Which label sheets, printers, dimensions, margins, and fallback human-readable text must V2 support? Is browser
    printing sufficient, or is generated PDF required?
21. Which entry points generate labels: item detail, Browse bulk selection, Bulk Add completion, location view, or all
    of them?
22. Are labels generated only on request, and does V2 track printed/reprinted state or history?
23. What is the final scanner-first circulation interaction now that exact item QR, commercial barcode ambiguity,
    reserved/reading override, and per-library Enable Loans behavior must coexist?
24. What should a valid QR show when its item is deleted, removed, belongs to another library, is missing, is display
    only, or otherwise cannot circulate?

## Reservation follow-on

25. Is the general `Reserved` shelf / virtual will-call box part of V2, or a follow-on after basic TBR automation?
26. If it is V2, is the editable post-it stored as dedicated reservation metadata, and when is it cleared—on shelf
    exit, checkout, manual action, or some combination?

## Quote-coordinated Home presentation

27. Which future Home modules beyond New Additions, Browse the Stacks, and Staff Picks opt into quote-specific heading
    pairs?
28. Which bounded decorative accents may a quote mapping select in V2? Define the allowed asset/treatment set so this
    enhancement does not become a second skin or rearrange Home.

## Signature, email, ratings, and reviews

29. Can the backend provide one user-visible checkout operation that safely stages an optional PNG signature and
    creates the loan without leaving orphaned files or an unintended loan on failure?
30. Is the optional email review request committed to V2 or a later enhancement? If V2, choose the SMTP/email provider,
    verified sender address, signed-link expiry, and delivery-failure behavior. A custom Shade mailbox is not required.
31. Should written reviews display the borrower's first name or initials? Full typed names remain visible on the loan
    record itself.
32. What stable work/group identity combines borrower ratings across physical copies of the same title without merging
    unrelated works or crossing media types?

## Home, Dashboard, and media navigation

33. Confirm immediately before Dashboard ticketing whether Dashboard is media-specific, or whether any panels are
    library-wide.
34. What is the concrete responsive interaction and visual design for the doorway/hallway media switcher, and how is
    the selected media area represented in URLs?

## Restore from backup

35. What authorization protects Restore from Backup in Manage Collection? The shared browser Bearer token is not a
    distinct admin credential. Decide whether a tenant may restore only its current library and how Andy performs
    cross-library support restores.
36. How long is the automatic pre-restore safety copy retained, where is it stored, and what free-space threshold must
    be met before restoration begins?

## Persistent list controls

37. After reviewing Discogs and other references, should the wide Books/Shelves rail sit left or right, and at what
    breakpoint does it replace the mobile modal?
38. When the rail is taller than the viewport, does it scroll independently beneath the app header or release its
    sticky position so the document reaches every control?
39. In the mobile modal, do URL-backed results update immediately or only after an explicit Apply action?

## Planning readiness

An end-to-end V2 implementation plan is ready when:

* the older product-document scope review is complete;
* backend contracts cover albums/artwork, physical copies, locations, setup/settings, intake persistence, QR
  resolution, reservation rules, signature/feedback, email if included, and restore authorization;
* art direction exists for the single V2 visual identity in each supported area;
* Dashboard/media navigation and persistent-rail decisions are confirmed; and
* optional signature and email work are either committed with bounded acceptance criteria or explicitly deferred.
