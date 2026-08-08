# FEAT-01: Stand Up the Frontend Shell

## Summary

Create a minimal, production-oriented frontend scaffold and render a simple “Hello, world!” page. This ticket
establishes the files, folders, commands, and quality checks that later library-management features will build on.

## Context

The project documentation defines the frontend stack as:

- TypeScript
- React
- Node.js
- Yarn
- Vite

The build must be invokable through Make, with Make primarily delegating to Yarn commands. No library-management
workflows or backend integration are part of this ticket.

## Scope

- Bootstrap a Vite React application using TypeScript.
- Add a minimal accessible page that confirms the application is running.
- Establish development, build, preview, lint, type-check, and test commands.
- Add one smoke test for the page.
- Document local setup and common commands.
- Add only the directory structure needed by this shell.

## Out of Scope

- Dashboard, book management, checkout, check-in, reading tracking, or admin UI.
- Routing or navigation.
- Backend API calls, authentication, or bearer-token handling.
- State-management and data-fetching libraries.
- Component libraries or a design system.
- Container packaging, tarball creation, Ansible deployment, or systemd configuration.
- CI/CD workflow configuration. The commands added here should be suitable for a later CI/CD ticket.

## Technical Decisions

Use the following pinned toolchain versions:

- Use Node.js 20.19.2 and record it in `.nvmrc`.
- Use Yarn 4.1.0 and pin it with the `packageManager` field in `package.json` so Corepack can reproduce the toolchain.

For versions not otherwise specified by the project:

- Use the latest mutually compatible stable releases of React, TypeScript, and Vite.
- Use Yarn's `node-modules` linker for broad IDE and tooling compatibility.
- Use strict TypeScript settings and do not allow emitted JavaScript during type-checking.
- Use ESLint's current flat configuration format with TypeScript and React rules.
- Use Vitest, React Testing Library, `@testing-library/jest-dom`, and jsdom for component tests.
- Keep styling in plain CSS. A CSS framework is unnecessary for the initial shell.
- Do not add routing, global state, API, or UI dependencies until a feature requires them.

All dependency versions must be selected through Yarn and captured in the generated lockfile; do not hand-author
`yarn.lock`.

## Files and Changes

### Root toolchain and application files

#### `package.json` — add

- Mark the package as private.
- Set an appropriate package name such as `shade-frontend`.
- Pin Yarn through `packageManager`.
- Declare the supported Node.js version in `engines`.
- Add scripts:
  - `dev`: start the Vite development server.
  - `build`: type-check and produce the Vite production build.
  - `preview`: serve the production build locally.
  - `lint`: run ESLint with warnings treated as failures.
  - `typecheck`: run TypeScript without emitting files.
  - `test`: run Vitest once for automation.
  - `test:watch`: run Vitest in watch mode for local development.
  - `check`: run lint, type-check, tests, and build.
- Add React and React DOM as runtime dependencies.
- Add Vite, TypeScript, ESLint and its React/TypeScript integrations, Vitest, jsdom, and Testing Library packages as
  development dependencies.

#### `yarn.lock` — generate

- Generate and commit the lockfile by running Yarn after `package.json` is defined.
- Ensure a clean install resolves entirely from this lockfile.

#### `.yarnrc.yml` — add

- Configure Yarn to use the `node-modules` linker.
- Do not place credentials or registry tokens in this file.

#### `.nvmrc` — add

- Pin the active Node.js LTS version selected for the project.
- Keep this version consistent with `package.json#engines`.

#### `index.html` — add

- Provide Vite's HTML entry point.
- Include standard UTF-8, responsive viewport, and application title metadata.
- Include only the root mount element and the module script for `/src/main.tsx`.

#### `vite.config.ts` — add

- Configure Vite with the official React plugin.
- Include Vitest configuration for a jsdom environment and the test setup file.
- Keep hostnames, ports, API URLs, and deployment-specific settings out of the initial configuration.

### TypeScript configuration

#### `tsconfig.json` — add

- Define the top-level TypeScript project references for application and tooling code.

#### `tsconfig.app.json` — add

- Configure strict checking for browser application and test files.
- Use modern browser libraries and JSX settings compatible with React and Vite.
- Set `noEmit`.
- Include `src`.

#### `tsconfig.node.json` — add

- Configure strict checking for Node-based configuration files such as `vite.config.ts`.
- Set `noEmit`.
- Include the relevant root configuration files.

### Linting

#### `eslint.config.js` — add

- Use ESLint's flat configuration.
- Apply recommended JavaScript, TypeScript, React Hooks, and React Refresh rules to TypeScript source files.
- Ignore generated and dependency directories, including `dist`, `coverage`, and `node_modules`.
- Keep the configuration focused on correctness; defer opinionated formatting rules until a formatter is intentionally
  adopted.

### Application source

#### `src/main.tsx` — add

- Import the global stylesheet.
- Mount the React application into the `root` element.
- Wrap the application in `React.StrictMode`.
- Fail clearly if the expected root element is absent rather than relying on an unchecked non-null assertion.

#### `src/App.tsx` — add

- Export the root application component.
- Render semantic `main` content with a visible `h1` containing “Hello, world!”.
- Include a short description identifying this as the Shade library frontend.
- Keep the component static and free of feature logic.

#### `src/index.css` — add

- Add a minimal global reset and sensible defaults for font rendering, colors, spacing, and responsive sizing.
- Style the shell so the message is readable at narrow and wide viewport widths.
- Respect user preferences; do not disable zoom, focus indicators, or motion settings.

#### `src/vite-env.d.ts` — add

- Include Vite's client type declarations.

### Test setup

#### `src/test/setup.ts` — add

- Load the `jest-dom` matchers used by component tests.
- Keep global test setup minimal.

#### `src/App.test.tsx` — add

- Render `App` with React Testing Library.
- Assert that the “Hello, world!” heading is present and accessible by its heading role.
- Avoid snapshots for this simple behavior.

### Build interface

#### `Makefile` — add

- Declare phony targets.
- Provide at least:
  - `install` → `yarn install --immutable`
  - `dev` → `yarn dev`
  - `lint` → `yarn lint`
  - `typecheck` → `yarn typecheck`
  - `test` → `yarn test`
  - `build` → `yarn build`
  - `check` → `yarn check`
- Keep Make as a thin, cross-environment command interface; application logic belongs in package scripts.

### Repository documentation and ignores

#### `.gitignore` — modify

- Preserve all existing entries.
- Add Node/Yarn and frontend-generated paths:
  - `node_modules/`
  - `.yarn/` while explicitly retaining any repository-managed Yarn files if the selected Yarn setup creates them
  - `dist/`
  - `coverage/`
  - Vite cache or local files
  - local environment files such as `.env.local` and `.env.*.local`
- Do not ignore `yarn.lock`.

#### `README.md` — modify

- Preserve the project name and clarify that this repository contains the library application's frontend.
- Document prerequisites: the pinned Node.js version, Corepack, Yarn, and Make.
- Add setup instructions using `corepack enable` and `make install`.
- Document `make dev`, `make check`, and `make build`.
- State that production output is written to `dist/`.
- Do not document backend configuration until API integration is implemented.

## Expected File Tree

```text
.
├── .gitignore
├── .nvmrc
├── .yarnrc.yml
├── Makefile
├── README.md
├── eslint.config.js
├── index.html
├── package.json
├── src
│   ├── App.test.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── test
│   │   └── setup.ts
│   └── vite-env.d.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── yarn.lock
```

## Acceptance Criteria

- A fresh checkout can be installed with `make install` using the pinned Node/Yarn toolchain.
- `make dev` starts the Vite development server without errors.
- Opening the development URL displays an accessible “Hello, world!” heading and the Shade frontend description.
- The page remains readable on mobile and desktop viewport widths.
- `make lint` completes with no errors or warnings.
- `make typecheck` completes with no TypeScript errors.
- `make test` passes the application smoke test.
- `make build` creates an optimized static site in `dist/`.
- `make check` runs the complete local quality gate successfully.
- No secrets, generated dependencies, build output, coverage output, or local environment files are committed.
- No out-of-scope product behavior or premature framework dependencies are introduced.

## Implementation Verification

From a clean working tree:

1. Activate the Node.js version in `.nvmrc` and enable Corepack.
2. Remove any existing generated dependency/build directories.
3. Run `make install`.
4. Run `make check`.
5. Run `make dev` and manually verify the page in a browser at both narrow and wide viewport sizes.
