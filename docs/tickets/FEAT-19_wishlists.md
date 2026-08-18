# FEAT-19 -- Wishlists browse and add-from-collection

## Objective

Ship product UI for authenticated wishlist APIs already described in the backend contract: list and create
wishlists, list memberships, and add an existing catalog book to a wishlist. Augment `/books` so operators can
add books to a wishlist from the collection, and add a top-level `/wishlists` page that shows every wishlist and
its membership contents (joined to catalog book display fields).

This ticket is the product surface that earlier API contract sync explicitly deferred (OpenAPI already includes
wishlist paths/schemas). It does **not** add cover images, acquisition/purchase workflows, or membership
edit/remove endpoints the API does not expose.

## Dependencies

Generated OpenAPI types and `scripts/contractSmoke.test.ts` already include wishlist paths. `apiTypes.ts` does
**not** yet export wishlist schema aliases. Reuse the typed client, query keys, mutation invalidation, redaction
helpers, shared components, shelves patterns (`ShelvesPage` create/edit/delete + confirmation), and PLAN.md 7.5-style
cache invalidation. Do not invent membership PATCH/DELETE or soft-delete for wishlists. If wishlist types regress,
regenerate and extend contract smoke as a prerequisite rather than blocking.

FEAT-17 About homepage is complete (`/` is About; dashboard is `/dashboard`). FEAT-18 collection category / author /
title filters and shelf sort are complete on `/books` (ticket file removed) -- do not regress those controls.

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
- `../technical-reference/API-for-FE.md` -- behavioral rules OpenAPI does not fully express:
  - All wishlist routes are authenticated (Bearer).
  - No soft-delete for wishlists. `DELETE` permanently removes membership rows first, then the wishlist; catalog
    books are not deleted.
  - `GET /wishlists` order: `created_date` DESC, then `wishlist_id` DESC.
  - `GET /wishlists/{wishlist_id}/books` returns **membership rows**, not embedded `BookRead`. Default order:
    priority ASC (`null` last), then `created_date` ASC, then `wishlist_book_id` ASC.
  - `POST .../books` adds an existing catalog book; `status` defaults to `wanted`. Duplicate `(wishlist_id,
    book_id)` memberships are permitted. Soft-deleted catalog books may be referenced (existence, not active
    state).
  - `PATCH /wishlists/{wishlist_id}` is partial and preserves omitted fields.
  - Path `wishlist_id` / membership `book_id`: **400** when empty or not a valid GUID; **404** when well-formed
    but unknown.
  - Unsupported membership `status` → **422**.
  - List endpoints use paired `skip` / `take` when paginating; `total` is the full matching count.
  - The current API does **not** provide membership-level PATCH or DELETE.

Confirm against a representative running backend `/openapi.json` before locking transport types; record drift as a
blocker rather than inventing frontend semantics.

## Current baseline

Already in place and should be reused (not rebuilt):

- FEAT-03 / FEAT-04 patterns: typed `*Api.ts` helpers, `queryKeys`, React Query hooks, `createApi` aggregation,
  `pickDocumentedRequestFields` for request bodies, `enumDisplayValue` for unknown enums.
- `/books` via `BooksPage` + `useInfiniteBooks({ category, author, title, sortBy, sortOrder })` with URL-backed
  filters and shelf sort; cards link to detail with Read/Unread, rating, and Title Case `shelf_name`. No wishlist
  actions.
- `/books/:bookId` via `BookDetailsPage` with gated lifecycle actions (checkout, check-in, mark-read, edit, delete).
  No wishlist actions.
- Primary nav in `AppShell`: About, Dashboard, Books, Add Book, Check Out, Check In, Loans, Shelves, plus admin
  Deleted Books / Backup Library. No Wishlists link.
- `/shelves` via `ShelvesPage` is a good pattern for catalog create + Field-linked errors + `ConfirmationDialog`
  delete -- reuse patterns, not shelf domain logic.
- `routeMetadata` / `routes.tsx` have no `/wishlists` entry.
- Shared UI: `Button`, `AppLink`, `Field`, `EmptyState`, `LoadingState`, `QueryErrorState`, `ConfirmationDialog`,
  `Alert`, `useNotifications` toasts.
- Loans join pattern on `LoansPage`: list domain rows, join catalog via `useBooks()` for title/authors, durable
  `Book {id}` fallback when the book is missing -- reuse this approach for membership rows.
- Wishlist OpenAPI paths/schemas exist in `src/api/generated/openapi.ts` and `scripts/contractSmoke.test.ts`
  (`/wishlists`, `/wishlists/{wishlist_id}`, `/wishlists/{wishlist_id}/books`). `apiTypes.ts` does not export
  wishlist aliases. `createApi` does not expose a `wishlists` aggregate. `queryKeys` and `requestFields` have no
  wishlist entries. There is no `wishlistsApi`, `wishlistsQueries`, or `src/features/wishlists/` module.

## Product intent

An operator should be able to:

1. **Browse wishlists** -- open `/wishlists` and see every wishlist (name, optional description, membership count
   and/or visible rows) with each wishlist's books shown underneath (title/authors via catalog join, membership
   `status`, optional `priority` / `notes` / `url`).
2. **Create a wishlist when needed** -- from `/wishlists` (and/or from the add-to-wishlist flow when the list is
   empty) so "add book to wishlist" is never a dead end. Required field: `name` (1..255). Optional `description`.
3. **Add a catalog book to a wishlist from `/books`** -- per-row (or per-card) affordance that chooses a target
   wishlist and calls `POST /wishlists/{wishlist_id}/books` with at least `{ book_id }`. Default membership
   `status` may be omitted (API defaults to `wanted`) or offered as a simple select. Optional `priority` / `notes`
   / `url` may ship as a minimal secondary form or be deferred to defaults/`null` for v1 of this ticket -- prefer
   the smallest flow that succeeds end-to-end.
4. **Stay honest about API limits** -- do not fake remove-from-wishlist or membership status edits; those
   endpoints do not exist. Optional wishlist rename (`PATCH`) and permanent delete (`DELETE` +
   `ConfirmationDialog`) may ship on `/wishlists` if they stay small; otherwise leave rename/delete for a follow-up
   and document the gap.

Also add the same "Add to wishlist" action on `BookDetailsPage` so the action surface matches other book lifecycle
links; keep BooksPage as the ticket's stated collection entry point.

Tone and layout: extend existing list/section patterns (`LoansPage` sections, `BooksPage` cards). One job per
section. Do not invent a card-heavy dashboard of wishlists or cover-image grids (covers remain out of scope).

## Out of scope

- Membership remove or status/priority edit (no API).
- Creating catalog books from the wishlist page (memberships reference existing `book_id` only).
- Cover images, Amazon/Goodreads sync, acquisition/"where did you get this?" flows.
- Dashboard wishlist metrics or regressing FEAT-18 `/books` filter/sort UX.
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
| `src/api/wishlistsApi.ts` | New module mirroring `loansApi` / `booksApi`: `list({ skip?, take? })` → `GET /wishlists`; `create(body)` → `POST /wishlists` (**201**); `update(id, body)` → `PATCH /wishlists/{id}`; `remove(id)` → `DELETE /wishlists/{id}` (**204**); `listBooks(wishlistId, { skip?, take? })` → `GET .../books`; `addBook(wishlistId, body)` → `POST .../books` (**201**). Send `skip`/`take` together when paginating; omit when unused. Accept optional `AbortSignal`. Serialize only documented fields. |
| `src/api/requestFields.ts` | Add `WISHLIST_CREATE_KEYS`, `WISHLIST_UPDATE_KEYS`, `WISHLIST_BOOK_CREATE_KEYS` and `pickWishlistCreate` / `pickWishlistUpdate` / `pickWishlistBookCreate` using `pickDocumentedRequestFields`. |
| `src/api/requestFields.test.ts` | Cover picking documented keys and omitting undocumented extras for the three wishlist bodies. |
| `src/api/api.ts` | Aggregate `wishlists: createWishlistsApi(client)` on `createApi`. |
| `src/api/api.test.ts` | Assert `createApi` exposes `wishlists` helpers. |
| `src/api/wishlistsApi.test.ts` | New colocated tests: list query params; create/update bodies; delete **204**; listBooks path + pagination; addBook path/body; **400** / **404** / **422** surface as `ApiError` with preserved detail where applicable. |

### 3. Query keys, hooks, and invalidation

| File | Change |
| ---- | ------ |
| `src/api/queryKeys.ts` | Add `wishlists.all`, `wishlists.list({ skip?, take? })`, `wishlists.books(wishlistId, { skip?, take? })` (and optional infinite-list keys if infinite scroll is used). Keep keys stable and omit unused pagination fields the same way books/loans do. |
| `src/api/wishlistsQueries.ts` | New hooks: `useWishlists`, `useWishlistBooks(wishlistId)` (disabled when falsy), `useCreateWishlist`, `useUpdateWishlist` (if UI ships PATCH), `useDeleteWishlist` (if UI ships DELETE), `useAddWishlistBook`. On success: invalidate `queryKeys.wishlists.all` (and specific list/books keys as needed). Do not invent book-detail rewrites from membership responses. |
| `src/api/wishlistsQueries.test.tsx` (and/or extend `serverStateQueries.test.tsx`) | Assert keys, enabled/disabled detail/books hooks, and that add/create mutations invalidate wishlist queries. |

For v1 list sizes, unpaginated `useWishlists()` / per-wishlist `useWishlistBooks(id)` (full list, no `skip`/`take`) is
acceptable and matches early loans/books callers. If wishlist memberships grow large, prefer infinite scroll using
shared `INFINITE_SCROLL_BATCH_SIZE` -- do not invent a second pagination system.

### 4. Feature module -- `/wishlists` page

| File | Change |
| ---- | ------ |
| `src/features/wishlists/routes/WishlistsPage.tsx` | New route page. Load wishlists via `useWishlists`. For each wishlist, load memberships via `useWishlistBooks(wishlist_id)` (or a single batched strategy if added later -- do not N+1 without documenting it; parallel per-wishlist queries are fine for a small personal library). Join each membership `book_id` to catalog data via `useBooks()` (unpaginated active list) and/or `useBook` only when necessary; show title/authors when found, durable `Book {id}` fallback when missing (including soft-deleted / not in active list -- optionally also fetch `includeDeleted` if product wants deleted titles visible; default: active join + id fallback). Render `status` with `enumDisplayValue` against `WishlistBookStatus`. Show empty wishlist / empty library messaging distinctly. Create-wishlist form: `name` required, `description` optional; `Field`-linked **422**; disable while pending; success refreshes list (toast optional via `useNotifications`). |
| `src/features/wishlists/wishlistDisplay.ts` (optional) | Small helpers: status labels, priority display (`null` → em dash or "No priority"), safe URL rendering (`<a>` only for absolute http(s) URLs; never `javascript:`). Colocate unit tests if non-trivial. |
| `src/features/wishlists/routes/WishlistsPage.test.tsx` | Loading / error+retry / empty wishlists; create success; nested memberships with book join and missing-book fallback; status display; no network invention of membership delete. |

Optional on the same page (include if it stays small):

| File | Change |
| ---- | ------ |
| `WishlistsPage.tsx` | Rename via `useUpdateWishlist` + confirmation; permanent delete via `ConfirmationDialog` + `useDeleteWishlist` with copy that memberships are removed but catalog books remain. |

### 5. Add-to-wishlist from `/books` (and detail)

| File | Change |
| ---- | ------ |
| `src/features/wishlists/components/AddToWishlistControl.tsx` (recommended) | Shared control: loads wishlists, select target wishlist, optional status select defaulting to `wanted`, submit via `useAddWishlistBook`. Empty wishlists → inline create or link to `/wishlists`. Handle **404** (unknown wishlist/book) with refetch + clear message; **422** Field-linked when status/body invalid; disable while pending; success toast or polite status. Reuse from BooksPage and BookDetailsPage. |
| `src/features/books/routes/BooksPage.tsx` | Per active book row/card, expose "Add to wishlist" that opens the shared control (inline expand, dialog, or compact form -- prefer existing `ConfirmationDialog` / disclosure patterns over a new modal library). Do not block navigation to detail. Do not regress URL-backed category / author / title filters, shelf sort, or filtered vs unfiltered empty states. Soft-deleted books are not on this page; no special delete gating required beyond active collection. |
| `src/features/books/routes/BookDetailsPage.tsx` | Add "Add to wishlist" for any book that exists (including soft-deleted if detail can show deleted books -- match API: existence is enough). Keep other action gates unchanged. |
| `src/features/wishlists/components/AddToWishlistControl.test.tsx` | Select wishlist, default status, mutate payload `{ book_id, status? }`, empty-wishlist path, **404** / **422** / pending disable. |
| `src/features/books/routes/BooksPage.test.tsx` | Assert add affordance present and wires book id into the control (mock mutation). |
| `src/features/books/routes/BookDetailsPage.test.tsx` | Assert Add to wishlist action present for an active book. |

### 6. Routing, navigation, and metadata

| File | Change |
| ---- | ------ |
| `src/routes/routeMetadata.ts` | Add `wishlists: { path: '/wishlists', title: 'Wishlists', heading: 'Wishlists' }`. |
| `src/routes/routes.tsx` | Register `WishlistsPage` at `routeMetadata.wishlists.path` under `AppShell`. |
| `src/layout/AppShell.tsx` | Add primary nav `NavLink` to `/wishlists` (label "Wishlists"), near Books / Loans / Shelves -- not under admin. |
| `src/layout/AppShell.test.tsx` | Expect Wishlists nav link and current-page behavior on `/wishlists`. |
| `src/App.test.tsx` | Optional: document title / heading focus when navigating to `/wishlists`. |

### 7. Styling

| File | Change |
| ---- | ------ |
| `src/styles/components.css` | Add BEM-like classes only as needed (e.g., `.wishlists-page`, `.wishlist`, `.wishlist__books`, `.wishlist-membership`) reusing existing list/section spacing tokens. Prefer extending `.books-page` / `.loans-page` patterns over new visual systems. |
| `src/styles/shell.css` | Only if nav overflow needs adjustment for the extra primary link at narrow widths. |

### 8. Docs hygiene (after implementation)

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Document wishlist helpers, hooks, `/wishlists` route, Books/detail add affordances, and that memberships join catalog by `book_id`. Note wish lists are now in-scope product UI (update the "out of scope unless explicitly requested" line and the "do not ship wishlist product UI" notes). Mark FEAT-19 complete or remove the ticket file per project convention when done. |
| `docs/full-project-context.md` | Same wishlist inventory notes when that pack is kept current. |
| `docs/ToDo.md` | Optional checklist line; prefer ticket presence under `docs/tickets/` as source of truth. |

## Acceptance criteria

- Typed `wishlistsApi` + React Query hooks cover list/create wishlists, list memberships, and add-book; optional
  update/delete only if the UI ships them.
- `yarn api:check` remains clean against `docs/technical-reference/openapi.json`.
- `/wishlists` lists all wishlists and shows each wishlist's membership contents with catalog title/authors when
  available and a durable id fallback when not.
- Operators can create a named wishlist from the wishlists page (or from the add flow when none exist).
- `/books` can add an active collection book to a chosen wishlist via `POST .../books`.
- `BookDetailsPage` also offers Add to wishlist.
- Membership `status` uses the OpenAPI enum; unknown values render safely via `enumDisplayValue`.
- Duplicate memberships are allowed by the API; the UI must not invent a uniqueness error.
- No fake membership remove/edit; no cover images; no generic `PATCH` used to simulate wishlist lifecycle.
- Loading, empty, and `QueryErrorState` / **403** handling match existing product pages.
- Colocated tests cover API helpers, hooks invalidation, WishlistsPage, add control, and Books/detail wiring.
- `make check` passes.

## Plan coverage

Wishlist browse + add-from-collection against the authenticated wishlist contract. Explicitly excludes acquisition
workflows, membership mutation endpoints the backend does not provide, and unrelated shelves catalog or dashboard
report work.
