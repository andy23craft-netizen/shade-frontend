# FEAT-02 — Runtime configuration and connection

## Objective

Let one static build connect safely to different API environments while keeping the shared Bearer token out of the
artifact.

## Dependencies

FEAT-01.

## Scope

- Load and validate a public runtime configuration containing the API base URL and application release identifier.
- Ensure API paths are rooted directly at the configured URL and never assume an `/api` prefix.
- Implement application-wide connection state and `/settings/connection`.
- Store the token only in memory and `sessionStorage`; add an explicit forget-token action.
- Distinguish public `GET /health` reachability from `GET /protected` credential verification.
- Return the user to connection setup and clear the active token after a confirmed protected-request `403`.
- Describe `403` as rejected API access rather than inferring whether the token was missing or invalid.
- Support a local Vite proxy or document direct-origin development without hiding the production CORS/proxy requirement.
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
- The production connectivity choice—approved CORS origin or same-origin reverse proxy—is recorded as a release blocker
  until verified.
- `make check` passes.

## Plan coverage

Sections 7.3, 7.4, 7.9, 11, and 12; runtime-connection portions of Workstreams 2 and 12.
