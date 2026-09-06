# FEAT-07 -- Tenant-Safe Client State Audit

**Status:** Ready for audit; persistence changes coordinate with `FEAT-09`.

**Dependency group:** A -- tenant isolation foundation (may run in parallel with `FEAT-06`).

**Depends on:** Shipped hostname-derived library context.

**Unblocks:** `FEAT-09`, `FEAT-11`, and `FEAT-12` release sign-off.

## Objective

Prove and enforce that browser state, query data, binary media, diagnostics, and resumable
intake work remain bound to the active hostname-derived library and media type.

## Scope

- Inventory every `localStorage`, `sessionStorage`, IndexedDB, module singleton, React Query
  key, object URL, in-memory draft, scanner result, filter snapshot, and diagnostic context.
- Define one library-context namespace primitive derived from trusted local hostname mapping;
  do not accept a tenant value from URL parameters or API content.
- Namespace resumable setup and Build Mode data by library identity and media type, including
  destination, stable client item IDs, drafts, lookup results, validation state, and save
  outcomes.
- Clear, revoke, or partition cached binary cover/artwork URLs and asynchronous work when
  library context changes.
- Verify that diagnostics contain the correct allowed library context without leaking private
  content, tokens, filenames, drafts, or data from a prior host.
- Ensure API/bootstrap errors do not create or restore an empty-library setup session.

## Acceptance criteria

- [ ] The audit result lists each persistence/cache surface, its owner, namespace, lifetime,
      and cleanup rule.
- [ ] Shared product preferences are explicitly distinguished from private tenant data; no
      private state uses an unscoped key.
- [ ] Switching between at least two known development hosts cannot reveal the other host's
      filters, destinations, drafts, lookup responses, save outcomes, query data, or imagery.
- [ ] Unknown-host rendering cannot reuse a known host's identity, API data, or object URLs.
- [ ] Pending requests and cover/artwork downloads cannot populate the next host's cache after
      a context change.
- [ ] Multi-host unit and Playwright coverage includes diagnostics, persistence, React Query,
      object-URL revocation, refresh/resume, and unknown-host behavior.
- [ ] Browser JavaScript still sends neither `X-Forwarded-Host` nor `Library-Username`.

## UI questions requiring a product decision

1. If legacy unscoped Build Mode data is found, should the app discard it silently or show a
   one-time message that the draft cannot be safely restored?
   - the latter
2. When the hostname changes in the same tab, should Shade immediately reload the application
   or reset state in place and show the new library's Home page?
   - like if i go from shade.library to jamie.library? I mean, they're different sites in my mind. 
   reloading is fine. 

## Out of scope

Cross-device draft sync, accounts, tenant switching controls, persistent React Query storage,
and changing server-side tenant routing.
