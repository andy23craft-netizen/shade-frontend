# FEAT-01 — Application shell and shared UI

## Objective

Close the remaining shared-primitive accessibility gaps, finish thin feature route ownership, retire the unused
welcome bootstrap, and fill the focused automated tests so later workflows mount on a finished shell.

## Dependencies

None. This remains the first ticket in the implementation sequence.

`react-router-dom` is already installed. Do not add a component library, CSS framework, state store, data-fetching
library, or form library in this ticket.

## Current baseline

Already in place and should not be rebuilt:

- Full route map under `AppShell` in `src/routes/routes.tsx`, with metadata in `src/routes/routeMetadata.ts`.
- Paths: `/`, `/books`, `/books/new`, `/books/:bookId`, `/books/:bookId/edit`, `/checkout`, `/checkin`, `/loans`,
  `/admin/deleted`, `/admin/backup`, `/settings/connection`, and `*`.
- Shared `RoutePlaceholder`, `NotFoundPage` (message plus home link), and `createTestRouter` memory-router factory.
- `AppShell` layout: skip link, header, primary nav (Dashboard through Loans), visually separated admin/settings group,
  `main#main-content` with `Outlet`, footer, document title, and heading focus after client-side navigation only.
- `AppProviders` (`NotificationsProvider`) and `RootErrorBoundary` composed around `RouterProvider` in `src/main.tsx`.
- Feature wrappers for edit book, checkout, check-in, deleted books, backup, and connection settings.
- Shared primitives under `src/components/` with a single barrel at `src/components/index.ts`.
- Design tokens and layered styles via `src/index.css`.
- Route title/focus coverage in `src/App.test.tsx` and root error-boundary coverage in `src/RootErrorBoundary.test.tsx`.

Leftover: unused `src/App.tsx` welcome page (nothing imports it). Several early routes still render
`RoutePlaceholder` inline in `routes.tsx` instead of feature modules.

## Remaining scope

- Add the missing thin feature route wrappers and point the router at them.
- Close shared-primitive accessibility gaps below; keep consuming styles from `src/styles/components.css`.
- Remove unused `src/App.tsx` once nothing references it.
- Add the focused tests listed below (route-effects and root-boundary tests already exist; extend rather than
  duplicate).

## Shared component contract gaps

Application and feature files should import from `src/components/index.ts` rather than deep paths. Each primitive must
still accept `className` where applicable.

- `Alert`: use `role="alert"` for errors and `role="status"` for informational or success messages; keep visible text so
  color is not the only indicator. Warning may use either role if meaning remains clear without color. Today every
  variant uses `role="alert"`.
- `ConfirmationDialog`: connect title and description with `aria-labelledby` and `aria-describedby`; on open, focus the
  least destructive action; keep focus within the modal; Escape cancels; close restores focus to the opener; dangerous
  confirmations use the danger button appearance. Title labelling exists; description association, initial focus, and
  opener focus restoration still need work.
- `NotificationsProvider` / `useNotifications`: render notifications in one consistent region; new errors use
  `role="alert"` and other notifications use `role="status"`; do not make the entire notification history one live
  region (remove the wrapping `aria-live` on the list container); no timers or automatic dismissal in this ticket.
- `Button`, `AppLink`, `Field`, `LoadingState`, and `EmptyState`: already largely match the intended contracts; only
  adjust them if wiring or tests expose a defect. `LoadingState` must keep a visible label and must not continuously
  re-announce animation.

## Files to create

### Feature route wrappers

Still missing; mirror the existing thin wrappers under `src/features/*/routes/`:

- `src/features/dashboard/routes/DashboardPage.tsx`
- `src/features/books/routes/BooksPage.tsx`
- `src/features/books/routes/NewBookPage.tsx`
- `src/features/books/routes/BookDetailsPage.tsx`
- `src/features/loans/routes/LoansPage.tsx`

These should wrap `RoutePlaceholder` only. Do not duplicate shell markup.

### Tests

- Layout/navigation tests covering landmarks, navigation labels, current-page state, and not-found recovery.
- Shared-state tests covering field associations plus alert, loading, and empty-state semantics.
- Confirmation-dialog tests covering accessible name/description, initial focus, Escape, confirmation, focus
  containment, and focus restoration.
- Notifications tests covering live-region roles, visible status text, manual dismissal, and the provider hook.

Automated tests must use `createTestRouter` and must not mutate `window.history` across test cases.

## Files to modify

- `src/routes/routes.tsx` -- use the new feature wrappers for the routes that still inline `RoutePlaceholder`.
- Shared components listed under contract gaps.
- Delete `src/App.tsx` when it has no remaining references (the current `src/App.test.tsx` already covers routing
  effects via the memory router, not the welcome page).

No changes are expected in `index.html`, `vite.config.ts`, TypeScript configuration, Make targets, style-layer import
order, `AppShell` focus/title behavior, providers, or the root error boundary unless a test exposes a defect. If one is
necessary, explain why in the pull-request description and keep it limited to this ticket.

## Implementation sequence

1. Add the missing feature route wrappers and wire them in `routes.tsx`.
2. Close shared-component contract gaps.
3. Add the remaining focused tests; delete unused `src/App.tsx`.
4. Run formatting if the repository provides it, then run `make check`.
5. Spot-check the Vite preview against the manual checklist below.

Do not lazy-load these tiny placeholder route modules merely to satisfy a lazy-boundary goal. The route configuration
must permit later feature modules--especially scanning--to use route-level lazy loading without changing the shell.

## Test and manual verification checklist

- Tab from the address bar: the skip link becomes visible first and moves focus to `main-content`.
- Confirm exactly one navigation link has `aria-current="page"` on each linked route.
- Open the confirmation dialog from a trigger, cycle forward and backward through its controls, cancel with Escape, and
  confirm focus returns to the trigger. Repeat using the confirm action.
- Trigger each alert and notification severity and confirm its meaning remains clear with color ignored; confirm the
  notification list container is not itself a single live region.
- At viewport widths of 320, 768, and 1280 CSS pixels, confirm there is no horizontal page scrollbar and no clipped
  navigation or control label.
- Enable reduced motion and confirm the shell and primitives remain usable without non-essential animation.

## Acceptance criteria

- Every early route that still inlined `RoutePlaceholder` is owned by a thin feature module; leftover welcome `App` is
  removed.
- Dialogs trap and restore focus; alerts and notifications expose correct roles without wrapping all history in one
  live region.
- Shared state components expose correct names, roles, live-region behavior, and visible focus.
- Component tests cover navigation, dialogs, alerts, loading states, empty states, and notifications.
- `make check` passes.

## Plan coverage

Workstream 1; sections 6, 7.1, 7.8, and the shell-related portions of the product and quality gates.

## Out of scope

API calls, runtime credentials, server-state/query providers, final feature-page content, feature forms, barcode
scanning, automated browser tooling, and deployment-host SPA fallback configuration. Vite preview history fallback is
verified here; production host fallback remains a deployment responsibility.
