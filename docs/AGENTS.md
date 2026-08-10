# LLM Project Context

Use this document as baseline context when working on the Shade frontend in a fresh LLM chat. Inspect the current
repository before making changes because the code may have changed since this document was written. A user's
explicit request takes precedence over general guidance here.

## Project Summary

Shade is a frontend for a personal library management application. Planned capabilities include:

- Viewing collection, borrowing, and reading metrics on a dashboard.
- Adding books through ISBN entry or barcode scanning.
- Checking books out to borrowers and checking them back in.
- Tracking reading completion, ratings, and notes.
- Soft-deleting and restoring books while preserving history.
- Sending a bearer token with backend API requests.

The application-shell ticket (`docs/tickets/FEAT-01_application-shell-and-shared-ui.md`) is complete. React Router
mounts under `AppShell` with the full early route map, thin feature-owned placeholder pages, shared UI primitives,
notifications via `AppProviders`, and a root error boundary. There is still no runtime configuration, API client,
server state, persistence, or feature workflow UI. The next sequenced ticket is
`docs/tickets/FEAT-02_runtime-configuration-and-connection.md`.

Product intent, sequencing, and acceptance criteria live under `docs/`. Prefer the current ticket, then
`docs/product-docs/PLAN.md`, then the product requirements docs when deciding what to build next.

## Technology

- React 19
- TypeScript 6 in strict mode
- Vite 8
- React Router 7 (`react-router-dom`), integrated in `src/main.tsx`
- Vitest with jsdom
- Testing Library and jest-dom
- ESLint flat configuration
- Yarn 4 through Corepack (`yarn@4.18.0` in `package.json`)
- Node.js 26.7.0
- Make command wrappers

The package uses native ECMAScript modules through `"type": "module"`.

## Agent Operating Rules

- Work only inside the frontend repository.
- The related backend and orchestrator repositories may be read when cross-project context is necessary.
- Do not mutate Git state. Do not stage, unstage, commit, check out, push, pull, add, remove, or delete through
  Git. Ask before stashing or unstashing.
- Use read-only Git commands only when needed to understand the working tree or history.
- Do not overwrite or revert unrelated user changes.
- Use Yarn rather than npm.
- Do not edit `yarn.lock` manually; update dependencies through Yarn.
- Keep secrets, local databases, dependencies, coverage, and build output untracked.
- Make focused changes and avoid unrelated refactoring.
- Add or update tests when behavior changes.
- Run checks appropriate to the change. Prefer the complete `make check` quality gate before handoff.
- Treat the existing implementation and requirements as evidence, not assumptions. Call out conflicts or unclear
  requirements instead of silently inventing behavior.

When writing Markdown:

- Use straight quotation marks and apostrophes.
- Use `...` instead of the ellipsis character.
- Use `--` instead of an em dash and `-` instead of an en dash.
- Follow "e.g.," and "i.e.," with a comma.
- Keep lines at or below 120 characters, excluding Markdown tables.
- End files with a newline.

## Runtime Architecture

The browser startup and styling flow is:

```text
index.html
  -> src/main.tsx
       -> RootErrorBoundary
            -> AppProviders (NotificationsProvider)
                 -> RouterProvider(router from src/routes/routes.tsx)
                      -> AppShell (layout route)
                           -> feature route pages via Outlet
       -> src/index.css
            -> src/styles/tokens.css
            -> src/styles/base.css
            -> src/styles/shell.css
            -> src/styles/components.css
```

`index.html` creates the `#root` mount point and loads `src/main.tsx`. The bootstrap module imports the router and
global stylesheet, validates the mount point, and renders `RouterProvider` inside `RootErrorBoundary` and
`AppProviders` in `StrictMode`.

`AppShell` owns document title updates (`{route title}` plus an em dash and ` Shade`), skip link, primary and
admin navigation, the main `Outlet`, footer, and heading focus after client-side navigations. Feature pages under
`src/features/*/routes/` currently render `RoutePlaceholder` only; product UI arrives in later tickets.

TypeScript checks source code but emits no JavaScript. Vite transforms modules during development and creates the
production bundle. The CSS import order is intentional: later layers use tokens and defaults declared by earlier
layers.

## Project Structure

This inventory covers every project-owned file outside `docs/`. Do not assume generated or dependency directories
are source code. In particular, omit `node_modules/`, `dist/`, `coverage/`, `.vite/`, `.yarn/`, and `.git/` from
normal code changes.

### Browser Application

- `index.html`: Vite's HTML entrypoint. It defines page metadata, creates `#root`, and loads `src/main.tsx`.
- `src/main.tsx`: Browser bootstrap. It imports global CSS and the router, checks for `#root`, and mounts
  `RootErrorBoundary` -> `AppProviders` -> `RouterProvider` in `StrictMode`.
- `src/AppProviders.tsx`: Application-wide providers. Today it wraps children in `NotificationsProvider`.
- `src/RootErrorBoundary.tsx`: Class error boundary with a recoverable fallback (retry and return home).
- `src/vite-env.d.ts`: Adds Vite client and asset declarations to TypeScript. It has no runtime behavior.

### Routing and Layout

- `src/routes/routeMetadata.ts`: Path, document-title fragment, and heading metadata for every registered route.
- `src/routes/routes.tsx`: `createBrowserRouter` configuration. `AppShell` is the parent layout. Registered paths
  are `/`, `/books`, `/books/new`, `/books/:bookId`, `/books/:bookId/edit`, `/checkout`, `/checkin`, `/loans`,
  `/admin/deleted`, `/admin/backup`, `/settings/connection`, and `*` (not found).
- `src/routes/RoutePlaceholder.tsx`: Minimal route body used by unfinished feature pages (`h1` with `tabIndex={-1}`).
- `src/routes/NotFoundPage.tsx`: Not-found message plus a link back to the dashboard.
- `src/routes/createMemoryRouter.ts`: Exports `createTestRouter` for tests; builds a memory router from `routeConfig`.
- `src/layout/AppShell.tsx`: Application frame with skip link, header, primary navigation, admin/settings group,
  `Outlet` main region, footer, document title, and heading focus on location change.

### Feature Route Modules

Thin wrappers under `src/features/` own routes for later tickets. They currently render `RoutePlaceholder` only:

- `src/features/dashboard/routes/DashboardPage.tsx` (`/`, FEAT-11)
- `src/features/books/routes/BooksPage.tsx` (`/books`, FEAT-04)
- `src/features/books/routes/NewBookPage.tsx` (`/books/new`, FEAT-05)
- `src/features/books/routes/BookDetailsPage.tsx` (`/books/:bookId`, FEAT-04)
- `src/features/books/routes/EditBookPage.tsx` (`/books/:bookId/edit`, FEAT-10)
- `src/features/books/routes/DeletedBooksPage.tsx` (`/admin/deleted`, FEAT-10)
- `src/features/books/routes/BackupLibraryPage.tsx` (`/admin/backup`, FEAT-10)
- `src/features/loans/routes/CheckoutPage.tsx` (`/checkout`, FEAT-07)
- `src/features/loans/routes/CheckinPage.tsx` (`/checkin`, FEAT-08)
- `src/features/loans/routes/LoansPage.tsx` (`/loans`, FEAT-08)
- `src/features/settings/routes/ConnectionPage.tsx` (`/settings/connection`, FEAT-02)

### Shared Components

Import shared UI from `src/components/index.ts` rather than deep paths when writing application or feature code.

- `src/components/Alert.tsx`: Status alert; `error` uses `role="alert"`, other variants use `role="status"`.
- `src/components/AppLink.tsx`: React Router `Link` wrapper with optional visual variants.
- `src/components/Button.tsx`: Button primitive with `primary`, `secondary`, and `danger` variants.
- `src/components/ConfirmationDialog.tsx`: Modal confirmation dialog on the native `<dialog>` element, with labelled
  description, focus trap, Escape cancel, and focus restoration.
- `src/components/EmptyState.tsx`: Empty-content section with optional supporting text and action slot.
- `src/components/Field.tsx`: Labelled control wrapper that wires `id`, help text, and error associations.
- `src/components/LoadingState.tsx`: Polite live-region loading indicator.
- `src/components/Notifications.tsx`: `NotificationsProvider` and dismissible toast list (per-item live roles).
- `src/components/NotificationsContext.ts`: Notification types and React context.
- `src/components/useNotifications.ts`: Hook that reads the notifications context (throws outside the provider).
- `src/components/index.ts`: Barrel re-exports for the shared components and notifications API.

These components apply the class names defined in `src/styles/components.css`. Live route pages still use placeholders,
so most primitives are exercised by tests and ready for feature tickets rather than by product workflows.

### Styling

- `src/index.css`: Global CSS entrypoint imported by `src/main.tsx`. It imports all style layers in order.
- `src/styles/tokens.css`: Design tokens for typography, spacing, sizing, colors, borders, focus, shadows, and
  motion.
- `src/styles/base.css`: Element defaults and accessibility foundations, including box sizing, controls, links,
  focus visibility, page typography, skip links, and reduced motion.
- `src/styles/shell.css`: Application-frame classes for header, navigation, main content, footer, route pages, and
  responsive layouts.
- `src/styles/components.css`: Shared class-based primitives for buttons, links, forms, alerts, status views,
  dialogs, and notifications. They use BEM-like naming and are referenced by the shared component modules.

Choose the CSS layer based on responsibility:

- Shared values belong in `tokens.css`.
- HTML element defaults belong in `base.css`.
- Application frame and navigation layout belong in `shell.css`.
- Reusable UI patterns belong in `components.css`.
- Feature-specific styles may be colocated once feature modules gain real UI.

Preserve the import order in `src/index.css`: tokens, base, shell, components.

### Tests

- `src/App.test.tsx`: Document title and heading-focus behavior for client-side navigations via `createTestRouter`.
- `src/RootErrorBoundary.test.tsx`: Recoverable root error-boundary fallback.
- `src/layout/AppShell.test.tsx`: Landmarks, navigation labels, current-page state, and not-found recovery.
- `src/components/SharedState.test.tsx`: Field associations plus alert, loading, and empty-state semantics.
- `src/components/ConfirmationDialog.test.tsx`: Dialog labelling, focus, Escape, confirm, and restoration.
- `src/components/Notifications.test.tsx`: Live-region roles, dismissal, and provider hook usage.
- `src/test/setup.ts`: Global Vitest setup that installs jest-dom matchers for every test.

Tests use a jsdom browser simulation. Prefer semantic Testing Library queries such as `getByRole()` and test
user-visible behavior instead of implementation details. Route tests should use `createTestRouter` and must not
mutate `window.history` across cases.

The test flow is:

```text
yarn test
  -> Vitest reads vite.config.ts
  -> jsdom supplies browser APIs
  -> src/test/setup.ts installs shared matchers
  -> colocated *.test.tsx files render through Testing Library
```

### Dependencies and Commands

- `package.json`: Package metadata, Node and Yarn requirements, scripts, runtime dependencies, and development
  dependencies.
- `yarn.lock`: Yarn-generated exact dependency resolutions and checksums. Never edit it manually.
- `Makefile`: Stable wrappers around Yarn scripts for installation, development, checks, tests, and builds.
- `.nvmrc`: Exact Node.js version used by `nvm use`.
- `.yarnrc.yml`: Configures Yarn to use the `node_modules` linker instead of Plug'n'Play.

### Build, Type Checking, and Linting

- `vite.config.ts`: Shared Vite and Vitest configuration. Enables React, jsdom tests, and the global test setup.
- `eslint.config.js`: Flat ESLint configuration for TypeScript and React Hooks. It ignores generated directories
  and treats warnings as failures through the package script.
- `tsconfig.json`: TypeScript solution file that references the application and Node/tooling configurations.
- `tsconfig.app.json`: Strict browser and React type checking for `src/`. It includes Vite, Vitest, and jest-dom
  types and emits no files.
- `tsconfig.node.json`: Strict Node-side type checking for `vite.config.ts`. It emits no files.

### Repository Guidance

- `README.md`: Concise human onboarding for prerequisites, setup, development, checks, and production builds.
- `.gitignore`: Excludes dependencies, generated output, secrets, local data, editor files, and OS metadata.
- `.gitattributes`: Normalizes text files to LF line endings and marks common binary extensions.
- `.cursor/rules/documentation-style.mdc`: Markdown punctuation, line-length, and newline rules for Cursor.
- `.cursor/rules/grep-tool.mdc`: Requires `grep` rather than the `rg` shell command in this environment.
- `.cursor/rules/readonly-git.mdc`: Prohibits Cursor from changing Git state.
- `.cursor/rules/scope.mdc`: Defines allowed repository read/write boundaries and related Shade repositories.

The `.cursor` rules control AI-assisted work. They are not loaded by the application or included in builds.

Useful documents under `docs/` (not inventoried file-by-file here):

- `docs/tickets/FEAT-*.md`: Sequenced implementation tickets with acceptance criteria (FEAT-01 through FEAT-16).
- `docs/ToDo.md`: Human checklist of ticket completion status.
- `docs/product-docs/PLAN.md`: Frontend production roadmap.
- `docs/product-docs/PRODUCT_REQS.*.md`: Product requirements drafts and notes.
- `docs/technical-reference/API-for-FE.md`: Backend contract notes for the frontend.
- `docs/MAINTAINERS.md`: Human-oriented maintainer guide parallel to this file.
- `docs/prompt-master-context.md`: Slim context pack for chats without repository access.

## Development Commands

Initial setup:

```sh
nvm use
corepack enable
make install
```

Common commands:

- `make install`: Runs `yarn install --immutable`; fails when the manifest and lockfile disagree.
- `make run`: Starts the Vite development server with hot reloading.
- `make preview`: Serves an existing production build.
- `make lint`: Runs ESLint with zero warnings allowed.
- `make typecheck`: Runs TypeScript build mode across both TypeScript configurations.
- `make test`: Runs all Vitest tests once.
- `yarn test:watch`: Runs Vitest in watch mode during development.
- `make build`: Type-checks and writes an optimized application to `dist/`.
- `make check`: Runs lint, type checking, tests, and a production build.

`make check` currently performs type checking twice because `make build` also type-checks. This is expected.

The build flow is:

```text
make build
  -> yarn build
       -> tsc -b
            -> tsconfig.app.json
            -> tsconfig.node.json
       -> vite build
            -> follows imports from index.html and src/main.tsx
            -> writes dist/
```

## Implementation Conventions

- Keep TypeScript strict and avoid `any` unless an unavoidable boundary is documented.
- Prefer semantic HTML. Add ARIA only when native semantics cannot express the behavior.
- Preserve visible keyboard focus, 44-pixel control targets, and reduced-motion support.
- Reuse design tokens and existing shared CSS classes before adding new values or primitives.
- Shared CSS follows `.component`, `.component__element`, and `.component--modifier` naming.
- Import global CSS once through `src/index.css`; do not scatter global imports across components.
- Import shared components from `src/components/index.ts`.
- Colocate component tests using `*.test.tsx`.
- Use extensionless relative TypeScript imports, matching current source style.
- Follow the existing TypeScript style: single quotes, no semicolons, and trailing commas where supported.
- Keep feature UI behind the existing `src/features/*/routes/` ownership; replace placeholders when a ticket owns that
  route rather than inventing a parallel tree.
- Introduce runtime config, connection state, API, and server-state patterns only when FEAT-02 / FEAT-03 (or a later
  concrete ticket) requires them.
- Prefer product-domain names over vague folders such as `helpers` or `misc`.

## Change Workflow

1. Inspect the relevant source, tests, configuration, and current working tree.
2. Identify the smallest complete change and any behavior that requires a test.
3. Implement without modifying unrelated work.
4. Run focused tests or checks while iterating.
5. Run `make check` when proportionate to the change.
6. Review the final diff for correctness, accidental generated files, secrets, and stale documentation.
7. Report changed files, verification performed, and any remaining uncertainty.

If a new file, command, dependency, architecture pattern, or runtime flow is introduced, update this context so the
next fresh chat does not begin with stale assumptions.
