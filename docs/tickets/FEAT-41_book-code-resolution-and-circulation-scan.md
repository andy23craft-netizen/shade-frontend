# FEAT-41 -- Book Code Resolution and Circulation Scanning

**Status:** Ready against OpenAPI 1.1.3.

**Depends on:** `FEAT-40`, shipped `POST /catalog/resolve-code`, book lifecycle routes, and library `enable_loans`.

## Objective

Resolve Shade item QR values and commercial ISBNs into safe, copy-specific book navigation and circulation actions.

## Acceptance criteria

- [ ] Scanning submits the raw value to `POST /catalog/resolve-code`; frontend code does not infer tenant or resolve UUIDs locally.
- [ ] A Shade book code resolves zero or one copy; a commercial identifier may show an explicit candidate chooser.
- [ ] Available copies offer checkout, active loans offer check-in, Reserved/Reading use the override flow, and Missing/Display Only expose no checkout.
- [ ] With loans disabled, resolution and Book Details remain available but new circulation actions do not.
- [ ] `404` unknown/other-tenant and `422` malformed/unsupported values receive safe distinct recovery copy without leaking existence.
- [ ] Camera and hardware-scanner paths preserve focus, cancellation, rapid-scan safety, and accessible announcements.

## Out of scope

Unauthenticated scanning, album scanning, and QR generation.

## Open questions

1. Which page owns the primary circulation scanner entry point: Reading Loans, Manage Collection, or both?
2. After successful checkout/check-in, should scanning immediately re-arm or wait for explicit confirmation?
