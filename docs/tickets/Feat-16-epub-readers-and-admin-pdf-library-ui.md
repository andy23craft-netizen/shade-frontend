# Feat-16 - EPUB readers and admin PDF library UI

**Status:** PDF browse UI specified; EPUB reader implementation blocked on its API contract, and native PDF viewing/downloading blocked on authenticated browser handoff.  
**Owner:** Frontend  
**Dependencies:** Finalized EPUB API contract and selected hosted-reader integration; deployed external EPUB-provider and PDF-root configuration. The PDF-library API is present in the checked-in OpenAPI; see **Confirmed PDF API contract** below. EPUB routes and schemas are not present in that contract as of this ticket update.

## Goal

Give Shade administrators two private media experiences—a native browser reader for EPUB-enabled catalog books and a phone-friendly browser for server-hosted PDFs—while giving an emailed EPUB borrower a safe, no-login reader. Preserve the distinction between physical circulation, digital EPUB loans, authenticated household reading, and non-catalog PDF files.

## Scope

### Shared frontend/API foundation

- Regenerate the checked-in OpenAPI client from the finalized contract, then add typed API clients, React Query hooks, cache keys, error mapping, and targeted invalidation. The PDF directory browser is contract-ready. EPUB assets, digital loans, borrower progress, and administrator/profile progress remain blocked until their routes, schemas, token transport, and status semantics are supplied in OpenAPI or a supplemental frontend contract.
- Before reader integration, research, select, and document a React-compatible EPUB reader that meets the protected/proxied-content, canonical-CFI resume, mobile-accessibility, maintenance, and bundle criteria. Keep it behind a reader adapter, and verify the choice does not cause existing gate/check requests to time out.
- Extend existing book-detail, loan-history, household-reader, and canonical mark-read flows rather than creating parallel book identity, auth, or completion state. Continue to use \`book_id\` and the active tenant host.
- Treat physical and digital loans as separate records and present their delivery/type labels clearly. An EPUB loan must never alter or imply a physical book's shelf, availability, active physical loan, or checkout eligibility.
- Respect \`AuthProvider\` viewer/admin state. Administrator surfaces require the existing tenant admin credential; public borrower-reader routes are an explicit, tightly scoped exception and must not make surrounding catalog, loan, PDF, or administration routes viewer-accessible.
- Surface server-provided returned, completed, revoked, invalid, reset, read-only, and retryable states in plain language. Never invent a client-side authorization decision, completion, tenant check, or progress-conflict repair.

### Administrator EPUB asset and loan controls

- On Book Details, provide permission-aware administrator controls to inspect whether an EPUB asset is available and to associate, replace, or remove its stable asset identifier only if the finalized API supports those operations. Do not display provider paths, storage credentials, or an external asset URL.
- Add an EPUB checkout action separate from physical checkout. It requires and validates a borrower email before submission, shows the committed digital-loan result and delivery status, and makes clear that EPUB lending is unlimited and independent of the physical copy.
- Extend the appropriate reading-room loan list and book loan history with an explicit EPUB delivery/type indicator, borrower name/email as allowed by the administrator response, checkout/return timestamps, and the safe latest/final progress summary. Do not expose invitation secrets in a list or history response.
- Provide active-loan return/revoke and reset/reissue controls only where the backend authorizes them. Reset/reissue must confirm its effect, preserve the same loan history in the UI, and replace any previously displayed invitation material with the new server-issued result. The UI must not construct QR values or links from predictable IDs.
- After a successful EPUB checkout or reissue, show the administrator both the server-issued reader link and QR code as a backup delivery record. Render them ephemerally without persisting them in URL state, React Query cache, local/session storage, diagnostics, clipboard history, or analytics. Make copy/display behavior explicit and redact them from visible error details.

### Borrower EPUB reader

- Add a dedicated, minimally branded borrower-reader route driven only by the opaque invitation mechanism specified by the backend contract. Redeem an invitation query/fragment token immediately and replace it with a token-free route when the backend browser-session contract permits. The route must not load the normal authenticated app shell, call unrelated APIs, or expose admin navigation, borrower email, internal loan IDs, external EPUB-provider URLs, or token values in UI errors.
- Implement the final selected native EPUB reader integration behind a small reader adapter. It must consume only protected Shade content/manifest endpoints, restore the server-approved canonical position, and send debounced, ordered/idempotent progress updates using the contract's concurrency/retry fields. Do not treat a local CFI or a percentage as durable until the server accepts it.
- Support normal reader loading, resume, refresh, temporary offline/network failure, retry, and terminal inactive states. Derive progress wording, retry affordances, ordering, and conflict behavior from the finalized backend contract; clearly state when progress is waiting to sync and do not claim cross-device synchronization until an accepted server response confirms it.
- Follow the server's browser-session design. The frontend must not store or inspect a bearer credential intended for an \`HttpOnly\` cookie, append secrets to internal navigation, send credentials to third-party reader assets, or emit them through diagnostics. Use a restrictive referrer policy and avoid third-party analytics on borrower-reader pages; confirm the final headers/cookie behavior in integration tests.
- Do not offer borrower accounts, profile selection, annotations, highlights, library navigation, offline storage, or a client-side return/completion operation unless the finalized backend contract explicitly adds it.

### Authenticated administrator EPUB reader

- Show an authenticated **Read EPUB** entry point for an available EPUB-enabled book. Before opening the reader, use a modal to require selection of the owner or a household profile when household mode is enabled; make the selected reader and its independent progress clear in the launch confirmation.
- Open a dedicated authenticated reader route/tab whose profile is captured in its initial route/session state and cannot be changed in place. Do not silently substitute the global active reader after launch. A profile must be authorized and supplied to the backend for every progress and completion operation.
- Restore and synchronize only the selected profile's administrative progress through the finalized API. Keep that progress wholly separate from borrower-loan progress and from other household profiles. An already-complete book/profile starts at the beginning as directed by the backend; do not fabricate reread records.
- At natural reader completion, reuse the existing mark-read form/component in a dialog when its existing abstraction supports this without material duplication or regression; otherwise retain the canonical mark-read route and document why the dialog reuse was not practical. Submit through the canonical selected-profile mark-read behavior, with retriable validation/error states and no duplicate completion. Completion outside the reader remains valid and must not require 100% EPUB progress.
- Refresh the affected book detail, reading state, dashboard, and relevant progress/loan queries after successful completion; an unfinished reading session must not mark a book read.

### Administrator PDF library

Add an administrator-only, phone-friendly PDF Library entry point in Manage Collection. It must use the existing tenant administrator bearer credential and must never call either PDF route in viewer mode.

#### Confirmed PDF API contract

- List the root with `GET /pdf-library`. List a contained directory with `GET /pdf-library?path=<opaque-relative-directory-id>`. `path` is optional and nullable in the OpenAPI; omit it for the root rather than manufacturing an empty identifier.
- A successful listing is `PdfDirectoryListing`: `{ path, items }`. `path` and each `PdfLibraryEntry.identifier` are opaque relative identifiers, not display paths. An entry provides `identifier`, `name`, `kind` (`directory` or `file`), optional `modified_at`, and optional `size`. Do not infer an extension, MIME type, parent directory, or filesystem location from any field.
- Preserve the server's supplied item order. The server guarantees directories before files; the current contract does **not** guarantee alphabetical order, so the SPA must not re-sort the list.
- Enter a directory only with that entry's `identifier` as the next list request's `path`. Use client navigation history, retaining only prior safe display names for breadcrumbs/back navigation; never display, split, or normalize an opaque identifier to derive a parent.
- Open a file through `GET /pdf-library/file?identifier=<opaque-relative-file-id>`. Omit `download` (or use `false`) for inline viewing; use `download=true` to request an attachment. The identifier is required and must be non-empty.
- Treat `503` as a temporarily unavailable media provider: retain the current view, show a retry action, and do not retry automatically. Treat `422` as an invalid/malformed request without exposing the identifier. The supplied prose requires administrator access; use the existing admin-auth handling for an authorization failure and never downgrade this surface to viewer access.
- The initial response and each directory navigation response are authoritative. Do not persist or optimistically mutate a directory model; a fresh request must reflect additions/removals on disk.

#### PDF UI and security requirements

- Render only backend-authorized metadata (`name`, `kind`, and, when supplied, safe formatted size/modified time). Provide accessible directory navigation plus loading, empty, unavailable-provider, unauthorized, malformed-item, and retry states.
- Do not expose the opaque identifier as visible path text, log it, include it in diagnostics, or transform it into a filesystem path. It may be held only as request/navigation state needed to call the Shade endpoint.
- Open PDFs in the browser-native viewer and offer download as a separate explicit action, both through authorized Shade endpoints. Do not fetch entire files into JavaScript memory, proxy bytes through the SPA, cache file URLs as durable state, or make PDFs available in viewer mode.
- Resolve the authenticated native-viewer handoff before implementation. A normal browser navigation cannot attach the SPA's bearer Authorization header, while the endpoint is administrator-only. Do not work around this by placing a bearer token in a URL, creating a blob URL from a full-file fetch, or weakening route authorization.

### Quality and accessibility

- Add unit tests for API serialization, sensitive-value redaction, profile locking, progress-state transitions, terminal loan states, and PDF directory navigation/error handling.
- Add Playwright and axe journeys for administrator EPUB checkout/reissue, borrower invitation redemption and resume, administrator owner/non-owner progress isolation and completion, physical/digital loan independence, and PDF root/subdirectory browse, server-order preservation, inline-view/download request construction, 503 retry, malformed identifier handling, and viewer authorization. Use mock secrets only and assert they do not appear in the page, browser URL after redemption, diagnostics, or ordinary app navigation.

## Acceptance criteria

- An administrator can identify an EPUB-enabled book and create an EPUB loan only after entering a valid borrower email, without changing the matching physical book's availability, placement, or physical-loan workflow.
- The administrator can distinguish physical and EPUB loans and safely see the backend-authorized loan/progress summary. Return/revoke and reset/reissue states are explicit, and reissue does not present a second historical loan.
- A borrower can open a valid emailed/QR invitation in more than one browser/device without a login, resume the shared server-backed position, and receive safe terminal/error states when access is invalid or inactive.
- The borrower reader exposes no secret token, external asset URL, borrower email, administrator navigation, or unrelated catalog data through its UI, routes, storage, diagnostics, or error presentation.
- A signed-in administrator selects a household reader before entering EPUB reading; that selection stays fixed for the open reader session, and another profile's progress/completion is never displayed or written accidentally.
- Administrator completion uses the existing selected-profile rating/review and mark-read behavior. It is retriable, does not duplicate completion, and an unfinished session does not mark the book read.
- The PDF Library is inaccessible to viewers, shows only backend-authorized directory/file metadata, preserves the server's directory-first ordering, supports keyboard and phone navigation, and delegates viewing/downloading/range streaming to the server rather than loading entire files into the SPA.
- Existing catalog browsing, physical checkout/check-in, loans, household-reader selection, and mark-read flows remain functional when EPUB or PDF services are unavailable.

## Out of scope

- Selecting, hosting, or operating the external EPUB provider; configuring outbound email; configuring the PDF root; or implementing backend token, cookie, content-proxy, progress-compaction, range-streaming, or filesystem safety.
- Borrower accounts, passwords, DRM, annotations, highlights, reader themes, offline/service-worker reading, reread tracking, and public PDF browsing.
- Importing PDFs into the catalog or creating PDF metadata, search, loans, or database records.
- A new frontend authentication model, direct calls to an EPUB host, or direct filesystem access.

## Open contract questions before implementation

1. **Authenticated inline/download handoff:** What approved mechanism lets a browser-native PDF viewer/download request satisfy administrator bearer authorization without putting the bearer token in a URL? Examples of possible backend-owned designs are a same-origin HttpOnly session/cookie or a short-lived, server-issued one-time viewer URL; the frontend must not choose or invent one.
2. **File response definition:** The OpenAPI currently declares the `200` response for `/pdf-library/file` as `application/json`, although the supplied contract says inline PDF/attachment behavior. Please define the actual content type(s), `Content-Disposition` behavior, range support, and any relevant response headers in OpenAPI.
3. **Error responses:** The supplied contract defines `503` as a temporary media-provider outage, but neither PDF operation documents `503`, `403`, or other operational response schemas/statuses in OpenAPI. Please add or explicitly confirm these status contracts and safe user-facing detail semantics.
4. **Opaque navigation/deep links:** There is no parent identifier in `PdfDirectoryListing`. Is browser history/root-only back navigation the intended UX, and may an opaque `path` identifier be represented in the SPA URL for a reload/deep link, or must it remain in memory only?
5. **EPUB contract:** The checked-in OpenAPI has no EPUB paths or schemas. Which finalized contract will define asset administration, digital-loan lifecycle/reissue, invitation redemption/session, protected content delivery, progress concurrency, profile-scoped administrator reading, and their error/read-only semantics?
