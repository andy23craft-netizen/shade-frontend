# Library identity audit

Baseline: FEAT-10, 2026-09-07.

Hosted-library presentation is defined in `src/config/libraryIdentity.ts`. Packages contain
only typed, code-owned text, enum-like palette and typography keys, imported build assets,
and bounded motif flags. They cannot supply markup, CSS declarations, executable content,
or arbitrary runtime asset paths. Unknown hosts use the asset-free neutral package.

## Product decisions

- **Shade** remains the fixed application and API name in startup, runtime configuration,
  diagnostics, connection errors, private-media explanations, and the browser-title suffix.
- Hosted-library names appear in the Home accessible heading, hero/about accessible name,
  header link, room/dashboard/circulation wordmarks, metadata, and About heading.
- Browser titles use `<Page> — <Library> — Shade`. Names and taglines are tested against
  presentation bounds of 40 and 80 characters respectively and wrap in the shared layout.
- Operational, validation, error, loading, and empty-state messages remain neutral. The Home
  quote is the only currently enabled personality-copy surface.
- Seasonal variants are typed but empty and inactive until separately approved; they do not
  activate from the calendar, weather, or client state.

## Retained owner-specific references

- `libraryIdentity.ts` contains approved Andy, Dalmo, and Jamie names, taglines, palette keys,
  motifs, quote visibility, and statically imported header/hero assets. This is the canonical
  allowlist and the intended location for those references.
- `AboutPage.tsx` retains Andy's origin story and Charles Leewright dedication only when the
  active identity is Andy. Other identities receive neutral shared About copy. The personal
  story is intentional content, not shared product language.
- Asset filenames retain owner names because they are checked-in approved artifacts selected
  only by the canonical identity package.
- Host resolution and tests retain tenant IDs/names because they verify routing and isolation.
  Fixtures may name identities but must not make one tenant the fallback for another.
- CSS retains palette selectors keyed by the finite identity palette. Layout, breakpoints,
  semantic labels, focus order, and feature eligibility remain shared.

All other occurrences of “Shade” in application code refer to the fixed product/API rather
than a hosted library. No tenant switcher, selectable skin, alternate route, or feature fork
is introduced by identity selection.
