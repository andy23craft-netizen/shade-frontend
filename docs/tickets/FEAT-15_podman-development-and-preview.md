# FEAT-15 -- Podman container for compose (dev deployment)

## Objective

Package the production-built static site into a Podman image meant to run in a Podman Compose stack with the Shade
backend. This is the **dev deployment** path, not local Vite development and not production.

## Three deployment modes

This repository has three distinct ways to run the frontend. Do not collapse them.

| Mode | How it runs | Owner |
| ---- | ----------- | ----- |
| Local development | Host `make run` (Vite, hot reload, `.env`, `public/config.js`). Already shipped. | Done; not this ticket |
| Dev deployment | Podman image serving the optimized `dist/` build, run via Podman Compose next to the backend | This ticket |
| Production | Versioned static tarball plus the deployment repository (HTTPS, TLS, systemd, and so on) | FEAT-16 |

FEAT-15 does **not** maintain hot reloading, a containerized Vite dev server, or `make run` behavior inside Podman.
Leave host `make run` / `make preview` / `make build` as they are.

## Dependencies

FEAT-14 is complete. Reuse the existing `make check` gate, dummy `VITE_API_SECRET_KEY` for CI-style builds, and host
`make build` (`dist/`). Do not reinvent those suites or replace the host Make targets.

Versioned release tarballs remain FEAT-16. Do not pull FEAT-16 through FEAT-21 product or packaging work into FEAT-15.
Do not write the multi-service Compose file here; the orchestrator / compose stack consumes this image.

## Current baseline

The image and Make targets are shipped. User-confirmed: `make container-build`, `make container-run`,
`make container-stop`, and `make container-clean` work. Do not retest those commands for this ticket.

Preserve (do not rebuild or regress):

- Host quality gate and CI: `make check` / `.github/workflows/check.yml` (FEAT-14 complete).
- Host local development: `make run` (Vite). Out of scope for this ticket.
- Host commands the image builds on: `make build` (`dist/`), `make preview`, `make install`.
- Pinned toolchain: Node 26.7.0, Yarn 4.18.0, Corepack.
- Runtime config shape: `public/config.js` (`apiBaseUrl`, optional `diagnostics`). Application release from
  `package.json` via Vite `define` (`APP_VERSION`). Do not put `release` back into `config.js`.
- Auth: gitignored `.env` with `VITE_API_SECRET_KEY` injected at **build** time. The container does not run Vite, so
  bind-mounting `.env` at container start does not change the baked token. Dummy `test-api-token` is for CI only.
- Optional same-origin proxy: `SHADE_API_PROXY=1` -- host `make run` only; not available inside the static image.
- Registered product routes (nginx `try_files` SPA fallback covers these plus `*` not-found): `/`, `/books`,
  `/books/new`, `/books/:bookId`, `/books/:bookId/mark-read`, `/books/:bookId/reading`, `/books/:bookId/edit`,
  `/books/:bookId/delete`, `/checkout`, `/checkin`, `/loans`, `/shelves`, `/admin/deleted`, `/admin/backup`.

Shipped container definition:

- `ci/Containerfile` -- runtime-only `nginx:1.31-alpine`. HTTP on 8080. Copies host-built `dist/`. No Node/Yarn/Vite
  stage. Does not `COPY` `.env`. Healthcheck is `wget` against `http://127.0.0.1:8080/` and `/config.js` (no protected
  API routes).
- `ci/nginx.conf` -- React Router SPA `try_files` fallback; `Cache-Control: no-cache` for `index.html` and `config.js`;
  long-lived `/assets/` cache for hashed Vite output.
- `ci/container-entrypoint.sh` -- writes `/usr/share/nginx/html/config.js` at start from `SHADE_API_BASE_URL`,
  `SHADE_DIAGNOSTICS_ENABLED` (`true`/`false`), and `SHADE_DIAGNOSTICS_ENDPOINT` (empty → `null`). Changing those
  values does not require an image rebuild. Application release stays `package.json` `version` from the image build.
- `.containerignore` -- build context is the repo root; only `dist/` and the `ci/` files above are included.
- Make targets: `container-build` (runs `make build`, tags `shade-frontend:latest` and `shade-frontend:<package.json
  version>`), `container-run` (port 8080, `--rm`, the runtime-config env vars above), `container-stop`,
  `container-clean`.
- Foreign copy-paste leftovers are gone from git (`publish/`, `publish-local`, `build-local`,
  `ci/artifacts/.dockerignore`, TanStack Router comments). Staging under `ci/artifacts/` is not used.

`README.md` still documents local Vite (`make run`) and production-host assumptions. It does **not** present **local
development** and **deployed development** (this Podman image in Compose) as the two ways to interact with this repo,
and it does not document image build, tags, runtime-config env vars, CORS/origin for a compose-published frontend, or
cleanup.

## Remaining scope

- Update `README.md` so operators see **two** ways to interact with this project: **local development** (`make run`,
  Vite, already documented) and **deployed development** (build this Podman image and run it in Compose with the
  backend). Lead with that distinction; keep the existing local-dev setup/`make run` path; add Podman as a prerequisite
  for the image path. Document:
  - image name compose should pull: `shade-frontend`;
  - dual tags (`latest` and the current `package.json` `version`);
  - `make container-build` / `container-run` / `container-stop` / `container-clean`;
  - published port 8080;
  - start-time runtime config (`SHADE_API_BASE_URL`, `SHADE_DIAGNOSTICS_ENABLED`, `SHADE_DIAGNOSTICS_ENDPOINT`);
  - that `VITE_API_SECRET_KEY` is supplied at **build** time (host `.env` or a build secret) and is not changed by
    bind-mounting `.env` at container start;
  - compose-published origin vs backend CORS (exact origin in `CORS_ORIGINS`, or same-origin via the compose reverse
    proxy; default API CORS allows only the Vite origins; do not rely on the Vite dev-server proxy);
  - healthcheck coverage (frontend entry and `config.js`; no protected API routes);
  - that the Compose file itself lives in the orchestrator (not this repo);
  - cleanup (`make container-stop` / `make container-clean`; startup and shutdown must not leave generated root-owned
    repository files).
- Do not document the production tarball or production-host install here (FEAT-16). Do not present containerized Vite /
  hot reload as a third path.
- If an unused `ci/artifacts/` tree is still present on disk, delete it. Do not revive a staging publish contract.

## Acceptance criteria

- `README.md` specifies the two ways to interact with this project: local development (`make run`) and deployed
  development (this Podman image in Compose with the backend). It documents the image name, tags, Make targets,
  published port, runtime-config env vars, CORS/origin, healthcheck, and that Compose lives in the orchestrator. It does
  not treat hot-reload-in-Podman or the FEAT-16 production tarball as a FEAT-15 run path.
- `make check` passes from a clean checkout.

## Plan coverage

The Podman portion of Workstream 12 and the Podman preview artifact gate, interpreted as **compose/dev-deployment** of
the static site (PLAN's "local development" here is not Vite HMR; that remains host `make run`).

## Out of scope

- Local Vite development and hot reload (`make run` is already the local-dev path).
- Production web serving, TLS, Ansible, systemd, remote installation, rollback orchestration.
- Versioned release tarballs (FEAT-16).
- The multi-service orchestrator Compose file (this repo ships the frontend image only).
