# Kinbote–Shade Integration Contract

**Status:** Proposed contract and implementation dependency
**Scope:** The versioned boundary between Shade and the standalone Kinbote service. The staged implementation order is in [[kinbote-software-build-plan]]; data, deployment, and operational detail is in [[kinbote-technical-dependencies]].

Kinbote turns approved Shade library intent into temporary physical shelf output. Shade remains the public, authenticated library API and the authority for books, shelves, placement, filtering, and user permissions. Kinbote owns physical maps, calibration, display sessions, controller configuration, and translation to physical-light providers.

Ordinary Shade workflows must remain available when Kinbote, its database, WLED, Home Assistant, or the LAN is unavailable.

------------------------------------------------------------------------

## 1. Non-negotiable boundary

| Concern | Shade | Kinbote |
|---|---|---|
| Books, shelves, placement, filters, loans, and user authorization | Authoritative owner | Consumes approved stable IDs only |
| Map freshness | Decides when a catalog change invalidates a map | Records invalidation, reports status, and reconciles missed delivery |
| Spatial map revisions and positions | Authorizes and presents the lifecycle | Stores drafts/revisions and validates physical projection |
| Controller endpoints, calibration, credentials, and commands | Must not hold or expose them | Owns them and sends curated provider commands |
| Browser access | Browser calls only Shade | No browser command path for ordinary library workflows |

Kinbote must never read Shade's database, independently query or filter Shade's catalog, infer placement from display names, or mutate catalog placement. Shade and its frontend must never calculate pixels, store controller credentials, proxy arbitrary WLED payloads, or treat a browser request as controller authority.

Home Assistant is an optional peer integration, not an alternate catalog or authorization path. It may consume only approved Kinbote status/actions and may not bypass Shade to issue catalog-derived display requests.

------------------------------------------------------------------------

## 2. Access and trust model

- Shade authorizes the user before a physical action reaches Kinbote. Hiding a frontend control is not authorization.
- The frontend calls Shade's authenticated API only. It receives neither Kinbote service credentials nor controller details.
- Shade-to-Kinbote traffic uses narrowly scoped, rotatable machine credentials, correlation IDs, and versioned contracts. Kinbote has no public listener, public DNS record, or router port-forward.
- Physical-display controls are a trusted home-Wi-Fi capability. Shade determines that capability from trusted router/proxy network information, never a client-supplied header or JavaScript claim. The canonical public Shade hostname must be tested from home Wi-Fi through router hairpin NAT; remote users retain ordinary catalog access but not physical-control capability.
- NFC/QR tags carry stable shelf identity/navigation only. They must not carry credentials, writable commands, controller endpoints, or authorization tokens.

------------------------------------------------------------------------

## 3. Required Shade inputs

Shade supplies only the minimum authorized, versioned facts Kinbote needs:

- Stable `book_id` per physical copy and stable `shelf_id` per shelf. Names and labels are display data only; a shelf rename cannot alter a physical reference.
- A canonical physical-ready `book_id → shelf_id` relationship, including explicit unplaced, unshelved, stashed, and non-physical states where applicable.
- Already resolved and re-authorized `book_id` values for display requests. Kinbote receives IDs, never a filter expression or catalog query.
- A server-generated authorization/capability context for the requested high-level action, including the home-LAN physical-control decision where required.
- Versioned display-session requests with correlation ID and idempotency key, bounded requested duration, mode, and explicit replace/clear semantics.
- Map summary/revision and freshness or stale reason when it is needed to evaluate a request.
- Authorized expected current shelf contents, current revision, and freshness only for mapping or reconciliation work.
- Placement-change invalidation events identifying every affected shelf. This covers single and bulk moves, imports/adds, wishlist/owned/shelved/stash transitions, delete/restore placement changes, shelf retirement, and declared rearrangement. Source and destination shelves in a bulk change are identified atomically.

### Display request rule

```text
Shade query or selection
        ↓
Shade resolves and authorizes stable book_ids
        ↓
Shade calls Kinbote with high-level session intent
        ↓
Kinbote evaluates map/calibration/controller availability
```

Kinbote may report that supplied IDs are mapped, stale, unmapped, unavailable, or failed. It never decides whether they match a Shade search or whether the user may select them.

------------------------------------------------------------------------

## 4. Kinbote outputs and commands

Kinbote exposes high-level, versioned internal operations only:

```text
POST   /v1/display-sessions
GET    /v1/display-sessions/{session_id}
DELETE /v1/display-sessions/{session_id}

GET    /v1/shelves/{shelf_id}/map-status
GET    /v1/controllers/health
GET    /health/live
GET    /health/ready
```

Exact paths may evolve only through explicit contract versioning. A display-session create request contains stable IDs, a presentation mode, bounded duration, replacement intent, correlation ID, and idempotency key—not shelf names, pixels, WLED JSON, controller configuration, or catalog filters. Clear is safe to retry.

For every session, Kinbote returns safe, presentation-ready information:

- Session identity, lifecycle status, expiry, correlation ID, and stable failure code.
- Requested, displayable, unmapped, stale, unavailable, and failed counts plus per-item/per-shelf outcomes.
- `accepted`, `active`, `partial`, `clearing`, `completed`, `failed`, and `expired` state as appropriate. Shade must not claim physical indication until the returned session state supports it.
- Per-shelf map status, controller/service health, and safe diagnostics. Provider endpoints, credentials, raw payloads, and unfiltered provider errors are never returned.
- Idempotent placement-invalidation acknowledgement and reconciliation status.
- Map draft/revision/audit status and, later, photo-analysis job/proposal state. Kinbote never publishes a map or changes catalog placement without Shade-authorized user confirmation.

Provider failures must translate to stable outcomes such as `unavailable`, `failed`, `stale`, `unmapped`, `partial`, and `expired`. One failed controller must not prevent reachable shelves from participating in a multi-shelf request.

------------------------------------------------------------------------

## 5. Map lifecycle and freshness

Kinbote stores physical map drafts, immutable confirmed revisions, normalized positions, and calibration separately from Shade's catalog records. Publishing a confirmed map creates a new current revision atomically and supersedes, rather than rewrites, the prior revision.

Shade mediates mapping actions and supplies expected current shelf contents. Kinbote must reject publication or position-level use when Shade reports that placement changed during mapping, returning a stale/conflict result instead of guessing a new shelf assignment or position. CV/OCR may create a review-only proposal; only explicit user confirmation through the same draft/review/publish flow can create a current revision.

A placement event marks the relevant Kinbote projection stale. Kinbote must not silently repair it from labels or historical data. Stale maps remain inspectable but cannot be presented as current or used for precise output.

------------------------------------------------------------------------

## 6. Delivery, recovery, and rollout

The one-shelf prototype may use a synchronous Shade-to-Kinbote session request after the Stage 1 contract and Stage 3 hardware gate have passed. It still requires authentication, idempotency, bounded expiry, safe clear, and truthful result states.

Before multi-shelf physical-display features, Shade records placement changes and outbound physical events in a transactional outbox. Events have stable IDs and versioned payloads; Kinbote consumes them idempotently. Delivery supports retry/backoff and observable failure. A Kinbote outage never rolls back an otherwise valid Shade write.

Both sides provide a reconciliation path that rebuilds truthful Kinbote freshness state after missed events or restart. On restart, Kinbote reconciles and clears expired physical output before accepting new commands. Maps and calibration are backed up separately from Shade and restoration includes calibration verification before output is re-enabled.

All capabilities ship behind a configuration/capability gate. A disabled or failed physical feature returns an honest optional status; it must not hide books or block browsing, intake, moves, loans, or other normal Shade operations.

------------------------------------------------------------------------

## 7. Contract acceptance criteria

This contract is ready for a stage only when:

- Producer and consumer share versioned fixtures and pass contract tests for accepted, active, expired, cleared, stale, unmapped, unavailable, partial, duplicate-event, and retry cases.
- Shade re-authorizes resolved IDs server-side and Kinbote does not receive filter expressions, browser authority, or controller secrets.
- Placement changes atomically identify every affected shelf, and missed delivery can be reconciled without altering Shade catalog truth.
- The frontend displays truthful safe states and physical failure leaves the underlying Shade operation successful.
- Health, structured correlation logging, migration/release rollback, credential rotation, backup/restore, and hardware-in-the-loop checks meet the applicable stage gate in [[kinbote-software-build-plan]].

This contract intentionally does not prescribe Kinbote's internal schema, physical provider implementation, or hardware installation sequence; those decisions belong to [[kinbote-technical-dependencies]] and [[kinbote-hardware-roadmap]].
