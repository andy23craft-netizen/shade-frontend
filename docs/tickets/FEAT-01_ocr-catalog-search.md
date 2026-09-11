# FEAT-01 -- OCR catalog search

**Status:** Implemented; awaiting opt-in live API validation.

**Dependency group:** Mixed-media catalog discovery.

**Depends on:** Backend FEAT-1's checked-in OpenAPI and API-for-FE contract updates; the existing authenticated API
client; book and album detail routes.

## Objective

Let a signed-in library user choose or capture a book-cover or album-artwork image, submit it once to the catalog
image-search endpoint, and use the returned OCR-based local and external-provider candidates as explicit suggestions.

## Product decisions

- Add the entry point to the shared catalog browsing/discovery experience, where both books and albums can be shown;
  do not create separate book-only and album-only search implementations.
- Offer file selection and a camera capture affordance when supported by the device. The control accepts JPEG, PNG,
  and WebP and sends the selected file as multipart field `image` to `POST /catalog/search-image`.
- Do not send the image to any other service, retain it in browser storage, create a query history, or attempt to
  derive an identifier or candidate locally.
- Show recognized text only as explanatory context. Candidates remain suggestions: users choose a result themselves.
- Existing catalog candidates link with their typed identifier to the correct existing route: books to `/books/:bookId`,
  albums to `/albums/:albumId`. External Open Library and Discogs/MusicBrainz candidates hand a supplied ISBN,
  barcode, or Discogs release ID into the existing explicit add-and-lookup flow; they never create an item directly.

## Acceptance criteria

- [ ] The user can select a valid supported image and receives a clearly announced loading state while it is searched.
- [ ] Returned recognized text is displayed as context when present, without treating it as a query history or an
      automatic match.
- [ ] Book and album candidates render their display title, media type, matched fields, and backend-provided rank or
      score in a comprehensible, accessible result list.
- [ ] Candidate activation is explicit and opens the matching typed detail route; zero, one, and many candidates do
      not change that rule.
- [ ] A no-usable-text result and a no-match result have distinct, non-error empty states with a useful next action.
- [ ] Validation failures (422), provider failures (502), and timeouts (504) have distinct retry-safe messages;
      unsupported local files are rejected before submission when their MIME type is known, without relying on that
      client check for security.
- [ ] Replacing or clearing the selected image clears the prior visible result and releases any temporary object URL.
- [ ] The control is keyboard operable, has an accessible name and status/error announcement, works at narrow widths,
      and does not require a camera to be available.
- [ ] Tests cover multipart transport, typed routing, all result shapes, supported/unsupported selection, error
      states, keyboard flow, and neither persistent browser storage nor a second upload destination.

## Frontend implementation notes

- Generate types after the backend contract lands; add a narrowly scoped API method and React Query mutation rather
  than hand-maintained response types or an ad-hoc fetch path.
- Use the backend response's typed candidate IDs, matched fields, and ranking as authoritative. Do not re-rank,
  merge, guess a physical copy, decode QR payloads, or perform OCR in the browser.
- Keep request data in component/mutation lifetime only. Ensure diagnostic reporting and error rendering never include
  image bytes or recognized text.
- Reuse existing responsive form, async-status, error-summary, and catalog-card conventions where they fit; a camera
  capture UI may be lazy-loaded so normal catalog navigation does not load camera dependencies.

## Out of scope

Reverse-image lookup, embeddings or similarity indexes, client OCR, visual-result confidence interpretation,
automatic checkout/opening, saved searches, uploaded-image retention, and changes to catalog ranking.
