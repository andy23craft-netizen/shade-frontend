# FEAT-01 — Application shell and shared UI

## Objective

Finish the accessible application shell, full route map, provider composition, and shared-primitive contracts so later
workflows can mount on a stable frame.

## Dependencies

None. This remains the first ticket in the implementation sequence.

`react-router-dom` is already installed. Do not add a component library, CSS framework, state store, data-fetching
library, or form library in this ticket.

## Current baseline

The repository already has:

- React Router bootstrap via `RouterProvider` in `src/main.tsx` and `createBrowserRouter` in `src/routes/routes.tsx`.
- Partial route metadata and placeholder pages for `/`, `/books`, `/books/:bookId`, `/books/new`, `/loans`, and `*`.
- Shared primitives under `src/components/` with an active barrel at `src/components/index.tsx`.
- Design tokens and layered styles: `tokens.css`, `base.css`, `shell.css`, `components.css` via `src/index.css`.
- `src/layout/AppShell.tsx` with skip link, landmarks, and partial navigation -- not yet used as a router layout.
- Leftover `src/App.tsx` welcome page and `src/App.test.tsx`; they are not mounted by the live bootstrap path.
- Empty companion file `src/components/index.ts` (the real barrel is `index.tsx`).

Build on this layout (`src/routes/`, `src/layout/`, `src/components/`). Do not recreate the earlier planned `src/app/`
tree unless a small new module does not fit the existing folders.

## Remaining scope

- Register the missing routes and correct incomplete metadata (see route map).
- Wire `AppShell` as the layout route so every page shares skip link, header, primary nav, `main#main-content`, and
  footer.
- Complete primary and admin/settings navigation, current-page indication, and not-found recovery content.
- Fix route title and heading-focus behavior so initial load does not move focus and client-side navigations do.
- Close shared-primitive accessibility gaps called out below; keep consuming styles from `src/styles/components.css`.
- Add `AppProviders` (at least `NotificationsProvider`) and `RootErrorBoundary` with recovery actions.
- Add feature route modules as thin placeholder wrappers so later tickets own clear files.
- Add a memory-router factory for tests; replace the welcome-page smoke test; add the focused tests listed below.
- Remove or stop relying on dead bootstrap paths (`src/App.tsx` / empty `index.ts`) once the shell composition is live.

## Required route map

Implement every path below. Placeholder pages must use a shared labelled placeholder; do not implement API calls,
forms, tables, or final feature content.

| Path                   | Heading             | Document title              | Status in repo today      |
|------------------------|---------------------|-----------------------------|---------------------------|
| `/`                    | Dashboard           | Dashboard — Shade           | Present                   |
| `/books`               | Books               | Books — Shade               | Present                   |
| `/books/new`           | Add Book            | Add Book — Shade            | Present                   |
| `/books/:bookId`       | Book Details        | Book Details — Shade        | Present; title/heading wrong (`Book`) |
| `/books/:bookId/edit`  | Edit Book           | Edit Book — Shade           | Missing                   |
| `/checkout`            | Check Out           | Check Out — Shade           | Missing                   |
| `/checkin`             | Check In            | Check In — Shade            | Missing                   |
| `/loans`               | Loans               | Loans — Shade               | Present                   |
| `/admin/deleted`       | Deleted Books       | Deleted Books — Shade       | Missing                   |
| `/admin/backup`        | Backup Library      | Backup Library — Shade      | Missing                   |
| `/settings/connection` | Connection Settings | Connection Settings — Shade | Missing                   |
| `*`                    | Page Not Found      | Page Not Found — Shade      | Present; needs recovery copy and home link |

The not-found page must state that the requested page was not found and include a link to `/`. Parameterized routes
must render for any non-empty `bookId`; validating whether a book exists belongs to a later ticket.

## Required navigation and layout behavior

- Mount one `header`, one primary `nav` labelled `Primary navigation`, one `main` with `id="main-content"`, and a
  footer through `AppShell`. Put routed page content in the layout `Outlet` inside `main` (child routes must not wrap
  another `main`).
- Keep the existing `Skip to main content` link first in keyboard focus order and visually hidden until focused.
- Primary navigation must contain Dashboard, Books, Add Book, Check Out, Check In, and Loans in that order.
- Visually separate Deleted Books, Backup Library, and Connection Settings from the primary workflow links, while
  keeping all three keyboard reachable. There is no authorization or role check in this ticket.
- Use router links for internal navigation. The link whose destination exactly matches the current location must set
  `aria-current="page"`. Dashboard must not appear current on every route.
- On narrow screens, navigation may wrap or stack, but all destinations must remain available without a JavaScript-only
  hamburger menu.
- The content column must fit a 320 CSS-pixel viewport without horizontal scrolling.
- Interactive controls must keep the existing 44-by-44 CSS-pixel minimum hit area unless they are inline text links.

## Route title and focus behavior

Keep route side effects in one place (extend `AppShell`, extract a small helper beside the router, or add a dedicated
module under `src/routes/` / `src/layout/`). Requirements:

1. On every route, including the initial load, set `document.title` to the title in the route map.
2. Do not move focus on the initial render.
3. After a client-side location change, focus the new page's `h1`.
4. Give that heading `tabIndex={-1}` so it can receive programmatic focus without entering the normal Tab sequence.
5. Do not scroll twice or announce a separate empty live region for route changes; the focused heading is the
   announcement.

Each route must have exactly one visible `h1`. The shared placeholder must identify that heading consistently so focus
logic does not depend on heading text.

Today, titles are set inside route elements and `AppShell` focuses the heading on every `pathname` change, including
the first paint. Both need to match the rules above once the shell is wired.

## Shared component contract gaps

The primitive modules already exist. Close the following gaps before treating them as done; each must still accept
`className`. Application and feature files should import from `src/components/index.tsx` (or a single cleaned-up barrel)
rather than deep paths.

- `Alert`: use `role="alert"` for errors and `role="status"` for informational or success messages; keep visible text so
  color is not the only indicator. Warning may use either role if meaning remains clear without color.
- `ConfirmationDialog`: connect title and description with `aria-labelledby` and `aria-describedby`; on open, focus the
  least destructive action; keep focus within the modal; Escape cancels; close restores focus to the opener; dangerous
  confirmations use the danger button appearance.
- `NotificationsProvider` / `useNotifications`: render notifications in one consistent region; new errors use
  `role="alert"` and other notifications use `role="status"`; do not make the entire notification history one live
  region; no timers or automatic dismissal in this ticket.
- `Button`, `AppLink`, `Field`, `LoadingState`, and `EmptyState`: already largely match the intended contracts; only
  adjust them if wiring or tests expose a defect. `LoadingState` must keep a visible label and must not continuously
  re-announce animation.

## Providers and error boundary

- Add an application-wide provider composition point that includes `NotificationsProvider` and renders its children.
  Later tickets will add configuration and server-state providers there.
- Add a root error boundary that catches unexpected React render errors and shows a generic `Something went wrong`
  heading without the thrown message or stack.
- The fallback must provide a `Try again` button that clears the boundary state and a plain link to `/` that remains
  useful even if router rendering failed.
- Keep developer diagnostics out of the rendered fallback. This ticket does not add telemetry or logging.
- Compose providers and the error boundary around the live router entry (today that is `src/main.tsx` /
  `RouterProvider`), not the unused welcome `App` component.

## Files to create

Create only what is still missing. Prefer colocating small helpers beside existing owners.

### Routing and layout (extend existing modules where practical)

- Missing placeholder route modules under feature folders, for example:
  - `src/features/dashboard/routes/DashboardPage.tsx`
  - `src/features/books/routes/BooksPage.tsx`
  - `src/features/books/routes/NewBookPage.tsx`
  - `src/features/books/routes/BookDetailsPage.tsx`
  - `src/features/books/routes/EditBookPage.tsx`
  - `src/features/books/routes/DeletedBooksPage.tsx`
  - `src/features/books/routes/BackupLibraryPage.tsx`
  - `src/features/loans/routes/CheckoutPage.tsx`
  - `src/features/loans/routes/CheckinPage.tsx`
  - `src/features/loans/routes/LoansPage.tsx`
  - `src/features/settings/routes/ConnectionPage.tsx`
- Shared `RoutePlaceholder` (or equivalent) used by those wrappers.
- Memory-router factory for tests (extend `src/routes/` rather than inventing a second router home).
- Provider composition and root error boundary modules beside the existing bootstrap/layout code.

These route files should be small wrappers around the shared placeholder. They establish ownership for later tickets;
do not duplicate shell markup in them.

### Tests

- Layout/navigation tests covering landmarks, navigation labels, current-page state, and not-found recovery.
- Route-effects tests covering title updates, no initial focus movement, and heading focus after navigation.
- Root error-boundary tests covering generic fallback, hidden error details, retry, and home recovery link.
- Shared-state tests covering field associations plus alert, loading, and empty-state semantics.
- Confirmation-dialog tests covering accessible name/description, initial focus, Escape, confirmation, focus
  containment, and focus restoration.
- Notifications tests covering live-region roles, visible status text, manual dismissal, and the provider hook.

## Files to modify

- `src/routes/routeMetadata.ts` — complete metadata; fix Book Details labels; add missing destinations.
- `src/routes/routes.tsx` — register the full route map under `AppShell`; remove nested duplicate `main` wrappers from
  child pages; stop relying on per-route title hacks once shared effects exist.
- `src/layout/AppShell.tsx` — full navigation order, admin/settings group, and correct focus behavior when used as the
  layout element.
- Shared components listed under contract gaps.
- `src/main.tsx` — compose error boundary and providers around `RouterProvider` as needed.
- `src/App.test.tsx` — replace the welcome-heading test with a small application bootstrap smoke test, or delete
  `src/App.tsx` / its test once nothing references them.
- `src/components/index.ts` / `index.tsx` — keep a single public export surface; remove the empty companion if unused.

No changes are expected in `index.html`, `vite.config.ts`, TypeScript configuration, Make targets, style-layer import
order, or test setup beyond what the new tests require. If one is necessary, explain why in the pull-request description
and keep it limited to this ticket.

## Implementation sequence

1. Complete route metadata and placeholder feature modules; register missing paths.
2. Wire `AppShell` as the layout route and finish navigation groups.
3. Centralize document-title and heading-focus behavior; verify initial load does not steal focus.
4. Close shared-component contract gaps and compose notifications + root error boundary into bootstrap.
5. Add the memory-router factory and focused tests; retire the unused welcome bootstrap test path.
6. Run formatting if the repository provides it, then run `make check`.
7. Start the Vite preview and complete the manual checks below.

Do not lazy-load these tiny placeholder route modules merely to satisfy a lazy-boundary goal. The route configuration
must permit later feature modules—especially scanning—to use route-level lazy loading without changing the shell.

## Test and manual verification checklist

Automated tests must use the memory-router factory and must not mutate `window.history` across test cases.

- Tab from the address bar: the skip link becomes visible first and moves focus to `main-content`.
- Visit every path in the route map directly and confirm the expected `h1` and title.
- Navigate through every shell link using only Tab, Shift+Tab, Enter, and Space where applicable.
- Confirm exactly one navigation link has `aria-current="page"` on each linked route.
- Navigate between at least three routes and confirm focus moves to each new `h1`; refresh and confirm initial focus is
  not forcibly moved.
- Open the confirmation dialog from a trigger, cycle forward and backward through its controls, cancel with Escape, and
  confirm focus returns to the trigger. Repeat using the confirm action.
- Trigger each alert and notification severity and confirm its meaning remains clear with color ignored.
- At viewport widths of 320, 768, and 1280 CSS pixels, confirm there is no horizontal page scrollbar and no clipped
  navigation or control label.
- Enable reduced motion in the browser or operating system and confirm the shell and primitives remain usable without
  non-essential animation.
- Throw a test render error and confirm the boundary shows recovery actions without the original message or stack.

## Acceptance criteria

- Every path in the required route map renders the specified labelled placeholder; its direct URL loads successfully
  in the Vite preview.
- `AppShell` is the live layout for those routes; leftover welcome `App` is not the mounted product UI.
- All routes and navigation are keyboard operable; dialogs trap and restore focus.
- Route changes update the document title and move focus to the route heading without disrupting initial page load.
- Current navigation state is conveyed semantically and without color alone.
- Layouts have no horizontal overflow at 320 CSS pixels and remain usable on phone, tablet, and desktop widths.
- Shared state components expose correct names, roles, live-region behavior, and visible focus.
- The root error boundary provides a safe recovery path and does not expose error details by default.
- Component tests cover navigation, focus behavior, dialogs, alerts, loading states, and empty states.
- `make check` passes.

## Plan coverage

Workstream 1; sections 6, 7.1, 7.8, and the shell-related portions of the product and quality gates.

## Out of scope

API calls, runtime credentials, server-state/query providers, final feature-page content, feature forms, barcode
scanning, automated browser tooling, and deployment-host SPA fallback configuration. Vite preview history fallback is
verified here; production host fallback remains a deployment responsibility.
