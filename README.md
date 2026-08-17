# shade-frontend

The React frontend for the Shade library application.

There are two ways to interact with this project:

1. **Local development** -- run Vite on the host with hot reload (`make run`).
2. **Deployed development** -- build this repository's Podman image and run it in
   Compose with the Shade backend.

Do not collapse those paths. Local development does not use Podman. The Podman
image serves the optimized static `dist/` build; it does not run Vite, hot
reload, or `make run` inside the container.

## Prerequisites

- [Node.js 26.7.0](https://nodejs.org/)
- [Corepack](https://nodejs.org/api/corepack.html)
- Yarn 4.18.0 (provided through Corepack)
- [Make](https://www.gnu.org/software/make/)
- [Podman](https://podman.io/) (deployed-development image only)

## Local development

Activate the Node.js version recorded in `.nvmrc`, then enable Corepack,
install the locked dependencies, and configure the API token:

```sh
nvm use
corepack enable
make install
cp -n .env.example .env
```

Edit `.env` and set `VITE_API_SECRET_KEY` to match the backend
`API_SECRET_KEY`. Restart the dev server after changing `.env`.

Start the local Vite development server:

```sh
make run
```

By default the app calls the API at the base URL in `public/config.js`
(`http://127.0.0.1:8000`). The Shade backend already allows the Vite origins
`http://localhost:5173` and `http://127.0.0.1:5173`, so no proxy is required for
local cross-origin development.

To use an optional same-origin Vite proxy instead:

1. Set `apiBaseUrl` in `public/config.js` to the Vite origin (for example
   `http://localhost:5173`).
2. Start the dev server with the proxy enabled:

```sh
SHADE_API_PROXY=1 make run
```

Optionally set `SHADE_API_PROXY_TARGET` (default `http://127.0.0.1:8000`) when the
API listens elsewhere. That proxy is host `make run` only; it is not available
inside the Podman image.

Run the complete lint, type-check, test, and build quality gate:

```sh
make check
```

Create an optimized production build:

```sh
make build
```

Production output is written to `dist/`. Host `make preview` can serve that
directory locally; it is not the Compose deployment path.

## API token

The Bearer token is read from the repository-root `.env` file as
`VITE_API_SECRET_KEY`. Vite injects this value at dev-server and production
build time, so the secret is embedded in generated JavaScript bundles. Keep
`.env` gitignored and never commit real secrets.

Copy `.env.example` to `.env`, set the value to match the backend
`API_SECRET_KEY`, and restart `make run` after changes. Hot reload does not
reload env files. A missing or blank `VITE_API_SECRET_KEY` prevents the app
from starting.

For any production build -- including the Podman image, which copies host-built
`dist/` -- set `VITE_API_SECRET_KEY` in the build environment before running
`make build` (host `.env` or a build secret). Bind-mounting `.env` at container
start does not change the baked token. Built static assets under `dist/` must
not include the `.env` file itself. Dummy `test-api-token` is for CI only.

## Quality gate and continuous integration

`make check` is the canonical local and CI quality gate. It runs ESLint, TypeScript,
OpenAPI generated-type drift checking, Vitest with enforced coverage thresholds,
Playwright browser and accessibility tests, the production build, and the main-entry
bundle-size check.

Playwright requires Chromium and its Linux system dependencies. On a machine with
the required privileges, install them with:

```sh
yarn playwright install --with-deps chromium
```

GitHub Actions runs the same `make check` gate for pull requests and pushes to
`main`. CI uses the Node version from `.nvmrc`, Yarn through Corepack, and
`yarn install --immutable`; dependency caching does not replace the immutable
install.

The main JavaScript entry has a gzip soft-warning budget of 120 kB and a hard
failure budget of 150 kB. Check it separately after a production build with:

```sh
make bundle-check
```

CI uses `VITE_API_SECRET_KEY=test-api-token` as a non-secret build/test value.
Browser tests use mocked API fixtures and do not require a live protected backend
or the real deployment Bearer token.

## Deployed development

This is the Compose/dev-deployment path. Compose should pull **`shade-frontend`**.
`make container-build` tags `shade-frontend:latest` and
`shade-frontend:<package.json version>` (the same version string as `APP_VERSION`).

The image is runtime-only `nginx:1.31-alpine`. It serves host-built `dist/` over
HTTP on port **8080**. It does not run Node, Yarn, or Vite, and it does not
`COPY` `.env`. The multi-service Compose file lives in the orchestrator
repository, not here.

### Build, run, and clean up

```sh
make container-build
make container-run
make container-stop
make container-clean
```

- `make container-build` runs host `make build`, then builds the image with
  `ci/Containerfile`.
- `make container-run` starts `shade-frontend:latest` as `shade-frontend-dev`,
  publishes **8080**, passes the runtime-config env vars below, and uses `--rm`.
- `make container-stop` stops that named container.
- `make container-clean` removes the container and both image tags.

Startup and shutdown must not leave generated root-owned files in this
repository. The image copies `dist/` at build time and does not bind-mount the
working tree.

### Runtime configuration

At container start, `ci/container-entrypoint.sh` writes `/config.js` from
environment variables. Changing these does not require an image rebuild.
Application release stays the `package.json` `version` from the image build.

| Variable | Default | Meaning |
| -------- | ------- | ------- |
| `SHADE_API_BASE_URL` | `http://127.0.0.1:8000` | Browser-visible API base URL (`apiBaseUrl`) |
| `SHADE_DIAGNOSTICS_ENABLED` | `false` | Must be `true` or `false` |
| `SHADE_DIAGNOSTICS_ENDPOINT` | empty (`null` in `config.js`) | Diagnostics POST URL when enabled |

`SHADE_API_BASE_URL` is loaded by the browser, so it must be a URL the browser
can reach. A Compose-internal hostname is not enough unless that name is also
how the browser calls the API (or a reverse proxy makes the API same-origin).

### CORS and origin

Default API CORS allows only the Vite origins `http://localhost:5173` and
`http://127.0.0.1:5173`. A Compose-published frontend is a different origin.

Choose one:

- **Cross-origin:** put the frontend's exact published origin (scheme, hostname,
  and port; no path or trailing slash) in the backend `CORS_ORIGINS` list, or
- **Same-origin:** put a Compose reverse proxy in front of the API.

Do not rely on the Vite `SHADE_API_PROXY=1` dev-server proxy for this path.

### Healthcheck

The image healthcheck uses `wget` against `http://127.0.0.1:8080/` and
`http://127.0.0.1:8080/config.js`. It does not call protected API routes.

## Production connectivity (release blocker)

Production must choose and verify one connectivity arrangement before release:

- Cross-origin: put the frontend's exact origin (scheme, hostname, and port; no
  path or trailing slash) in the backend `CORS_ORIGINS` list, or
- Same-origin: put a deployment-managed reverse proxy in front of the API.

Either choice remains a release blocker until authenticated requests, browser
CORS preflights, and JavaScript access to the backup response
`Content-Disposition` filename are verified. Cross-origin requests may send
`Authorization` and `Content-Type`. Cookies and credentialed CORS are not used.

## Production host security

The frontend repository produces static application assets; the production
deployment host is responsible for transport and browser security controls.

Before production release, the deployment environment must:

- serve the frontend and production API traffic over HTTPS;
- apply a restrictive Content Security Policy compatible with the application's
  static assets, configured API origin, and camera access used by the ISBN
  scanner;
- apply appropriate browser security headers, including HSTS where applicable;
- provide SPA fallback routing to `index.html` for client-side routes; and
- serve the deployment-managed runtime configuration with production values.
- provision the production `.env` beside the deployed application `.DLL` files;
  the frontend build and CI pipeline do not create, package, upload, or deploy that
  file.

### CI artifacts and privacy

The default CI workflow does not retain `dist/`, coverage output, Playwright
reports, traces, screenshots, videos, `.env` files, database files, backup dumps,
or other runtime data.

If CI artifact retention is added later, retained artifacts must be reviewed
before upload and must exclude secrets and secret-bearing environment files,
database or backup contents, runtime logs, diagnostic payloads, and other
sensitive local data. Backup contents must never be uploaded as CI artifacts.

These requirements are deployment assumptions, not frontend implementations.
The deployment repository and FEAT-16 own the concrete web-server, TLS, CSP,
security-header, artifact-installation, and rollback configuration.

Production release must verify these host controls alongside the connectivity
requirements above rather than assuming that a successful frontend build
provides them.
