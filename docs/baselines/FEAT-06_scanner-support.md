# FEAT-06 scanner support matrix

Library: `@zxing/browser` (with `@zxing/library`) for camera decode. Hardware wedges use keyboard-like
input via `useHardwareIsbnScanner` / `IsbnScannerParser`. Camera code is lazy-loaded from `/books/new`.

Recorded for FEAT-06 acceptance. Broader evergreen smoke matrices and release checklists remain FEAT-12 /
FEAT-13. Re-run the manual rows below on real devices before calling FEAT-06 done.

## Capture modes

| Mode              | Supported inputs                         | Notes                                                                 |
|-------------------|------------------------------------------|-----------------------------------------------------------------------|
| Camera            | ISBN EAN-13 Bookland (`978` / `979`)     | UPC and other symbologies are filtered out before handoff             |
| Hardware wedge    | ISBN-10 / ISBN-13 with spaces or hyphens | Enter terminator; inter-key timeout; checksum via FEAT-05 `isbn.ts` |
| Manual typed ISBN | ISBN-10 / ISBN-13 with spaces or hyphens | Always available on `/books/new`, including when camera fails         |

Successful captures hand one ISBN string into the existing FEAT-05 lookup path. Scanning never calls
`POST /books`.

## Camera browser matrix

Secure context required (`https:` or `http://localhost` / loopback). Camera permission is requested only after
the explicit "Scan ISBN" action.

| Platform        | Browser                         | Status      | Notes                                              |
|-----------------|---------------------------------|-------------|----------------------------------------------------|
| Desktop macOS   | Current Chrome                  | Supported   | Preferred desktop verification target              |
| Desktop macOS   | Current Firefox                 | Supported   |                                                    |
| Desktop macOS   | Current Safari                  | Supported   |                                                    |
| Desktop Windows | Current Chrome / Edge           | Supported   |                                                    |
| Desktop Linux   | Current Chrome / Firefox        | Supported   |                                                    |
| iOS             | Current Mobile Safari           | Supported   | Requires HTTPS outside localhost                   |
| iOS             | Current Chrome (WebKit)         | Supported   | Same engine limits as Mobile Safari                |
| Android         | Current Chrome                  | Supported   | Preferred phone verification target                |
| Android         | Current Firefox                 | Supported   |                                                    |
| Any             | Insecure `http:` (non-loopback) | Unsupported | UI explains secure-context requirement             |
| Any             | No `mediaDevices.getUserMedia`  | Unsupported | UI explains unsupported browser; manual entry stays |

Unsupported in the MVP: Internet Explorer, legacy EdgeHTML, browsers without getUserMedia, and UPC-only product
scanners used as the camera target.

## Dedicated hardware scanners

| Scanner behavior                         | Status      | Notes                                                                 |
|------------------------------------------|-------------|-----------------------------------------------------------------------|
| USB/Bluetooth wedge ending with Enter    | Supported   | Focus may remain in an input; ordinary typing is not swallowed        |
| Wedge that emits ISBN-10 or ISBN-13 text | Supported   | Invalid checksums are dropped before lookup                           |
| Wedge without Enter terminator           | Unsupported | Buffer clears on inter-key timeout; configure the scanner for Enter   |
| Continuous duplicate scans               | Supported   | Parser generation/reset plus first-frame camera guard avoid duplicates|

## Failure and recovery paths

| Condition                         | User-visible behavior                                      |
|-----------------------------------|------------------------------------------------------------|
| Permission denied                 | Error alert; Cancel; manual ISBN entry remains usable      |
| No camera                         | Error alert; manual entry remains usable                   |
| Unsupported browser               | Error alert; camera does not start                         |
| Insecure context                  | Error alert; camera does not start                         |
| No readable ISBN within timeout   | Warning with "Keep scanning"; video stays available        |
| Multiple cameras                  | Camera select appears after start; switching stays in flow |

## Automated coverage

- Parser and hardware hook unit tests under `src/features/scanning/`
- Camera media mocks: permission, missing camera, generic start failure, first-frame-only detect, unmount stop,
  ISBN-only hints, UPC rejection, insecure/unsupported messaging, scan timeout, and multi-camera switching
- `NewBookPage` handoff tests for camera and hardware captures into `useBookLookup`

## Manual verification checklist

Run against a connected API on `/books/new`. Check each supported row you have available:

- [ ] Desktop Chrome: Scan ISBN opens camera, live guidance appears after start, ISBN handoff fills lookup
- [ ] Desktop Safari or Firefox: same happy path
- [ ] Android Chrome: rear camera scan of a Bookland ISBN barcode
- [ ] iOS Safari (HTTPS): permission prompt, successful scan or clear denial messaging
- [ ] Multi-camera device: switch cameras without leaving the scan flow
- [ ] Hardware wedge with Enter: valid ISBN triggers lookup; invalid checksum is ignored
- [ ] Deny camera permission: accessible error; typed ISBN lookup still works
- [ ] Insecure non-loopback origin (if available): secure-context message; typed entry still works
- [ ] Unreadable / no barcode until timeout: warning appears; Keep scanning and manual entry work
- [ ] UPC-only product barcode: not accepted as an ISBN capture

Mark the ticket complete only after the supported combinations you ship against pass this checklist.
