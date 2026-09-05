# FEAT-38 -- Remaining frontend V2 experience

**Status:** Ready in slices as backend contracts stabilize

**Move target:** Split/copy the applicable slices into `shade-frontend/docs/` when frontend implementation starts.

## Objective

Deliver the remaining frontend-owned PLAN-03 behavior without adding backend preference or draft-session models.

## Slices and dependencies

1. Guided setup wizard using FEAT-25, canonical shelves, book Build Mode, and FEAT-28 album Bulk Add.
2. Local deterministic QR generation, batch printing, phone scanning, and circulation selection using FEAT-29.
3. Accessible cursive-style borrower-name presentation on loan cards from FEAT-30; no signature capture or backend
   contract change.
4. Required rating, optional review, summaries, and work correction UI after FEAT-32/33.
5. Mixed Home recent additions: first complete FEAT-34's entry decision, using its endpoint only if shipped APIs are
   insufficient; dynamic checked-in quotes/headings require no backend API.
6. One accessible visual identity per shipped media area.
7. Persistent route-changing media switch preserving each area's URL/history context.
8. Wide persistent catalog controls, equivalent narrow modal controls, and shared accessible Back to Top behavior.

## Acceptance criteria

- [ ] URL state, focus restoration, reduced motion, keyboard use, and responsive layouts have automated coverage.
- [ ] Conventional QR labels pass automated decoding and supported-phone print tests; decorative variants cannot replace
      the conventional template and ship only after the same tests.
- [ ] Setup never interprets API/bootstrap failure as a new empty library and does not lose local Build drafts.
- [ ] Quote text is checked-in inert content with stable functional-heading fallback.
- [ ] No selectable theme model, global mixed-media search, or album collection UI is introduced.
