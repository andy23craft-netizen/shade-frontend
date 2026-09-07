# FEAT-54 -- New Releases and Current Reading on Home

**Status:** Partially ready; Current Reading is shipped, while correctly ordered New Releases depends on `BACKEND-HANDOFF-PLAN-03`.

**Depends on:** Book list `status`, an authoritative New Releases query/order, authenticated covers, and `FEAT-52` heading composition.

## Objective

Add owned-book New Releases and Current Reading modules using existing catalog data.

## Acceptance criteria

- [ ] New Releases uses owned, shelved books ordered by stored publication date descending; null/unparseable dates do not masquerade as recent.
- [ ] Current Reading uses `status=reading` and links each physical copy to Book Details.
- [ ] Both modules reuse authenticated covers, author formatting, stable keys, cancellation, and bounded queries.
- [ ] Empty/error states are independent and do not blank existing Home discovery.
- [ ] Home composition remains deliberate at 320px and 200% zoom with keyboard-accessible carousels/lists and no marquee or per-title font scaling.
- [ ] Quote headings integrate only through `FEAT-52`; functional labels remain stable.

## Stretch

Surprise Me may choose an owned book from existing filtered/list data only after core acceptance.

## Out of scope

External release feeds, recommendation engines, mixed-media Recent Additions, and weather.

## Open questions

1. What publication window and maximum card count define “New Releases”?
2. Should Current Reading order by last update, title, or an explicitly added reading-start signal?
3. Is Surprise Me promoted into this ticket or kept deferred?
