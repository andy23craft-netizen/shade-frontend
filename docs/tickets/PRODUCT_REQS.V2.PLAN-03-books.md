# PLAN-03 -- Remaining Book Features

**Status:** Planning decomposition of remaining book-side V2 scope. Book Build Mode and the
current book catalog, circulation, discovery, and dashboard surfaces are shipped baseline.

**Backend alignment:** Unshipped book surfaces in the backend remaining-features plan and
`V2-proposed-contract.md` until they ship into OpenAPI.

**Authority:** `docs/product-docs/PRODUCT_REQS.V2.definitive.md` remains the product source of
truth. Current tickets own their feature details; OpenAPI and `API-for-FE.md` own shipped
transport behavior.

**Last updated:** September 5, 2026

## Goal

Complete the new V2 features for the book side of Shade: physical-copy handling, richer
catalog metadata and navigation, borrower experience, reading discovery, analytics, and book
visual refinement.

## Scope boundary

This plan owns only book-facing behavior. Music/album work lives in ready tickets `FEAT-01`
through `FEAT-05` and deferred tickets `FEAT-90` through `FEAT-92`. Multi-tenancy,
per-library setup/settings, hosted-library identity, production
multi-host delivery, and tenant-safe restore live in PLAN-02.

Plan 3 may consume shared contracts, but its acceptance criteria describe the book
implementation only. It does not own album participation or tenant configuration.

## Shipped baseline (do not re-plan)

- Book Build Mode at `/books/bulk-add`, including lookup/import, editable drafts, partial
  success, recovery, and shelf-to-shelf continuation.
- Books browse/detail/create/edit, covers, Shelves, Collections, Wishlists, Loans,
  checkout/check-in, reading state, Dashboard book papers, and Home book discovery.
- Hostname-selected library context is a PLAN-02 baseline dependency, not book scope.

## 1. Exact-copy book QR labels and scanning

**State:** Committed remaining.

Generate and reprint one stable label per owned book copy using
`shade:v1:book:<book_id>`. Provide single and explicit bulk generation, a six-label US Letter
browser-print layout, selectable starting position, conventional high-contrast output, and
phone-tested optional decoration.

Multiple owned copies of the same commercial edition may share an ISBN or other edition
metadata, but every copy retains its own `book_id`, shelf, lifecycle, loan history, and QR
label. Create/import and duplicate resolution must preserve that distinction rather than
silently collapsing copies.

Authenticated scanning resolves an exact book copy; commercial ISBNs may require copy
selection. Scanner-driven circulation follows book state, active-loan context, and PLAN-02's
Enable Loans setting. Missing and Display Only remain ineligible; Reserved and Reading use
the defined warning/override flow.

## 2. Book availability and reservation

**State:** Committed remaining.

Book Details and Browse bulk actions allow `available`, `reserved`, `reading`, `missing`, and
`display_only`; `on_loan` remains lifecycle-owned and active loans block manual changes.

- Missing moves the book atomically to `unknown`.
- Display Only blocks checkout and overrides TBR behavior.
- Reading retains location and overrides TBR Reserved display.
- Reserved/Reading checkout requires an explicit warning and override.
- Entering a PLAN-02-configured TBR shelf applies Reserved atomically; leaving all configured
  TBR shelves returns an eligible book to Available.
- The PLAN-02-configured general Reserved/will-call shelf uses structured pickup name and an
  optional note.

## 3. ISBN not applicable

**State:** Committed remaining.

Book create/edit/Build review supports `isbn_not_applicable`, mutually exclusive with a
non-empty ISBN. Marking an ISBN-bearing book not applicable requires confirmation and clears
the ISBN in the same update. Detail and cleanup show “ISBN not applicable”; missing-ISBN
reports exclude these editions.

## 4. Human-readable book URLs

**State:** Committed remaining.

Human-facing book catalog links use readable backend-owned keys for named resources such as
categories and shelves while APIs retain UUID identity. Mutable or colliding names require
unique slugs and rename redirects. The frontend resolves canonical values through the
contract and never guesses UUIDs from labels.

## 5. Needs Reshelving

**State:** Committed remaining.

Book Details can mark and clear **Needs Reshelving** with a small reason/note without changing
catalog data. Dashboard provides a pinned book queue. This is owner task state, not a
circulation status or special shelf.

## 6. Book contributors and absent optional fields

**State:** Committed remaining.

Book create/edit supports ordered editors, illustrators, and translators in addition to
required authors. Detail and forms render only contributor roles and optional fields that
contain meaningful values.

Empty optional values—including editor, illustrator, translator, acquisition source, and
similar metadata—must not render as `null`, the word “null,” or empty display rows. Save
payloads follow the authoritative omission/clear semantics instead of serializing accidental
nulls.

## 7. Borrower name presentation

**State:** Ready in `FEAT-30_borrower-name-presentation.md`.

Book loan cards present the existing typed borrower name with the shared accessible
cursive-style treatment. Names remain selectable semantic text with a legible fallback and
responsive handling for long values. There is no handwritten-signature feature.

## 8. Book borrower feedback and Work identity

**State:** Committed remaining.

Book check-in requires a 1--5 borrower rating. The loan closes first; an optional written
review uses a separate idempotent operation. Borrower feedback never changes owner rating,
review, or read state. Loan cards show the full typed name and rating; reviews use borrower
initials and an accessible disclosure.

Every physical book belongs to one book Work. The owner can preview and perform **Group as
Same Work** / **Separate from Work** corrections atomically, auditably, and reversibly.
Historical aggregates move without rewriting original loans or feedback.

## 9. Persistent book controls and Back to Top

**State:** Committed remaining.

Books and applicable book-oriented catalog lists use the shared narrow modal control language
in a persistent left rail at no less than 75rem/1200 CSS pixels. URL-backed filters apply
immediately, bulk-selection actions join the rail, and cancellation/debouncing prevents stale
results.

Progressively appended book, loan, collection, wishlist, cleanup, and shelf views use one
accessible Back to Top behavior with focus restoration, reduced-motion handling, safe-area
placement, and no obscured controls.

## 10. Quote-coordinated book discovery

**State:** Committed remaining, frontend-only.

Each checked-in Home quote maps to curated expressive headings for book-backed New Additions,
Browse/categories, Staff Picks, and Current Reading, with the stable functional label visibly
beneath it. Missing mappings fall back to ordinary headings. Quote data remains inert content
and affects section headers only.

Weather-aware selection remains V3. Mixed-media Recent Additions belongs to `FEAT-92`; this
section owns the book-side heading treatment and composition.

## 11. Book Dashboard analytics

**State:** Committed remaining.

Add Pages Owned, Pages Turned, books acquired/read this year, books/pages read over time, and
books read by shelf/category. Charts prioritize comprehension and intentional mobile layout.
Do not invent shelf-capacity data or merge album metrics into book keys.

## 12. Book Home discovery

**State:** Committed remaining.

- **New Releases:** recently published owned books using stored publication dates, without an
  external release feed.
- **Current Reading:** books actively being read using existing reading/status data, composed
  deliberately with the other Home modules at 320px and 200% text zoom.
- **Surprise Me:** stretch only; if promoted, choose from owned book/filter data without a
  complex recommendation engine.

## 13. Book visual identity and camera polish

**State:** Committed remaining.

Give the book area one cohesive private-library identity plus restrained seasonal atmosphere
without changing navigation or layout semantics. This is the shared book/media identity, not
the per-owner color/personality package owned by PLAN-02.

Camera ISBN capture receives native Shade styling—wood-brown viewfinder surround, shared
buttons, and complete focus, permission, error, reduced-motion, and small-screen states—while
preserving scan usability. Book empty states may use concise personality copy without hiding
the next action.

## 14. Book observation and release closeout

Accepted post-V1 book observations receive acceptance criteria and required contracts before
scheduling. All book work must define desktop/mobile behavior, work at 320px and 200% text
zoom, preserve keyboard/touch access, expose meaningful loading/empty/error states, respect
reduced motion, and stay within the definitive visual performance guardrails.

## Ticket decomposition

1. Multiple-owned-copy creation/import and duplicate resolution.
2. Book QR generation and six-up print layout.
3. Book code resolution, copy disambiguation, and scan-to-circulation.
4. Manual availability and checkout override behavior.
5. TBR automation and Reserved/will-call book behavior using PLAN-02 settings.
6. ISBN-not-applicable create/edit/Build/detail/cleanup behavior.
7. Human-readable book catalog URLs and backend-owned slugs.
8. Needs Reshelving mark/clear and Dashboard queue.
9. Optional book contributor roles.
10. Omit absent optional fields from book forms, payloads, and rendered metadata.
11. `FEAT-30` borrower-name presentation on book loan cards.
12. Required book borrower rating and optional review.
13. Book Work grouping and correction.
14. Persistent book controls and shared Back to Top behavior.
15. Quote-coordinated book Home headings.
16. Book Dashboard analytics.
17. New Releases and Current Reading on Home.
18. Book visual identity, seasonal treatment, and camera polish.
19. Book observation, accessibility, responsive, performance, and release closeout.

## Completion criteria

- Every remaining item above ships for books against an authoritative contract.
- PLAN-02 settings correctly govern book circulation/TBR behavior without moving tenant
  configuration into book code.
- Album behavior is neither implemented nor used as acceptance for this plan.
- Book routes, generated OpenAPI, supplementary guidance, tests, and documentation agree.
- Accessibility, responsive, performance, QR phone testing, and book observation review pass.

## Deferred

- Album/music work and mixed-media Home feed (ready `FEAT-01` through `FEAT-05`; deferred
  `FEAT-90` through `FEAT-92`).
- Multi-tenant setup, identity, settings, deployment, and restore (PLAN-02).
- Video, comics, board games, digital-media management, and album Collections.
- Weather-aware discovery, historical resurfacing, spatial simulation, ambient audio,
  selectable skins, and free-form theme editing.
- External new-release feeds, complex recommendations, and unpromoted Surprise Me work.
