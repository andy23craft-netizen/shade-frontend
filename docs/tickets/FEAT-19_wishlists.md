# FEAT-19 -- Wishlists browse and add unshelved books

## Objective

Ship product UI for authenticated wishlist APIs already described in the backend contract: list and create
wishlists, list memberships, and add a catalog book that has **no** shelf membership. Add a top-level `/wishlists`
page that shows every wishlist and its membership contents (joined to catalog book display fields via
`GET /books/{id}`).

A book must not be on both a shelf and a wishlist. Adding to a wishlist is `POST /books` **without** `shelf_name`,
then `POST /wishlists/{wishlist_id}/books`. Do **not** add books from `/books`: that list inner-joins shelf
membership, so every row already has a shelf and the add API returns **412**.

This ticket is the product surface that earlier API contract sync explicitly deferred (OpenAPI already includes
wishlist paths/schemas). It does **not** add cover images, acquisition/purchase workflows, or membership
edit/remove endpoints the API does not expose.

## Dependencies

Generated OpenAPI types and `scripts/contractSmoke.test.ts` already include wishlist paths. `apiTypes.ts` does
**not** yet export wishlist schema aliases. Reuse the typed client, query keys, mutation invalidation, redaction
helpers, shared components, shelves patterns (`ShelvesPage` create/edit/delete + confirmation), create/lookup
patterns from `NewBookPage` / `BookForm` (ISBN lookup optional), and PLAN.md 7.5-style cache invalidation. Do not
invent membership PATCH/DELETE or soft-delete for wishlists. If wishlist types regress, regenerate and extend
contract smoke as a prerequisite rather than blocking.

FEAT-17 About homepage is complete (`/` is About; dashboard is `/dashboard`). FEAT-18 collection category / author /
title filters and shelf sort are complete on `/books` (ticket file removed) -- do not regress those controls.
`/books/new` remains the collection add path and still requires an explicit shelf; do not make that form omit
`shelf_name`.

Do not pull journey automation, CI, Podman, release artifacts, dashboard-report UI (FEAT-20), display-only
alternate-copy UX (FEAT-21), or later tickets (FEAT-22+) into this ticket.

## Contract references

Treat these as complementary:

- `../technical-reference/openapi.json` -- paths, methods, status codes, and schemas:
  - `GET` / `POST /wishlists`
  - `PATCH` / `DELETE /wishlists/{wishlist_id}` (there is **no** `GET /wishlists/{wishlist_id}`)
  - `GET` / `POST /wishlists/{wishlist_id}/books`
  - Schemas: `WishlistCreate`, `WishlistUpdate`, `WishlistRead`, `WishlistList`, `WishlistBookCreate`,
    `WishlistBookRead`, `WishlistBookList`, `WishlistBookStatus` (`wanted` | `ordered` | `owned` | `dropped`)
  - `WishlistRead` has no membership-count field; use `GET .../books` `total` and/or visible rows.
  - `WishlistBookCreate` requires `book_id` only; `status` defaults to `wanted`.
  - `BookCreate.shelf_name` is optional: omit or send JSON `null` to create a catalog row with no shelf membership.
  - `POST /books` and `PATCH /books/{id}` return **412** when assigning `shelf_name` to a book that is on any
    wishlist (`"The book must be removed from the wishlist before it can be placed on a shelf"`).
  - `POST /wishlists/{wishlist_id}/books` returns **412** when the book has any shelf membership, including
    system shelves `unknown` / `removed` (`"Existing books cannot be added to a wishlist"`).
- `../technical-reference/API-for-FE.md` -- behavioral rules OpenAPI does not fully express:
  - All wishlist routes are authenticated (Bearer).
  - No book may be on both a shelf and a wishlist. The API enforces this with the **412** responses above.
  - No soft-delete for wishlists. `DELETE` permanently removes membership rows first, then the wishlist; catalog
    books are not deleted.
  - `GET /wishlists` order: `created_date` DESC, then `wishlist_id` DESC.
  - `GET /wishlists/{wishlist_id}/books` returns **membership rows**, not embedded `BookRead`. Default order:
    priority ASC (`null` last), then `created_date` ASC, then `wishlist_book_id` ASC.
  - Recommended add: `POST /books` **without** `shelf_name`, then `POST .../books` with `{ book_id }`. `status`
    defaults to `wanted`. Duplicate `(wishlist_id, book_id)` memberships are permitted.
  - `GET /books` inner-joins shelf membership, so unshelved (wishlist-only) books are omitted from the list. Fetch
    them with `GET /books/{id}` (response `shelf_name` is `unknown` when membership is missing). Do not join
    wishlist memberships through the collection list.
  - Soft-deleted catalog books cannot be added: delete moves them to `removed`, which counts as shelf membership.
  - There is no membership-level PATCH or DELETE. To place a wishlisted book on a shelf, delete the wishlist
    first, then `PATCH` `shelf_name`.
  - `PATCH /wishlists/{wishlist_id}` is partial and preserves omitted fields.
  - Path `wishlist_id` / membership `book_id`: **400** when empty or not a valid GUID; **404** when well-formed
    but unknown.
  - Unsupported membership `status` → **422**.
  - List endpoints use paired `skip` / `take` when paginating; `total` is the full matching count.

Confirm against a representative running backend `/openapi.json` before locking transport types; record drift as a
blocker rather than inventing frontend semantics.

## Current baseline

Already in place and should be reused (not rebuilt):

- FEAT-03 / FEAT-04 patterns: typed `*Api.ts` helpers, `queryKeys`, React Query hooks, `createApi` aggregation,
  `pickDocumentedRequestFields` for request bodies, `enumDisplayValue` for unknown enums.
- `/books` via `BooksPage` + `useInfiniteBooks({ category, author, title, sortBy, sortOrder })` with URL-backed
  filters and shelf sort; cards link to detail with Read/Unread, rating, and Title Case `shelf_name`. No wishlist
  actions -- keep it that way; every row on this page has shelf membership and cannot be added to a wishlist.
- `/books/new` via `NewBookPage` + `BookForm`: collection create requires an explicit shelf (`shelfId` →
  `shelf_name`). Do not regress that. Wishlist add is a separate create that **omits** `shelf_name`.
- `/books/:bookId` via `BookDetailsPage` with gated lifecycle actions (checkout, check-in, mark-read, edit, delete).
  No wishlist actions. Edit already maps Field-linked **422** / **400** shelf errors; it does not yet map **412**
  `"The book must be removed from the wishlist before it can be placed on a shelf"`.
- Primary nav in `AppShell` (`DrawerNavMenu`): direct Dashboard link; Collection drawer (Browse → `/books`, Manage →
  `/collection/manage`); Circulation drawer (Check Out, Check In, Loans). About is the brand link to `/`, not a
  separate nav item. Add Book, Shelves, Deleted Books, and Backup Library live on `/collection/manage`
  (`ManageCollectionPage`), not the header. No Wishlists link.
- `/shelves` via `ShelvesPage` is a good pattern for catalog create + Field-linked errors + `ConfirmationDialog`
  delete -- reuse patterns, not shelf domain logic.
- `routeMetadata` / `routes.tsx` have no `/wishlists` entry.
- Shared UI: `Button`, `AppLink`, `Field`, `EmptyState`, `LoadingState`, `QueryErrorState`, `ConfirmationDialog`,
  `Alert`, `useNotifications` toasts.
- Loans join pattern on `LoansPage` lists domain rows then joins catalog via `useBooks()`. **Do not copy that join
  for wishlists:** `GET /books` omits unshelved rows. Join each membership `book_id` with `useBook` / `GET /books/{id}`
  and use a durable `Book {id}` fallback when the book is missing.
- Wishlist OpenAPI paths/schemas exist in `src/api/generated/openapi.ts` and `scripts/contractSmoke.test.ts`
  (`/wishlists`, `/wishlists/{wishlist_id}`, `/wishlists/{wishlist_id}/books`). `apiTypes.ts` does not export
  wishlist aliases. `createApi` does not expose a `wishlists` aggregate. `queryKeys` and `requestFields` have no
  wishlist entries. There is no `wishlistsApi`, `wishlistsQueries`, or `src/features/wishlists/` module.

## Product intent

An operator should be able to:

1. **Browse wishlists** -- open `/wishlists` and see every wishlist (name, optional description, membership count
   and/or visible rows) with each wishlist's books shown underneath (title/authors via `GET /books/{id}`, membership
   `status`, optional `priority` / `notes` / `url`). Membership rows may link to `/books/:bookId`.
2. **Create a wishlist when needed** -- from `/wishlists` (and/or from the add-book flow when the list is empty) so
   "add book to wishlist" is never a dead end. Required field: `name` (1..255). Optional `description`.
3. **Add a book to a wishlist from `/wishlists`** -- choose a target wishlist, capture catalog fields (title and
   authors required; optional ISBN lookup like `/books/new`), `POST /books` **omitting** `shelf_name`, then
   `POST /wishlists/{wishlist_id}/books` with at least `{ book_id }`. Default membership `status` may be omitted
   (API defaults to `wanted`) or offered as a simple select. Optional `priority` / `notes` / `url` may ship as a
   minimal secondary form or be deferred to defaults/`null` for v1 -- prefer the smallest flow that succeeds
   end-to-end. Do not send `shelf_name` on that create (omit the key; do not send a display string or `removed`).
4. **Stay honest about API limits** -- do not fake remove-from-wishlist or membership status edits; those
   endpoints do not exist. Do not offer "Add to wishlist" on `/books` or for any book that already has shelf
   membership (would **412**). Do not invent a move-to-shelf / acquire flow; placing a wishlisted book on a shelf
   requires deleting the wishlist first. Optional wishlist rename (`PATCH`) and permanent delete (`DELETE` +
   `ConfirmationDialog`) may ship on `/wishlists` if they stay small; otherwise leave rename/delete for a follow-up
   and document the gap.

If a wishlisted book is opened on `BookDetailsPage`, keep existing action gates. Map edit **412** when the operator
assigns `shelf_name` while the book is still on a wishlist. Do not add an "Add to wishlist" control on collection
cards or on detail for shelved books.

Tone and layout: extend existing list/section patterns (`LoansPage` sections, `BooksPage` cards). One job per
section. Do not invent a card-heavy dashboard of wishlists or cover-image grids (covers remain out of scope).

## Out of scope

- Adding a book from `/books` or any other shelf-backed collection picker (API **412**).
- Membership remove or status/priority edit (no API).
- Acquire / move-to-shelf from a wishlist without deleting the wishlist (no membership-level DELETE).
- Cover images, Amazon/Goodreads sync, acquisition/"where did you get this?" flows.
- Dashboard wishlist metrics or regressing FEAT-18 `/books` filter/sort UX.
- Changing `/books/new` so collection create can omit a shelf.
- Soft-delete / restore for wishlists (API hard-deletes).
- A separate `/wishlists/:wishlistId` route unless the single `/wishlists` page becomes unwieldy; prefer one page
  that lists wishlists and nested contents first.

## Remaining scope (file-level plan)

### 1. Schema aliases

| File | Change |
| ---- | ------ |
| `src/api/apiTypes.ts` | Export aliases: `WishlistCreate`, `WishlistUpdate`, `WishlistRead`, `WishlistList`, `WishlistBookCreate`, `WishlistBookRead`, `WishlistBookList`, `WishlistBookStatus`. Do not hand-edit `src/api/generated/openapi.ts`. |
| `src/api/apiTypes.test.ts` | Cover new aliases if the file asserts exported schema names/shapes. |

### 2. Typed wishlist API helpers and request picking

| File | Change |
| ---- | ------ |
| `src/api/wishlistsApi.ts` | New module mirroring `loansApi` / `booksApi`: `list({ skip?, take? })` → `GET /wishlists`; `create(body)` → `POST /wishlists` (**201**); `update(id, body)` → `PATCH /wishlists/{id}`; `remove(id)` → `DELETE /wishlists/{id}` (**204**); `listBooks(wishlistId, { skip?, take? })` → `GET .../books`; `addBook(wishlistId, body)` → `POST .../books` (**201**, **412** when the book has shelf membership). Send `skip`/`take` together when paginating; omit when unused. Accept optional `AbortSignal`. Serialize only documented fields. |
| `src/api/requestFields.ts` | Add `WISHLIST_CREATE_KEYS`, `WISHLIST_UPDATE_KEYS`, `WISHLIST_BOOK_CREATE_KEYS` and `pickWishlistCreate` / `pickWishlistUpdate` / `pickWishlistBookCreate` using `pickDocumentedRequestFields`. |
| `src/api/requestFields.test.ts` | Cover picking documented keys and omitting undocumented extras for the three wishlist bodies. |
| `src/api/api.ts` | Aggregate `wishlists: createWishlistsApi(client)` on `createApi`. |
| `src/api/api.test.ts` | Assert `createApi` exposes `wishlists` helpers. |
| `src/api/wishlistsApi.test.ts` | New colocated tests: list query params; create/update bodies; delete **204**; listBooks path + pagination; addBook path/body; **400** / **404** / **412** / **422** surface as `ApiError` with preserved detail where applicable. |

Wishlist catalog create reuses existing `booksApi.create` / `useCreateBook`. That helper must omit `shelf_name`
entirely on this path (do not send `null` unless the documented picker already treats omitted and JSON `null` the
same; prefer omitting the key). Do not change collection create on `/books/new`.

### 3. Query keys, hooks, and invalidation

| File | Change |
| ---- | ------ |
| `src/api/queryKeys.ts` | Add `wishlists.all`, `wishlists.list({ skip?, take? })`, `wishlists.books(wishlistId, { skip?, take? })` (and optional infinite-list keys if infinite scroll is used). Keep keys stable and omit unused pagination fields the same way books/loans do. |
| `src/api/wishlistsQueries.ts` | New hooks: `useWishlists`, `useWishlistBooks(wishlistId)` (disabled when falsy), `useCreateWishlist`, `useUpdateWishlist` (if UI ships PATCH), `useDeleteWishlist` (if UI ships DELETE), `useAddWishlistBook`. On success: invalidate `queryKeys.wishlists.all` (and specific list/books keys as needed). After add, `useBook(book_id)` / books detail is the catalog join -- do not invent book-detail rewrites from membership responses. |
| `src/api/wishlistsQueries.test.tsx` (and/or extend `serverStateQueries.test.tsx`) | Assert keys, enabled/disabled detail/books hooks, and that add/create mutations invalidate wishlist queries. |

For v1 list sizes, unpaginated `useWishlists()` / per-wishlist `useWishlistBooks(id)` (full list, no `skip`/`take`) is
acceptable and matches early loans/books callers. If wishlist memberships grow large, prefer infinite scroll using
shared `INFINITE_SCROLL_BATCH_SIZE` -- do not invent a second pagination system.

### 4. Feature module -- `/wishlists` page

| File | Change |
| ---- | ------ |
| `src/features/wishlists/routes/WishlistsPage.tsx` | New route page. Load wishlists via `useWishlists`. For each wishlist, load memberships via `useWishlistBooks(wishlist_id)` (parallel per-wishlist queries are fine for a small personal library). Join each membership `book_id` via `useBook` / `GET /books/{id}` -- **not** `useBooks()` -- and show title/authors when found, durable `Book {id}` fallback when missing. Render `status` with `enumDisplayValue` against `WishlistBookStatus`. Show empty wishlist messaging distinctly from empty membership lists. Create-wishlist form: `name` required, `description` optional; `Field`-linked **422**; disable while pending; success refreshes list (toast optional via `useNotifications`). |
| `src/features/wishlists/wishlistDisplay.ts` (optional) | Small helpers: status labels, priority display (`null` → em dash or "No priority"), safe URL rendering (`<a>` only for absolute http(s) URLs; never `javascript:`). Colocate unit tests if non-trivial. |
| `src/features/wishlists/routes/WishlistsPage.test.tsx` | Loading / error+retry / empty wishlists; create success; nested memberships with `GET /books/{id}` join and missing-book fallback; status display; no network invention of membership delete; add-book create omits `shelf_name`. |

Optional on the same page (include if it stays small):

| File | Change |
| ---- | ------ |
| `WishlistsPage.tsx` | Rename via `useUpdateWishlist` + confirmation; permanent delete via `ConfirmationDialog` + `useDeleteWishlist` with copy that memberships are removed but catalog books remain, and that a wishlisted book cannot be placed on a shelf until its wishlist is deleted. |

### 5. Add-to-wishlist (unshelved create, not collection)

| File | Change |
| ---- | ------ |
| `src/features/wishlists/components/AddWishlistBookControl.tsx` (recommended) | Shared control on `/wishlists`: select target wishlist (empty list → inline create or link to the create form), capture title/authors (required) plus optional ISBN lookup, omit `shelf_name` on `POST /books`, then `useAddWishlistBook` with `{ book_id, status? }`. Optional status select defaulting to `wanted`. Handle **404** (unknown wishlist/book) with refetch + clear message; **412** `"Existing books cannot be added to a wishlist"` with a clear exclusivity message (do not retry by sending a shelf); **422** Field-linked when status/body invalid; disable while pending; success toast or polite status. If create succeeds and add fails, surface the add error honestly -- do not invent a compensating `DELETE /books/{id}`. Reuse `BookForm` only if it can omit the shelf picker without regressing `/books/new`; otherwise a slimmer wishlist create form is fine. |
| `src/features/books/routes/BooksPage.tsx` | **No change** for wishlist actions. Do not add per-card "Add to wishlist". Do not regress URL-backed category / author / title filters, shelf sort, or filtered vs unfiltered empty states. |
| `src/features/books/routes/BookDetailsPage.tsx` | Do not add "Add to wishlist" for shelved books. Membership rows may link here; keep other action gates unchanged. |
| `src/features/books/routes/EditBookPage.tsx` / `bookEditModel` as needed | Map **412** `"The book must be removed from the wishlist before it can be placed on a shelf"` when assigning `shelf_name` (Field-linked or page alert). Do not invent membership delete from the edit form. |
| `src/features/wishlists/components/AddWishlistBookControl.test.tsx` | Create omits `shelf_name`; mutate add payload `{ book_id, status? }`; empty-wishlist path; **404** / **412** / **422** / pending disable. |
| `src/features/books/routes/BooksPage.test.tsx` | Assert there is still **no** add-to-wishlist affordance on collection cards. |
| `src/features/books/routes/EditBookPage.test.tsx` | Assert documented **412** shelf-vs-wishlist messaging when the API rejects `shelf_name`. |

### 6. Routing, navigation, and metadata

| File | Change |
| ---- | ------ |
| `src/routes/routeMetadata.ts` | Add `wishlists: { path: '/wishlists', title: 'Wishlists', heading: 'Wishlists' }`. |
| `src/routes/routes.tsx` | Register `WishlistsPage` at `routeMetadata.wishlists.path` under `AppShell`. |
| `src/layout/AppShell.tsx` | Add `{ label: 'Wishlists', to: '/wishlists' }` to the Collection `DrawerNavMenu` items (after Manage). Add
  `/wishlists` to that drawer's `activePrefixes`. Do not add a flat header link or park Wishlists under admin /
  Manage Collection. |
| `src/layout/AppShell.test.tsx` | Open the Collection drawer and expect a Wishlists link to `/wishlists`. Assert the Collection trunk is
  `data-active` on `/wishlists`. |
| `src/App.test.tsx` | Optional: document title / heading focus when navigating to `/wishlists`. |

### 7. Styling

| File | Change |
| ---- | ------ |
| `src/styles/components.css` | Add BEM-like classes only as needed (e.g., `.wishlists-page`, `.wishlist`, `.wishlist__books`, `.wishlist-membership`) reusing existing list/section spacing tokens. Prefer extending `.books-page` / `.loans-page` patterns over new visual systems. |
| `src/styles/shell.css` | Only if the Collection drawer needs adjustment for an extra item (Wishlists) at narrow widths. |

### 8. Docs hygiene (after implementation)

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Document wishlist helpers, hooks, `/wishlists` route, unshelved `POST /books` (omit `shelf_name`) before add, **412** shelf/wishlist exclusivity, and that memberships join catalog via `GET /books/{id}` because `GET /books` omits unshelved rows. Note wishlists are now in-scope product UI (update the "out of scope unless explicitly requested" line and the "do not ship wishlist product UI" notes). Update the "shelf_name on create" compensation: required for collection create, omitted for wishlist-only rows. Mark FEAT-19 complete or remove the ticket file per project convention when done. |
| `docs/full-project-context.md` | Same wishlist inventory notes when that pack is kept current. |
| `docs/ToDo.md` | Optional checklist line; prefer ticket presence under `docs/tickets/` as source of truth. |

## Acceptance criteria

- Typed `wishlistsApi` + React Query hooks cover list/create wishlists, list memberships, and add-book; optional
  update/delete only if the UI ships them.
- `yarn api:check` remains clean against `docs/technical-reference/openapi.json`.
- `/wishlists` lists all wishlists and shows each wishlist's membership contents with catalog title/authors from
  `GET /books/{id}` when available and a durable id fallback when not.
- Operators can create a named wishlist from the wishlists page (or from the add flow when none exist).
- Operators can add a book from `/wishlists` by creating an unshelved catalog row (`POST /books` with no
  `shelf_name`) then `POST .../books`. `/books` has no add-to-wishlist action.
- Collection create on `/books/new` still requires an explicit shelf.
- Membership `status` uses the OpenAPI enum; unknown values render safely via `enumDisplayValue`.
- Duplicate memberships are allowed by the API; the UI must not invent a uniqueness error.
- **412** add (`"Existing books cannot be added to a wishlist"`) and **412** shelf assignment (`"The book must be
  removed from the wishlist before it can be placed on a shelf"`) are surfaced honestly; the UI does not offer
  add-from-collection as a workaround.
- No fake membership remove/edit; no cover images; no generic `PATCH` used to simulate wishlist lifecycle.
- Loading, empty, and `QueryErrorState` / **403** handling match existing product pages.
- Colocated tests cover API helpers (including **412**), hooks invalidation, WishlistsPage, add control (omit
  `shelf_name`), no BooksPage add affordance, and edit **412** shelf messaging.
- `make check` passes.

## Plan coverage

Wishlist browse + add via unshelved catalog create against the authenticated wishlist contract, including
shelf/wishlist mutual exclusion. Explicitly excludes add-from-collection, acquisition workflows, membership
mutation endpoints the backend does not provide, and unrelated shelves catalog or dashboard report work.
