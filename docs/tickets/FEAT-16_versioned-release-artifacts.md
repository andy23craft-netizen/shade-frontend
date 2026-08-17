# FEAT-16 -- Versioned release artifacts

## Objective

Package the verified static build as a reproducible, inspectable artifact ready for the deployment repository.

## Dependencies

FEAT-15 (Podman compose/dev-deployment image, including README coverage of **local development** and **deployed
development**). Do not redo that image work here. This ticket owns the production tarball and the README **deployed
production** path.

## Scope

- Add a Make target that creates a deterministic static tarball from the exact successful `dist/` build.
- Name the tarball so it **includes** the `version` field from `package.json` (always read the current value; do not
  hard-code it). That string is the same canonical release as `APP_VERSION` / the footer `Release` label. A commit
  identifier may be included as well, but the package version is required in the filename. The filename, in-app release
  identifier, and manifest version must agree.
- Generate a SHA-256 checksum.
- Generate a manifest containing version, commit, build time, expected runtime-config shape, and hosting requirements.
- Include only deployable static assets and required public runtime-config templates.
- Add automated artifact inspection rejecting tokens, source secrets, dependency trees, source caches, and development
  files, including SQL backup or database files.
- Verify the artifact with production-like runtime configuration, the frontend's exact origin in backend
  `CORS_ORIGINS` or a same-origin proxy, exposed `Content-Disposition`, SPA fallback, and required cache behavior.
- Document build, verification, extraction, contents, browser support, known limitations, accepted token risk, and smoke
  tests.
- Update `README.md` to add the third way to interact with this project: **deployed production** (this versioned
  tarball plus the deployment repository). Keep FEAT-15's two paths -- **local development** (`make run`) and **deployed
  development** (Podman image in Compose) -- and do not collapse production into the compose image. Document how to
  build the tarball, that its name includes `package.json` `version`, checksum/manifest expectations, and that HTTPS /
  TLS / host install remain with the deployment repository.
- Document deployment-repository requirements for HTTPS, cache headers, restrictive CSP/security headers, network
  restriction, atomic install/rollback, supervision, health checks, and checksum retention.

## Acceptance criteria

- Repeated builds from identical declared inputs produce equivalent archive contents in deterministic order.
- Artifact name includes `package.json` `version` (same string as `APP_VERSION`). Artifact name, application release
  identifier, manifest version/commit, and checksum agree.
- The checksum validates before and after transfer/extraction.
- Extraction produces no token, source secret, dependency tree, development cache, or non-deployable source file.
- A production-like host verifies runtime configuration, protected API access, CORS/preflight or proxy behavior,
  permitted `Authorization`/`Content-Type`, readable backup `Content-Disposition`, direct-route SPA fallback,
  revalidated HTML/config, and long-lived immutable asset caching.
- A smoke checklist passes for env verification, dashboard, list, create (including shelf selection), shelves
  catalog create/edit/delete, checkout, check-in, mark-read, delete, restore, and authenticated backup download.
- Backup verification covers a non-empty SQL attachment, safe server/fallback filename handling, recoverable
  generation `500`, and no bogus download or retained/inspected SQL contents after failure.
- The deployment handoff covers every requirement in `../product-docs/PLAN.md` without implementing
  deployment-owned systems here.
- No critical/high defect, serious accessibility violation, exposed secret, or release-blocking contract mismatch
  remains.
- `README.md` documents three ways to interact with this project: local development, deployed development (FEAT-15),
  and deployed production (this tarball / deployment-repository path). Production is not described as another Podman
  image.
- `make check` passes.

## Plan coverage

The packaging/documentation portion of Workstream 12; artifact and operational handoff gates; the complete
definition of done.

## Out of scope

Remote transfer, Ansible, systemd, TLS provisioning, production static-server configuration, and rollback
implementation.
