# FEAT-16 -- Versioned release artifacts

## Objective

Package the verified static build as a reproducible, inspectable artifact ready for the deployment repository.

## Dependencies

FEAT-14 (CI quality pipeline) and FEAT-15 (Podman compose/dev-deployment image) are complete. Do not redo
`.github/workflows/check.yml`, `scripts/checkBundleSize.mjs`, or the Podman image (`ci/Containerfile`, `ci/nginx.conf`,
`ci/container-entrypoint.sh`, Make `container-*` targets). This ticket owns the production tarball and the README
**deployed production** path. Do not collapse production into the Compose image.

Do not pull FEAT-17 through FEAT-25 product work into this implementation.

## Current baseline

Already in place and should be reused (not rebuilt):

- Canonical frontend release is `package.json` `version` (always read the current value; do not hard-code it). Vite
  injects it as `APP_VERSION`; the AppShell footer shows `Release ${APP_VERSION}`. `Makefile` already defines
  `APP_VERSION` for image tags. `scripts/appVersionConsistency.test.ts` asserts alignment. Runtime config does **not**
  own release.
- `make build` writes `dist/`. `make check` already type-checks, tests, builds, and enforces the main-entry gzip
  budget. Default CI does not upload `dist/`, coverage, Playwright reports, or secrets.
- `scripts/productionBuildTokenInspection.test.ts` asserts the repository-root `.env` is not copied into `dist/` and
  that `VITE_API_SECRET_KEY` **is** embedded in generated JS (accepted risk for this trusted deployment).
- Runtime config template is `public/config.js` (`apiBaseUrl`; optional `diagnostics: { enabled, endpoint }`). Omitted
  diagnostics default to disabled / `endpoint: null`. Hosting must serve a deployment-managed `config.js` with
  production values; changing it does not require a JS rebuild.
- README documents two interaction paths -- **local development** (`make run`) and **deployed development** (Podman
  image in Compose) -- plus production connectivity (exact origin in `CORS_ORIGINS`, or a same-origin proxy) and
  production-host HTTPS / CSP / security headers / SPA fallback / production `config.js`. `make preview` is not the
  Compose path and is not deployed production.
- FEAT-15 `ci/nginx.conf` is the **dev-image** reference for SPA `try_files`, `Cache-Control: no-cache` on
  `index.html` / `config.js`, and long-lived hashed `/assets/`. Do not ship that image as production. Document the same
  host behaviors for the tarball; do not copy the Containerfile into the archive.
- Product journeys already have automated coverage (Playwright against Vite; colocated tests for shelves, backup
  download, lifecycle). Hardware/browser matrices remain `docs/baselines/FEAT-06_scanner-support.md` and
  `docs/baselines/FEAT-12_browser-support.md`. Do not recreate those suites as a second fake-API stack.
- `/admin/backup` is still a shipped product route (`BackupLibraryPage` / `backupApi.get`). Do not remove it here.

There is no Make target, script, checksum, or manifest that packages `dist/` as a versioned tarball. README still
says there are two ways to interact with this project.

## Remaining scope

### 1. Deterministic tarball, checksum, and manifest

- Add a Make target (not `container-build`) that packages the exact successful `dist/` tree. Prefer gitignored output
  under `ci/artifacts/` so the deployment repository can consume a stable path (backend already uses
  `ci/artifacts/shade-library-<version>.tar.gz`; frontend filename is still TBD there).
- Name the archive so it **includes** `package.json` `version` (same string as `APP_VERSION`). A commit identifier may
  be included, but the package version is required. Do not hard-code the version.
- Repeated builds from identical declared inputs produce equivalent archive contents in deterministic order.
- Generate a SHA-256 checksum of the archive.
- Generate a manifest containing version, commit, build time, expected runtime-config shape (`apiBaseUrl` plus optional
  `diagnostics`), and hosting requirements (SPA fallback, HTML/config revalidation, long-lived hashed assets, HTTPS /
  CSP owned by the host). Filename, in-app `APP_VERSION`, and manifest version/commit must agree.
- Include only deployable static assets and the public runtime-config template. Exclude source, `.env`, `node_modules/`,
  coverage, Playwright output, Podman/dev files, SQL dumps, and database files.
- Keep packing off the default CI artifact upload. Do not retain secret-bearing archives in GitHub Actions. Inspection
  tests belong in `make check`; the pack target itself may stay opt-in (like `container-build`).

### 2. Automated artifact inspection

Extend (do not replace) `scripts/productionBuildTokenInspection.test.ts`. Reject `.env`, other source secrets,
dependency trees, source caches, development files, and SQL/database files inside the archive. Do **not** fail because
hashed JS contains the build-time Bearer token -- that is already required and documented.

### 3. Production-like verification

Verify a production-like host serving the extracted tarball (not Vite `make run`, not the FEAT-15 Compose image):

- Deployment-managed `config.js` with production `apiBaseUrl` / diagnostics.
- Protected API access with the baked Bearer token.
- Exact frontend origin in backend `CORS_ORIGINS`, or a same-origin reverse proxy; preflight; `Authorization` and
  `Content-Type` permitted. Cookies / credentialed CORS are not used.
- JavaScript can read backup `Content-Disposition` (the SPA still downloads `GET /backup` on `/admin/backup`).
- Direct-route SPA fallback; revalidated `index.html` / `config.js`; long-lived immutable `/assets/`.

### 4. README deployed-production path and handoff

Add a third interaction path: **deployed production** (this versioned tarball plus the deployment repository). Keep
FEAT-15's two paths distinct. Document how to build the tarball, that its name includes `package.json` `version`,
checksum/manifest expectations, extraction/contents, and that HTTPS / TLS / host install remain with the deployment
repository.

Extend existing production-host notes rather than rewriting them. Still missing from the handoff (PLAN.md section 11
and the operational handoff gate): cache-header requirements for the **tarball** host, network restriction because the
browser token is a shared secret, atomic install/rollback, supervision, health checks, and checksum/manifest retention.
Point at `docs/baselines/FEAT-12_browser-support.md` for browser support; do not duplicate that matrix. Restate the
accepted baked-token risk; do not invent a second auth model.

Document a smoke checklist for the extracted artifact: env/config verification, dashboard, list, create (including
shelf selection), shelves catalog create/edit/delete, checkout, check-in, mark-read, delete, restore, and authenticated
backup download. Reuse existing product coverage; this is host/config confirmation, not a parallel e2e stack.
Backup checks: non-empty SQL attachment, safe filename handling, recoverable generation `500`, and no bogus download
or retained/inspected SQL contents after failure.

## Acceptance criteria

- Repeated builds from identical declared inputs produce equivalent archive contents in deterministic order.
- Artifact name includes `package.json` `version` (same string as `APP_VERSION`). Artifact name, application release
  identifier, manifest version/commit, and checksum agree.
- The checksum validates before and after transfer/extraction.
- Extraction produces no `.env`, source secret file, dependency tree, development cache, SQL dump, or other
  non-deployable source file. Embedded Bearer values in hashed JS remain the accepted build-time token design.
- A production-like host verifies runtime configuration, protected API access, CORS/preflight or proxy behavior,
  permitted `Authorization`/`Content-Type`, readable backup `Content-Disposition`, direct-route SPA fallback,
  revalidated HTML/config, and long-lived immutable asset caching.
- The smoke checklist above passes against that host.
- The deployment handoff covers every remaining requirement in `../product-docs/PLAN.md` Workstream 12 packaging,
  artifact gate, operational handoff, and definition of done without implementing Ansible, systemd, TLS, or rollback
  here.
- `README.md` documents three ways to interact with this project: local development, deployed development (FEAT-15),
  and deployed production (this tarball / deployment-repository path). Production is not described as another Podman
  image.
- No critical/high defect, serious accessibility violation, exposed `.env`/dump in the archive, or release-blocking
  contract mismatch remains.
- `make check` passes.

## Plan coverage

The packaging and documentation remainder of Workstream 12 (CI and Podman portions already shipped); artifact and
operational handoff gates; the complete definition of done for the production tarball.

## Out of scope

Remote transfer, Ansible, systemd, TLS provisioning, production static-server configuration, and rollback
implementation. Do not add containerized Vite/HMR, a Compose file in this repo, or secret-bearing CI artifact uploads.
Do not change the FEAT-15 image to serve as the production unit.
