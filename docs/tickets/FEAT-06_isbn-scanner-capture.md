# FEAT-06 — ISBN scanner capture

## Objective

Acquire ISBNs with a camera or dedicated scanner and hand them to the reviewable creation flow.

## Dependencies

FEAT-05 is complete. Scanning already reuses FEAT-05 checksum validation (`src/features/books/utils/isbn.ts`) and the
editable lookup/create flow on `/books/new`. Do not invent a second lookup or create path, and do not call
`POST /books` from scanner success.

Checkout belongs to FEAT-07; reading completion to FEAT-09; metadata edit to FEAT-10. Broader evergreen browser smoke
and release checklists belong to FEAT-12 / FEAT-13. This ticket still owns confirming the scanner-specific matrix in
`docs/baselines/FEAT-06_scanner-support.md`.

## Explicitly out of scope (owned by later tickets)

| Later ticket | Owns (do not pull into FEAT-06)                         |
|--------------|---------------------------------------------------------|
| FEAT-07      | Checkout workflow                                       |
| FEAT-09      | Mark-read and reading-field UI                          |
| FEAT-10      | Edit route wiring that reuses `BookForm` for metadata   |
| FEAT-12      | Finalize broader browser/device smoke documentation     |
| FEAT-13      | Release keyboard / viewport / manual scanner checklists |

Also out of scope for the MVP: UPC support, automatic creation after a scan, and any scanner-specific backend endpoints.

## Current baseline

Already in place and should be extended only if manual verification finds a gap:

- `src/features/scanning/` with `@zxing/browser` / `@zxing/library`: `isbnCameraCapture` (ISBN-only EAN-13 / Bookland
  hints, secure-context and getUserMedia checks, scan timeout constant), `IsbnCameraScanner` (lazy-loaded from
  `NewBookPage`), `useHardwareIsbnScanner`, and `IsbnScannerParser`.
- Camera permission is requested only after the explicit "Scan ISBN" action. Cancel, unmount, successful detect, and
  media-track `ended` stop the ZXing controls; the first acceptable decoded frame wins. After a successful start,
  `isStarting` clears and live-scan guidance is shown. Multi-camera devices get an in-flow camera select.
- Capability and recovery messaging covers insecure context, unsupported browser, permission denied, missing camera,
  generic start failure, and no-readable-ISBN timeout ("Keep scanning"); typed/manual entry stays usable.
- Hardware wedge capture uses terminator (Enter) plus inter-key timing/buffering; invalid checksums are dropped; the
  listener does not `preventDefault` ordinary typing. Hardware listening is disabled while the camera UI is open or
  lookup is fetching.
- `NewBookPage` hands camera and hardware captures into the existing lookup ISBN path (`startLookup` /
  `useBookLookup` / `BookForm`); scanning never calls `useCreateBook` / `POST /books`.
- Support matrix: `docs/baselines/FEAT-06_scanner-support.md`.
- Colocated tests cover parser state, hardware hook, camera media mocks (ISBN-only hints, UPC rejection,
  insecure/unsupported messaging, timeout, multi-camera switch, starting-state clear, first-frame-only, unmount stop),
  and `NewBookPage` handoff.

## Remaining scope

- Manually verify the supported phone/browser and dedicated-scanner combinations against
  `docs/baselines/FEAT-06_scanner-support.md` (checklist in that file). Mark the ticket complete only after those
  supported combinations pass.

## Acceptance criteria

- The documented scanner matrix in `docs/baselines/FEAT-06_scanner-support.md` passes on the supported phone/browser
  and dedicated-scanner combinations listed there.
- `make check` passes.

## Plan coverage

Workstream 5; sections 7.8, 10, 12, and 13; scanning outcomes and quality gates.
