# FEAT-83 -- Human-Readable Book Catalog Links

**Status:** Blocked on `BACKEND-HANDOFF-PLAN-03` readable-key and redirect contracts.

**Depends on:** Backend-owned canonical keys for books, shelves, and categories.

## Objective

Use recognizable, shareable book-area URLs while retaining UUIDs for API identity and mutation transport.

## Acceptance criteria

- [ ] Human-facing category, shelf, and book links use canonical backend-owned readable keys wherever names are suitable.
- [ ] The frontend resolves keys through the API and never derives UUIDs or canonical slugs from labels.
- [ ] Renames preserve old links through contract-defined redirects or alias resolution and replace the URL with the canonical value.
- [ ] Collisions, Unicode, case, percent encoding, malformed keys, unknown keys, and cross-tenant keys are handled explicitly.
- [ ] URL-backed filters, browser history, copied links, reloads, and canonicalization are tested.
- [ ] UUID transport remains internal and existing UUID links have a documented compatibility path.

## Out of scope

Public sharing, unauthenticated routes, vanity domains, and frontend-owned slug generation.

## Open questions

1. Which exact V2 URLs must become readable: category and shelf filters only, or Book Details too?
- Category and shelf at a minimum. If book details isn't prohibitive, that would be nice, too. 

2. How long must renamed-key aliases and existing UUID links remain valid?
- I'm not sure i know what you mean. If you mean links that may have already been sent, they can be dead as soon as this launches. 
