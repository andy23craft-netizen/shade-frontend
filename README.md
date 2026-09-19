# Shade

Shade is a web application for organizing and enjoying a home library. It offers dedicated Reading and Listening rooms, catalog browsing and management, collections and wishlists, circulation, QR labels, image-based catalog search, household reader views, and library setup tools.

Shade consists of this frontend and a compatible Shade FastAPI backend. The frontend is a React single-page application.

## Using Shade

Open your Shade site in a browser to browse the catalog in viewer mode. Use the Log in control when you need administrator features such as managing items, collections, shelves, settings, or loans.

## Hosting your own Shade library

To host Shade at your own address:

1. Create a DNS record for the hostname you want to use, for example `tenant-a.example.test`.
2. Configure the deployment's private environment: `SHADE_API_UPSTREAM` is the
   container-network backend `host:port`; `SHADE_API_BASE_URL` normally remains `/api`.
3. Configure the backend's private tenant allowlist and `CORS_ORIGINS` to accept
   the frontend origin. Tenant identity is resolved by the trusted proxy/backend
   from the request hostname; the browser does not send tenant headers.

The frontend, backend, and reverse proxy must be deployed together. Copy
`.env.example` to a gitignored `.env` for local configuration. Keep credentials,
deployment-specific configuration, backups, diagnostics, and library data out of Git.

## Project information

The checked-in API contract is [`docs/technical-reference/openapi.json`](docs/technical-reference/openapi.json). Additional API behavior is described in [`docs/technical-reference/API-for-FE.md`](docs/technical-reference/API-for-FE.md).

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for local development, testing, and build instructions.
