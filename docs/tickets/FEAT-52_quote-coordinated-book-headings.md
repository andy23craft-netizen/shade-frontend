# FEAT-52 -- Quote-Coordinated Book Home Headings

**Status:** Ready for checked-in quotes; tenant-authored quote integration follows `FEAT-12`.

**Depends on:** Existing `homeQuotes`, Home discovery sections, and `FEAT-54` for Current Reading/New Releases.

## Objective

Give each checked-in Home quote one curated, inert set of expressive book-section headings while keeping stable functional labels visible.

## Acceptance criteria

- [ ] Every production quote either supplies one complete typed mapping or falls back to the complete ordinary heading set.
- [ ] New Additions, Browse/categories, Staff Picks, Current Reading, and—if approved—New Releases use a consistent two-level treatment.
- [ ] The selected quote and heading set remain stable for the Home mount and do not reshuffle on query renders.
- [ ] Stable functional headings remain visible text; expressive text affects headers only and is never interpreted as markup, CSS, code, URL, or asset path.
- [ ] Missing/partial mappings, long text, 320px, 200% zoom, loading/error sections, and screen-reader heading structure are tested.

## Out of scope

Weather selection, remote content, layout changes, and tenant quote CRUD.

## Open questions

1. Should New Releases participate at launch, making five mapped headings per quote?
- Yes. 
2. Who approves the final phrase set for every checked-in quote?
- I will give you the definitive list. 
