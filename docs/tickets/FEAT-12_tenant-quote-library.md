# FEAT-12 -- Tenant-Owned Home Quote Library

**Status:** Blocked on a tenant-scoped backend quote contract.

**Dependency group:** C -- tenant content and Home presentation.

**Depends on:** `FEAT-06` contract conventions, `FEAT-07` isolation evidence, and `FEAT-10`
identity/content boundaries.

**Primary owners:** Backend quote resource, then frontend management and Home integration.

## Objective

Let each library manage its own ordered Home quote collection while preserving safe built-in
fallbacks, predictable functional headings, and strict cross-host isolation.

## Required contract

- Dedicated tenant-scoped quote list/create/read/update/delete and ordering operations with
  stable quote IDs; do not embed an unbounded collection in general library settings.
- Quote text, author/attribution, optional context/source, enabled state, order, and—if
  approved—one complete optional set of Home section-heading phrases.
- A distinct setting or state for deliberately disabling the Home quote area, separate from
  an empty enabled quote list and from request failure.
- An intentional restore-defaults operation with documented replacement/merge behavior and
  concurrency semantics.
- Length, whitespace, duplicate-order, stale-write, and deletion/reorder conflict validation.
  All content is inert plain text.

## Frontend scope

- Add a discoverable **Quote Library** entry under Manage Collection.
- Support add, edit, delete, enable/disable, reorder, preview, and restore defaults with clear
  pending, success, conflict, retry, and confirmation states.
- Home selects one enabled quote per mount. An empty enabled custom list uses built-in defaults;
  deliberate area disablement renders no quote area; API failure uses a safe built-in fallback
  and does not look like an intentional empty state.
- Built-in quotes retain curated checked-in heading mappings. A custom quote without every
  required phrase uses all stable functional headings; never mix a partial custom mapping
  with mapped headings.
- Stable functional headings remain visible text beneath any expressive mapped headings.

## Acceptance criteria

- [ ] CRUD, enable/disable, reorder, restore-defaults, empty, failure, conflict, and concurrent
      edit behavior are contract- and UI-tested.
- [ ] Quote text and attribution are trimmed, required, length-bounded, plain text, and safely
      wrapped at mobile widths and 200% zoom; context/source follows documented optional rules.
- [ ] Reorder and deletion either update optimistically with rollback or remain explicitly
      pending; the UI never presents a failed order as saved.
- [ ] Home chooses once per mount and does not reshuffle because unrelated queries render.
- [ ] Complete custom heading sets apply as a unit; incomplete/invalid sets use the full stable
      heading set.
- [ ] Two-known-host plus unknown-host tests prove quote data, order, previews, query caches,
      and fallback decisions do not cross hostname boundaries.
- [ ] Built-in fallback content is versioned and restoration behavior is deterministic.
- [ ] No markup, CSS, executable content, remote URLs, or asset paths are rendered from quote
      fields.

## UI questions requiring a product decision

1. Does **disable** apply per quote only, or is there also a clearly separate switch for the
   entire Home quote area? PLAN-02 requires the latter state to be distinguishable.
2. Does restore defaults replace all custom quotes, append missing defaults, or reset only
   built-in records? The confirmation must state any destructive result exactly.
3. Is drag-and-drop required for ordering, or should accessible Move Up/Down controls be the
   primary interaction with optional drag enhancement?
4. Which Home sections participate in custom heading mappings at launch, especially Current
   Reading and New Releases as those modules ship?
5. Are context and source one field or distinct fields, and how are they labeled when the
   owner knows one but not the other?
6. Should Preview reproduce the complete Home heading composition or show a compact card with
   all mapped phrases?
7. Are duplicate quote/author pairs allowed intentionally?

## Out of scope

Weather-aware selection, rich text, custom CSS/assets, quote analytics, per-user quotes,
automatic external quote ingestion, and changes to Home information architecture.
