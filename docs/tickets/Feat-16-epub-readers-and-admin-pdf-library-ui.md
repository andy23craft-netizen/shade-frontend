# Feat-16 - EPUB readers and admin PDF library UI

**Status:** Proposed  
**Owner:** Frontend  
**Dependencies:** Backend Feat-14 finalized OpenAPI and supplemental frontend contract; selected hosted-reader integration; deployed external EPUB-provider and PDF-root configuration.

## Goal

Give Shade administrators two private media experiences—a native browser reader for EPUB-enabled catalog books and a phone-friendly browser for server-hosted PDFs—while giving an emailed EPUB borrower a safe, no-login reader. Preserve the distinction between physical circulation, digital EPUB loans, authenticated household reading, and non-catalog PDF files.

## Scope

### Shared frontend/API foundation

- Regenerate the checked-in OpenAPI client only after the backend contract is final, then add typed API clients, React Query hooks, cache keys, error mapping, and targeted invalidation for EPUB assets, digital loans, borrower progress, administrator/profile progress, and the PDF directory browser. Do not infer endpoints, response shapes, token transport, or status semantics before that contract exists.
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

- Add an administrator-only, phone-friendly PDF Library entry point in Manage Collection, using only the finalized directory-list and file-retrieval API.
- Render the server-provided current directory view with directories before files and alphabetical display-name order. Use opaque server-issued relative identifiers for navigation and retrieval; never derive, normalize, or reveal a filesystem path in the browser.
- Provide accessible directory navigation, loading, empty, unavailable-root, unauthorized, malformed-item, and retry states. A new directory request is the source of truth so additions/removals on disk appear without any frontend persistence or optimistic file model.
- Open PDFs in the browser-native viewer and offer download as a separate explicit action, both through authorized Shade endpoints. Do not fetch entire files into JavaScript memory, proxy bytes through the SPA, cache file URLs as durable state, or make PDFs available in viewer mode.

### Quality and accessibility

- Add unit tests for API serialization, sensitive-value redaction, profile locking, progress-state transitions, terminal loan states, and PDF directory navigation/error handling.
- Add Playwright and axe journeys for administrator EPUB checkout/reissue, borrower invitation redemption and resume, administrator owner/non-owner progress isolation and completion, physical/digital loan independence, and PDF browse/view/download authorization. Use mock secrets only and assert they do not appear in the page, browser URL after redemption, diagnostics, or ordinary app navigation.

## Acceptance criteria

- An administrator can identify an EPUB-enabled book and create an EPUB loan only after entering a valid borrower email, without changing the matching physical book's availability, placement, or physical-loan workflow.
- The administrator can distinguish physical and EPUB loans and safely see the backend-authorized loan/progress summary. Return/revoke and reset/reissue states are explicit, and reissue does not present a second historical loan.
- A borrower can open a valid emailed/QR invitation in more than one browser/device without a login, resume the shared server-backed position, and receive safe terminal/error states when access is invalid or inactive.
- The borrower reader exposes no secret token, external asset URL, borrower email, administrator navigation, or unrelated catalog data through its UI, routes, storage, diagnostics, or error presentation.
- A signed-in administrator selects a household reader before entering EPUB reading; that selection stays fixed for the open reader session, and another profile's progress/completion is never displayed or written accidentally.
- Administrator completion uses the existing selected-profile rating/review and mark-read behavior. It is retriable, does not duplicate completion, and an unfinished session does not mark the book read.
- The PDF Library is inaccessible to viewers, shows only backend-authorized directory/file metadata, supports keyboard and phone navigation, and delegates viewing/downloading/range streaming to the server rather than loading entire files into the SPA.
- Existing catalog browsing, physical checkout/check-in, loans, household-reader selection, and mark-read flows remain functional when EPUB or PDF services are unavailable.

## Out of scope

- Selecting, hosting, or operating the external EPUB provider; configuring outbound email; configuring the PDF root; or implementing backend token, cookie, content-proxy, progress-compaction, range-streaming, or filesystem safety.
- Borrower accounts, passwords, DRM, annotations, highlights, reader themes, offline/service-worker reading, reread tracking, and public PDF browsing.
- Importing PDFs into the catalog or creating PDF metadata, search, loans, or database records.
- A new frontend authentication model, direct calls to an EPUB host, or direct filesystem access.
