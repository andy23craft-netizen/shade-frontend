# FEAT-54 -- New Releases and Current Reading on Home

**Status:** Partially implemented. 

**Depends on:** Book list `status`, an authoritative New Releases query/order, authenticated covers, and leads into `FEAT-55` heading composition.

## Objective

Add owned-book New Releases and Current Reading modules using existing catalog data.

## Acceptance criteria

- [x] New Releases uses owned, shelved books ordered by stored publication date descending; null/unparseable dates do not masquerade as recent.
- [x] Current Reading uses `status=reading` and links each physical copy to Book Details.
- [ ] Both modules reuse authenticated covers, author formatting, stable keys, cancellation, and bounded queries.
- [ ] Empty/error states are independent and do not blank existing Home discovery. 
- [ ] Home composition remains deliberate at 320px and 200% zoom with keyboard-accessible carousels/lists and no marquee or per-title font scaling.
- [ ] Quote headings integrate only through `FEAT-55`; functional labels remain stable.

## Stretch

Surprise Me may choose an owned book from existing filtered/list data only after core acceptance.

## Out of scope

External release feeds, recommendation engines, mixed-media Recent Additions, and weather.

## Open questions

1. What publication window and maximum card count define “New Releases”?
- `in the current calendar year`, and I'd say... the five most recent. I don't have ton right now, but maybe eventually.

2. Should Current Reading order by last update, title, or an explicitly added reading-start signal?
- there should only be two books marked "reading" at any one time, one for me and one for my wife. I want to just display those two (or one, or none -- there should be an explicit empty state for this module. something like -- nothing worse than not having a book to read...)

3. Is Surprise Me promoted into this ticket or kept deferred?
- deferred for now. that feels firmly v3
