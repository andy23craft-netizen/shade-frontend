# Feat-16 - EPUB readers and admin PDF library UI

**Status:** Frontend reader/PDF implementation present; catalog discovery and borrower loan/redeem visual review blocked on backend changes below. Live PDF and administrator EPUB reader are verified. The checked-in and live fixture contracts are aligned at OpenAPI `1.11.5`.<br>
**Owner:** Frontend<br>
**Dependencies:** `epub.js` reader adapter; deployed EPUB provider and PDF-root configuration. The checked-in OpenAPI (`1.11.5`) and `API-for-FE.md` define the browser-session, streaming, and handoff behavior. Use the disposable development fixture described in `API-for-FE.md` for end-to-end verification.

## Goal

Give Shade administrators two private media experiences—a native browser reader for EPUB-enabled catalog books and a phone-friendly browser for server-hosted PDFs—while giving an emailed EPUB borrower a safe, no-login reader. Preserve the distinction between physical circulation, digital EPUB loans, authenticated household reading, and non-catalog PDF files.

## Scope

### Shared frontend/API foundation

- Regenerate the checked-in OpenAPI client, then add typed EPUB/PDF API clients, React Query hooks, cache keys, error mapping, and targeted invalidation. Use the contract routes directly: asset metadata/write, digital loans and actions, borrower redeem/content/progress, and profile-scoped administrator launch/content/progress/complete. Do not create a parallel book identity, authentication, or progress client.
- Before reader integration, research, select, and document a React-compatible EPUB reader that meets the protected/proxied-content, canonical-CFI resume, mobile-accessibility, maintenance, and bundle criteria. Keep it behind a reader adapter, and verify the choice does not cause existing gate/check requests to time out.
- Extend existing book-detail, loan-history, household-reader, and canonical mark-read flows rather than creating parallel book identity, auth, or completion state. Continue to use \`book_id\` and the active tenant host.
- Treat physical and digital loans as separate records and present their delivery/type labels clearly. An EPUB loan must never alter or imply a physical book's shelf, availability, active physical loan, or checkout eligibility.
- Respect \`AuthProvider\` viewer/admin state. Administrator surfaces require the existing tenant admin credential; public borrower-reader routes are an explicit, tightly scoped exception and must not make surrounding catalog, loan, PDF, or administration routes viewer-accessible.
- Surface server-provided returned, completed, revoked, invalid, reset, read-only, and retryable states in plain language. Never invent a client-side authorization decision, completion, tenant check, or progress-conflict repair.

### Administrator EPUB asset and loan controls

- On Book Details, provide administrator controls to inspect `GET /epubs/books/{book_id}/asset` metadata and set/replace its provider `storage_identifier` with `PUT /epubs/books/{book_id}/asset`. There is no delete route: clearing an asset is out of scope unless the backend adds an explicit deletion/clear contract. Do not display `storage_identifier`, provider paths, storage credentials, or an external asset URL.
- Add an EPUB checkout action separate from physical checkout. It requires and validates a borrower email before submission, shows the committed digital-loan result and delivery status, and makes clear that EPUB lending is unlimited and independent of the physical copy.
- Extend the appropriate reading-room loan list and book loan history with an explicit EPUB delivery/type indicator, borrower name/email as allowed by the administrator response, checkout/return timestamps, and the safe latest/final progress summary. Do not expose invitation secrets in a list or history response.
- Provide active-loan return/revoke and reset/reissue controls only where the backend authorizes them. Reset/reissue must confirm its effect, preserve the same loan history in the UI, and replace any previously displayed invitation material with the new server-issued result. The UI must not construct QR values or links from predictable IDs.
- After a successful EPUB checkout or reissue, show the administrator both the server-issued reader link and QR code as a backup delivery record. Render them ephemerally without persisting them in URL state, React Query cache, local/session storage, diagnostics, clipboard history, or analytics. Make copy/display behavior explicit and redact them from visible error details.

### Borrower EPUB reader

- Add a dedicated, minimally branded borrower-reader route driven only by the opaque invitation mechanism specified by the backend contract. Redeem an invitation query/fragment token immediately and replace it with a token-free route when the backend browser-session contract permits. The route must not load the normal authenticated app shell, call unrelated APIs, or expose admin navigation, borrower email, internal loan IDs, external EPUB-provider URLs, or token values in UI errors.
- Implement the selected native EPUB reader behind a small reader adapter. It must consume only the protected Shade content endpoint, restore the server-approved canonical CFI, and save a debounced ordered `EpubProgressWrite` (`base_revision`, optional CFI/chapter/percent values, `completed`) to `PUT /epub-reader/progress`. Use every returned revision for the next write. On `409`, refetch progress and merge or present the newer server position; never overwrite it. Do not treat a local CFI or percentage as durable until the server accepts it.
- Support normal reader loading, resume, refresh, temporary offline/network failure, retry, and terminal inactive states. Treat `503` as a provider outage and offer a user-triggered retry. Clearly state when progress is waiting to sync and do not claim cross-device synchronization until an accepted response confirms it.
- Follow the server's browser-session design. The frontend must not store or inspect a bearer credential intended for an \`HttpOnly\` cookie, append secrets to internal navigation, send credentials to third-party reader assets, or emit them through diagnostics. Use a restrictive referrer policy and avoid third-party analytics on borrower-reader pages; confirm the final headers/cookie behavior in integration tests.
- Do not offer borrower accounts, profile selection, annotations, highlights, library navigation, offline storage, or a client-side return/completion operation unless the finalized backend contract explicitly adds it.

### Authenticated administrator EPUB reader

- Show an authenticated **Read EPUB** entry point for an available EPUB-enabled book. Before opening the reader, use a modal to require selection of the owner or a household profile when household mode is enabled; make the selected reader and its independent progress clear in the launch confirmation.
- Open a dedicated authenticated reader route/tab whose profile is captured in its initial route/session state and cannot be changed in place. Do not silently substitute the global active reader after launch. A profile must be authorized and supplied to the backend for every progress and completion operation.
- Restore and synchronize only the selected profile's administrative progress using `GET /epubs/books/{book_id}/reader?profile_id=...` and `PUT /epubs/books/{book_id}/reader/progress?profile_id=...`, with the same revision conflict protocol as borrower progress. Fetch the returned protected `content_url` with the normal administrator credential. Keep that progress wholly separate from borrower-loan progress and from other household profiles. An already-complete book/profile starts at the beginning as directed by the backend; do not fabricate reread records.
- At natural reader completion, reuse the existing mark-read form/component in a dialog when its existing abstraction supports this without material duplication or regression; otherwise retain the canonical mark-read route and document why the dialog reuse was not practical. Submit through the canonical selected-profile mark-read behavior, with retriable validation/error states and no duplicate completion. Completion outside the reader remains valid and must not require 100% EPUB progress.
- Refresh the affected book detail, reading state, dashboard, and relevant progress/loan queries after successful completion; an unfinished reading session must not mark a book read.

### Administrator PDF library

Add an administrator-only, phone-friendly PDF Library entry point in Manage Collection. It must use the existing tenant administrator bearer credential and must never call either PDF route in viewer mode.

#### Confirmed PDF API contract

- List the root with `GET /pdf-library`. List a contained directory with `GET /pdf-library?path=<opaque-relative-directory-id>`. `path` is optional and nullable in the OpenAPI; omit it for the root rather than manufacturing an empty identifier.
- A successful listing is `PdfDirectoryListing`: `{ path, items }`. `path` and each `PdfLibraryEntry.identifier` are opaque relative identifiers, not display paths. An entry provides `identifier`, `name`, `kind` (`directory` or `file`), optional `modified_at`, and optional `size`. Do not infer an extension, MIME type, parent directory, or filesystem location from any field.
- Preserve the server's supplied item order. The server guarantees directories before files; the current contract does **not** guarantee alphabetical order, so the SPA must not re-sort the list.
- Enter a directory only with that entry's `identifier` as the next list request's `path`. Use client navigation history, retaining only prior safe display names for breadcrumbs/back navigation; never display, split, or normalize an opaque identifier to derive a parent.
- Create a handoff with `POST /pdf-library/viewer-handoff?identifier=<opaque-relative-file-id>`; add `download=true` for attachment mode. Open only its returned same-origin `viewer_url` (`/pdf-library/file`), which contains no identifier or token. The identifier is required and must be non-empty. Never navigate directly to a constructed file URL.
- Treat `503` as a temporarily unavailable media provider: retain the current view, show a retry action, and do not retry automatically. Treat `422` as an invalid/malformed request without exposing the identifier. The documented administrator bearer requirement means existing `403` handling applies even though the OpenAPI currently omits that operational response; never downgrade this surface to viewer access.
- The initial response and each directory navigation response are authoritative. Do not persist or optimistically mutate a directory model; a fresh request must reflect additions/removals on disk.

#### PDF UI and security requirements

- Render only backend-authorized metadata (`name`, `kind`, and, when supplied, safe formatted size/modified time). Provide accessible directory navigation plus loading, empty, unavailable-provider, unauthorized, malformed-item, and retry states.
- Do not expose the opaque identifier as visible path text, log it, include it in diagnostics, or transform it into a filesystem path. It may be held only as request/navigation state needed to call the Shade endpoint.
- Open PDFs in the browser-native viewer and offer download as a separate explicit action, both through authorized Shade endpoints. Do not fetch entire files into JavaScript memory, proxy bytes through the SPA, cache file URLs as durable state, or make PDFs available in viewer mode.
- Use the backend-owned native-viewer handoff defined in **Implementation prerequisites**. A normal browser navigation cannot attach the SPA's bearer Authorization header. Do not put a bearer token in a URL, create a blob URL from a full-file fetch, or weaken route authorization.

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

## Contract-ready implementation decisions

- Deployment must keep `/epub-reader/*` and `/pdf-library/file` on the frontend's public origin and proxy them to the backend without stripping their path-scoped cookies. Set backend `SHADE_PUBLIC_ORIGIN` to that same public frontend origin before issuing borrower invitations; the disposable API-only fixture's `127.0.0.1:8000` value is not a browser-UI cutover configuration. Production cookies remain `Secure` on HTTPS.

- `GET /pdf-library/file` serves `application/pdf`, supports byte ranges (`200`/`206`/`416`), and sets `Content-Disposition`, `Cache-Control: private, no-store`, and `Referrer-Policy: no-referrer`.
- An administrator must create each inline/download PDF view with `POST /pdf-library/viewer-handoff`; open only the returned same-origin identifier-free `viewer_url`. The scoped five-minute `pdf_viewer` cookie is the only bearer-auth exception for PDF retrieval and is bound to the file and download mode.
- EPUB byte streams are `application/epub+zip`, private/no-store, range-aware Shade endpoints. `content_url` is same-origin and admin-authenticated. Use bundled `epub.js` with an in-memory `ArrayBuffer`, never a provider URL or persistent EPUB cache.
- Progress writes return the current typed progress on `409`; refetch before retrying. Reader/PDF provider outages are `503`; mutations return `530` in site-wide read-only mode.

## Contract decisions incorporated

- The existing `MarkReadPage` owns a full route and mutable household selection, so it cannot be embedded in the locked-profile reader without a material refactor. The reader reuses its rating/review validation model and calls the canonical EPUB `reader/complete` route with the captured profile. The ordinary mark-read route remains available independently.

- The EPUB contract is now the checked-in OpenAPI plus the EPUB section of `API-for-FE.md`: all `/epubs` routes are administrator-only; borrower routes use only the opaque invitation redemption flow and its HTTP-only `epub_reader` cookie.
- `reader_url` and `qr_payload` from checkout/reissue are the same opaque secret. Render the QR locally, show the result only ephemerally, and never send it to a third-party QR service or retain it after dismissal/reissue.
- The borrower reader must issue its protected content/progress requests with credentials included. On successful redemption, immediately remove the invitation from the browser-visible URL with history replacement; do not append it to any subsequent route or request other than the redemption body.
- EPUB loans have state `active`, `returned`, `completed`, or `revoked`; state actions permit only `returned`, `completed`, or `revoked`. Reissue invalidates all prior invitation and browser credentials while retaining the same loan history.
- Asset association is PUT-only in the current contract. The UI supports inspect/set/replace, not remove.

## Live fixture verification and backend blocker (2026-09-22)

- Using the isolated `.tmp/feat14-db-1790104076` fixture, administrator sign-in, PDF root listing, cookie handoff, and browser-native identifier-free PDF streaming passed. The scoped `/pdf-library/file` request returned PDF bytes in a real Chromium session.
- A dedicated catalog record, `Feat 16 EPUB fixture (visual review)`, was created with the `shade-development-fixture.epub` asset. Its administrator profile launch, protected `206` EPUB content stream, progress write, stale-revision `409`, and browser reader launch passed. The fixture book ID is `a72a3f2e-dc26-43c8-a8e8-5592768ef12e`.
- `POST /epubs/books/{book_id}/loans` currently returns `500` on that fixture book. The backend traceback identifies `sqlite3.IntegrityError: FOREIGN KEY constraint failed` at `INSERT INTO epub_borrower_progress`: SQLAlchemy flushes that child before the referenced `epub_loans` row. The failed transaction did not add a loan. Backend action: explicitly flush/persist `Loan` and `EpubLoan` in dependency order before inserting `EpubBorrowerProgress` (or establish ORM relationships that guarantee this order), then add a regression test against SQLite with foreign keys enabled.
- After that fix, rerun checkout (`201` plus opaque invitation), browser redemption/cookie, protected content and progress, reissue invalidation, and return/revoke terminal states against the fixture. For browser testing, configure `SHADE_PUBLIC_ORIGIN` as the frontend public origin rather than the API-only fixture origin so server-issued invitation links open the SPA.

## Additional product requirement: viewer EPUB discovery

The Books browse page must show physical and EPUB-only catalog items together by default, identify EPUB items visibly, and offer an EPUB filter. EPUB-only items are a separate digital collection and must not increase physical dashboard counts. Separate EPUB and physical copies may share a `work_id` for work-level ratings/reviews, but remain distinct catalog items.

Current OpenAPI `1.11.5` cannot support this viewer experience: `GET /books` defaults to `placement_state=shelved` and omits an EPUB-only unshelved book; `BookRead` has no viewer-safe EPUB/format field; there is no EPUB filter on `GET /books`; and all `/epubs` routes require an administrator bearer. The frontend must not infer EPUB presence from title, shelf, or per-book administrator probes.

Backend contract/actions needed before the Books UI can ship this requirement:

1. Expose a non-secret, viewer-readable format indicator on `BookRead` (for example `available_formats: ["physical", "epub"]`), derived from physical ownership and EPUB asset association. Never expose `storage_identifier` or provider paths. Define how an unavailable EPUB provider affects the indicator.
2. Add a server-side `GET /books` format filter supporting at least all/physical/EPUB. For the integrated browse result, include EPUB-only unshelved items alongside physical books with correct total, stable pagination, sorting, and existing composable filters. Preserve existing physical-only callers via an explicit/default mode as appropriate; document `placement_state` interactions and the meaning of a dual-format record.
3. Contractually guarantee that `GET /dashboard` physical book metrics and `GET /dashboard/breakdowns` exclude EPUB-only items. Current owned-book predicates count shelved/stashed books, so the isolated unshelved EPUB fixture is already excluded; retain this behavior when changing catalog discovery. Define physical ownership independently of EPUB asset presence so a dual-format physical copy counts once.
4. Keep separate catalog identities where an EPUB and physical copy are separate items, with existing `work_id` correction/merge behavior available for shared work-level ratings and reviews. Add OpenAPI fields/filter plus viewer and dashboard regression tests, then sync `API-for-FE.md`.

Frontend follow-up once that contract is live: make Books browse explicitly request integrated results, add an EPUB filter and format badges/cards, preserve all other filters and URL state, and add viewer, pagination, and physical-dashboard regression tests. Do not place an EPUB-only fixture book on a physical shelf merely to make it appear in browse.

### Related editions on Book Details

On a viewer-readable physical Book Details page, show an available EPUB edition of the same `work_id` as a separate, linked catalog item. This must work when the physical copy is `display_only`, checked out, or otherwise unavailable; digital availability is independent of physical status. Conversely, an EPUB item page may link to its physical sibling(s). Use backend-confirmed work identity and item IDs, not title/ISBN guessing, and never show the current item as its own alternative. A related-edition card should identify the EPUB format and link to that EPUB catalog detail route (`/books/{epub_book_id}`). The viewer action is **View EPUB edition**, not **Read EPUB**: it must not create a loan, redeem an invitation, or launch the protected reader. Do not expose asset identifiers, provider URLs, borrower email, or invitation material.

The current `GET /works/{work_id}` is administrator-only, so viewer pages need a minimal viewer-readable related-book endpoint/field (or a viewer-safe `GET /books?work_id=...` filter) that returns only authorized catalog metadata and format/availability indicators. Add tests for display-only and checked-out physical copies pointing to an available EPUB, shared-work identity, unrelated-work exclusion, and tenant isolation. The EPUB-specific reader invitation remains private under the current administrator-issued loan contract; self-service digital borrowing is out of scope.

## EPUB inventory and deployment seeding

NAS files alone do not create catalog rows. The current backend has a per-book administrator asset association route but no EPUB inventory import/sync path. Before live cutover, provide an operator-owned, idempotent seed/import workflow that reads an approved EPUB manifest (or an equivalently reviewed NAS inventory), creates/updates the required book metadata rows, and associates each relative provider identifier with `EpubAsset`. Record source identifiers and matching rules so reruns do not duplicate books or overwrite curator edits. Validate that each referenced EPUB exists and is readable, report failures without partially mislabeling items, and run against the deployment database/NAS on the deployment machine—not by copying the development fixture DB.

For an EPUB-only item, keep the catalog record out of physical shelf membership so it remains outside existing physical dashboard counts. Supply the viewer-facing EPUB collection through the format-aware catalog query/filter above; do not create an ordinary `shelves` row named EPUBs merely to make it visible, because current shelved-book predicates would count it as a physical book. If product requires an EPUB “shelf” presentation, model it as a virtual digital collection or introduce an explicit digital shelf type with matching count exclusions. Where a physical edition exists, link the separate EPUB catalog item to the same `work_id` through the supported work-correction flow while preserving separate item identities.
