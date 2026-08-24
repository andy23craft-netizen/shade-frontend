# FEAT-35 -- V1 frontend regression and deployment gate

## Objective

Prove the finished Shade frontend works against the finalized V1 backend contract and rebuilt V1 database before
deployment.

This is a release-validation ticket, not a feature bucket. Fix regressions discovered here, but do not use it to
introduce new product scope.

## Current status

Gate not yet passed.

Product blockers FEAT-27 through FEAT-33 are implemented in the SPA (those ticket files are removed). FEAT-34 cover
images remain optional stretch: backend `GET` / `PUT` / `DELETE /books/{id}/cover` and `BookRead.cover_image_path` are
in the checked-in contract (OpenAPI `0.2.10`); SPA helpers and Book Details cover UI are not started. Unit/integration
coverage and mock-backed Playwright journeys (`e2e/`) exist for much of the surface, but this ticket still requires
contract/environment validation against the final V1 backend and rebuilt database, plus an authoritative `make check` /
acceptance record.

Do not declare V1 complete from fixture/mock evidence alone.

## Dependencies

Required SPA product blockers (FEAT-27 through FEAT-33) are complete.

Also required before calling the gate passed:

- final backend category / filter / Collections / bulk-move / cover contracts are deployed to the validation
  environment;
- final V0 -> V1 database rebuild/import is complete;
- checked-in OpenAPI (`docs/technical-reference/openapi.json`, currently `info.version` `0.2.10`) matches the backend
  being validated (compare running `/openapi.json`).

FEAT-34 cover UI is optional and must not block this ticket. Absence of cover display is expected unless FEAT-34 ships
separately; do not invent FE-only cover clients or `cover_image_path` browser URLs during gate fixes.

## Contract and environment checks

Before product regression:

1. confirm the frontend is pointed at the intended final V1 backend/database;
2. verify running `/openapi.json` against the checked-in frontend contract
   (`docs/technical-reference/openapi.json`);
3. regenerate generated TypeScript types only if the checked-in contract intentionally changed
   (`yarn api:generate` → `src/api/generated/openapi.ts`);
4. ensure no handwritten API/query layer still assumes an obsolete contract (singular `category` / `?category=`,
   non-atomic bulk shelf loops, inventing cover URLs from `cover_image_path`, etc.);
5. use the final rebuilt V1 data, not an older pre-migration development database.

## Required regression scenarios

### Home and browsing

- `/` -> featured category -> correctly filtered Books (`/books?category_id=` via `homeCategoryHref`).
- Home New Additions / Staff Picks / secondary Browse, Collections, Wishlists, and About links remain reachable.
- Back/forward and refresh preserve the filtered destination.
- `/about` preserves the relocated About content (`AboutPage` + `CatalogGuide`); brand recovers to `/` (Home).
- Books URL state (`booksListModel`) supports composed filters plus sorting: at least multi-`category_id` (AND /
  intersection), author, title, and sort; also verify URL-backed `shelf_name`, `is_read`, `isbn`, and
  `cleanup_field` deep links where applicable.
- No-match and empty-library states remain distinct.
- Shelf -> canonical shelf-filtered Books view (`/books?shelf_name=`).
- Existing hardware ISBN collection jump still works on `/dashboard`, `/books`, and `/loans`.

### Category model

- Add Book with multiple categories (`category_ids` from `GET /categories`).
- Edit Book add/remove/clear categories (`category_ids: []` clears).
- Books list and Book Details display multiple categories (`formatBookCategories`).
- Dynamic category options come from the backend (no hard-coded taxonomy).
- Dashboard category breakdown remains backend-driven; incomplete-metadata "missing category" means no memberships.

### Collections

- Create a collection.
- Edit its name/description (`useUpdateCollection`; blank description clears via explicit `null`).
- Add at least two existing catalog books (shelved search via `GET /books`, then membership `POST`).
- Reorder memberships.
- Remove one membership.
- Add the current Book Details book to a collection (`AddBookToCollectionDialog`).
- Delete a collection without deleting catalog books.
- Wishlist rows remain visually/semantically distinct where they appear in Collections (`on_wishlist` /
  **Wishlist** location).
- Duplicate (**409**) / soft-deleted (**412**) membership errors remain non-destructive.

### Wishlists

- Create/use existing wishlist flow.
- Unshelved wishlist behavior remains distinct from Collections (memberships joined via `GET /books/{id}`, not
  `GET /books`).
- Move a wishlist book to a shelf still performs its documented lifecycle (membership `DELETE` then
  `PATCH { shelf_name }`; partial-failure retry via `membershipRemoved`).
- Collection changes have not reintroduced shelf/wishlist overlap mistakes (**412** exclusivity).

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

Re-run existing critical flows against the final V1 backend/database:

- manual Add Book (and ISBN / camera create paths if the environment supports them);
- Book Details;
- edit;
- checkout on Book Details (`CheckoutDialog`; `/checkout` remains a compatibility redirect only);
- Loans/check-in (`CheckinForm` on `/loans`; `/checkin` remains a compatibility redirect only);
- mark read / edit reading;
- delete / restore;
- wishlist move-to-shelf;
- Collections membership;
- Dashboard/healing metadata refresh and cleanup deep links.

Dedicated lifecycle endpoints remain authoritative; do not replace them with generic PATCH shortcuts during
regression fixes. Soft-deleted books reject lifecycle and cover routes (**404**) as documented.

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

Use the existing accessibility/e2e architecture rather than creating a parallel test harness. Record unavailable
manual browser environments explicitly (see AGENTS evergreen browser table) rather than assuming they passed.

## Automated release gate

The authoritative project-wide gate must pass via `make check` (`yarn check`), including:

- lint;
- strict type checking;
- generated OpenAPI drift checking (`yarn api:check`);
- Vitest suite and enforced coverage thresholds (statements 87%, branches 80%, functions 92%, lines 87%);
- Playwright journeys (`yarn test:e2e`);
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
- `docs/AGENTS.md` / `docs/full-project-context.md` if those are part of the repository's normal completion workflow;
- ticket presence under `docs/tickets/` (prefer over stale `docs/ToDo.md` when judging what remains open).

Documentation should reflect:

- Home `/` (discovery) and About `/about`;
- final category / filter / shelf / `is_read` / cleanup deep-link behavior;
- Collections and Book Details add-to-collection;
- atomic bulk shelf movement;
- optional cover-image status (FEAT-34: backend contract ready; SPA UI not started unless that changes).

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
- frontend commit/release version (`package.json` `version`);
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
- Inventing FE-only cover providers or `cover_image_path` browser URLs.
)
