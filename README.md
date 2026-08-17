# shade-frontend

The React frontend for the Shade library application.

## Prerequisites

- [Node.js 26.7.0](https://nodejs.org/)
- [Corepack](https://nodejs.org/api/corepack.html)
- Yarn 4.18.0 (provided through Corepack)
- [Make](https://www.gnu.org/software/make/)

## Setup

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

## Development

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
API listens elsewhere.

Run the complete lint, type-check, test, and build quality gate:

```sh
make check
```

Create an optimized production build:

```sh
make build
```

Production output is written to `dist/`.

## API token

The Bearer token is read from the repository-root `.env` file as
`VITE_API_SECRET_KEY`. Vite injects this value at dev-server and production
build time, so the secret is embedded in generated JavaScript bundles. Keep
`.env` gitignored and never commit real secrets.

Copy `.env.example` to `.env`, set the value to match the backend
`API_SECRET_KEY`, and restart `make run` after changes. Hot reload does not
reload env files. A missing or blank `VITE_API_SECRET_KEY` prevents the app
from starting.

For production builds, set `VITE_API_SECRET_KEY` in the build environment before
running `make build`. Release artifacts must not include the `.env` file itself
— only built static assets under `dist/`.

### Quality gate and continuous integration

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

CI uses VITE_API_SECRET_KEY=test-api-token as a non-secret build/test value.
Browser tests use mocked API fixtures and do not require a live protected backend
or the real deployment Bearer token.

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
