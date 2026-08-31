# Shade Library UI V2 — Questions Required Before Implementation Planning

**Status:** Decision checklist compiled August 29, 2026.

These questions are intentionally separated from an implementation plan. The current repository does not contain
enough product and backend decisions to create a responsible end-to-end V2 plan. Answers may be recorded here or in
the eventual authoritative feature tickets.

## Blocking scope and source-of-truth questions

1. Does `PRODUCT_REQS.V2.definitive.md` supersede the remaining scope in the older pass-1/pass-2 documents, or must the
   plan also include their unshipped items such as Discover/New Releases, Surprise Me, Reading History, Categories,
   Library Journal, On This Day, weather recommendations, seasonal themes, and time-of-day behavior? 
   - Some of these are going to be removed. I will go through these docs again with a fresh eye in the days to come. 
   
2. Is every item in the definitive completion checklist a hard V2 release blocker? In particular, should borrower
   signature remain conditional, and should the punch-card exploration remain non-blocking?
   - Punch cards are non-blocking, that's not software stuff. But I would like to pursue the borrower signature as much 
   as possible. If it's going to take a lot, it can be V3.
   
3. Is the V2 media boundary now books plus the album catalog for vinyl, cassettes, and CDs, with movies/DVDs/VHS and
   comics deferred to V3?
   - Movies, DVDs, and VHS are confirmed V3. Comics are provisionally V3 pending collector research. Albums are the
     additional physical-media catalog for V2.
   
4. Should the frontend album work be planned only after backend `FEAT-23` publishes its synchronized contract, as the
   backend sequence directs, or should a provisional frontend design ticket run in parallel without transport work?
   - I think dealing with these kinds of frontend decisions can wait until after the backend is built out. 
   

## Guided first-run setup

5. What authoritative backend signal distinguishes “never configured” from a configured library that currently has
   zero owned items, a tenant the user cannot access, or a failed books request?
   - Hmmm. This is a good question that requires more thought. I have just pictured that no one would boot it up empty
   more than once, but that's a good point. There should definitely be a difference in a failed request though. do you have
   suggestions on how to deal with that on the technical side?
   
6. Should setup completion be stored per library on the server or locally in one browser? There are no user accounts
   in the locked multi-library model. Can an owner mark
   setup complete without adding an item?
   - probably per library on the server. It will be routed through whatever.library, so whoever is the first name there,
   somehow a token should refer that. 
   
7. Must an interrupted first-run intake resume on another device/browser? If yes, the current frontend-only Bulk Add
   queue is insufficient; what server-side session lifecycle is intended? 
   - I think just in that browser. I just don't want someone to scan thirty books and realize they're late and then come home
   to lost work. 
   
8. During first-run setup, can users create only shelves, or should the physical-location model expand beyond shelves
   before other media arrive (room, cabinet, bin, crate, wall, etc.)? 
   - It should expand. The first prompt should become, `what kind of media are you adding?` and then a media specific term
   for the internal location field can be subsequently created. 
   
9. Should setup permit importing existing TSV/backup data when it is available, or is the guided workflow only for an
   installation with no bootstrap source?
   - That should be part of the prompt. `Do you have a TSV backup file to build from?` if no, build mode. If yes, bootstrap.
   
10. What destination should Finish Setup open, and where should an owner later resume guided Build Mode?
	- Well, I guess it should take them to their dashboard so they can see what they've just created from a bird's eye view. 

## Additional media and shared domain model

11. What preparation, if any, should V2 make for the deferred movie/video and comic catalogs without implementing
    them prematurely?
	- Movies, DVDs, and VHS are V3. DVDs and VHS will probably be formats in one movie/video model, analogous to vinyl,
	CDs, and cassettes within albums. Comics are provisionally V3 and may relate to books, but need UPC lookup and a
	collector-informed model first. V2 should not use album `other` as a substitute for either domain.
	
12. For later V3 movie/video planning, what is the loanable grain for multi-disc releases and box sets?
	- Ask a collector before deciding. This does not block V2.
	
13. For later V3 comic planning, what is the catalog grain: issue, collected edition, series, or owned physical copy?
    How are creators and roles, issue/volume numbers, variants, story arcs, and UPC lookup represented?
	- Ask a collector before deciding. Comics are provisionally V3, so this does not block V2.
14. Do the no-mixed-shelf and no-mixed-collection rules locked for books versus albums extend to every later medium?
    If so, how does a collection/shelf advertise its type when the shared catalog row has no `media_type` column?
	- yes, this rule applies across the board, but i'll need to think more about the second half of this. 
	
15. Are multiple copies of the same commercial release supported in V2? The UUID QR requirement implies copy-level
    identity, while current duplicate ISBN behavior generally prevents another owned book record.
	- yes. 
	
16. Are audiobooks intentionally excluded, despite the older Reading History note, and are digital items always out of
    scope for this physical-media release?
	- I would like a way to log the audiobooks i've read, but that's out of scope for now. I'm more focused on logging 
	physical media for now. 
	
17. Albums currently have no cover/artwork endpoint in the ticket series. Is album artwork required for the V2
    first-class UI, and if so, which backend ticket owns storage/provider fallback?
	- artwork is one of the things that makes V1's UI feel real. I think albums need it, too. May need to find a public
	API for that. 
18. Album incomplete-metadata is explicitly deferred by the backend MVP. Is that acceptable for UI V2 completion, or
    must V2 add album cleanup reporting later?
	- album cleanup can be added later. Other people may not be as anal about that kind of thing as I am. 

## Multi-tenancy, accounts, and preferences

19. `PLAN-02` notes that anyone with the shared secret can access either allowed hostname/library. Is that acceptable
    owner-support policy, and should the frontend continue to omit any library switcher?
	- I need access to everyone's profile as the admin, and i don't see a reason to firewall users from mine. Yeah, no
	library switcher, just relative to the domain name "shade.library", "jamie.library", "dallas.library", etc. 
	
20. What should the SPA show on an unknown hostname: a dedicated generic error page or the API's `400` response? 
	- a fun landing page that says something about, "no one owns this library yet." or something. 
	
21. Which library receives the existing seeded catalog, and should the other first boot with schema/system shelves
    only? This affects first-run setup acceptance testing.
	- I'm not sure i understand this question. But most other users will not have TSV to bootstrap. 
	
22. Which settings belong to a library versus a browser/device: media skin, setup completion, scanner preferences,
    quote behavior, and label print format? There are no user accounts in the locked model.
	- I think most of these should be available for them to do on their own in the manage collection page 
	
23. Since library switching occurs by navigation to another hostname, which local state may persist across hostnames
    and which must also be namespaced defensively (for example saved Bulk Add sessions)?
	- I might need other examples and more information to answer this. 
	
24. Does the hardcoded Andy/Jamie owner theme required by `PLAN-02` select a skin, sit above the media-identity/skin
    system as another override, or become obsolete when curated skins ship?
	- Originally, yes. I see curated skins maybe as a V3. I might just stick with one new aesthetic for V2. 
	
25. Do Andy and Jamie receive the same enabled media types and feature set, or may availability differ by library?
	- yes, all users should get the same options. 

## Visual identity and skins

26. Who will define and approve the primary and alternate art direction for each required medium, and are reference
    designs/assets available?
27. Is the alternate-skin requirement exactly two launch skins per medium, or at least two with more permitted?
28. Is skin choice per library, per device, or per medium within either scope?
29. May a library choose one global skin family across media, or is every medium selected independently?
30. Are seasonal and time-of-day treatments separate overlays, part of a skin, deferred, or removed from V2?
31. What asset-size/performance budget should apply when every medium has multiple visual packages?
32. Which administrative surfaces remain visually neutral—Bulk Add, tenant setup, circulation, settings—and how much
    media identity should they retain?
	
	Will review at a later date

## Media-aware Bulk Add

33. For each medium, what can be scanned, which lookup service is authoritative, what fields block import, and what
    missing fields merely trigger Needs Review?
34. Does every medium use the same physical destination model, or can the “destination/context” be a shelf, crate,
    box, binder, drawer, or other container?
35. Must unfinished sessions be server-persisted for ordinary Bulk Add as well as first-run setup? What are creation,
    autosave, resume, expiration, abandonment, and deletion semantics?
36. How should Bulk Add resolve a scan that matches several commercial releases or several owned copies?
37. Should the current book Bulk Add implementation be treated as feature-complete foundation, or are remaining spec
    gaps—status filters, durable sessions, navigation protection, hardware-scanner integration, and other differences
    discovered during ticket review—part of V2?

## UUID QR labels and circulation scanning

38. What exact versioned QR payload should be encoded: raw UUID, application URL, URI scheme, or signed opaque token?
    Must a label work across host/domain changes?
39. Is exposing a stable item UUID on a physical label acceptable, or should the QR carry a revocable public label ID
    that resolves to the private item UUID?
40. Should scanning a Shade QR require authentication, and what should an unauthenticated phone display?
41. Which label sheets, printers, dimensions, margins, and fallback text/barcode formats must V2 support? Is a browser
    print stylesheet sufficient, or is downloadable PDF required?
42. Where can users generate labels: item detail, bulk Browse selection, Bulk Add completion, location view, or all of
    these?
43. Should newly imported items receive printable labels automatically or only on explicit request? How are “label
    printed” and reprint history tracked, if at all?
44. What is the intended unified circulation interaction? The current app has checkout on Book Details and check-in on
    Loans, not a scanner-first circulation page that decides “coming or going.”
45. When a commercial barcode matches multiple owned copies, how does the user select the physical copy? Can checkout
    proceed from a product-level scan without a copy QR?
46. What should happen if a valid QR points to a deleted, removed, wrong-tenant, or non-circulating item?

## Manual book availability and TBR shelf behavior

47. Should both `Liz TBR` and `Andy TBR` set the book to `reserved`, or should either shelf set it to `reading`?
    Is “reading” reserved for a book someone has actually started?
48. Does a reservation need a separate `reserved_for` value so the UI can say “Reserved for Liz” or “Reserved for
    Andy,” or is the TBR shelf name enough for now? What should a manually reserved book outside those shelves show?
49. When a book leaves a TBR shelf, should it automatically return to `available`, restore the status it had before
    entering the shelf, or keep its current status until changed manually?
50. If a book is manually marked `missing`, `display_only`, or `reading` while it is on a TBR shelf, does that manual
    choice override the shelf rule? If so, should later moves reapply automation?
51. Should the status action offer `unknown` and `display_only` as well as the required `available`, `reserved`,
    `reading`, and `missing` choices?
52. Should moving several books to a TBR shelf apply the same automatic status to every selected book through one
    atomic bulk operation? The current bulk move endpoint changes only shelves.
53. Should reserved and reading books be completely blocked from checkout, or may the owner explicitly override the
    hold during checkout after a warning?
54. Where should manual status changes be available besides Book Details: Browse bulk actions, the ordinary Edit Book
    form, a shelf view, or only Book Details for V2?

## Quote-coordinated Home presentation

55. Is this feature the previously documented weather-aware quote system plus coordinated visuals, or should it remain
    random and use quote-specific presentation independent of weather?
56. Which Home text changes with a quote: section headings, helper copy, hero treatment, all page headings, or a fixed
    approved subset? Please provide the prior conversation that contains the agreed behavior if it exists.
57. Is presentation mapped per individual quote, per weather family, per tone/category, or through a curated template
    set shared by many quotes?
58. Which visual properties may respond—background, assets, accents, typography, layout—and how does this interact with
    media identity, skin, season, and time of day?
59. Who owns quote records and their editorial verification? Is the candidate 50–100 quote corpus still the target,
    and may quotes be linked to items absent from the local catalog?
60. Is `last_displayed_date` global, per tenant, or per user/device? Who selects a quote—the backend or frontend—and
    what is the fallback when weather or quote services fail?

## Signature capture

61. Is a signature required to complete checkout, optional per loan, or controlled by a tenant setting? May the owner
    bypass it when the borrower is remote or the device lacks pointer support?
62. What exact acknowledgement text is displayed, and must the borrower explicitly accept it in addition to drawing a
    signature?
63. Should the signature be stored as vector strokes, SVG, PNG/WebP, or another representation? Must pressure,
    timestamps, or stroke order be retained?
64. What retention, deletion, export, backup, and privacy rules apply to signatures? Who may view them?
65. Should checkout create the loan before signature upload, submit both atomically, or hold an expiring checkout
    session? What happens if checkout succeeds but signature storage fails?
66. Is a dedicated loan-detail route required, or is rendering within the existing Loans page sufficient for V2?

## Borrowers, ratings, and reviews

67. Does V2 introduce durable patron/borrower profiles, or do reviews remain attached to the current free-text borrower
    string? How are two people with the same name distinguished?
68. Who enters feedback: the borrower directly on the owner's device, the owner on the borrower's behalf, or the
    borrower through a link/account later?
69. Is feedback allowed only after a successful return, and is there at most one feedback record per loan?
70. What rating scale and precision are required? Is a text review allowed without a rating, and can feedback be
    edited or withdrawn?
71. Is borrower attribution anonymous, initials-only, full-name, tenant-configurable, or chosen per review?
72. Are moderation/approval, visibility, and abuse-reporting needed when tenants other than the original private
    library use the app?
73. Are aggregates calculated per owned copy, commercial edition/release, work/title, or some combination? Albums
    have a release-level catalog row; books currently generally prevent duplicate ISBNs. How do
    aggregates work across media?
74. Should a skipped check-in prompt be available later from the loan record, and should the app ever remind a
    borrower?

## Donation punch card and Staff Pick reward

75. Is this feature committed to V2 or only a research/design outcome for V2?
76. What constitutes a qualifying donation: physical items only, any media, money, supplies, or owner discretion?
77. Who grants a punch, can it be reversed, and what audit note/evidence is required to prevent duplicates?
78. Is the threshold fixed at ten, tenant-configurable, or campaign-specific? Do punches expire or carry over after a
    reward?
79. Does earning the reward let the patron nominate a Staff Pick for owner approval or directly add one item? How long
    does the designation last, and can the same item have several patrons' picks?
80. Does this require a patron-facing account/UI, or is it an owner-managed ledger shown to the patron when useful?
81. How should donations and participation be presented without implying a monetary value, tax status, or guaranteed
    prize?

## Cross-cutting product behavior

82. Is Home library-wide by default or scoped to the selected medium? Is Dashboard scoped the same way?
83. Is media selection global persistent state, a URL segment/filter, or both? What does a shared deep link select?
84. Should global search return mixed-media results by default, and how are heterogeneous results grouped and
    disambiguated on mobile?
85. Which media are circulatable by default, and can circulation policy be configured per item, medium, or tenant?
86. Do “Staff Picks,” Collections, Wishlists, borrower aggregates, recent additions, and dashboard counts combine media
    or get separate per-medium views?
87. Which post-V1 observations have been collected, and who decides whether each is a defect, polish item, committed
    V2 feature, or later work?

## Planning readiness

An end-to-end V2 implementation plan is ready to create when:

* the album `FEAT-23` handoff contract is available; deferred V3 media do not block V2 planning;
* the definitive scope versus the older pass documents has been resolved;
* the shared item/media/location and tenant/auth models are known;
* the persisted preference and session boundaries are known;
* the circulation, QR payload, borrower identity, feedback, and signature lifecycles are defined;
* art direction exists for the required media/skin matrix; and
* exploratory features have been promoted to committed scope or explicitly kept non-blocking.
