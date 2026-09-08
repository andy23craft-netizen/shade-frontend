# FEAT-83 -- Human-Readable Book Catalog Links

**Status:** Ready for frontend work. No backend or OpenAPI changes.

**Depends on:** Existing contract fields only -- `CategoryRead.slug` and shelf `common_name` /
`shelf_name`. The SPA resolves those tokens locally and keeps calling list APIs with UUIDs /
`shelf_name` as today.

## Objective

Replace opaque category and shelf browse deep links with recognizable path-style vanity URLs so
web users can read, type, and share catalog filter links. Vanity paths are a frontend routing
concern only; the backend API does not change.

## Scope

In scope:

- Category browse links (e.g., Home featured categories, Books category filters) that today use
  `?category_id=<uuid>`.
- Shelf browse links that today use `?shelf_name=<common_name>` (or equivalent query deep links).

Out of scope:

- Collections (shared `/collections` page; not affected by this browse-link problem).
- Individual book vanity URLs / Book Details readable keys.
- Album genres or other Listening Room paths (unless a later ticket mirrors this pattern).
- Public sharing, unauthenticated routes, vanity domains.
- Frontend-owned slug generation from display labels.
- Rename-alias / redirect tables, and long-lived compatibility for pre-launch UUID query links
  (those links may go dead when vanity paths ship).
- Any backend readable-key, filter-param, or redirect contract work.

## Frontend-only design

Vanity URLs live in the React Router tree as path segments (slashes), not query strings.

Illustrative shapes (exact route names are an implementation detail):

- Category: `/books/category/<slug>` using `CategoryRead.slug`
- Shelf: `/books/shelf/<common_name>` using shelf `common_name` / `shelf_name`

Behavior:

1. Parse the path token from the route.
2. Resolve category slug → `category_id` via `GET /categories` (already loaded for filters).
3. Resolve shelf path token → `shelf_name` via `GET /shelves` / known `common_name` rules.
4. Call existing `GET /books` with the same transport params as today (`category_id`,
   `shelf_name`, etc.). Do not invent new API query params or path keys.
5. Prefer replace-navigating to the canonical path casing/token when the catalog returns a
   known key; unknown tokens get an explicit empty or not-found UX (no silent wrong match).

Using the existing backend `slug` / `common_name` fields in the URL is not "frontend-owned slug
generation." Inventing a slug from a display `name` remains forbidden.

## Acceptance criteria

- [ ] Category and shelf human-facing browse links use path-style vanity URLs (slash segments),
  not `?category_id=` / `?shelf_name=` query forms.
- [ ] Path tokens come from existing API fields (`CategoryRead.slug`, shelf `common_name` /
  `shelf_name`); the SPA never derives canonical tokens from labels alone.
- [ ] List and filter requests still use the current OpenAPI transport (UUIDs for categories;
  `shelf_name` for shelves). No API, OpenAPI, or backend contract change.
- [ ] Collisions, Unicode, case, percent encoding, malformed keys, and unknown keys are handled
  explicitly in the SPA.
- [ ] URL-backed filters, browser history, copied links, reloads, and canonicalization are
  tested.
- [ ] Pre-launch UUID / query deep links need not keep working.

## Open questions

None remaining for scope. Exact path prefixes under `/books/...` are an implementation choice
within this ticket.
