# PLAN-02 -- Multi-Tenancy and Library Identity

**Status:** Planning decomposition of remaining multi-tenant V2 work. Hostname routing,
unknown-host UX, and the initial Andy/Jamie theme entry points are shipped baseline.

**Backend alignment:** Library setup/settings contracts and tenant-safe operational work in
the backend remaining-features plan. Production multi-host deployment remains orchestrator
`FEAT-08`.

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
Book features remain in PLAN-03; album/music features remain in `FEAT-01` through `FEAT-06`.

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

## 1. Per-library first-run setup

**State:** Committed remaining.

A genuinely uninitialized library enters guided setup using explicit library-scoped state;
an API or bootstrap failure must never be interpreted as a new empty library.

Setup selects a supported medium, offers its canonical TSV bootstrap or guided
location-by-location Build Mode, creates/selects the first assignable location, preserves
unresolved rows, supports another location, and permits explicit completion even if no item
was added. Completion routes to Dashboard and Manage Collection provides a later resume
entry.

The backend owns durable setup state and idempotent completion. The frontend owns transient
wizard state and composes the shipped book intake or `FEAT-01` album intake rather than
creating another catalog form.

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
2. Choose three to five words for the library's personality (for example: cozy, scholarly,
   playful, modern, gothic, bright, quiet, eclectic, nostalgic).
3. Which two or three colors feel most like the library? Are there colors the owner dislikes
   or needs avoided?
4. Should the palette feel light, dark, warm, cool, muted, saturated, or mixed?
5. What visual setting best represents the library: a reading room, study, neighborhood
   shop, archive, garden room, music room, or something else?
6. Name a few objects or motifs that belong in that setting (plants, lamps, animals, local
   landmarks, paper textures, wood species, patterns, keepsakes, and so on).
7. What should the header or hero image communicate at first glance? If the owner has a
   preferred photograph, illustration, logo, or personal asset, can they provide it and
   confirm it may be used?
8. Does the owner prefer refined serif, friendly handwritten accents, clean modern type, or
   another typographic mood? Cursive/decorative type will remain accent-only.
9. Should the interface voice feel formal, warm, witty, whimsical, understated, or another
   tone? Provide one example phrase they would enjoy seeing and one they would dislike.
10. Are there cultural, religious, family, accessibility, or personal symbols and themes to
    include or avoid?
11. Are there seasonal touches they would enjoy, and are there seasons or holidays that
    should not be represented?
12. Which existing Jamie or Andy identity details feel useful as references, and which would
    feel wrong for this library?

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

**State:** Frontend behavior shipped; deployment completion remains orchestrator-owned.

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

1. **Library setup/settings contract:** durable setup state, idempotent completion, Enable
   Loans, TBR IDs, and Reserved shelf ID.
2. **Guided multi-media setup UI:** TSV validation, first location, book/album Build Mode
   composition, completion, and resume.
3. **Tenant-safe browser state audit:** persistence namespaces, cache/object URL boundaries,
   diagnostics, and multi-host automated tests.
4. **Library identity cleanup:** remove unintended Shade/Andy/Jamie references and centralize
   explicit per-library names, copy, tokens, and assets.
5. **Per-library identity packages:** run the questionnaire and implement one bounded visual
   brief per additional owner without layout changes.
6. **Tenant Quote Library contract and menu:** quote CRUD, enable/disable, ordering,
   restore-defaults behavior, Home selection/fallback, optional complete heading mappings,
   and cross-host isolation tests.
7. **Production multi-host handoff:** proxy/TLS/CORS/asset/unknown-host verification with
   orchestrator `FEAT-08`.
8. **Tenant migration and restore drill:** upgrade, failure injection, rollback, wrong-tenant
   prevention, and asset reconnection runbook.

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
