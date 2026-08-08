# FEAT-16 — Versioned release artifacts

## Objective

Package the verified static build as a reproducible, inspectable artifact ready for the deployment repository.

## Dependencies

FEAT-15.

## Scope

- Add a Make target that creates a deterministic static tarball from the exact successful `dist/` build.
- Name the artifact with the application version or commit identifier shown in the running application.
- Generate a SHA-256 checksum.
- Generate a manifest containing version, commit, build time, expected runtime-config shape, and hosting requirements.
- Include only deployable static assets and required public runtime-config templates.
- Add automated artifact inspection rejecting tokens, source secrets, dependency trees, source caches, and development
  files.
- Verify the artifact with production-like runtime configuration, approved CORS or a same-origin proxy, SPA fallback,
  and required cache behavior.
- Document build, verification, extraction, contents, browser support, known limitations, accepted token risk, and smoke
  tests.
- Document deployment-repository requirements for HTTPS, cache headers, restrictive CSP/security headers, network
  restriction, atomic install/rollback, supervision, health checks, and checksum retention.

## Acceptance criteria

- Repeated builds from identical declared inputs produce equivalent archive contents in deterministic order.
- Artifact name, application release identifier, manifest version/commit, and checksum agree.
- The checksum validates before and after transfer/extraction.
- Extraction produces no token, source secret, dependency tree, development cache, or non-deployable source file.
- A production-like host verifies runtime configuration, protected API access, CORS/proxy behavior, direct-route SPA
  fallback, revalidated HTML/config, and long-lived immutable asset caching.
- A smoke checklist passes for connection, dashboard, list, create, checkout, check-in, mark-read, delete, and restore.
- The deployment handoff covers every requirement in `docs/PLAN.md` without implementing deployment-owned systems here.
- No critical/high defect, serious accessibility violation, exposed secret, or release-blocking contract mismatch remains.
- `make check` passes.

## Plan coverage

The packaging/documentation portion of Workstream 12; artifact and operational handoff gates; the complete definition of
done.

## Out of scope

Remote transfer, Ansible, systemd, TLS provisioning, production static-server configuration, and rollback implementation.
