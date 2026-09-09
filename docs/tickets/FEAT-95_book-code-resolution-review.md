# FEAT-95 -- Specific Review: Book Code Resolution and Circulation

**Status:** Specific integration-review ticket. The Loans resolver is delivered alongside the existing ISBN catalog-jump flow; live scanner and circulation review remain.

**Depends on:** Shipped `POST /catalog/resolve-code`, book lifecycle routes, and library `enable_loans`.

## Review objective

Verify safe, copy-specific book navigation and circulation after resolving Shade item QR values and commercial ISBNs.

## Acceptance criteria

- [x] The Loans resolver submits entered scan values to `POST /catalog/resolve-code`; it does not infer tenant identity or resolve UUIDs locally.
- [x] A Shade book code with one result opens that copy; a commercial identifier with multiple results presents an explicit chooser.
- [x] The resolver routes to the existing Book Details / check-in flows, preserving existing checkout eligibility, override, and disabled-loans rules.
- [x] `404` unknown/other-tenant and `422` malformed/unsupported values receive distinct safe recovery copy.
- [ ] Review a physical QR scan, hardware-scanner scan, and camera scan for focus preservation, cancellation, rapid-scan safety, and accessible announcements.
- [ ] Verify a real available, active-loan, Reserved, Reading, Missing, and Display Only copy after resolution; confirm the resulting Book Details action is correct.
- [ ] Verify resolution remains available when loans are disabled, while new checkout is unavailable.

## Out of scope

Unauthenticated scanning, album scanning, and QR generation.

## Open questions

1. Which page owns the primary circulation scanner entry point: Reading Loans, Manage Collection, or both?
- We have a feature that allows for a scanned isbn to take you, either to that book in the catalog, or to add it if it doesn't exist. I would like to maintain that. Loans are initiated from the book details page. 

2. After successful checkout/check-in, should scanning immediately re-arm or wait for explicit confirmation?
- immediately rearm 
