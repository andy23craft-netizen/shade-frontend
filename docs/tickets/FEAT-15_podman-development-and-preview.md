# FEAT-15 — Podman development and preview

## Objective

Provide a reproducible Podman-compatible environment for local development and production-build previews.

## Dependencies

FEAT-14.

## Scope

- Add a Podman-compatible container definition and ignore file.
- Support both the documented development workflow and serving an optimized `dist/` build for preview.
- Inject public runtime configuration when the container starts so API URL and release ID changes do not rebuild the
  image.
- **Copy or bind-mount** the repo-root `.env` into the container at startup so Vite can read `VITE_API_SECRET_KEY`
  during development and preview workflows (FEAT-05). Operators maintain a local gitignored `.env`; prefer bind-mount
  over baking `.env` into image layers when feasible. Do not log the token value.
- Serve client routes with an SPA fallback and appropriate preview cache behavior.
- Add Make targets and documentation for image build, development startup, preview startup, configuration, and cleanup.
- Add a container health/smoke check that does not require storing protected credentials in the image.
- Document clearly that this image is a local/preview convenience and not the production deployment unit.

## Acceptance criteria

- A clean checkout can build and start the image using documented prerequisites.
- Development mode supports the normal repository workflow, and preview mode serves the same optimized assets produced
  by the production build.
- Changing API URL or release ID at startup requires no image rebuild.
- Direct navigation to every client route receives the application entry point.
- The container has access to the repo-root `.env` file (copied or bind-mounted at startup) for
  `VITE_API_SECRET_KEY`. Image layers, build arguments, runtime configuration templates, and logs do not embed or log
  the token value. Built JS may contain the build-time secret after FEAT-05 (same as non-container production builds).
- The health/smoke check verifies that the frontend and runtime configuration are available.
- Container startup and shutdown do not leave generated root-owned repository files.
- `make check` passes.

## Plan coverage

The Podman portion of Workstream 12 and the Podman preview artifact gate.

## Out of scope

Production web serving, TLS, Ansible, systemd, remote installation, and rollback orchestration.
