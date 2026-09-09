# FEAT-93 -- Book QR Label Print Research

**Status:** Research needed. The browser generator and selection flows are delivered; final
      label dimensions depend on the chosen paper stock and work-printer validation.

**Depends on:** `FEAT-39` for copy-explicit intake.

## Review objective

Confirm that deterministic `shade:v1:book:<book_id>` labels print, scan, and align correctly on the selected stock.

## Acceptance criteria

- [x] Book Details, successful intake via Book Details, explicit bulk selection, and Manage Collection use the same generator.
- [x] The conventional browser template is high contrast, 3 x 3 inches, and lays out two across by three down on US Letter.
- [x] A single reprint can start in any of the six sheet positions without rotating identity.
- [x] Preview output identifies the catalog-wide or explicit selection and encodes only the copy identifier.
- [ ] Select the label paper stock; confirm its label size, gaps, margins, and whether it requires a different template.
- [ ] Test the work Lexmark printer with the chosen stock at 100% / Actual Size (not Fit to Page), verifying page orientation, tray compatibility, and alignment across all six positions.
- [ ] Scan a representative printed sample with the supported phone(s), including the smallest practical code, and record any required QR size or error-correction adjustment.
- [ ] Confirm browser print preview shows the label sheet rather than a blank page after the print stylesheet fix.

## Out of scope

Server-generated PDFs, public label landing pages, and album labels.

## Deferred design note

1. Is the optional portrait/cameo decoration approved for the first release, or should it remain deferred?
- I would like to try it. If it is prohibitive, we can revisit. 

The selected paper stock will determine the final template dimensions. Sign-off must include the work Lexmark printer's supported stock, tray, and 100%/Actual Size print setting.
