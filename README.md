# Shade

Shade is a web application for organizing and enjoying a home library. It offers dedicated Reading and Listening rooms, catalog browsing and management, collections and wishlists, circulation, QR labels, image-based catalog search, household reader views, and library setup tools.

Shade consists of this frontend and a compatible Shade FastAPI backend. The frontend is a React single-page application.

## Using Shade

Open your Shade site in a browser to browse the catalog in viewer mode. Use the Log in control when you need administrator features such as managing items, collections, shelves, settings, or loans.

## Hosting your own Shade library

To host Shade at your own address:

1. Create an A record in your DNS for the hostname you want to use, for example `shade.example.com`.
2. Configure port forwarding on your router so public web traffic reaches the server that runs your Shade deployment.
3. Put that base URL in the appropriate gitignored configuration files for your deployment.

The frontend, backend, and reverse proxy must be deployed together. Keep credentials, deployment-specific configuration, backups, diagnostics, and library data out of Git.

## Project information

The checked-in API contract is [`docs/technical-reference/openapi.json`](docs/technical-reference/openapi.json). Additional API behavior is described in [`docs/technical-reference/API-for-FE.md`](docs/technical-reference/API-for-FE.md).

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for local development, testing, and build instructions.
