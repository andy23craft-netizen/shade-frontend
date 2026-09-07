# FEAT-40 -- Book QR Label Generation and Printing

**Status:** Ready; frontend-only against stable `book_id` identity.

**Depends on:** `FEAT-39` for copy-explicit intake.

## Objective

Generate and reprint deterministic `shade:v1:book:<book_id>` labels for one or explicitly selected owned copies.

## Acceptance criteria

- [ ] Book Details, successful intake, explicit bulk selection, and Manage Collection **Generate All** entry points use the same generator.
- [ ] The conventional template is high contrast, approximately 3 x 3 inches, and prints two across by three down on US Letter.
- [ ] A single reprint can start in any of the six sheet positions without rotating identity.
- [ ] Preview and print output disclose the selected books and never encode tenant identity, URLs, bearer tokens, or bibliographic data.
- [ ] Every rendered code passes automated decoding; the conventional output passes the supported-phone print/scan matrix.
- [ ] Optional decoration cannot replace the conventional template and ships only if it passes the same tests.

## Out of scope

Server-generated PDFs, public label landing pages, and album labels.

## Open questions

1. Is the optional portrait/cameo decoration approved for the first release, or should it remain deferred?
2. Which supported phones, printers, paper stock, and print-scale settings define sign-off?
