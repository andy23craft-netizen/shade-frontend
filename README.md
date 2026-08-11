# shade-frontend

The React frontend for the Shade library application.

## Prerequisites

- [Node.js 26.7.0](https://nodejs.org/)
- [Corepack](https://nodejs.org/api/corepack.html)
- Yarn 4.18.0 (provided through Corepack)
- [Make](https://www.gnu.org/software/make/)

## Setup

Activate the Node.js version recorded in `.nvmrc`, then enable Corepack and
install the locked dependencies:

```sh
nvm use
corepack enable
make install
```

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

## API token storage

The Bearer token is entered at runtime on the connection screen. It is kept in
memory and `sessionStorage` for the browser tab. That limits persistence across
tabs and browser restarts, but it does not hide the token from anyone who can use
the browser or run same-origin script. Never put a token in source, runtime
config, build arguments, generated assets, source maps, URLs, logs, or error
reports.

## Production connectivity (release blocker)

Production must choose and verify one connectivity arrangement before release:

- Cross-origin: put the frontend's exact origin (scheme, hostname, and port; no
  path or trailing slash) in the backend `CORS_ORIGINS` list, or
- Same-origin: put a deployment-managed reverse proxy in front of the API.

Either choice remains a release blocker until authenticated requests, browser
CORS preflights, and JavaScript access to the backup response
`Content-Disposition` filename are verified. Cross-origin requests may send
`Authorization` and `Content-Type`. Cookies and credentialed CORS are not used.
