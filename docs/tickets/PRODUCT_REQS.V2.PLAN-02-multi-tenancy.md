# PLAN-02 -- Multi-Tenancy and Library Identity

**Status:** Planning decomposition of remaining multi-tenant V2 work. Hostname routing,
unknown-host UX, and the initial Andy/Jamie theme entry points are shipped baseline.

**Backend alignment:** Library setup/settings contracts are shipped in backend 1.1.3 and
checked into this repository's OpenAPI; tenant-safe operational work remains. All three
approved production library sites are live; orchestrator `FEAT-08` retains only dependent
isolation/identity/content verification and runbook evidence.

**Authority:** `docs/product-docs/PRODUCT_REQS.V2.definitive.md` remains the product source of
truth. OpenAPI and `API-for-FE.md` own shipped transport behavior.

**Last updated:** September 5, 2026

## Goal

Let each hosted library behave as a separate, safe, recognizable home library while every
tenant uses the same page structure, controls, routes, and accessibility model.

## Scope boundary

This plan owns:

- per-library first-run setup state and guided Build Mode orchestration;
- library-scoped settings, including Enable Loans and configured TBR/Reserved shelf IDs;
- strict tenant-safe browser persistence and the absence of cross-library state leakage;
- hostname-specific naming, copy, color, typography accents, hero/header art, and other
  lightweight identity treatments;
- a tenant-owned editable Home quote library;
- removal of Andy/Shade-specific presentation from other tenants unless explicitly intended;
- unknown-host behavior and production multi-host deployment handoff;
- tenant-targeted migration, restore, and asset-reconnection safety.

This plan does not allow tenant themes to rearrange pages, change information architecture,
rename shared administrative concepts, remove required state, or alter feature eligibility.
Book features remain in PLAN-03; album/music features remain in ready tickets `FEAT-01`
through `FEAT-05` and deferred tickets `FEAT-90` through `FEAT-92`.

## Shipped baseline (do not re-plan)

- The hostname's leftmost label selects the library context; the public `shade` alias maps to
  Andy.
- Browser requests use same-origin `/api` and the shared Bearer token. Browser JavaScript
  never sends `X-Forwarded-Host` or `Library-Username`.
- Andy and Jamie have theme-token entry points and Jamie has initial header/hero identity
  work.
- Unknown hosts receive a deliberate landing screen rather than raw API error prose.
- Development supports the documented `*.localhost` hosts.
- There is no login, runtime tenant switcher, tenant discovery, or self-service tenant
  registration.
- Tenant-scoped `GET /library/setup`, `POST /library/setup/complete`, and `GET` / `PATCH
  /library/settings` are shipped, together with generated frontend types and the base
  `libraryApi` adapter. The settings fields are Enable Loans, book TBR shelf IDs, and one
  optional Reserved shelf ID.

## 1. Per-library first-run setup

**State:** Committed remaining.

A genuinely uninitialized library enters guided setup using explicit library-scoped state;
an API or bootstrap failure must never be interpreted as a new empty library.

Setup selects a supported medium, offers its canonical TSV bootstrap or guided
location-by-location Build Mode, creates/selects the first assignable location, preserves
unresolved rows, supports another location, and permits explicit completion even if no item
was added. Completion routes to Dashboard and Manage Collection provides a later resume
entry.

The shipped backend owns durable setup state and completion. The frontend owns transient
wizard state and composes the shipped book and album Bulk Add engines rather than creating
another catalog form.

### TSV bootstrap

Use one canonical, versioned UTF-8 TSV template per supported medium. Server validation
previews ready, warning, and rejected totals before commit. Correction happens in the source
file and is re-imported; Shade does not become a spreadsheet editor.

## 2. Library-scoped settings

**State:** Committed remaining.

Manage Collection exposes settings that genuinely vary by library:

- **Enable Loans**, which controls whether new checkout/check-in entry points are offered
  without deleting history;
- configured book TBR shelf IDs; and
- the configured general Reserved/will-call shelf ID.

Settings use stable resource IDs, never display names, and remain isolated to the current
library. PLAN-03 owns the resulting book status behavior; album tickets consume Enable Loans
where applicable.

## 3. Tenant-safe client state and presentation

**State:** Committed remaining.

All locally persisted setup and Build Mode state is namespaced by library identity and media
type. Switching host context must never restore another library's destination, drafts,
lookup results, save outcomes, filters, or private imagery.

No tenant page should accidentally reference **Shade**, Andy, Jamie, or another owner's name,
tagline, hero, asset, or library-specific copy unless that value is explicitly configured for
the active library. Shared product naming remains allowed where “Shade” intentionally names
the application rather than Andy's library identity.

Automated coverage should exercise at least two known hosts plus an unknown host and verify
that identity, cached data, object URLs, diagnostics, and browser persistence do not cross
library boundaries.

## 4. Lightweight hosted-library identity

**State:** Committed remaining, delivered one library at a time.

Each hosted library may have a lightweight identity package consisting of:

- a color scheme and accessible contrast pairs;
- header and Home hero artwork;
- a short library name, tagline, and bounded personality copy;
- restrained typography accents with legible fallbacks;
- small decorative motifs, textures, stamps, or empty-state phrases; and
- optional seasonal variants within the shared V2 seasonal rules.

Identity packages must use the same component structure, navigation, content hierarchy,
responsive breakpoints, controls, focus order, and semantic labels. They are personality
matches, not alternate applications or selectable skins. Asset and art-direction decisions
can be made per library without waiting for a complete cross-library brief.

### Design questions for each library owner

Send the following questions to each additional library owner. Their answers should produce
a short identity brief, not a feature request or page redesign.

1. What should the library be called in the header and Home hero? Is there a short tagline?
Dalmo: Dalmo's Libary. No. 
Jamie: Jamie's Library. "What's the vibe?"

2. Choose three to five words for the library's personality (for example: cozy, scholarly,
   playful, modern, gothic, bright, quiet, eclectic, nostalgic).
Dalmo: Eclectic, Delightful, enlightening. 
Jamie: 

3. Which two or three colors feel most like the library? Are there colors the owner dislikes
   or needs avoided?
Dalmo: Teal and Magenta.
Jamie: Orange and 

4. Should the palette feel light, dark, warm, cool, muted, saturated, or mixed?
Dalmo: Cheerful and inviting
Jamie: 

5. What visual setting best represents the library: a reading room, study, neighborhood
   shop, archive, garden room, music room, or something else?
Dalmo: A sunny reading room 
Jamie: 

6. Name a few objects or motifs that belong in that setting (plants, lamps, animals, local
   landmarks, paper textures, wood species, patterns, keepsakes, and so on).
Dalmo: Paper textures, sacred geometry, foreign language scripts
Jamie: 

7. What should the header or hero image communicate at first glance? If the owner has a
   preferred photograph, illustration, logo, or personal asset, can they provide it and
   confirm it may be used?
Dalmo: existing logo
Jamie: existing logo

8. Does the owner prefer refined serif, friendly handwritten accents, clean modern type, or
   another typographic mood? Cursive/decorative type will remain accent-only.
Dalmo: clean and elegant, easy to read, approachable typeface
Jamie: 

9. Should the interface voice feel formal, warm, witty, whimsical, understated, or another
   tone? Provide one example phrase they would enjoy seeing and one they would dislike.
Dalmo: understated and minimalistic, virtually invisible/frictionless, intuitive UI
Jamie: 

10. Are there cultural, religious, family, accessibility, or personal symbols and themes to
    include or avoid?
Dalmo: as appropriate, incorporate symbols from christian traditions and integral metatheory.
Jamie: 

11. Are there seasonal touches they would enjoy, and are there seasons or holidays that
    should not be represented?
Dalmo: N/A 
Jamie: 

12. Which existing Jamie or Andy identity details feel useful as references, and which would
    feel wrong for this library?
Dalmo: reference dalmo.ai , hiredalmo.com , and integral.dalmo.ai for design references. 
Jamie: 

### Identity brief produced from the answers

Record only the resulting library name/tagline, palette tokens, typography accents, approved
assets, bounded motifs/copy, accessibility notes, and explicit avoid list. Do not turn owner
answers into different layouts, routes, permissions, workflows, or data models.

## 5. Tenant-owned Home quote library

**State:** Committed remaining; requires a tenant-scoped backend quote resource.

Manage Collection includes a discoverable **Quote Library** entry. Each library owner can
add, edit, remove, enable/disable, reorder, and preview that tenant's Home quotes. A quote
contains quote text, author/attribution, and optional context/source. The interface also
offers an intentional restore-defaults action with clear confirmation.

Quotes must be stored by the backend rather than only in browser storage so they remain
consistent across devices and isolated by tenant. Prefer dedicated library-quote CRUD and
ordering routes over embedding an unbounded quote collection inside the general library
settings payload. Stable quote IDs preserve editing and ordering; the browser must never
send or choose tenant identity.

Home continues to choose one enabled quote per mount. Empty-list behavior must be explicit:
use the built-in default quote collection unless the owner has deliberately disabled the
Home quote area. API failure retains a safe built-in fallback and must not be interpreted as
an intentionally empty library.

The quote-coordinated heading feature must remain predictable with owner-created content:

- built-in quotes may retain their checked-in curated section-heading mappings;
- a custom quote without complete mappings uses the stable functional Home headings;
- custom section-heading phrases may be supported as optional fields, but incomplete sets
  fall back as a unit rather than mixing mapped and unmapped headings; and
- quote text, attribution, context, and heading phrases are inert plain text, never markup,
  CSS, executable content, or asset paths.

Validation should define sensible length limits, trim whitespace, reject an empty quote or
author, and preserve accessible wrapping at supported mobile widths and 200% text zoom.
Deletion/reordering should provide clear optimistic or pending states and recover honestly
from conflicts. Automated tests must prove that quotes, ordering, defaults, and cached state
do not cross library hostnames.

## 6. Production multi-host handoff

**State:** Substantially shipped. Andy/Shade, Dalmo, and Jamie are live; final verification
depends on the tenant-state, identity-package, and Quote Library tickets.

Production must route every approved hostname through trusted TLS/proxy configuration that
sets tenant context server-side. The browser continues to send no tenant header. CORS,
unknown-host behavior, asset delivery, diagnostics, and SPA fallback must be verified for
every configured host. There is no ordinary tenant switcher.

## 7. Tenant-safe migration and restore

**State:** Committed remaining backend/ops gate; no ordinary frontend restore page.

Every schema change needs a clean-install representation and a rehearsed, data-preserving
upgrade path. Restore requires explicit source and target tenant, validates before mutation,
creates a safety copy, replays and integrity-checks in temporary space, activates atomically,
and rolls back on failure. It must never infer a target from recent activity.

Database restore reconnects intact tenant-owned cover/artwork directories by UUID but does
not recover asset files lost from disk. Frontend work is limited to preserving compatibility;
do not add backup download, restore inventory, path entry, or threshold UI.

## Ticket decomposition

### Group A -- tenant foundations

1. [`FEAT-06 -- Library Setup and Settings Frontend Integration`](FEAT-06_library-setup-and-settings-contract.md):
   add query/mutation integration and the settings UI for the shipped durable setup state,
   Enable Loans, TBR IDs, and Reserved shelf ID contract.
2. [`FEAT-07 -- Tenant-Safe Client State Audit`](FEAT-07_tenant-safe-client-state-audit.md):
   persistence namespaces, cache/object URL boundaries, diagnostics, and multi-host automated
   tests. This can proceed in parallel with `FEAT-06`.

### Group B -- setup and shared identity

3. [`FEAT-09 -- Guided Multi-Media Library Setup`](FEAT-09_guided-multi-media-library-setup.md):
   TSV validation, first location, book/album Build Mode composition, completion, and resume.
   This depends on both Group A tickets and the applicable media intake engines.
4. **FEAT-10 -- Library Identity Cleanup and Centralization (shipped):** unintended
   owner-specific references were removed and explicit names, copy, tokens, and assets were
   centralized. The retained-reference record and product decisions live in the
   [library identity audit](../technical-reference/library-identity-audit.md).

### Group C -- tenant presentation and content

5. [`FEAT-11 -- Per-Library Identity Packages`](FEAT-11_per-library-identity-packages.md):
   run the questionnaire and implement one bounded visual brief per additional owner without
   layout changes. This depends on `FEAT-10`; each owner's delivery is independently shippable.
6. [`FEAT-12 -- Tenant-Owned Home Quote Library`](FEAT-12_tenant-quote-library.md): quote
   CRUD, enable/disable, ordering, restore-defaults behavior, Home selection/fallback, optional
   complete heading mappings, and cross-host isolation tests. This depends on the Group A
   isolation/contract conventions and `FEAT-10`'s content boundaries.

### Group D -- release and operations gates

7. [`FEAT-08 -- Production Multi-Host Handoff`](FEAT-08_production-multi-host-handoff.md): the
   three production sites are live. Remaining work is the dependent cross-host state,
   identity, and quote verification plus final smoke/rollback runbook evidence. The existing
   product-wide `FEAT-08` identifier is intentionally preserved.
8. [`FEAT-13 -- Tenant Migration and Restore Drill`](FEAT-13_tenant-migration-and-restore-drill.md):
   upgrade, failure injection, rollback, wrong-tenant prevention, and asset reconnection
   runbook. Final execution waits for all tenant-scoped V2 schema work.

## Completion criteria

- A new library can complete or resume setup without false empty-library detection.
- Settings and browser-persisted state remain library-scoped.
- Known-host and unknown-host tests demonstrate no cross-library data or identity leakage.
- Each hosted library has an approved accessible palette and bounded identity package using
  the shared layout and component system.
- Each library can manage its own quote collection, with deterministic defaults/fallbacks
  and no quote or cache leakage between hosts.
- No tenant sees another tenant's owner-specific name, copy, hero, or decorative assets.
- Production host routing and tenant-safe migration/restore drills pass.

## Deferred

- Runtime tenant switching, self-service tenant creation, accounts, roles, or per-user auth.
- Tenant-specific page layouts, feature forks, navigation structures, or custom data models.
- Selectable skins, a free-form theme editor, and deep reactive environments.
