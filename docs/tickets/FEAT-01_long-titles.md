# Evaluate Long Unbroken Titles in the New Additions Carousel

## Repository

Frontend

## Observed behavior

In the `New Additions` carousel, a single eleven-letter title wraps onto a second line to preserve the existing font size and card dimensions. The result looks visually awkward.

This is an edge case and may not justify a significant redesign. There is no predetermined solution.

## Design considerations

Review the existing carousel and card constraints and evaluate whether the best behavior is to:

- preserve the current wrapping;
- scale typography within defined limits;
- truncate or otherwise constrain the title;
- adjust the card layout;
- add scrolling behavior so the title becomes more visible over time; or
- intentionally make no change because the edge case does not justify additional complexity.

These are considerations, not prescribed solutions. Recommend whether any change belongs in the current patch scope or V2 based on complexity and architectural impact. If deferral is recommended, reflect the issue in the appropriate V2 documentation rather than silently dropping it.

## Planning request

Inspect the current frontend implementation, explain the technical/design recommendation, and produce an implementation plan for review if a change is recommended. Include relevant usability, accessibility, responsive-layout, and validation considerations. Do not modify application source code, tests, configuration, or other implementation files until the plan has been reviewed and explicitly approved.

Before producing your implementation plan, review the current V2 documentation in your repository. Treat the current documents as authoritative over older assumptions or previous versions. Consider whether this ticket changes, resolves, clarifies, or adds anything to those documents. Include any required V2 documentation updates in your proposed plan.

Planning/design/requirements documentation updates are part of this planning phase and should be completed before review. Report any concerns, dependencies, conflicts, or recommended scope changes, then stop and wait for approval.

## Acceptance criteria for the planning phase

- The recommendation is grounded in the existing carousel/card constraints.
- The tradeoffs of the recommended behavior, including intentional no-change, are explained.
- Current-patch versus V2 scope is explicitly recommended.
- Required V2 documentation updates are completed and reported.
- Any proposed plan covers representative long unbroken titles and relevant responsive and accessibility behavior.

## Planning outcome

### Recommendation and scope

Make no isolated current patch. The New Additions card is deliberately fixed at 17rem, with an 8rem cover column on
wide layouts and a smaller cover column below 36rem. Its title remains ordinary link text and is allowed to wrap. An
eleven-letter word wrapping in the narrow desktop text column is visually imperfect but remains complete, readable,
zoomable, keyboard accessible, and understandable to assistive technology.

The alternatives are worse at this scale: truncation hides identifying text; horizontal or marquee-style title motion
creates reading and reduced-motion problems; per-string font scaling produces inconsistent hierarchy and is brittle
under zoom/localization; and widening or restructuring every card for one edge case affects carousel density. Preserve
the current behavior until V2 performs its already-required responsive density composition of New Additions, Current
Reading, New Releases, Staff Picks, and category discovery.

### V2 follow-up plan

1. During the V2 Home responsive-density design, prototype New Additions cards with representative short titles,
   multi-word titles, 11--20-character unbroken words, and very long titles at 320px, intermediate mobile/tablet, and
   desktop widths, plus 200% text zoom.
2. Prefer a card geometry/content-allocation solution that permits natural wrapping. Do not use automatic/marquee
   scrolling or hide the full accessible name. If visible truncation is ultimately approved, keep the full title in
   the link's accessible name and provide an equally available non-hover path to the complete title.
3. Preserve minimum control targets, visible focus, carousel pause-on-focus/hover behavior, reduced-motion behavior,
   and horizontal containment. Validate with browser visual tests and accessibility checks before locking the V2 card
   layout.

### Concerns and dependencies

No backend dependency exists. This decision should be reconsidered only as part of the V2 Home composition, not as a
standalone animated-title feature. The definitive V2 requirements now record the long-title constraint so the issue is
not silently dropped.
