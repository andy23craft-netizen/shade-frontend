# FEAT-35 -- V1 frontend regression and deployment gate

## Objective

Prove the finished Shade frontend works against the finalized V1 backend contract and rebuilt V1 database before
deployment.

This is a release-validation ticket, not a feature bucket. Fix regressions discovered here, but do not use it to
introduce new product scope.

## Current status

Gate not yet passed.

Product blockers FEAT-27 through FEAT-33 are implemented in the SPA (those ticket files are removed). FEAT-34 cover
images remain optional stretch and are not started. Unit/integration coverage and mock-backed Playwright journeys exist
for much of the surface, but this ticket still requires contract/environment validation against the final V1 backend
and rebuilt database, plus an authoritative `make check` / acceptance record.

Do not declare V1 complete from fixture/mock evidence alone.

## Dependencies

Required blocker features are complete in the SPA:

- FEAT-27 Curated Collections;
- FEAT-28 Collections follow-up;
- FEAT-29 Dynamic multi-category frontend support;
- FEAT-30 V1 catalog filter plumbing;
- FEAT-31 Bulk-selection framework;
- FEAT-32 Atomic bulk move to shelf (`POST /books/bulk/move-to-shelf`);
- FEAT-33 Home discovery page (`/` Home, `/about` About).

Also required:

- final backend category/filter/Collections contracts are deployed to the validation environment;
- final V0 -> V1 database rebuild/import is complete;
- checked-in OpenAPI matches the backend being validated.

FEAT-34 cover images is optional and must not block this ticket.

## Contract and environment checks

Before product regression:

1. confirm the frontend is pointed at the intended final V1 backend/database;
2. verify running `/openapi.json` against the checked-in frontend contract
   (`docs/technical-reference/openapi.json`);
3. regenerate generated TypeScript types only if the checked-in contract intentionally changed
   (`src/api/generated/openapi.ts`);
4. ensure no handwritten API/query layer still assumes an obsolete contract;
5. use the final rebuilt V1 data, not an older pre-migration development database.

## Required regression scenarios

### Home and browsing

- `/` -> featured category -> correctly filtered Books (`/books?category_id=`).
- Back/forward and refresh preserve the filtered destination.
- `/about` preserves the relocated About content (`AboutPage` + `CatalogGuide`).
- Books supports at least two composed filters plus sorting (centralized `booksListModel` URL state).
- Multi-category filtering follows backend AND/intersection semantics (repeated `category_id`).
- No-match and empty-library states remain distinct.
- Shelf -> canonical shelf-filtered Books view (`/books?shelf_name=`).
- Existing hardware ISBN collection jump still works on `/dashboard`, `/books`, and `/loans`.

### Category model

- Add Book with multiple categories (`category_ids` from `GET /categories`).
- Edit Book add/remove categories.
- Books list and Book Details display multiple categories (`formatBookCategories`).
- Dynamic category options come from the backend (no hard-coded taxonomy).
- Dashboard category breakdown remains backend-driven.

### Collections

- Create a collection.
- Edit its name/description (`useUpdateCollection`; blank description clears via explicit `null`).
- Add at least two existing catalog books.
- Reorder memberships.
- Remove one membership.
- Add the current Book Details book to a collection (`AddBookToCollectionDialog`).
- Delete a collection without deleting catalog books.
- Wishlist rows remain visually/semantically distinct where they appear in Collections (`on_wishlist` /
  **Wishlist** location).
- Duplicate (**409**) / soft-deleted (**412**) membership errors remain non-destructive.

### Wishlists

- Create/use existing wishlist flow.
- Unshelved wishlist behavior remains distinct from Collections.
- Move a wishlist book to a shelf still performs its documented lifecycle (membership `DELETE` then
  `PATCH { shelf_name }`).
- Collection changes have not reintroduced shelf/wishlist overlap mistakes.

### Bulk shelf movement

Bulk move is **atomic** (`POST /books/bulk/move-to-shelf`). Do not expect per-row partial success.

- Filter the Books catalog.
- Enter selection mode.
- Select multiple visible books (Select All is loaded rows only).
- Move them to a destination shelf in one request (`unknown` allowed; `removed` excluded).
- On success: rows update, selection clears, and messaging matches the atomic result.
- On failure (including wishlist **412**): every selected book remains on its original shelf; selection and
  destination stay recoverable; no false global-success message.
- Do not "fix" failures by looping per-book `PATCH`.

### Existing library lifecycle

Re-run existing critical flows after category/filter changes:

- manual Add Book;
- Book Details;
- edit;
- checkout on Book Details (`CheckoutDialog`; `/checkout` remains a compatibility redirect only);
- Loans/check-in (`CheckinForm` on `/loans`; `/checkin` remains a compatibility redirect only);
- mark read;
- delete;
- restore;
- wishlist move-to-shelf;
- Collections membership;
- Dashboard/healing metadata refresh behavior.

Dedicated lifecycle endpoints remain authoritative; do not replace them with generic PATCH shortcuts during
regression fixes.

### Navigation, accessibility, responsive behavior

Verify:

- primary drawer/navigation active state (`AppShell` / `DrawerNavMenu`; Collection + Circulation; brand to Home `/`);
- route titles;
- page-heading focus after navigation;
- dialog focus trap/restoration;
- visible keyboard focus;
- linked form errors;
- no color-only state;
- 320 px layouts for changed surfaces;
- top-level route error recovery.

Use the existing accessibility/e2e architecture rather than creating a parallel test harness.

## Automated release gate

The authoritative project-wide gate must pass via `make check` (`yarn check`), including:

- lint;
- strict type checking;
- generated OpenAPI drift checking (`yarn api:check`);
- Vitest suite and enforced coverage thresholds;
- Playwright journeys;
- automated axe checks;
- production build;
- bundle-size enforcement (soft warn 120 kB gzip main entry; hard fail 150 kB).

Do not weaken coverage floors or bundle limits simply to get V1 green.

## Bundle/release expectations

- Production build succeeds.
- Main-entry bundle remains within the existing soft/hard policy above.
- Scanner code remains appropriately isolated/lazy-loaded unless a deliberate reviewed change says otherwise.
- Existing versioned release packaging remains functional (`yarn release:pack` / `scripts/packRelease.ts`).
- No secrets are added to build artifacts or runtime diagnostics.

## Documentation

Update only the frontend-owned current documentation needed to describe the final V1 product.

At minimum review:

- `README.md`;
- `docs/ToDo.md`;
- `docs/AGENTS.md` / `docs/full-project-context.md` if those are part of the repository's normal completion workflow.

Documentation should reflect:

- Home `/`;
- About `/about`;
- final category/filter behavior;
- shelf deep links;
- Collections;
- Book Details add-to-collection;
- atomic bulk shelf movement;
- optional cover-image status (FEAT-34 still open / not started unless that changes).

Do not claim unavailable browser/platform validation passed.

## Acceptance criteria

- Running backend OpenAPI and checked-in frontend contract have no unexplained mismatch.
- Generated TypeScript/API/query layers match the final backend contract.
- Regression scenarios above are green or any unavailable manual environment is explicitly recorded rather than
  assumed.
- `make check` passes with existing coverage thresholds.
- Production build passes existing bundle-size policy.
- Final manual smoke uses the rebuilt V1 database.
- Changed V1 surfaces are usable at 320 px and by keyboard.
- No known critical/serious accessibility regression remains.
- README/current user-facing docs reflect final routes and major capabilities.
- FEAT-34 can be absent/disabled without affecting any blocker criterion.
- No new V1 product feature remains hidden in this release ticket.

## Suggested final acceptance record

At completion, record each major scenario in the ticket using the repository's normal form:

```text
[X] Criterion satisfied -- explanation
[ ] Intentionally unavailable/deferred -- reason
```

Also record:

- backend/database version or identifying revision used for smoke testing;
- frontend commit/release version;
- `make check` result;
- production build/bundle result;
- browser/manual environments actually tested;
- any non-blocking FEAT-34 status.

## Out of scope

- New V2 features.
- New category-management CRUD.
- New bulk actions beyond atomic shelf movement.
- New deployment infrastructure owned outside the frontend repository.
- Making cover images a release blocker.
- Claiming the gate passed from mock/fixture suites alone.
