# FEAT-27 -- Curated Collections for books

## Objective

Ship a `/collections` product surface for the backend's curated **Collections** feature: named, ordered groups of
existing catalog books (e.g., Staff Picks, Exhibitions, thematic lists). Operators can create and delete collections,
add catalog books that may already be shelved or wishlisted, reorder memberships, and remove individual memberships.

Wire primary navigation so Collections is reachable from the existing Collection drawer alongside Browse, Manage, and
Wishlists. Reuse the wishlists page patterns where they fit, but follow the Collections API semantics -- they are
**not** wishlists with a different label.

## Dependencies

- FEAT-19 wishlists are complete (`WishlistsPage`, `wishlistsApi` / `wishlistsQueries`, membership join via
  `GET /books/{id}`). Use that feature as a structural reference, not a copy-paste source.
- Checked-in `docs/technical-reference/openapi.json` and `docs/technical-reference/API-for-FE.md` already document
  Collections routes and behavior. Regenerate `src/api/generated/openapi.ts` with `yarn api:generate` before
  implementing transport helpers (`yarn api:check` must pass).
- Book detail, collection browse (`/books`), shelves, and ISBN utilities are complete for add-book search/join flows.

**Explicit non-dependencies:**

- **FEAT-26** (`docs/tickets/FEAT-26_add-from-wishlist.md`) adds wishlist membership remove plus move-to-shelf
  (`DELETE` wishlist membership, then `PATCH { shelf_name }`). That two-step lifecycle **does not apply** to
  Collections. Collection memberships are orthogonal to shelf and wishlist placement; do not port
  `MoveWishlistBookToShelfControl` or shelf pickers onto collection rows.
- Do not pull FEAT-20 dashboard reports, FEAT-21 display-only checkout, FEAT-22 / FEAT-23 circulation consolidation,
  FEAT-24 scanner expansion, or FEAT-25 backup removal into this ticket.

## Contract references

Treat these as complementary:

- `../technical-reference/openapi.json` -- paths, methods, status codes, schemas:
  - `GET /collections` → **200** `CollectionList` (`{ items, total }`; optional paired `skip` / `take`).
  - `POST /collections` → **201** `CollectionRead`; **422** blank name.
  - `PATCH /collections/{collection_id}` → **200** `CollectionRead`; explicit JSON `null` clears `description`.
  - `DELETE /collections/{collection_id}` → **204**; memberships deleted; catalog books remain.
  - `GET /collections/{collection_id}/books` → **200** `CollectionBookList` (membership rows, not full `BookRead`).
  - `POST /collections/{collection_id}/books` → **201** `CollectionBookRead` with `{ book_id }` (optional `order_num`,
    `notes`); **404** unknown collection/book; **409** duplicate book or duplicate `order_num` in the same collection;
    **422** non-positive `order_num`.
  - `PATCH /collections/{collection_id}/books/{collection_book_id}` → **200** `CollectionBookRead` with
    `{ order_num }` (positive int; values above count clamp to last position; API renumbers contiguously).
  - `DELETE /collections/{collection_id}/books/{collection_book_id}` → **204** (remaining rows renumbered).
- `../technical-reference/API-for-FE.md` -- behavioral rules OpenAPI does not fully express:
  - Collections coexist with shelves and wishlists. Adding a shelved or wishlisted book succeeds; collection routes do
    **not** return **412** for shelf/wishlist overlap (wishlist/shelf mutual exclusion elsewhere is unchanged).
  - Membership list rows include enriched `shelf_name` and `on_wishlist`; join `book_id` to `GET /books/{id}` for
    title and authors (same durable `Book {id}` fallback as wishlists).
  - Default membership order is `order_num` ascending. Omit `order_num` on add to append (`max + 1`, or `1` when
    empty).
  - Soft-deleted catalog books may still be added to a collection.
  - Pagination matches wishlists: send `skip` and `take` together, or omit both for the full filtered set.
  - `GET /books` has no `collection` filter; curated lists are not the same as category browse on `/books`.

Confirm against a running backend `/openapi.json` before locking transport types; record drift as a blocker rather
than inventing frontend semantics.

## How Collections differ from Wishlists

| Area | Wishlists (FEAT-19) | Collections (this ticket) |
| ---- | ------------------- | ------------------------- |
| Purpose | Books to acquire (often unshelved) | Curated groups of books already in the catalog |
| Add flow | Unshelved `POST /books` (omit `shelf_name`), then membership `POST` | Single membership `POST` with existing `book_id` |
| Shelved books | **412** if the book has shelf membership | Allowed |
| Wishlisted books | N/A (wishlist-only rows are unshelved) | Allowed; list shows `on_wishlist` |
| Membership order | Priority (display only; no reorder API in FEAT-19) | Explicit `order_num`; reorder `PATCH` and renumber on remove |
| Membership remove | FEAT-26 only (wishlist-specific move-to-shelf exit) | `DELETE` membership (no shelf patch) |
| Membership fields | `status`, `priority`, `notes`, `url` | `order_num`, `notes`; enriched `shelf_name`, `on_wishlist` |
| Duplicate add | Permitted | **409** `"Book is already in this collection"` |
| Move to shelf | FEAT-26 (`DELETE` membership → `PATCH shelf_name`) | **Out of scope** -- not applicable |

## Current baseline

Already in place and should be reused (not rebuilt):

- Primary nav uses `AppShell` / `DrawerNavMenu` with a **Collection** drawer (Browse → `/books`, Manage →
  `/collection/manage`, Wishlists → `/wishlists`). The drawer label "Collection" refers to the physical library; the
  new API feature uses the plural product name **Collections** on `/collections` to avoid conflating the two concepts.
- Wishlists product UI under `src/features/wishlists/` (page layout, create form, nested memberships, add control,
  styles in `components.css`).
- Typed client stack: `createApi`, `queryKeys`, React Query hooks, `requestFields` pickers, `formatApiQueryError`,
  shared UI primitives.
- `docs/technical-reference/openapi.json` includes Collections paths/schemas, but `src/api/generated/openapi.ts` may
  still be stale (regenerate first). No `collectionsApi`, `collectionsQueries`, route, or nav link exists yet.
- `scripts/contractSmoke.test.ts` `expectedPaths` does not yet list `/collections` paths.
- Vite dev proxy forwards `/wishlists` but not `/collections` (`vite.config.ts`).

## Product intent

On `/collections`, an operator should be able to:

1. **Browse curated lists** -- load all collections (`useCollections`), show name, description, and membership count.
   Empty state when none exist.
2. **Create a collection** -- name (required) and optional description; Field-linked **422** on create (mirror wishlist
   create form patterns).
3. **Delete a collection** -- permanent delete with `ConfirmationDialog`; memberships removed, catalog books remain
   (honest copy, parallel to wishlist delete).
4. **View ordered memberships** -- for each collection, list memberships sorted by `order_num`. Each row shows position,
   title/authors (via `useBook` / `GET /books/{id}`), optional membership `notes`, enriched `shelf_name` (Title Case
   via `formatShelfCommonNameForDisplay`, or an honest unshelved label when null), and an `on_wishlist` indicator when
   true. Link title to `/books/{bookId}`.
5. **Add an existing catalog book** -- pick a target collection, find a book (ISBN via `useBooks({ isbn })` and/or
   title/author list filters -- not lookup/create), select a match, optionally add notes, then `POST` membership.
   Surface **409** duplicate and **404** stale-state honestly. Do **not** create unshelved catalog rows (that is the
   wishlist add path).
6. **Reorder memberships** -- per-row move earlier/later (or equivalent) controls that call membership `PATCH` with a
   new `order_num`. Disable while pending; refetch membership list on success.
7. **Remove a membership** -- `ConfirmationDialog`, then membership `DELETE`; list renumbers server-side.
8. **Navigate from primary nav** -- Collection drawer gains a **Collections** item → `/collections`; trunk
   `data-active` includes `/collections` under the Collection menu.

Tone: card-catalog consistency with wishlists (`.collection-card`, ordered list rows). Collections are for showcasing
books you already track, not for acquisition planning.

## Out of scope

- FEAT-26 move-to-shelf UI or shelf pickers on collection membership rows.
- Wishlist-style unshelved create-then-add (`POST /books` omitting `shelf_name` before membership add).
- Add-to-collection from `/books` browse or book detail ("Collections this book belongs to" -- product reqs mention
  this for a later surface).
- Home page featured-collection carousels, Discover pages, or dashboard collection widgets.
- Collection-level inline edit UI (`PATCH` name/description) unless timeboxed after core CRUD/reorder/remove ship; still
  expose `update` in the API layer for future use.
- Membership notes edit (`PATCH` only documents `order_num` today).
- Cover images, drag-and-drop reorder libraries, or automatic collection suggestions.
- Backend implementation (separate backend work; frontend follows checked-in OpenAPI).

## Remaining scope (file-level plan)

### 1. OpenAPI sync and API transport

| File | Change |
| ---- | ------ |
| `docs/technical-reference/openapi.json` | Already updated; verify against running backend when available. |
| `src/api/generated/openapi.ts` | Regenerate via `yarn api:generate` / `yarn api:check`. |
| `src/api/apiTypes.ts` | Export aliases: `CollectionCreate`, `CollectionUpdate`, `CollectionRead`, `CollectionList`, `CollectionBookCreate`, `CollectionBookRead`, `CollectionBookList`, `CollectionBookReorder`. |
| `src/api/requestFields.ts` | Add `COLLECTION_CREATE_FIELDS`, `COLLECTION_UPDATE_FIELDS`, `COLLECTION_BOOK_CREATE_FIELDS`, `COLLECTION_BOOK_REORDER_FIELDS` and `pickCollectionCreate`, `pickCollectionUpdate`, `pickCollectionBookCreate`, `pickCollectionBookReorder`. Colocated tests in `requestFields.test.ts`. |
| `src/api/collectionsApi.ts` (new) | `createCollectionsApi(client)` with `list`, `create` (**201**), `update`, `remove` (**204**), `listBooks`, `addBook` (**201**), `reorderBook` (**200**), `removeBook` (**204**). Mirror `wishlistsApi` pagination/signal helpers; encode path segments; serialize documented fields only. |
| `src/api/collectionsApi.test.ts` (new) | Happy paths and **400** / **404** / **409** / **422** wiring for list/create/add/reorder/remove. |
| `src/api/queryKeys.ts` | Add `collections.all`, `collections.list()`, `collections.books(collectionId)`. |
| `src/api/queryKeys.test.ts` | Key shape coverage for collections list/books isolation. |
| `src/api/collectionsQueries.ts` (new) | `useCollections`, `useCollectionBooks` (disabled when id empty), `useCreateCollection`, `useUpdateCollection`, `useDeleteCollection`, `useAddCollectionBook`, `useReorderCollectionBook`, `useRemoveCollectionBook`. Invalidation: writes invalidate `queryKeys.collections.all`; membership writes invalidate `queryKeys.collections.books(collectionId)`. No dashboard/books-list invalidation required on collection-only mutations unless a future surface joins them. |
| `src/api/collectionsQueries.test.tsx` (new) | Hook fetch/invalidation, disabled empty-id books query, reorder/remove invalidation. |
| `src/api/api.ts` | Register `collections: createCollectionsApi(client)` on `createApi`. |
| `src/api/api.test.ts` | Assert `createApi` exposes `collections`. |
| `scripts/contractSmoke.test.ts` | Extend `expectedPaths` with `/collections`, `/collections/{collection_id}`, `/collections/{collection_id}/books`, `/collections/{collection_id}/books/{collection_book_id}`; assert generated types contain `CollectionRead` / `CollectionBookRead` operation ids. |

### 2. Form and display helpers

| File | Change |
| ---- | ------ |
| `src/features/collections/collectionFormModel.ts` (new) | Create form values + validation (non-blank name, max 255); `formValuesToCollectionCreate`. Add-book form values: `collectionId`, search inputs (ISBN and/or title/author), selected `bookId`, optional `notes`; client validation; `formValuesToCollectionBookCreate`. Colocated unit tests. |
| `src/features/collections/collectionFormModel.test.ts` (new) | Validation and conversion cases (empty name, missing book selection, optional notes omitted). |
| `src/features/collections/collectionDisplay.ts` (new) | Helpers: format membership position (`order_num`), unshelved shelf label when `shelf_name` is null, wishlist badge/label for `on_wishlist`, safe notes rendering. Colocated unit tests. |
| `src/features/collections/collectionDisplay.test.ts` (new) | Display helper coverage. |

Keep collection-specific logic out of `wishlistFormModel` / `wishlistDisplay`.

### 3. UI components

| File | Change |
| ---- | ------ |
| `src/features/collections/components/AddCollectionBookControl.tsx` (new) | Collection picker; book find via `useBooks({ isbn })` and/or `useBooks({ title, author })` (checksum-gate ISBN like checkout/create); match chooser when multiple hits; optional notes field; `useAddCollectionBook`. Copy explains this adds an **existing** catalog book (shelved or wishlisted). Handle **409** / **404** / **422** with Field-linked errors and refetch. No `useCreateBook`, no lookup-to-create path. |
| `src/features/collections/components/AddCollectionBookControl.test.tsx` (new) | Collection required, find/select flow, duplicate **409**, pending disable, success notice. |
| `src/features/collections/components/CollectionMembershipRow.tsx` (new) | Props: collection id, membership row, reorder bounds, pending flags, callbacks. Render title/authors join (`useBook`), metadata (`order_num`, `shelf_name`, `on_wishlist`, `notes`), link to detail, Move up / Move down (or equivalent) calling `useReorderCollectionBook`, Remove opening confirm. Disable controls while mutations pending. |
| `src/features/collections/components/CollectionMembershipRow.test.tsx` (new) | Row rendering, reorder button enablement at list ends, remove confirm wiring. |
| `src/features/collections/routes/CollectionsPage.tsx` (new) | Top-level page: `useCollections`; loading/error/empty states; `CreateCollectionForm`; `AddCollectionBookControl`; nested `CollectionSection` per collection with `useCollectionBooks`, ordered membership list, delete collection with `ConfirmationDialog`. Page intro: curated lists vs wishlists (acquisition) vs browse (full shelved catalog). **Do not** render shelf pickers or FEAT-26 move controls. |
| `src/features/collections/routes/CollectionsPage.test.tsx` (new) | Loading/error/empty, create, nested memberships with book join fallback, add existing book, reorder, remove, delete collection, updated intro copy. |

### 4. Routing, navigation, and layout

| File | Change |
| ---- | ------ |
| `src/routes/routeMetadata.ts` | Add `collections: { path: '/collections', title: 'Collections', heading: 'Collections' }`. |
| `src/routes/routes.tsx` | Register `/collections` → `CollectionsPage` (place near `/wishlists`). |
| `src/layout/AppShell.tsx` | Collection drawer: add `{ label: 'Collections', to: '/collections' }` (recommended order: Browse, Manage, Collections, Wishlists). Extend `activePrefixes` with `'/collections'`. |
| `src/layout/AppShell.test.tsx` | Drawer lists Collections link; `/collections` marks Collection trunk active; navigation + heading focus. |
| `src/App.test.tsx` | Extend drawer-hop / title tests if they enumerate Collection drawer destinations. |

Do not rename the existing Collection drawer or `/collection/manage` hub; `/collections` is the curated-lists route.

### 5. Styles and dev tooling

| File | Change |
| ---- | ------ |
| `src/styles/components.css` | Add collection page/card/membership/reorder styles (mirror wishlist spacing; reuse shared form/select/button classes). Include narrow-viewport stacking for reorder/remove actions. |
| `vite.config.ts` | Add `collections` to the dev-proxy path regex (alongside `wishlists`). |

### 6. Tests, mocks, and docs hygiene

| File | Change |
| ---- | ------ |
| `e2e/support/mockApi.ts` | Stateful fixtures for collections list/create/delete, membership add/reorder/remove, enriched `shelf_name` / `on_wishlist`, **409** duplicate handling. Keeps Playwright mocks aligned with OpenAPI. |
| `e2e/accessibility.spec.ts` | Optional: add `/collections` axe scan once the route ships (follow FEAT-13 pattern). |
| `docs/AGENTS.md` | After completion: inventory collections feature files/hooks/routes; nav drawer includes Collections; update "Next" / completed lists; note Collections differ from wishlists (add existing book, reorder/remove, no **412**, no FEAT-26 shelf move). |
| `docs/ToDo.md` | Add checklist line for FEAT-27. |

## Acceptance criteria

- `/collections` is registered and reachable from the Collection drawer **Collections** link.
- Collection trunk `data-active` is set on `/collections` (and not on unrelated routes).
- Operators can create and permanently delete collections with confirmation on delete.
- Each collection lists memberships in `order_num` order with title/authors (via `GET /books/{id}` join), optional
  notes, shelf display, and `on_wishlist` when true.
- Add-book flow selects an **existing** catalog book and calls `POST /collections/{id}/books` only; it does not call
  unshelved `POST /books`.
- Shelved and wishlisted books can be added without **412**; duplicate add surfaces **409** honestly.
- Operators can reorder memberships via `PATCH` `{ order_num }` and remove memberships via `DELETE` with
  confirmation.
- Collection membership rows do **not** offer FEAT-26 move-to-shelf controls or shelf assignment patches.
- Loading, empty, retryable error, Field-linked **422**, **404** refetch, and pending-disable patterns match existing
  feature pages.
- Colocated unit tests cover API helpers, query hooks, form/display models, components, page wiring, and nav updates.
- `yarn api:check` passes; `make check` passes.
- Intro copy distinguishes Collections (curated lists of catalog books) from Wishlists (acquisition) and Browse (full
  shelved catalog).

## Plan coverage

Delivers the backend Collections contract as a first-class frontend feature, parallel to but distinct from FEAT-19
wishlists, with navigation integration and explicit exclusion of FEAT-26 shelf-move semantics. Defers homepage
featured collections, book-detail membership management, and collection-level inline edit unless added in a follow-on
ticket.
