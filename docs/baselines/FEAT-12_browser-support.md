# FEAT-12 browser support and smoke matrix

Recorded 2026-08-16 for FEAT-12 operational and browser hardening.

This matrix covers general product behavior. Scanner-specific browser/device coverage remains documented separately in `FEAT-06_scanner-support.md`.

## Supported evergreen targets

Desktop:

- Firefox latest
- Chrome latest
- Edge latest
- Safari latest on macOS

Mobile:

- Safari latest on iOS
- Chrome latest on Android

## Smoke scope

Representative checks:

- application shell and primary navigation
- route-title updates
- route-change heading focus
- keyboard-only navigation
- skip link
- forms and linked validation errors
- confirmation-dialog focus trapping and restoration
- loading, warning, success, and error announcements
- books list and book details
- checkout and check-in workflows
- loans
- deleted-books administration
- backup page
- 404 recovery
- 320px, tablet, and desktop responsive layouts
- long titles, authors, borrower names, notes, reviews, and other user content
- reduced-motion behavior

## Results

| Browser / device | Result | Notes |
|---|---|---|
| Firefox desktop | Pass | Manual FEAT-12 smoke completed at 320px, tablet, and desktop widths. Keyboard, focus, dialogs, forms, long-content wrapping, and reduced-motion checks passed. |
| Chrome desktop | Not tested | Chrome is not available in the current local test environment. |
| Edge desktop | Pending | Planned verification on an available Windows/Edge environment. |
| Safari macOS | Pending | Planned verification by another maintainer with access to macOS/Safari. |
| Safari iOS | Blocked | No iOS/Safari test environment currently available. |
| Chrome Android | Blocked | No Android/Chrome test environment currently available. |

## Blocker policy

Unavailable browser/device environments are recorded explicitly rather than assumed to pass.

Any browser-specific failure discovered before release should be fixed or tracked as an explicit release blocker.
