# FEAT-06 -- Library Setup and Settings Frontend Integration

**Status:** Ready. The backend contract, checked-in OpenAPI, generated types, and base API
adapter are shipped.

**Dependency group:** A -- tenant-scoped contract foundation.

**Depends on:** Shipped hostname tenant resolution and backend 1.1.3 library contract.

**Unblocks:** `FEAT-09` Guided Multi-Media Setup and the PLAN-03 tickets that consume
Enable Loans, TBR shelf IDs, or the Reserved shelf ID.

**Primary owner:** Frontend.

## Objective

Integrate the shipped tenant-scoped setup/settings contract into frontend server state and
build the Manage Collection settings surface needed by the guided setup and later book/album
features.

## Shipped contract baseline

- `GET /library/setup` returns `required`, `in_progress`, `complete`, or `failed`, plus
  `has_catalog_items`, `system_shelves_ready`, `supported_media`, and `failure_code`.
- `POST /library/setup/complete` accepts `initial_media` and `shelf_ids` and is the dedicated
  completion operation.
- `GET` / `PATCH /library/settings` expose `enable_loans`, `book_tbr_shelf_ids`, and
  `reserved_shelf_id`.
- `src/api/generated/openapi.ts`, `src/api/apiTypes.ts`, and `src/api/libraryApi.ts` already
  contain the corresponding typed transport surface.
- Tenant selection remains proxy-owned; browser JavaScript sends no tenant identifier.

## Frontend scope

- Add React Query keys, queries, and mutations for setup and settings, including focused
  invalidation/cache updates after completion and settings changes.
- Add contract-focused API/query tests for success, field validation, authentication,
  unknown-host, and transient failures without re-specifying backend behavior.
- Add a discoverable Library Settings surface under Manage Collection.
- Present Enable Loans, multi-select book TBR shelves, and one optional Reserved/will-call
  shelf using the loaded shelf catalog and stable `shelf_id` values.
- Preserve server values on partial updates and display field-linked server validation.
- Exclude system or otherwise ineligible shelves according to the shipped contract; do not
  infer eligibility from names beyond existing system-shelf rules.

## Acceptance criteria

- [ ] Setup and settings query hooks use the existing typed `libraryApi`; no duplicate client
      or guessed schema is introduced.
- [ ] Fresh, in-progress, complete, failed-bootstrap, populated-but-incomplete, request-failed,
      and unknown-host responses remain distinguishable in frontend state.
- [ ] Completion updates/refetches setup state predictably and preserves backend errors.
- [ ] Settings load and save states are accessible and failed saves leave the last confirmed
      server state intact.
- [ ] Enable Loans copy states that disabling new circulation actions does not delete history.
- [ ] TBR and Reserved controls submit shelf IDs and continue to display correctly after shelf
      renames.
- [ ] Settings query keys and tests prove cached state is isolated between known hosts.
- [ ] No login, tenant switcher, browser-selected tenant, or general-purpose preference bag is
      introduced.

## UI questions requiring a product decision

The transport is already settled; these must be answered before the settings UI is finalized:

1. Is Enable Loans presented as one library-wide switch for books and albums, or does the
   copy need to explain media-specific consequences while retaining one stored value?
   - If we can do it per media type without more backend work, i would like it separate. But if not,
   library wide is fine. 
2. May the same shelf be both a TBR shelf and the Reserved/will-call shelf? If not, which
   what recovery copy should the UI use for the shipped validation result?
   - No. They should be separate shelves. I'm not sure I understand the second part of this question. 
3. When a referenced shelf is about to be deleted, should the shelf UI block deletion and
   link to Settings, or should the backend clear the reference atomically with an explicit
   warning?
   - the latter 
4. Are TBR shelves displayed in a meaningful priority order, or is the setting an unordered
   set?
   - Unordered set

## Out of scope

Backend schema or route work, manual book status behavior, hold/pickup metadata, setup wizard
composition, quote storage, tenant registration, per-user settings, backup/restore, and a
free-form settings system.
