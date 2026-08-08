# FEAT-01: Stand Up the Frontend Shell

## Summary

The frontend shell is implemented and its quality gate passes. Two toolchain-interface issues remain before this
ticket is complete.

## Remaining Work

### Restore the documented development command

The `Makefile` currently exposes `run`, while the repository's documented command and package script use `dev`.

- Replace the `run` target with a phony `dev` target that delegates to `yarn dev`.
- Keep `README.md` and the Make interface aligned on `make dev`.

### Pin a supported Node.js release

Node.js 20 reached end of life on April 30, 2026, so the current `20.19.2` pin is no longer suitable for a
production-oriented scaffold.

- Select a supported LTS release.
- Record the exact same version in `.nvmrc`, `package.json#engines.node`, and the README prerequisites.
- Confirm Yarn 4.1.0 and the existing dependency set work with the selected release.

## Acceptance Criteria

- `make dev` starts the Vite development server.
- `.nvmrc`, `package.json`, and `README.md` consistently specify a supported Node.js LTS release.
- `make install` succeeds from a clean checkout with the pinned Node and Yarn versions.
- `make check` passes with the pinned toolchain.

## Verification

1. Activate the Node.js version in `.nvmrc` and enable Corepack.
2. Remove generated dependency and build directories.
3. Run `make install`.
4. Run `make check`.
5. Run `make dev` and confirm the application loads.
