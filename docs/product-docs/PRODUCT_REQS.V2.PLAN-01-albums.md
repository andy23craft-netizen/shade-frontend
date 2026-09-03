# PLAN-01 — Albums and Music Handling

**Status:** Planning decomposition of the definitive V2 scope. Not an implementation ticket.

**Backend alignment:** Album FEAT-16 through FEAT-24, derived from the former backend PLAN-01.

**Authority:** `PRODUCT_REQS.V2.definitive.md` remains the product source of truth. Backend tickets, implemented
OpenAPI, `API-for-FE.md`, and the backend `V2-proposed-contract.md` remain authoritative for transport behavior. This
plan groups album work for estimation and ticket derivation without replacing those documents.

## Goal

Add albums as Shade's first non-book physical-media catalog. Vinyl, CDs, and cassettes share one album domain while the
UI translates the private-library language into a record-store or intimate jazz-bar identity.

V2 should prove that Shade can support another physical medium without turning books and albums into one weak generic
item model. Shared interaction concepts remain reusable, while album metadata, vocabulary, lookup, artwork, lifecycle,
and presentation stay explicit.

## Scope boundary

This plan owns:

- the album catalog and album-specific navigation;
- vinyl, CD, cassette, `unknown`, and `other` album formats;
- normalized artists and album genres;
- optional ordered, multi-disc track lists;
- album lookup through Discogs and MusicBrainz;
- album artwork through the Cover Art Archive and owner uploads;
- album shelf and wishlist membership;
- album checkout/check-in, played state, owner ratings/reviews, and borrowing statistics;
- album Bulk Add;
- album participation in QR resolution, loan feedback, and Work grouping;
- album Dashboard data and mixed-media Home additions; and
- the approved V2 album visual identity.

This plan does not own tenant routing/infrastructure, which belongs to PLAN-02. Shared book/global features and final
release gates belong to PLAN-03.

## 1. Album domain and physical-copy identity

- Albums and books remain separate typed catalog domains. Do not introduce a polymorphic `/items` CRUD API.
- Every album row represents exactly one owned physical copy with an opaque `album_id` UUID.
- `media_format` is one of `unknown`, `vinyl`, `cd`, `cassette`, or `other`.
- The album, never an individual disc or track, is the loanable object.
- Multiple owned copies may share a barcode or provider release ID while retaining independent UUIDs, locations,
  lifecycle state, loan history, artwork overrides, and QR labels.
- Album deletion is soft. Deleted albums move to the system `removed` location, leave ordinary lists and mutations,
  retain direct-read/restore behavior, and restore to `unknown`.
- Album lifecycle is deliberately narrower than the book lifecycle: `available`, `on_loan`, and `display_only`.
  Albums honor Enable Loans but do not inherit book TBR automation, `reading`, `missing`, or TBR-derived `reserved`.

## 2. Album metadata and vocabulary

An album supports:

- title;
- ordered normalized artists;
- ordered normalized album genres;
- label and release date;
- media format;
- optional barcode, Discogs release ID, and MusicBrainz Release ID;
- notes, owner rating, owner review, played state, and completion date;
- optional ordered tracks grouped by `disc_number` and `track_number`; and
- physical location and lifecycle state.

Create requires a title and at least one artist. Artist behavior mirrors the normalized book-author catalog. Album
genres have their own `/genres` vocabulary and IDs; they are not book categories or authoritative free-form strings.

Zero tracks are valid. Missing tracks are not an incomplete-metadata condition. Create/edit replaces the complete
track list; V2 does not require per-track CRUD. Track artists may differ from album artists and therefore resolve
through the same normalized artist catalog.

## 3. Catalog routes and browsing

The frontend plans against typed `/albums` CRUD and lifecycle routes from the proposed backend contract. Album lists
support paired pagination plus artist, title, barcode, media-format, and deleted-state filtering. Sort choices are
artist, title, release date, and creation date with stable UUID tie-breaking.

Album filters must not be bolted onto the Books URL model. The album area owns its own URL-backed search, filters, sort,
and progressive-load position. Browser history restores that state when the user returns from Books.

Wide album catalogs inherit the persistent left-side control-rail pattern where appropriate. Phones and smaller
tablets inherit the accessible modal treatment. The album controls reuse interaction conventions without displaying
book-only fields.

## 4. Metadata lookup

Album lookup accepts exactly one barcode or explicit Discogs release ID.

- Prefer configured Discogs.
- Use MusicBrainz when Discogs is unconfigured or returns not-found.
- Do not silently fall through on Discogs authentication, transport, timeout, or server failure.
- Return an editable, non-persisted draft; lookup never creates catalog rows.
- Resolve textual artists and genres through `/artists` and `/genres` before create/import.
- Preserve a concrete MusicBrainz Release ID when it can be resolved so artwork can target the exact release.

Items without commercial identifiers remain manually catalogable with title and resolved artist identity.

## 5. Artwork

Album artwork mirrors the book-cover lifecycle through authenticated album artwork routes:

- authenticated image-byte read;
- owner upload;
- delete;
- explicit provider refetch; and
- placeholder on ordinary absence.

Automatic artwork uses the approved front image for the exact MusicBrainz Release from the Cover Art Archive. The
backend retains the MusicBrainz release ID, Cover Art Archive image ID, source URL, and retrieval time while privately
caching bytes per tenant. Missing provider art is ordinary absence and must not fail lookup or album creation.

An owner upload overrides provider artwork. Refetch does not replace owner bytes unless `replace_owner_upload: true`
is explicitly authorized. Delete removes bytes and provenance without deleting catalog provider IDs; a later refetch
may restore provider artwork.

Discogs artwork must not be downloaded, cached, proxied, or persisted without written confirmation that Shade's use
complies with the then-current Discogs terms. Discogs remains available for release identification and metadata.

The frontend never constructs public provider or filesystem image URLs. It consumes the authenticated Shade artwork
resource and preserves the existing lazy-loading, cancellation, placeholder, and transient-error principles.

## 6. Locations, Wishlists, and Collections

- Albums reuse the shared location catalog through typed album-location membership.
- Do not invent separate book-only and album-only location catalogs or cross-media location exclusivity.
- Shelf/location and wishlist placement remain mutually exclusive.
- Wishlists may mix typed book and album memberships. Membership responses contain exactly one typed catalog ID and do
  not embed full catalog detail; the frontend resolves the corresponding detail resource.
- Album wishlist rows support the proposed priority, wanted/ordered/owned/dropped status, notes, and external URL.
- Collections remain book-only over HTTP in V2. Do not plan album Collection UI merely because internal schema may
  preserve future album membership structures.

## 7. Album Bulk Add

Album Bulk Add adapts the proven book interaction rather than creating a universal polymorphic intake endpoint.

The workflow remains:

> Choose location → capture items → look up metadata → review and resolve → import valid items → continue.

Album capture accepts barcode, Discogs release ID, or manual artist/title input. Proposed bulk endpoints accept 1–50
items with stable client IDs and preserve request order. Provider outcomes distinguish found, not-found, invalid,
timeout, and failure. Catalog classification distinguishes new, owned, wishlist, unshelved, ambiguous, and soft-deleted
matches.

Import targets one location, resolves artist and genre IDs before commit, uses independent savepoints, permits partial
success, and reports per-item creation/acquisition/duplicate/validation/stale-reference/persistence outcomes. A
soft-deleted match is never silently reused; the owner restores it or deliberately creates another copy.

The frontend owns queue drafts, validation presentation, retry state, durable local session recovery, navigation
protection, and finish/discard behavior. The backend owns lookup/classification and transactional import.

## 8. Circulation, feedback, and Work grouping

Album checkout/check-in lives on typed album routes. Mixed-media loan history identifies exactly one `book_id` or
`album_id`, and may be filtered by album or media type.

- `enable_loans=false` prevents new album checkout without deleting history.
- Optional signature staging and authenticated rendering use the shared loan-level mechanism from PLAN-03.
- Check-in requires a 1–5 borrower rating; optional review uses the shared idempotent loan-feedback flow.
- Owner album rating/review/played state remains separate from borrower feedback.
- Album detail embeds only the borrower-rating count/average; individual reviews use the paginated album review route.

Every album belongs to one album-specific internal Work. Provider IDs are evidence rather than aggregate identity.
Owner merge/split/reassignment must be atomic, audited, and immediately move historical feedback aggregates without
changing loan or feedback identity. Album grouping uses album-appropriate provider evidence and never groups books and
albums into one Work.

## 9. QR and scanning participation

Album labels use the common deterministic payload:

```text
shade:v1:album:<album_id>
```

The shared authenticated resolver returns a typed album physical-item summary for a valid exact-copy label. Commercial
barcodes may produce multiple owned copies and require disambiguation. Resolution includes album title, primary artist,
format, state, location, checkout eligibility, and active-loan context.

The shared six-up US Letter print system and conventional/decorative QR validation belong to PLAN-03, while this plan
ensures album identities and lifecycle summaries satisfy that shared contract.

## 10. Home and Dashboard integration

Home is library-wide. Recent Additions uses the dedicated mixed-media endpoint and may show active books and albums
together, newest first. Deleted albums and wishlist-only items are excluded. The frontend must not synthesize this list
by merging media-specific counters.

Dashboard remains explicitly media-scoped. Album planning includes:

- total, checked-out, and recently added albums;
- played and unplayed totals;
- average owner rating;
- active and lifetime album loans;
- average album loan duration; and
- breakdowns by loan state, media format, location, and creation year.

Album incomplete-metadata cleanup is not in V2.

## 11. Album visual identity

The album area should feel analogous to the book area without being a recolor. Translate the private-library aesthetic
into an independent record store or intimate jazz listening bar using record bins, sleeve proportions, walnut hi-fi
furniture, speaker cloth, brass controls, shop cards, liner notes, warm stage light, and restrained neon.

The shared application shell, accessibility behavior, responsive logic, and core interaction timing remain consistent.
The detailed analogy catalog lives in `UI_DESIGN_NOTES.ALBUM_ANALOGIES.md`.

V2 supplies one approved album identity. Selectable alternate skins, a free-form theme editor, deep weather/time
simulation, and a spatially navigable listening room remain later work.

## Open design question

The final user-facing location noun for the album area remains open pending owner/collector design review: **crate**,
**bin**, or another term. The underlying API and data model continue to use the shared location/shelf resource, so this
choice changes presentation rather than storage architecture.

The cross-media visual brief and asset inventory are owned primarily by PLAN-03. This plan cannot be ticketed fully
until the album subset of that brief is approved.

## Dependencies and handoffs

- Backend FEAT-16 through FEAT-24 and synchronized OpenAPI.
- PLAN-02 tenant context, storage, artwork directories, CORS, and per-library settings.
- PLAN-03 shared setup, QR printing/resolution UI, signatures, feedback, Work correction, media switching, Home shell,
  release migration, and accessibility/performance gates.
- Approved album design brief and asset inventory.
- Physical and browser testing for camera scanning, QR labels, and responsive layouts.

## Completion criteria

- Album CRUD, normalized vocabularies, lookup, artwork, placement, wishlist, circulation, played state, and Dashboard
  journeys pass against implemented OpenAPI.
- Album Bulk Add supports lookup, exception review, partial import, recovery, and manual identifier-free rows.
- Owner uploads and provider artwork obey replacement, provenance, authentication, and absence rules.
- Mixed-media Home and loans use typed summaries without global mixed-media text search.
- Album QR labels resolve exact owned copies and commercial barcodes disambiguate multiple copies.
- Album borrower feedback and Work correction preserve owner/borrower data separation.
- The approved album identity is responsive, accessible, and within performance guardrails.
- No album Collection, TBR/reading lifecycle, incomplete-metadata cleanup, or public artwork URL is introduced.

## Deferred

- Album Collection membership UI.
- Album TBR automation and `reading` state.
- Album incomplete-metadata cleanup.
- Cross-media global text search.
- External media beyond albums, including video, comics, board games, and digital-only media management.
- Selectable album skins, reactive environment simulation, ambient audio, and a spatial record-store/jazz-bar world.
