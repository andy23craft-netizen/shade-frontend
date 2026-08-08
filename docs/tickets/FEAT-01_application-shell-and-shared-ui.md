# FEAT-01 — Application shell and shared UI

## Objective

Replace the placeholder page with the accessible application structure and reusable primitives required by every later
workflow.

## Dependencies

None. This is the first ticket in the implementation sequence.

Add `react-router-dom` as the only new production dependency required by this ticket. Use the repository's Yarn version
to add it so that both `package.json` and `yarn.lock` are updated. Do not add a component library, CSS framework, state
store, data-fetching library, or form library in this ticket.

## Scope

- Add client-side routing for `/`, `/books`, `/books/new`, `/books/:bookId`, `/books/:bookId/edit`, `/checkout`,
  `/checkin`, `/loans`, `/admin/deleted`, `/admin/backup`, `/settings/connection`, and a not-found route.
- Create `src/app`, `src/components`, and feature route boundaries matching `docs/PLAN.md`.
- Build a responsive shell with persistent primary navigation and visually separated administration/settings links.
- Add route titles, a skip link, route-heading focus management, and semantic current-page indication.
- Establish design tokens for type, spacing, color, focus, status, breakpoints, hit targets, and reduced motion.
- Add shared button, link, labelled field, alert, loading, empty-state, confirmation dialog, and notification primitives.
- Add the provider composition point and root error boundary with recovery navigation.
- Use lazy route boundaries where useful without delaying ordinary navigation.

## Required route map

Implement the route paths, page headings, and document titles below. Placeholder pages must use the shared
`RoutePlaceholder` component; do not implement API calls, forms, tables, or final feature content.

| Path                   | Heading             | Document title              |
|------------------------|---------------------|-----------------------------|
| `/`                    | Dashboard           | Dashboard — Shade           |
| `/books`               | Books               | Books — Shade               |
| `/books/new`           | Add Book            | Add Book — Shade            |
| `/books/:bookId`       | Book Details        | Book Details — Shade        |
| `/books/:bookId/edit`  | Edit Book           | Edit Book — Shade           |
| `/checkout`            | Check Out           | Check Out — Shade           |
| `/checkin`             | Check In            | Check In — Shade            |
| `/loans`               | Loans               | Loans — Shade               |
| `/admin/deleted`       | Deleted Books       | Deleted Books — Shade       |
| `/admin/backup`        | Backup Library      | Backup Library — Shade      |
| `/settings/connection` | Connection Settings | Connection Settings — Shade |
| `*`                    | Page Not Found      | Page Not Found — Shade      |

The not-found page must state that the requested page was not found and include a link to `/`. Parameterized routes
must render for any non-empty `bookId`; validating whether a book exists belongs to a later ticket.

## Required navigation and layout behavior

- Render one `header`, one primary `nav` labelled `Primary navigation`, one `main` with `id="main-content"`, and a
  footer. Put the routed page content inside the `main`.
- Put a `Skip to main content` link first in the document's keyboard focus order. Hide it visually until focused.
- The primary navigation must contain Dashboard, Books, Add Book, Check Out, Check In, and Loans in that order.
- Visually separate Deleted Books, Backup Library, and Connection Settings from the primary workflow links, while
  keeping all three keyboard reachable. There is no authorization or role check in this ticket.
- Use router links for internal navigation. The link whose destination exactly matches the current location must set
  `aria-current="page"`. Dashboard must not appear current on every route.
- On narrow screens, navigation may wrap or stack, but all destinations must remain available without a JavaScript-only
  hamburger menu. Do not hide navigation behind an unimplemented control.
- The content column must fit a 320 CSS-pixel viewport without horizontal scrolling. Long placeholder text and future
  content must be able to wrap.
- All interactive controls must have a minimum 44-by-44 CSS-pixel hit area unless they are inline text links.

## Route title and focus behavior

Keep route side effects in `src/app/RouteEffects.tsx`, using the current matched route metadata:

1. On every route, including the initial load, set `document.title` to the title in the route map.
2. Do not move focus on the initial render. This preserves normal browser startup behavior.
3. After a client-side location change, focus the new page's `h1`.
4. Give that heading `tabIndex={-1}` so it can receive programmatic focus without entering the normal Tab sequence.
5. Do not scroll twice or announce a separate empty live region for route changes; the focused heading is the
   announcement.

Each route must have exactly one visible `h1`. The shared `RoutePlaceholder` must render and identify that heading in a
consistent way so `RouteEffects` does not depend on heading text.

## Shared component contracts

Build only the following product-agnostic primitives. Each component must accept a `className` so later tickets can
extend presentation without copying the component.

- `Button`: a native `button`; supports `primary`, `secondary`, and `danger` variants; defaults to `type="button"`; and
  forwards ordinary button props and its ref. Disabled and focus-visible states must be visually distinct.
- `AppLink`: uses the router's link for internal destinations; supports the same visual variants as links used in the
  shell; and forwards ordinary link props and its ref. Do not use this component for external URLs.
- `Field`: renders a persistent label and a control supplied as a child. It must generate or accept stable IDs, connect
  optional help text with `aria-describedby`, and connect an error message with both `aria-describedby` and
  `aria-invalid`. Do not use placeholder text as the label.
- `Alert`: renders non-interactive feedback with `role="alert"` for errors and `role="status"` for informational or
  success messages. Support `info`, `success`, `warning`, and `error` appearances, with visible text or an icon plus
  accessible text so color is not the only indicator.
- `LoadingState`: has a visible loading label and `role="status"`. It must not continuously re-announce an animated
  element.
- `EmptyState`: has a heading, explanatory text, and an optional action. It is ordinary content, not a live region.
- `ConfirmationDialog`: takes an open state, title, description, confirm label, cancel callback, and confirm callback.
  Use the native `dialog` element with `showModal()` when supported. On open, focus the least destructive action; keep
  focus within the modal; Escape acts as cancel; and close restores focus to the element that opened it. The title and
  description must be connected with `aria-labelledby` and `aria-describedby`. A dangerous confirmation must use the
  danger button appearance.
- `NotificationsProvider` and `useNotifications`: expose a method to add dismissible `info`, `success`, `warning`, or
  `error` notifications. Render notifications in one consistently located region. New errors use `role="alert"`; other
  notifications use `role="status"`. Do not make the entire notification history a live region, and do not add timers
  or automatic dismissal in this ticket.

Use `src/components/index.ts` as the public export surface. Application and feature files should import shared
primitives from that file rather than reaching into component implementation files.

## Design-token requirements

Define CSS custom properties in `src/styles/tokens.css`; components must consume those properties instead of introducing
unexplained one-off color or spacing values. At minimum provide:

- A system font stack and sizes for body text and headings.
- A spacing scale used for gaps, padding, and margins.
- Page, surface, text, muted-text, border, link, and primary colors.
- Success, warning, danger, and informational foreground/background/border colors.
- A visible focus-ring color, width, and offset with at least 3:1 contrast against adjacent colors.
- Small, medium, and large border radii; a content-width limit; and one narrow-screen breakpoint.
- A 44-pixel minimum control target.
- Normal and reduced-motion transition durations.

In a `prefers-reduced-motion: reduce` media query, remove non-essential animation and make transitions effectively
instant. Verify text and meaningful UI boundaries meet WCAG AA contrast; do not rely on opacity alone for muted text.

## Error boundary and providers

- `AppProviders` is the single composition point for application-wide providers. For this ticket it must include
  `NotificationsProvider` and render its children. Later tickets will add configuration and server-state providers here.
- `RootErrorBoundary` must catch unexpected React render errors below it and show a generic `Something went wrong`
  heading. It must not render the thrown message or stack.
- The fallback must provide a `Try again` button that clears the boundary state and a plain link to `/` that remains
  useful even if router rendering failed.
- Keep developer diagnostics out of the rendered fallback. This ticket does not add telemetry or logging.

## Files to create

Create the following files. If implementation requires a small colocated type or helper, add it beside its owner and
record the addition in the pull-request description; do not create alternate top-level folders.

### Application and routing

- `src/app/AppProviders.tsx` — application-wide provider composition.
- `src/app/AppLayout.tsx` — skip link, header, navigation, main outlet, and footer.
- `src/app/RootErrorBoundary.tsx` — generic root fallback and recovery actions.
- `src/app/RouteEffects.tsx` — document-title and route-heading focus behavior.
- `src/app/RoutePlaceholder.tsx` — consistently structured labelled placeholder page.
- `src/app/routes.tsx` — route objects, route metadata, and not-found route.
- `src/app/router.tsx` — browser-router creation for production and memory-router creation for tests.

### Feature route boundaries

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

These route files should be small wrappers around `RoutePlaceholder`. They establish ownership for later tickets; do
not duplicate shell markup in them.

### Shared components

- `src/components/Button.tsx`
- `src/components/AppLink.tsx`
- `src/components/Field.tsx`
- `src/components/Alert.tsx`
- `src/components/LoadingState.tsx`
- `src/components/EmptyState.tsx`
- `src/components/ConfirmationDialog.tsx`
- `src/components/Notifications.tsx`
- `src/components/index.ts`

### Styles

- `src/styles/tokens.css` — custom properties only.
- `src/styles/base.css` — reset, document defaults, typography, skip link, and focus defaults.
- `src/styles/shell.css` — responsive application-shell and navigation layout.
- `src/styles/components.css` — shared primitive appearances and states.

### Tests

- `src/app/AppLayout.test.tsx` — landmarks, navigation labels, current-page state, and not-found recovery.
- `src/app/RouteEffects.test.tsx` — title updates, no initial focus movement, and heading focus after navigation.
- `src/app/RootErrorBoundary.test.tsx` — generic fallback, hidden error details, retry, and home recovery link.
- `src/components/SharedStates.test.tsx` — field associations plus alert, loading, and empty-state semantics.
- `src/components/ConfirmationDialog.test.tsx` — accessible name/description, initial focus, Escape, confirmation, focus
  containment, and focus restoration.
- `src/components/Notifications.test.tsx` — live-region roles, visible status text, manual dismissal, and provider hook.

## Files to modify

- `package.json` — add `react-router-dom` through Yarn; do not hand-edit a version.
- `yarn.lock` — generated lockfile update from the same Yarn command.
- `src/App.tsx` — replace the placeholder with `RootErrorBoundary`, `AppProviders`, and the production router.
- `src/main.tsx` — keep the root lookup and `StrictMode`; continue rendering `App`.
- `src/index.css` — replace the placeholder styles with ordered imports of the four files in `src/styles`.
- `src/App.test.tsx` — replace the welcome-heading test with a small application bootstrap smoke test.

No changes are expected in `index.html`, `vite.config.ts`, TypeScript configuration, Make targets, or test setup. If one
is necessary, explain why in the pull-request description and keep it limited to this ticket.

## Implementation sequence

1. Run `yarn add react-router-dom` and confirm only the package manifest and lockfile change.
2. Add tokens and base styles before component styles so every primitive uses the same values.
3. Implement and test the shared components without feature-specific language or API behavior.
4. Add the placeholder feature route modules and route metadata.
5. Build the shell and route effects, then compose the router, providers, and error boundary in `src/App.tsx`.
6. Replace the old placeholder test and add the focused test files listed above.
7. Run formatting if the repository provides it, then run `make check`.
8. Start the Vite preview and complete the manual checks below.

Do not lazy-load these tiny placeholder route modules merely to satisfy the lazy-boundary scope item. The route
configuration must permit later feature modules—especially scanning—to use route-level lazy loading without changing
the shell.

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
