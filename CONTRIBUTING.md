# Contributing to Shade

Thanks for helping improve Shade. This guide covers the frontend development workflow.

## Prerequisites

- Node.js 26.7.0 (see [`.nvmrc`](.nvmrc))
- Corepack, which provides the pinned Yarn 4.18.0 release
- GNU Make
- A compatible Shade backend when working in the running application
- Podman only when building the Compose-oriented development image

Install Playwright Chromium and its Linux dependencies before running the complete browser suite:

```sh
yarn playwright install --with-deps chromium
```

## Set up the workspace

```sh
nvm use
corepack enable
make install
```

Normal frontend development starts in viewer mode and does not need a frontend API secret. Use the application Log in control with a backend administrator password when testing protected screens or mutations.

## Run locally

The tracked runtime-config template uses the same-origin `/api` path. Start Vite with its tenant-aware proxy when your backend is listening at `http://127.0.0.1:8000`:

```sh
SHADE_API_PROXY=1 make run
```

Open `http://localhost:5173`. The backend's private `CORS_ORIGINS` must include
the frontend origin when the browser talks to it directly. To target a different
local backend, set `SHADE_API_PROXY_TARGET`:

```sh
SHADE_API_PROXY=1 SHADE_API_PROXY_TARGET=http://127.0.0.1:9000 make run
```

The proxy supplies the trusted forwarding context expected by the backend. Browser code must not send proxy-owned headers. `make run` is a host Vite workflow with hot reload; it does not use Podman.

## Validate changes

| Command | Purpose |
| --- | --- |
| `make lint` | Run ESLint with warnings treated as failures. |
| `make typecheck` | Run the TypeScript project check. |
| `make test` | Run the Vitest suite. |
| `make build` | Type-check and produce the optimized `dist/` build. |
| `make bundle-check` | Check the production entry gzip budget after a build. |
| `make check` | Run the complete local and CI quality gate. |

Run `make check` before opening a pull request. It runs linting, type checking, generated OpenAPI type drift checks, Vitest coverage, Playwright and accessibility tests, a production build, and the bundle-size check. Current global coverage thresholds are 20% for statements, branches, functions, and lines.

Browser tests use mocked API responses and do not require a running backend. GitHub Actions runs `make check` for pull requests and pushes to `main`.

## API types

The checked-in OpenAPI document is the source for generated frontend types. After intentionally changing it, regenerate types with:

```sh
yarn api:generate
```

Include the resulting change to `src/api/generated/openapi.ts` in the same commit. `make check` verifies that generation is up to date.

## Container and release workflows

`make ci` builds the Compose-oriented nginx image. It serves a host-built `dist/` directory and does not run Node, Yarn, Vite, or hot reload in the container.

`make publish` creates a versioned static release tarball and checksum under gitignored `ci/artifacts/`. The deployment environment owns TLS, reverse proxying, runtime configuration, installation, rollback, and production health checks.

## Keep local data local

Do not commit credentials, passwords, API tokens, `.env` files, deployment-specific configuration, release artifacts, databases, backups, diagnostics, coverage output, or Playwright output. Check your work before committing:

```sh
git status --short
```
