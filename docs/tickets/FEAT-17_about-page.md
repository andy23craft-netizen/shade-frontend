# FEAT-17 — About page as homepage

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

Already in place and should be reused (not rebuilt):

- `/` is `DashboardPage` (`src/features/dashboard/routes/DashboardPage.tsx`) via `routeMetadata.dashboard.path`
  (`'/'`) in `src/routes/routes.tsx`.
- Primary navigation in `AppShell` links "Dashboard" to `/`; the brand link "Shade Library" also goes to `/`.
  Primary nav also includes Books, Add Book, Check Out, Check In, Loans, and Shelves (`/shelves`), plus admin links.
- Document title and heading focus come from route `handle.title` plus `AppShell` behavior.
- `NotFoundPage` links back with "Return to the dashboard" (`to="/"`).
- `RootErrorBoundary` recovery copy mentions returning to the dashboard; the control is an `<a href="/">` labeled
  "Return home".
- Shared primitives (`AppLink`, `Button`, route-page layout classes) and CSS layers (`tokens` / `base` / `shell` /
  `components`) are the styling surface. Dashboard-specific classes stay on the dashboard page.
- Product design notes in `docs/product-docs/UI_DESIGN_NOTES.MD` describe a future atmospheric landing room (library
  image, dust motes, weather window). That vision is **not** MVP for this ticket; reuse the existing app chrome and
  typography.

## Product intent

The About homepage should answer three questions for a first-time (or returning) operator:

1. **What it is** -- Shade is a personal home-library browser UI for a FastAPI backend: collection, loans, and reading
   tracking with a shared Bearer token (no user accounts).
2. **Why it exists** -- Manage a private physical book collection: add titles (manual / ISBN / scanner), lend books,
   record reading, soft-delete / restore, and back up library data without multi-tenant SaaS complexity.
3. **How to use it** -- Short, actionable guidance with in-app links to the main workflows (browse, add, check out /
   in, loans, shelves catalog, dashboard metrics, admin restore / backup). Keep copy accurate to shipped routes; do
   not describe out-of-scope product ideas (wish lists, cover images, multi-library, accounts, and so on).

Tone: clear maintainer/operator documentation inside the product, not marketing fluff. Prefer one composition with a
clear heading hierarchy over a card grid or dashboard of widgets.

## Remaining scope (file-level plan)

### New files

| File | Change |
| ---- | ------ |
| `src/features/about/routes/AboutPage.tsx` | New static route page. Semantic `section.route-page` (or an about-specific BEM root if styles need it), `h1` with `tabIndex={-1}` matching other routes, sections for what / why / how-to-use, and `AppLink` CTAs into existing product routes. No React Query, no API client. |
| `src/features/about/routes/AboutPage.test.tsx` | Colocated tests: heading / document-title path via `renderAppTree` when wired at `/`; presence of the three explanatory sections; primary "how to use" links resolve to `/books`, `/books/new`, `/checkout`, `/checkin`, `/loans`, `/shelves`, `/dashboard`, and admin routes as chosen in copy; keyboard-focusable heading; no network calls asserted. |

### Routing and metadata

| File | Change |
| ---- | ------ |
| `src/routes/routeMetadata.ts` | Add `about: { path: '/', title: 'About', heading: 'About' }` (or an equivalent product title such as "Shade Library" if preferred -- keep title and `h1` aligned). Change `dashboard.path` from `'/'` to `'/dashboard'`; keep dashboard title/heading as "Dashboard". |
| `src/routes/routes.tsx` | Register `AboutPage` at `routeMetadata.about.path`. Move `DashboardPage` to `routeMetadata.dashboard.path` (`/dashboard`). Import from the new about feature module. Preserve all other routes. |

### Shell, recovery, and copy that assume `/` is the dashboard

| File | Change |
| ---- | ------ |
| `src/layout/AppShell.tsx` | Keep the brand `NavLink` to `/` (now About / home). Point the "Dashboard" nav item to `/dashboard`. Optionally add a primary "About" nav item to `/` with `end` (recommended for current-page clarity when not relying solely on the brand). Do not remove Books / Add Book / Check Out / Check In / Loans / Shelves / admin links. |
| `src/routes/NotFoundPage.tsx` | Update recovery link label and destination semantics: link to `/` as "Return home" (or "Return to About"). Stop calling `/` "the dashboard". |
| `src/RootErrorBoundary.tsx` | Align body copy with home being About (e.g., remove "return to the dashboard" if `/` is no longer the dashboard). Keep "Return home" → `/`. |
| `src/layout/AppShell.test.tsx` | Expect Dashboard nav to `/dashboard`; expect About (and/or brand) current-page behavior on `/`; update not-found recovery assertion away from "Return to the dashboard" if that string changes. |
| `src/RootErrorBoundary.test.tsx` | Update copy assertions if the recovery paragraph changes. |
| `src/features/dashboard/routes/DashboardPage.test.tsx` | If any test mounts the page through the router at `/`, retarget to `/dashboard`. Prefer keeping direct `DashboardPage` unit mounts; update any route-level assumptions. |
| `src/App.test.tsx` (and any other route tests) | Retarget home-route title/heading expectations from Dashboard to About when navigating to `/`. |

### Styling

| File | Change |
| ---- | ------ |
| `src/styles/components.css` | Add minimal about-page classes only if `route-page` / existing prose patterns are insufficient (e.g., `.about-page`, section spacing, how-to list). Reuse tokens; BEM-like naming; no new CSS framework. Prefer shell/components layers over one-off global rules. |
| `src/styles/shell.css` | Touch only if nav density or about-as-home active states need adjustment; avoid unrelated shell refactors. |

### Documentation (required when the feature lands)

| File | Change |
| ---- | ------ |
| `docs/AGENTS.md` | Record About as `/` and Dashboard as `/dashboard`; list `src/features/about/`; update "Live product UI" and remaining-ticket notes to include FEAT-17. |
| `docs/full-project-context.md` | Same homepage / `/dashboard` path notes when that pack is kept current. |
| `docs/ToDo.md` | Add a checklist entry for FEAT-17 when maintainers track it there. |
| `docs/product-docs/PLAN.md` | Note that `/` is the About landing page and `/dashboard` hosts read-only metrics (PLAN currently documents `/` as dashboard). |

### Explicit non-goals for implementation

- Do not change `dashboardApi`, `useDashboard`, query keys, or dashboard invalidation.
- Do not add runtime CMS, markdown loaders, or i18n frameworks.
- Do not implement the atmospheric landing-room art from UI design notes (full-bleed library photo, dust motes,
  weather window, time-of-day lighting, seasonal skins). Link or mention those notes only as future polish.
- Do not invent backend About content or version negotiation beyond the existing footer release identifier.

## Suggested page structure

Keep the first viewport simple: brand context (via shell), one page heading, one short supporting sentence, then the
three sections. Example outline (exact copy is implementer-owned; keep it accurate):

1. **Heading** -- About Shade Library (or "Shade Library").
2. **What** -- Personal home-library manager backed by the Shade API.
3. **Why** -- Track ownership, loans, and reading for a private collection.
4. **How to use** -- Short ordered or linked list:
   - Browse the collection (`/books`) and open a book for detail actions.
   - Add a book manually or via ISBN / camera / hardware scanner (`/books/new`).
   - Check out and check in (`/checkout`, `/checkin`); review loans (`/loans`).
   - Manage shelves (`/shelves`); Add/Edit Book pickers load from that catalog.
   - Mark read / edit reading from book detail when eligible.
   - Review metrics on the Dashboard (`/dashboard`).
   - Restore soft-deleted books and download SQL backup under Administration (`/admin/deleted`, `/admin/backup`).
5. **Optional CTA row** -- Primary link to Books or Dashboard; secondary links as needed. Reuse `AppLink` /
   `Button` variants; no new card chrome.

## Acceptance criteria

- Visiting `/` shows the About page (document title fragment and `h1` match `routeMetadata.about`).
- The page explains what Shade is, why it exists, and how to use the main workflows, with working in-app links.
- Brand navigation to `/` lands on About.
- Dashboard remains fully functional at `/dashboard` with the same FEAT-11 behavior (metrics, refresh, offline/stale,
  inconsistency warning, `QueryErrorState`).
- Primary nav exposes Dashboard at `/dashboard` (and About at `/` if a dedicated nav item is added).
- Not-found and root error-boundary recovery no longer describe `/` as the dashboard; home recovery goes to `/`.
- About loads without API requests; dashboard still uses `GET /dashboard` only on its own route.
- Keyboard and 320px usability match existing shell conventions (landmarks, focusable `h1`, visible focus).
- Colocated About tests pass; updated shell / recovery / home-route tests pass.
- `make check` passes.
- `docs/AGENTS.md` (and PLAN / ToDo / `docs/full-project-context.md` as needed) reflect the new homepage and
  `/dashboard` path.

## Plan coverage

Homepage / operator onboarding surface not previously ticketed; complements Workstream 10 (dashboard) by relocating
metrics off `/` while preserving FEAT-11 behavior.

## Out of scope

- Atmospheric / illustrated landing experience from `UI_DESIGN_NOTES.MD`.
- Public unauthenticated marketing site, SEO, or docs site outside the SPA.
- User accounts, help center, or guided product tours.
- Changing auth, runtime config, or connection bootstrap.
- FEAT-12+ hardening, CI, Podman, or release packaging.
