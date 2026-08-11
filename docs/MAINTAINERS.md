# Maintainer Guide

This guide is for engineers maintaining the Shade frontend, especially engineers who are still learning the
project and its tools. It explains how the application starts, where code belongs, how the files work together,
and how to check a change before sharing it.

## Start Here

Shade is a React single-page application built with TypeScript and Vite. The project is still early: React Router
is mounted and several placeholder routes render, while shared UI primitives and an application shell exist as
source that is not yet fully composed into the live tree. API integration and product workflows come later.

The implementation sequence starts with `docs/tickets/FEAT-01_application-shell-and-shared-ui.md`. Broader delivery
planning lives in `docs/product-docs/PLAN.md`.

The most useful commands are:

```sh
nvm use
corepack enable
make install
make run
```

`make run` starts the local development server. Before considering a change complete, run:

```sh
make check
```

This command runs linting, type checking, tests, and a production build. Running it locally catches many common
problems before code review or continuous integration.

## How the Application Works

The browser follows this path when it loads the application:

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

`index.html` creates an empty element with the ID `root`. `src/main.tsx` finds that element and asks React to
render the router inside it. Each matched route currently renders a placeholder page that updates
`document.title`. The CSS entrypoint loads the styling layers in order so that shared variables and defaults are
available to later rules.

Vite handles the development server and production bundling. TypeScript checks the code but does not create
JavaScript files itself; Vite performs that transformation during development and builds.

Current gaps relative to the FEAT-01 target:

- `src/layout/AppShell.tsx` is not yet used as the router layout, so navigation chrome is not visible.
- Shared components under `src/components/` are implemented but unused by the live pages.
- Several planned routes (checkout, check-in, admin, connection settings) are not registered yet.
- `src/App.tsx` remains as a leftover welcome page and is not mounted by `src/main.tsx`.
- There is still no API client, shared server state, or feature workflow UI.

## Project Structure

The summaries below cover every project-owned file outside `docs/`. Generated directories such as
`node_modules/`, `dist/`, and `coverage/` are intentionally omitted because tools recreate them.

### Application Files

- `index.html`: The browser entrypoint. It defines page metadata, creates the `root` element, and loads
  `src/main.tsx`.
- `src/main.tsx`: The React bootstrap file. It imports the router and the global CSS entrypoint, verifies that the
  `root` element exists, and mounts `RouterProvider` in React `StrictMode`.
- `src/App.tsx`: A leftover welcome-page component. Tests still cover it, but the live application no longer
  renders it.
- `src/vite-env.d.ts`: Adds Vite's browser and asset types to TypeScript. It contains declarations, not runtime
  behavior.

### Routing and Layout

- `src/routes/routeMetadata.ts`: Central path, title, and heading metadata for registered routes.
- `src/routes/routes.tsx`: Builds the browser router. Placeholder pages set `document.title` from the route title
  plus an em dash and ` Shade`. Registered paths today are `/`, `/books`, `/books/:bookId`, `/books/new`,
  `/loans`, and `*` for unknown URLs.
- `src/layout/AppShell.tsx`: Intended shell with skip link, brand link, primary navigation, main `Outlet`, footer,
  and focus movement to the page `h1` after client-side navigations. Wire this in as a parent route layout when
  completing FEAT-01.

### Shared Components

These modules live under `src/components/` and re-export from `src/components/index.tsx`:

- `Alert`: Status message with info, success, warning, and error variants.
- `AppLink`: Styled React Router link.
- `Button`: Primary, secondary, and danger button styles.
- `ConfirmationDialog`: Native modal dialog for confirm/cancel flows.
- `EmptyState`: Empty-content section with optional action.
- `Field`: Label, help text, and error wiring around a single control.
- `LoadingState`: Accessible loading indicator.
- `NotificationsProvider` / `useNotifications`: Toast-style notifications with dismiss actions.

`src/components/index.ts` exists but is empty; import from the `.tsx` barrel or individual modules. The components
use classes from `src/styles/components.css`, but no route currently renders them.

### Styles

- `src/index.css`: The only global CSS entrypoint imported by JavaScript. It loads the style layers in the required
  order: tokens, base, shell, then components.
- `src/styles/tokens.css`: Defines reusable design values as CSS custom properties, including colors, spacing,
  typography, focus styles, shadows, and motion duration. Put shared visual values here instead of repeating
  literals.
- `src/styles/base.css`: Defines element-level defaults and accessibility foundations, such as box sizing,
  typography, focus visibility, minimum control sizes, and reduced-motion behavior. It depends on tokens.
- `src/styles/shell.css`: Defines the intended page frame, including header, navigation, content, footer, route
  layouts, and responsive behavior. The shell stylesheet is ready for `AppShell` once that layout is mounted.
- `src/styles/components.css`: Defines reusable class-based styles for buttons, links, form fields, alerts, loading
  and empty states, dialogs, and notifications.

When adding a style, first decide its scope:

- A reusable value belongs in `tokens.css`.
- A default for an HTML element belongs in `base.css`.
- Page-frame or navigation layout belongs in `shell.css`.
- A reusable UI pattern belongs in `components.css`.
- A feature-specific style can live near that feature once feature modules are introduced.

Keep the import order in `src/index.css`. Later layers rely on variables and defaults from earlier layers.

### Tests

- `src/App.test.tsx`: The test for the leftover `App` welcome component. It does not cover routing or the shell.
  Expect this to be replaced or expanded as FEAT-01 finishes.
- `src/test/setup.ts`: Runs before every test and adds `jest-dom` matchers, such as `toBeInTheDocument()`, to
  Vitest.

Vitest discovers files named `*.test.ts` or `*.test.tsx`. Keep a component test near its component when practical.
Prefer queries that reflect how a user or assistive technology finds an element, such as `getByRole()`.

The test flow is:

```text
yarn test
  -> Vitest reads vite.config.ts
  -> jsdom provides a browser-like document
  -> src/test/setup.ts installs shared matchers
  -> src/App.test.tsx renders src/App.tsx
```

### Package and Command Files

- `package.json`: Describes the package, required Node and Yarn versions, commands, runtime dependencies, and
  development dependencies. Add or remove packages with Yarn so this file and the lockfile stay synchronized.
- `yarn.lock`: Records exact dependency resolutions for repeatable installs. Yarn generates this file; do not edit
  it by hand.
- `Makefile`: Provides short, consistent wrappers around Yarn commands. For example, `make run` calls `yarn dev`,
  and `make check` calls `yarn check`.
- `.nvmrc`: Pins the project's Node.js version. `nvm use` reads this file.
- `.yarnrc.yml`: Configures Yarn to install packages into `node_modules/` rather than use Plug'n'Play.

The available commands are:

- `make install`: Installs the exact locked dependencies. It fails if `package.json` and `yarn.lock` disagree.
- `make run`: Starts Vite's development server with hot reloading.
- `make preview`: Serves an existing production build locally.
- `make lint`: Checks code with ESLint and treats warnings as failures.
- `make typecheck`: Checks application and tooling TypeScript.
- `make test`: Runs the test suite once.
- `make build`: Type-checks and creates the optimized `dist/` output.
- `make check`: Runs linting, type checking, tests, and the production build.

`make check` currently type-checks twice: once directly and once as part of the build command. This is redundant,
but it is expected behavior rather than a failure.

### Runtime connection, CORS, and token limits

Runtime configuration lives in `public/config.js` as `window.__SHADE_CONFIG__` (`apiBaseUrl`, `release`). The
Bearer token is never part of that file. Users enter the token on the connection screen; the app keeps it in memory
and `sessionStorage` for the tab. `sessionStorage` limits persistence across tabs and restarts, but it does not
protect the token from a browser user or same-origin script. Never put a token in source, runtime config, build
arguments, generated assets, source maps, URLs, logs, diagnostics, snapshots, or error reports.

Local API access:

- Default: keep `apiBaseUrl` pointed at the backend (for example `http://127.0.0.1:8000`). The backend allows the
  Vite origins `http://localhost:5173` and `http://127.0.0.1:5173`.
- Optional same-origin proxy: set `apiBaseUrl` to the Vite origin and start with `SHADE_API_PROXY=1`
  (`SHADE_API_PROXY_TARGET` defaults to `http://127.0.0.1:8000`).

Cross-origin production requests may send `Authorization` and `Content-Type`. Cookies and credentialed CORS are not
used. Frontend JavaScript may read the exposed backup `Content-Disposition` filename.

Production connectivity remains a release blocker until one arrangement is chosen and verified:

- Exact frontend origin (scheme, hostname, port; no path or trailing slash) in backend `CORS_ORIGINS`, or
- A deployment-managed same-origin reverse proxy.

Verification must cover authenticated requests, browser preflights, and JavaScript access to the backup
`Content-Disposition` filename. See also `README.md` and `docs/technical-reference/API-for-FE.md`.

`scripts/productionBuildTokenInspection.test.ts` builds with source maps and fails if known test or placeholder
tokens appear in production assets or maps.

### Build, TypeScript, and Lint Configuration

- `vite.config.ts`: Configures Vite's React support and Vitest's `jsdom` environment and setup file. Both the
  development server and test runner read it.
- `eslint.config.js`: Defines lint rules for TypeScript and React, including React Hooks and Vite fast-refresh
  rules. It ignores generated output and fails the lint command on warnings.
- `tsconfig.json`: The top-level TypeScript project file. It points `tsc -b` to the application and tooling
  configurations instead of checking files itself.
- `tsconfig.app.json`: Strictly type-checks files under `src/` with DOM, Vite, Vitest, and React support. It emits no
  files.
- `tsconfig.node.json`: Strictly type-checks the Node-based Vite configuration separately from browser code. It
  also emits no files.

The production build follows this path:

```text
make build
  -> yarn build
       -> TypeScript checks tsconfig.app.json and tsconfig.node.json
       -> Vite follows imports from index.html and src/main.tsx
       -> Vite writes optimized files to dist/
```

### Repository and Contributor Files

- `README.md`: Provides the shortest setup, development, quality-check, and build instructions. Keep it concise;
  put deeper maintenance guidance in this file.
- `.gitignore`: Prevents generated output, dependencies, local settings, secrets, databases, and operating-system
  files from being tracked.
- `.gitattributes`: Keeps text files checked out with LF endings and marks common binary file types.
- `.cursor/rules/documentation-style.mdc`: Defines writing and formatting rules for documentation created with
  Cursor.
- `.cursor/rules/grep-tool.mdc`: Records the project's text-search tooling requirement for Cursor.
- `.cursor/rules/readonly-git.mdc`: Restricts Git mutations performed through Cursor.
- `.cursor/rules/scope.mdc`: Defines which related Shade repositories Cursor may read and where it may write.

The `.cursor` files guide AI-assisted development. They do not become part of the browser application or
production build.

When you need product or ticket detail, start with:

- `docs/tickets/` for the current feature ticket and acceptance criteria.
- `docs/product-docs/PLAN.md` for the overall frontend roadmap.
- `docs/technical-reference/API-for-FE.md` for backend contract notes once API work begins.
- `docs/AGENTS.md` for the LLM-oriented twin of this guide.

## Making a Change Safely

Use this general workflow:

1. Read the nearby implementation and tests before editing.
2. Make the smallest change that fully solves the problem.
3. Add or update a test for behavior that changed.
4. Run the focused test while working, using `yarn test:watch` if helpful.
5. Run `make check` before handing off the change.
6. Review the changed files and confirm that generated output and secrets are not included.

Some failures point to different kinds of problems:

- A lint failure usually means the code violates a style or React correctness rule.
- A type-check failure means TypeScript cannot prove that values are being used safely.
- A test failure means observed behavior no longer matches an expectation.
- A build failure means Vite could not create the production application, even if earlier checks passed.

Do not silence a check without understanding it. If a rule appears wrong for a situation, ask another maintainer
before disabling it.

## Project Conventions

- Use the Node and Yarn versions declared by the repository.
- Use Yarn rather than npm, and do not edit `yarn.lock` manually.
- Keep TypeScript strict. Avoid `any` unless there is a documented, unavoidable reason.
- Use semantic HTML before adding ARIA attributes.
- Preserve visible keyboard focus, minimum control sizes, and reduced-motion behavior.
- Write tests around user-visible behavior instead of component implementation details.
- Use existing design tokens and shared component classes before creating duplicates.
- Use BEM-like names for shared CSS: `.component`, `.component__element`, and `.component--modifier`.
- Keep global CSS imports in `src/index.css`, which is imported once by `src/main.tsx`.
- Do not commit `node_modules/`, `dist/`, `coverage/`, local databases, or secret files.
- Update this guide when adding, removing, or significantly changing project files or development workflows.

## When Adding New Architecture

The project is intentionally still assembling its first shell. Prefer completing FEAT-01 routing, layout, and shared
UI composition before inventing parallel patterns. New API, server-state, or feature-directory patterns should solve
a concrete ticket rather than anticipate one. When introducing a new pattern:

1. Keep its first use small and understandable.
2. Choose names that describe product concepts, not vague technical categories.
3. Document how data enters, changes within, and leaves the new module.
4. Add tests at the level where behavior can be observed reliably.
5. Update the project structure and interaction diagrams in this guide.

If a change affects the product's intended behavior, consult the requirements in `docs/` and keep the
implementation, tests, and documentation consistent.
