# FEAT-10 -- Library Identity Cleanup and Centralization

**Status:** Ready.

**Dependency group:** B -- shared identity foundation (may run in parallel with `FEAT-09`).

**Depends on:** Shipped hostname branding entry points.

**Unblocks:** `FEAT-11` and identity sign-off for `FEAT-08`.

## Objective

Remove accidental Andy-, Jamie-, or Shade-library-specific presentation from shared UI and
centralize the bounded values that are intentionally allowed to vary by hosted library.

## Scope

- Audit visible strings, accessible names, document metadata, alt text, empty states, quote
  content, CSS tokens, fonts, hero/header assets, test fixtures, diagnostics labels, and
  fallbacks for owner-specific assumptions.
- Distinguish **Shade the application** from a configured library name; keep shared product
  naming only where intentional.
- Define a typed, exhaustive library identity package for short name, tagline, bounded copy,
  palette/contrast pairs, typography accents, approved hero/header art, motifs, seasonal
  variants, and explicit fallbacks.
- Keep layout, routes, navigation, semantic labels, focus order, feature eligibility, and
  administrative concepts shared.
- Unknown hosts must use a neutral deliberate identity rather than any known owner's package.

## Acceptance criteria

- [ ] The audit records every retained owner-specific reference and why it is intentional.
- [ ] Shared components consume typed identity values rather than hostname conditionals or
      scattered literal strings.
- [ ] Missing optional assets/copy fall back to neutral shared presentation without borrowing
      another tenant's identity.
- [ ] Identity values cannot inject markup, CSS, executable content, or arbitrary asset paths.
- [ ] At least Andy, Jamie, and unknown-host tests cover visible copy, accessible names,
      metadata, palette selection, hero/header assets, and fallbacks.
- [ ] Contrast, forced colors, reduced motion, 200% zoom, font failure, and responsive
      behavior remain valid with the longest supported name/tagline.
- [ ] Identity packaging adds no alternate layout, tenant switcher, or selectable skin model.

## UI questions requiring a product decision

1. In which surfaces does “Shade” name the product and remain fixed, versus where should the
   hosted library name replace it?
2. What maximum display lengths should library name, tagline, and bounded personality phrases
   support before wrapping?
3. Should the browser title format be `<Library> — Shade`, `Shade — <Library>`, or library
   name alone?
4. Which empty states may use personality copy, and which operational/error messages must stay
   strictly neutral?
5. Should seasonal variants follow a fixed calendar, a deploy-time choice, or remain checked-in
   but inactive until separately approved?

## Out of scope

Creating a new owner's art package, free-form theme editing, alternate IA, per-tenant feature
forks, and weather/time-reactive presentation.
