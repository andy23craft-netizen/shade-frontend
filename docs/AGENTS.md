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

The implementation is an early React application mid-way through the application-shell ticket
(`docs/tickets/FEAT-01_application-shell-and-shared-ui.md`). React Router is integrated and several placeholder
routes render. Shared UI primitives and an `AppShell` layout exist as source files, but the shell, notifications
provider, and most shell behaviors are not yet composed into the live route tree. There is still no API
integration, typed client, server state, persistence, or feature workflow UI.

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
- Yarn 4 through Corepack
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
       -> RouterProvider(router from src/routes/routes.tsx)
       -> src/index.css
            -> src/styles/tokens.css
            -> src/styles/base.css
            -> src/styles/shell.css
            -> src/styles/components.css
```

`index.html` creates the `#root` mount point and loads `src/main.tsx`. The bootstrap module imports the router and
global stylesheet, validates the mount point, and renders `RouterProvider` in `StrictMode`.

`src/App.tsx` still exports a welcome page, but it is not mounted by `src/main.tsx`. `src/layout/AppShell.tsx` and
the shared components under `src/components/` are present but not yet wired into the router tree.

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
  `RouterProvider` in `StrictMode`.
- `src/App.tsx`: Legacy welcome-page component. It is covered by `src/App.test.tsx` but is not used by the current
  bootstrap path.
- `src/vite-env.d.ts`: Adds Vite client and asset declarations to TypeScript. It has no runtime behavior.

### Routing and Layout

- `src/routes/routeMetadata.ts`: Path, document-title fragment, and heading metadata for the currently registered
  routes.
- `src/routes/routes.tsx`: `createBrowserRouter` configuration. Placeholder pages set `document.title` from the
  route title plus an em dash and ` Shade`. Currently registered paths are `/`, `/books`, `/books/:bookId`,
  `/books/new`, `/loans`, and `*` (not found). Checkout, check-in, admin, and connection-settings routes from
  FEAT-01 are not registered yet.
- `src/layout/AppShell.tsx`: Intended application frame with skip link, header, primary navigation, `Outlet` main
  region, footer, and heading focus on location change. It is not yet used as a router layout element.

### Shared Components

- `src/components/Alert.tsx`: Status alert with `info`, `success`, `warning`, and `error` variants.
- `src/components/AppLink.tsx`: React Router `Link` wrapper with optional visual variants.
- `src/components/Button.tsx`: Button primitive with `primary`, `secondary`, and `danger` variants.
- `src/components/ConfirmationDialog.tsx`: Modal confirmation dialog built on the native `<dialog>` element.
- `src/components/EmptyState.tsx`: Empty-content section with optional supporting text and action slot.
- `src/components/Field.tsx`: Labelled control wrapper that wires `id`, help text, and error associations.
- `src/components/LoadingState.tsx`: Polite live-region loading indicator.
- `src/components/Notifications.tsx`: `NotificationsProvider` and `useNotifications` for dismissible toasts.
- `src/components/index.tsx`: Barrel re-exports for the shared components.
- `src/components/index.ts`: Empty companion file; the active barrel is `index.tsx`.

These components apply the class names defined in `src/styles/components.css`. They are not yet consumed by the live
route pages or shell.

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
- Feature-specific styles may be colocated once feature modules exist.

Preserve the import order in `src/index.css`: tokens, base, shell, components.

### Tests

- `src/App.test.tsx`: Colocated component test for the unused `App` welcome page. It does not exercise the router or
  shell.
- `src/test/setup.ts`: Global Vitest setup that installs jest-dom matchers for every test.

Tests use a jsdom browser simulation. Prefer semantic Testing Library queries such as `getByRole()` and test
user-visible behavior instead of implementation details.

The test flow is:

```text
yarn test
  -> Vitest reads vite.config.ts
  -> jsdom supplies browser APIs
  -> src/test/setup.ts installs shared matchers
  -> src/App.test.tsx renders src/App.tsx
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

- `docs/tickets/FEAT-*.md`: Sequenced implementation tickets with acceptance criteria.
- `docs/product-docs/PLAN.md`: Frontend production roadmap.
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
- Colocate component tests using `*.test.tsx`.
- Use extensionless relative TypeScript imports, matching current source style.
- Follow the existing TypeScript style: single quotes, no semicolons, and trailing commas where supported.
- Finish or extend the FEAT-01 shell, routing, and shared-UI work before inventing alternate architecture.
- Introduce API, server-state, or feature-module patterns only when a concrete ticket requires them.
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
