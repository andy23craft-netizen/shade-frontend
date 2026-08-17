# FEAT-15 -- Podman container for compose (dev deployment)

## Objective

Package the production-built static site into a Podman image meant to run in a Podman Compose stack with the Shade
backend. This is the **dev deployment** path, not local Vite development and not production.

## Three deployment modes

This repository has three distinct ways to run the frontend. Do not collapse them.

| Mode | How it runs | Owner |
| ---- | ----------- | ----- |
| Local development | Host `make run` (Vite, hot reload, `.env`, `public/config.js`). Already shipped. | Done; not this ticket |
| Dev deployment | Podman image serving the optimized `dist/` build, run via Podman Compose next to the backend | This ticket |
| Production | Versioned static tarball plus the deployment repository (HTTPS, TLS, systemd, and so on) | FEAT-16 |

FEAT-15 does **not** maintain hot reloading, a containerized Vite dev server, or `make run` behavior inside Podman.
Leave host `make run` / `make preview` / `make build` as they are.

## Dependencies

FEAT-14 is complete. Reuse the existing `make check` gate (`yarn check`: lint, type-check, OpenAPI drift check, Vitest
with V8 coverage, Playwright, production build, bundle-size check), dummy `VITE_API_SECRET_KEY` for CI-style builds, and
host `make build` (`dist/`). Do not reinvent those suites or replace the host Make targets.

Versioned release tarballs remain FEAT-16. Do not pull FEAT-16 through FEAT-21 product or packaging work into FEAT-15.
Do not write the multi-service Compose file here; the orchestrator / compose stack consumes this image.

Do not confuse repository `ci/` with FEAT-14 GitHub Actions. The quality pipeline is `.github/workflows/check.yml`.
`ci/` is copy-pasted container starting material for this ticket (see Current baseline).

## Runtime and contract facts for this ticket

Treat these as complementary, not interchangeable:

- `public/config.js` -- public runtime config assigned to `window.__SHADE_CONFIG__`: `apiBaseUrl` and optional
  `diagnostics: { enabled, endpoint }`. Not bundled. Omitted diagnostics default to disabled / null endpoint.
- `package.json` `version` -- canonical application release (`APP_VERSION`, footer `Release` label). Injected at Vite
  production-build time. It is **not** a runtime-config field; do not put `release` back into `config.js`.
- Repository-root `.env` (`VITE_API_SECRET_KEY`) -- gitignored Bearer token. Vite injects it at **build** time into JS
  bundles. The container does not run Vite, so bind-mounting `.env` at container start does not change the baked token.
  `.env.example` is the committed template.
- `../technical-reference/API-for-FE.md` -- default API CORS allows only `http://localhost:5173` and
  `http://127.0.0.1:5173`. A compose-published frontend origin must match an allowed exact origin, or the compose stack
  must make the browser same-origin with the API. The optional `SHADE_API_PROXY=1` Vite proxy is host-local-dev only; it
  is not available inside this static image. Do not invent credentialed CORS.

### What the image must keep equivalent

- Serve the same optimized `dist/` assets produced by `make build` / `yarn build` (not a second bundler, not `yarn
  dev`).
- SPA fallback must cover every registered product path (see Current baseline). Cache behavior: revalidate `index.html`
  and `config.js`; hashed assets under `dist/assets/` may be long-lived.
- Changing `apiBaseUrl` or optional diagnostics at container start must not require an image rebuild (compose needs this
  so the browser can reach the sibling backend). Changing application release requires a rebuild because `APP_VERSION`
  comes from `package.json` at Vite time.
- HTTP only. TLS, reverse proxy, and compose networking belong to the orchestrator / production host, not this image.

## Current baseline

Already in place and should be reused (not rebuilt):

- Host quality gate and CI: `make check` / `.github/workflows/check.yml` (FEAT-14 complete).
- Host local development: `make run` (Vite). Out of scope for this ticket.
- Host commands this image builds on: `make build` (`dist/`), `make preview` (`yarn preview` of an existing production
  build, host-only convenience), `make install` (`yarn install --immutable`).
- Pinned toolchain: Node 26.7.0 (`.nvmrc` / `package.json` `engines`), Yarn 4.18.0 (`packageManager`), Corepack.
- Runtime config: `public/config.js` (`apiBaseUrl`, optional `diagnostics`). Application release from `package.json` via
  Vite `define` in `vite.config.ts`.
- Auth: gitignored `.env` with `VITE_API_SECRET_KEY`; `readApiToken()` fail-fast at bootstrap of the **built** app;
  dummy `test-api-token` is for CI only, not a substitute for an operator token when building a real compose image.
- Optional same-origin proxy: `SHADE_API_PROXY=1` / `SHADE_API_PROXY_TARGET` in `vite.config.ts` -- host `make run`
  only.
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

These files were copy-pasted from another project. The runtime-only nginx shape matches this ticket's goal (static site
in compose, no Vite in the image). They are still not a finished Shade definition: no Podman Make targets, no repo-root
`.containerignore` / `.dockerignore`, and README does not document image build, compose-oriented config, or cleanup.
Generated staging trees under `ci/artifacts/` are not gitignored.

### Copied `ci/` fitness (keep, adapt, or delete)

The copied files are a reasonable sketch for **this** ticket. Keep the nginx SPA pattern if adapting it to Shade is
cheaper than starting over. Do **not** add a Node/Yarn/Vite stage for hot reload.

Still not ready-to-go:

- **Wrong publish contract.** Adapt to `make build` / `dist/`, or replace. Do not keep foreign names (`publish/`,
  `publish-local`, `build-local`) unless they become real Shade targets.
- **No start-time runtime-config injection.** `COPY` of a baked `config.js` into the image is not enough; `apiBaseUrl`
  and optional diagnostics must change at container start without rebuilding so compose can point the browser at the
  backend.
- **Healthcheck is incomplete.** Verify frontend entry **and** runtime-config availability (for example `config.js`),
  still without calling protected API routes.
- **Cache headers are incomplete.** Revalidate `index.html` and `config.js`; the copied conf only special-cases
  `/assets/`.
- **No Make targets or operator docs** for building the image that compose will consume.
- **Stale comments** (TanStack Router).

If adapting costs more than a Shade-shaped Containerfile, delete `ci/` contents and replace them. Do not preserve a
foreign layout out of inertia. Do not expand the image into a second local-dev environment.

## Remaining scope

- Ship a Podman-compatible container definition and ignore file that serves the production `dist/` tree over HTTP.
  Start from `ci/` only when the fitness notes above still hold after a Shade adaptation; otherwise replace or delete
  that tree.
- Document the image as the **dev-deployment** unit for Podman Compose with the backend: published port, healthcheck,
  runtime-config injection, SPA fallback, and that the Compose file itself lives in the orchestrator (not this repo).
- Inject public runtime configuration (`apiBaseUrl` and optional `diagnostics`) when the container starts so those
  values can change without rebuilding the image. Do not inject application release through runtime config. Do not treat
  a host-copied `config.js` baked into image layers as satisfying this.
- Build the image from a production `make build` / `yarn build` (host-built then copied, or an equivalent in-image
  build stage). `VITE_API_SECRET_KEY` is supplied at **build** time (host `.env` or a build secret), matching the
  backend key the compose stack will run. Do not `COPY` `.env` into image layers. Do not log the token. Built JS may
  contain the build-time secret (same as non-container production builds).
- Serve client routes with an SPA fallback and the cache behavior above for every registered product path.
- Add Make targets and documentation for image build, how compose should run it, configuration, and cleanup. Keep
  existing host `make run` / `make preview` / `make build` working. If a staging directory under `ci/artifacts/` is
  used, gitignore generated trees so `dist/` copies and secrets are not committed.
- Add a container health/smoke check that does not require storing protected credentials in the image (frontend entry
  and runtime config availability; do not call protected API routes from the healthcheck).
- Document compose-published origin vs backend CORS (exact origin, or same-origin via the compose reverse proxy). Do
  not rely on the Vite dev-server proxy.
- Do not invent a production release tarball here; FEAT-16 owns that.
- Do not add hot reload, bind-mounted source, or `yarn dev` to the image.

## Acceptance criteria

- A clean checkout can build the image using documented prerequisites.
- The image serves the same optimized assets produced by the production build (not a Vite dev server).
- Changing `apiBaseUrl` or optional diagnostics at startup requires no image rebuild. Application release remains
  `package.json` `version` / `APP_VERSION` from the image build.
- Direct navigation to every registered client route receives the application entry point.
- Image layers, build arguments, runtime configuration templates, and logs do not embed or log the token value as a
  dedicated secret file. Built JS may contain the build-time secret (same as non-container production builds).
- The health/smoke check verifies that the frontend and runtime configuration are available without a live Bearer secret
  in the image.
- README (or equivalent) documents this image as compose/dev-deployment, not local `make run`, and not the production
  tarball.
- Container startup and shutdown do not leave generated root-owned repository files.
- `make check` passes from a clean checkout.
- Foreign copy-paste leftovers are gone from the shipped definition: no TanStack Router comments, no `publish-local` /
  `build-local` / `publish/` names unless they are real Shade targets, and no unused `ci/` files left "just in case".

## Plan coverage

The Podman portion of Workstream 12 and the Podman preview artifact gate, interpreted as **compose/dev-deployment** of
the static site (PLAN's "local development" here is not Vite HMR; that remains host `make run`).

## Out of scope

- Local Vite development and hot reload (`make run` is already the local-dev path).
- Production web serving, TLS, Ansible, systemd, remote installation, rollback orchestration.
- Versioned release tarballs (FEAT-16).
- The multi-service orchestrator Compose file (this repo ships the frontend image only).
