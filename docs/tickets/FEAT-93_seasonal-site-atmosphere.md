# FEAT-93 -- Seasonal Site Atmosphere

**Status:** Ready for implementation.

**Leads into:** FEAT-96 visual-identity approval, the existing Home hero, and shared accessibility tokens.

## Objective

Add a restrained, four-season vine overlay around the main Home hero. The treatment should frame the existing hero art without changing navigation, content priority, tenant identity, or product behavior.

## Product decisions

- Seasons change at the actual Northern Hemisphere astronomical equinoxes and solstices, not on month boundaries.
- The active season is determined from the instant of the event. The implementation must use checked-in event timestamps or a deterministic equivalent; it must not rely on a manually changed date range or an external runtime API.
- Scope is the main Home hero only. Reading Room, Listening Room, and both dashboards are out of scope.
- The first release uses four transparent seasonal vine-frame assets, with one selected at each astronomical boundary.
- Vines express the season through foliage and understated botanical details. They do not use holiday, religious, cultural, or tenant-specific imagery.
- There is no seasonal-theme picker or user-facing disable switch. System `prefers-reduced-motion`, forced-colors, contrast, and constrained-network behavior still take precedence.
- Do not add holiday, religious, cultural, family-specific, or tenant-customized imagery.

## Acceptance criteria

- [ ] A single deterministic season resolver switches at each year's astronomical event timestamp and has unit coverage at either side of every boundary.
- [x] The Home hero receives exactly one seasonal vine-frame asset at a time; no other route receives seasonal decoration.
- [ ] The overlay frames the hero without obscuring its link, altering functional labels, displacing content, changing routes, or communicating necessary state.
- [ ] Decorative assets are ignored by assistive technology, preserve text/control contrast, and are omitted or safely simplified in forced-colors mode.
- [x] The vine overlay is entirely static; no seasonal motion is shipped.
- [ ] Slow or unavailable vine assets never block Home content or navigation.
- [ ] Responsive and accessibility coverage includes 320px, 200% zoom, keyboard navigation, forced colors, and seasonal-boundary tests.

## Out of scope

- A theme/settings model, per-tenant or per-owner skins, holiday calendars, geolocation-based hemisphere switching, weather integration, and server-backed season configuration.
- Navigation redesign, changes to camera-scanning behavior, dashboard decoration/data, or changes to library setup.
- Decorative seasonal QR labels or printer/label-stock changes.

## Implementation notes

- Keep season metadata and event timestamps checked into the frontend so behavior is reproducible in tests and works offline. Refresh the future timestamp table as part of normal release maintenance before its final covered year.
- Use existing identity and motion primitives where possible. Treat imagery as a progressive enhancement, not a component dependency.
- Preserve the tenant-neutral constraints recorded in `docs/technical-reference/library-identity-audit.md`.


## User notes

- Superseded: the seasonal treatment is static vines around the Home hero only; no motion ships.
