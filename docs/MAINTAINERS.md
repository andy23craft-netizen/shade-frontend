# Maintainer Guide

This guide is for engineers maintaining the Shade frontend, especially engineers who are still learning the
project and its tools. It explains how the application starts, where code belongs, how the files work together,
and how to check a change before sharing it.

## Start Here

Shade is a React single-page application built with TypeScript and Vite. The project is currently small: the
browser renders one root component, while the styles provide a foundation for future pages and reusable UI.

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
       -> src/App.tsx
       -> src/index.css
            -> src/styles/tokens.css
            -> src/styles/base.css
            -> src/styles/shell.css
            -> src/styles/components.css
```

`index.html` creates an empty element with the ID `root`. `src/main.tsx` finds that element and asks React to
render `App` inside it. `App` supplies the visible page content. The CSS entrypoint loads the styling layers in
order so that shared variables and defaults are available to later rules.

Vite handles the development server and production bundling. TypeScript checks the code but does not create
JavaScript files itself; Vite performs that transformation during development and builds.

The project does not yet have routing, API calls, shared application state, or feature modules. React Router is
installed, but no source file currently uses it.

## Project Structure

The summaries below cover every project-owned file outside `docs/`. Generated directories such as
`node_modules/`, `dist/`, and `coverage/` are intentionally omitted because tools recreate them.

### Application Files

- `index.html`: The browser entrypoint. It defines page metadata, creates the `root` element, and loads
  `src/main.tsx`.
- `src/main.tsx`: The React bootstrap file. It imports `App` and the global CSS entrypoint, verifies that the
  `root` element exists, and mounts the application in React `StrictMode`.
- `src/App.tsx`: The root React component and current visible page. As the application grows, it will likely
  coordinate routing or a top-level application shell rather than contain every feature directly.
- `src/vite-env.d.ts`: Adds Vite's browser and asset types to TypeScript. It contains declarations, not runtime
  behavior.

### Styles

- `src/index.css`: The only global CSS entrypoint imported by JavaScript. It loads the style layers in the required
  order: tokens, base, shell, then components.
- `src/styles/tokens.css`: Defines reusable design values as CSS custom properties, including colors, spacing,
  typography, focus styles, shadows, and motion duration. Put shared visual values here instead of repeating
  literals.
- `src/styles/base.css`: Defines element-level defaults and accessibility foundations, such as box sizing,
  typography, focus visibility, minimum control sizes, and reduced-motion behavior. It depends on tokens.
- `src/styles/shell.css`: Defines the intended page frame, including header, navigation, content, footer, route
  layouts, and responsive behavior. Only part of this stylesheet is used by the current `App`.
- `src/styles/components.css`: Defines reusable class-based styles for buttons, links, form fields, alerts, loading
  and empty states, dialogs, and notifications. These classes are shared building blocks and are not yet used by
  the current JSX.

When adding a style, first decide its scope:

- A reusable value belongs in `tokens.css`.
- A default for an HTML element belongs in `base.css`.
- Page-frame or navigation layout belongs in `shell.css`.
- A reusable UI pattern belongs in `components.css`.
- A feature-specific style can live near that feature once feature modules are introduced.

Keep the import order in `src/index.css`. Later layers rely on variables and defaults from earlier layers.

### Tests

- `src/App.test.tsx`: The test for the root component. It renders `App` with Testing Library and checks the main
  heading through its accessible role and name.
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
- `.cursor/rules/documentation-style.mdc`: Defines writing and formatting rules for documentation created with
  Cursor.
- `.cursor/rules/grep-tool.mdc`: Records the project's text-search tooling requirement for Cursor.
- `.cursor/rules/readonly-git.mdc`: Restricts Git mutations performed through Cursor.
- `.cursor/rules/scope.mdc`: Defines which related Shade repositories Cursor may read and where it may write.

The `.cursor` files guide AI-assisted development. They do not become part of the browser application or
production build.

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

The project is intentionally simple today. New routing, API, state-management, or feature-directory patterns
should solve a concrete requirement rather than anticipate one. When introducing a new pattern:

1. Keep its first use small and understandable.
2. Choose names that describe product concepts, not vague technical categories.
3. Document how data enters, changes within, and leaves the new module.
4. Add tests at the level where behavior can be observed reliably.
5. Update the project structure and interaction diagrams in this guide.

If a change affects the product's intended behavior, consult the requirements in `docs/` and keep the
implementation, tests, and documentation consistent.
