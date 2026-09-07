# FEAT-30 -- Borrower name presentation

**Status:** Ready

**Move target:** Copy this ticket into `shade-frontend/docs/` when implementation starts. No backend change is needed.

## Objective

Render the existing typed borrower name attractively on loan cards with a cursive-style font while preserving
legibility and accessibility.

## Acceptance criteria

- [ ] Book and album loan cards use the same approved borrower-name treatment.
- [ ] The borrower name remains selectable semantic text and has one accessible reading, without decorative
      duplication for assistive technology.
- [ ] A legible fallback font is used when the preferred font is unavailable or unsuitable.
- [ ] The presentation remains readable at supported viewport sizes, zoom levels, contrast modes, and text settings.
- [ ] Long names wrap or truncate according to the loan-card layout without obscuring other loan information.
- [ ] Frontend visual, responsive, and accessibility tests cover the treatment.

## Out of scope

Handwritten signature capture, canvas input, image generation, uploads, staging tokens, signature storage/retrieval,
acknowledgement or identity-proof claims, and backend contract changes.

