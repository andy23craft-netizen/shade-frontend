# FEAT-01 — Application shell and shared UI

## Objective

Replace the placeholder page with the accessible application structure and reusable primitives required by every later
workflow.

## Dependencies

None. This is the first ticket in the implementation sequence.

## Scope

- Add client-side routing for `/`, `/books`, `/books/new`, `/books/:bookId`, `/books/:bookId/edit`, `/checkout`,
  `/checkin`, `/loans`, `/admin/deleted`, `/settings/connection`, and a not-found route.
- Create `src/app`, `src/components`, and feature route boundaries matching `docs/PLAN.md`.
- Build a responsive shell with persistent primary navigation and visually separated administration/settings links.
- Add route titles, a skip link, route-heading focus management, and semantic current-page indication.
- Establish design tokens for type, spacing, color, focus, status, breakpoints, hit targets, and reduced motion.
- Add shared button, link, labelled field, alert, loading, empty-state, confirmation dialog, and notification primitives.
- Add the provider composition point and root error boundary with recovery navigation.
- Use lazy route boundaries where useful without delaying ordinary navigation.

## Acceptance criteria

- Every planned route renders a labelled placeholder and supports direct navigation and refresh in the Vite preview.
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

API calls, runtime credentials, final feature-page content, and deployment-host SPA fallback configuration.
