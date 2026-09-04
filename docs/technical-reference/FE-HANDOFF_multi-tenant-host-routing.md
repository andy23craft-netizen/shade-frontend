# Frontend handoff -- Multi-tenant host routing

**Frontend status:** FEAT-07 implemented and verified. Keep this document through FEAT-08 deployment.

## Objective

Keep the existing site online while backend FEAT-04 begins requiring `X-Forwarded-Host` on every tenant-scoped API
request, then support `andy.library.spir.es` and `jamie.library.spir.es` without exposing one library's data to the
other.

## Backend contract

- The backend selects a tenant from the lowercased leftmost label of `X-Forwarded-Host`.
- Protected routes authenticate first, then require a recognized host. Missing or unknown host returns **400**
  `{"detail":"Invalid or unknown library host"}`; an explicitly empty value returns **400**
  `{"detail":"X-Forwarded-Host must be a non-empty string"}`.
- `GET /ready` is unauthenticated but requires the same host header. `GET /health`, `GET /version`, and backend docs
  remain host-independent.
- `Library-Username` is not routing input and backend FEAT-05 no longer permits it in CORS preflight.
- Backend FEAT-06 removes `GET /backup`; database export/synchronization is now an operator workflow that loops over
  the tenant allowlist. The SPA must not expose, probe, or proxy a browser backup route.
- Browser JavaScript must not attempt to set `X-Forwarded-Host`; browsers treat forwarding headers as proxy-owned.

## Required frontend and proxy changes

The frontend-owned items below are complete. FEAT-08 still owns public Caddy routing, DNS, certificates, and the
legacy-host compatibility mapping.

1. Browser API traffic is same-origin with runtime `apiBaseUrl` set to `/api`.
2. `ci/nginx.conf` forwards the trusted public host as `X-Forwarded-Host`. Coordinate the exact
   upstream header with the orchestrator/Caddy configuration; do not derive tenant identity from a client-supplied
   `Library-Username` value.
3. The Vite API proxy derives the development library host from the browser hostname and defaults bare local origins
   to `andy.localhost`, so local protected calls and `/ready` continue to work.
4. `Library-Username: shade` injection is removed from `src/api/apiClient.ts`. Browser code does not set
   `X-Forwarded-Host`.
5. Update connection checks: `/health` remains a host-free liveness probe; `/ready` must travel through the same
   tenant-aware `/api` proxy path as catalog requests.
6. Update documentation and production-like proxy tests to cover both library hosts and verify that forwarded host
   context survives Caddy -> frontend nginx -> backend.
7. `/backup` is removed from the optional Vite proxy path list and from remaining mocks, generated-client assumptions,
   navigation, or documentation. Do not replace it with a tenant-specific browser download.

## No-downtime rollout

1. Deploy proxy compatibility first. While the public site still uses its legacy hostname, explicitly map that host
   to `andy.library.spir.es` in the trusted proxy header sent to the backend.
2. Verify the currently deployed backend still works through that proxy change; it ignores `X-Forwarded-Host`.
3. Deploy the FEAT-04/05 backend only after every `/api` path, including `/ready`, carries the compatibility header
   and the deployed frontend has stopped sending `Library-Username`.
4. Bring up `andy.library.spir.es` and `jamie.library.spir.es`, preserving each public hostname through the proxy
   chain. Verify tenant isolation before advertising Jamie's URL.
5. Move runtime `apiBaseUrl` to same-origin `/api` if it is not already there. Retain the legacy-to-Andy mapping until
   bookmarks and monitoring have moved, then retire it in a separately reversible change.

Do not deploy the FEAT-04/05 backend first: the current frontend proxy does not set `X-Forwarded-Host`, and the current
browser client still requests the removed `Library-Username` CORS allowance.

## Acceptance criteria

- The legacy public site remains usable throughout deployment and resolves to Andy's library.
- Browser code does not set or accept tenant identity through `X-Forwarded-Host` or `Library-Username`.
- Both new hostnames use one SPA and same-origin `/api`, and `/ready` succeeds through each hostname.
- Requests through the Andy hostname cannot read Jamie-only catalog data, and vice versa.
- Direct backend access without the trusted forwarding header fails tenant-scoped requests with **400**.
- Vite proxy, nginx/proxy inspection tests, API-client tests, and the full frontend check pass.
- No frontend route, API wrapper, mock handler, or proxy rule depends on `GET /backup`.

## Coordination

The public-host mapping, Caddy forwarding behavior, DNS, and certificate are orchestrator-owned. Land and validate
those changes before or atomically with the FEAT-04 backend release. The required certificate covers
`*.library.spir.es`; a `*.spir.es` certificate is insufficient for these nested hostnames.
