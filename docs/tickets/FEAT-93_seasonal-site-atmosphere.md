# FEAT-93 -- Seasonal Site Atmosphere

**Status:** Ready for implementation.

**Leads into:** FEAT-96 visual-identity approval, the existing Home, Reading Room, Listening Room, and dashboard surfaces, and shared motion/accessibility tokens.

## Objective

Add a restrained, four-season decorative atmosphere to the Home page and the Reading and Listening Room experiences, including each room's dashboard. The treatment should make each area feel thematically coherent without changing navigation, content priority, tenant identity, or product behavior.

## Product decisions

- Seasons change at the actual Northern Hemisphere astronomical equinoxes and solstices, not on month boundaries.
- The active season is determined from the instant of the event. The implementation must use checked-in event timestamps or a deterministic equivalent; it must not rely on a manually changed date range or an external runtime API.
- Scope is Home, Reading Room, Listening Room, and the dashboards for both rooms. Reading and Listening treatments may be distinct, but must remain within one shared seasonal system.
- The first release has only these neutral motifs:
  - Spring: plants, greenery, and rain clouds.
  - Summer: sunshine and related light-weather motifs.
  - Autumn: leaves, pumpkins, and pinecones.
  - Winter: snowflakes, snow mounds, and icicles.
- There is no seasonal-theme picker or user-facing disable switch. System `prefers-reduced-motion`, forced-colors, contrast, and constrained-network behavior still take precedence.
- Do not add holiday, religious, cultural, family-specific, or tenant-customized imagery.

## Acceptance criteria

- [ ] A single deterministic season resolver switches at each year's astronomical event timestamp and has unit coverage at either side of every boundary.
- [ ] Home, Reading Room, and Listening Room receive scoped decorative treatments; both dashboards receive their room-appropriate seasonal treatment.
- [ ] Treatments are visually subordinate: they cannot obscure controls, alter functional labels, displace content, change routes, or communicate state that is needed to use the application.
- [ ] Reading and Listening variants feel thematically related to their room while preserving shared tokens and a consistent interaction model.
- [ ] Decorative assets are ignored by assistive technology, preserve text/control contrast, and are omitted or safely simplified in forced-colors mode.
- [ ] Any animation is subtle, bounded, and disabled under `prefers-reduced-motion`; the seasonal state itself remains understandable with no animation.
- [ ] Asset loading is lazy and budgeted. Slow or unavailable decorative assets never block content, navigation, camera controls, or primary API queries.
- [ ] Responsive and accessibility coverage includes 320px, 200% zoom, keyboard navigation, reduced motion, forced colors, and seasonal-boundary tests.

## Out of scope

- A theme/settings model, per-tenant or per-owner skins, holiday calendars, geolocation-based hemisphere switching, weather integration, and server-backed season configuration.
- Navigation redesign, changes to camera-scanning behavior, changes to dashboard data, or changes to library setup.
- Decorative seasonal QR labels or printer/label-stock changes.

## Implementation notes

- Keep season metadata and event timestamps checked into the frontend so behavior is reproducible in tests and works offline. Refresh the future timestamp table as part of normal release maintenance before its final covered year.
- Use existing identity and motion primitives where possible. Treat imagery as a progressive enhancement, not a component dependency.
- Preserve the tenant-neutral constraints recorded in `docs/technical-reference/library-identity-audit.md`.


## User notes

- In Autumn, falling leaves in the margins, and snow in the winter are the maximum amount of motion i would want, and only on the home page. 