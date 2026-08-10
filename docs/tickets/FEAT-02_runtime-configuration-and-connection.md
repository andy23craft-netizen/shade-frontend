# FEAT-02 — Runtime configuration and connection

## Objective

Let one static build connect safely to different API environments while keeping the shared Bearer token out of the
artifact.

## Dependencies

FEAT-01 is complete. The live shell, `/settings/connection` placeholder route, shared UI, and `AppProviders` are in
place. Do not rebuild them.

Do not add a component library, CSS framework, state store, data-fetching library, or form library in this ticket.
Query/cache providers belong to FEAT-03.

## Current baseline

Already in place and should not be rebuilt:

- `AppShell` with a Connection Settings nav link and route title/heading metadata for `/settings/connection`.
- `src/features/settings/routes/ConnectionPage.tsx` rendering `RoutePlaceholder` only.
- `AppProviders` wrapping `NotificationsProvider` around the router; no runtime config or connection state yet.
- Design tokens and shared primitives (including `Alert`, `Field`, `Button`, `LoadingState`) ready for the settings UI.

Not started: runtime config loading, connection state, token storage, health/credential checks, `403` recovery, CORS
documentation, or release-identifier display in the shell.

## Remaining scope

- Load and validate a public runtime configuration containing the API base URL and application release identifier.
- Ensure API paths are rooted directly at the configured URL and never assume an `/api` prefix.
- Implement application-wide connection state and replace the `ConnectionPage` placeholder with `/settings/connection`
  UI.
- Store the token only in memory and `sessionStorage`; add an explicit forget-token action.
- Distinguish public `GET /health` reachability from `GET /protected` credential verification.
- Return the user to connection setup and clear the active token after a confirmed protected-request `403`.
- Describe `403` as rejected API access rather than inferring whether the token was missing or invalid.
- Support the backend's default local Vite origins or an optional local proxy. Document that cross-origin production
  requires the frontend's exact scheme, hostname, and port in backend `CORS_ORIGINS`, with no path or trailing slash;
  a deployment-managed same-origin proxy remains an alternative.
- Document that cross-origin requests may send `Authorization` and `Content-Type`, cookies/credentialed CORS are not
  used, and frontend JavaScript may read the exposed `Content-Disposition` backup filename.
- Display the runtime release identifier in the shell.

## Security requirements

- Never put the token in source, runtime config, build arguments, generated assets, source maps, URLs, logs, diagnostics,
  snapshots, or error reports.
- Redact authorization and connection state from all errors.
- Document that `sessionStorage` limits persistence but does not protect a token from browser users or same-origin code.

## Acceptance criteria

- Changing the API URL or release identifier requires no rebuild.
- Missing or malformed runtime config produces a recoverable configuration screen.
- Health and credential checks produce distinct, actionable states for unreachable, reachable-but-unverified, verified,
  and rejected access.
- Every protected request made after verification receives the current runtime token.
- Forgetting or rejecting a token clears cached protected data as well as connection state.
- Production-build and source-map inspection finds no test or real token.
- Tests cover reload/session restoration, malformed config, health failure, rejected access, token replacement, and
  redaction.
- The production connectivity choice--an exact approved `CORS_ORIGINS` entry or a same-origin reverse proxy--is recorded
  and remains a release blocker until authenticated requests, browser preflights, and JavaScript access to the backup
  `Content-Disposition` filename are verified.
- `make check` passes.

## Plan coverage

Sections 7.3, 7.4, 7.9, 11, and 12; runtime-connection portions of Workstreams 2 and 12.
