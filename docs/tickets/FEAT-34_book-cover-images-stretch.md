# FEAT-34 -- Book cover images on Book Details (stretch)

## Objective

Add book cover display on Book Details using the existing authenticated cover contract
(`GET` / `PUT` / `DELETE /books/{id}/cover` and read-only `BookRead.cover_image_path`), without making V1 depend on
this work.

This ticket is a **stretch goal**. V1 completion does not depend on it (FEAT-35 must not block on this work).

Stop and defer rather than inventing a parallel FE-only cover provider, inventing browser URLs from
`cover_image_path`, or expanding into a new image-infrastructure project beyond the checked-in API.

## Current status

Backend contract is ready; SPA cover UI is not started.

- OpenAPI `0.2.10` (checked-in `docs/technical-reference/openapi.json` / `src/api/generated/openapi.ts`) exposes
  `BookRead.cover_image_path` (optional filename, not a URL) and `GET` / `PUT` / `DELETE /books/{id}/cover`.
  Behavioral detail (including **307** Open Library ISBN fallback) is in `docs/technical-reference/API-for-FE.md`
  (Book covers). `scripts/contractSmoke.test.ts` includes `/books/{id}/cover`.
- `booksApi` has no cover helpers. Cover fetch/upload/delete typed helpers and React Query hooks are not shipped.
- `BookDetailsPage` (`/books/:bookId`) renders metadata and actions with no cover image, placeholder, or
  authenticated cover fetch. No cover-related styles or tests exist under `src/`.

## Release rule

This ticket must not become a V1 blocker.

Defer implementation (or ship display-only and defer upload/delete) if product work would require:

- inventing `cover_image_path` browser paths or a separate FE-only Open Library / third-party cover client when the
  backend routes already exist;
- server-side secrets in the SPA;
- persistent image caching/storage owned by the frontend;
- significant attribution/compliance UI beyond what `API-for-FE.md` already implies for the Open Library redirect;
- problematic client-side rate-limit handling that cannot stay within the backend's existing redirect behavior.

Do not add a global image cache/library unless it is already necessary and still within this release rule; otherwise
defer.

## Contract to implement against

Do not re-investigate external providers from scratch. Prefer the checked-in OpenAPI and `API-for-FE.md` Book covers
section. Summary for implementers:

- `cover_image_path`: optional **filename** (e.g., `{book_id}.webp`). Non-null means a local file exists. `null` does
  **not** mean "no cover" -- `GET` may still **307** to Open Library when `isbn13` is present. Never PATCH or invent
  URLs from this field. Create/update JSON cannot set it.
- `GET /books/{id}/cover`: (1) local file → **200** image bytes + `Content-Type`; (2) no local file but `isbn13` →
  **307** `Location` to `https://covers.openlibrary.org/b/isbn/{isbn13}-L.jpg?default=false` (public; no Bearer on
  that host); (3) otherwise → **404** `"Book cover not found"`. Soft-deleted / missing book → **404**
  `"Book not found"`. Local uploads win over the ISBN redirect. OpenAPI lists **200** only -- treat **307** as live
  behavior.
- `PUT /books/{id}/cover`: multipart form field `file` (required); JPEG / PNG / WebP; max **10 MB**; empty or
  bytes/type mismatch → **422**; success **200** `BookRead` with updated `cover_image_path`.
- `DELETE /books/{id}/cover`: clears on-disk files and `cover_image_path` (**204**).
- Soft-deleted books reject cover get/upload/delete (**404**), same as other lifecycle routes.
- Browser `<img src>` cannot send `Authorization`. Prefer authenticated `fetch` to `GET /books/{id}/cover`: **200** →
  `response.blob()` + object URL (revoke on cleanup); **307** → use `Location` (or follow redirects when fetch mode
  allows); **404** / failure → intentional placeholder or clean omission.

Display on Book Details is the minimum product goal. Upload/delete UI is optional within this ticket if it stays
low-risk and uses `PUT` / `DELETE` only.

## Implementation scope

### Book Details integration

- Cover loading is independent from the core `useBook` / Book Details API request.
- The title/actions/details remain usable while a cover loads or fails.
- Render a cover only when confidently available (**200** blob or usable **307** `Location`).
- Missing cover (**404**), network failure, and broken image must all have deterministic behavior.
- Avoid repeated retry/error loops. Revoke object URLs on unmount / book change.

### Fallback

Use either:

- an intentional placeholder; or
- clean omission with stable layout.

Do not render broken-image UI.

### Accessibility

If adjacent visible title text already identifies the book and the cover is decorative, `alt=""` is acceptable.

Otherwise provide concise useful alt text.

### Responsive layout

Book Details must remain stable with:

- a normal cover;
- a tall/wide unusual cover;
- no cover;
- image load failure;
- 320 px viewport.

## Likely implementation areas

Verify before editing.

| Area | Expected change |
| --- | --- |
| `src/api/booksApi.ts` (+ tests) | Authenticated cover get (binary / **307**), optional upload (`FormData` `file`) and delete; no secret material. |
| books queries / hooks (as needed) | Non-blocking cover query or detail-local fetch; invalidate book detail after upload/delete. |
| `src/features/books/routes/BookDetailsPage.tsx` | Non-blocking image/fallback beside existing card layout. |
| `src/styles/components.css` (`.book-details-*`) | Stable responsive cover/details layout. |
| colocated tests | Blob / redirect / **404** / missing book, load failure/fallback, object-URL cleanup, accessibility behavior. |
| docs | Keep AGENTS / ticket notes aligned if upload/delete ships or display-only ships first. |

Helpers today are JSON-oriented (`apiClient`); cover get needs authenticated binary handling (and **307**), similar in
spirit to how `GET /backup` is a non-JSON binary response -- do not force cover bytes through JSON parsers.

## Acceptance criteria if implemented

- Book Details displays a cover when confidently available via `GET /books/{id}/cover`.
- Missing/unavailable covers render an intentional fallback or clean omission.
- Cover loading never blocks the core Book Details query or controls.
- Missing/broken cover does not cause repeated request/console-error storms.
- Accessible alt behavior is intentional.
- Layout is stable with and without a cover at desktop and 320 px.
- No invented `cover_image_path` browser URLs and no separate FE-only Open Library client.
- If upload/delete UI ships: multipart `file` only; success updates from returned `BookRead` / invalidation; soft-deleted
  books stay blocked.
- `make check` passes.

## Completion outcome if deferred

This ticket may also close as **intentionally deferred** if implementation would violate the release rule.

Record:

- what was attempted against the existing cover routes;
- blocking requirement;
- why the work is not appropriate for V1;
- confirmation that no partial cover dependency remains in the product path.

Deferral does not affect the V1 completion definition.
)
