# Feat-01: Externalize deployment routing and move tenant identity out of the public frontend bundle

## Problem

The frontend can only run for the currently coded tenant/domain set. Personal tenant branding, hostname aliases, proxy
topology, and personal host/domain strings are tracked in source. A new installation cannot be configured solely through
deployment inputs, local `.env`, and tenant data.

## Current State

- `window.__SHADE_CONFIG__` supplies public runtime API and diagnostics configuration.
- `ci/container-entrypoint.sh` generates that file from environment values.
- `libraryContext.ts` and `libraryIdentity.ts` compile personal tenants (`andy`, `dalmo`, `jamie`), branding, and the
  `shade` hostname alias remapped to `andy` into the bundle.
- Host and domain strings such as `library.spir.es` / `spir.es` appear in tracked source, tests, and docs.
- `ci/nginx.conf` hardcodes public domains and a fixed backend upstream name.
- `.env` is ignored; `.env.example` is tracked but documents obsolete shared-secret configuration and does not document
  host/domain or tenant-list deployment inputs.
- Release packaging correctly excludes `.env` and verifies browser bundles do not include the legacy token.

## Desired Architecture

- Keep deployment concerns in the existing runtime/container configuration boundary and the gitignored root `.env`.
- Treat tenant branding, display name, theme, label prefix, and tenant capabilities as tenant-owned backend data--not
  frontend deployment configuration and not hardcoded catalogues in tracked source.
- Allow the frontend to start for any deployment host with safe neutral branding until trusted tenant metadata is
  available.
- Let the backend, using its trusted host routing, determine tenant identity. The browser must never choose a tenant by
  request header or arbitrary URL parameter.
- Keep browser runtime configuration public and nonsecret.
- Personal domains, personal tenant ids, and hostname remaps live only in local/private configuration (`.env` /
  deployment env), never in committed files.

## Scope

- Replace the compiled `andy` / `dalmo` / `jamie` hostname and branding catalogue with a generic neutral startup path
  plus a typed, trusted tenant-metadata API contract.
- Remove all `shade` → `andy` (and similar) hostname-alias remapping from frontend code. The product/project name
  "Shade" / `shade-frontend` may remain; "shade" must not appear as a tenant id, public host label, or remap target in
  tracked source.
- Remove hardcoded personal domains (`library.spir.es`, `spir.es`, and any subdomain forms built from them) from tracked
  source, tests, docs, nginx, and Vite configuration. Define the public library host domain via gitignored `.env`
  (this installation uses `library.spir.es`) and document the variable names in `.env.example` with placeholders only.
- Remove hardcoded personal tenant ids (`dalmo`, `jamie`, and the privileged `andy` catalogue) from tracked source. If a
  local multi-tenant allowlist or default local host is needed for development, drive it from `.env` (placeholders in
  `.env.example` only).
- Make nginx's backend upstream externally supplied at container startup, retaining `/api` same-origin proxying.
- Remove the stray nested package metadata and personal Cursor workspace paths.
- Replace obsolete secret guidance and stale release-manifest language.
- Update `.env.example` for the new public deployment / local host inputs (no real personal domains or tenant names).
- Add public-repository policy files and documented configuration examples that assume **cloned** sibling repos (not
  forks).

## Explicit Non-Goals

- Do not implement Ansible roles, backend provisioning, DNS, TLS, CORS, or reverse-proxy orchestration in this
  repository.
- Do not place tenant names, branding, host mappings, passwords, tokens, or API secrets into frontend runtime
  configuration (`config.js`) or other tracked source.
- Do not change backend authorization semantics or send proxy-owned tenant headers from browser code.
- Do not redesign the application's visual system beyond supporting safe neutral/default branding.
- Do not instruct users to fork repositories. Document clone-based workflows only (this frontend plus associated
  backend / orchestrator clones as needed).

## Tracked-Source Naming Boundary

Committed files in this repository must not contain:

| Prohibited in tracked files | Where it belongs instead |
| --------------------------- | ------------------------ |
| `library.spir.es`, `spir.es`, and concrete subdomains built from them | Gitignored root `.env` / deployment env (this project uses `library.spir.es` as the public library host domain) |
| `dalmo`, `jamie` as tenant ids, host labels, fixtures, or docs | `.env` / deployment env / backend tenant data when needed; tests use generic placeholders |
| `shade` as a tenant id, public host label, or remap to another tenant (e.g., `shade` → `andy`) | Remove remap code entirely; product name "Shade" / package name `shade-frontend` may remain |
| Instructions to fork any Shade-related repo | Clone-based setup docs only |

`.env.example` may list variable names and non-personal placeholders (e.g., `example.test`, `tenant-a`) so operators
know what to set locally. It must not embed the real personal domain or personal tenant strings above.

## Implementation Plan

1. Define and obtain approval for a backend tenant-metadata response, derived server-side from the resolved host.
   Include only public display/capability fields required by the frontend.
2. Refactor `LibraryContext` / `LibraryIdentity` so the initial state is neutral and host-independent; apply metadata
   only after retrieval and validation. Delete the compiled personal-tenant catalogue and all `shade` → `andy` alias
   maps.
3. Replace hardcoded privileged-tenant checks with a backend-provided capability.
4. Replace nginx's fixed upstream with startup-generated configuration from an externally supplied upstream value;
   remove personal hostname / favicon maps and use a generic default unless metadata supplies a safe asset.
5. Keep `SHADE_API_BASE_URL` and diagnostics in `config.js`; delete the legacy frontend-secret template / API path if no
   production importer remains.
6. Extend `.env` / `.env.example` for host-domain and any local-dev tenant inputs that must leave tracked source;
   tighten `.gitignore` for private deployment inputs while retaining tracked examples with placeholders only.
7. Remove personal development metadata and stale nested package metadata.
8. Sweep tracked docs, tests, and fixtures so prohibited domain / tenant strings and fork instructions do not remain.
9. Add LICENSE, SECURITY, and contributor / public-installation documentation appropriate to the chosen license and
   support policy (clone → configure `.env` → run / deploy).

## Configuration Contract

Ansible or another deployment owner must provide only public deployment values to this repository:

- `SHADE_API_BASE_URL`: `/api` or a validated HTTP(S) browser-visible API URL; default `/api`.
- `SHADE_API_UPSTREAM`: private container-network upstream used by nginx, such as `backend:8000`; required when the
  bundled nginx proxy is used.
- `SHADE_DIAGNOSTICS_ENABLED`: `true` or `false`; default `false`.
- `SHADE_DIAGNOSTICS_ENDPOINT`: optional public HTTP(S) endpoint; must not contain credentials, tokens, or tenant
  secrets.
- Public library host domain (name TBD in `.env.example`, e.g. a `SHADE_LIBRARY_HOST_DOMAIN` or equivalent): set in
  gitignored `.env` for this installation to `library.spir.es`; never commit the concrete value.

Tenant records, branding, and privileged capabilities must be provisioned through the backend's tenant / data model.
Ansible may provision those backend records, but must not generate a frontend tenant manifest. Local multi-tenant ids
needed only for developer host simulation belong in `.env`, not in tracked catalogues.

## Migration / Backward Compatibility

- Preserve existing product behavior when current tenant data is provisioned through the approved backend contract and
  local / deployment `.env` supplies the public host domain.
- Support the existing `/api` deployment default.
- During rollout, retain neutral branding if tenant metadata is unavailable; do not block generic host startup solely
  because a frontend hostname allowlist lacks an entry.
- Coordinate the metadata / capability API addition with the backend repository before removing the current frontend
  identity code.
- Do not preserve `shade` → `andy` remapping in frontend code; if that alias is still required operationally, it
  belongs in proxy / backend host routing or private env--not in this repo's tracked source.

## Security Considerations

- Never serialize credentials, API secrets, admin tokens, or private upstream topology into `config.js` or built
  JavaScript.
- Keep tenant resolution proxy / backend-owned.
- Validate metadata as bounded plain data; do not accept arbitrary HTML, CSS, script, or asset paths.
- Add automated checks for prohibited tracked secret / config files, absence of configured secret values in built
  artifacts, and absence of prohibited personal domain / tenant strings in tracked source.

## Tests

- Unit tests for neutral startup, metadata validation, metadata-derived branding, and backend-derived privilege
  capability.
- Vite / nginx template tests proving no personal hosts, personal tenant ids, or fixed backend service names remain in
  tracked templates.
- Container startup tests for valid and invalid deployment environment values.
- Build / release tests proving private config and secrets are not included.
- E2E coverage for an arbitrary tenant host using generic placeholders (not personal `dalmo` / `jamie` / `spir.es`
  strings).
- A tracked-source policy check (or equivalent assertion) that committed files do not contain `library.spir.es`,
  `spir.es`, `dalmo`, `jamie`, or `shade`-as-tenant / remap usage outside the allowed product/package name.

## Documentation Changes

- Document clone → configure gitignored `.env` (from `.env.example`) → run / deploy without tracked-source edits.
- Do not instruct readers to fork repositories; associated projects are used as clones.
- Publish the runtime environment contract and explicitly state that it is public / nonsecret where applicable.
- Document backend tenant-data provisioning as a separate responsibility.
- Remove shared-secret frontend setup instructions.
- Update `.env.example` for host-domain and any local-dev inputs with placeholders only.
- Add security reporting guidance and licensing information.

## Acceptance Criteria

- A freshly cloned frontend can run against an arbitrary configured deployment without editing tracked source.
- No personal tenant names (`dalmo`, `jamie`, hardcoded privileged `andy` catalogue), personal domains
  (`library.spir.es`, `spir.es`), local paths, or backend service names remain in production frontend / proxy code or
  other committed files (except `.env.example` placeholders that are clearly non-personal).
- No `shade` → `andy` (or similar) hostname remap remains in tracked frontend code; "shade" appears only as the
  product / package name where appropriate.
- Existing product behavior for this installation is recovered when corresponding tenant data is supplied by the backend
  and `.env` supplies `library.spir.es` (or the equivalent documented variable).
- Tenant branding / capabilities are not encoded in deployment configuration or tracked frontend catalogues.
- No secret is tracked, bundled, emitted into runtime config, or accepted via browser-visible configuration.
- Documentation never tells users to fork; setup is clone-based.
- Automated tests and documentation cover the supported deployment contract, including the tracked-source naming
  boundary.
