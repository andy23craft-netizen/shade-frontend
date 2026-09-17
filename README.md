# Shade frontend

Shade is a React single-page application for a personal library. It includes Reading and Listening rooms, catalog and collection management, circulation, QR labels, image catalog search, household reader views, and library setup tools.

It works with the Shade FastAPI backend. The checked-in contract is [`docs/technical-reference/openapi.json`](docs/technical-reference/openapi.json); behavior not expressed by OpenAPI is documented in [`docs/technical-reference/API-for-FE.md`](docs/technical-reference/API-for-FE.md).

## Requirements

- Node.js 26.7.0 (see [`.nvmrc`](.nvmrc))
- Corepack, for the pinned Yarn 4.18.0 release
- GNU Make
- A compatible Shade backend to use the application
- Podman only for the Compose-oriented development image

For the full browser test suite on Linux:

```sh
yarn playwright install --with-deps chromium
```

## Local development

Install the locked dependencies:

```sh
nvm use
corepack enable
make install
```

Shade starts in **viewer mode**. Normal frontend development needs no API secret or `.env` file. Use the app's Log in control and an administrator password when a protected page or mutation is required; the backend issues a short-lived token for that browser session.

The default [`public/config.js`](public/config.js) calls the same-origin `/api` path. For a local backend at `http://127.0.0.1:8000`, enable the Vite proxy:

```sh
SHADE_API_PROXY=1 make run
```

With the stock identities, open a tenant-aware local URL:

- `http://andy.localhost:5173`
- `http://dalmo.localhost:5173`
- `http://jamie.localhost:5173`

In the stock configuration, `localhost` and `127.0.0.1` use Andy locally. The proxy supplies the trusted `X-Forwarded-Host` header; browser code must never send it. To use a different backend target:

```sh
SHADE_API_PROXY=1 SHADE_API_PROXY_TARGET=http://127.0.0.1:9000 make run
```

For a different arrangement, point `apiBaseUrl` at an absolute HTTP(S) URL only when a trusted tenant-aware proxy supplies the required host context and backend CORS permits the Vite origin. Restore the checked-in `/api` value before committing unless that configuration change is intentional.

`make run` uses host Vite with hot reload; it does not use Podman.

## Make a self-hosted library your own

`andy` is **not** a generic placeholder today. It is one of this repository's three built-in library identities (`andy`, `dalmo`, and `jamie`), and `shade.library.spir.es` is an explicit alias for `andy`. A fresh deployment will therefore show Andy's name and branding—and an unrecognised domain shows “Library not found”—until both the backend tenant and this frontend identity are customized.

Choose a lowercase tenant slug for the new library, such as `mylibrary`. The current frontend resolves a library from the leftmost hostname label, so a convenient public hostname is `mylibrary.example.com`; local development can use `mylibrary.localhost`.

Set up the backend and reverse proxy before expecting the frontend to work:

1. Create and allowlist the new backend tenant. In the matching backend configuration, this includes its tenant entry (currently documented as `data/tenants.cfg`) and any hostname aliases you want; do not reuse the `shade` → `andy` alias.
2. Configure the trusted reverse proxy to send `X-Forwarded-Host: mylibrary.example.com` to the backend. The browser must not set this header.
3. Set the backend `CORS_ORIGINS` to the exact frontend origin, for example `https://mylibrary.example.com`. Include scheme and port when applicable, but no path or trailing slash.
4. Bootstrap an administrator password through the backend's one-time operator workflow, then use the frontend Log in control. Do not expose the bootstrap secret in the frontend.

Then replace or add the frontend identity. These source files deliberately make the current libraries explicit; update them as one coherent change rather than merely pointing a new domain at the existing build:

| Area | Files to update |
| --- | --- |
| Name, wordmark, theme, home imagery, and type | `src/config/libraryIdentity.ts` and the chosen assets under `src/assets/` |
| Recognized hostnames, local default, favicon, and label mark | `src/config/libraryContext.ts` and `vite.config.ts` |
| Theme tokens and library-specific presentation rules | `src/styles/tokens.css` and `src/styles/components.css` |
| Browser/printed-label branding | `public/favicon-*.png`, `src/features/books/labelQrOptions.ts`, and the equivalent album label view |
| Compose image favicon selection | `ci/nginx.conf` |

For a single-library fork, replacing the `andy` identity with your own slug is usually simpler than retaining all three profiles. For a multi-library deployment, add the new slug everywhere the `LibraryId` union is used. Search before and after the change so that intentional product behavior—not an overlooked hard-coded name—drives the result:

```sh
rg -n -i 'andy|dalmo|jamie|library\.spir\.es' src public ci vite.config.ts
make check
```

The TypeScript check will identify many incomplete identity changes. Also visit the new public hostname, a direct client-side route, the home page, and printed QR labels before release. QR payloads identify physical items rather than the public domain, so they normally do not need to change.

## Commands

| Command | Purpose |
| --- | --- |
| `make install` | Install dependencies from the lockfile. |
| `make run` | Start Vite. |
| `make lint` | Run ESLint with zero warnings. |
| `make typecheck` | Run the TypeScript check. |
| `make test` | Run Vitest. |
| `make build` | Type-check and create `dist/`. |
| `make bundle-check` | Check the production entry gzip budget. |
| `make check` | Run the complete local/CI quality gate. |
| `make ci` | Build the local Podman image. |
| `make publish` | Create a versioned static release tarball. |

`make check` runs linting, type checking, OpenAPI generated-type drift checks, Vitest coverage, Playwright and accessibility tests, a production build, and the bundle-size check. Current global coverage thresholds are 20% for statements, branches, functions, and lines. Browser tests use mocked APIs and do not need a running backend.

GitHub Actions runs `make check` on pull requests and pushes to `main`.

## API and authentication

After intentionally changing the checked-in OpenAPI contract, regenerate types with:

```sh
yarn api:generate
```

The quality gate verifies that regeneration leaves no diff.

Viewer catalog reads are available without a Bearer token when the backend receives a tenant-aware host context. Administrator-only data and every mutation require the short-lived token from `POST /auth/sign-in`, handled by the Log in control.

Do not put the backend's global `API_SECRET_KEY` in a Vite variable or browser bundle. It is for the backend's one-time bootstrap operation, not routine frontend authentication. The legacy `.env.example` and `VITE_API_SECRET_KEY` helper remain only for compatibility and test tooling; they are not part of normal application startup.

## Runtime configuration

The browser loads `/config.js` before the app:

```js
window.__SHADE_CONFIG__ = {
  apiBaseUrl: '/api', // or an absolute http(s) URL
  diagnostics: {
    enabled: false,
    endpoint: null,
  },
}
```

When enabled, diagnostics require an absolute HTTP(S) endpoint. Treat that endpoint as privacy-sensitive operational infrastructure: reports are allowlisted and redacted, and must never include passwords or authorization headers.

## Compose-oriented development image

The image is an HTTP-only nginx server for a multi-service Compose environment. It serves host-built `dist/`; it does not run Node, Yarn, Vite, or hot reload.

```sh
make ci
```

This tags `shade-frontend:latest` and `shade-frontend:<package.json-version>`. It listens on port 8080, proxies `/api/*` to `shade-backend:8000` on the Compose network, and writes `/config.js` at startup. Smoke-test it standalone with:

```sh
podman run --rm --name shade-frontend-dev -p 8080:8080 \
  -e SHADE_API_BASE_URL=/api \
  -e SHADE_DIAGNOSTICS_ENABLED=false \
  shade-frontend:latest
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `SHADE_API_BASE_URL` | `/api` | Browser-visible API base URL. |
| `SHADE_DIAGNOSTICS_ENABLED` | `false` | Must be `true` or `false`. |
| `SHADE_DIAGNOSTICS_ENDPOINT` | empty | Diagnostics URL when enabled. |

In normal Compose use, an external reverse proxy owns public TLS and preserves the browser host for tenant context. The image health check verifies static content and `config.js`, not protected API routes.

## Static release

Production delivery is a versioned static tarball, not the Podman image:

```sh
make publish
```

This writes gitignored files to `ci/artifacts/`:

| File | Purpose |
| --- | --- |
| `shade-frontend-<version>.tar.gz` | Deterministic archive of `dist/`. |
| `shade-frontend-<version>.tar.gz.sha256` | SHA-256 checksum. |
| `shade-frontend-<version>.manifest.json` | Version, commit, build metadata, and hosting requirements. |

Verify and inspect before extraction:

```sh
cd ci/artifacts
sha256sum -c shade-frontend-<version>.tar.gz.sha256
tar -tzf shade-frontend-<version>.tar.gz
tar -xzf shade-frontend-<version>.tar.gz -C /path/to/html
```

The archive includes deployable static assets and the public `config.js` template, not source, `node_modules`, `.env`, test output, databases, or Podman files. The host replaces `config.js` with environment values without rebuilding JavaScript.

The deployment environment owns HTTPS/TLS, CSP and security headers, CORS and API connectivity, tenant-aware reverse proxying, SPA fallback, atomic install/rollback, supervision, and health checks. Revalidate `index.html` and `config.js`; cache hashed `/assets/` long-term. [`ci/nginx.conf`](ci/nginx.conf) is the development-image reference for those cache and SPA-routing rules.

## Public-repository checklist

Before publishing, review the whole working tree—not only ignored files:

```sh
git status --short
git ls-files .env ci/artifacts data
```

Keep `.env`, release artifacts, databases, backups, test output, diagnostic payloads, tokens, and passwords out of GitHub. Review fixtures, screenshots, links, commit history, and repository settings for private hostnames, people, library data, and credentials. Backend data and deployment infrastructure need their own publication review.
