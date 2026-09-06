# FEAT-08 -- Production Multi-Host Handoff

**Status:** Substantially complete -- Andy/Shade, Dalmo, and Jamie are live. Remaining work is
limited to verification that depends on tenant-state, identity-package, and Quote Library
tickets plus final runbook evidence.

**Dependency group:** D -- deployment gate.

**Depends on:** No dependency for the live deployment baseline. Final closure depends on
`FEAT-07` isolation evidence, production identities delivered by `FEAT-11`, and tenant quote
isolation delivered by `FEAT-12`.

**Primary owner:** Deployment/orchestrator repository. Frontend work is verification and
documentation only unless a defect is found.

## Objective

Deploy every approved library hostname through trusted TLS and reverse-proxy configuration,
preserving server-owned tenant selection and the same-origin frontend contract.

## Completed deployment baseline

- [x] All three approved library sites -- Andy/Shade, Dalmo, and Jamie -- are live.
- [x] Production serves the SPA and its static assets over the approved HTTPS hostnames with
      same-origin `/api` routing.
- [x] The trusted proxy supplies hostname context server-side; the browser sends the shared
      Bearer token and does not send `X-Forwarded-Host` or `Library-Username`.
- [x] Known production hostnames resolve through the shipped hostname-to-library behavior.
- [x] The deliberate unknown-host experience is shipped rather than exposing raw API `400`
      prose or defaulting to another tenant.
- [x] The deployed artifact/runtime configuration model supports SPA fallback, no-cache
      `index.html` / `config.js`, and long-lived hashed assets.

## Remaining acceptance criteria

- [ ] Complete `FEAT-07`'s two-known-host plus unknown-host verification for query caches,
      browser persistence, object URLs, pending requests, and diagnostics.
- [ ] After `FEAT-11`, verify that every production hostname receives only its approved name,
      copy, palette, hero/header art, metadata, and fallbacks.
- [ ] After `FEAT-12`, verify that quote records, ordering, Home selection, and fallback state
      cannot cross production hostnames.
- [ ] Record a production smoke matrix for protected read/write methods, CORS/preflight where
      applicable, authenticated cover/artwork bytes, direct-route refresh, diagnostics, and
      unknown-host behavior across the three sites.
- [ ] Record one rollout/rollback rehearsal and the hostname-to-tenant allowlisting procedure
      in the deployment runbook without publishing secrets.

## UI questions requiring a product decision

The live deployment does not wait on these polish decisions; resolve them through `FEAT-10`
and `FEAT-11` before final identity sign-off:

1. What support/contact text, if any, should the unknown-host screen show in production?
2. Should an approved hostname use its library name or the shared Shade product name in the
   document title and install metadata? Record the answer per host without changing IA.
3. Are favicon/social-preview assets tenant-specific in V2, or shared product assets?

## Out of scope

Tenant discovery, runtime switching, registration, per-tenant credentials, a frontend host
configuration page, and production image/container redesign.
