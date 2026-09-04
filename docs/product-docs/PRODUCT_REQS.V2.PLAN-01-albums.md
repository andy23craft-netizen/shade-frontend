# PLAN-01 -- Albums and Music Handling

**Status:** Planning decomposition of remaining album V2 scope. Not an implementation ticket.
Core album MVP UI is shipped against backend **1.1.0**; `docs/tickets/FEAT-02_album-support.md`
owns coverage and release-pairing closeout for that MVP.

**Backend alignment:** Album FEAT-16 through FEAT-24 are shipped into OpenAPI 1.1.0. Remaining
album surfaces (Bulk Add, QR participation, borrower feedback/Work, mixed Home recent
additions) follow backend `PLAN-03` / `V2-proposed-contract.md` until those routes ship.

**Authority:** `PRODUCT_REQS.V2.definitive.md` remains the product source of truth. Implemented
OpenAPI and `API-for-FE.md` own shipped transport behavior. This plan groups remaining album
work for estimation and ticket derivation without replacing those documents.

**Last updated:** September 4, 2026

## Goal

Finish album V2: media-aware Bulk Add, approved visual identity packaging, and album
participation in shared physical-item capabilities (QR, feedback/Work, mixed Home), without
turning books and albums into one weak generic item model.

## Scope boundary

This plan still owns:

- album Bulk Add;
- the approved V2 album visual identity;
- album participation in QR resolution, loan feedback, and Work grouping once shared
  contracts land;
- mixed-media Home Recent Additions once the catalog recent-additions contract lands; and
- album list browse polish that the MVP did not finish (URL-backed filters/sort, progressive
  load, wide-layout control rail).

This plan does not own shared book/global release gates (PLAN-03). Hostname multi-tenant UI is
shipped baseline; production multi-host handoff remains orchestrator `FEAT-08`. Shipped album
MVP catalog/lifecycle/artwork/wishlist/dashboard work is baseline only.

## Shipped baseline (do not re-plan)

Already in the tree against OpenAPI **1.1.0**:

- Typed `/albums` browse/add/detail/edit; soft-delete/restore; `media_format` of `unknown`,
  `vinyl`, `cd`, `cassette`, or `other`.
- Normalized `/artists` and `/genres`; optional ordered tracks; create requires title and at
  least one artist.
- Lookup via `GET /albums/lookup`: barcode lookups fall through Discogs miss **and** Discogs
  failures/timeouts to MusicBrainz; explicit Discogs release IDs have no MusicBrainz
  substitute (**502** / **504**). Draft is editable and non-persisted.
- Authenticated artwork get/upload/delete/refetch (Cover Art Archive only for refetch; never
  Discogs artwork; never constructed provider/filesystem URLs in the browser).
- Shared shelf placement with typed album membership; mixed wishlist `/items` plus album
  membership add/remove/move; Collections remain book-only.
- Checkout/check-in/mark-played on album routes; album loan history via `album_id` /
  `media_type=album`; Dashboard Listening Room widgets for album totals, played/unplayed,
  rating, and borrowing stats.
- Album lifecycle remains `available` / `on_loan` / `display_only` (no book TBR/`reading`/
  `missing` inheritance). Soft delete remains the album contract (distinct from book hard
  delete).

`FEAT-02` remaining work is focused unit/e2e coverage and release pairing with backend 1.1.0,
not greenfield album product design. Visual language polish against
`UI_DESIGN_NOTES.ALBUM_ANALOGIES.md` is out of scope for closing that ticket unless explicitly
requested.

Locked rules that remain in force:

- No polymorphic `/items` CRUD API.
- Every album row is one owned physical copy with opaque `album_id`.
- Multiple owned copies may share a commercial identifier while retaining independent UUIDs,
  locations, lifecycle, loan history, artwork overrides, and future QR labels.
- Zero tracks are valid and not an incomplete-metadata condition.
- Shelf/wishlist placement remains mutually exclusive; mixed-media shelf/collection **412**
  responses must be surfaced honestly.

## 1. Album Bulk Add

**State:** Committed remaining.

Adapt the shipped book Build Mode interaction; do not invent a polymorphic intake endpoint.

> Choose location -> capture items -> look up metadata -> review and resolve -> import valid
> items -> continue.

Album capture accepts barcode, Discogs release ID, or manual artist/title input. Proposed
bulk endpoints accept 1--50 items with stable client IDs and preserve request order. Provider
outcomes distinguish found, not-found, invalid, timeout, and failure. Catalog classification
distinguishes new, owned, wishlist, unshelved, ambiguous, and soft-deleted matches.

Import targets one location, resolves artist and genre IDs before commit, uses independent
savepoints, permits partial success, and reports per-item outcomes. Soft-deleted matches are
never silently reused; the owner restores or deliberately creates another copy. Title plus at
least one artist remain the minimum import-blocking metadata.

The frontend owns queue drafts, validation presentation, retry state, durable local session
recovery (namespaced by library and media), navigation protection, and finish/discard
behavior. First-run guided setup (PLAN-03) composes this adapter once it exists.

## 2. Browse polish

**State:** Committed remaining beyond the MVP list page.

Album lists should own URL-backed search, filters, sort, and progressive-load position
(artist, title, barcode, media-format, deleted-state; sorts for artist, title, release date,
creation date). Do not bolt album filters onto the Books URL model. Browser history restores
album state when the user returns from Books.

Wide album catalogs inherit the persistent left-side control-rail pattern where appropriate;
phones and smaller tablets keep the accessible modal treatment. Controls reuse interaction
conventions without displaying book-only fields. Progressive lists inherit shared Back to Top
behavior from PLAN-03.

## 3. Circulation, feedback, and Work grouping

**State:** Basic album circulation shipped; signatures, borrower feedback, and Work correction
remain committed with PLAN-03 shared contracts.

- `enable_loans=false` must prevent new album checkout without deleting history once library
  settings ship.
- Optional signature staging and authenticated rendering use the shared loan-level mechanism.
- Check-in requires a 1--5 borrower rating; optional review uses the shared idempotent
  loan-feedback flow. Owner album rating/review/played state stays separate.
- Album detail embeds only borrower-rating count/average; individual reviews use the
  paginated album review route.
- Every album belongs to one album-specific internal Work. Owner merge/split/reassignment is
  atomic and audited. Never group books and albums into one Work.

## 4. QR and scanning participation

**State:** Committed remaining; shared print/resolve UI owned with PLAN-03.

Album labels use:

```text
shade:v1:album:<album_id>
```

The shared authenticated resolver returns a typed album physical-item summary for a valid
exact-copy label. Commercial barcodes may produce multiple owned copies and require
disambiguation. Resolution includes title, primary artist, format, state, location, checkout
eligibility, and active-loan context.

## 5. Home integration

**State:** Committed remaining for mixed Recent Additions.

Home is library-wide. Recent Additions should use a dedicated mixed-media endpoint and may
show active books and albums together, newest first. Deleted albums and wishlist-only items
are excluded. Do not synthesize this list by merging media-specific counters in the browser.
Staff Picks remains book-backed.

Dashboard album widgets already ship as explicitly scoped Listening Room metrics; do not
reinterpret missing tracks as incomplete-metadata errors.

## 6. Album visual identity

**State:** Committed remaining.

The album area should feel analogous to the book area without being a recolor. Translate the
private-library aesthetic into an independent record store or intimate jazz listening bar
using record bins, sleeve proportions, walnut hi-fi furniture, speaker cloth, brass controls,
shop cards, liner notes, warm stage light, and restrained neon.

The shared application shell, accessibility behavior, responsive logic, and core interaction
timing remain consistent. The detailed analogy catalog lives in
`UI_DESIGN_NOTES.ALBUM_ANALOGIES.md`.

V2 supplies one approved album identity. Selectable alternate skins, a free-form theme
editor, deep weather/time simulation, and a spatially navigable listening room remain later
work. Respect the definitive document's decorative-asset performance guardrails.

## Open design question

The final user-facing location noun for the album area remains open pending owner/collector
design review: **crate**, **bin**, or another term. The underlying API continues to use the
shared location/shelf resource, so this choice changes presentation rather than storage
architecture. Also recorded in `PRODUCT_REQS.V2.pre-planning-questions.md`.

The cross-media visual brief and asset inventory are owned primarily by PLAN-03. This plan
cannot fully ticket visual identity until the album subset of that brief is approved.

## Dependencies and handoffs

- OpenAPI 1.1.0 / `API-for-FE.md` for shipped album routes; backend PLAN-03 /
  `V2-proposed-contract.md` for unshipped Bulk Add, resolve-code, feedback, Work, and setup.
- `FEAT-02` for MVP unit/e2e coverage and release pairing.
- Shipped hostname tenant context and tenant-scoped artwork directories; orchestrator
  production multi-host handoff remains FEAT-08.
- PLAN-03 shared setup composition, QR printing/resolution UI, signatures, feedback, Work
  correction, media switching polish, Back to Top, release migration, and accessibility /
  performance gates.
- Approved album design brief and asset inventory.
- Physical and browser testing for camera scanning, QR labels, and responsive layouts.

## Completion criteria

- `FEAT-02` coverage/release pairing for the shipped MVP passes under `make check`.
- Album Bulk Add supports lookup, exception review, partial import, recovery, and manual
  identifier-free rows.
- Album browse uses URL-backed filters/sort and inherits wide-rail / Back to Top patterns
  where applicable.
- Owner uploads and provider artwork continue to obey replacement, provenance,
  authentication, and absence rules.
- Mixed-media Home Recent Additions and loans use typed summaries without global mixed-media
  text search.
- Album QR labels resolve exact owned copies; commercial barcodes disambiguate multiple
  copies.
- Album borrower feedback and Work correction preserve owner/borrower data separation.
- The approved album identity is responsive, accessible, and within performance guardrails.
- No album Collection, TBR/reading lifecycle, incomplete-metadata cleanup, or public artwork
  URL is introduced.

## Deferred

- Album Collection membership UI.
- Album TBR automation and `reading` state.
- Album incomplete-metadata cleanup.
- Cross-media global text search.
- External media beyond albums, including video, comics, board games, and digital-only media
  management.
- Selectable album skins, reactive environment simulation, ambient audio, and a spatial
  record-store/jazz-bar world.
