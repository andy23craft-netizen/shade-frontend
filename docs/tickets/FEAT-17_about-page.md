# FEAT-17 -- About page as homepage

## Objective

Add an About page that explains what Shade Library is, why it exists, and how to use the library management UI.
Make that page the application homepage (`/`). Relocate the existing FEAT-11 dashboard so metrics remain reachable
without remaining the landing route.

## Dependencies

FEAT-01 (shell, navigation, route metadata), FEAT-11 (dashboard), and CHORE-01 (shelves catalog at `/shelves`) are
complete. This ticket does not depend on FEAT-12 through FEAT-16. Do not pull operational hardening, journey
automation, CI packaging, Podman, or release artifact work into FEAT-17.

## Contract references

No new backend endpoints. About content is static frontend copy. Do not call `GET /dashboard` (or any other API)
from the About page. Dashboard continues to use `useDashboard` / `dashboardApi.get` only on its relocated route.

## Current baseline

Already shipped and should be reused (not rebuilt):

- `/` is `AboutPage` (`src/features/about/routes/AboutPage.tsx`) via `routeMetadata.about` (`path: '/'`, title and
  heading `Shade Library`). The page covers the library story, a Charles Leewright dedication, and lending policy.
- `CatalogGuide` (`src/features/about/components/CatalogGuide.tsx`) is the accessible card-catalog How to Use dialog,
  with keyboard focus management and in-app links to `/books`, `/books/new`, `/checkout`, `/checkin`, `/loans`,
  `/shelves`, `/dashboard`, `/admin/deleted`, and `/admin/backup`.
- `/dashboard` is `DashboardPage` via `routeMetadata.dashboard.path`. FEAT-11 behavior is unchanged (`useDashboard` /
  `GET /dashboard` only on this route; Refresh, offline/stale, inconsistency warning, `QueryErrorState`).
- Primary navigation exposes About (`/` with `end`) and Dashboard (`/dashboard` with `end`) alongside Books, Add Book,
  Check Out, Check In, Loans, Shelves, and admin links. The brand `NavLink` still goes to `/`.
- `NotFoundPage` and `RootErrorBoundary` recover with "Return home" to `/` (not "the dashboard").
- Colocated coverage: `AboutPage.test.tsx`, `CatalogGuide.test.tsx`. `AppShell.test.tsx` and
  `RootErrorBoundary.test.tsx` match the new home/nav copy. `DashboardPage.test.tsx` mounts the page directly (not at
  `/`). `App.test.tsx` does not assert the home-route title.
- Catalog-guide styles live in `src/styles/components.css`. About does not call the API.
- `docs/AGENTS.md` records About at `/` and Dashboard at `/dashboard`. `docs/ToDo.md` marks this ticket complete.

## Remaining scope (file-level plan)

### Tests still assuming `/` is the dashboard

| File | Change |
| ---- | ------ |
| `e2e/dashboard.smoke.spec.ts` | All three cases still `page.goto('/')` and expect heading/title `Dashboard`. Retarget to `/dashboard`. Keep the null-average fixture, all-zero fixture, and axe serious/critical gate. Do not point this spec at About. |

### Documentation still describing `/` as the dashboard

| File | Change |
| ---- | ------ |
| `docs/product-docs/PLAN.md` | Section 6 still lists `/` as dashboard. Note that `/` is the About landing page and `/dashboard` hosts read-only metrics. |
| `docs/full-project-context.md` | Still describes FEAT-17 as future work and `/` as `DashboardPage`. Align homepage / `/dashboard` notes with the shipped routes. |

### Explicit non-goals for remaining work

- Do not change `dashboardApi`, `useDashboard`, query keys, or dashboard invalidation.
- Do not rebuild `AboutPage` / `CatalogGuide`, or move the dashboard again.
- Do not add runtime CMS, markdown loaders, or i18n frameworks.
- Do not implement the atmospheric landing-room art from UI design notes (full-bleed library photo, dust motes,
  weather window, time-of-day lighting, seasonal skins).
- Do not invent backend About content or version negotiation beyond the existing footer release identifier.

## Acceptance criteria

- `e2e/dashboard.smoke.spec.ts` loads Dashboard at `/dashboard` (heading, title, fixtures, axe). Visiting `/` is About,
  not Dashboard.
- `docs/product-docs/PLAN.md` and `docs/full-project-context.md` reflect About at `/` and Dashboard at `/dashboard`.
- `make check` passes.

## Plan coverage

Homepage / operator onboarding surface; complements Workstream 10 (dashboard) by relocating metrics off `/` while
preserving FEAT-11 behavior. Product UI for that move is shipped; remaining work is the Playwright smoke retarget and
stale planning docs.

## Out of scope

- Atmospheric / illustrated landing experience from `UI_DESIGN_NOTES.MD`.
- Public unauthenticated marketing site, SEO, or docs site outside the SPA.
- User accounts, help center, or guided product tours.
- Changing auth, runtime config, or connection bootstrap.
- FEAT-12+ hardening, CI, Podman, or release packaging.
- Later circulation IA (FEAT-22 / FEAT-23) or backup consolidation (FEAT-25) that may change How to Use links after
  this ticket.
