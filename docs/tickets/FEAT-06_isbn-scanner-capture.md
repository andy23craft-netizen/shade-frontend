# FEAT-06 — ISBN scanner capture

## Objective

Acquire ISBNs with a camera or dedicated scanner and hand them to the reviewable creation flow.

## Dependencies

FEAT-05.

## Contract references

Treat these as complementary, not interchangeable:

- `../technical-reference/openapi.json` -- authoritative for `GET /books/lookup` (query `isbn`, `BookLookupResponse`,
  `BookLookupDraft`) and `POST /books` if this ticket verifies handoff end-to-end. Paths, methods, and status codes
  come from OpenAPI; do not invent scanner-specific API routes.
- `../technical-reference/API-for-FE.md` -- FE vs API ownership (barcode/camera/manual capture is frontend; ISBN
  normalize/validate for ISBN-13, metadata lookup, and persistence are API), recommended add-book flow, and the ISBN-10
  check-digit gap.

This ticket owns capture and handoff only. Reuse FEAT-05 checksum validation and the FEAT-05 editable lookup/create
flow. Do not invent a second lookup or create client, and do not call `POST /books` from scanner success.

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

## Scope

- Establish and document the supported desktop/mobile browser and device matrix before selecting a scanner library.
- Lazy-load camera/scanner code so ordinary navigation does not pay its download or startup cost.
- Add camera scanning for supported secure contexts, restricted to ISBN-10 and ISBN-13 barcode formats.
- Request camera permission only after explicit user action.
- Support cancellation, camera switching when available, stream interruption, and reliable media-track cleanup.
- Add dedicated keyboard-like scanner capture with terminator handling and timing/buffering rules.
- Suppress repeated frames/scans and hand exactly one captured ISBN string to the existing FEAT-05 editable lookup
  flow (typed entry on `/books/new` or the shared capture entry that flow already accepts).
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

## Out of scope

UPC support, automatic creation after a scan, and any scanner-specific backend endpoints.
