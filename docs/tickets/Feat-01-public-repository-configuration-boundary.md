# Feat-01: Externalize deployment routing and move tenant identity out of the public frontend bundle

## Problem

The frontend can only run for the currently coded tenant/domain set. Personal tenant branding, hostname aliases, proxy topology, and a personal repository reference are tracked in source. A new installation cannot be configured solely through deployment inputs and tenant data.

## Current State

- `window.__SHADE_CONFIG__` supplies public runtime API and diagnostics configuration.
- `ci/container-entrypoint.sh` generates that file from environment values.
- `libraryContext.ts` and `libraryIdentity.ts` compile personal tenants and branding into the bundle.
- `ci/nginx.conf` hardcodes public domains and `shade-backend:8000`.
- `.env` is ignored; `.env.example` is tracked but documents obsolete shared-secret configuration.
- Release packaging correctly excludes `.env` and verifies browser bundles do not include the legacy token.

## Desired Architecture

- Keep deployment concerns in the existing runtime/container configuration boundary.
- Treat tenant branding, display name, theme, label prefix, and tenant capabilities as tenant-owned backend data—not frontend deployment configuration.
- Allow the frontend to start for any deployment host with safe neutral branding until trusted tenant metadata is available.
- Let the backend, using its trusted host routing, determine tenant identity. The browser must never choose a tenant by request header or arbitrary URL parameter.
- Keep browser runtime configuration public and nonsecret.

## Scope

- Replace the compiled `andy`/`dalmo`/`jamie` hostname and branding catalogue with a generic neutral startup path plus a typed, trusted tenant-metadata API contract.
- Remove hardcoded personal domains and tenant favicon maps from frontend nginx and Vite configuration.
- Make nginx’s backend upstream externally supplied at container startup, retaining `/api` same-origin proxying.
- Remove the stray nested package metadata and personal Cursor workspace paths.
- Replace obsolete secret guidance and stale release-manifest language.
- Add public-repository policy files and documented configuration examples.

## Explicit Non-Goals

- Do not implement Ansible roles, backend provisioning, DNS, TLS, CORS, or reverse-proxy orchestration in this repository.
- Do not place tenant names, branding, host mappings, passwords, tokens, or API secrets into frontend runtime configuration.
- Do not change backend authorization semantics or send proxy-owned tenant headers from browser code.
- Do not redesign the application’s visual system beyond supporting safe neutral/default branding.

## Implementation Plan

1. Define and obtain approval for a backend tenant-metadata response, derived server-side from the resolved host. Include only public display/capability fields required by the frontend.
2. Refactor `LibraryContext`/`LibraryIdentity` so the initial state is neutral and host-independent; apply metadata only after retrieval and validation.
3. Replace hardcoded privileged-tenant checks with a backend-provided capability.
4. Replace nginx’s fixed upstream with startup-generated configuration from an externally supplied upstream value; remove personal hostname/favicon maps and use a generic default unless metadata supplies a safe asset.
5. Keep `SHADE_API_BASE_URL` and diagnostics in `config.js`; delete the legacy frontend-secret template/API path if no production importer remains.
6. Tighten `.gitignore` for the documented private deployment inputs while retaining tracked examples.
7. Remove personal development metadata and stale nested package metadata.
8. Add LICENSE, SECURITY, and contributor/public-installation documentation appropriate to the chosen license and support policy.

## Configuration Contract

Ansible or another deployment owner must provide only public deployment values to this repository:

- `SHADE_API_BASE_URL`: `/api` or a validated HTTP(S) browser-visible API URL; default `/api`.
- `SHADE_API_UPSTREAM`: private container-network upstream used by nginx, such as `backend:8000`; required when the bundled nginx proxy is used.
- `SHADE_DIAGNOSTICS_ENABLED`: `true` or `false`; default `false`.
- `SHADE_DIAGNOSTICS_ENDPOINT`: optional public HTTP(S) endpoint; must not contain credentials, tokens, or tenant secrets.

Tenant records, branding, and privileged capabilities must be provisioned through the backend’s tenant/data model. Ansible may provision those backend records, but must not generate a frontend tenant manifest.

## Migration / Backward Compatibility

- Preserve existing Shade behavior when its current tenant data is provisioned through the approved backend contract.
- Support the existing `/api` deployment default.
- During rollout, retain neutral branding if tenant metadata is unavailable; do not block generic host startup solely because a frontend hostname allowlist lacks an entry.
- Coordinate the metadata/capability API addition with the backend repository before removing the current frontend identity code.

## Security Considerations

- Never serialize credentials, API secrets, admin tokens, or private upstream topology into `config.js` or built JavaScript.
- Keep tenant resolution proxy/backend-owned.
- Validate metadata as bounded plain data; do not accept arbitrary HTML, CSS, script, or asset paths.
- Add automated checks for prohibited tracked secret/config files and for absence of configured secret values in built artifacts.

## Tests

- Unit tests for neutral startup, metadata validation, metadata-derived branding, and backend-derived privilege capability.
- Vite/nginx template tests proving no personal hosts or fixed backend service names remain.
- Container startup tests for valid and invalid deployment environment values.
- Build/release tests proving private config and secrets are not included.
- E2E coverage for an arbitrary tenant host and the existing Shade tenant data path.

## Documentation Changes

- Document clone → configure environment → run/deploy without tracked-source edits.
- Publish the runtime environment contract and explicitly state that it is public/nonsecret.
- Document backend tenant-data provisioning as a separate responsibility.
- Remove shared-secret frontend setup instructions.
- Add security reporting guidance and licensing information.

## Acceptance Criteria

- A freshly cloned frontend can run against an arbitrary configured deployment without editing tracked source.
- No personal tenant names, domains, local paths, repository URLs, or backend service names remain in production frontend/proxy code.
- Existing Shade behavior is recovered when corresponding tenant data is supplied by the backend.
- Tenant branding/capabilities are not encoded in deployment configuration.
- No secret is tracked, bundled, emitted into runtime config, or accepted via browser-visible configuration.
- Automated tests and documentation cover the supported deployment contract.
