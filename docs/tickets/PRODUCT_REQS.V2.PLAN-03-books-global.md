# PLAN-03 -- Consolidated Remaining V2 Work

**Status:** Consolidated planning decomposition of all remaining definitive V2 scope. This
document is ready to be broken into implementation tickets after owner review. Book Bulk Add,
the album MVP, hostname multi-tenant UI, Stash, and album Listening Room dashboard widgets
are shipped baseline.

**Backend alignment:** Backend `PLAN-03_remaining-v2-features.md` and unshipped surfaces in
`V2-proposed-contract.md`. Orchestrator multi-host production handoff remains FEAT-08.

**Authority:** `PRODUCT_REQS.V2.definitive.md` remains the product source of truth. Current
tickets own their feature details; implemented OpenAPI and `API-for-FE.md` own shipped
transport behavior. This plan is the complete remaining-work index; album-specific delivery
is split into `FEAT-01` through `FEAT-06` without defining a separate release boundary.

**Last updated:** September 5, 2026

## Goal

Complete V2's book and album improvements, shared physical-item capabilities, discovery and
analytics work, visual refinement, and safe release path. V2 finishes the digital catalog's
data use and personality without becoming a spatial library simulation.

## Scope boundary

This plan still owns:

- album Bulk Add, album browse polish, album visual identity, and album participation in
  shared QR, feedback/Work, and mixed Home features (`FEAT-01` through `FEAT-06`);
- guided first-run setup and canonical TSV bootstrap experience;
- production-safe V1-to-V2 migration and operator restore (FE constraints: no ordinary
  browser restore surface);
- exact-copy QR labels, printing, and code resolution UI;
- book availability, TBR automation, Reserved/will-call, and Enable Loans settings;
- ISBN-not-applicable behavior;
- human-readable share/deep links;
- Needs Reshelving and optional book contributors;
- quote-coordinated Home presentation;
- borrower-name presentation, feedback, and Work correction UI;
- persistent catalog controls and Back to Top;
- book analytics, New Releases, Current Reading, seasonal personality, and optional
  serendipity;
- shared media-navigation polish and book-side camera/visual polish;
- V3 deferrals, observation closeout, and release gates.

**Added another feature to work into a ticket, it should be small**
- do not return `null` fields on book/album forms. ie, `editor`, `illustrator`, or even `acquisition source`.
	if there's no entry in the field, it should not be present on the rendered/saved book form. 

`FEAT-01` through `FEAT-06` own the album work indexed here.
Hostname-derived library identity, owner theme tokens, unknown-host UX, and `*.localhost`
hosts are shipped; do not reopen them. Namespace browser-persisted setup and Bulk Add
sessions by library identity when those flows land.

## Shipped baseline (do not re-plan)

- Book Build Mode at `/books/bulk-add` (lookup/import, drafts, partial success, Start Next
  Shelf / Finish). Shared intake must remain adaptable for album Bulk Add without
  treating ISBN, author, or book status as universal.
- Stash, Collections, Wishlists, Loans, covers, Shelves, Dashboard book papers, and Home
  quote/discovery modules already in the tree.
- Hostname multi-tenant UI; production multi-host TLS/proxy/scheduling remains FEAT-08.
- Album Listening Room dashboard widgets (explicitly scoped album keys). Existing book keys
  remain book-only.
- Typed `/books` and `/albums` route families with drawer navigation to Albums.

## 1. Guided first-run setup

**State:** Committed remaining.

A genuinely empty tenant enters a guided, productive setup flow built on the real Bulk Add
engine:

1. Read explicit tenant setup state; never interpret a failed request or failed bootstrap as
   an empty library.
2. Ask which supported medium is being added.
3. Offer a versioned TSV bootstrap or guided location-by-location intake.
4. Create/select the first assignable location through canonical APIs.
5. Enter scanner-first Build Mode with brief contextual guidance.
6. Save approved valid rows while retaining unresolved rows.
7. Continue into another location without returning to the ordinary shell.
8. Allow explicit completion even when no item was added.
9. Route completion to Dashboard and provide a Manage Collection re-entry later.
10. Preserve unfinished queues locally and namespace them by tenant and medium.

The frontend owns transient wizard/queue state. The backend owns durable setup state plus
idempotent completion.

### TSV bootstrap

Use one canonical, versioned, UTF-8, header-based template per media type aligned with
canonical create/import contracts. Server validates before commit; preview reports ready,
warning, and rejected totals. Source correction occurs outside Shade and is re-imported; V2
does not build a spreadsheet editor.

## 2. V1-to-V2 migration and release cutover

**State:** Committed remaining backend/ops release gate; frontend must not invent a
migration UI.

Deleting and rebootstraping a disposable development database remains acceptable. It is not
the production upgrade path once V1 data is authoritative. Every V2 schema change needs a
clean-install representation and a data-preserving upgrade path with rehearsal, failure
injection, idempotency, and rollback. Album work may not treat recreation of the only live
database as migration.

## 3. Operator backup restoration

**State:** Committed remaining operator/backend capability.

Restore is tenant-targeted and not a normal browser page. No frontend restore, inventory, or
threshold behavior should be planned. Database restoration reconnects intact external assets
but does not recover asset directories lost from disk. V2 emergency restore accepts the
running schema version only.

## 4. Exact-copy QR labels and scanning

**State:** Committed remaining.

Every label identifies one owned physical copy using `shade:v1:<media-type>:<uuid>`. The
payload contains no tenant or public URL. Labels are stateless; reprinting does not rotate
identity. Authenticated resolution returns zero/one exact candidate for a Shade label and may
return multiple copies for a commercial identifier.

First print layout: sustainability-oriented six-label US Letter sheet (two by three),
approximately 3 x 3 inches per label, with selectable starting position for reprints.
Generation is local; conventional high-contrast QR with error-correction H is always
available; optional bounded portrait/cameo must not obscure finder patterns. Every template
passes automated decode and supported-phone print tests.

The shared scanner understands Shade labels and commercial identifiers, disambiguates
multiple commercial matches, shows lifecycle ineligibility honestly, and respects Enable
Loans.

## 5. Book availability and reservation

**State:** Committed remaining.

Owners can set `available`, `reserved`, `reading`, `missing`, or `display_only`; `on_loan`
remains lifecycle-owned. Active loans block manual availability changes.

- Missing moves the book atomically to `unknown`.
- Display Only blocks checkout and overrides TBR behavior.
- Reading retains location and overrides TBR Reserved display.
- Reserved/Reading checkout requires an explicit warning and override.
- Configured TBR shelf UUIDs set Reserved on entry and return eligible books to Available on
  departure; single and bulk moves apply the rule atomically.
- A distinct general Reserved/will-call shelf stores structured pickup name and optional note.

The owner manages Enable Loans, configured book TBR shelf IDs, and Reserved shelf ID through
tenant-scoped settings.

## 6. ISBN not applicable

**State:** Committed remaining.

Book create/edit/Build review supports `isbn_not_applicable`, mutually exclusive with a
non-empty ISBN. Marking an ISBN-bearing book not-applicable requires confirmation and clears
the ISBN in the same update. Detail and cleanup show a quiet "ISBN not applicable" value.
Missing-ISBN reports exclude these editions.

## 7. Human-readable URLs

**State:** Committed remaining.

Human-facing links use readable keys for named resources (for example, `?category=thriller`)
while APIs retain UUID identity. Mutable or colliding names require backend-owned unique
slugs with redirects after rename. The frontend resolves slugs through the backend contract
rather than deriving UUIDs from labels. Current Books list filters still use `category_id`
GUIDs; do not invent client-side slug maps.

## 8. Needs Reshelving and contributors

**State:** Committed remaining.

Book Details can mark a book **Needs Reshelving** with a small reason/note without
immediately changing catalog data. Dashboard provides a pinned queue. This is owner task
state, not a circulation status or special shelf.

Book create/edit supports optional editors, illustrators, and translators as structured
ordered roles. Book Details omits empty roles and never shows null metadata rows.

## 9. Quote-coordinated Home presentation

**State:** Committed remaining (frontend-only).

Home already selects one checked-in quote per mount from `homeQuotes`. Each production quote
should map to curated expressive phrases for New Additions, Browse/categories, Staff Picks,
and later Current Reading, paired with a stable visible functional heading.

Missing mappings use the ordinary heading. Quote content is never interpreted as markup, CSS,
executable content, or an asset path. Quote mappings change section-header treatment only.
Weather-aware selection remains V3.

## 10. Borrower name presentation

**State:** Ready in `FEAT-30_borrower-name-presentation.md`.

Book and album loan cards present the existing typed borrower name with one shared,
accessible cursive-style treatment. Names remain selectable semantic text with a legible
fallback and responsive handling for long values. Handwritten signature capture, canvas
input, image upload/storage, and backend signature contracts are out of scope.

## 11. Borrower feedback and Work identity

**State:** Committed remaining.

Check-in requires a 1--5 borrower rating. The loan closes first; optional written review uses
a separate idempotent feedback operation. Owner catalog rating/review/read or played state
remains separate. Loan cards show full typed borrower name and rating; review presentation
uses initials.

Every physical item belongs to one media-specific internal Work. Owner **Group as Same Work**
/ **Separate from Work** operations are atomic, previewed, audited, reversible, and reassign
historical aggregates without changing original loans or feedback.

## 12. Media navigation polish

**State:** Typed media routes shipped; transition and control polish committed remaining.

Home remains the library-wide entry hall. Each media area retains its own URL-backed filters,
sort, and position; incompatible filters are never translated across media.

V2 may remain page-to-page. Entering Albums may show a brief turning record; entering Books
may show an open book with pages turning through a splayed arc. Transitions must not delay
ready content, block browser navigation, trap focus, or replace semantic loading/heading
content. Reduced-motion users receive a static treatment.

## 13. Persistent controls and Back to Top

**State:** Committed remaining.

Books and Shelves use the successful mobile control language in a left-aligned wide rail at
no less than 75rem/1200 CSS pixels of usable width. Phones and smaller tablets use the modal.
URL-backed filters apply immediately; existing cancellation/debouncing prevents stale results.
Bulk-selection actions join the rail while selection mode is active.

Every progressively appended list shows the shared Back to Top control after another batch
loads. It returns focus to the list's search/filter entry, respects reduced motion and safe
areas, and never obscures important controls. Album lists inherit the pattern through
`FEAT-02`.

## 14. Dashboard analytics

**State:** Committed remaining for deeper book analytics.

Deepen book analytics using owned data:

- Pages owned and **Pages Turned**;
- books acquired/read this year;
- books and pages read over time; and
- books read by shelf and category.

Charts prioritize comprehension. Mobile layouts remain deliberately usable. Do not invent
shelf-capacity data. Album Listening Room widgets are already shipped and stay separately
labeled.

## 15. Home discovery

**State:** Committed remaining.

### New Releases

Surface recently published owned books using existing publication dates. Do not require
external release feeds.

### Current Reading

Show books actively being read using existing reading/status data. Compose Current Reading,
New Releases, New Additions, Staff Picks, category discovery, and quote treatment without
overcrowding mobile Home. Cards must handle short, multi-word, long unbroken, and very long
titles at 320px and 200% text zoom without hover-only truncation.

### Surprise Me

Stretch work. If included, randomize existing collection/filter results without a complex
recommendation engine. Its omission does not make V2 incomplete.

## 16. Seasonal and decorative personality

**State:** Committed remaining.

V2 supplies one cohesive book identity, one cohesive album identity, and restrained
seasonal atmosphere without changing navigation or layout semantics. Decorative elements
cannot become required navigation.

Camera ISBN capture should feel native to Shade: wood-brown surround, shared button styling,
and accessible focus, permission, error, reduced-motion, and small-screen states without
shrinking the usable viewfinder. Empty states may use concise library-specific personality
while preserving the next action.

## Settled presentation decisions

Albums use **crate** as their user-facing location noun while transport continues to use the
shared shelf/location contract. Visual work does not require a complete up-front brief or
asset inventory: each bounded implementation ticket identifies and reviews the references,
art direction, and assets needed for its own acceptance. Hostname-owned theme selection is
already shipped.

## 17. Visual quality gates

Every new surface defines desktop and mobile behavior, works at 320px and 200% text zoom,
preserves keyboard/touch access, exposes meaningful loading/empty/error states, respects
reduced motion, and maintains readable covers and metadata.

Keep the initial critical visual payload around the documented design guardrail, lazy-load
noncritical imagery, prefer CSS/SVG for ornaments where practical, and measure rather than
treating decoration as free.

## 18. Post-V1 observation closeout

After normal V1 use, classify observations as defects, small polish, V2 candidates, or later
ideas. Accepted additions receive user-facing acceptance criteria and required contracts
before scheduling.

## Ticket decomposition

Create implementation tickets from these bounded work packages. A package may be split by
frontend/backend ownership or delivery risk, but unrelated packages should not be combined
merely to reduce ticket count.

The album tickets are grouped by dependency boundary:

- **Album intake and setup:** `FEAT-01` (album Bulk Add), coordinated with the shared guided
  setup contract and ticket.
- **Album catalog presentation:** `FEAT-02` (browse completion) and `FEAT-06` (visual
  identity/crate language), which can proceed independently except for shared control and
  visual-quality primitives.
- **Shared physical-item and circulation contracts:** `FEAT-03` (feedback/Work) and
  `FEAT-04` (QR/scanning). These should follow their respective shared backend contracts;
  `FEAT-03` also consumes the existing `FEAT-30` borrower-name treatment.
- **Library-wide Home discovery:** `FEAT-05` (mixed Recent Additions), coordinated with the
  shared Home composition work.

1. **Guided setup and TSV bootstrap:** explicit setup state, media selection, canonical
   templates, validation preview, location creation, Build Mode handoff, local recovery, and
   completion/resume behavior.
2. **Album Bulk Add:** barcode/Discogs/manual capture, ordered lookup results, editable
   drafts, duplicate and soft-delete resolution, partial import, local recovery, and
   create-or-select-next-crate flow.
3. **Album browse completion:** album-owned URL filters and sorts, progressive loading,
   history restoration, wide control rail, compact modal controls, and Back to Top.
4. **Library settings and book availability:** Enable Loans, TBR shelf IDs, Reserved shelf,
   manual availability, checkout overrides, structured pickup metadata, and atomic single
   and bulk shelf/status changes.
5. **ISBN applicability:** create/edit/Build Mode input, mutual-exclusion confirmation,
   detail presentation, and cleanup/dashboard exclusion.
6. **Readable resource URLs:** backend-owned slugs, resolution, canonical links, rename
   redirects, and replacement of human-facing GUID query values.
7. **Needs Reshelving:** book-level mark/clear with reason and the pinned Dashboard queue.
8. **Book contributors:** normalized editor, illustrator, and translator roles across
   create/edit/detail and Build Mode where applicable.
9. **Exact-copy QR labels:** versioned payload, single/batch generation, six-up browser print
   layout, selectable reprint position, deterministic decode checks, and phone validation.
10. **Unified code resolution and circulation scanning:** typed book/album resolution,
    commercial-code ambiguity, lifecycle actions and warnings, and Enable Loans behavior.
11. **Borrower name presentation:** implement the already-ready `FEAT-30` treatment across
    book and album loan cards without signature capture or backend work.
12. **Borrower feedback:** required check-in rating, optional idempotent review, initials and
    accessible disclosure, summaries, and strict separation from owner ratings/read state.
13. **Work identity correction:** same-media grouping preview, merge/separate actions,
    historical aggregate reassignment, auditability, and reversal.
14. **Home presentation and discovery:** quote-coordinated headings, Current Reading, owned
    New Releases, and a deliberate mobile composition of existing modules.
15. **Mixed-media Recent Additions:** use a dedicated typed catalog feed when shipped APIs
    cannot satisfy the agreed entry decision; keep Staff Picks book-backed.
16. **Dashboard book analytics:** Pages Owned, Pages Turned, annual counts, trends, and
    shelf/category reading views without shelf-capacity invention.
17. **Media and library visual identity:** implement book, album, Home, and hosted-library
    treatments in bounded surface tickets; decide references/assets per ticket and apply
    **crate** consistently in album presentation.
18. **Media navigation and camera polish:** accessible media switching/transition behavior
    plus the native Shade treatment for camera ISBN capture.
19. **Shared progressive-list navigation:** common Back to Top behavior and persistent wide
    controls for remaining applicable book, shelf, loan, collection, and wishlist surfaces.
20. **Seasonal and empty-state personality:** bounded decorative treatments and copy that do
    not alter navigation, accessibility, or performance expectations.
21. **Migration and operator recovery gates:** data-preserving upgrade rehearsal, failure
    and rollback checks, tenant-targeted database restore, and asset reconnection rules; no
    ordinary frontend restore page.
22. **Observation and release closeout:** triage accepted post-V1 observations, verify
    generated contracts/docs/routes, run accessibility/responsive/performance gates, and
    coordinate the separately owned production multi-host handoff.

**Stretch only:** Surprise Me receives a ticket only if explicitly promoted without
displacing committed work.

## Release gates

- Remaining album journeys in `FEAT-01` through `FEAT-06` (Bulk Add, browse polish,
  identity, QR/feedback participation, and mixed Home integration) pass.
- Shipped hostname multi-tenant UI remains correct; backend tenant isolation, per-file
  migration, CORS, assets, and backup tests pass; orchestrator FEAT-08 multi-host handoff
  passes where required for deployment.
- Every V2 schema change has a clean-install representation and a data-preserving V1 upgrade
  path.
- Migration rehearsal, injected failure, idempotency, and rollback succeed against
  representative V1 data.
- Tenant-targeted restore drills cannot replace the wrong library.
- QR conventional/decorative templates pass automated and supported-phone print tests.
- `FEAT-30` borrower-name presentation passes responsive and accessibility coverage; no
  signature capture is introduced.
- Work correction moves historical feedback aggregates correctly.
- Frontend routes, generated OpenAPI, supplementary API guidance, and documentation agree.
- Accessibility, responsive, performance, and post-V1 observation reviews pass.
- Each visual ticket records the bounded reference and asset decisions needed for its own
  acceptance.

## Deferred or later work

- Video, comics, board games, and broader digital-media management.
- Library Journal, On This Day, Book of the Day, and historical resurfacing.
- Weather-based recommendations and weather-aware quote selection.
- Deep time-of-day, reactive lighting/environment, ambient audio, and spatial library
  simulation.
- External new-release aggregation and complex AI recommendations.
- Selectable skins and free-form theme editing.
- Patron donation/punch-card software and elaborate rewards.
- Cross-device Build-session persistence.
- Third-party image search for barcode-less lookup or missing metadata pending separate
  privacy/licensing/provider work.
- Borrower-derived discovery beyond accepted feedback summaries.
