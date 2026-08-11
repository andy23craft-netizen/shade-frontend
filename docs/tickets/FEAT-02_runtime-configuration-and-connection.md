# FEAT-02 — Runtime configuration and connection

## Objective

Let one static build connect safely to different API environments while keeping the shared Bearer token out of the
artifact.

## Dependencies

FEAT-01 is complete. Do not rebuild the shell, shared UI, or providers already in place.

Do not add a component library, CSS framework, state store, data-fetching library, or form library in this ticket.
Query/cache providers belong to FEAT-03. When forgetting or rejecting a token, clear connection state now and leave a
safe seam for FEAT-03 to invalidate cached protected data.

## Current baseline

Already in place and should not be rebuilt:

- `public/config.js` defining `window.__SHADE_CONFIG__` (`apiBaseUrl`, `release`), loaded from `index.html` before the
  app module.
- `src/config/runtimeConfig.ts` validating API base URL (HTTP/HTTPS, trailing-slash stripped, no `/api` assumption) and
  release identifier, with colocated unit tests.
- `src/config/runtimeConfigState.ts` and `RuntimeConfigScreen`, wired from `src/main.tsx` so missing or malformed
  config shows the recoverable configuration screen instead of the app shell.
- `AppProviders` accepting `runtimeConfig` and wrapping `ConnectionProvider` around the router.
- `src/features/connection/` connection state: types, context, `sessionStorage` token helpers, `GET /health`
  reachability, `GET /protected` credential verification, connect / retry / forget actions, FEAT-03 invalidation seam,
  and `ConnectionScreen` UI.
- Health and credential failures map to distinct statuses (`unreachable`, `setup_required`, `unauthorized`,
  `connected`).
- `/settings/connection` mounts `ConnectionScreen` via `src/features/connection/routes/ConnectionPage.tsx`.
- Shared API client and error helpers in `src/api/apiClient.ts` and `src/api/apiErrors.ts`: protected requests send the
  current runtime Bearer token, paths root at the configured base URL (no `/api` prefix), and a confirmed protected
  `403` clears the active token, notifies the invalidation seam, and returns the user to connection setup with rejected
  access messaging (not an inference about missing vs invalid credentials).
- Client errors omit authorization secrets; API-client tests assert tokens do not appear in `ApiError` stringification.
- Tests cover reload/session restoration, malformed config, health failure, rejected access, token replacement,
  forget/clear, invalidation notifications, and error redaction.
- App shell footer shows the runtime release identifier from connection/runtime config.
- Production-build and source-map token inspection
  (`scripts/productionBuildTokenInspection.test.ts`) fails if known test or placeholder tokens appear in artifacts.
- Optional local Vite API proxy via `SHADE_API_PROXY=1` (default remains direct cross-origin to the backend's allowed
  Vite origins).
- README and maintainer docs record local CORS-or-proxy setup, `sessionStorage` token limits, and the production
  connectivity release blocker (`CORS_ORIGINS` or same-origin proxy, including preflight and backup
  `Content-Disposition` verification).

## Remaining scope

- None for this ticket once `make check` passes. Later tickets may extend typed API coverage, packaging, and CI.

## Security requirements

- Never put the token in source, runtime config, build arguments, generated assets, source maps, URLs, logs,
  diagnostics, snapshots, or error reports.
- Redact authorization and connection state from all errors.
- Document that `sessionStorage` limits persistence but does not protect a token from browser users or same-origin code.

## Acceptance criteria

- The runtime release identifier is visible in the application shell.
- Production-build and source-map inspection finds no test or real token.
- The production connectivity choice--an exact approved `CORS_ORIGINS` entry or a same-origin reverse proxy--is recorded
  and remains a release blocker until authenticated requests, browser preflights, and JavaScript access to the backup
  `Content-Disposition` filename are verified.
- Local CORS-or-proxy setup and `sessionStorage` token limits are documented for developers.
- `make check` passes.

## Plan coverage

Sections 7.3, 7.4, 7.9, 11, and 12; runtime-connection portions of Workstreams 2 and 12.
