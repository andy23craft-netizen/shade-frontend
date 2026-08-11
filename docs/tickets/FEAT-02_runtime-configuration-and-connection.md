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
  reachability, `GET /protected` credential verification, connect / retry / forget actions, and `ConnectionScreen` UI.
- Health and credential failures already map to distinct statuses (`unreachable`, `setup_required`, `unauthorized`,
  `connected`).

Not finished:

- `src/features/settings/routes/ConnectionPage.tsx` still renders `RoutePlaceholder`; `ConnectionScreen` is unused.
- `src/api/apiClient.ts` and `src/api/apiErrors.ts` are empty placeholders.
- App shell footer does not show the runtime release identifier.
- No connection, API-client, redaction, or production-build token-inspection tests yet.
- Frontend README / maintainer docs do not yet record local CORS-or-proxy setup, `sessionStorage` token limits, or the
  production connectivity release blocker.

## Remaining scope

- Mount `ConnectionScreen` on `/settings/connection` (replace the `ConnectionPage` placeholder).
- Implement the shared API client and error helpers so every protected request after verification sends the current
  runtime Bearer token, paths stay rooted at the configured base URL (no `/api` prefix), and a confirmed protected
  `403` clears the active token and returns the user to connection setup.
- Describe `403` as rejected API access rather than inferring whether the token was missing or invalid.
- Redact authorization and connection secrets from client errors, logs, and diagnostics.
- Display the runtime release identifier in the shell.
- Support the backend's default local Vite origins or an optional local proxy. Document that cross-origin production
  requires the frontend's exact scheme, hostname, and port in backend `CORS_ORIGINS`, with no path or trailing slash;
  a deployment-managed same-origin proxy remains an alternative.
- Document that cross-origin requests may send `Authorization` and `Content-Type`, cookies/credentialed CORS are not
  used, and frontend JavaScript may read the exposed `Content-Disposition` backup filename.
- Document that `sessionStorage` limits persistence but does not protect a token from browser users or same-origin code.

## Security requirements

- Never put the token in source, runtime config, build arguments, generated assets, source maps, URLs, logs,
  diagnostics, snapshots, or error reports.
- Redact authorization and connection state from all errors.
- Document that `sessionStorage` limits persistence but does not protect a token from browser users or same-origin code.

## Acceptance criteria

- Changing the API URL or release identifier requires no rebuild.
- Missing or malformed runtime config produces a recoverable configuration screen.
- `/settings/connection` exposes the connection UI with distinct, actionable states for unreachable,
  reachable-but-unverified, verified, and rejected access.
- Every protected request made after verification receives the current runtime token.
- Forgetting or rejecting a token clears connection state (and any FEAT-03 cache seam) as well as the stored token.
- Production-build and source-map inspection finds no test or real token.
- Tests cover reload/session restoration, malformed config, health failure, rejected access, token replacement, and
  redaction.
- The production connectivity choice--an exact approved `CORS_ORIGINS` entry or a same-origin reverse proxy--is recorded
  and remains a release blocker until authenticated requests, browser preflights, and JavaScript access to the backup
  `Content-Disposition` filename are verified.
- `make check` passes.

## Plan coverage

Sections 7.3, 7.4, 7.9, 11, and 12; runtime-connection portions of Workstreams 2 and 12.
