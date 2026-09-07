# FEAT-48 -- Absent Optional Book Metadata

**Status:** Ready, with contributor fields completed after `FEAT-47`.

**Depends on:** Shared BookForm/model, detail metadata, cards, lookup application, and generated OpenAPI types.

## Objective

Apply one audited omission/clear/display policy so absent optional book metadata never renders or serializes accidentally.

## Acceptance criteria

- [ ] Inventory every optional Book create/update/read field and record its omit, clear, blank, and display semantics from OpenAPI plus `API-for-FE.md`.
- [ ] Details, cards, lists, cleanup, Collections, Wishlists, and intake omit empty rows and never show `null`, “null,” or placeholder punctuation.
- [ ] Forms normalize whitespace and send only contract-valid minimal updates; explicit clear uses the field-specific supported value.
- [ ] `shelf_name`, `category_ids`, and `author_ids` preserve their documented non-null update rules.
- [ ] Lookup drafts and malformed legacy values degrade safely without hiding required missing-data prompts.
- [ ] Table-driven unit coverage protects every audited field and role.

## Out of scope

New metadata fields, contributor backend design, and visual redesign.

## Open questions

1. For which absent fields, if any, should Book Details show an explicit “Not provided” rather than omit the row?
