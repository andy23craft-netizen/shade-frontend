# PLAN-02 — Multi-Tenant Library Handling

**Status:** Planning decomposition of the definitive V2 scope. Not an implementation ticket.

**Backend alignment:** Backend PLAN-02 multi-tenant support.

**Authority:** `PRODUCT_REQS.V2.definitive.md` remains the product source of truth. Backend PLAN-02, implemented
OpenAPI, `API-for-FE.md`, and deployment configuration remain authoritative for tenant routing and operations.

## Goal

Run one trusted Shade deployment for a small allowlist of independently isolated libraries. Each hostname opens one
person's library, uses the same SPA and API process, and routes every protected request to that library's SQLite file.

This is household/friends infrastructure, not SaaS tenancy. V2 does not introduce accounts, login sessions, runtime
registration, per-user authorization, or cross-library discovery.

## Scope boundary

This plan owns the frontend consequences of:

- hostname-derived library identity;
- trusted-proxy `X-Forwarded-Host` tenant routing;
- the `andy` and `jamie` allowlist and per-library database separation;
- per-library theme tokens and unknown-host behavior;
- local `*.localhost` development hosts;
- multi-host CORS/TLS/deployment coordination;
- tenant-scoped settings, assets, backups, and schema application; and
- isolation acceptance tests.

Album behavior belongs to PLAN-01. Shared setup UI and feature behavior belong to PLAN-03, although both must operate
inside the tenant context established here.

## 1. Library identity and isolation

- One FastAPI process and one shared frontend serve a small configured allowlist.
- Each library uses its own SQLite file. Initial mappings are `andy` → `data/andy.db` and `jamie` → `data/jamie.db`.
- Username, leftmost hostname label, theme-map key, and database filename stem remain 1:1:1.
- All catalog, placement, collection, wishlist, loan, Dashboard, settings, and later album data is structurally isolated
  by file rather than tenant columns or query predicates.
- Friends never see or browse one another's libraries.
- Adding another library is an operations/configuration change: allowlist, database file, DNS/Caddy host, certificate
  coverage, theme tokens, and backup iteration. There is no registration UI.

## 2. Authentication and request context

Every protected business request sends:

```http
Authorization: Bearer <API_SECRET_KEY>
```

The browser never sends tenant identity. The trusted same-origin proxy derives `X-Forwarded-Host` from the public
request host. Missing/invalid Bearer authentication returns `403` before tenant validation. Missing, unknown, or
disallowed forwarding context returns a generic `400` without exposing the allowlist.

`X-Forwarded-Host` is proxy-owned routing context, not a credential. The backend must not trust a forwarding header
supplied through direct public access.

Public health, version, API-documentation, and OpenAPI routes remain host-independent even when reached through the
same proxy.

## 3. Hostnames and navigation

Initial production hostnames are:

- `shade.library.spir.es` (public alias for tenant `andy`)
- `jamie.library.spir.es`

The leftmost label is authoritative. Do not add `www.` variants and do not redirect both libraries to a shared canonical
hostname. Each hostname serves the same SPA and same-origin `/api` proxy while preserving its own tenant context.

There is no ordinary library switcher. Opening the other hostname is the switch. Browser navigation within a library
must never mutate tenant identity through a query parameter, local preference, or display text.

Unknown hostnames render a deliberate generic themed unknown-library landing page. The page must not list valid
libraries or fall through to Andy's data.

## 4. Local development

Everyday Vite testing uses:

- `http://andy.localhost:5173`
- `http://jamie.localhost:5173`

Vite must accept those host values. Backend CORS must allow both origins plus any deliberately retained bare localhost
origins used to exercise unknown-library behavior. A query-string or environment override may exist only as a documented
emergency development fallback; it is not the normal routing model.

Local and browser tests must prove that identical frontend code derives different headers and themes from the two
hosts. Production-like Caddy testing remains an orchestrator concern.

## 5. Per-library theming

The hostname label selects one hardcoded set of owner tokens, such as colors and wordmark, from the same allowlisted map
used for known-host presentation. These are owner/library identities, distinct from the book-versus-album media
identities in PLAN-01 and PLAN-03.

V2 does not require a backend theme editor or preference resource. Theme choice does not travel as a user setting; it
is determined by the active hostname. Scanner preferences, print defaults, and comparable device choices remain local
browser preferences unless another contract explicitly promotes them.

## 6. Tenant setup and settings

Each new tenant begins with the final schema and required system locations only. Andy's existing catalog moves to
`andy.db`; it must never seed into Jamie's database. Jamie and later tenants choose the validated TSV bootstrap or
guided setup flow from PLAN-03.

Setup state and library settings are tenant-scoped durable backend data. Proposed setup states are `required`,
`in_progress`, `complete`, and `failed`. Draft wizard and Bulk Add sessions remain frontend-owned and must be namespaced
by library identity even though production hostnames ordinarily provide separate browser-storage origins.

Library settings include Enable Loans, configured book TBR shelf IDs, and the optional Reserved/will-call shelf ID.
They follow the library across devices. TBR rules reference stable shelf UUIDs rather than mutable names.

## 7. Databases, migrations, and assets

The existing `app.db` is retired as the production runtime database. The V1 catalog moves atomically to `andy.db` with
a verified rollback copy. New tenant databases receive schema and system locations without another tenant's seed rows.

Every V2 schema migration applies independently to every allowlisted database. A failure for one tenant must not be
interpreted as a valid empty tenant or silently create a replacement database. Migration/cutover implementation and
release gates belong to PLAN-03.

File-backed covers, album artwork, and signatures live in tenant-specific directories. The frontend never sees those
paths; authenticated business routes select the active tenant and serve bytes.

## 8. Backups and restore boundaries

Database export and synchronization are operator workflows that iterate the tenant allowlist. There is no browser
backup endpoint, backup page, or ordinary restore UI in V2.

The automated job invokes the scoped backup once per allowlisted library and retains one dump plus manifest per tenant.
Unchanged content is deduplicated per tenant. A job that backs up only the last-used or default library is incomplete.

Restore is an operator workflow. It requires an explicit tenant and recognized artifact, validates into a temporary
database, creates a pre-restore safety copy, atomically swaps only the selected tenant after verification, and rolls back
on failure. Other tenants should remain available where engine isolation permits. Detailed restore mechanics and release
testing belong to PLAN-03.

## 9. Cross-repository handoffs

### Backend

- Tenant allowlist and `DB_DIR` configuration.
- One engine/session factory per allowlisted database.
- Header validation and dependency ordering.
- Per-file bootstrap and migrations.
- Tenant-scoped backup and full-instance backup iteration.
- Isolation and failure tests.
- CORS and synchronized OpenAPI/`API-for-FE.md`.

### Frontend

- Derive the library name from the hostname.
- Send it on every authenticated request and omit it on public requests.
- Configure the `andy`/`jamie` token map and unknown-host page.
- Permit `*.localhost` development hosts.
- Namespace browser-persisted setup/Bulk Add state.
- Remove or avoid browser backup/restore product surfaces.
- Exercise both tenant hosts in integration/e2e coverage.

### Orchestrator

- DNS and Caddy host lists.
- The acquired `*.library.spir.es` certificate or equivalent SAN coverage.
- Same-origin `/api` routing on both hosts.
- Persistent volumes for every database and tenant asset directory.
- Tenant environment configuration, backup scheduling, and rollback retention.

## Open design dependency

The definitive questions document asks which concrete visual references/assets are approved for each hosted library
identity as part of the broader book, album, and library-wide design brief. PLAN-02 does not reopen the architecture:
hostname-owned themes and one token set per known library are settled. The remaining dependency is the approved visual
content for Andy, Jamie, and future configured identities. The full question remains owned by PLAN-03 to avoid creating
three conflicting asset inventories.

## Completion criteria

- Andy and Jamie hostnames load the same SPA while producing distinct tenant headers, tokens, and isolated data.
- Protected requests require Bearer authentication and a valid tenant header in the defined order.
- Unknown hosts and tenant errors reveal no allowlist details and never fall back to another database.
- Books, albums, shelves, Collections, Wishlists, loans, Dashboard data, settings, backups, and assets remain isolated.
- New tenants receive only final schema and required system locations.
- Schema changes, backup jobs, and restore tooling cover every allowlisted database.
- Local `*.localhost`, deployed HTTPS, CORS, and same-origin `/api` behavior are tested.
- No ordinary tenant switcher, login/account system, registration UI, or browser restore surface is introduced.

## Deferred

- Per-user API secrets, login/logout, sessions, and fine-grained authorization.
- Runtime tenant registration or deletion.
- Cross-library search, browsing, lending, or shared catalogs.
- Large-scale tenancy and horizontal database routing.
- Backend-authored theme editing or user-selectable tenant identities.
