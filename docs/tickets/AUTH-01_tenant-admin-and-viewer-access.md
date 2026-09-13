# AUTH-01 -- Tenant administrator and read-only viewer access

**Status:** Proposed

**Dependency group:** Tenant access control.

**Depends on:** Backend AUTH-01's checked-in OpenAPI and API-for-FE access-policy updates, including the tenant-bound
administrator credential lifecycle and viewer-safe read allowlist; generated API types and the existing API client.

## Objective

Make a tenant's shared library URL browseable in read-only viewer mode by default, while allowing a person with that
tenant's administrator password to explicitly enable the existing management workflows.

## Product decisions

- Opening a shared tenant URL starts in viewer mode. Viewer browsing must not require the current global API Bearer
  secret or present a secret-entry prompt.
- Provide a clear administrator sign-in entry point and an accessible password form. Never put the password,
  administrator credential, role, or secret in a URL, diagnostic payload, analytics payload, or client logs.
- Clearly communicate read-only mode without obstructing normal catalog browsing. A viewer can use only the
  backend-approved public catalog reads: browse, search, filter, sort, open allowed details, and view allowed covers
  or artwork.
- In viewer mode, do not render mutation controls or mutation-only navigation: add/edit/delete/restore/import,
  management, settings, household/profile state, circulation, checkout/check-in, read/played state, ratings/reviews,
  availability, shelf moves, stash, bulk actions, uploads, refetches, and reordering. Do not replace hidden controls
  with interactions that appear actionable but always fail.
- After the backend confirms a valid tenant-bound administrator credential, enable administrator controls for that
  tenant only. Do not infer administrator status from a cached role, configured global secret, URL value, or a prior
  tenant session.
- A sign-out action returns immediately to viewer mode. Expiry, password rotation, and documented authorization
  failures must also clear administrator UI state and safely return the user to viewer mode.
- If a formerly available administrator response becomes unauthorized, discard or redact protected state before it
  can be displayed. Preserve only safe browse context (such as a catalog route and filters) and never encourage a
  viewer to retry a blocked mutation.
- Follow the backend's published credential-handling contract exactly. The frontend must not persist a raw password;
  it must not invent credential storage, cross-tenant reuse, a refresh protocol, or an authentication fallback.

## Acceptance criteria

- [ ] A person opening a tenant's shared URL can browse every backend-approved viewer-safe catalog route without
      entering a secret, including normal navigation, search, filters, sorting, allowed detail pages, and images.
- [ ] Viewer mode has a clear, accessible read-only indication and an administrator sign-in entry point, while
      catalog browsing remains useful at narrow and wide widths.
- [ ] Viewer mode exposes no UI path to database/file-changing behavior, including all catalog management,
      personal-state actions, circulation, bulk actions, uploads, settings, wishlists, collections, quotes, labels,
      and household/profile management.
- [ ] The administrator password field has an accessible label, supports normal form submission and error feedback,
      clears appropriately after completion/failure according to the published contract, and is never included in a
      URL, browser preference storage, diagnostics, analytics, or rendered error detail.
- [ ] A successful sign-in enables existing administrator workflows only after the confirmed tenant-bound credential
      is active; the same credential is never treated as administrator access for another tenant.
- [ ] Sign-out, credential expiry, password rotation, and documented authorization failures immediately remove
      administrator controls, cancel/avoid pending protected requests as appropriate, and return the shell to viewer
      mode without leaking protected cached data.
- [ ] A viewer who reaches a stale/deep mutation route sees a safe read-only/authorization response with a useful
      browse continuation, not a mutation form, protected data, or a retry that implies permission can be granted.
- [ ] Tests cover viewer-safe navigation, hidden protected controls/routes, sign-in success/failure/rate-limit
      messaging, tenant-bound lifecycle behavior, sign-out/expiry/authorization fallback, secret redaction, and
      administrator success for representative existing workflows.

## Frontend implementation notes

- Do not implement endpoint paths, status mappings, token/cookie handling, refresh behavior, or a viewer allowlist
  until AUTH-01 publishes them in OpenAPI and API-for-FE. Generate types and extend the existing authenticated API
  layer; do not build a parallel fetch client or continue treating the build-time global Bearer secret as viewer
  access.
- Centralize access state and authorization-failure handling so route guards, navigation, mutation affordances,
  React Query queries/mutations, binary image requests, and error boundaries cannot disagree about the active mode.
- Query only the backend-designated viewer-safe resources before administrator sign-in. Gate and clear/invalidate
  admin-only query caches on sign-out, expiry, password rotation, tenant change, and authorization failure.
- Treat backend enforcement as authoritative. Frontend hiding and guards improve clarity but are not a security
  boundary; never optimistically apply a protected mutation before authorization succeeds.
- Reuse the existing application shell, forms, dialogs, status/error announcements, responsive patterns, and route
  metadata where applicable. Review every mutation-capable surface rather than limiting the work to catalog pages.

## Out of scope

Individual accounts, registration, invitations, password recovery, multi-factor authentication, roles beyond admin
and viewer, fine-grained permissions, cross-tenant administration, and making private dashboard, loan, borrower,
personal, or management information viewer-visible.
