# PLAN-03 — Remaining Book, Global, and Release Work

**Status:** Planning decomposition of the definitive V2 scope. Not an implementation ticket.

**Backend alignment:** Backend PLAN-03 remaining V2 features and release gates.

**Authority:** `PRODUCT_REQS.V2.definitive.md` remains the product source of truth. Current tickets own their feature
details; implemented OpenAPI and `API-for-FE.md` own shipped transport behavior. This plan groups everything not owned
by PLAN-01 Albums or PLAN-02 Multi-Tenancy.

## Goal

Complete V2's book improvements, shared physical-item capabilities, discovery and analytics work, visual refinement,
and safe V1-to-V2 release path. V2 finishes the digital catalog's data use and personality without becoming a spatial
library simulation.

## Scope boundary

This plan owns:

- guided first-run setup and canonical TSV bootstrap experience;
- production-safe V1-to-V2 migration and operator restore;
- shared media-aware intake conventions and the accepted book Bulk Add baseline;
- exact-copy QR labels, printing, and code resolution UI;
- book availability, TBR automation, and Reserved/will-call behavior;
- ISBN-not-applicable behavior;
- human-readable share/deep links;
- Needs Reshelving and optional book contributors;
- quote-coordinated Home presentation;
- borrower signatures, feedback, and Work correction UI;
- persistent catalog controls and Back to Top;
- book analytics, New Releases, Current Reading, seasonal personality, and optional serendipity;
- shared media navigation and book-side camera/visual polish;
- V3 deferrals, observation closeout, and release gates.

Album-specific implementation belongs to PLAN-01. Tenant routing, hostname themes, and isolation belong to PLAN-02.

## 1. Version and release definition

V2 is complete when all committed outcomes in the definitive document are implemented against agreed contracts and the
selected post-V1 observations have been incorporated. Exploratory and stretch work does not become release-blocking
without explicit promotion.

Ordinary defects and small polish should be fixed according to normal priority rather than used to expand the V2
feature boundary.

## 2. Guided first-run setup

A genuinely empty tenant enters a guided, productive setup flow built on the real Bulk Add engine:

1. Read explicit tenant setup state; never interpret a failed request or failed bootstrap as an empty library.
2. Ask which supported medium is being added.
3. Offer a versioned TSV bootstrap or guided location-by-location intake.
4. Create/select the first assignable location through canonical APIs.
5. Enter scanner-first Build Mode with brief contextual guidance.
6. Save approved valid rows while retaining unresolved rows.
7. Continue into another location without returning to the ordinary shell.
8. Allow explicit completion even when no item was added.
9. Route completion to Dashboard and provide a Manage Collection re-entry later.
10. Preserve unfinished queues locally and namespace them by tenant and medium.

The frontend owns transient wizard/queue state. The backend owns durable `required`, `in_progress`, `complete`, and
`failed` setup state plus idempotent completion.

### TSV bootstrap

Use one canonical, versioned, UTF-8, header-based template per media type. Templates align with canonical create/import
contracts rather than attempting to infer arbitrary legacy spreadsheets. Multi-value fields have one documented
delimiter and escaping rule; locations resolve through the shared catalog.

The server validates before commit. Preview reports ready, warning, and rejected totals. Rejections identify source row,
field, stable error code, and plain-language message. Unknown columns are reported, optional columns may be absent, and
missing required/duplicate headers reject the file. Commit uses the validated snapshot. Source correction occurs outside
Shade and is re-imported; V2 does not build a spreadsheet editor.

## 3. V1-to-V2 migration and release cutover

Deleting and rebootstraping a disposable development database remains acceptable. It is not the production upgrade path
once V1 data is authoritative.

Every V2 schema change updates both the final clean schema and a data-preserving upgrade path. The recommended cutover
creates a staging V2 database from the authoritative V1 database, preserves UUIDs and relationships, validates it, and
atomically activates it. The source V1 database, SQL backup, byte-for-byte copy, asset references, configuration, and V1
application artifact remain available for rollback.

Required validation includes SQLite integrity and foreign-key checks, migration/schema version, table and relationship
invariants, row-count reconciliation, representative API reads, restart/idempotency, injected failure, and rollback.
The complete strategy and alternatives live in `docs/migration_plans.md`.

The final cutover absorbs album and tenant schema changes. Neither PLAN-01 nor PLAN-02 may treat recreation of the only
live database as migration.

## 4. Operator backup restoration

Restore is a tenant-targeted operator workflow, not a normal browser page. It must:

- require an explicit source and target;
- validate a manifest, checksum, schema compatibility, SQL replay, foreign keys, integrity, and read smoke queries in a
  temporary database;
- block target writes during replacement;
- create a pre-restore safety copy;
- activate atomically and roll back on verification failure;
- leave source and active data untouched on pre-activation failure;
- report operational metadata without catalog contents; and
- retain tested runbooks and quarterly recovery drills.

V2 emergency restore accepts the running schema version only. V1 backups first restore under V1 and then follow the
rehearsed V1-to-V2 migration. Database restoration reconnects intact external assets but does not recover asset
directories lost from disk.

The backend owns free-space calculations and reports required/available storage before mutation. No frontend restore,
inventory, or threshold behavior should be planned.

## 5. Book Bulk Add baseline and shared intake

The refined Books Bulk Add is the accepted reference; no additional book-only workflow or status-filter gap is currently
committed. Preserve:

- batches of 1–50 ISBN items with stable client IDs;
- independent lookup/classification and per-item savepoints;
- explicit handling for owned, wishlist, unshelved, ambiguous, duplicate, validation, stale, and persistence states;
- editable drafts, partial success, retry, local persistence, and navigation protection; and
- Start Next Shelf and Finish behavior.

Shared intake architecture must allow PLAN-01 to supply album identifiers, fields, vocabularies, lookup, and import
payloads without treating ISBN, author, or book status as universal.

## 6. Exact-copy QR labels and scanning

Every label identifies one owned physical copy using:

```text
shade:v1:<media-type>:<uuid>
```

The payload contains no tenant or public URL. Labels are stateless and deterministic; reprinting does not rotate
identity or require print history. Authenticated resolution returns zero/one exact candidate for a Shade label and may
return multiple copies for a commercial identifier.

The first print layout is a sustainability-oriented six-label US Letter sheet arranged two by three. Prototype margins,
gutters, cut guides, printer scaling, and selectable starting position for partially used stock. The approximate label
target is 3×3 inches.

Generation is local. The conventional template uses square modules, a four-module quiet zone, strong contrast, and
error-correction level H. An optional bounded portrait/cameo treatment may not obscure finder patterns. SVG and
print-resolution PNG must encode the same payload. Every template passes automated decode and real supported-phone tests
at minimum print size, ordinary light, and modest angle/distance. Conventional output is the automatic fallback.

The shared scanner understands Shade labels and commercial identifiers. It disambiguates multiple commercial matches,
shows lifecycle ineligibility honestly, and respects Enable Loans. Malformed/unsupported Shade versions and well-formed
unknown/other-tenant labels remain distinct error cases.

## 7. Book availability and reservation

Owners can set `available`, `reserved`, `reading`, `missing`, or `display_only`; `on_loan` remains lifecycle-owned.
Active loans block manual availability changes.

- Missing moves the book atomically to `unknown`.
- Display Only blocks checkout and overrides TBR behavior.
- Reading retains location and overrides TBR Reserved display.
- Reserved/Reading checkout requires an explicit warning and override.
- Configured TBR shelf UUIDs set Reserved on entry and return eligible books to Available on departure.
- Single and bulk location moves apply the rule atomically.
- A distinct general Reserved/will-call shelf stores structured pickup name and optional note.

The owner manages Enable Loans, configured book TBR shelf IDs, and Reserved shelf ID through tenant-scoped settings.

## 8. ISBN not applicable

Book create/edit/Build review supports `isbn_not_applicable`. It is mutually exclusive with a non-empty ISBN. Marking an
ISBN-bearing book not-applicable requires explicit confirmation and clears the ISBN in the same update.

Detail and cleanup show a quiet “ISBN not applicable” value. Missing-ISBN reports exclude these editions. Search and
commercial scanning still require a real ISBN; title/author search and the Shade item QR remain available.

## 9. Human-readable URLs

Human-facing links use readable keys for named resources, such as `?category=thriller`, while APIs retain UUID identity.
Mutable or colliding names require backend-owned unique slugs. Old slugs redirect to the canonical URL after rename.
Unnamed physical copies may retain stable short IDs or UUIDs where no honest unique readable key exists.

The frontend resolves slugs through the backend contract rather than deriving UUIDs from labels.

## 10. Needs Reshelving and contributors

Book Details can mark a book **Needs Reshelving** with a small reason/note without immediately changing catalog data.
Dashboard provides a pinned queue, and the flag clears after physical/catalog placement is corrected. This is owner task
state, not a circulation status or special shelf.

Book create/edit supports optional editors, illustrators, and translators. Roles remain structured and ordered rather
than folded into author text. Book Details omits empty roles and never shows null metadata rows. Values may be added,
changed, or removed later.

## 11. Quote-coordinated Home presentation

Home selects one checked-in author quote per mount. Each production quote maps to curated expressive phrases for New
Additions, Browse/categories, Staff Picks, and later Current Reading while retaining a stable visible functional heading.

Missing mappings use the ordinary heading. Quote content is never interpreted as markup, CSS, executable content, or an
asset path. Quote mappings change section-header treatment only; they do not choose backgrounds, skins, or layouts.

Weather-aware quote selection, quote administration, and backend quote APIs are later work.

## 12. Borrower signature

V2 keeps signature capture unless a bounded prototype proves a concrete supported-phone, compensation, or tenant-safe
storage blocker. Typed full borrower name is always required; signature is optional.

The borrower signs a bounded canvas, may clear/retry or skip, and confirms a transparent PNG no larger than 800×300 and
250 KiB. The frontend stages it through the authenticated loan signature endpoint and supplies the single-use token to
checkout. Checkout/signature association behaves as one compensated operation; unclaimed staging expires.

Confirmed signatures are immutable loan artifacts, tenant-private, retrieved separately as authenticated image bytes,
and deleted with the loan. Loan records retain the acknowledgement text/version shown at signing. Reduced-motion,
touch, keyboard, error, retry, and handoff states require prototype coverage.

## 13. Borrower feedback and Work identity

Check-in requires a 1–5 borrower rating. The loan closes first; an optional written review is added or edited through a
separate idempotent feedback operation so review failure cannot repeat check-in. Owner catalog rating/review/read or
played state remains separate.

Loan cards show full typed borrower name and rating. Review presentation uses initials. Item reads embed count and
nullable average; individual reviews are paginated. Owners can edit or remove feedback.

Every physical item belongs to one media-specific internal Work. Provider IDs are evidence rather than primary identity.
Translations and ordinary editions default to one Work; abridgements, adaptations, and substantially revised works
default to separate Works. Owner Group as Same Work / Separate from Work operations are atomic, previewed, audited,
reversible, and reassign historical aggregates without changing original loans or feedback.

## 14. Media navigation

Home is the library-wide entry hall. Books and albums use typed route families and a persistent media switch. Each area
retains its own URL-backed filters, sort, and position; incompatible filters are never translated across media.

V2 may remain page-to-page rather than simulate rooms. Entering Albums may show a brief turning record; entering Books
may show an open book with pages turning through a splayed arc. Transitions must not delay ready content, block browser
navigation, trap focus, or replace semantic loading/heading content. Reduced-motion users receive a static treatment.

A later version may implement the fuller doorway/hallway room experience.

## 15. Persistent controls and Back to Top

Books and Shelves use the successful mobile control language in a left-aligned wide rail. Phones and smaller tablets,
including small iPads, use the modal. The rail begins at no less than 75rem/1200 CSS pixels of usable width and may move
upward when real content or text zoom would crowd results.

An over-height rail remains sticky beneath the header and scrolls internally with visible overflow affordance. At
unusable viewport heights, fall back to the modal. URL-backed filters apply immediately without a separate Apply step;
existing cancellation/debouncing prevents stale results.

Every progressively appended list shows the shared Back to Top control after another batch loads. It returns to and
focuses the list's search/filter entry, respects reduced motion and safe areas, and never obscures important controls.

## 16. Dashboard analytics

Deepen book analytics using owned data:

- Pages owned and **Pages Turned**;
- books acquired/read this year;
- books and pages read over time; and
- books read by shelf and category.

Charts prioritize comprehension. Physical-library metaphors are welcome only when they remain clearer than conventional
charts. Mobile layouts remain deliberately usable. Do not invent shelf-capacity data.

PLAN-01 owns explicitly scoped album Dashboard fields. Existing book keys remain book-only.

## 17. Home discovery

### New Releases

Surface recently published owned books using existing publication dates. Do not require external release feeds.

### Current Reading

Show books actively being read using existing reading/status data. Compose Current Reading, New Releases, New Additions,
Staff Picks, category discovery, and quote treatment without overcrowding mobile Home.

Cards must handle short, multi-word, long unbroken, and very long titles at 320px and 200% text zoom. Prefer resilient
geometry and natural wrapping over per-title font scaling or marquee motion. Any visible truncation requires an equally
available non-hover path to the full title.

### Surprise Me

Surprise Me remains stretch work. If included, it randomizes existing collection/filter results without adding a complex
recommendation engine or spatial shelf animation. Its omission does not make V2 incomplete.

## 18. Seasonal and decorative personality

V2 supplies one approved book identity, one approved album identity, and restrained seasonal atmosphere. Seasonal
treatments may change bounded backgrounds, accents, typography details, and decoration without changing navigation,
layout semantics, or functionality.

The visual language remains paper, ink, stained wood, plants, glass, brass, binding cloth, catalog cards, shelf labels,
and subtle depth for Books; PLAN-01 translates it for Albums. Decorative elements cannot become required navigation.

Camera ISBN capture should feel native to Shade: wood-brown surround, shared button styling, and accessible focus,
permission, error, reduced-motion, and small-screen states without shrinking the usable viewfinder.

Empty states may use concise library-specific personality while preserving the next action.

## Open visual-design question

What concrete reference designs and assets are approved for the book area, album area, library-wide Home, and each
hosted library identity? Ownership rules, the book/album analogy, performance budgets, and broad visual language are
settled. Implementation still requires an approved brief and asset inventory.

PLAN-01 separately retains the open album location noun question. PLAN-02 depends on the hosted-library subset of this
brief but does not duplicate the question.

## 19. Visual quality gates

Every new surface defines desktop and mobile behavior, works at 320px and 200% text zoom, preserves keyboard/touch
access, exposes meaningful loading/empty/error states, respects reduced motion, and maintains readable covers and
metadata.

Keep the initial critical visual payload around the documented design guardrail, lazy-load noncritical imagery, prefer
CSS/SVG for ornaments where practical, and measure rather than treating decoration as free. A design brief and concrete
asset inventory are required before visual tickets can be estimated.

## 20. Post-V1 observation closeout

After normal V1 use, classify observations as defects, small polish, V2 candidates, or later ideas. Accepted additions
receive user-facing acceptance criteria and required contracts before scheduling. This review closes the release scope;
it does not automatically promote every observation.

## Release gates

- PLAN-01 album contracts and acceptance journeys pass.
- PLAN-02 tenant isolation, per-file migration, CORS, assets, and backup tests pass.
- Every V2 schema change has a clean-install representation and a data-preserving V1 upgrade path.
- Migration rehearsal, injected failure, idempotency, and rollback succeed against representative V1 data.
- Tenant-targeted restore drills cannot replace the wrong library.
- QR conventional/decorative templates pass automated and supported-phone print tests.
- Signature prototype passes or records an approved bounded simplification/deferral.
- Work correction moves historical feedback aggregates correctly.
- Frontend routes, generated OpenAPI, supplementary API guidance, and documentation agree.
- Accessibility, responsive, performance, and post-V1 observation reviews pass.
- The two open visual-design decisions are resolved before their dependent visual tickets are finalized.

## Deferred or later work

- Video, comics, board games, and broader digital-media management.
- Library Journal, On This Day, Book of the Day, and historical resurfacing.
- Weather-based recommendations and weather-aware quote selection.
- Deep time-of-day, reactive lighting/environment, ambient audio, and spatial library simulation.
- External new-release aggregation and complex AI recommendations.
- Selectable skins and free-form theme editing.
- Patron donation/punch-card software and elaborate rewards.
- Cross-device Build-session persistence.
- Third-party image search for barcode-less lookup or missing metadata pending separate privacy/licensing/provider work.
- Borrower-derived discovery beyond accepted feedback summaries.
