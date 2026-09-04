# FEAT-02 -- Album MVP frontend

## Status

Core album MVP UI is shipped against backend **1.1.0**. Browse/add/detail/edit routes, Discogs/MusicBrainz lookup with
artist/genre resolution, private artwork get/upload/delete/refetch, checkout/check-in/mark-played, soft-delete/restore,
album loan history, dashboard Listening Room widgets, mixed wishlist `/items` plus album membership add/remove/move, and
Vite proxy paths for `/albums`, `/artists`, and `/genres` are in the tree. Collections remain book-only.

Contract authority is `docs/technical-reference/openapi.json` (`info.version` **1.1.0**) and
`docs/technical-reference/API-for-FE.md`. Identifier rules (`book_id`, `wishlist_item_id`, nullable loan/wishlist
`book_id`/`album_id`) and book-only compatibility are already live; do not re-litigate them here.

## Remaining work

1. Add focused unit coverage for album catalog create/edit, lookup hydration, artwork mutations, circulation and
   mark-played, soft-delete/restore, dashboard album widgets, mixed wishlist album membership (including typed-ID
   conflicts and **409**/**412** handling), and nullable `album_id` guards.
2. Add browser coverage for representative album journeys (create via lookup, artwork, checkout/check-in, mark-played,
   wishlist membership, hard reload with current field shapes). Prefer extending `e2e/` fixtures rather than inventing a
   second mock stack.
3. Confirm release pairing: frontend album UI ships only with matching backend **1.1.0** and a rehearsed retained-data
   migration that includes `album_artwork`. The SPA cannot compensate for an older schema.

Visual language polish against `docs/product-docs/UI_DESIGN_NOTES.ALBUM_ANALOGIES.md` is out of scope for closing this
ticket unless an explicit follow-up asks for it.

## Acceptance criteria

- Focused unit and browser coverage above pass under `make check`.
- Album flows exercise dedicated lifecycle endpoints (no simulated checkout/check-in/mark-played/artwork via generic
  `PATCH`).
- Global Loans remains `media_type=book`; album loan history uses `album_id` / `media_type=album` and never substitutes
  `album_id` into book URLs.
- Mixed wishlist UI uses `GET /wishlists/{wishlist_id}/items`; book note editing stays on the book membership PATCH.
- Album dashboard statistics stay separate from book totals and labels.
- Artwork is loaded only through authenticated album artwork routes (no constructed storage URLs, no direct Cover Art
  Archive / Discogs artwork calls from the browser).
