# FEAT-06 — ISBN scanner capture

## Objective

Acquire ISBNs with a camera or dedicated scanner and hand them to the reviewable creation flow.

## Dependencies

FEAT-05 is complete. Reuse FEAT-05 checksum validation (`src/features/books/utils/isbn.ts`) and the editable
lookup/create flow on `/books/new` (`NewBookPage`, shared `BookForm` / `bookFormDefaults` / `bookFormModel`,
`useBookLookup`, `useCreateBook`). Do not invent a second lookup or create client, and do not call `POST /books` from
scanner success.

Checkout belongs to FEAT-07; reading completion to FEAT-09; metadata edit to FEAT-10. Do not pull those workflows into
this ticket. Finalizing the broader evergreen browser smoke matrix and release checklists belongs to FEAT-12 / FEAT-13;
this ticket still owns the initial scanner-specific matrix and the remaining camera gaps below.

## Explicitly out of scope (owned by later tickets)

| Later ticket | Owns (do not pull into FEAT-06)                         |
|--------------|---------------------------------------------------------|
| FEAT-07      | Checkout workflow                                       |
| FEAT-09      | Mark-read and reading-field UI                          |
| FEAT-10      | Edit route wiring that reuses `BookForm` for metadata   |
| FEAT-12      | Finalize broader browser/device smoke documentation     |
| FEAT-13      | Release keyboard / viewport / manual scanner checklists |

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

- `src/features/scanning/` with `@zxing/browser` / `@zxing/library`: `IsbnCameraScanner` (lazy-loaded from
  `NewBookPage`), `useHardwareIsbnScanner`, and `IsbnScannerParser`. Camera permission is requested only after the
  explicit "Scan ISBN" action. Cancel, unmount, successful detect, and media-track `ended` stop the ZXing controls;
  the first decoded frame wins.
- Hardware wedge capture uses terminator (Enter) plus inter-key timing/buffering; invalid checksums are dropped; the
  listener does not `preventDefault` ordinary typing. Capture while a focused input is intentional for wedge scanners.
- `NewBookPage` hands camera and hardware captures into the existing lookup ISBN path (`startLookup` /
  `useBookLookup` / `BookForm`); scanning never calls `useCreateBook` / `POST /books`. Manual typed entry stays
  visible. Hardware listening is disabled while the camera UI is open or lookup is fetching.
- Colocated tests: parser state machine (duplicates, Enter, cancel, timeouts, stale generations), hardware hook,
  camera media mocks (permission / no-camera / generic errors, first-frame-only, unmount stop), and `NewBookPage`
  handoff for camera and hardware scans.

## Remaining scope

- Document the supported desktop/mobile browser and dedicated-scanner matrix for this feature (library already chosen:
  `@zxing/browser`). Record which combinations are supported vs unsupported before calling the ticket done.
- Restrict camera decoding to ISBN-10 / ISBN-13 barcode formats so UPC and other out-of-scope symbologies are not
  accepted as captures.
- Add camera switching when multiple cameras are available.
- Explain unsupported browsers, insecure contexts, unreadable codes, and camera scan timeouts accessibly (denied
  permission and missing-camera alerts already exist). Keep typed/manual entry usable in those states.
- Clear the camera "starting" state after a successful start so the live-scan guidance is shown (today `isStarting`
  stays true after `decodeFromConstraints` resolves).
- Manually verify the documented phone/browser and dedicated-scanner combinations against that matrix.

## Acceptance criteria

- Camera decoding rejects non-ISBN symbologies (no UPC-as-ISBN path).
- When multiple cameras are available, the user can switch cameras without leaving the scan flow.
- Unsupported browser, insecure context, unreadable-code, and camera timeout paths are explained accessibly with
  manual entry still available.
- After a successful camera start, the UI leaves the starting state and shows live-scan guidance.
- The documented scanner matrix exists in-repo and passes on the supported phone/browser and dedicated-scanner
  combinations listed there.
- `make check` passes.

## Plan coverage

Workstream 5; sections 7.8, 10, 12, and 13; scanning outcomes and quality gates.
