# Shade Library UI V2 -- Definitive Design & Scope

**Status:** Living product/design scope for remaining V2 work against the current shipped
frontend and backend 1.1.0 baseline. The pre-planning questions are resolved; implementation
details may still be settled in the tickets that own them.

**Purpose:** Define the authoritative user-facing vision, design direction, feature boundary,
and completion scope for Shade Library V2. This is a product/design document, not an
implementation plan or ticket specification. Detailed API contracts and implementation
sequencing remain in their owning technical documents and tickets.

**Last updated:** September 5, 2026

## Authority and document relationships

This document is the definitive V2 design and scope document for which user-facing
capabilities still belong in V2. It defines remaining outcomes; it is not an implementation
ticket.

When documents disagree, use the following order:

1. A current sequenced feature ticket in the repository that owns the work. Frontend ready
   work currently includes `docs/tickets/FEAT-30_borrower-name-presentation.md` and
   `docs/tickets/FEAT-38_frontend-v2-experience-handoff.md`. Backend remaining V2 planning
   lives in backend `PLAN-03_remaining-v2-features.md` and orchestrator `FEAT-08`.
2. The checked-in OpenAPI contract and `API-for-FE.md` for shipped backend behavior.
3. A feature-specific product specification when one exists.
4. This scope document for the intended user-facing outcome.
5. `UI_DESIGN_NOTES.MD` and `UI_DESIGN_NOTES.ALBUM_ANALOGIES.md` as design background.

Shipped HTTP contracts live in `docs/technical-reference/openapi.json` and
`docs/technical-reference/API-for-FE.md`. Prefer those over proposed-contract drafts for
implemented routes. Backend
`docs/technical-reference/V2-proposed-contract.md` locks only **unshipped** V2 surfaces
until each route ships into OpenAPI.

Frontend planning decompositions live in
`docs/tickets/PRODUCT_REQS.V2.PLAN-03-books-global.md`. PLAN-03 is the consolidated
remaining-work breakdown; its former album decomposition is split into `FEAT-01` through
`FEAT-06` in `docs/tickets`. Neither the plan nor its tickets replace this document or
OpenAPI. Frontend multi-tenant hostname routing is shipped baseline; production multi-host
handoff remains orchestrator `FEAT-08`.

Labels used below:

- **Shipped:** present in the current frontend and matching backend contract (summarized only
  as baseline).
- **Committed remaining:** accepted V2 scope not yet fully shipped.
- **Deferred:** explicitly outside V2 software scope unless later promoted.

## 1. Version definition

### V1 completion criterion

V1 is complete when the application can do everything the previous spreadsheet-based system
could do, with a better experience, plus the additional functionality delivered during V1
development. That milestone is effectively complete.

### V2 completion criterion

V2 is complete when every feature marked **Committed remaining** in this document has been
implemented against an agreed contract and the post-V1 observation findings selected for V2
have been incorporated. Features labeled **exploratory** or **stretch** do not become release
blockers until their rules and inclusion have been explicitly approved.

Real-world use after V1 launch should continue to identify friction worth promoting into V2.
Ordinary defects and small polish work do not need to become V2 features.

## 2. Current platform baseline (shipped)

Already shipped and therefore not restated as open V2 work:

- Application shell, typed OpenAPI + React Query client, Bearer auth, diagnostics, Home,
  Dashboard, About, Books browse/detail/create/edit, covers, Shelves, Collections,
  Wishlists, Loans, checkout/check-in, mark-read, hard delete, Stash, and Manage Collection
  entry points.
- Book Build Mode at `/books/bulk-add`: shelf-first intake, manual and camera ISBN capture,
  `POST /books/bulk/lookup` and `POST /books/bulk/import`, inline draft edit, wishlist
  acquisition, partial success, Start Next Shelf / Finish Bulk Add.
- Hostname-selected multi-library UI (`libraryContext`, owner theme tokens,
  `UnknownLibraryScreen`): same SPA on allowlisted hosts; trusted proxy supplies
  `X-Forwarded-Host`; browser never sends tenant identity; local `andy.localhost` /
  `jamie.localhost`; no ordinary library switcher. Production multi-host TLS/proxy
  handoff remains orchestrator `FEAT-08`.
- Catalog identity uses opaque UUIDs (`book_id`, `album_id`); paired `skip`/`take`
  pagination; partial updates that preserve omitted fields; authenticated binary covers and
  album artwork (never public filesystem or provider URLs).
- Album MVP UI against backend 1.1.0: `/albums` browse/add/detail/edit, artists/genres,
  Discogs/MusicBrainz lookup, artwork get/upload/delete/refetch, checkout/check-in,
  mark-played, soft-delete/restore, album loan history, dashboard Listening Room widgets,
  typed mixed wishlist membership. Collections remain book-only. The album MVP is shipped
  baseline rather than remaining greenfield product scope.
- Media navigation already exposes Albums beside Books; deeper media-identity packaging and
  album Bulk Add remain below.

Do not invent undocumented routes, a polymorphic `/items` CRUD API, album Collection UI, a
browser backup-download page, login/account flows, or a runtime tenant switcher.

## 3. First-run library setup / guided Build Mode

**State:** Committed remaining.

A genuinely empty installation enters a guided, productive setup flow instead of presenting
the ordinary empty application. Setup reuses the shipped book Build Mode engine and, once
available, media-aware album intake. It adds only guidance and orchestration:

1. Read explicit per-library setup state from `GET /library/setup`. States include
   `required` / `not_started`, `in_progress`, `complete`, and `failed`; a failed bootstrap is
   distinct from an API request failure and must never be interpreted as an empty or new
   library. `has_catalog_items` may inform setup but is not the completion signal. Completion
   uses the idempotent `POST /library/setup/complete` contract.
2. Ask which supported media the owner is adding, then use that medium's user-facing location
   term and intake fields.
3. Ask whether the owner has a supported TSV bootstrap source. If so, enter a validated
   bootstrap/import path; if not, continue into guided Build Mode. A disaster-recovery backup
   uses the separate restore workflow.
4. Explain briefly that setup will organize and catalog the real collection one physical
   location at a time.
5. Let the user create the first assignable location without leaving setup, then select it as
   the active destination.
6. Enter the ordinary high-throughput intake workspace with scanner focus and short,
   contextual guidance.
7. Save valid items while retaining unresolved items for correction, using existing
   partial-success semantics.
8. On completion of a location, let the user create or choose the next location and continue
   without returning to the normal application shell.
9. Let the owner mark setup complete even if no item was added, then route to Dashboard. Do
   not force the wizard on every subsequent empty-library visit.
10. Provide a discoverable entry from Manage Collection to resume guided building later.
11. Persist an unfinished intake queue in the current browser so a refresh, closure, or
    interruption does not discard scanned work. Namespace by library identity and media type.
    Cross-device resume is not required for V2.

Tutorial text should attach to real actions. Avoid tutorial-only slides, fake scans, and a
second catalog form. Ordinary Bulk Add remains available after first-run setup.

### Shared location and bootstrap decisions

V2 treats physical placement as one shared **location** concept internally. Media-specific
words are presentation: books use **shelf** and albums use **crate**. Existing album MVP
surfaces and transport fields may still use `shelf_name` / "Shelf" until the presentation
terminology is updated; the underlying shared location model does not change. V2 does not
require a location-type hierarchy merely to support different vocabulary.

First-run TSV bootstrap is a validated import rather than a spreadsheet-cleanup editor. V2
accepts one canonical, versioned, header-based UTF-8 TSV template per supported media type.
Templates should be downloadable from setup and use the same field names and rules as the
canonical create/import contracts. The backend ticket owns exact column lists. Before commit,
the frontend uploads the source for server validation and previews ready, warning, and
rejected totals. Row correction occurs in the source file and is re-imported.

### Known gap

The current API has no setup-completion state or library-initialization resource. Add
library-scoped settings/setup state rather than encoding completion in the shared Bearer
token. Browser persistence should include library identity, media type, destination, stable
client item IDs, drafts, lookup results, and save outcomes; never restore one library's
intake into another.

## 4. Additional physical media (remaining)

**State:** Album MVP shipped; remaining work is media-aware Bulk Add and visual identity
packaging. Additional media types are deferred.

Vinyl, CDs, and cassettes remain first-class formats within the shipped album catalog. Books
remain first-class through the book catalog. Movies/video (DVD, VHS) and comics are V3.
Board games remain a possible later addition.

First-class means each medium can be created, browsed, searched, viewed, edited, located,
included in applicable wishlists, and circulated where domain rules allow. A non-book item
must not be represented by mislabeling book fields.

Preserve shared application concepts -- owned physical item identity, location,
cover/artwork, circulation, bulk intake, search, and curated grouping -- while presenting
medium-specific metadata and terminology.

Locked shipped album rules the frontend must continue to honor:

- Albums remain separate from books (`/albums`, not polymorphic `/items` or `GET /books`).
- Soft delete/restore; narrower lifecycle (`available`, `on_loan`, `display_only`).
- Shared shelf catalog with typed album-shelf membership; Collections stay book-only over
  HTTP in V2.
- Wishlists may mix books and albums; shelf/wishlist placement remains mutually exclusive.
- Loans carry exactly one of nullable `book_id` / `album_id`.
- Artwork via authenticated album artwork routes only; no constructed provider URLs.
- Multiple owned physical copies of the same commercial release remain a V2 requirement;
  commercial identifiers identify the edition/release while each copy keeps its own UUID,
  location, status, loan history, and QR label. Duplicate-ISBN/import behavior must follow
  the authoritative backend ticket before further frontend assumptions.

The album `other` format must not substitute for movie, video, comic, or board-game domains.

## 5. Multi-tenant support

**State:** Frontend hostname routing and unknown-host UX shipped; orchestrator multi-host
production handoff remains outside this repo (`FEAT-08`).

Shipped frontend behavior (do not reopen):

- Derive display context from the hostname's leftmost label (`shade` public alias maps to
  Andy).
- Same-origin `/api`; browser sends only the shared Bearer token.
- Hardcoded Andy/Jamie theme token entry points; unknown hosts show a deliberate themed
  landing page rather than raw API `400` prose.
- Vite accepts `*.localhost` development hosts; documentation uses those URLs.
- No login/logout, per-person credentials, runtime registration, tenant discovery, or
  ordinary library switcher.

Remaining related product outcomes live elsewhere in this document (setup state, Enable
Loans and other library settings, operator restore) or in orchestrator deployment work.
Library-specific visual assets do not require a separate up-front approval phase. Each
implementation ticket should identify and review the assets it needs as that part of the
experience is built, while preserving the shipped hostname-specific identity behavior.

## 6. Media-specific visual identities

**State:** Committed remaining.

Moving between media types should feel like entering a different part of the collection
while still feeling like one application. Each medium should define a visual identity package
that can affect decorative assets, background and card treatments, typographic roles,
textures, materials, accents, and appropriate interface metaphors -- not merely a palette
swap.

Identity must not change information architecture, hide required state, rely on color alone,
or compromise keyboard, mobile, reduced-motion, contrast, and text-resizing behavior.
Administrative surfaces keep the same functional names and controls across media;
terminology changes only where the physical-location noun genuinely differs.

The current app still primarily uses one global token/stylesheet system plus book/library
raster assets, with early album-room cues. V2 does not require a complete approved brief or
asset inventory before this work is broken into tickets. Art direction, reference choices,
and required assets should be decided and reviewed one bounded surface at a time during
implementation, with each ticket recording the decisions needed for its own acceptance.

Performance guardrails (not hard release blockers): keep route-specific decorative assets to
roughly **500 KiB** compressed on initial view; keep any single decorative raster normally
below **250 KiB**; lazy-load noncritical imagery; prefer SVG/CSS for ornaments where
practical; avoid pushing the initial JS bundle upward for identity packaging alone.

## 7. Curated skins deferred

Multiple selectable skins per media type and a free-form theme editor are deferred to V3 or
later. V2 supplies one approved visual identity for each supported area plus the
hostname/library-specific identity already used for Andy/Jamie.

Lightweight **seasonal/theme-aware presentation is committed V2 design direction**. Spring,
summer, autumn, and winter may influence bounded background/accent treatments, typography
accents, and small decorative elements while leaving information architecture stable. Deep
time-of-day behavior, weather-reactive environments, and living-environment simulation remain
V3.

## 8. Media-aware Bulk Add

**State:** Book Build Mode shipped; album adapter committed remaining.

Every supported medium uses a common bulk-intake interaction model with medium-specific
capture, lookup, validation, editing, duplicate handling, and persistence. The refined book
Bulk Add is the accepted reference. New feature work in this area is the album adapter and
its backend bulk lookup/import contract.

Conceptual boundary:

> Choose destination/context -> capture identifier or manual entry -> lookup -> populate
> queue item -> validate -> classify -> optionally edit -> persist valid rows -> resolve
> exceptions.

The proposed album adapter uses `/albums/bulk/lookup` and `/albums/bulk/import`, accepts
batches of 1--50 barcode, Discogs release ID, or manual artist/title items, and preserves
request order through stable client IDs. Import targets one shelf, resolves normalized
artist/genre IDs before commit, uses independent savepoints, and never silently reuses a
soft-deleted match.

For albums, **title and at least one artist** are the minimum import-blocking metadata.
Each medium configuration supplies identifier parsers, manual-entry behavior, lookup
presentation, required fields, queue columns, validation rules, duplicate resolution,
destination terminology, and import/cache invalidation behavior. Books must not force ISBN,
author, or book status assumptions onto the generic intake engine.

First-run guided setup uses this framework once album contracts exist.

## 9. Physical-item UUID QR labels

**State:** Committed remaining.

Generate printable QR labels that encode the stable identity of one owned physical item, and
let scanner-driven workflows resolve those labels.

Required user-facing behavior:

- Generate a label for one item from its existing stable item UUID.
- Generate labels in a batch from explicitly selected items.
- Preview and print labels from the browser. V2 is phone-scanning-first and does not require
  dedicated 2D scanner acceptance coverage or human-readable fallback text on the label.
- Reprint without creating or rotating identity.
- Use a versioned, recognizable application payload rather than an untyped raw UUID.
- Reject malformed or unsupported Shade payloads safely.
- Resolve a valid Shade QR to exactly one physical item, including a particular copy when
  multiple owned copies share a commercial identifier.

Checkout and check-in scanning should accept both an applicable commercial identifier and a
Shade item QR. Commercial identifiers may produce zero, one, or multiple catalog candidates;
an item QR should resolve one owned copy.

### Current-state constraint

Current scanners parse ISBNs only; collection scan opens a unique ISBN match or filters
Browse; there is no unified checkout/check-in scanner surface. No QR payload format,
cross-media item-resolution endpoint, label-generation API, or print template is shipped.

QR generation and print layout are frontend responsibilities. The canonical payload is a
compact versioned Shade value containing media type and catalog UUID, conceptually
`shade:v1:<media-type>:<uuid>`. It contains no tenant name or public URL. Scanning is
authenticated application behavior; V2 defines no unauthenticated public landing page for
item labels.

The initial physical target is approximately **3 x 3 inches** per label. The first
browser-print template is a sustainability-oriented six-label sheet (two across by three
down on US Letter). A one-label reprint uses the same sheet geometry with a selectable
position. Generated PDF output is not required.

Label generation is part of the normal item-add path so a newly added owned item can
immediately receive its QR. Manage Collection also provides **Generate All** for
retrofitting and a bulk-select generation/reprint path. Reprinting never rotates identity.

Decorative QR output must remain standards-compliant. Preferred V2 experiment: high
error-correction QR with restrained styling and an optional centered portrait/cameo.
Deterministic local generation; conventional template always available as fallback. Every
render must pass automated decoding and real supported-phone tests.

Resolution uses authenticated `POST /catalog/resolve-code`. A valid Shade payload returns
zero or one candidate; commercial identifiers may return several. Malformed or unsupported
Shade versions are `422`; a well-formed unknown or other-tenant label is generic `404`.

Scanner-first circulation follows item state: exact Shade QR opens the appropriate
checkout/check-in action; ambiguous commercial matches ask the owner to choose a copy;
Reserved/Reading show the defined override warning; Missing and Display Only remain
ineligible; an item already on loan offers check-in. When **Enable Loans** is off, scanning
may still resolve/open the item but must not expose circulation actions.

## 10. Manual book availability and TBR-driven status

**State:** Committed remaining.

An owner can deliberately change a book's availability state without checking it in or out,
and selected personal TBR shelves can apply an availability state automatically when a book
is moved there.

### Existing contract and current limitation

The backend already defines book statuses `unknown`, `available`, `on_loan`, `missing`,
`display_only`, `reserved`, and `reading`. `BookUpdate` currently accepts `status`, but the
frontend's ordinary book-edit flow intentionally omits it. Checkout is offered only for
`available` books. Shelf moves currently change only `shelf_name`.

### Manual status control

Book Details and Browse bulk actions should expose owner/admin actions for `available`,
`reserved`, `reading`, `missing`, or `display_only` without editing unrelated bibliographic
metadata. `unknown` is not a separate user-facing choice; a manually unlocatable item is
Missing. `on_loan` is not a manual choice.

Practical meanings:

- **Available:** eligible for ordinary checkout.
- **Reserved:** intentionally held; checkout warns but can be overridden.
- **Reading:** currently in personal use; checkout warns but can be overridden.
- **Missing:** not presently locatable and moved to the `unknown` system shelf.
- **Display only:** part of the collection but never ordinarily loaned.

Changing availability does not change `is_read`, reading completion, rating, or review.

### TBR shelf automation

Library settings identify TBR shelves by stable `shelf_id`, not display names. Moving a book
to a configured TBR shelf sets `reserved` as part of the same successful operation. Moving
it out of every configured TBR shelf returns it to `available`. Starting the book is a
separate manual `reading` action. Status and shelf move must not visibly disagree because
one update succeeded and the other failed.

A separate shelf named `Reserved` may act as a small virtual will-call box for holds that
are not for Andy or Liz, with structured pickup name plus optional note. Structured pickup
metadata clears automatically when the item is successfully checked out or leaves that
shelf. V2 remains a lightweight owner-managed hold rather than a reservation queue.

Status precedence:

- Setting `missing` moves the book to `unknown` regardless of a prior TBR location.
- Setting `display_only` overrides TBR reservation behavior and blocks checkout.
- Setting `reading` leaves location unchanged and overrides reserved display while the book
  remains on a TBR shelf.
- Reserved and reading checkout attempts show a confirmation warning and may proceed;
  successful checkout then uses the normal `on_loan` lifecycle.
- Display-only and missing books remain ineligible for checkout.

Bulk move to a TBR shelf applies `reserved` to every successfully moved eligible book in the
same atomic operation.

## 11. ISBN applicability for pre-ISBN editions

**State:** Committed remaining.

A physical book edition that predates ordinary ISBN use must be representable as
legitimately having no ISBN. It must not appear in missing-ISBN cleanup,
incomplete-metadata counts, warnings, or Build Mode attention states merely because no ISBN
exists.

Books gain an explicit `isbn_not_applicable` boolean (default `false`). It is mutually
exclusive with a non-empty ISBN. Marking an existing book not applicable requires clearing
its ISBN in the same intentional update. Create/edit and Build review should offer **ISBN
not applicable (pre-ISBN edition)**; detail and cleanup should show a quiet "ISBN not
applicable" value rather than "Missing ISBN."

## 12. Quote-coordinated Home presentation

**State:** Committed remaining (frontend-only).

The randomly selected Home quote supplies a curated verbal theme for major section headings
on that page load. The quote is not an isolated rotating text block.

Home currently chooses one random entry per page mount from the frontend `homeQuotes` pool
and lets the user expand its context. That per-load random behavior remains the basis.
Reloading or remounting Home may select a different quote and therefore a different heading
set.

Weather-aware quote selection remains V3 (`PRODUCT_REQS.V3.weather-quote-bucket.md`) and is
not required to implement quote-themed headings.

### Curated heading pairs

Each production quote should map to an explicitly authored display phrase for each
participating Home section. The initial sections are:

- **New Additions**
- **Browse the Stacks** / categories
- **Staff Picks**

Every participating section displays a two-level heading treatment:

1. The quote-specific phrase appears first as the prominent, expressive heading.
2. The stable functional heading appears immediately beneath it in a smaller, consistent
   type treatment.

The stable label must remain visible text, not only screen-reader text, a tooltip, or an
`aria-label`. A quote without a complete approved mapping falls back to ordinary functional
headings. Quote text must never be interpreted as markup, CSS, executable content, or an
asset path. Quote mappings may affect **section-header treatment only**.

The V2 **Current Reading** module should receive the same curated heading treatment when it
is added.

## 13. Borrower name presentation

**State:** Committed remaining; owned by `docs/tickets/FEAT-30_borrower-name-presentation.md`.

Checkout continues to record the borrower's typed full name. Book and album loan cards
present that existing name in an attractive cursive-style treatment while keeping it
legible, selectable, and available to assistive technology as ordinary semantic text. The
treatment needs a readable fallback and must handle long names, supported viewport sizes,
zoom, contrast modes, and text settings.

Handwritten signature capture, canvas input, generated signature images, upload or staging
flows, signature storage/retrieval, and related backend contract changes are not part of V2.

## 14. Borrower ratings and reviews

**State:** Committed remaining.

Every completed return records a borrower rating, and may later receive one optional written
review, without altering the owner's rating, review, or read/played state.

Check-in on the owner's authenticated device requires a 1--5 rating. Optional written review
is submitted through a follow-up feedback endpoint so feedback failure cannot roll back or
repeat check-in. Email review requests, signed public review links, and borrower
authentication are outside minimum V2.

Required separation:

- Owner `rating`, `review`, and read/played status remain owner collection data.
- Borrower feedback never marks the owner as having read/played an item.
- At most one rating/review record per returned loan.
- Loan cards show the rating beside the typed borrower-name presentation; written reviews use
  accessible disclosure (hover alone is insufficient). Written reviews display **initials**;
  the loan record continues to show the typed full name.
- Aggregates combine physical copies of the same work/title within one media type only.

The backend should own a first-class internal **Work** identity with its own stable UUID.
Owner correction UI should offer concrete **Group as Same Work** / **Separate from Work**
actions with a preview of which owned editions/copies will share the borrower aggregate.
Albums follow the same work-level principle within their media type.

The current app has only a free-text borrower name on each loan. Owner rating/review live on
catalog reads; check-in accepts only an optional return timestamp; and no borrower-feedback,
work-identity, or aggregate resource exists yet.

## 15. Patron donation participation / punch card

**Status:** Not part of V2 software scope and must not receive implementation tickets.

The preferred concept rewards qualifying donations rather than repeated borrowing. It remains
an offline/non-software participation idea. No patron, donation, punch, reward, or redemption
model should be added to the frontend or API for V2.

## 16. Cross-cutting behavior to resolve

### Unified search and scanning

Text search remains scoped to the current media area; V2 does not add mixed-media global
search. Exact item QR payloads should be resolvable without guessing a commercial edition.
Ambiguous commercial identifiers need an explicit disambiguation experience.

### Generalized circulation

Circulation should be evaluated as an owned-physical-item capability rather than a book-only
feature. Eligibility, loan history, borrower feedback, borrower-name presentation, and
scan-to-checkout/check-in behavior should use shared lifecycle concepts unless a medium has
a documented exception.

### Dashboard and Home

Home is library-wide and serves as the entry hall to the supported media areas. Recent
Additions should intentionally mix media through a catalog recent-additions contract rather
than merging book and album dashboard counters in the browser. Staff Picks remains a book
Collection. Dashboard is media-specific and uses explicitly scoped keys/counts.

### Media switching

Media selection is an explicit physical-feeling control. It must remain keyboard-accessible,
mobile-appropriate, URL/deep-link compatible, and predictable when a medium is unavailable.
Media areas use typed route prefixes (`/books`, `/albums`). Switching changes to the
corresponding typed route without translating incompatible filters.

For V2, switching may remain page-to-page. The transition uses a turning record when entering
Albums and a book resting open with pages turning through a splayed arc when entering Books.
These are brief loading/transition treatments with static reduced-motion fallbacks.

Circulation is configurable per library through Manage Collection with an **Enable loans**
setting. Disabled circulation hides or disables checkout/check-in entry points without
deleting loan history.

### Human-readable deep links

**V2 commitment:** Links intended for people to type, recognize, or share use readable keys
wherever the resource has an unambiguous human name (for example, `?category=thriller`).
UUIDs remain the internal identity and API transport key. Mutable or colliding names need a
backend-owned unique slug. The frontend must resolve readable URL values through the backend
contract rather than guessing UUIDs from labels.

### Reshelving queue

**V2 commitment:** An owner can mark a book as needing attention when it is filed under the
wrong shelf, category, or other placement metadata. The action is available from Book Details
and records a small reason/note without immediately changing catalog data. Dashboard provides
a pinned **Needs Reshelving** queue. This is an owner workflow, not another circulation
status.

### Optional book contributors

**V2 commitment:** Book create/edit supports optional editors, illustrators, and translators
in addition to required authors. Book Details renders only contributor roles that contain at
least one value.

### Camera capture presentation

The existing native camera ISBN capture remains the functional base. V2 brings its chrome into
the product's visual system: wood-brown header treatment around the viewfinder, shared Shade
button styles, and accessible focus, permission, error, reduced-motion, and small-screen
states.

## 17. Persistent Books controls and infinite-scroll navigation

**State:** Committed remaining.

### Books filter and sort rail

The main Books list currently places `BooksListControls` above the results. On layouts wide
enough to support it (at least 75rem / 1200 CSS pixels of usable width), the complete
filter/sort control group should move into a persistent left side rail beside the results.
The rail reuses the mobile filter modal's grouping, labels, and clear/reset language;
URL-backed changes apply immediately with no separate Apply step. Bulk-selection actions join
the rail while selection mode is active. Shelves search/list controls and later album lists
should adopt the same pattern where continuous scrolling applies.

### Shared Back to Top control

Any page that automatically appends content as the user approaches the end must provide a
visible **Back to Top** control after the user has moved meaningfully away from the top.
Current applicable surfaces include Books (including cleanup), Loans, collection and wishlist
membership lists, and the progressively revealed Shelves list. Future infinite lists,
including albums if implemented that way, inherit the requirement.

The control should use one shared component and behavior, remain reachable by keyboard and
touch, have an explicit accessible name, respect safe areas, and never obscure important
content. Returning to the top may animate only when reduced motion is not requested.

## 18. Restore from backup / disaster recovery

**State:** Committed remaining as an operator/backend capability; no ordinary frontend restore
surface.

Database export remains an operator-only workflow. The frontend has no backup-download page
and should not plan browser restore inventory UI for V2. Operator tooling must accept an
explicit tenant and recognized server-side artifact; it must never infer the target from
recent activity or accept an unvalidated path supplied by browser code.

Required recovery behavior (backend/ops): explicit source and target; validate before
mutation; pre-restore safety copy; temporary replay with integrity checks; atomic
activation; rollback on failure; operator runbook and repeatable recovery test. V2 restore
addresses database corruption; sibling asset directories for covers and artwork reconnect by
UUID when still present, but restore does not recover those directories after disk loss.

## 19. Discovery, analytics, and library personality

V2 should turn the data the library already owns into a richer, more personal interface
without trying to simulate a fully physical library.

> **V2 is the library's digital catalog made beautiful.**

### 19.1 Dashboard expansion

**V2 commitment:** Deepen the existing Dashboard summary with useful collection and reading
analytics built primarily from data already owned by the application:

- Pages owned.
- Pages turned (preferred phrase for pages read).
- Books acquired this year / books read this year.
- Books read over time / pages turned over time.
- Books read by shelf / by category.

Existing Dashboard book keys retain book-only meaning. Album totals already appear as
separate Listening Room widgets; album incomplete-metadata reporting is not part of V2.
Shelf-capacity measurement is **not** a V2 commitment.

### 19.2 New Releases

**V2 commitment:** Add **New Releases** using publication dates already stored on owned
books. External new-release aggregation is later work.

### 19.3 Current Reading on Home

**V2 commitment:** Home includes a **Current Reading** module showing books the household is
actively reading, using existing reading/status data. Compose New Releases, Current Reading,
existing discovery modules, and quote treatment deliberately for mobile density. Prefer
resilient card geometry and natural wrapping over per-title font scaling or marquee motion.

### 19.4 Surprise Me / serendipity

**V2 status:** Stretch feature. It does not block V2 completion. If included, resolve to an
owned book from existing collection/filter data without a complex recommendation model.

### 19.5 Seasonal and decorative personality

Light seasonal personality is part of the V2 visual direction (see section 7). Non-interactive
motifs such as plants, desk, lamp, paper, catalog cards, and shelf labels may strengthen the
sense of place without becoming required navigation.

### 19.6 Empty-state personality

Existing functional empty states may receive concise library-specific language where it
improves the experience without obscuring the next action (for example, "We searched the
stacks. Nothing turned up.").

### 19.7 Data-first and responsive principles

Prefer features that can be produced from data already owned by Shade. Every new V2 surface
is designed for desktop and mobile intentionally; mobile is a first-class layout, not a
compressed desktop layout.

## 20. V3 design direction to preserve

V3 is where the library may become more explicitly **a place**, using accumulated history to
make the environment feel alive.

> **V2 makes the data beautiful.**
>
> **V3 makes the library itself a place and uses accumulated history to make it feel alive.**

Preserve without implementing in V2: Library Journal / On This Day / historical resurfacing;
weather-based recommendations and weather-aware quotes; deep time-of-day and reactive
atmosphere; spatial/interactive library navigation; ambient sound; environmental
storytelling; shelf-capacity representation if a useful real-world model exists.

## 21. Post-V1 observation period

After V1 goes live, pause active feature development for approximately one week and use the
application normally. Record cumbersome interactions, weak pages, unfinished polish,
repetition, missing information, and improvements substantial enough for V2.

Before V2 scope is frozen, triage each observation as defect, small polish, V2 candidate, or
later-version idea. Any observation accepted into V2 must gain user-facing acceptance
criteria and any required backend contract before it is scheduled.

## V2 completion checklist

Committed remaining release outcomes:

- Guided first-run setup built on the existing Build Mode workflow.
- Album Bulk Add adapted from the shipped book Build Mode contract.
- One approved distinctive visual identity for each supported media area; selectable
  alternate skins deferred.
- Multiple owned physical copies of the same commercial edition/release, each with its own
  UUID and lifecycle, per final backend duplicate/copy rules.
- Stable physical-item QR labels, generation/reprint, phone-validated optional decorative
  rendering with conventional fallback, batch printing, and QR-aware item resolution.
- Manual book availability controls and configured TBR automation, plus the distinct general
  Reserved/will-call shelf with structured pickup metadata.
- Explicit ISBN-not-applicable state for pre-ISBN editions.
- Persistent side filter/sort controls for Books on wide layouts, with equivalent compact
  mobile treatment, and shared Back to Top on progressive lists.
- Human-readable, canonical share URLs for named resources.
- Dashboard-backed Needs Reshelving queue with book-level mark and clear actions.
- Optional editor, illustrator, and translator roles that render only when populated.
- Camera ISBN capture styled as a native part of Shade without reducing accessibility or
  scan usability.
- Documented, tested, tenant-safe restore-from-backup workflow (operator/backend; no ordinary
  FE restore surface).
- Quote-specific curated Home heading phrases with stable functional headings beneath.
- Deeper Dashboard analytics including pages owned, Pages Turned, annual counts, and readable
  reading trends.
- New Releases based on owned publication dates.
- Responsive Current Reading module on Home.
- Lightweight seasonal/theme-aware visual personality.
- Shared accessible cursive-style presentation of the existing typed borrower name on book
  and album loan cards (`FEAT-30`); no handwritten-signature capture or backend changes.
- Required borrower rating at check-in, optional written review under borrower initials,
  owner-data separation, and owner-correctable Work-level aggregates within one media type.
- Enable Loans and related library-scoped settings.
- Incorporation of selected post-V1 observations.
- Orchestrator multi-library host handoff where production deployment still requires it
  (`FEAT-08`).

Already shipped (not open checklist items): book Build Mode; album MVP UI against backend
1.1.0; hostname multi-tenant UI; Stash; typed
loans/wishlists; authenticated covers/artwork; book Collections.

## Deferred or possible later work

- Board-game support, potentially V3.
- Movie/video catalog support, including DVDs, VHS, and decisions for multi-disc releases and
  box sets.
- Comic support after catalog grain, creator model, and UPC lookup requirements are defined.
- Audiobook reading-history logging and other digital-media support.
- Album Collection membership HTTP/UI.
- Multiple curated skins, deep time-of-day/reactive-environment themes, and a free-form
  theme editor.
- Elaborate patron reward or monetary-incentive systems.
- Software implementation of the donation punch-card / Staff Pick reward idea.
- Borrower-derived discovery beyond the minimum feedback and aggregate display.
- Surprise Me / simple serendipity if it does not fit cleanly inside the V2 release window.
- Additional decorative/environmental polish beyond committed lightweight seasonal
  personality.
- Integrated third-party image search for barcode-less lookup or missing metadata.
- Library Journal, On This Day, Book of the Day, weather-based recommendations,
  weather-aware quote selection, and deep time-of-day/living-environment behavior.
- Fully spatial or simulated library navigation, interactive rooms/shelves/desk, ambient
  sound, and environmental storytelling.

Deliberately deferred ideas remain recorded here so they are not silently lost. This
definitive document controls the V2/V3 boundary.
