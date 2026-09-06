# FEAT-11 -- Per-Library Identity Packages

**Status:** Ready one library at a time after owner input.

**Dependency group:** C -- tenant presentation.

**Depends on:** `FEAT-10`. Each package independently depends on an approved owner brief and
licensed/approved assets.

## Objective

Interview each additional library owner, record a bounded identity brief, and implement one
accessible personality package without changing the shared application structure.

## Owner brief

Ask and resolve the PLAN-02 identity questions: library name/tagline; three to five personality
words; preferred and avoided colors; palette temperature/intensity; representative setting;
motifs and objects; hero/header intent and approved source assets; typography mood; voice with
liked/disliked example phrases; symbols or themes to include/avoid; seasonal preferences; and
useful or unsuitable Andy/Jamie references.

Record only the resulting name/tagline, palette tokens, contrast pairs, typography accents,
approved assets and usage rights, bounded motifs/copy, accessibility notes, seasonal choices,
and explicit avoid list. Owner ideas that imply routes, permissions, workflows, layouts, or
data-model changes return to product planning rather than entering the identity package.

## Acceptance criteria for each library

- [ ] The owner brief is approved before final visual sign-off and identifies all asset sources
      and permissions.
- [ ] Header/Home art, palette, typography accents, motifs, and personality copy are implemented
      through `FEAT-10`'s typed package and neutral fallbacks.
- [ ] The identity uses the same components, hierarchy, navigation, breakpoints, controls,
      focus order, and semantic labels as every other tenant.
- [ ] Text/background and non-text contrast, forced colors, reduced motion, 200% text zoom,
      keyboard behavior, and supported mobile widths pass.
- [ ] Decorative raster budgets follow project performance guidance; noncritical imagery is
      lazy-loaded and failure leaves a coherent page.
- [ ] Automated snapshots/assertions prove that the package appears only on its approved hosts
      and cannot leak into another or unknown host.
- [ ] The owner reviews representative desktop/mobile Home, header, room entrances, an empty
      state, and an error/loading state before acceptance.

## UI questions requiring a product decision per owner

1. Which supplied or newly commissioned image is the canonical Home hero, and what crop/focal
   point works at desktop and mobile sizes?
2. What concise alt text communicates the hero's purpose without narrating decoration?
3. Which typography role may use the accent face—library name, expressive headings, or small
   labels—and where must the shared legible face remain?
4. Which one or two personality phrases are approved, and what neutral fallback replaces each?
5. Which seasonal treatments are approved, on what dates or deployment choice do they activate,
   and which symbols are prohibited?
6. Does the owner approve the package in forced-colors/reduced-motion modes where some
   decorative identity is intentionally absent?

## Delivery note

Use a separate implementation PR or clearly separable commit for each owner so approval,
assets, rollback, and deployment can proceed independently.

## Out of scope

Selectable skins, owner-authored CSS, arbitrary uploads, page redesigns, new features, ambient
audio, spatial rooms, weather reactions, and deep time-of-day simulation.
