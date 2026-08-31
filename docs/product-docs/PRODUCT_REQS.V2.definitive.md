# Shade Library UI V2 — Reconciled Feature Boundary

**Status:** Living planning document; reconciled against the frontend repository on August 29, 2026.

**Purpose:** Define the intended feature-complete boundary for UI V2 without replacing the detailed requirements and
API contracts that already exist elsewhere in `docs/`.

## Authority and document relationships

This document is the V2 scope index and the source of truth for which capabilities belong in V2. It is not an
implementation ticket.

When documents disagree, use the following order:

1. A current sequenced feature ticket in the repository that owns the work. This currently includes backend
   `FEAT-16` through `FEAT-23` for the album catalog and backend `PLAN-02` for multi-tenancy.
2. The checked-in OpenAPI contract and `API-for-FE.md` for backend behavior.
3. A feature-specific product specification, such as `BULK_ADD_UX.md`.
4. This scope document for the intended user-facing outcome.
5. The older pass documents and `UI_DESIGN_NOTES.MD` as background and preserved ideas.

The frontend open-ticket directory currently contains no sequenced feature ticket. The referenced album and
multi-tenant definitions live in the sibling `shade-backend` repository. Frontend tickets should be created from
their final contracts at the handoff points those documents specify; the frontend must not restate or diverge from
their backend architecture.

The older `PRODUCT_REQS.V2.pass-1.md`, `PRODUCT_REQS.V2.pass-2.md`, and
`PRODUCT_REQS.V2.pass-2-details.md` contain remaining ideas that are not all included in the boundary below. Whether
those ideas remain in V2 is an explicit scope question, not something an implementation plan should assume.

## 1. Version definition

### V1 completion criterion

V1 is complete when the application can do everything the previous spreadsheet-based system could do, with a better
experience, plus the additional functionality delivered during V1 development. That milestone is effectively
complete.

### V2 completion criterion

V2 is complete when every committed feature in this document has been implemented against an agreed contract and the
post-V1 observation findings selected for V2 have been incorporated. Features labeled **exploratory** do not become
release blockers until their rules and inclusion have been explicitly approved.

Real-world use after V1 launch should continue to identify friction, weak interactions, and improvements substantial
enough for V2. Ordinary defects and small polish work do not need to become V2 features.

## 2. First-run library setup / guided Build Mode

**V2 commitment:** A genuinely empty installation enters a guided, productive setup flow instead of presenting the
ordinary empty application.

### Existing definition to preserve

The underlying book workflow is already defined by `BULK_ADD_UX.md` and the Build Mode contract in
`API-for-FE.md`:

> Choose a destination → capture identifiers → look up metadata → review or correct exceptions → import every
> approved valid row → continue with the next destination.

The workflow is shelf-first and optimized for uninterrupted scanning. Each scan has independent lookup, validation,
catalog-classification, and import state. Problems accumulate for later review instead of interrupting intake. Saving
a shelf submits only approved rows, supports partial success, and leaves unresolved rows in the session.

For books, the API contract is already concrete:

* `POST /books/bulk/lookup` accepts batches of 1–50 ISBN items with stable `client_item_id` values and returns a result
  per item in request order.
* Results distinguish provider status from local catalog state. Owned, wishlisted, unshelved, and ambiguous matches
  require different UI treatment.
* `POST /books/bulk/import` applies one `shelf_name` and optional `acquisition_source` to the approved batch, uses
  per-item savepoints, and reports created, wishlist-acquired, duplicate, validation, stale-reference, and persistence
  outcomes independently.
* The frontend owns the scan queue, editable drafts, Ready/Needs Review/Incomplete classification, navigation
  protection, and session persistence. It must not loop the single-book lookup or create endpoints for the same batch.

The current frontend already has `/books/bulk-add`. It selects an existing shelf, supports manual and camera ISBN
capture, asynchronously performs the bulk lookup, edits drafts inline, resolves wishlist acquisition, saves eligible
rows through bulk import, and offers Start Next Shelf and Finish Bulk Add. This is the starting point for guided setup,
not a greenfield design.

### First-run behavior to add

First-run setup should reuse the same intake engine and real catalog operations. It should add only the guidance and
orchestration needed to build an empty library:

1. Detect a genuinely empty installation from authoritative backend state, including an installation with no TSV
   bootstrap data. Do not infer first-run solely from a temporarily empty or failed frontend query.
2. Explain briefly that setup will organize and catalog the real collection one physical location at a time.
3. Let the user create the first assignable location without leaving setup, then select it as the active destination.
4. Enter the ordinary high-throughput intake workspace with scanner focus and short, contextual guidance.
5. Save valid items while retaining unresolved items for correction, using the existing partial-success semantics.
6. On completion of a location, let the user create or choose the next location and continue without returning to the
   normal application shell.
7. Let the user finish setup deliberately. Once finished, route to an agreed useful destination and do not force the
   wizard on every subsequent empty-library visit.
8. Provide a discoverable way to resume or restart guided building later, because an empty installation may be built
   over multiple sessions.

Tutorial text should be attached to real actions. Avoid tutorial-only slides, fake scans, and a second catalog form.
Ordinary Bulk Add must remain available after first-run setup.

### Known gap

The current API has no setup-completion state, library-initialization resource, or server-side intake-session resource.
The current Bulk Add queue is frontend state. The persistence and completion-state design must be decided before this
feature can be ticketed.

## 3. Additional physical media

**V2 commitment:** V2 adds the album catalog defined by the backend workstream. Vinyl records, CDs, and cassettes are
first-class formats within that album catalog. Books remain first-class through the existing book catalog.

Movies and video media—including DVDs and VHS tapes—are V3, not V2. Comics are also provisionally V3 while their
catalog grain and UPC requirements are researched. Board games remain a possible later addition.

First-class means each medium can be created, browsed, searched, viewed, edited, located, included in applicable
collections or wishlists, and circulated where the domain rules allow. A non-book item must not be represented by
mislabeling book fields such as author, ISBN, pages, or read status.

The V2 UI should preserve shared application concepts—owned physical item identity, location, cover/artwork,
circulation, bulk intake, search, and curated grouping—while presenting medium-specific metadata and terminology.

### Defined album workstream

Backend `FEAT-16` through `FEAT-23` define an album-catalog MVP. In that contract, one **album** is the catalog and
loanable object, while `media_format` identifies `vinyl`, `cd`, `cassette`, `unknown`, or `other`. Vinyl, CDs, and
cassettes therefore share one album experience with format-aware presentation; they are not three unrelated catalog
resources.

The locked model and its frontend consequences are:

* Albums remain separate from books. They use parallel `albums` data and `/albums` routes rather than a polymorphic
  `/items` resource or entries returned from `GET /books`.
* Album identity is the opaque UUID `album_id`. The same backend series renames book identity from `id` to `book_id`,
  a breaking frontend contract change that must ship in the coordinated release window.
* Album records contain title, ordered structured artists, ordered string genres, label, release date, media format,
  optional barcode/Discogs/MusicBrainz identifiers, notes, rating, lifecycle/played state, and optional tracks.
* Tracks are nested rows grouped by `disc_number` and `track_number`. Zero tracks are valid and not an incomplete-data
  condition. Create/edit replaces the full track list; there is no per-track CRUD in the MVP.
* Album create requires a title and at least one `artist_id`. The frontend resolves textual lookup artists against the
  separate `/artists` catalog, just as book lookup authors are resolved to `/authors` IDs.
* `GET /albums` has album-specific artist/title/barcode/format filters, deletion inclusion, pagination, and artist,
  title, release-date, and creation-date sorts. Albums are not added to book filters.
* Album delete is soft delete: it moves the album to `removed`, removes wishlist and album-collection memberships,
  and retains the row. Restore moves it to `unknown`. This intentionally differs from book hard delete.
* Albums reuse the shared shelf catalog through parallel album-shelf membership. A shelf cannot mix book and album
  membership in this MVP; cross-type placement returns an explicit `412`.
* Collections also use parallel book and album membership and cannot mix media in one collection. The collection
  catalog itself has no `media_type` column, so the UI must make a collection's established type clear and prevent
  invalid choices.
* Wishlists **can** mix books and albums. The mixed endpoint returns membership IDs plus nullable `book_id` and
  `album_id`; the frontend joins each row to the corresponding detail endpoint. Wishlist and shelf placement remain
  mutually exclusive.
* Loans gain nullable typed `book_id` and `album_id`, exactly one per row. Album checkout/check-in lives on album
  routes, the album—not a track—is loaned, and loan lists can be filtered by album or `media_type`.
* `is_played`, completion date, rating, and review mirror the book mark-read lifecycle through
  `/albums/{album_id}/mark-played`. Album rating/review here are owner data, not borrower feedback.
* `GET /albums/lookup` accepts a barcode or explicit Discogs release ID, prefers configured Discogs, and uses
  MusicBrainz only for not-found or when no Discogs token is configured. It returns an editable, non-persisted draft.
* Dashboard summary and breakdown responses gain parallel album keys. Existing book keys remain book-only. Album
  incomplete-metadata reporting is explicitly deferred, and a missing track list is not an error.

The frontend should wait for backend `FEAT-23` contract synchronization and use the resulting OpenAPI plus
`API-for-FE.md`, rather than coding against proposed intermediate schemas.

### Deferred media

The album `other` format must not be used as a substitute for a movie, video, comic, or board-game domain.

V3 planning may treat DVDs and VHS as formats of one movie/video catalog, analogous to the album format model. The
loanable grain for multi-disc releases and box sets remains open. Comics also require collector input before deciding
whether the catalog grain is an issue, collected edition, series, or another physical-copy model, and before adding
UPC-based lookup. Audiobook reading-history logging and digital-media management remain outside the physical-media V2
scope.

## 4. Multi-tenant support

**V2 commitment:** The UI implements the small, hostname-selected multi-library model defined in backend `PLAN-02`.
This is not a general SaaS tenant/account system.

Locked behavior:

* The initial allowlist is `andy` and `jamie`. Adding a library is an operator/configuration change across frontend,
  backend, DNS, and Caddy—not runtime registration.
* `andy.library.spir.es` and `jamie.library.spir.es` serve the same static SPA and API process but route to separate
  `andy.db` and `jamie.db` SQLite files. Libraries cannot browse or join each other's data.
* The frontend derives the library username from the hostname's leftmost label. The same rule supports
  `andy.localhost:5173` and `jamie.localhost:5173` for local development.
* Every protected request sends the shared Bearer token plus `Library-Username: <hostname label>`. Public health and
  version requests omit the library header. Missing, unknown, or disallowed usernames return `400`; the client must
  not fall back to another library.
* The shared token remains. There are no login/logout flows, per-person credentials, runtime roles, tenant discovery,
  or library switcher. Opening the other hostname is the only switch.
* The hostname also selects a hardcoded owner theme/token entry for Andy or Jamie. The precise theme assets remain
  frontend design work.
* Vite must accept the two `*.localhost` development hosts, and frontend documentation must use those URLs for local
  testing.
* The SPA must not restore a browser backup surface. Backup scoping and multi-file capture remain backend/operator
  concerns.

### Contract status

The current frontend already defines the `Library-Username` header but hardcodes the value `shade`; the current backend
allows the header through CORS but ignores it. The frontend ticket begins only when the backend accepts `andy` and
`jamie` and requires the header. `PLAN-02` still has open operational/backend decisions, but its frontend shape above
is authoritative except for unknown-host UX, owner-switch policy, and final theme assets.

## 5. Media-specific visual identities

**V2 commitment:** Moving between media types should feel like entering a different part of the collection while still
feeling like one application.

Each medium should define a visual identity package that can affect decorative assets, background and card treatments,
typographic roles, textures, materials, accents, and appropriate interface metaphors. It should not be limited to a
palette swap. Shared administrative workflows should retain clarity and information density even when the surrounding
identity changes.

Identity must not change information architecture, hide required state, rely on color alone, or compromise keyboard,
mobile, reduced-motion, contrast, and text-resizing behavior. Media identity should be a presentation concern layered
over the medium's domain behavior, not a forked copy of the application.

The current app has one global token and stylesheet system plus book/library-specific raster assets. There is no media
context or runtime theme provider. A design brief and asset budget are required for each medium before implementation
tickets can be estimated.

## 6. Curated skins per media type

**V2 commitment:** Every supported medium ships with a primary skin and at least one alternate curated skin. A
free-form theme editor is deferred.

Media identity and skin are separate layers:

* **Media identity** supplies the broad vocabulary appropriate to books, albums, and future media.
* **Skin** supplies a curated interpretation of that identity.

The current Shade Library appearance should become a book skin, not the universal application appearance. Skin choice
must be persisted at the agreed scope, applied before or during initial render without an avoidable flash of the wrong
skin, and have a safe fallback if a saved skin is removed or unavailable. All skins must meet the same functional and
accessibility requirements.

Seasonal themes in the older V2 documents are a separate axis unless product deliberately merges them with skins.

## 7. Media-aware Bulk Add

**V2 commitment:** Every supported medium uses a common bulk-intake interaction model with medium-specific capture,
lookup, validation, editing, duplicate handling, and persistence.

`BULK_ADD_UX.md` already defines the generic boundary:

> Choose destination/context → capture identifier or manual entry → lookup → populate queue item → validate → classify
> → optionally edit → persist valid rows → resolve exceptions.

Books remain the reference implementation, but ISBN, author, and shelf cannot become assumptions of the generic intake
engine. Each medium configuration should supply:

* identifier types and parsers, including whether camera or hardware scanning is useful;
* manual-entry behavior for items without a commercial identifier;
* lookup provider and provider-specific failure presentation;
* required and optional fields;
* queue columns and inline editor;
* validation and review rules;
* catalog-match and duplicate-resolution rules;
* destination terminology and eligible location types; and
* import transport and cache invalidation behavior.

First-run guided setup uses this framework. The current book endpoints cannot import another medium, so implementation
must wait for the media contracts.

## 8. Physical-item UUID QR labels

**V2 commitment:** Generate printable QR labels that encode the stable identity of one owned physical item, and let
scanner-driven item workflows resolve those labels.

Required user-facing behavior:

* Generate a label for one item from its existing stable item UUID.
* Generate labels in a batch from explicitly selected items.
* Preview and print labels in an agreed sheet/label format with readable fallback text.
* Reprint the same item's label without creating or rotating its identity.
* Use a versioned, recognizable application payload rather than displaying a raw UUID as an untyped scan.
* Reject malformed or unsupported Shade payloads safely.
* Resolve a valid Shade QR to exactly one physical item, including a particular copy when multiple owned copies share
  a commercial identifier.

Checkout and check-in scanning should accept both an applicable commercial identifier and a Shade item QR. Commercial
identifiers may produce zero, one, or multiple catalog candidates because they identify products or editions; an item
QR should resolve one owned copy.

### Current-state constraint

Book `id` values are UUID strings and are already the stable identity used by detail and lifecycle paths. However, the
current scanners parse ISBNs only, collection scan behavior either opens a unique ISBN match or filters Browse, and
there is no unified checkout/check-in scanner surface. No QR payload format, item-resolution endpoint across media,
label-generation API, or print template is defined.

QR generation itself can be client-side, but lookup authorization, payload format, revocation expectations, and print
requirements must be decided before choosing that boundary.

## 9. Manual book availability and TBR-driven status

**V2 commitment:** An owner can deliberately change a book's availability state without checking it in or out, and
selected personal TBR shelves can apply an availability state automatically when a book is moved there.

### Existing contract and current limitation

The backend already defines these book statuses:

* `unknown`
* `available`
* `on_loan`
* `missing`
* `display_only`
* `reserved`
* `reading`

`BookUpdate` currently accepts `status`, but the frontend's ordinary book-edit flow intentionally omits it along with
other lifecycle fields. Checkout is offered only for `available` books. Checkout and check-in own the `on_loan` to
`available` lifecycle, while shelf moves currently change only `shelf_name`.

### Manual status control

Book Details should expose a clear owner/admin action for changing availability. At minimum, the owner must be able to
mark a book `available`, `reserved`, `reading`, or `missing` without editing unrelated bibliographic metadata.
`display_only` and `unknown` may remain available administrative choices if product confirms they are useful.

`on_loan` is not a manual choice. It is created by checkout and cleared by check-in so loan history and book state
cannot diverge. A manual action must not make a book available, reserved, reading, or missing while an active loan
exists; the owner must check the item in first. Stale-state failures should preserve the intended choice, refresh the
book and loan state, and explain what changed.

The UI should explain the practical meaning of each state:

* **Available:** eligible for ordinary checkout.
* **Reserved:** intentionally held back from ordinary checkout.
* **Reading:** currently in personal use and held back from ordinary checkout.
* **Missing:** not presently locatable and held back from ordinary checkout.
* **Display only:** part of the collection but never ordinarily loaned.

Changing availability does not change `is_read`, reading completion, rating, or review. In particular, `reading`
means the physical copy is in current use; it does not mark the book read.

### TBR shelf automation

Moving a book from its home shelf to `Liz TBR` or `Andy TBR` should be able to reserve it or mark it as reading as part
of the same successful operation. The status and shelf move must not visibly disagree because one update succeeded
and the other failed.

The initial product intent is household-scale rather than a general reservation queue: Andy or Liz can hold a book so
another borrower is not offered it. A later version may add an ordered reservation list for several people who want
the same title back to back.

The exact mapping for each TBR shelf, what happens when a book leaves one, and whether the reserved person's identity
must be stored separately from the shelf are still open. Those rules require a backend contract before ticketing.

## 10. Quote-coordinated Home presentation

**V2 commitment:** Home presentation responds deliberately to the active quote; the quote is not an isolated rotating
text block.

### Existing quote work to preserve

Home currently chooses one random entry per page mount from the frontend `homeQuotes` pool and lets the user expand its
context. `PRODUCT_REQS.V2.pass-2.md` and `PRODUCT_REQS.V2.quote-bucket.md` separately define a future weather-aware
quote system:

* quotes become structured records rather than only hardcoded frontend text;
* records may carry author, source/book attribution, chapter/source information, condition tags, weight, and
  last-displayed information;
* selection matches current conditions, avoids recent repetition, and uses weighting to keep a prolonged weather
  pattern varied; and
* weather-aware quote selection remains separate from weather-based book recommendations.

The quote corpus is explicitly a candidate corpus requiring a second source-verification pass, not final production
data.

### New presentation requirement

The active quote should supply a presentation key or other curated mapping used by Home headings and page treatment.
The relationship must be authored and bounded: quote text must never be interpreted as CSS, HTML, or an asset path.
The base Home structure and accessible names should remain stable while approved decorative text/treatment changes.
A deterministic fallback is required for records without a presentation mapping and for failed quote/weather loads.

The prior documents do not define which headings change, how treatments map to quotes, whether the presentation is
weather-derived or quote-specific, or how much of Home is affected. Those decisions are required before a ticket can
be written.

## 11. Borrower signature capture

**V2 status:** Committed subject to a feasibility decision. If accepted after investigation, signature capture and
rendering are one feature and should not be split into independently shippable promises.

Intended experience:

1. The owner begins checkout on a phone-friendly surface.
2. The borrower is shown the item, borrower identity, timestamp context, and a short acknowledgement.
3. The device is handed to the borrower, who signs in a touch-capable signature area.
4. The borrower can clear and retry before confirming.
5. The confirmed signature is saved to the newly created loan, not to the reusable book/item record.
6. The loan's visual record renders the signature with borrower and checkout context.

The signature is a library artifact and acknowledgement, not a claim of legal enforceability. The UI must not imply
otherwise.

The older `UI_DESIGN_NOTES.MD` already places the signature on the digital library card/loan treatment, while
`PRODUCT_REQS.V2.pass-2.md` says that richer skeuomorphic treatment should not block other work. The minimum V2 record
can therefore be an accessible loan-detail/card treatment without requiring a full physical-card simulation.

The current checkout body and `LoanRead` schema contain no signature field or attachment resource, and loan records
cannot be patched. Storage format, retention, deletion, access, upload timing, and failure recovery require a backend
contract before UI planning.

## 12. Borrower ratings and reviews

**V2 commitment:** A borrower can optionally rate and review a returned physical item without altering the owner's
rating, review, or read state.

The natural prompt is part of, or immediately after, successful check-in. It must be lightweight, skippable, and safe
to dismiss. Review data belongs to the relevant borrower and loan history. An item detail surface may show a separate
aggregate such as “4.6 from 8 borrowers” and individual reviews according to the chosen privacy rules.

Required separation:

* Owner `rating`, `review`, and read status remain owner collection data.
* Borrower feedback never marks the owner as having read an item.
* A feedback record is attributable internally to a loan even if its public display is anonymous.
* Aggregates count only feedback included by agreed moderation/privacy rules and distinguish no ratings from a zero
  rating.
* Editing or removing borrower feedback recomputes the aggregate without rewriting the loan event itself.

“Highest rated by borrowers,” “Most borrowed,” and “Borrower favorites” are discovery extensions, not part of the
minimum feedback feature unless separately promoted.

The current app has only a free-text borrower name on each loan. Owner rating/review live on `BookRead`; check-in
accepts only an optional return timestamp; and no borrower, patron, feedback, or aggregate resource exists. This
feature requires a borrower identity decision and backend contract.

## 13. Patron donation participation / punch card

**V2 status:** Exploratory; it becomes a release requirement only after product approves concrete rules.

The preferred concept rewards qualifying donations to the library rather than repeated borrowing. A patron receives a
credit for a qualifying donation and, after a configurable threshold (currently proposed as ten), earns a small
participatory privilege. The leading reward is the ability to designate a Staff Pick, making the reward part of the
collection's character instead of a monetary or physical prize.

A lightweight implementation should show the patron's progress, record why and when each credit was granted, prevent
accidental duplicate credit, let the owner correct mistakes, show when a reward is earned and redeemed, and preserve
an audit trail appropriate to this informal system. It should not process money or require the owner to purchase
rewards.

Staff Picks currently exist as a named Collection. A reward could therefore grant an owner-mediated nomination or a
limited membership action, but the exact authority must be chosen; the current application has no patron accounts or
permissions.

No patron, donation, punch, reward, or redemption model exists in the frontend or API.

## 14. Cross-cutting behavior to resolve

### Unified search and scanning

Decide whether a global entry point can search and scan across media without a prior medium choice. Exact item QR
payloads should be resolvable globally. Ambiguous commercial identifiers need an explicit disambiguation experience.

### Generalized circulation

Circulation should be evaluated as an owned-physical-item capability rather than a book-only feature. Eligibility,
loan history, borrower feedback, signature capture, and scan-to-checkout/check-in behavior should use shared lifecycle
concepts unless a medium has a documented exception.

### Dashboard and Home

Choose which modules are library-wide, which follow the currently selected medium, and which intentionally combine
both. Counts and labels must make their scope visible.

### Media switching

Media selection will affect domain fields and visual environment. It needs a persistent, keyboard-accessible,
mobile-appropriate interaction with defined URL/deep-link behavior and a predictable fallback when the selected
medium is unavailable to the active tenant.

## 15. Post-V1 observation period

After V1 goes live, pause active feature development for approximately one week and use the application normally.
Record cumbersome interactions, weak pages, technically complete but unpolished behavior, repetitive actions, missing
information, distinctive-page opportunities, and improvements substantial enough for V2 rather than ordinary bug
fixing.

Before V2 scope is frozen, triage each observation as defect, small polish, V2 candidate, or later-version idea. Any
observation accepted into V2 must gain user-facing acceptance criteria and any required backend contract before it is
scheduled.

## V2 completion checklist

Committed release outcomes:

* Guided first-run setup built on the existing Build Mode workflow.
* First-class books plus the album catalog for vinyl, cassettes, and CDs.
* Tenant-aware UI against the approved multi-tenant contract.
* A distinctive visual identity plus at least one alternate curated skin for every supported medium.
* Media-aware Bulk Add for every supported medium.
* Stable physical-item QR labels, batch printing, and QR-aware item resolution in circulation.
* Manual book availability controls for reserved, reading, missing, and available states.
* Agreed automatic status behavior when books move to `Liz TBR` or `Andy TBR`.
* Quote-coordinated Home presentation, including the agreed portion of the existing structured/weather-aware quote
  work.
* Borrower signature capture and rendering if the feasibility gate is approved.
* Optional borrower ratings/reviews with owner-data separation and borrower aggregates.
* Incorporation of selected post-V1 observations.

Exploratory outcomes, not release blockers until promoted:

* Patron donation participation / punch card.
* Staff Pick nomination or designation as a punch-card reward.

## Deferred or possible later work

* Board-game support, potentially V3.
* Movie/video catalog support, including DVDs, VHS, and decisions for multi-disc releases and box sets.
* Comic support after the catalog grain, creator model, and UPC lookup requirements are defined.
* Audiobook reading-history logging and other digital-media support.
* A free-form user-created theme editor.
* Elaborate patron reward or monetary-incentive systems.
* Borrower-derived discovery beyond the minimum feedback and aggregate display.

Move deliberately deferred ideas here so they are not silently lost.
