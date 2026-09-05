# FEAT-04 -- Album QR labels and scanning

**Status:** Blocked on the shared catalog code-resolution contract and label/scanner
infrastructure derived from PLAN-03.

**Dependency group:** Exact-copy QR labels and circulation scanning.

**Depends on:** Backend `POST /catalog/resolve-code`; shared QR generation/printing;
shared scanner and circulation selection; Enable Loans settings.

## Objective

Include albums in the shared exact-copy label, authenticated resolution, and scanner-driven
circulation experience.

## Acceptance criteria

- [ ] Album labels encode `shade:v1:album:<album_id>` with no tenant name or public URL.
- [ ] Reprinting preserves the same album UUID and uses the shared single/batch print
      templates and validation rules.
- [ ] A valid album Shade payload resolves to zero or one typed owned-copy summary containing
      title, primary artist, format, state, crate, checkout eligibility, and active-loan
      context.
- [ ] Malformed or unsupported Shade payloads and well-formed unknown/other-tenant labels use
      the shared safe error behavior.
- [ ] Commercial album barcodes may return multiple owned copies and present explicit copy
      selection rather than guessing.
- [ ] Exact-copy scans offer the appropriate checkout/check-in action based on lifecycle
      state and active-loan context.
- [ ] When Enable Loans is off, scanning can still resolve/open an album but exposes no new
      circulation action.
- [ ] Automated decode plus supported-phone print/scan tests cover conventional output;
      decorative output ships only if it passes the same matrix.

## Out of scope

Unauthenticated label landing pages, tenant-bearing QR payloads, identity rotation on
reprint, and dedicated scanner requirements beyond the shared acceptance matrix.
