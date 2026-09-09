# FEAT-97 -- Per-Library Identity Packages Review

**Status:** Review ticket. Dalmo and Jamie packages are implemented; pending owner visual review and
final sign-off.

**Dependency group:** C -- tenant presentation.

**Depends on:** `FEAT-10` (shipped). Implementation briefs and asset-rights records live in
[`library-identity-audit.md`](../technical-reference/library-identity-audit.md). Canonical
packages are `src/config/libraryIdentity.ts` (Andy, Dalmo, Jamie) with host-scoped branding
via `libraryContext` / `libraryBranding` and palette tokens under `data-library`.

## Remaining work

Owner visual review for each additional library (Dalmo, Jamie) before acceptance. No further
code delivery is required unless review requests a bounded package change within FEAT-10
rules.

## Acceptance criteria (remaining)

- [ ] Each owner confirms the brief and asset sources/permissions before final visual
      sign-off.
- [ ] Each owner reviews representative desktop and mobile Home, header, room entrances, an
      empty state, and an error/loading state.
- [ ] Each owner approves forced-colors and reduced-motion presentation where decorative
      identity is intentionally absent.

## Already delivered (do not re-implement)

- Owner briefs recorded; packages use the shared layout, navigation, controls, focus order,
  and semantic labels.
- Header/Home art, palette, typography accents, motifs, and bounded copy ship through the
  typed identity package with asset-free neutral fallbacks for unknown hosts.
- Automated assertions cover approved-host artwork and prevent cross-host / unknown-host
  leakage (`libraryIdentity` / `libraryBranding` tests).
- Seasonal variants remain typed but empty and inactive.

## Out of scope

Selectable skins, owner-authored CSS, arbitrary uploads, page redesigns, new features, ambient
audio, spatial rooms, weather reactions, and deep time-of-day simulation.
