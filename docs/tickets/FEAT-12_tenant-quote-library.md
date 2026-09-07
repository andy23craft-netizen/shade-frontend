# FEAT-12 -- Tenant-Owned Home Quote Library

**Status:** Not implemented. Blocked on the tenant-scoped backend `/quotes` contract
(see backend `FEAT-12_tenant-quote-library-backend.md`). Checked-in OpenAPI has no quote
paths; `API-for-FE.md` has no quote guidance.

**Dependency group:** C -- tenant content and Home presentation.

**Depends on:** Shipped FEAT-10 identity/content boundaries; FEAT-07-style hostname isolation
evidence for query caches; backend quote resource + FEAT-13 forward migration before any SPA
client may assume the table exists. Coordinated heading consumption for backend-owned defaults
aligns with `FEAT-52` once that surface ships.

**Primary owners:** Backend quote resource first, then frontend management UI and Home
integration.

## Current baseline (do not re-implement)

- Home still selects from the checked-in pool in `src/features/home/homeQuotes.ts`
  (`text`, `author`, `context`) once per mount, with optional expandable context.
- Identity packages gate the quote area via `personalityCopy.homeQuote` /
  `libraryBranding.showHomeQuote` (Andy on; Dalmo and Jamie off). That is presentation
  identity, not a tenant quote-library setting.
- Manage Collection has no Quote Library entry. There is no quotes API client, query key, or
  management route.

## Objective

Let each library manage its own ordered Home quote collection while preserving safe built-in
fallbacks, predictable functional headings, and strict cross-host isolation.

## Required contract (align with backend FEAT-12)

Frozen enough to design against; remaining length/conflict-code details land with OpenAPI:

- Dedicated authenticated `/quotes` list/create/read/update/delete plus atomic order and
  restore-defaults. Stable `quote_id` values. Do not embed the collection in
  `/library/settings`.
- Fields: quote text, attribution, optional nullable `context` (one field -- not a separate
  source), per-quote enabled state, order, and row/collection revisions for conflict-safe
  writes. All content is inert plain text.
- No global Home quote-area disable setting. Empty or all-disabled enabled lists are a
  successful response that tells Home to use checked-in built-in defaults; API failure uses
  the same safe fallback and must not look like that intentional empty/disabled outcome.
- Restore-defaults atomically replaces the tenant library with the versioned backend-owned
  default set (deterministic IDs, including complete heading mappings on defaults).
- Backend-owned defaults may carry a complete curated Home heading set. Manually created
  tenant quotes omit heading mappings; Home falls back to the full stable functional heading
  set. Never mix a partial custom mapping with mapped headings.
- Reject duplicate normalized `(quote_text, attribution)` pairs within a tenant. Document
  length, whitespace, stale-write, and reorder/restore conflict codes.

## Frontend scope

- Add a discoverable **Quote Library** entry under Manage Collection.
- Support add, edit, delete, enable/disable (per quote), reorder, preview, and restore
  defaults with clear pending, success, conflict, retry, and confirmation states. Restore
  confirmation must state that custom quotes are replaced.
- Home selects one enabled quote per mount from the tenant list when present. Empty or
  all-disabled lists and request failure both use checked-in built-ins; distinguish those
  outcomes in UI/tests where the contract makes them distinguishable.
- Respect identity `showHomeQuote`: libraries with the quote treatment off keep the area
  hidden even after a quote library exists.
- Built-in / backend-default quotes may use curated heading mappings (`FEAT-52`). Custom
  quotes without a complete set use all stable functional headings.
- Stable functional headings remain visible text beneath any expressive mapped headings.

## Acceptance criteria

- [ ] CRUD, enable/disable, reorder, restore-defaults, empty/all-disabled, failure, conflict,
      and concurrent edit behavior are contract- and UI-tested against the shipped OpenAPI.
- [ ] Quote text and attribution are trimmed, required, length-bounded, plain text, and safely
      wrapped at mobile widths and 200% zoom; optional `context` follows documented null/blank
      rules.
- [ ] Reorder and deletion either update optimistically with rollback or remain explicitly
      pending; the UI never presents a failed order as saved.
- [ ] Home chooses once per mount and does not reshuffle because unrelated queries render.
- [ ] Complete default heading sets apply as a unit; custom or incomplete sets use the full
      stable heading set.
- [ ] Two-known-host plus unknown-host tests prove quote data, order, previews, query caches,
      and fallback decisions do not cross hostname boundaries.
- [ ] Built-in frontend fallback content remains versioned/checked-in; restore behavior matches
      the backend versioned default set.
- [ ] No markup, CSS, executable content, remote URLs, or asset paths are rendered from quote
      fields.

## UI questions still needing a product decision

1. Is drag-and-drop required for ordering, or should accessible Move Up/Down controls be the
   primary interaction with optional drag enhancement?
2. Should Preview reproduce the complete Home heading composition or show a compact card with
   all mapped phrases?

## Resolved (do not reopen here)

- No separate global disable for the Home quote area (backend FEAT-12).
- Restore replaces all custom quotes with versioned defaults.
- `context` is a single optional field; no distinct `source`.
- Duplicate quote/author pairs are rejected within a tenant.
- Participating heading sections for defaults: New Additions, Browse/categories, Staff Picks;
  Current Reading and New Releases when those Home modules ship (`FEAT-52` / `FEAT-54`).

## Out of scope

Weather-aware selection, rich text, custom CSS/assets, quote analytics, per-user quotes,
automatic external quote ingestion, a global quote-area settings flag, and changes to Home
information architecture.
