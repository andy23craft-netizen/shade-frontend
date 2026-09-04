# FEAT-07 -- Frontend hostname library context

**Status:** In progress

## Objective

Derive library context from the hostname for theming and unknown-host UX. Stop sending `Library-Username`. Support local
`*.localhost` hosts, bare `localhost` / `127.0.0.1`, and deployed `*.library.spir.es` hosts. Ensure the API proxy sets
`X-Forwarded-Host` for backend tenant selection.

## Acceptance criteria

- [ ] With the backend allowlist active, `andy.localhost` only reads/writes Andy's catalog; `jamie.localhost` cannot see
      those rows.
- [ ] Bare `localhost` / `127.0.0.1` load a working Andy library experience.
- [ ] Authenticated requests do not send `Library-Username`.
- [ ] Deployed `https://andy.library.spir.es` and `https://jamie.library.spir.es` use the same hostname rules (no
      special-case parser).

## Out of scope

- Backend tenant resolution.
- Caddy/DNS/Compose.
- Per-user login or library switcher UI.
- In-browser backup download UI.
