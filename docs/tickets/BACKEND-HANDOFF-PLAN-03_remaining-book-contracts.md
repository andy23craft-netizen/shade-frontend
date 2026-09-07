# BACKEND-HANDOFF-PLAN-03 -- Remaining Book Contracts

**Status:** Backend handoff required. Verified against checked-in OpenAPI 1.1.3 on September 7, 2026.

**Frontend dependents:** `FEAT-42`, `FEAT-43`, `FEAT-45`, `FEAT-46`, `FEAT-47`, `FEAT-53`, and `FEAT-54`.

## Objective

Ship the remaining tenant-scoped book contracts required by PLAN-03. The backend team may split this handoff into implementation tickets; the frontend needs the combined behavior below represented in OpenAPI and `API-for-FE.md`.

## Current contract already present—do not duplicate

- `POST /catalog/resolve-code` and typed physical-item summaries.
- `POST /books/{book_id}/availability`, full book statuses, structured reservation data, and TBR/Reserved library settings.
- `isbn_not_applicable` on book create/update/read and incomplete-metadata behavior.
- Loan feedback CRUD/list summaries and Work read/merge/split/item routes.
- Book status/year filters, publication-date sorting, and mixed recent additions.

## 1. Atomic bulk book availability

- Accept a non-empty, duplicate-free bounded list of book UUIDs plus the requested manual status and any status-specific structured data.
- Apply all-or-nothing tenant-scoped mutation; never require frontend per-book loops.
- Preserve loan lifecycle ownership, reject active-loan conflicts, atomically move Missing books to `unknown`, and apply the same precedence/validation as single-book availability.
- Return enough typed result data to refresh affected records and document `400`/`404`/`409`/`412`/`422` behavior, limits, and idempotent retry semantics.

## 2. Canonical readable keys and rename compatibility

- Define which book-area resources receive readable keys: at minimum category and shelf filters, and Book Details if product approves it.
- Backend owns unique canonical slugs/keys, normalization, collision handling, tenant scoping, Unicode/case rules, and lookup.
- Provide resolution sufficient for the SPA to translate a readable key to stable UUID identity without guessing.
- Preserve renamed keys through an alias/redirect contract with defined retention; unknown and other-tenant keys must not leak resource existence.
- Document compatibility for current UUID links and canonical response/location behavior.

## 3. Atomic TBR and Reserved-shelf behavior

- Make moves into/out of configured TBR shelves update availability atomically with the documented Missing, Display Only, Reading, Reserved, Available, and active-loan precedence.
- Make single and bulk shelf moves follow the same rules; failures must leave both shelf and status unchanged.
- Provide an atomic way to move a book to the configured Reserved shelf while supplying required pickup name and optional note.
- Clear reservation metadata atomically on successful checkout or departure from the Reserved shelf and define behavior when settings change or referenced shelves are deleted.
- Document checkout `availability_override`, disabled-loan behavior, and all conflict/validation responses in `API-for-FE.md` as well as request schemas.

## 4. Needs Reshelving task state

- Provide durable tenant-scoped mark/update/clear/read behavior associated with one book, separate from status and shelf/category membership.
- Include a stable task ID or explicitly idempotent per-book singleton semantics, bounded nullable reason/note, marked/updated timestamps, and current book summary.
- Provide deterministic Dashboard queue ordering and bounded pagination/limit behavior.
- Define deletion, already-marked/already-cleared, concurrent update, and stale book behavior; catalog edits must not implicitly clear the task unless explicitly agreed.

## 5. Ordered contributor roles

- Replace or supersede flat optional `editor`/`illustrator` strings with stable normalized people and ordered book memberships for editor, illustrator, and translator roles while retaining ordered required authors.
- Define reuse/create/read support, per-role ordering, duplicate rules, whether one person may occupy multiple roles, and lookup-draft representation.
- Book create/update/read and bulk intake must distinguish omit/preserve, empty/clear, and invalid null; missing IDs receive field-linked errors.
- Provide a retained-data migration/compatibility policy for existing flat editor/illustrator values.

## 6. Book Dashboard analytics

- Provide authoritative book-only values for Pages Owned, Pages Turned, books acquired/read in the requested/current year, books read over time, pages turned over time, and books read by shelf/category.
- Define time range/bucket parameters, tenant timezone/year boundaries, zero filling, stable ordering, partial/unknown page and publication/completion-date rules, reread semantics, and category multi-membership counting.
- Return typed aggregate/series/bucket shapes; do not require the browser to fetch or aggregate a complete catalog or loan history.
- Keep album keys separate and document transient/error behavior compatible with partial Dashboard panels.

## 7. Owned-book New Releases query

- Provide stable server-side ordering by stored `publication_date` descending, with explicit null/blank/unparseable handling and a UUID tie-breaker; the current `GET /books` sort enum does not offer publication-date order.
- Support a bounded result and, if product selects one, an inclusive publication window without requiring the browser to retrieve and sort an entire catalog.
- Return only active owned books appropriate for Home and define treatment of stashed, unshelved, wishlisted, and missing/display-only copies.

## Cross-cutting acceptance criteria

- [ ] All routes require Bearer auth and proxy-owned tenant resolution; browser clients never send tenant headers.
- [ ] UUID validation, tenant non-disclosure, validation details, conflicts, concurrency, pagination, and limits are documented consistently.
- [ ] OpenAPI schemas, examples, status families, and `API-for-FE.md` behavioral guidance land together.
- [ ] Retained-data migrations are safe, idempotent, tested across tenants, and included in the release/restore rehearsal.
- [ ] A running backend `/openapi.json` matches the checked-in frontend contract before frontend integration begins.

## Open questions

1. Are readable Book Details URLs part of V2, or only named category/shelf query values?
2. What alias-retention promise applies after a readable key is renamed?
3. Is reshelving reason free text, a vocabulary plus note, or both; is resolved history retained?
4. May one normalized person occupy multiple contributor roles on the same book, and how are legacy strings migrated?
5. What event model defines Pages Turned, especially rereads and books lacking page counts?
6. What default/range limits and bucket granularity should analytics expose?
7. What publication window and placement/status eligibility define New Releases?
