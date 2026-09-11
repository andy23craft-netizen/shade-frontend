# Library identity audit

Baseline: 2026-09-07.

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

## Dalmo package

Implementation brief recorded September 7, 2026:

- **Name and tagline:** "Dalmo's Library" with no tagline. The spelling follows the supplied
  logo and the existing production identity rather than the questionnaire's apparent
  "Libary" typo.
- **Palette:** deep teal page and control colors with magenta borders and accents, held against
  the shared warm paper surfaces. Bright pink is reserved for the focus indicator and light
  decorative accent so interaction state remains conspicuous.
- **Typography:** clean system sans-serif stacks for both body and heading roles. No downloaded
  or decorative typeface is required; the lettering inside the supplied artwork remains
  artwork-only.
- **Assets:** `Dalmo_header.webp` and `Dalmo_hero.webp`, derived from the owner's existing logo
  and supplied in the repository for this package. Both are transparent WebP assets; the Home
  image is the canonical full-width mark and the header uses its compact crop. The linked
  images are decorative (`alt=""`); the surrounding links carry the functional accessible
  names "About Dalmo's Library" and "Dalmo's Library".
- **Motifs and copy:** paper texture, sacred geometry, and multilingual script are the bounded
  motif vocabulary. No owner-specific interface phrase was approved, so shared neutral copy
  is retained and the optional Home quote treatment is absent.
- **Accessibility and motion:** shared focus order, semantics, responsive image sizing,
  forced-colors behavior, and reduced-motion rules remain unchanged. Identity imagery may
  disappear in forced-colors contexts without removing its link's accessible name.
- **Seasonal choices:** none.
- **Avoid list:** no unapproved religious or metatheory symbols, no invented foreign-language
  text, no owner-authored CSS, and no alternate layout, workflow, or navigation. Jamie and
  Andy assets, copy, and palette values are not fallbacks for Dalmo.

The repository records these checked-in logo derivatives as owner-supplied assets authorized
for this library deployment. Original-source provenance or broader reuse rights are not
asserted by the frontend package.

## Jamie package

Implementation brief recorded September 7, 2026:

- **Name and tagline:** "Jamie's Library" with "What's the vibe?" The tagline is already part
  of the canonical Home artwork and remains visible on the neutral About surface; it is not
  repeated next to the hero.
- **Palette:** saturated orange is the primary page color and retains the shared warm drawer
  hardware. Forest green is reserved for links, decorative glints, and Jamie's album/listening
  headers in place of the shared indigo. Warm paper cards are retained for legible content;
  pale cream provides a conspicuous focus color against orange.
- **Typography:** a friendly handwritten system-font stack is limited to expressive headings
  and library wordmark accents. Body copy, forms, navigation, small labels, and status text keep
  the shared legible faces. No font download or third-party request is introduced.
- **Assets:** existing `Jamies_header.webp` and `Jamies_hero.webp` logo derivatives are the
  approved package assets. The full-width Home image and compact header crop are decorative
  (`alt=""`); their surrounding links retain the functional accessible names "About Jamie's
  Library" and "Jamie's Library". The frontend repository records them as owner-supplied and
  approved for this library deployment, without asserting broader reuse rights.
- **Motifs and copy:** monstera, parrots, and disco balls are the bounded motif vocabulary.
  Existing logo disco balls and lightweight CSS disco glints carry the early-2000s skating-rink
  mood. No parrot or monstera artwork is invented without an approved source asset. Shared warm,
  neutral interface copy remains in place; the Home quote treatment is absent.
- **Accessibility and motion:** the shared hierarchy, focus order, controls, responsive image
  sizing, and reduced-motion rules remain unchanged. Decorative glints contain no motion and
  disappear in forced-colors mode. The palette retains high-contrast text and focus pairs.
- **Seasonal choices:** none.
- **Avoid list:** no cultural, religious, family, or seasonal symbols were requested; do not add
  unapproved symbols, owner-authored CSS, alternate layouts, workflows, or navigation. Andy and
  Dalmo assets, copy, and palette values are not fallbacks for Jamie.
