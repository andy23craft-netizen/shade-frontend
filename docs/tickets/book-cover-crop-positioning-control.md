# Evaluate User Control for Book Cover Cropping and Positioning

## Repository

Frontend, with a potential backend dependency to be identified during planning

## User need

Uploaded book-cover images do not always fit the current display area well. Unusual cover or source-image proportions can cause meaningful content, including parts of a title, to be cropped. A user should be able to prevent important portions of an uploaded cover image from being unintentionally cropped by the book-cover display.

## Product considerations

Possible behaviors include cropping during or after upload, repositioning the image within the existing display frame, or another lightweight control over which portion remains visible. These are considerations, not prescribed solutions.

This may belong in V2 depending on complexity, architectural impact, and data-model implications. Recommend whether it belongs in the current patch scope or V2. If the recommended approach requires persistence, API, or backend data changes, identify that dependency clearly so a separate backend ticket can be created. Do not silently drop the issue if deferral is recommended.

## Planning request

Inspect the current frontend implementation, evaluate suitable UX and technical approaches, recommend a scope, and produce an implementation plan for review. Explain the tradeoffs behind the recommendation and identify any backend dependency. Do not modify application source code, tests, configuration, or other implementation files until the plan has been reviewed and explicitly approved.

Before producing your implementation plan, review the current V2 documentation in your repository. Treat the current documents as authoritative over older assumptions or previous versions. Consider whether this ticket changes, resolves, clarifies, or adds anything to those documents. Include any required V2 documentation updates in your proposed plan.

Planning/design/requirements documentation updates are part of this planning phase and should be completed before review. Report any concerns, dependencies, conflicts, or recommended scope changes, then stop and wait for approval.

## Acceptance criteria for the planning phase

- The recommendation addresses the underlying user need without assuming a predetermined UI.
- Current-patch versus V2 scope is explicitly recommended and justified.
- Required V2 documentation updates are completed and reported.
- Any persistence, API, data-model, or other backend dependency is identified clearly.
- The plan includes validation for representative cover proportions and preservation of meaningful image content.

## Planning outcome

### Recommendation and scope

Use a non-cropping display policy as the current-patch solution rather than adding a crop editor or persisted focal
point. Every cover is rendered by the shared `BookCover` component inside a fixed 2:3 frame, and its image currently
uses `object-fit: cover`; that rule necessarily discards edges for sources whose proportions differ from the frame.
Changing the shared image to `object-fit: contain` preserves the complete source image in Book Details, Books, Home,
and Collections while retaining the stable frame dimensions. The existing muted frame background provides acceptable
letterboxing for unusual proportions.

This directly addresses the underlying need with low interaction and architectural cost. A crop editor would require
preview controls, touch/pointer/keyboard interaction, image processing decisions, and either a destructively generated
replacement file or persisted focal-point/crop metadata. Those costs are not justified while full-image display solves
the reported problem. The simple fit-policy patch is V1 polish and need not become a V2 feature.

### Implementation plan

1. Change the shared `.book-cover__image` fit policy from cropping to containment. Keep the 2:3 frame, lazy authenticated
   blob loading, status stamp, placeholder, alt-text behavior, and upload/remove flow unchanged.
2. Add a focused `BookCover` test or style-level assertion for the non-cropping class contract, and preserve existing
   load, error, cancellation, decorative-image, and status tests.
3. Add representative visual fixtures for a conventional portrait cover, a very tall/narrow image, a square image,
   and a landscape image. Verify the full image boundary and meaningful edge content remain visible in detail, compact
   carousel/card, and narrow mobile contexts.
4. Check contrast/readability of the letterbox background and ensure the overlaid status stamp remains legible without
   obscuring more content than it does today. Run focused tests, visual/browser checks, and `make check`.

### Alternative intentionally rejected

Do not add a per-book Fit/Crop toggle, drag-to-position control, or client-only preference in this patch. A client-only
choice would vary by browser and fail to represent the owner's intended cover to other viewers. Destructive client-side
cropping would discard source pixels and complicate replacement/recovery.

### Dependencies and future escalation

The recommended patch has no backend dependency. If user testing later establishes a real need for owner-authored
cropping, create coordinated backend and frontend tickets. The backend would need book-scoped presentation metadata
(at minimum focal-point coordinates or crop rectangle plus an explicit fit mode), validation/default semantics, and a
cover read/update contract; the frontend would then need an accessible preview/editor and consistent rendering across
all `BookCover` consumers. That optional capability is not added to V2 requirements by this ticket.
