# Shade Library UI V2 --- Definitive Design & Scope

**Status:** Definitive V2 product/design scope; living only where this
document explicitly marks an open design decision.

**Purpose:** Define the authoritative user-facing vision, design
direction, feature boundary, and completion scope for Shade Library V2.
This is a product/design document, not an implementation plan or ticket
specification; detailed API contracts and implementation sequencing
remain in their owning technical documents.

## Authority and document relationships

This document is the definitive V2 design and scope document and the
source of truth for which user-facing capabilities belong in V2. It
defines what V2 should become and the experience it should deliver; it
is not an implementation ticket or implementation plan.

When documents disagree, use the following order:

1.  A current sequenced feature ticket in the repository that owns the
    work. This currently includes backend `FEAT-16` through `FEAT-23`
    for the album catalog and backend `PLAN-02` for multi-tenancy.
2.  The checked-in OpenAPI contract and `API-for-FE.md` for backend
    behavior.
3.  A feature-specific product specification, such as `BULK_ADD_UX.md`.
4.  This scope document for the intended user-facing outcome.
5.  `UI_DESIGN_NOTES.MD` as design background and preserved rationale.

The frontend open-ticket directory currently contains no sequenced
feature ticket. The referenced album and multi-tenant definitions live
in the sibling `shade-backend` repository. Frontend tickets should be
created from their final contracts at the handoff points those documents
specify; the frontend must not restate or diverge from their backend
architecture.

The former Product Brief and Product Brief Details documents were
consolidated into this document on September 1, 2026. They are no longer
parallel scope sources. Their committed outcomes are recorded here and
their later-version ideas are preserved under **Deferred or possible
later work**.

## 1. Version definition

### V1 completion criterion

V1 is complete when the application can do everything the previous
spreadsheet-based system could do, with a better experience, plus the
additional functionality delivered during V1 development. That milestone
is effectively complete.

### V2 completion criterion

V2 is complete when every committed feature in this document has been
implemented against an agreed contract and the post-V1 observation
findings selected for V2 have been incorporated. Features labeled
**exploratory** do not become release blockers until their rules and
inclusion have been explicitly approved.

Real-world use after V1 launch should continue to identify friction,
weak interactions, and improvements substantial enough for V2. Ordinary
defects and small polish work do not need to become V2 features.

## 2. First-run library setup / guided Build Mode

**V2 commitment:** A genuinely empty installation enters a guided,
productive setup flow instead of presenting the ordinary empty
application.

### Existing definition to preserve

The underlying book workflow is already defined by `BULK_ADD_UX.md` and
the Build Mode contract in `API-for-FE.md`:

> Choose a destination → capture identifiers → look up metadata → review
> or correct exceptions → import every approved valid row → continue
> with the next destination.

The workflow is shelf-first and optimized for uninterrupted scanning.
Each scan has independent lookup, validation, catalog-classification,
and import state. Problems accumulate for later review instead of
interrupting intake. Saving a shelf submits only approved rows, supports
partial success, and leaves unresolved rows in the session.

For books, the API contract is already concrete:

-   `POST /books/bulk/lookup` accepts batches of 1--50 ISBN items with
    stable `client_item_id` values and returns a result per item in
    request order.
-   Results distinguish provider status from local catalog state. Owned,
    wishlisted, unshelved, and ambiguous matches require different UI
    treatment.
-   `POST /books/bulk/import` applies one `shelf_name` and optional
    `acquisition_source` to the approved batch, uses per-item
    savepoints, and reports created, wishlist-acquired, duplicate,
    validation, stale-reference, and persistence outcomes independently.
-   The frontend owns the scan queue, editable drafts, Ready/Needs
    Review/Incomplete classification, navigation protection, and session
    persistence. It must not loop the single-book lookup or create
    endpoints for the same batch.

The current frontend already has `/books/bulk-add`. It selects an
existing shelf, supports manual and camera ISBN capture, asynchronously
performs the bulk lookup, edits drafts inline, resolves wishlist
acquisition, saves eligible rows through bulk import, and offers Start
Next Shelf and Finish Bulk Add. This is the starting point for guided
setup, not a greenfield design.

### First-run behavior to add

First-run setup should reuse the same intake engine and real catalog
operations. It should add only the guidance and orchestration needed to
build an empty library:

1.  Read explicit per-library setup state from the backend. Recommended
    states are `not_started`, `in_progress`, and `complete`; a failed
    request remains an error and must never be interpreted as an empty
    or new library. Item counts may inform setup but are not the
    completion signal.
2.  Ask which supported media the owner is adding, then use that
    medium's user-facing location term and intake fields.
3.  Ask whether the owner has a supported TSV bootstrap source. If so,
    enter a validated bootstrap/import path; if not, continue into
    guided Build Mode. A disaster-recovery backup uses the separate
    restore workflow.
4.  Explain briefly that setup will organize and catalog the real
    collection one physical location at a time.
5.  Let the user create the first assignable location without leaving
    setup, then select it as the active destination.
6.  Enter the ordinary high-throughput intake workspace with scanner
    focus and short, contextual guidance.
7.  Save valid items while retaining unresolved items for correction,
    using the existing partial-success semantics.
8.  On completion of a location, let the user create or choose the next
    location and continue without returning to the normal application
    shell.
9.  Let the owner mark setup complete even if no item was added, then
    route to Dashboard for a library-wide summary. Do not force the
    wizard on every subsequent empty-library visit.
10. Provide a discoverable entry from Manage Collection to resume guided
    building later.
11. Persist an unfinished intake queue in the current browser so a
    refresh, closure, or interruption does not discard scanned work.
    Cross-device resume is not required for V2.

Tutorial text should be attached to real actions. Avoid tutorial-only
slides, fake scans, and a second catalog form. Ordinary Bulk Add must
remain available after first-run setup.

### Shared location and bootstrap decisions

V2 treats physical placement as one shared **location** concept
internally. Media-specific words are presentation: books use **shelf**;
the album UI may use **crate**, **bin**, or another collector-tested
term. V2 does not require a location-type hierarchy merely to support
different vocabulary. The active media area determines the user-facing
term while the underlying placement contract remains shared.

First-run TSV bootstrap is intentionally a validated import rather than
a spreadsheet-cleanup editor. The importer should document the accepted
layout, validate and preview it before commit, and report rejected rows
clearly, but V2 does not require inline correction of rejected TSV rows.
Owners are expected to correct malformed source data and re-import. This
keeps the private-library path simple while leaving a stricter,
better-documented import contract for open-source use.

### Known gap

The current API has no setup-completion state or library-initialization
resource. Add library-scoped settings/setup state rather than encoding
completion in the shared Bearer token: the hostname-derived
`Library-Username` already selects the library. Browser persistence
should include the library identity, media type, destination, stable
client item IDs, drafts, lookup results, and save outcomes; never
restore one library's intake into another. Different hostnames already
receive separate browser storage origins, but explicit namespacing
protects local-development overrides and future host migrations.

## 3. Additional physical media

**V2 commitment:** V2 adds the album catalog defined by the backend
workstream. Vinyl records, CDs, and cassettes are first-class formats
within that album catalog. Books remain first-class through the existing
book catalog.

Movies and video media---including DVDs and VHS tapes---are V3, not V2.
Comics are also provisionally V3 while their catalog grain and UPC
requirements are researched. Board games remain a possible later
addition.

First-class means each medium can be created, browsed, searched, viewed,
edited, located, included in applicable collections or wishlists, and
circulated where the domain rules allow. A non-book item must not be
represented by mislabeling book fields such as author, ISBN, pages, or
read status.

The V2 UI should preserve shared application concepts---owned physical
item identity, location, cover/artwork, circulation, bulk intake,
search, and curated grouping---while presenting medium-specific metadata
and terminology.

### Defined album workstream

Backend `FEAT-16` through `FEAT-23` define an album-catalog MVP. In that
contract, one **album** is the catalog and loanable object, while
`media_format` identifies `vinyl`, `cd`, `cassette`, `unknown`, or
`other`. Vinyl, CDs, and cassettes therefore share one album experience
with format-aware presentation; they are not three unrelated catalog
resources.

The locked model and its frontend consequences are:

-   Albums remain separate from books. They use parallel `albums` data
    and `/albums` routes rather than a polymorphic `/items` resource or
    entries returned from `GET /books`.
-   Album identity is the opaque UUID `album_id`. The same backend
    series renames book identity from `id` to `book_id`, a breaking
    frontend contract change that must ship in the coordinated release
    window.
-   Album records contain title, ordered structured artists, ordered
    string genres, label, release date, media format, optional
    barcode/Discogs/MusicBrainz identifiers, notes, rating,
    lifecycle/played state, and optional tracks.
-   Tracks are nested rows grouped by `disc_number` and `track_number`.
    Zero tracks are valid and not an incomplete-data condition.
    Create/edit replaces the full track list; there is no per-track CRUD
    in the MVP.
-   Album create requires a title and at least one `artist_id`. The
    frontend resolves textual lookup artists against the separate
    `/artists` catalog, just as book lookup authors are resolved to
    `/authors` IDs.
-   `GET /albums` has album-specific artist/title/barcode/format
    filters, deletion inclusion, pagination, and artist, title,
    release-date, and creation-date sorts. Albums are not added to book
    filters.
-   Album delete is soft delete: it moves the album to `removed`,
    removes wishlist and album-collection memberships, and retains the
    row. Restore moves it to `unknown`. This intentionally differs from
    book hard delete.
-   Albums reuse the shared shelf catalog through parallel album-shelf
    membership. A shelf cannot mix book and album membership in this
    MVP; cross-type placement returns an explicit `412`.
-   Collections also use parallel book and album membership and cannot
    mix media in one collection. The collection catalog itself has no
    `media_type` column, so the UI must make a collection's established
    type clear and prevent invalid choices.
-   Wishlists **can** mix books and albums. The mixed endpoint returns
    membership IDs plus nullable `book_id` and `album_id`; the frontend
    joins each row to the corresponding detail endpoint. Wishlist and
    shelf placement remain mutually exclusive.
-   Loans gain nullable typed `book_id` and `album_id`, exactly one per
    row. Album checkout/check-in lives on album routes, the album---not
    a track---is loaned, and loan lists can be filtered by album or
    `media_type`.
-   `is_played`, completion date, rating, and review mirror the book
    mark-read lifecycle through `/albums/{album_id}/mark-played`. Album
    rating/review here are owner data, not borrower feedback.
-   `GET /albums/lookup` accepts a barcode or explicit Discogs release
    ID, prefers configured Discogs, and uses MusicBrainz only for
    not-found or when no Discogs token is configured. It returns an
    editable, non-persisted draft.
-   Dashboard summary and breakdown responses gain parallel album keys.
    Existing book keys remain book-only. Album incomplete-metadata
    reporting is explicitly deferred, and a missing track list is not an
    error.
-   Album artwork is required for the first-class V2 experience. The
    backend album sequence needs a contract comparable to book covers:
    authenticated artwork reads, owner upload/remove, and provider
    fallback where licensing and provider terms permit. The frontend
    must not construct provider URLs itself.
-   V2 supports more than one owned physical copy of the same commercial
    book or album release. Commercial identifiers identify the
    edition/release; each owned copy retains its own UUID, location,
    status, loan history, and QR label. Existing duplicate-ISBN/import
    behavior must be revised by an authoritative backend ticket before
    frontend work.

The frontend should wait for backend `FEAT-23` contract synchronization
and use the resulting OpenAPI plus `API-for-FE.md`, rather than coding
against proposed intermediate schemas.

### Album presentation decisions

A shelf or collection does not need a separate visible media-type badge
merely because the shared catalog row lacks a `media_type` column. The
active media area and its visual identity establish whether the user is
working with books or albums, and the UI must prevent cross-type
membership choices that the backend would reject. Album artwork should
mirror the existing book-cover contract: authenticated reads, owner
upload/remove, and backend-owned provider fallback. The specific
external artwork provider remains a research item because API and
licensing terms still need approval.

### Deferred media

The album `other` format must not be used as a substitute for a movie,
video, comic, or board-game domain.

V3 planning may treat DVDs and VHS as formats of one movie/video
catalog, analogous to the album format model. The loanable grain for
multi-disc releases and box sets remains open. Comics also require
collector input before deciding whether the catalog grain is an issue,
collected edition, series, or another physical-copy model, and before
adding UPC-based lookup. Audiobook reading-history logging and
digital-media management remain outside the physical-media V2 scope.

## 4. Multi-tenant support

**V2 commitment:** The UI implements the small, hostname-selected
multi-library model defined in backend `PLAN-02`. This is not a general
SaaS tenant/account system.

Locked behavior:

-   The initial allowlist is `andy` and `jamie`. Adding a library is an
    operator/configuration change across frontend, backend, DNS, and
    Caddy---not runtime registration.
-   `andy.library.spir.es` and `jamie.library.spir.es` serve the same
    static SPA and API process but route to separate `andy.db` and
    `jamie.db` SQLite files. Libraries cannot browse or join each
    other's data.
-   The frontend derives the library username from the hostname's
    leftmost label. The same rule supports `andy.localhost:5173` and
    `jamie.localhost:5173` for local development.
-   Every protected request sends the shared Bearer token plus
    `Library-Username: <hostname label>`. Public health and version
    requests omit the library header. Missing, unknown, or disallowed
    usernames return `400`; the client must not fall back to another
    library.
-   The shared token remains. There are no login/logout flows,
    per-person credentials, runtime roles, tenant discovery, or library
    switcher. Opening the other hostname is the only switch.
-   The hostname also selects a hardcoded owner theme/token entry for
    Andy or Jamie. The precise theme assets remain frontend design work.
-   Vite must accept the two `*.localhost` development hosts, and
    frontend documentation must use those URLs for local testing.
-   The existing removal of the browser backup-download page remains
    valid. V2 disaster recovery is a separate, safety-critical workflow
    entered from Manage Collection and backed by a constrained
    server-side backup inventory.
-   Unknown/unclaimed hostnames show a deliberate themed landing
    page---using copy such as "No one owns this library yet"---rather
    than leaking raw API `400` responses.
-   Every library receives the same enabled media types and product
    capabilities. Library-owned backend settings are limited to choices
    that must follow the library across devices, including setup state
    and Enable Loans. Scanner preferences and label-print defaults are
    browser/device preferences in V2 unless a later ticket demonstrates
    a cross-device requirement. Media identity is the one approved
    identity for the active media area rather than a user-selectable
    persisted skin; quote mappings remain checked-in frontend content.
-   The existing seeded Shade catalog belongs to Andy's library. A newly
    added library normally receives schema and required system locations
    only, then chooses TSV bootstrap or guided Build Mode.
-   Andy requires operator/admin support access to other hosted
    libraries, but ordinary navigation exposes no library switcher. The
    authorization mechanism for destructive admin actions remains
    separate from hostname routing.

### Contract status

The current frontend already defines the `Library-Username` header but
hardcodes the value `shade`; the current backend allows the header
through CORS but ignores it. The frontend ticket begins only when the
backend accepts `andy` and `jamie` and requires the header. `PLAN-02`
still has open operational/backend decisions, but its frontend shape
above is authoritative except for unknown-host UX, owner-switch policy,
and final theme assets.

## 5. Media-specific visual identities

**V2 commitment:** Moving between media types should feel like entering
a different part of the collection while still feeling like one
application.

Each medium should define a visual identity package that can affect
decorative assets, background and card treatments, typographic roles,
textures, materials, accents, and appropriate interface metaphors. It
should not be limited to a palette swap. Shared administrative workflows
should retain clarity and information density even when the surrounding
identity changes.

Identity must not change information architecture, hide required state,
rely on color alone, or compromise keyboard, mobile, reduced-motion,
contrast, and text-resizing behavior. Media identity should be a
presentation concern layered over the medium's domain behavior, not a
forked copy of the application.

The current app has one global token and stylesheet system plus
book/library-specific raster assets. There is no media context or
runtime theme provider. The owner defines and approves the V2 art
direction with feedback from intended users/collectors so each supported
area fits the audience without becoming a separate application.

Administrative surfaces keep the same functional names, controls, and
information architecture across media. Visual identity supplies the
contextual cue that the user is in a different media area; terminology
changes only where the physical-location noun genuinely differs (for
example, shelf versus crate/bin).

For planning, use a **budget rather than a single hard image-size
rule**. A reasonable V2 target is: keep route-specific decorative assets
to roughly **500 KiB compressed on initial view**, keep any single
decorative raster asset normally below **250 KiB**, lazy-load
noncritical imagery, prefer SVG/CSS for ornaments and textures where
practical, and avoid adding a media identity package that materially
pushes the initial application JavaScript bundle upward. Treat these as
design guardrails, not release-blocking constants: measure the actual
mobile page, and tighten or relax an individual asset only when visual
quality and loading behavior justify it. A design brief and concrete
asset inventory are required for each medium before implementation
tickets can be estimated.

## 6. Curated skins deferred

Multiple selectable skins per media type and a free-form theme editor
are deferred to V3 or later. V2 supplies one approved visual identity
for each supported area and the hostname/library-specific identity
required by the multi-library work. It should not build a general skin
selector or persistence model prematurely.

Lightweight **seasonal/theme-aware presentation is committed V2 design
direction**. Spring, summer, autumn, and winter may influence bounded
background/accent treatments, typography accents, and small decorative
elements while leaving information architecture and functionality
stable. This is atmospheric presentation, not a user-selectable skin
system. Deep time-of-day behavior, weather-reactive environments, and
other living-environment simulation remain V3.

## 7. Media-aware Bulk Add

**V2 commitment:** Every supported medium uses a common bulk-intake
interaction model with medium-specific capture, lookup, validation,
editing, duplicate handling, and persistence.

`BULK_ADD_UX.md` already defines the generic boundary:

> Choose destination/context → capture identifier or manual entry →
> lookup → populate queue item → validate → classify → optionally edit →
> persist valid rows → resolve exceptions.

Books remain the reference implementation, but ISBN, author, and shelf
cannot become assumptions of the generic intake engine. Each medium
configuration should supply:

-   identifier types and parsers, including whether camera or hardware
    scanning is useful;
-   manual-entry behavior for items without a commercial identifier;
-   lookup provider and provider-specific failure presentation;
-   required and optional fields;
-   queue columns and inline editor;
-   validation and review rules;
-   catalog-match and duplicate-resolution rules;
-   destination terminology and eligible location types; and
-   import transport and cache invalidation behavior.

For albums, **title and at least one artist** are the minimum
import-blocking metadata, matching the backend create contract. Other
absent lookup metadata may produce Needs Review when useful but does not
by itself prevent an owner from importing an album whose title and
artist are known.

Destination selection remains the first step of the existing Build Mode
contract. The generic intake engine asks for a shared location resource,
while the active media configuration supplies the user-facing noun and
eligible destinations. That means the book workflow can continue to say
**shelf** without changing its established interaction; album intake can
say **crate/bin** once collector terminology is settled. This is a
presentation/configuration generalization, not a new book intake
sequence.

First-run guided setup uses this framework. The current book endpoints
cannot import another medium, so implementation must wait for the media
contracts.

## 8. Physical-item UUID QR labels

**V2 commitment:** Generate printable QR labels that encode the stable
identity of one owned physical item, and let scanner-driven item
workflows resolve those labels.

Required user-facing behavior:

-   Generate a label for one item from its existing stable item UUID.
-   Generate labels in a batch from explicitly selected items.
-   Preview and print labels from the browser. V2 is
    phone-scanning-first and does not require dedicated 2D scanner
    acceptance coverage or human-readable fallback text on the label.
    Dedicated scanners may be supported later after hardware is
    selected.
-   Reprint the same item's label without creating or rotating its
    identity.
-   Use a versioned, recognizable application payload rather than
    displaying a raw UUID as an untyped scan.
-   Reject malformed or unsupported Shade payloads safely.
-   Resolve a valid Shade QR to exactly one physical item, including a
    particular copy when multiple owned copies share a commercial
    identifier.

Checkout and check-in scanning should accept both an applicable
commercial identifier and a Shade item QR. Commercial identifiers may
produce zero, one, or multiple catalog candidates because they identify
products or editions; an item QR should resolve one owned copy.

### Current-state constraint

Book `id` values are UUID strings and are already the stable identity
used by detail and lifecycle paths. However, the current scanners parse
ISBNs only, collection scan behavior either opens a unique ISBN match or
filters Browse, and there is no unified checkout/check-in scanner
surface. No QR payload format, item-resolution endpoint across media,
label-generation API, or print template is defined.

QR generation and print layout are frontend responsibilities. The
canonical payload is a compact versioned Shade value containing media
type and catalog UUID, conceptually `shade:v1:<media-type>:<uuid>`. It
contains no tenant name or public URL and therefore survives
hostname/domain changes. The stable catalog UUID is the label identity;
V2 adds no separate revocable public label ID or print-history model.
Labels are generated on request and reprinting produces the same
payload. Scanning is authenticated application behavior; V2 defines no
unauthenticated public landing page for item labels.

The initial physical target is approximately **3 × 3 inches** per label.
The exact browser-print sheet dimensions, margins, and pagination remain
to be chosen after a print prototype; generated PDF output is not
required.

Label generation is part of the normal item-add path so a newly added
owned item can immediately receive its QR. Manage Collection also
provides **Generate All** for retrofitting an existing catalog and a
bulk-select generation/reprint path for replacements. Reprinting never
rotates the item identity.

Decorative QR output must remain a standards-compliant QR rather than an
image that only resembles one. The preferred V2 experiment is a
high-error-correction QR with restrained styling and an optional
centered portrait/cameo treatment, while preserving quiet zone,
contrast, and finder-pattern readability. **QuickChart** is the first
service to prototype, **QRCode Monkey** is a secondary hosted
comparison, and **`qr-code-styling`** is the leading
self-hosted/code-first candidate. Every decorative render must
successfully decode and pass real supported-phone tests at intended
print size; a conventional QR render is always available and should be
used automatically when decorative validation fails.

Scanner-first circulation follows item state rather than treating every
successful scan as permission to act. An exact Shade QR resolves one
owned copy and opens the appropriate checkout/check-in action. A
commercial barcode that maps to multiple owned copies first asks the
owner to choose the physical copy. Reserved or Reading items show the
already defined override warning before checkout; Missing and Display
Only items remain ineligible; an item already on loan offers check-in
rather than another checkout. When **Enable Loans** is off for the
active library, scanning may still resolve/open the item but must not
expose circulation actions. Unknown or cross-library Shade labels use
the generic not-found result. A well-formed label that resolves to a
known but ineligible item should show that item's identity and the
specific reason the action is unavailable rather than pretending the QR
was not found.

## 9. Manual book availability and TBR-driven status

**V2 commitment:** An owner can deliberately change a book's
availability state without checking it in or out, and selected personal
TBR shelves can apply an availability state automatically when a book is
moved there.

### Existing contract and current limitation

The backend already defines these book statuses:

-   `unknown`
-   `available`
-   `on_loan`
-   `missing`
-   `display_only`
-   `reserved`
-   `reading`

`BookUpdate` currently accepts `status`, but the frontend's ordinary
book-edit flow intentionally omits it along with other lifecycle fields.
Checkout is offered only for `available` books. Checkout and check-in
own the `on_loan` to `available` lifecycle, while shelf moves currently
change only `shelf_name`.

### Manual status control

Book Details and Browse bulk actions should expose a clear owner/admin
action for changing availability. The owner can mark a book `available`,
`reserved`, `reading`, `missing`, or `display_only` without editing
unrelated bibliographic metadata. `unknown` is not a separate
user-facing choice; the product treats a manually unlocatable item as
Missing.

`on_loan` is not a manual choice. It is created by checkout and cleared
by check-in so loan history and book state cannot diverge. A manual
action must not make a book available, reserved, reading, or missing
while an active loan exists; the owner must check the item in first.
Stale-state failures should preserve the intended choice, refresh the
book and loan state, and explain what changed.

The UI should explain the practical meaning of each state:

-   **Available:** eligible for ordinary checkout.
-   **Reserved:** intentionally held for someone; checkout warns but can
    be overridden.
-   **Reading:** currently in personal use; checkout warns but can be
    overridden.
-   **Missing:** not presently locatable and moved to the `unknown`
    system shelf.
-   **Display only:** part of the collection but never ordinarily
    loaned.

Changing availability does not change `is_read`, reading completion,
rating, or review. In particular, `reading` means the physical copy is
in current use; it does not mark the book read.

### TBR shelf automation

Moving a book to `Liz TBR` or `Andy TBR` sets it to `reserved` as part
of the same successful operation. Moving it out of either TBR shelf
returns it to `available`. Starting the book is a separate manual action
that sets `reading`. The status and shelf move must not visibly disagree
because one update succeeded and the other failed.

The initial product intent is household-scale rather than a general
reservation queue: Andy or Liz can hold a book so another borrower is
not offered it. A later version may add an ordered reservation list for
several people who want the same title back to back.

The TBR shelf name is sufficient attribution for Andy or Liz in V2; no
`reserved_for` field is required for those shelves. Manually setting
`reserved` elsewhere displays the status stamp without changing location
or naming a person.

Status precedence is explicit:

-   Setting `missing` moves the book to `unknown` regardless of a prior
    TBR location.
-   Setting `display_only` overrides TBR reservation behavior and blocks
    checkout. It does not otherwise move the book.
-   Setting `reading` leaves location unchanged and overrides the
    reserved display while the book remains on a TBR shelf.
-   Reserved and reading checkout attempts show a confirmation warning
    and may proceed without first changing status. Successful checkout
    then uses the normal `on_loan` lifecycle.
-   Display-only and missing books remain ineligible for checkout.

Single-book TBR movement is the normal interaction, but a bulk move to a
TBR shelf applies `reserved` to every successfully moved eligible book
in the same atomic operation.

### General Reserved shelf / will-call concept

A separate shelf named `Reserved` may act as a small virtual will-call
box for holds that are not for Andy or Liz. Books there can show an
editable post-it-style note on Book Details containing the name or short
pickup note. The note must be structured as reservation metadata rather
than inferred from general book notes if it needs separate display,
clearing, or privacy behavior. This general Reserved/will-call shelf is
committed to V2. It is distinct from the personal TBR shelves and
represents a physical holding location for a borrower. It receives a
visually distinct frontend treatment and stores a structured pickup name
plus optional note rather than relying on general book notes. Structured
pickup name/note metadata clears automatically when the item is
successfully checked out or leaves the general Reserved shelf. Either
event ends the will-call state. V2 remains a lightweight owner-managed
hold rather than a reservation queue.

## 10. Quote-coordinated Home presentation

**V2 commitment:** The randomly selected Home quote supplies a curated
verbal theme for the major section headings on that page load. The quote
is not an isolated rotating text block.

### Existing quote work to preserve

Home currently chooses one random entry per page mount from the frontend
`homeQuotes` pool and lets the user expand its context. That per-load
random behavior remains the basis for this feature. Reloading or
remounting Home may select a different quote and therefore a different
heading set.

`PRODUCT_REQS.V2.pass-2.md` and `PRODUCT_REQS.V2.quote-bucket.md`
separately describe a possible future weather-aware quote system:

-   quotes become structured records rather than only hardcoded frontend
    text;
-   records may carry author, source/book attribution, chapter/source
    information, condition tags, weight, and last-displayed information;
-   selection matches current conditions, avoids recent repetition, and
    uses weighting to keep a prolonged weather pattern varied; and
-   weather-aware quote selection remains separate from weather-based
    book recommendations.

The weather-aware system is not required to implement quote-themed
headings. If weather selection is later adopted, the selected quote can
use the same curated heading metadata. Weather-based quote selection
remains separate from weather-based book recommendations.

The larger quote corpus is explicitly a candidate corpus requiring a
second source-verification pass, not final production data.

### Curated heading pairs

Each production quote should carry or map to an explicitly authored
display phrase for each participating Home section. The initial sections
are:

-   **New Additions**
-   **Browse the Stacks** / categories
-   **Staff Picks**

For Kafka's "axe for the frozen sea" quote, for example, the New
Additions display phrase might be **Newest Axes** and the category
section might use **Crack the Frozen Sea**. These examples communicate
the desired metaphor but are not approved final copy.

Every participating section displays a two-level heading treatment:

1.  The quote-specific phrase appears first as the prominent, expressive
    heading.
2.  The stable functional heading appears immediately beneath it in a
    smaller, consistent type treatment---for example, **New Additions**,
    **Browse the Stacks**, or **Staff Picks**.

The stable label must remain visible text, not only screen-reader text,
a tooltip, or an `aria-label`. It keeps the page understandable when the
metaphorical phrase is playful or indirect. The quote-specific phrase
may change on reload; the functional label, section purpose, links, and
content do not.

The mapping is curated per quote rather than generated from quote text
at runtime. Quote text must never be interpreted as markup, CSS,
executable content, or an asset path. A quote without a complete
approved mapping falls back to the ordinary functional headings instead
of displaying missing, generic, or machine-invented copy.

The owner writes or approves every production phrase set, potentially in
collaboration with the implementation team. The target is a complete
mapping for every quote in the random pool, with the ordinary headings
as a safe fallback. An optional curated presentation key may also select
a bounded decorative accent---such as an illustration, texture, or
heading ornament---that reinforces the quote. It must not alter
navigation, content order, or the active media identity, and it remains
separate from deferred skins, seasonal themes, and time-of-day behavior.

The heading pair must form one understandable section label for
assistive technology without causing confusing duplicate heading
navigation. The existing participating Home modules receive this
treatment, and the V2 **Current Reading** module should receive the same
curated quote-specific heading treatment when it is added. Any later
Home module promoted into this presentation inherits the same rule.
Quote mappings may affect **section-header treatment only**; they do not
select page backgrounds, card skins, layout changes, or other decorative
assets. Exact semantic markup should be settled in the frontend ticket.

## 11. Borrower signature capture

**V2 status:** Committed, with a bounded prototype feasibility gate.
Signature capture and rendering are one feature and should not be split
into independently shippable promises. It moves to V3 only if a small
prototype demonstrates a concrete blocker such as unreliable canvas
export on supported phones, inability to guarantee signature retention
with successful checkout, or disproportionate tenant-safe private-file
storage constraints. Ordinary endpoint work or minor browser polish is
not sufficient reason to defer it.

Intended experience:

1.  The owner begins checkout on a phone-friendly surface and always
    records the borrower's typed full name.
2.  The device may be handed to the borrower, who signs in a
    touch-capable signature area.
3.  The borrower can clear and retry, Confirm the signature, or Skip and
    use the typed name only.
4.  Signature and loan creation complete as one user-visible operation:
    a signature failure must not silently leave an apparently unsigned
    successful checkout. The backend may stage the file before
    committing the loan to achieve safe compensation and cleanup.
5.  The confirmed signature is saved to that loan, not to the reusable
    book/item or borrower profile.
6.  Book Details renders its loan-history cards beneath the main book
    record, evoking the card at the back of a library book. Each card
    includes the typed borrower name and, when present, the signature at
    the bottom.

The signature is a library artifact and acknowledgement, not a claim of
legal enforceability. The UI must not imply otherwise.

The existing Loans page remains the typed circulation/history overview;
V2 does not require a separate loan-detail route. The richer per-book
card treatment lives on Book Details.

For the desired balance of visual fidelity, storage cost, and safe
rendering, the recommended V2 representation is a small transparent PNG
generated from a bounded signature canvas and stored as `{loan_id}.png`
in a gitignored runtime directory parallel to covers. Unlike arbitrary
SVG, PNG cannot contain active markup. The backend should validate
dimensions and content and expose authenticated reads rather than public
filesystem paths.

The backend direction is now defined: stage an optional validated
transparent PNG (maximum 800×300, 250 KiB) through a short-lived
authenticated upload token, then submit that single-use token with
checkout. Checkout and signature commit behave as one compensated
operation; unclaimed staged files expire. `LoanRead` exposes signature
presence only, while authenticated bytes are fetched from
`GET /loans/{loan_id}/signature`. Confirmed signatures are immutable,
tenant-scoped, deleted with the loan, and the loan retains the
acknowledgement text/version shown at signing.

## 12. Borrower ratings and reviews

**V2 commitment:** Every completed return records a borrower rating, and
may later receive one optional written review, without altering the
owner's rating, review, or read state.

Check-in on the owner's device requires a rating; the written review is
optional. The required V2 interaction is local: check-in on the owner's
authenticated device requires a 1--5 rating, while an optional written
review is submitted through a follow-up feedback endpoint so feedback
failure cannot roll back or repeat check-in. Email review requests,
signed public review links, SMTP/provider work, and borrower
authentication are outside the minimum V2 contract and may be considered
later.

Required separation:

-   Owner `rating`, `review`, and read status remain owner collection
    data.
-   Borrower feedback never marks the owner as having read an item.
-   A feedback record is attributable internally to exactly one returned
    loan. There is at most one rating/review record per loan.
-   Aggregates count only feedback included by agreed moderation/privacy
    rules and distinguish no ratings from a zero rating.
-   The loan card shows the rating beside the signature/typed borrower
    record. When a written review exists, it may be revealed from that
    card through an accessible disclosure; hover alone is insufficient
    on touch and keyboard devices.
-   Loan records show the full typed borrower name. Review presentation
    may use the borrower's first name or initials.
-   Editing or removing borrower feedback recomputes the aggregate
    without rewriting the loan event itself.
-   Moderation, approval, abuse reporting, and borrower profiles are out
    of scope for this trusted private-library model.

"Highest rated by borrowers," "Most borrowed," and "Borrower favorites"
are discovery extensions, not part of the minimum feedback feature
unless separately promoted.

Written borrower reviews display **initials** in the review
presentation, preserving the artifact-like character of the loan card.
The underlying loan record continues to show the typed full borrower
name.

Borrower aggregates combine physical copies of the same work/title
within one media type. They never combine books with albums or other
media. For books, borrower aggregates are explicitly work/title-level
across editions and physical copies: a rating on one edition must appear
in the aggregate shown for another owned edition of the same work,
including display-only copies. Edition-specific ISBNs therefore cannot
define the group.

The backend should own a first-class internal **Work** identity with its
own stable UUID. Books/copies are assigned to a Work; borrower feedback
aggregates by that internal Work ID. External provider work
identifiers---initially Open Library Work IDs where available and
trustworthy---are evidence/mappings, not Shade's primary identity.
Bibliographic matching may provide a fallback suggestion, but normalized
title text alone is never authoritative. Manual owner correction is
authoritative.

The owner correction UI should make the technical merge/split concept
concrete rather than exposing database language: from Manage Collection
or the relevant item details, the owner can choose **Group as Same
Work** when two editions were incorrectly separated, or **Separate from
Work** when an edition/copy was incorrectly grouped. The UI previews
which owned editions/copies will share the borrower aggregate before
confirmation. The backend preserves enough assignment history to reverse
an erroneous correction. Albums follow the same work-level principle
within their media type.

The next backend ticket should finalize same-work boundaries for
translations, abridgements, adaptations, and substantially revised
editions, plus the exact audit/reversal behavior for manual regrouping.

The current app has only a free-text borrower name on each loan. Owner
rating/review live on `BookRead`; check-in accepts only an optional
return timestamp; and no borrower-feedback, work-identity, or aggregate
resource exists.

## 13. Patron donation participation / punch card

**Status:** Not part of V2 software scope and must not receive
implementation tickets.

The preferred concept rewards qualifying donations to the library rather
than repeated borrowing. A patron receives a credit for a qualifying
donation and, after a configurable threshold (currently proposed as
ten), earns a small participatory privilege. The leading reward is the
ability to designate a Staff Pick, making the reward part of the
collection's character instead of a monetary or physical prize.

A lightweight implementation should show the patron's progress, record
why and when each credit was granted, prevent accidental duplicate
credit, let the owner correct mistakes, show when a reward is earned and
redeemed, and preserve an audit trail appropriate to this informal
system. It should not process money or require the owner to purchase
rewards.

Staff Picks currently exist as a named Collection. A reward could
therefore grant an owner-mediated nomination or a limited membership
action, but the exact authority must be chosen; the current application
has no patron accounts or permissions.

This remains an offline/non-software participation idea. No patron,
donation, punch, reward, or redemption model should be added to the
frontend or API for V2.

## 14. Cross-cutting behavior to resolve

### Unified search and scanning

Text search remains scoped to the current media area; V2 does not add
mixed-media global search. Exact item QR payloads should be resolvable
without guessing a commercial edition. Ambiguous commercial identifiers
need an explicit disambiguation experience.

### Generalized circulation

Circulation should be evaluated as an owned-physical-item capability
rather than a book-only feature. Eligibility, loan history, borrower
feedback, signature capture, and scan-to-checkout/check-in behavior
should use shared lifecycle concepts unless a medium has a documented
exception.

### Dashboard and Home

Home is library-wide and serves as the entry hall to the supported media
areas. Recent Additions intentionally mixes media. Staff Picks remains a
book collection; albums receive their own equivalent curated
collection/presentation. Collections never mix media types.

Dashboard is media-specific in V2 and uses explicitly scoped
keys/counts. Home remains library-wide, including mixed-media Recent
Additions. Counts and labels must always make their scope visible.

### Media switching

Media selection is an explicit physical-feeling control, visually
conceived as moving through a doorway or hallway into another room. It
must remain keyboard-accessible, mobile-appropriate, URL/deep-link
compatible, and predictable when a medium is unavailable.

Circulation is configurable per library through Manage Collection with
an **Enable loans** setting. Disabled circulation hides or disables
checkout/check-in entry points without deleting loan history.

### Human-readable deep links

**V2 commitment:** Links intended for people to type, recognize, or share
use readable keys wherever the resource has an unambiguous human name.
The Books URL uses parameters such as `?category=thriller` rather than
exposing a category UUID. The same rule applies to shelves, collections,
wishlists, media areas, and comparable named resources.

UUIDs remain the internal identity and API transport key. Resources whose
names can change or collide need a backend-owned unique slug; changing a
display name must not silently break existing links, and old slugs should
redirect to the current canonical URL. Physical copies and other unnamed
entities may use a stable short public identifier or UUID when no honest,
unique readable key exists. The frontend must resolve readable URL values
through the backend contract rather than guessing UUIDs from labels.

### Reshelving queue

**V2 commitment:** An owner can mark a book as needing attention when they
notice it is filed under the wrong shelf, category, or other placement
metadata. The action is available from Book Details and records a small
reason/note without immediately changing catalog data. Dashboard provides
a pinned **Needs Reshelving** queue linking back to each book, and the flag
can be cleared after the physical and catalog placement are corrected.
This is an owner workflow, not another circulation status or a hard-coded
shelf.

### Optional book contributors

**V2 commitment:** Book create/edit supports optional editors,
illustrators, and translators in addition to required authors. Existing
values can be added, changed, or removed later. Book Details renders only
contributor roles that contain at least one value; it never displays empty
labels or `null` metadata rows. The backend contract should model the role
explicitly and preserve contributor order rather than folding these names
into author text.

### Camera capture presentation

The existing native camera ISBN capture remains the functional base. V2
brings its chrome into the product's visual system: the area surrounding
the viewfinder uses the header's wood-brown treatment, controls use shared
Shade button styles, and focus, permission, error, reduced-motion, and
small-screen states remain accessible. Decoration must not reduce the
visible scan area or make browser permission guidance harder to follow.

## 15. Persistent Books controls and infinite-scroll navigation

**V2 commitment:** Books filtering and sorting remain usable while the
user moves through a long result set, and every automatic
infinite-scroll surface provides a consistent way to return to the top.

### Books filter and sort rail

The main Books list currently places `BooksListControls` above the
results. Because results load continuously, changing a filter or sort
after browsing deeply requires a long return to the top.

On layouts wide enough to support it, the complete filter/sort control
group should move into a persistent side rail beside the book results.
The rail should:

-   remain available as the document scrolls, normally through a sticky
    treatment within the page layout;
-   expose the same URL-backed search, category, read-state, placement,
    and sort behavior rather than creating a second filter model;
-   show active selections and retain the existing clear/reset behavior;
-   allow individual filter groups to collapse while keeping
    active-filter counts visible;
-   remain usable when its controls are taller than the viewport, with
    an intentional internal or page-scrolling strategy that does not
    make lower controls unreachable;
-   preserve space for book cards and bulk-selection controls without
    covering results; and
-   keep filter application, loading, empty, error, cleanup, ISBN
    deep-link, and bulk-selection states understandable.

The rail is a responsive enhancement, not a requirement to squeeze a
sidebar beside a 320-pixel viewport. On narrow screens, the same
controls open in a modal treatment while preserving active-filter
summary and URL state. The exact wide-screen side, breakpoint, overflow
behavior, and immediate-versus-explicit mobile application remain design
decisions informed by further Discogs reference review.

The wide Books rail should visually mirror the successful current mobile
filter modal: reuse its grouping, labels, control styling, active-state
treatment, and clear/reset affordances. Desktop changes the spatial
arrangement, not the filter interaction language. The rail is left-aligned;
the remaining breakpoint, overflow, and mobile Apply behavior stay open
until the responsive prototype is reviewed.

Bulk-selection actions join the side rail while selection mode is
active. This requirement applies to the main Books catalog and its
cleanup mode. Shelves search and other Shelves list controls also move
to a persistent side rail on wide layouts with the same responsive
principles. The later album catalog should adopt the pattern if its list
uses continuous scrolling, while keeping album-specific fields.

### Shared Back to Top control

Any page that automatically appends content as the user approaches the
end must provide a visible **Back to Top** control after the user has
moved meaningfully away from the top. Current applicable surfaces are:

-   Books, including incomplete-metadata cleanup results;
-   Loans;
-   collection membership lists;
-   wishlist membership lists; and
-   the progressively revealed Shelves list.

Future infinite lists, including albums if implemented that way, inherit
the requirement. A short page that has not loaded an additional batch
should not display a needless floating control. Long Shelves and
explicit "Load more" surfaces inherit it even when they are not backed
by server-side infinite queries.

The control appears after the first additional page or progressive batch
loads. It returns to the beginning of the result list and moves focus to
that list's search/filter entry point.

The control should use one shared component and behavior, remain
reachable by keyboard and touch, have an explicit accessible name,
respect safe areas and other sticky controls, and never obscure
important content. Returning to the top may animate only when reduced
motion is not requested.

## 16. Restore from backup / disaster recovery

**V2 commitment:** A verified backup can be used to recover a damaged or
unusable library. Producing backup files without a documented, tested
restoration path is not sufficient disaster recovery.

### Current state and boundary

The backend currently produces an authenticated `application/sql` dump
through `GET /backup`, and the operator-side scheduled job retains
changed dumps. The frontend deliberately has no backup-download page.
There is currently no supported restore command, restore endpoint,
recovery runbook, or automated restore verification.

Under the planned multi-library model, each backup and restore target is
one named library database, such as `andy.db` or `jamie.db`. A restore
must never infer the target from dump contents, restore one person's
data into another person's library, or silently affect every library on
the instance.

Manage Collection provides the user-facing **Restore from Backup** entry
point. Browser code cannot open or browse an arbitrary directory on the
server. The backend must instead return a constrained inventory of
recognized backup files for the current library, including safe display
metadata, and accept only an opaque server-issued backup identifier. It
must never accept a client-supplied filesystem path.

### Required recovery behavior

The supported workflow must:

1.  Require an explicit source backup and explicit target library. One
    operation restores one library only.
2.  Validate that the artifact is an expected Shade SQL backup, is
    readable, and is compatible with a supported schema or migration
    path before touching the live database.
3.  Prevent writes to the target library while its database is being
    replaced.
4.  Create a separate pre-restore safety copy of the current target
    database whenever it is readable enough to do so.
5.  Restore into a temporary database, apply the supported migrations,
    and run SQLite integrity and application-level checks before
    activation.
6.  Activate the restored database atomically so the API never serves a
    partially replayed database.
7.  Preserve the pre-restore database until the restored library has
    passed post-activation smoke checks.
8.  Roll back to the pre-restore copy if activation or verification
    fails.
9.  Report which library, backup, schema/application version, and
    verification result were involved without logging or exposing
    catalog contents.
10. Include a maintained operator runbook and a repeatable recovery test
    using non-production fixtures.

Restoration is destructive to the target library's current state and
must require deliberate confirmation. It must not be triggered by an
ordinary page load, first-run empty-state detection, or an untrusted
filename. A TSV bootstrap is an initial import path, not a substitute
for restoring a complete operational backup.

### Completeness gap

V2 restore addresses database corruption. Existing sibling asset
directories for covers, album artwork, and signatures remain in place
and UUID-based references reconnect after database restoration. This
does **not** recover assets after disk loss or corruption of those
directories; the UI and runbook must describe the boundary accurately.

Each SQL backup should have a small machine-readable manifest containing
its originating library username, creation time, schema/application
version, checksum, and format version. The manifest is not another copy
of the catalog; it lets the server reject a damaged file, a backup from
the wrong library, or an unsupported version. A filename such as
`andy.db` or `andy-backup.sql` is helpful to humans but is not
sufficient validation by itself.

V2 guarantees restoration only when the backup schema matches the
running database schema. Older or newer schemas are rejected with an
explanation rather than migrated implicitly during an emergency restore.
Restoration may take the target library offline for as long as
necessary; other libraries should remain available when the backend
architecture can isolate maintenance safely.

Minimum verification before activation is: checksum match, successful
SQL replay into a temporary database, `PRAGMA integrity_check`, expected
migration/schema version and core tables, foreign-key validation, and
read-only API smoke queries for the restored library. Row-count
summaries and missing referenced assets should be warnings presented for
owner confirmation, not logs of catalog contents. A quarterly
non-production restore drill---and another drill after any backup-format
or restore-path change---is the V2 operating baseline.

Restore authorization is defined as a short-lived, tenant-bound recovery
token generated through an operator command, in addition to ordinary
authentication and explicit typed confirmation. Manage Collection lists
only recognized backups for the active tenant; cross-library
support/destructive restores use the separate operator capability and
are never ordinary tenant navigation. Pre-restore safety copies enter
the normal backup retention policy after post-restore verification: all
distinct backups for seven days, one per week for eight weeks, and one
per month for twelve months. The exact free-space preflight threshold
remains an operations/ticket-level decision.

## 17. Discovery, analytics, and library personality

V2 should turn the data the library already owns into a richer, more
personal interface without trying to simulate a fully physical library.
The guiding principle for this part of the release is:

> **V2 is the library's digital catalog made beautiful.**

V2 should feel like a library through typography, paper/card metaphors,
shelf labels, book-spine imagery, subtle textures, plants, desk
elements, catalog-card styling, library signage, restrained
shadows/depth, and bounded seasonal accents. The interface should be
**inspired by physical libraries rather than pretending to literally be
one**. Decorative elements support atmosphere and identity; they must
not become required navigation.

### 17.1 Dashboard expansion

**V2 commitment:** Deepen the existing Dashboard summary with useful
collection and reading analytics built primarily from data already owned
by the application.

The intended additions are:

-   **Pages owned.**
-   **Pages turned** --- the preferred user-facing phrase for pages
    read.
-   Books acquired this year.
-   Books read this year.
-   Books read over time.
-   Pages turned over time.
-   Books read by shelf.
-   Books read by category.

Visualization should remain readable first. Book/library
metaphors---spines, stacks, shelf-like treatments, cover imagery---are
welcome when they improve the experience, but conventional charts are
preferable whenever the metaphor makes the data harder to understand.
Dashboard is naturally analytics-heavy on desktop, but its essential
information must remain deliberately usable on mobile.

Shelf-capacity measurement is **not** a V2 commitment. V2 should not
invent physical-capacity data merely to support a visualization.

### 17.2 New Releases

**V2 commitment:** Add **New Releases** using publication dates already
stored on owned books.

For V2, New Releases means recently published books that are already in
the collection. It does not require external release feeds,
internet-based release tracking, or a new provider. The presentation may
live on Home, a Discover-oriented surface, or both only when doing so
does not create redundant or overcrowded presentation.

External new-release aggregation is later work.

### 17.3 Current Reading on Home

**V2 commitment:** Home includes a **Current Reading** module showing
books the household is actively reading.

The module should use the application's existing reading/status data
rather than create a separate reading-history model merely for
presentation. It joins the curated Home experience without turning Home
into a dashboard or an exhaustive feature index.

Home density must remain comfortable on mobile. New Releases, Current
Reading, the existing New Additions/Staff Picks/category discovery, and
quote treatment should be composed deliberately rather than stacked
without a responsive density plan.

That responsive density plan must also keep complete book titles usable
when card text columns are narrow, including long unbroken words and
very long titles. Prefer resilient card geometry and natural wrapping
over per-title font scaling or automatic/marquee motion. Any approved
visible truncation must retain an equally available way to read the full
title without depending on hover, and layouts must remain usable at a
320-pixel viewport and with text enlarged to 200 percent.

### 17.4 Surprise Me / serendipity

**V2 status:** Stretch feature. It does not block V2 completion.

If included, Surprise Me should be a lightweight discovery action built
primarily from existing collection/filter data. Useful modes include:

-   Random book.
-   Random unread book.
-   Random read book.
-   Random book from a shelf.
-   Random book from a category.

The result should resolve to an owned book and lead naturally to its
details. A literal animation of pulling a book from a physical shelf
belongs with the later spatial-library vision.

### 17.5 Seasonal and decorative personality

Light seasonal/theme-aware personality is part of the V2 visual
direction. Potential seasonal treatments include spring, summer, autumn,
and winter through bounded background/accent changes, typography
accents, small illustrations, and decorative effects.

V2 may also strengthen the sense of place with non-interactive motifs
such as plants, a desk, lamp, window, clock, paper, catalog cards, book
spines, shelf labels, library signage, and subtle architectural framing.
These additions should reuse the established visual-identity system
where practical, respect the existing asset/performance guardrails, and
never become required navigation.

Weather-driven recommendations, weather-aware quote selection, deep
time-of-day behavior, reactive lighting/weather, and a fully living
environment are V3 rather than V2 requirements.

### 17.6 Empty-state personality

Existing functional empty states may receive concise library-specific
language where it improves the experience without obscuring the next
action. Examples of the intended voice include:

-   No books found → **We searched the stacks. Nothing turned up.**
-   No checked-out books → **Everything is home.**
-   Empty shelf → **Even libraries need empty spaces.**

This is polish rather than a standalone feature family and should remain
consistent with the application's institutional/private-library voice.

### 17.7 Data-first principle

For this discovery/analytics layer, V2 should prefer features that can
be produced from data already owned by Shade Library:

  V2 feature               Existing / primary data
  ------------------------ --------------------------------------------------
  New Releases             Publication date
  Current Reading          Reading / availability status
  Pages turned             Page count + reading history
  Dashboard trends         Existing acquisition / reading / completion data
  Surprise Me              Existing collection and filter data
  Seasonal personality     UI-only
  Decorative environment   UI-only

A proposed feature that requires substantial new historical, weather, or
environmental infrastructure should be evaluated against V3 rather than
automatically expanding V2.

### 17.8 Responsive design principle

Every new V2 surface is designed for desktop and mobile intentionally.
Mobile is a first-class layout, not a compressed desktop layout.

In particular:

-   Home remains curated and compact.
-   Complex controls may move to drawers/modals where appropriate.
-   Dashboard analytics remain understandable on narrow screens.
-   Cards/lists are preferred over desktop-style tables when they
    produce a better phone experience.
-   Primary actions remain available without desktop-width assumptions.
-   Covers, artwork, labels, and metadata remain legible at small sizes.
-   Accessibility and performance validation apply to every new visual
    treatment.

## 18. V3 design direction to preserve

V3 is where the library may become more explicitly **a place**, using
the history accumulated through ordinary use to make the environment
feel alive.

The guiding distinction is:

> **V2 makes the data beautiful.**
>
> **V3 makes the library itself a place and uses accumulated history to
> make it feel alive.**

### Historical personality

-   Library Journal.
-   On This Day.
-   Historical resurfacing and richer event history.
-   Book of the Day or similar daily resurfacing.

### Weather and living environment

-   Weather-based book recommendations.
-   Weather-aware quote selection, if still desired.
-   Time-of-day behavior.
-   Reactive seasons, weather, lighting, and atmosphere.

### Spatial / interactive library

-   World → Oklahoma → Tulsa → Library → Room → Shelf → Book.
-   Interactive rooms and physically navigable shelves.
-   Interactive librarian's desk.
-   Books visually appearing, disappearing, and moving with collection
    state.
-   Shelf-capacity representation if a useful real-world model exists.
-   Ambient sound.
-   Environmental storytelling and subtle library phenomena.
-   Walking/wandering through the library.
-   A fully simulated physical collection.

V2 architecture should avoid unnecessarily preventing these ideas, but
no V2 feature should depend on them.

## 19. Post-V1 observation period

After V1 goes live, pause active feature development for approximately
one week and use the application normally. Record cumbersome
interactions, weak pages, technically complete but unpolished behavior,
repetitive actions, missing information, distinctive-page opportunities,
and improvements substantial enough for V2 rather than ordinary bug
fixing.

Before V2 scope is frozen, triage each observation as defect, small
polish, V2 candidate, or later-version idea. Any observation accepted
into V2 must gain user-facing acceptance criteria and any required
backend contract before it is scheduled.

## V2 completion checklist

Committed release outcomes:

-   Guided first-run setup built on the existing Build Mode workflow.
-   First-class books plus the album catalog for vinyl, cassettes, and
    CDs.
-   Tenant-aware UI against the approved multi-tenant contract.
-   One approved distinctive visual identity for each supported media
    area; selectable alternate skins are deferred.
-   Album artwork display, upload/removal, and approved provider
    fallback.
-   Multiple owned physical copies of the same commercial
    edition/release, each with its own UUID and lifecycle.
-   Media-aware Bulk Add for every supported medium.
-   Stable physical-item QR labels, automatic/new-item plus Generate
    All/bulk generation, phone-validated optional decorative rendering
    with conventional fallback, batch printing, and QR-aware item
    resolution in circulation.
-   Manual book availability controls for reserved, reading, missing,
    and available states.
-   Agreed automatic status behavior when books move to `Liz TBR` or
    `Andy TBR`, plus the distinct general Reserved/will-call shelf with
    structured pickup metadata.
-   Persistent side filter/sort controls for Books on wide layouts, with
    an equivalent compact mobile treatment.
-   Human-readable, canonical share URLs for named resources, backed by
    stable server-resolved slugs while UUIDs remain internal identities.
-   A Dashboard-backed Needs Reshelving queue with book-level mark and
    clear actions.
-   Optional editor, illustrator, and translator roles that render only
    when populated.
-   Camera ISBN capture styled as a native part of Shade without reducing
    accessibility or scan usability.
-   A shared accessible Back to Top control on automatic infinite-scroll
    surfaces.
-   A documented, tested, tenant-safe restore-from-backup workflow with
    validation and rollback.
-   Quote-specific curated Home heading phrases with the stable
    functional heading visibly beneath each one.
-   Deeper Dashboard analytics including pages owned, Pages Turned,
    annual acquisition/reading counts, and readable reading trends.
-   New Releases based on publication dates already present in the owned
    collection, without external release aggregation.
-   A responsive Current Reading module on Home using existing
    reading/status data.
-   Lightweight seasonal/theme-aware visual personality that changes
    atmosphere without changing information architecture.
-   Optional borrower signature capture with typed-name fallback and
    per-book loan-card rendering, subject only to the bounded prototype
    blocker criteria defined above.
-   Required borrower rating at check-in, optional written review shown
    under borrower initials, owner-data separation, and
    owner-correctable internal Work-level cross-copy borrower aggregates
    within one media type.
-   Incorporation of selected post-V1 observations.

## Deferred or possible later work

-   Board-game support, potentially V3.
-   Movie/video catalog support, including DVDs, VHS, and decisions for
    multi-disc releases and box sets.
-   Comic support after the catalog grain, creator model, and UPC lookup
    requirements are defined.
-   Audiobook reading-history logging and other digital-media support.
-   Multiple curated skins, deep time-of-day/reactive-environment
    themes, and a free-form user-created theme editor.
-   Elaborate patron reward or monetary-incentive systems.
-   Software implementation of the donation punch-card / Staff Pick
    reward idea.
-   Borrower-derived discovery beyond the minimum feedback and aggregate
    display.
-   Surprise Me / simple serendipity if it does not fit cleanly inside
    the V2 release window.
-   Additional decorative/environmental polish beyond the committed
    lightweight seasonal personality.
-   Integrated third-party image search for barcode-less lookup or missing
    metadata. Provider privacy, licensing, safe-linking, and API terms need
    a separate V3 research decision; V2 cover lookup/upload behavior remains
    unchanged.
-   Library Journal, On This Day, Book of the Day, weather-based
    recommendations, weather-aware quote selection, and deep
    time-of-day/living-environment behavior.
-   Fully spatial or simulated library navigation, interactive
    rooms/shelves/desk, ambient sound, and environmental storytelling.

Deliberately deferred ideas remain recorded here so they are not silently
lost. This definitive document controls the V2/V3 boundary.
