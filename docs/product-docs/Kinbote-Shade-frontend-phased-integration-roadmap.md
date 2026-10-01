# Shade frontend phased integration roadmap for Kinbote

## Purpose and authority

**Status:** Planning companion and ticket-audit baseline — October 1, 2026.  
**Repository role:** Shade frontend. This pass creates this document only; it does not authorize implementation or change existing tickets.

This roadmap, the [Kinbote software plan](../../../Marvin/docs/product/software/Kinbote/kinbote-new-software-plan.md), and the [Shade backend roadmap](../../../shade-backend/docs/product-docs/Kinbote-Shade-backend-phased-integration-roadmap.md) work together. Kinbote defines the nine shared phase boundaries; each Shade companion describes its own side of each seam. This is an index for later ticket generation and refresh, not a replacement for either companion or an implementation-ready backlog.

When sources disagree:

1. The refreshed Kinbote plan governs phase numbering, stopping points and consolidated architectural decisions.
2. The [private v1 contract draft](../../../shade-backend/docs/technical-reference/shade-backend-to-kinbote-contract-draft.md) governs the proposed machine boundary; the [browser contract draft](../../../shade-backend/docs/tickets/Kinbote-frontend-api-contract-draft.md) governs proposed browser mediation. Both are drafts, not deployed APIs. Unsettled wire details require joint review.
3. The backend companion identifies backend-owned delivery and contract gaps. It cannot by itself establish new browser endpoints.
4. The local [integration contract](../kinbote-shade-integration-plan.md), [older Shade integration outline](../../../shade-backend/docs/product-docs/Kinbote-Shade-integration-plan.md), and [historical frontend plan](../../../Marvin/docs/product/software/Kinbote/kinbote-frontend-plan.md) preserve requirements; their historical stage order and optional-Home-Assistant language yield to the refreshed plan.
5. Current code and [checked-in OpenAPI](../technical-reference/openapi.json) establish existing capability. Repository operating instructions govern development. Planning prose does not create API behavior.

Shade owns catalog truth, stable copy/shelf IDs, placement, membership, filtering, authorization, NFC/deep-link resolution and browser workflows. Here, frontend ownership means navigation, interaction, safe status and recovery through Shade. Backend ownership includes authoritative resolution, reauthorization, trusted home-LAN capability, machine authentication, transactional delivery and reconciliation. Kinbote owns spatial maps/revisions, freshness projections, calibration, controllers, sessions, execution and recovery. Marvin owns deployment/secrets/network configuration; Home Assistant owns the constrained hardware connection.

The browser calls Shade only and receives no service/controller secrets, endpoints, calibration values or raw output commands. It edits normalized mapping drafts only through authorized mediation; it does not calculate physical pixels or authoritatively validate geometry. A tag identifies context and grants no authority. Ordinary Shade use remains available during every physical-service outage.

## Cross-project phase map

| Phase | Kinbote outcome | This Shade repo must provide | Integration proof | Major external blockers |
|---|---|---|---|---|
| 1 — Stable shelf identity and integration foundation | Stable shelf context crosses the authenticated boundary | Stable-ID mobile entry, safe context/recovery, rename-safe navigation and contextual pickers | Actual tag opens correct Shade shelf before/after rename/restart; outage preserves browsing | Backend S1/S2, reviewed context seam, Kinbote identity consumer, N1 phone/tag; M1 for activation |
| 2 — Trustworthy physical shelf state | Reliable revisions/freshness block stale precision | Safe freshness presentation and non-blocking placement-result cues | Real placement stales affected shelves without changing successful catalog result | Backend/Kinbote S4 delivery/reconciliation and status contract |
| 3 — Display lifecycle with fake execution | Complete bounded session lifecycle with fake output | Capability-gated Find, shared lifecycle panel, retry/replace/clear and truthful states | Browser through Shade to fake Kinbote executor; timeout/clear/restart honesty | Backend S3, reviewed retry/status semantics, Kinbote fake executor |
| 4 — One real shelf | One calibrated shelf executes through Home Assistant | Qualify existing UI on reference phone; gate live activation | Actual find/clear/expiry and safe failure on one shelf | A1, H1, Kinbote calibration, backend trust, M1 |
| 5 — Maintainable manual mapping | Explicitly published correctable spatial map | Mobile draft/edit/review/publish workflow with source conflicts | Rearrange, correct, publish, then find with same current revision | Backend S5 protocol/editor transport; Kinbote validation/revisions |
| 6 — Multi-shelf and resolved-set execution | Accurate partial output across installed shelves | View on shelves, bounded selection semantics, drill-down health/recovery | Qualified installed set handles stale/unmapped/unavailable shelves honestly | Backend S7, Kinbote scale, A1/H2/M1 |
| 7 — Optional photo-assisted mapping | Private review-only proposal enters manual lifecycle | Consent/upload/job/correction/discard/deletion UX | Review/publish one proposal, discard another, prevent late resurrection | Backend S6, Kinbote worker/assets, H3/M1 |
| 8 — Optional guidance and curated automation | Reliable guidance and narrowly scoped automation | Only reviewed reliability-gated cues and safe action outcomes | Suppressed unreliable guidance; curated actions retain authority boundary | Reviewed amendments, backend mediation, Kinbote reliability, HA consumers |
| 9 — Operational qualification and installed-library acceptance | Recoverable household-ready installed library | Phone/accessibility/outage acceptance and truthful restored state | Household drills, remote browsing and home-LAN-only physical controls | Backend/Kinbote/Marvin operations and qualified installed hardware |

S1/S2 are identity/trust and shelf context; S3 is display mediation; S4 durable freshness; S5 manual mapping; S6 photo mediation; S7 expanded presentation. N1 means actual tag/phone validation; A1 constrained Home Assistant execution; H1 one-shelf hardware; H2 installed expansion; H3 separate measured analysis capacity; M1 deployment. These retain the Kinbote plan's meanings.

Fixture development, integrated demonstration and production activation are separate claims. Fixtures can precede external producer readiness, but unresolved contracts block transport implementation. A direct link does not prove an NFC tap; fake output does not prove hardware. Operational safeguards mature throughout the phases.

## Current frontend baseline

Reviewed repository files and tests as source; no live backend, browser journeys or hardware tests were run for this planning pass.

- Current package is **1.15.0** and checked-in OpenAPI is **1.12.0**, newer than the supplied baseline. No new physical mediation routes appear in that OpenAPI. Live OpenAPI comparison remains a prerequisite before locking future transport types; deployment parity is unverified.
- [Routes](../../src/routes/routes.tsx), [browse URL helpers](../../src/features/books/bookBrowseUrl.ts), and [BooksPage](../../src/features/books/routes/BooksPage.tsx) implement `/books/shelf/:shelfToken` using **common_name**, including name-based canonical redirects and `shelf_name` filtering. This is ordinary browse capability, not rename-stable shelf identity.
- [Shelf client](../../src/api/shelvesApi.ts) lists shelves and addresses update/delete by UUID; it has no single-shelf context GET. [Shelf helpers](../../src/features/shelves/shelfDisplay.ts) resolve names/IDs for existing pickers and exclude removed. Those helpers cannot substitute for authoritative physical context.
- Existing book reads include nullable shelf references and placement states; digital catalog support makes explicit physical eligibility necessary. A digital asset or system shelf is not automatically a usable installed physical shelf.
- Book detail, bulk intake/move, shelf pickers, authentication, React Query, diagnostics and current design primitives already exist. Extend those surfaces and clients rather than creating another catalog or authentication store.
- No shipped Kinbote feature client, stable-ID shelf page, physical session panel, spatial editor or shelf-photo mapping UI was found. Existing catalog image search and covers are separate workflows.
- Seven local physical tickets were read in full. Feat-01 is a cross-cutting public-configuration concern; Feat-16 is unrelated EPUB/PDF work. Neither is counted as a physical ticket. The backend's EPUB/PDF Feat-14 must not be confused with this repository's photo Feat-14.
- The browser draft referenced by local tickets is absent locally; its actual reviewed location is the backend link above. Backend Feat-03/05/07/09/11/13 references are external dependencies, not missing frontend implementations.

## Phase 1 — Stable shelf identity and integration foundation

### Shade outcome

A shelf tag/deep link opens canonical Shade context addressed by stable shelf_id, independent of the shelf's current name and of Kinbote availability.

### Work owned by this repository

Provide typed identity/context consumption and minimal safe optional integration status. Add a phone-friendly stable-ID entry using the agreed Shade navigation contract; keep legacy name browsing usable. Handle malformed, unknown, retired, unauthenticated, unauthorized and wrong-library context without exposing data or mutating anything. Preserve the intended shelf through authorized sign-in and supported Bulk Add/Bulk Move entry, while retaining ordinary pickers and server validation. Names remain labels; never silently rebind a stale ID to a similarly named shelf. Model explicit unplaced/stashed/unshelved/non-physical relationships without deriving physical placement from shelf_name. Test unsupported versions and unknown additive fields. Future map/session vocabulary may be compatibility scaffolding only.

### Existing capability

Shelf UUIDs, book IDs, placement fields, normal browse, pickers, bulk intake/move and auth already exist. Existing name-token routing does not fulfill this phase.

### External dependencies

Development: backend/frontend agree S1/S2 browser context shape, access policy and canonical tag/deep-link format; Kinbote/backend review the identity-only machine seam. Fixtures can support development before deployment. Integration: real backend context and Kinbote authenticated identity consumer; N1 actual tag/reference phone. Production: Marvin M1 private deployment, secrets and public Shade routing. Home Assistant and LED hardware are not required.

### Explicit non-goals

No operational map freshness, editor, spine coordinates, publication, sessions, physical-control activation, LEDs/WLED, HA execution, calibration, photos or multi-shelf output. Machine credentials, versioning, correlation and idempotency as applicable are backend/Kinbote work; no invented frontend transport.

### Completion evidence

Consumer fixtures and route tests cover rename, invalid/retired/wrong-scope IDs, auth recovery, absent optional status and outage. Direct reload/back/forward preserve stable context. Contextual intake/move preserves picker choice and ordinary validation. Verify tags/URLs cannot supply credentials or trigger writes.

### End-to-end integration evidence

Tap the actual tag on the reference phone, open authorized shelf context, and have Shade use the reviewed authenticated Kinbote seam. Rename and repeat; restart Kinbote and repeat. Invalid/retired IDs fail safely. Kinbote outage preserves shelf browsing and normal catalog operations. Record backend/Kinbote trust evidence separately from browser tests.

### Ticket-set stopping point

> **STOP:** Stable identity plus NFC shelf context is complete. Future vocabulary cannot make mapping, freshness processing or display implementation a prerequisite.

### Next phase unlock

Consume trustworthy shelf freshness without changing navigation identity.

## Phase 2 — Trustworthy physical shelf state

### Shade outcome

Users can inspect truthful optional physical freshness while successful catalog operations remain successful.

### Work owned by this repository

Consume safe current/stale/unmapped/mapping/unavailable and delivery/reconciliation reasons where supplied. Add non-blocking status to shelf context and relevant successful intake/move confirmations. Refresh affected cached status according to backend responses; never mark a map current merely because a write or reconciliation succeeded. Preserve unknown/unavailable states during outages rather than displaying cached current state as fresh. Present declared rearrangement only through an agreed authorized backend capability if included in S4; do not invent a route.

### Existing capability

Mutation/cache invalidation, shelf context from Phase 1 and existing placement workflows supply reusable surfaces. There is no frontend outbox or physical projection.

### External dependencies

Development: backend S4 status shapes, affected-ID response/read semantics and shared Kinbote freshness fixtures. Integration: backend transactional invalidation, idempotent delivery and reconciliation with Kinbote for all supported placement writers. Production: Marvin M1 durable state/delivery supervision. HA/LED readiness is not a development requirement.

### Explicit non-goals

No editor/publication, session commands, hardware controls, photo proposals or client-side event delivery/reconciliation engine.

### Completion evidence

Fixtures cover absent status, delayed/failed delivery, source/destination invalidation, stale/calibration-required and reconciliation-required. Successful catalog writes remain visibly successful under service failure; stale data is never advertised as precise/current.

### End-to-end integration evidence

A real single/bulk placement operation succeeds while Kinbote is offline. Every affected shelf is later reported stale after delivery/reconciliation, with correct catalog placement and no inferred positions. Restart/reordered/duplicate delivery evidence belongs to backend/Kinbote; verify its user-facing result.

### Ticket-set stopping point

> **STOP:** Truthful optional freshness is visible and catalog independence is proven. No display commands or map editing enter this ticket set.

### Next phase unlock

Use freshness and server capability to exercise bounded fake sessions.

## Phase 3 — Display lifecycle with fake execution

### Shade outcome

Book Details can exercise a complete optional Find lifecycle through Shade against fake execution.

### Work owned by this repository

Add shared capability-gated Find/session presentation and create/read/replace/clear interactions through reviewed Shade clients. Use browser intent idempotency for exact retries as agreed; never fabricate server correlation IDs or infer LAN authority. Separate accepted from active and explicitly active portions of partial; show clearing, expiry, failures and unresolved clear honestly. A timeout is an unknown result requiring agreed read/retry recovery, not proof of failure or permission for duplicate output. Preserve book detail and library workflows. Do not interpret replaced/cleared labels as new wire enum values without review.

### Existing capability

Book detail/auth/query/client/diagnostics primitives and Phase 2 statuses can be extended. No physical session UI is currently shipped.

### External dependencies

Development: backend S3 routes, bounds, session ownership, replacement and retry/read/clear protocol; browser-to-server and machine keys need distinct agreed semantics. Integration: Kinbote fake executor and S4 freshness; backend trusted capability. Production live activation waits for Phase 4; fake development needs no HA or real shelf.

### Explicit non-goals

No live LEDs, calibration, spatial editor, resolved multi-shelf feature, photos or automatic placement-triggered output.

### Completion evidence

Contract/UI tests cover disabled/remote/unauthorized, accepted/active/partial, same-intent retry, changed-payload conflict, timeout/reload, replace conflict, expiry, unresolved clear and restart. Rendering never equates submission with physical indication.

### End-to-end integration evidence

Browser calls Shade, Shade authorizes stable IDs, and Kinbote fake execution returns truthful lifecycle. Exercise loss/retry, clear and restart; remote ordinary browsing remains usable. Mark the evidence as simulated.

### Ticket-set stopping point

> **STOP:** The complete single-copy session UX is verified against fake execution. Hardware activation and expanded result-set interaction remain separate.

### Next phase unlock

Qualify the same interaction on one installed shelf.

## Phase 4 — One real shelf

### Shade outcome

The existing Find UX truthfully controls one qualified shelf through the full authorized chain.

### Work owned by this repository

Qualify Phase 3 screens on the reference phone and actual network path. Tune safe presentation only where measured real failures require it; gate live controls on backend reported capability and usable map/qualified shelf. Keep clear/expiry/recovery understandable and accessible.

### Existing capability

Phases 1-3 supply the context, freshness and session experience; this phase does not require another frontend feature family.

### External dependencies

Development: qualified producer statuses/fixtures permit refinements. Integration: backend S1/S3/S4, Kinbote calibration/executor, A1 constrained HA acknowledgement/cleanup and electrically validated H1. Production: Marvin M1 secrets/supervision, tested canonical-host hairpin routing and home-LAN trust. Hardware provisioning is external.

### Explicit non-goals

No browser calibration/controller administration, direct WLED/HA connection, map editor, expansion or photo assistance.

### Completion evidence

Phone/accessibility checks and fault-result tests retain truthful activation, partial/failed/uncertain clear and expiry. UI cannot enable output using URL/browser network claims.

### End-to-end integration evidence

Actually find, replace, clear and expire on one installed shelf; test service/controller/HA loss and recovery. Remote catalog use succeeds while physical activation is denied. External operators demonstrate safe cleanup and verified restoration.

### Ticket-set stopping point

> **STOP:** One real shelf is qualified with truthful controls and safe recovery. Manual mapping and additional shelves are not silently pulled forward.

### Next phase unlock

Maintain that shelf's map through explicit manual review/publication.

## Phase 5 — Maintainable manual mapping

### Shade outcome

An authorized user can correct a rearranged shelf's map on a phone and explicitly publish a new revision.

### Work owned by this repository

Add mapping entry from stable shelf context. Show authorized expected contents, current revision/freshness, recoverable draft, ordering and normalized boundary editing. Present backend/Kinbote overlap/gap/missing/unexpected/duplicate validation. Review and explicitly confirm publication using the supplied expected revision/source evidence; retain draft work on stale/conflict responses and offer reviewed reload/rebase recovery. Current revision remains inspectable while a draft is incomplete or abandoned. Client feedback may assist editing but authoritative validation stays external.

### Existing capability

Phase 1 shelf context and Phase 2 freshness plus ordinary book metadata/design primitives are reusable. No existing shelf picker is a spatial editor.

### External dependencies

Development: backend S5 normalized editor transport, source-token validity, revision/history and conflict/confirmation semantics; Kinbote geometric validation. Integration: Phases 1-4 and source/publication race protocol proven across services. Production: Marvin M1 draft/revision durability and qualified A1/H1 path for post-publication find. HA/hardware are not needed to build fixture-based editing.

### Explicit non-goals

No client map persistence as authority, calibration, photo inference, catalog membership changes from position edits, automatic stale repair or multi-shelf expansion.

### Completion evidence

Touch/keyboard tests cover draft creation/correction/abandonment, invalid boundaries, explicit review, publication, concurrent placement conflict and preserved work. No draft is displayed as published/current without server confirmation.

### End-to-end integration evidence

Rearrange a real shelf, correct and publish through Shade, then Find using the same current revision. Concurrent placement rejects stale publication and preserves recoverable draft. Historical maps never become current merely through reconciliation.

### Ticket-set stopping point

> **STOP:** One shelf is maintainable manually with explicit conflict-safe publication. No photographs or multi-shelf execution are required.

### Next phase unlock

Expand resolved-set interaction across qualified installed shelves.

## Phase 6 — Multi-shelf and resolved-set execution

### Shade outcome

Users can request already-resolved copies and understand accurate partial results across the installed library.

### Work owned by this repository

Add View on shelves for explicit selections and the agreed current-results scope. Submit stable book IDs to Shade for reauthorization; do not recreate backend filters or assume an infinite-scroll loaded page means all matches. Respect reviewed admission bounds and selection changes. Expand shared panel with requested/displayable/stale/unmapped/unavailable/failed counts and per-shelf drill-down. Add safe aggregate map-health and authorized recovery entry points; map calibration-required to operator assistance without exposing configuration. Preserve Phase 2 non-blocking mutation cues.

### Existing capability

Infinite browse, URL-backed filtering, bulk selection and single-copy session UI supply reusable components; selection-to-display semantics still need review.

### External dependencies

Development: backend S7 bounds, exact resolved-set semantics, safe health/recovery operations and fixtures; Kinbote multi-shelf outcomes. Integration: S4/S5 and qualified Kinbote shared-resource execution, A1/H2 installed shelves. Production: M1 expanded capacity and per-shelf readiness. No frontend assumes a controller count or purchases equipment.

### Explicit non-goals

No insertion-gap/destination guidance, new automation UI, photo workflow, direct device recovery or filter expressions sent to Kinbote.

### Completion evidence

Test loaded versus all-results scope, selection drift, request bounds, mixed outcomes, reachable shelf preservation, expiry/replacement/clear, restart and safe recovery with missing shelves.

### End-to-end integration evidence

Display resolved selections across qualified installed shelves, including shared hardware and stale/unmapped/unavailable shelves. Confirm partial outcomes and recovery while ordinary catalog use stays intact.

### Ticket-set stopping point

> **STOP:** Installed multi-shelf results, health and recovery are truthful. Guidance and photos remain independently scoped optional work.

### Next phase unlock

Support optional reviewed photo proposals, or proceed toward core operational qualification.

## Phase 7 — Optional photo-assisted mapping

### Shade outcome

A private shelf photograph helps prepare a correctable draft through the existing manual confirmation lifecycle.

### Work owned by this repository

Add consent/retention information, phone capture/upload, bounded file/error feedback, job progress/retry/cancellation/deletion and review-only proposal display. Keep candidates/confidence/warnings distinct from current map. Allow correction/rejection and entry into Phase 5 review using source/draft context; no automatic publication or catalog placement. Do not revive cancelled/deleted proposals from late polling results. Preserve manual mapping when analysis fails or the phase is deferred.

### Existing capability

Phase 5 mapping and existing camera/upload patterns may be reused. Catalog image search is not shelf-map analysis or consent.

### External dependencies

Development: backend S6 asset/job/proposal/deletion contracts and synthetic fixtures, Kinbote isolated worker. Integration: real authorized candidate set, source conflicts and deletion during late work. Production: H3 measured separate worker capacity and M1 private storage/retention/deletion-aware backup behavior. HA/hardware are reused only for optional post-publication output proof.

### Explicit non-goals

No CV implementation, direct photo-store access, catalog-wide recognition, cloud inference requirement, dedicated camera purchase or automatic placement/publication.

### Completion evidence

Phone/UI tests cover uncertain/no-match/duplicate candidates, failure/retry, stale source, rejection, cancellation/deletion while running and no late resurrection. Manual editor remains usable.

### End-to-end integration evidence

Use a representative phone photo to correct/review/publish; separately discard/delete another and prove late jobs cannot restore it. Backend/Kinbote demonstrate asset/derivative retention and deletion.

### Ticket-set stopping point

> **STOP:** Photo assistance is private and review-only, or explicitly deferred. Core acceptance is not blocked by optional photos.

### Next phase unlock

Optional reliability-gated guidance, independently of whether photos are enabled.

## Phase 8 — Optional guidance and curated automation

### Shade outcome

Only reviewed trustworthy guidance and narrowly authorized optional action outcomes appear in Shade.

### Work owned by this repository

Show insertion-gap candidates only when the backend supplies sufficient current reliability evidence. Avoid claiming a normalized gap proves book fit. Physical destination indication is opt-in and needs a reviewed intent amendment; keep it separate from successful intake/move. Present permitted HA-originated action status through Shade if enabled, reusing ordinary safe status rather than building an automation console.

### Existing capability

Session/status and successful mutation cues are reusable. Initial v1 supports find/highlight, not destination intent.

### External dependencies

Development: backend/Kinbote/product review guidance meaning, evidence, allowed intents/actions and scopes before related tickets. Integration: S1/S3/S4/S5/S7 as applicable, A1 and qualified H1/H2; externally supplied curated HA consumers. Production: M1 scoped configuration and explicit enablement. Phase 7/H3 is not a prerequisite.

### Explicit non-goals

No voice/Harmony feature, generic home automation, catalog authority delegated to HA, arbitrary commands/pixels or unreviewed fit claims.

### Completion evidence

Tests suppress unreliable/stale guidance and disabled actions, preserve catalog success during optional indication failure, and show permission/ownership conflicts safely.

### End-to-end integration evidence

Demonstrate qualified guidance and its suppression; approved HA consumer observes/clears only permitted output without catalog or device authority leakage. Optional deferral is recorded explicitly.

### Ticket-set stopping point

> **STOP:** Only reviewed qualified guidance/actions are enabled, or the phase is deferred. No new automation family enters final qualification.

### Next phase unlock

Accept supported installed operation with explicit optional capability status.

## Phase 9 — Operational qualification and installed-library acceptance

### Shade outcome

Household use is understandable and recoverable on the intended phone, with ordinary Shade usable through physical outages.

### Work owned by this repository

Complete browser/phone/accessibility acceptance across context, Find, resolved sets, clear/expiry, remapping, partial failures and enabled optional features. Validate release/contract compatibility, safe auth expiry, unknown versions, reload/offline/service outage, restored stale/expired sessions and correct recovery. Document user-facing support with server-issued correlation and operator handoff using existing redacted diagnostics; add no second telemetry transport. Record measured UX limits and enabled/deferred capabilities.

### Existing capability

Earlier phases and existing error/auth/diagnostic/test infrastructure supply the experience. Backend backups, Kinbote restoration and Marvin service operations remain external.

### External dependencies

Development: agreed acceptance targets and versioned fixtures. Integration: backend/Kinbote upgrade/credential/backup/restore/fault drills, real phone N1 and installed H1/H2/A1. Production: Marvin M1 runbooks/network/secret operations. S6/H3 and Phase 8 amendments/consumers only for enabled optional capabilities.

### Explicit non-goals

No new feature families, provider tooling, frontend-owned backup/calibration or requirement to enable optional Phases 7-8.

### Completion evidence

Record completed browser/accessibility regression and household scenarios with truthful status under timeout, restore and restart. Confirm remote browsing and existing loans/intake/moves remain usable, without granting remote physical control.

### End-to-end integration evidence

On the intended phone, run actual tap/find/resolved-set/clear/expiry/remap and mixed failure recovery. Rehearse release/credential/restore failures with output disabled until externally verified calibration/reconciliation. Record installed scope, response/recovery measures, optional status and remaining limitations.

### Ticket-set stopping point

> **STOP:** Supported installed-library use is accepted with truthful status, maintainable maps and verified recovery. Further changes need a separately scoped milestone.

### Next phase unlock

Routine operation; no automatic tenth phase.

## Existing ticket audit

Primary classifications are mutually exclusive for counting. External dependencies are recorded even when a ticket's primary classification is split or moved. These are recommendations for a later pass; no ticket is changed here.

| Ticket / original intent | Classification | Proposed phase | Scope match and changed assumptions | Later disposition |
|---|---|---|---|---|
| [Feat-04 — Physical contract client foundation](../tickets/Feat-04-physical-contract-client-foundation.md): identity, all map/session states, capability and retries | Split across phases | 1 identity/context and compatibility; 2 operational freshness; 3 capability/session behavior | Partly: requiring all of Feat-03 and operational session/map acceptance in Phase 1 overreaches. Future types may exist early without implementing later behavior. Draft location and enum assumptions need repair. | Split foundation from runtime consumers; retain safe degradation/security checks. |
| [Feat-06 — Mobile shelf route and NFC context](../tickets/Feat-06-mobile-shelf-route-and-nfc-context.md): stable route, safe links and bulk context | Phase 1 — already aligned | 1 | Yes: exactly S2. Ordinary route can ship without tags, but complete integration requires N1 actual tap plus backend/Kinbote seam. Feat-05 is external. | Leave behavioral scope intact; clarify owner-resolved dependency and integrated versus route-only evidence. |
| [Feat-08 — Book Details Find on shelf](../tickets/Feat-08-book-details-find-on-shelf.md): bounded single-copy sessions and truthful control | Move to later phase | 3 implementation/fake proof; 4 actual qualification | Mostly: add S4 prerequisite, truthful uncertain clear, timeout/retry ownership and explicit live activation gate. Feat-07 is backend-owned. | Refresh phases/dependencies and separate simulated completion from live qualification. |
| [Feat-10 — View on shelves and session panel](../tickets/Feat-10-view-on-shelves-and-session-panel.md): resolved sets, panel, freshness/destination cues | Split across phases | 2 freshness/mutation cues; 3 shared lifecycle panel; 6 resolved sets; 8 any physical destination intent | No as one set: freshness precedes output; generic lifecycle precedes scale. “Destination cue” must distinguish ordinary destination label from amended physical indication. All-results semantics are unresolved. | Split by capability; preserve successful mutation independence; review destination meaning before later implementation. |
| [Feat-12 — Mobile shelf-map workflow](../tickets/Feat-12-mobile-map-workflow.md): normalized drafts, validation, conflict-safe publication | Move to later phase | 5 | Mostly: ownership is sound; exact editor data/publication race protocol is unresolved, and backend Feat-11 must not depend on all Phase 6 scope. | Refresh after S5 review; preserve touch/keyboard, abandoned drafts, stale-source and explicit confirmation requirements. |
| [Feat-14 — Photo-assisted map UI](../tickets/Feat-14-photo-assisted-map-ui.md): consent, jobs, correctable proposals, deletion | Move to later phase | 7 optional | Yes in ownership: add cancellation/late-result and deletion/retention proof, distinguish fixture development from H3 production readiness. | Refresh optional phase/dependencies; retain manual-first review-only invariant. |
| [Feat-15 — Multi-shelf health and recovery UI](../tickets/Feat-15-multi-shelf-health-and-recovery-ui.md): aggregate outcomes/recovery plus insertion guidance | Split across phases | 6 health/recovery; 8 guidance; 9 final acceptance evidence | Partly: guidance is optional and requires reviewed reliability meaning, not an unconditional scale dependency. Tested hardware is an integrated/activation gate rather than a fixture-development prerequisite. | Split optional guidance from core scale; carry recovery requirements into final qualification. |

| Classification | Count |
|---|---:|
| Phase 1 — already aligned | 1 |
| Phase 1 — needs refresh | 0 |
| Move to later phase | 3 |
| Split across phases | 3 |
| Obsolete/superseded | 0 |
| Still valid but blocked by external dependency | 0 |
| **Total local physical tickets** | **7** |

Zero “blocked” primary classifications does not mean external producers exist. All seven require reviewed backend capabilities; migration scope is their more useful primary classification. No ticket is wholly obsolete: outdated sequencing/assumptions are corrected later without discarding requirements.

## Missing coverage and decisions before ticket refresh

| Gap / decision | Earliest boundary | Owner and required resolution |
|---|---|---|
| Missing local browser contract reference and unresolved endpoint paths | Before refresh | Frontend/backend establish a durable canonical link or reviewed synchronized contract location. The backend draft deliberately leaves browser route names open; do not copy private Kinbote paths into the client. |
| Stable-ID shelf route/tag format and access/recovery policy | 1 | Frontend/backend/operators agree canonical URL, UUID resolution, retired/system/non-physical context and viewer/admin behavior. Existing name route is not this seam. |
| Identity-only Shade→Kinbote interaction is not precisely enumerated in private draft | 1 | Backend/Kinbote review whether safe unmapped shelf-status satisfies the seam or a compatible amendment is needed. Frontend consumes Shade context, not this private operation. |
| External ticket identifiers/status | Before refresh | Resolve backend Feat-03/05/07/09/11/13 links and split prerequisites against the backend audit; confirm any Feat-02 operator prerequisite. Numbers alone cannot prove completion. |
| Standalone freshness consumer slice has no dedicated local ticket | 2 | Later decomposition of Feat-04/10 must cover all authoritative reasons and affected-shelf cache/status behavior. Backend owns early S4 outbox, ordering and reconciliation. |
| Canonical browser status/retry/clear contract | 3 | Frontend/backend/Kinbote reconcile lifecycle enums, partial-active evidence, timeout reads, key scope/lifetime, replace ownership and unresolved clear. Browser key and machine key are different boundaries, not contradictory ownership claims. |
| One-real-shelf frontend qualification lacks a separate gate/evidence package | 4 | Later ticket refresh separates fake checks from actual phone/network/HA/H1 evidence; hardware readiness must not block fixture work. |
| Safe normalized editor transport and concurrent-source publication | 5 | Frontend/backend/Kinbote settle coordinate-bearing draft/proposal data versus restrictive “status only” language, token validity, partial maps/history and conflict recovery. No pixels/calibration are exposed. |
| “Current results” and admission limits | 6 | Product/frontend/backend agree loaded-page versus full resolved set, pagination/selection drift and bounded requests without new catalog-filter semantics. |
| Photo cancellation/deletion/retention coverage | 7 | Backend/Kinbote/frontend define late-result suppression and deletion/backup consequences; confirm reference phone and H3 measured readiness externally. |
| Destination/gap meaning and optional action authority | 8 | Product/backend/Kinbote review amendments beyond find/highlight, reliable gap evidence versus book-fit claim, permitted HA consumers and opt-in behavior. |
| Cross-version/restore/household acceptance has no dedicated local ticket | 9 | Later ticket set defines supported installed scale, measured targets, optional enablement/deferment and operator evidence dependencies. |

### Conflicting or ambiguous assumptions

- Local integration prose says Home Assistant is optional and Kinbote sends provider commands; the refreshed plan requires constrained HA hardware execution. Optional curated automation remains separate. No direct browser/Kinbote WLED path is revived.
- Older Shade outline permits synchronous freshness notification before scale; the refreshed plan and backend companion require durable S4 in Phase 2, before precise live output. A synchronous session request remains compatible.
- Feat-04 lists “replaced” and “cleared” alongside supported state presentation, but the v1 session enum does not contain them. They can be UX outcomes only after agreed mapping; adding enum members requires review.
- Feat-10's physical-destination wording cannot implicitly introduce destination mode into initial v1. A normal destination shelf label remains catalog presentation; actual indication is Phase 8 amendment work.
- Feat-15's guidance cannot require optional Phase 8 to finish core Phase 6. Current normalized empty space does not prove that a particular book fits.
- Backend/browser “safe presentation status only” wording must be clarified for Feat-12/14 editor coordinates/proposals. Normalized user editing is distinct from physical pixels, calibration and provider commands.
- Draft clear/restart language must preserve uncertainty when cleanup cannot be acknowledged; successful request submission does not prove output stopped or became active.
- Historical frontend prose mentioning calibration entry must not create frontend calibration administration. Safe status/operator handoff is sufficient here.
- Current version drift from supplied AGENTS baseline is recorded, not resolved by changing docs/contracts or guessing live backend behavior.

### Consistency check and future refresh rule

All seven local physical tickets are accounted for. Phase 1 combines stable identity and NFC context and requires an actual tap for integrated acceptance; it contains no mapping/display/hardware execution. Durable freshness is Phase 2, fake sessions Phase 3, real qualification Phase 4, manual maps Phase 5, installed expansion Phase 6, optional photos/guidance Phases 7/8 and operations Phase 9.

No original requirement is dropped: shared statuses/retries move to 2/3; contextual pickers stay in 1; mutation cues move to 2; single-copy lifecycle to 3/4; resolved sets to 6; manual validation/publication to 5; photo review/privacy to 7; health/recovery to 6/9; qualified guidance to 8. Physical destinations remain an explicit amendment decision. Authorization, catalog independence and safe degradation apply throughout.

Before generating or refreshing a phase's tickets, settle its listed contract decisions, identify external prerequisites by owner and canonical link, and separate repository proof, integrated demonstration and production activation. Preserve the three companion roadmaps' common phase numbers. Do not change existing tickets or implement code under this document's authority alone.

