# FEAT-15 -- Podman development and preview

## Objective

Provide a reproducible Podman-compatible environment for local development and production-build previews.

## Dependencies

FEAT-14 is complete. Reuse the existing `make check` gate (`yarn check`: lint, type-check, OpenAPI drift check, Vitest
with V8 coverage, Playwright, production build, bundle-size check), dummy `VITE_API_SECRET_KEY` for CI-style builds, and
host `make run` / `make preview` / `make build` commands. Do not reinvent those suites or replace the host Make targets.
Packaging the same workflows in a Podman image is this ticket; versioned release tarballs remain FEAT-16. Do not pull
FEAT-16 through FEAT-21 product or packaging work into FEAT-15.

## Runtime and contract facts for this ticket

Treat these as complementary, not interchangeable:

- `public/config.js` -- public runtime config assigned to `window.__SHADE_CONFIG__`: `apiBaseUrl` and optional
  `diagnostics: { enabled, endpoint }`. Not bundled. Omitted diagnostics default to disabled / null endpoint.
- `package.json` `version` -- canonical application release (`APP_VERSION`, footer `Release` label). Injected at Vite
  dev-server and production-build time. It is **not** a runtime-config field; do not put `release` back into
  `config.js`.
- Repository-root `.env` (`VITE_API_SECRET_KEY`) -- gitignored Bearer token. Vite injects it at dev-server and
  production-build time. `.env.example` is the committed template.
- `../technical-reference/API-for-FE.md` -- default API CORS allows only `http://localhost:5173` and
  `http://127.0.0.1:5173`. A container-published origin must match an allowed exact origin, use the optional
  `SHADE_API_PROXY=1` same-origin proxy, or rely on operator-updated backend `CORS_ORIGINS`. Do not invent credentialed
  CORS.

### What the image must keep equivalent

- Development mode supports the normal repository workflow (`yarn dev` / `make run` behavior: Vite, hot reload,
  fail-fast missing token, `public/config.js`).
- Preview mode serves the same optimized `dist/` assets produced by `make build` / `yarn build` (not a second bundler).
  SPA fallback must cover every registered product path (see Current baseline). Preview cache behavior: revalidate
  `index.html` and `config.js`; hashed assets under `dist/assets/` may be long-lived.
- Changing `apiBaseUrl` or optional diagnostics at container start must not require an image rebuild. Changing
  application release requires a rebuild because `APP_VERSION` comes from `package.json` at Vite time.

## Current baseline

Already in place and should be reused (not rebuilt):

- Host quality gate and CI: `make check` / `.github/workflows/check.yml` (FEAT-14 complete).
- Host commands: `make run` (Vite dev), `make build` (`dist/`), `make preview` (`yarn preview` of an existing production
  build), `make install` (`yarn install --immutable`).
- Pinned toolchain: Node 26.7.0 (`.nvmrc` / `package.json` `engines`), Yarn 4.18.0 (`packageManager`), Corepack.
- Runtime config: `public/config.js` (`apiBaseUrl`, optional `diagnostics`). Application release from `package.json` via
  Vite `define` in `vite.config.ts`.
- Auth: gitignored `.env` with `VITE_API_SECRET_KEY`; `readApiToken()` fail-fast; dummy `test-api-token` is for CI only,
  not a substitute for operator `.env` in a real local/preview container.
- Optional same-origin proxy: `SHADE_API_PROXY=1` / `SHADE_API_PROXY_TARGET` in `vite.config.ts`.
- Registered product routes (SPA fallback must serve `index.html` for each, plus `*` not-found): `/`, `/books`,
  `/books/new`, `/books/:bookId`, `/books/:bookId/mark-read`, `/books/:bookId/reading`, `/books/:bookId/edit`,
  `/books/:bookId/delete`, `/checkout`, `/checkin`, `/loans`, `/shelves`, `/admin/deleted`, `/admin/backup`.
- No `Containerfile`, `.containerignore` / `.dockerignore`, or Podman Make targets exist yet. README does not document
  container build, start, config injection, or cleanup.

## Remaining scope

- Add a Podman-compatible container definition and ignore file.
- Support both the documented development workflow and serving an optimized `dist/` build for preview.
- Inject public runtime configuration (`apiBaseUrl` and optional `diagnostics`) when the container starts so those
  values can change without rebuilding the image. Do not inject application release through runtime config.
- **Copy or bind-mount** the repo-root `.env` into the container at startup so Vite can read `VITE_API_SECRET_KEY`
  during development and in-container production builds. Operators maintain a local gitignored `.env`; prefer bind-mount
  over baking `.env` into image layers. Do not log the token value. Preview of an already-built `dist/` uses the token
  baked at build time (same as non-container production builds).
- Serve client routes with an SPA fallback and appropriate preview cache behavior for every registered product path
  listed above.
- Add Make targets and documentation for image build, development startup, preview startup, configuration, and cleanup.
  Keep existing host `make run` / `make preview` / `make build` working for non-container use.
- Add a container health/smoke check that does not require storing protected credentials in the image (frontend entry
  and runtime config availability; do not call protected API routes from the healthcheck).
- Document clearly that this image is a local/preview convenience and not the production deployment unit. Another
  project (orchestrator / compose stack) is expected to run this image in Podman Compose alongside the backend; this
  ticket builds and documents the frontend image only, not the multi-service Compose file.
- Document container-published origin vs backend CORS (exact origin, or optional same-origin proxy).
- Do not invent a production release tarball here; FEAT-16 owns that.

## Acceptance criteria

- A clean checkout can build and start the image using documented prerequisites.
- Development mode supports the normal repository workflow, and preview mode serves the same optimized assets produced
  by the production build.
- Changing `apiBaseUrl` or optional diagnostics at startup requires no image rebuild. Application release remains
  `package.json` `version` / `APP_VERSION` from the image build.
- Direct navigation to every registered client route receives the application entry point.
- The container has access to the repo-root `.env` file (copied or bind-mounted at startup) for `VITE_API_SECRET_KEY`.
  Image layers, build arguments, runtime configuration templates, and logs do not embed or log the token value. Built JS
  may contain the build-time secret (same as non-container production builds).
- The health/smoke check verifies that the frontend and runtime configuration are available without a live Bearer secret
  in the image.
- Container startup and shutdown do not leave generated root-owned repository files.
- `make check` passes from a clean checkout.

## Plan coverage

The Podman portion of Workstream 12 and the Podman preview artifact gate.

## Out of scope

Production web serving, TLS, Ansible, systemd, remote installation, rollback orchestration, versioned release tarballs
(FEAT-16), and the multi-service orchestrator Compose file.
