# FEAT-06 — ISBN scanner capture

## Objective

Acquire ISBNs with a camera or dedicated scanner and hand them to the reviewable creation flow.

## Dependencies

FEAT-05 is complete. Reuse FEAT-05 checksum validation (`src/features/books/utils/isbn.ts`) and the editable
lookup/create flow on `/books/new` (`NewBookPage`, shared `BookForm` / `bookFormDefaults` / `bookFormModel`,
`useBookLookup`, `useCreateBook`). Do not invent a second lookup or create client, and do not call `POST /books` from
scanner success.

Checkout belongs to FEAT-07; reading completion to FEAT-09; metadata edit to FEAT-10. Do not pull those workflows into
this ticket.

## Explicitly out of scope (owned by later tickets)

| Later ticket | Owns (do not pull into FEAT-06)                         |
|--------------|---------------------------------------------------------|
| FEAT-07      | Checkout workflow                                       |
| FEAT-09      | Mark-read and reading-field UI                          |
| FEAT-10      | Edit route wiring that reuses `BookForm` for metadata   |

Also out of scope for the MVP: UPC support, automatic creation after a scan, and any scanner-specific backend endpoints.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for `GET /books/lookup` (query `isbn`, `BookLookupResponse`,
  `BookLookupDraft`) and `POST /books` if this ticket verifies handoff end-to-end. Paths, methods, and status codes
  come from OpenAPI; do not invent scanner-specific API routes.
- `../technical-reference/API-for-FE.md` -- FE vs API ownership (barcode/camera/manual capture is frontend; ISBN
  normalize/validate for ISBN-13, metadata lookup, and persistence are API), recommended add-book flow, and the ISBN-10
  check-digit gap.

### Documented contract facts for this ticket

Confirm against a representative running backend `/openapi.json` before locking behavior; record drift as a blocker.

- There is no barcode, camera, or scanner HTTP surface. Capture, format filtering, duplicate-scan suppression, and
  media-track lifecycle are frontend responsibilities.
- Recommended flow after a successful capture: hand one ISBN string to FEAT-05 → optional `GET /books/lookup?isbn=...`
  → editable draft → explicit user confirm → `POST /books`. Lookup does not create or modify a book.
- Accepted ISBN forms include ISBN-10, ISBN-13, spaces, and hyphens. Preserve the captured string for FEAT-05 / API
  validation; rely on the API for canonical ISBN-13 normalization. Strip separators only for local checksum checks.
- ISBN-13 check digits are validated by the API; ISBN-10 check digits are not. Route every captured value through
  FEAT-05 checksum validation so an invalid ISBN-10 is rejected before lookup and cannot exploit that gap.
- Blank lookup `isbn` is `422`. Do not start lookup with an empty or non-ISBN capture buffer.
- Lookup is protected (Bearer). Capture UI must still work when the user cancels before a network call; auth and
  lookup failure presentation remain FEAT-05's responsibility once handoff begins.
- UPC and other non-ISBN symbologies are out of scope for the MVP contract and product plan.

## Current baseline

Already in place and should be extended, not replaced:

- `NewBookPage` (`/books/new`): mounts shared `BookForm`, optional ISBN lookup via `useBookLookup` (checksum-gated;
  apply draft without overwriting the typed ISBN; progress/cancel/retry and manual fallback), creates via
  `useCreateBook`, maps create `422` field errors into the form summary, and navigates to the new detail on success.
  Manual typed entry and lookup remain available without any scanner UI.
- `BookForm` / `bookFormDefaults` / `bookFormModel`: create-field gating (`status=available`, `is_read=false`), Field-
  linked errors, year-only `publication_date` text input, tag normalization, and `formValuesToBookCreate`
  blank-optional-to-`null` conversion.
- `src/features/books/utils/isbn.ts`: `isValidIsbn10` / `isValidIsbn13` / `isValidIsbn` already wired into lookup and
  create submit paths. Colocated unit tests cover valid/invalid ISBN-10 (including `X`), formatted values, and ISBN-13.
- PLAN.md expects camera and hardware-scanner input under `src/features/scanning/`. That module does not exist yet;
  there is no camera permission flow, barcode decoder, lazy-loaded scanner bundle, hardware wedge/buffer parser, or
  documented device/browser matrix in the repo.

## Remaining scope

- Establish and document the supported desktop/mobile browser and device matrix before selecting a scanner library.
- Add `src/features/scanning/` (or an equivalent feature-owned module) and lazy-load camera/scanner code so ordinary
  navigation does not pay its download or startup cost.
- Add camera scanning for supported secure contexts, restricted to ISBN-10 and ISBN-13 barcode formats.
- Request camera permission only after explicit user action.
- Support cancellation, camera switching when available, stream interruption, and reliable media-track cleanup.
- Add dedicated keyboard-like scanner capture with terminator handling and timing/buffering rules.
- Suppress repeated frames/scans and hand exactly one captured ISBN string into the existing FEAT-05 flow on
  `/books/new` (fill the lookup/ISBN path that already drives `useBookLookup` and `BookForm`, without a second create
  path).
- Route captured values through FEAT-05 checksum validation so an invalid ISBN-10 is not accepted through the backend's
  documented check-digit gap.
- Keep typed/manual entry visible and usable in every scanner state.
- Explain unsupported browsers, insecure contexts, denied permission, unreadable codes, and timeout accessibly.
- Do not normalize captured ISBNs for the wire beyond what FEAT-05 already does; do not persist drafts or create books
  from this ticket's success path.

## Acceptance criteria

- Media tracks stop after success, cancellation, navigation, stream failure, and unmount.
- Scanning can initiate FEAT-05 lookup but can never create a book without review and confirmation (`POST /books` only
  after explicit FEAT-05 confirm).
- Invalid captured ISBN check digits produce an accessible correction/manual-entry path and do not start lookup.
- Captured ISBN-10 / ISBN-13 values (including spaces or hyphens when the scanner emits them) are handed through without
  inventing a second normalization layer.
- Repeated frames or scanner bursts cannot trigger duplicate lookups or creates.
- Hardware-scanner capture does not intercept ordinary typing in forms or elsewhere in the app.
- Parser and state-machine unit tests cover duplicate characters, trailing Enter, cancellation, timeouts, and stale
  results.
- Browser tests use controllable media mocks where real camera automation is unavailable.
- The documented manual matrix passes on supported phone/browser and dedicated-scanner combinations.
- Camera UI and errors are keyboard and screen-reader usable.
- `make check` passes.

## Plan coverage

Workstream 5; sections 7.8, 10, 12, and 13; scanning outcomes and quality gates.
