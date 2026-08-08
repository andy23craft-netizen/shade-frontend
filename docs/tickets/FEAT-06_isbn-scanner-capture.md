# FEAT-06 — ISBN scanner capture

## Objective

Acquire ISBNs with a camera or dedicated scanner and hand them to the reviewable creation flow.

## Dependencies

FEAT-05.

## Scope

- Establish and document the supported desktop/mobile browser and device matrix before selecting a scanner library.
- Lazy-load camera/scanner code so ordinary navigation does not pay its download or startup cost.
- Add camera scanning for supported secure contexts, restricted to ISBN-10 and ISBN-13 barcode formats.
- Request camera permission only after explicit user action.
- Support cancellation, camera switching when available, stream interruption, and reliable media-track cleanup.
- Add dedicated keyboard-like scanner capture with terminator handling and timing/buffering rules.
- Suppress repeated frames/scans and hand one captured ISBN to the existing editable lookup flow.
- Keep typed/manual entry visible and usable in every scanner state.
- Explain unsupported browsers, insecure contexts, denied permission, unreadable codes, and timeout accessibly.

## Acceptance criteria

- Media tracks stop after success, cancellation, navigation, stream failure, and unmount.
- Scanning can initiate lookup but can never create a book without review and confirmation.
- Repeated frames or scanner bursts cannot trigger duplicate lookups or creates.
- Hardware-scanner capture does not intercept ordinary typing in forms or elsewhere in the app.
- Parser and state-machine unit tests cover duplicate characters, trailing Enter, cancellation, timeouts, and stale results.
- Browser tests use controllable media mocks where real camera automation is unavailable.
- The documented manual matrix passes on supported phone/browser and dedicated-scanner combinations.
- Camera UI and errors are keyboard and screen-reader usable.
- `make check` passes.

## Plan coverage

Workstream 5; sections 7.8, 10, 12, and 13; scanning outcomes and quality gates.

## Out of scope

UPC support and automatic creation after a scan.
