# FEAT-15 -- Podman development and preview

## Objective

Provide a reproducible Podman-compatible environment for local development and production-build previews.

## Dependencies

FEAT-14 is complete. Reuse the existing `make check` gate (`yarn check`: lint, type-check, OpenAPI drift check, Vitest
with V8 coverage, Playwright, production build, bundle-size check), dummy `VITE_API_SECRET_KEY` for CI-style builds, and
host `make run` / `make preview` / `make build` commands. Do not reinvent those suites or replace the host Make targets.
Packaging the same workflows in a Podman image is this ticket; versioned release tarballs remain FEAT-16. Do not pull
FEAT-16 through FEAT-21 product or packaging work into FEAT-15.

Do not confuse repository `ci/` with FEAT-14 GitHub Actions. The quality pipeline is `.github/workflows/check.yml`.
`ci/` is copy-pasted container/preview starting material for this ticket (see Current baseline).

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

Copied container starting material under `ci/` (present, not wired, not Shade-ready as-is):

- `ci/Containerfile` -- runtime-only `nginx:1.31-alpine` image. HTTP on 8080; TLS stays external. No Node/Yarn stage;
  does not compile the app. Expects a host-built static tree in the `ci/artifacts` build context (`PUBLISH_DIR=publish`)
  and comments that `make publish-local` / `build-local` copy `nginx.conf` into that context. Those Make targets do not
  exist here; this repo emits `dist/` via `make build`. Healthcheck is `wget` against `http://127.0.0.1:8080/` only.
- `ci/nginx.conf` -- SPA `try_files` fallback and long-lived `/assets/` cache (fits Vite hashed output). Comments still
  mention TanStack Router (this app uses React Router 7). No explicit revalidate headers for `index.html` or
  `config.js`.
- `ci/artifacts/.dockerignore` -- build context is `ci/artifacts`; only `publish/` and `nginx.conf` are copied. There is
  no `publish/` tree in this repo today.

These files were copy-pasted from another project. They are a static-preview sketch, not a finished Shade definition.
There are still no Podman Make targets, no repo-root `.containerignore` / `.dockerignore`, and README does not document
container build, start, config injection, or cleanup. Generated staging trees under `ci/artifacts/` are not gitignored.

### Copied `ci/` fitness (keep, adapt, or delete)

Keep the nginx SPA preview pattern only if it remains the cheapest way to serve a host-built `dist/`. It is useful as
a sketch for HTTP-only preview, SPA fallback, hashed-asset caching, a small build context, and a credential-free `/`
probe. It is **not** ready-to-go:

- **No development mode.** FEAT-15 still requires Vite `make run` behavior (hot reload, fail-fast missing token,
  `public/config.js`). The copied image cannot do that.
- **Wrong publish contract.** Adapt to `make build` / `dist/`, or replace. Do not keep foreign names (`publish/`,
  `publish-local`, `build-local`) once a Shade path is chosen.
- **No start-time runtime-config injection.** `COPY` of a baked `config.js` into the image is not enough; `apiBaseUrl`
  and optional diagnostics must change at container start without rebuilding.
- **Healthcheck is incomplete.** Ticket requires frontend entry **and** runtime-config availability (for example
  `config.js`), still without calling protected API routes.
- **Preview cache is incomplete.** Revalidate `index.html` and `config.js`; the copied conf only special-cases
  `/assets/`.
- **No Make targets or operator docs.**

If adapting the copied files costs more than a Shade-shaped Containerfile (or a multi-target file covering dev plus
preview), delete `ci/` contents and replace them. Do not preserve a foreign layout out of inertia.

## Remaining scope

- Ship a Podman-compatible container definition and ignore file. Start from `ci/` only when the fitness notes above
  still hold after a Shade adaptation; otherwise replace or delete that tree.
- Support both the documented development workflow and serving an optimized `dist/` build for preview. Development is
  not covered by the copied runtime-only image; preview may reuse the nginx pattern if adapted to `dist/`, start-time
  `config.js` injection, React Router routes, and the cache/health rules below.
- Inject public runtime configuration (`apiBaseUrl` and optional `diagnostics`) when the container starts so those
  values can change without rebuilding the image. Do not inject application release through runtime config. Do not treat
  a host-copied `config.js` baked into image layers as satisfying this.
- **Copy or bind-mount** the repo-root `.env` into the container at startup so Vite can read `VITE_API_SECRET_KEY`
  during development and in-container production builds. Operators maintain a local gitignored `.env`; prefer bind-mount
  over baking `.env` into image layers. Do not log the token value. Preview of an already-built `dist/` uses the token
  baked at build time (same as non-container production builds).
- Serve client routes with an SPA fallback and appropriate preview cache behavior for every registered product path
  listed above (revalidate `index.html` and `config.js`; hashed `dist/assets/` may be long-lived).
- Add Make targets and documentation for image build, development startup, preview startup, configuration, and cleanup.
  Keep existing host `make run` / `make preview` / `make build` working for non-container use. If a staging directory
  under `ci/artifacts/` is used, gitignore generated trees so `dist/` copies and secrets are not committed.
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
- Foreign copy-paste leftovers are gone from the shipped definition: no TanStack Router comments, no `publish-local` /
  `build-local` / `publish/` names unless they are real Shade targets, and no unused `ci/` files left "just in case".

## Plan coverage

The Podman portion of Workstream 12 and the Podman preview artifact gate.

## Out of scope

Production web serving, TLS, Ansible, systemd, remote installation, rollback orchestration, versioned release tarballs
(FEAT-16), and the multi-service orchestrator Compose file.
