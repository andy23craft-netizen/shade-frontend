# Feat-14 - EPUB browser loans and admin PDF library

**Status:** Proposed  
**Owner:** Backend (with reader/frontend and email-delivery work)  
**Dependencies:** External EPUB host/layout decision, outbound email configuration, and reader application contract.

## Goal

Add two distinct hosted-media capabilities:

1. Lend a digital EPUB copy of a book through a no-login reader invitation sent by email and QR code, with progress
   shared securely across the borrower's authorized browsers/devices as a loan event.
2. Let authenticated tenant administrators read available EPUBs directly, with reading progress tied to their signed-in
   account and selected household reader across browsers.
3. Give authenticated tenant administrators a private, phone-friendly listing of PDFs already hosted on this server,
   without importing those files or their metadata into the tenant database.

The EPUB capability is a form of book checkout, not a replacement for existing physical-book checkout. The PDF
capability is private administrator access, not circulation and not a public document library.

## Scope

### EPUB browser loans

- Add an administrator-only way to identify which catalog books have an EPUB lending asset. The asset itself remains
  on the external EPUB server. Store a stable abstract asset/storage identifier, never a machine-specific absolute
  filesystem, Windows/UNC, or Linux mount path; the final provider and path/key layout remain deferred.
- Add a digital-EPUB checkout flow that creates a first-class loan record linked to the catalog book and digital asset.
  Digital circulation is unlimited and independent of the matching physical copy: it must not change physical shelf
  placement/status, make a physical book unavailable, or be blocked by physical checkout state.
- Require a borrower email address for every EPUB loan. This is the only checkout flow where email is mandatory.
- Reuse Shade's existing email delivery path/configuration to send an invitation containing both a high-entropy reader
  URL and a QR-code representation of the same loan-access mechanism. Reuse the project's QR-generation capability.
  The URL opens a hosted EPUB reader, which obtains content through a server-side integration/proxy rather than
  exposing a durable direct external-asset URL to the borrower.
- Do not require the borrower to create an account, sign in, or supply a password.
- Keep the invitation link/QR usable for the lifetime of the active loan. Each browser/device may redeem it to establish
  its own secure, persistent local browser credential; no borrower account is required. All authorized credentials
  access one server-side loan and its shared borrower progress, enabling accurate continuation across devices.
- Treat the emailed URL and browser credential as secrets: use opaque, random, stored-hashed tokens; never log them;
  set `Secure`, `HttpOnly`, and appropriate `SameSite` cookie attributes; prevent token leakage through referrers,
  analytics, error pages, and external asset requests.
- Record the latest durable progress for each active borrower loan, including a canonical EPUB CFI (or similarly
  reliable position), server timestamp, completion state, reading percentage, current chapter, and chapter/overall
  progress where available. Restore this state on any authorized browser/device. Event writes must be idempotent or
  safely de-duplicated so reconnects and retries cannot corrupt progress; V1 does not require invasive activity
  analytics, timelines, exports, annotations, highlights, or reader customization.
- Retain the borrower email for the lifetime of the historical loan record, along with a useful final/latest progress
  summary. Compact intermediate progress events once they are no longer needed for reliable synchronization or
  auditing; do not keep an indefinitely growing detailed event history solely for analytics.
- A digital loan has no due date or automatic expiration in V1. It remains active until returned, completed, or
  administratively revoked. An inactive loan must immediately reject invitation redemption, content access, and
  progress reads/writes while preserving the historical loan and progress record for administrators.
- Provide administrator reset/reissue of an active loan's access without creating a second loan or losing history.
  Reset/reissue invalidates all earlier invitation and browser credentials, then produces a fresh reader link/QR.
- Include EPUB loans in loan history with an explicit media/delivery type, borrower display name/email as appropriate,
  checkout/return timestamps, and reader-progress summary. Existing book- and album-loan APIs must remain compatible.
- Enforce tenant isolation for assets, grants, events, and emailed links. Apply site-wide read-only mode to all
  EPUB-loan and progress mutations.

### Authenticated administrator EPUB reading

- Make every EPUB-enabled catalog book available to every signed-in Shade administrator through the native hosted
  reader, without creating an anonymous borrower invitation or requiring an email checkout. "Administrator" uses the
  existing Shade admin-password/session model; this feature introduces no new role hierarchy.
- Authorize this reader path with the administrator's ordinary authenticated session. Progress must be associated with
  the signed-in account and the owner or selected household profile, not with a browser-bound bearer link.
- Require selection of the owner or a household reader before an administrator enters the reader. Synchronize the
  latest accepted position for that selected profile across authenticated browsers/devices. Each profile's EPUB
  progress is independent; opening the same EPUB for another profile starts/uses only that profile's state.
- Keep administrative reading state separate from an anonymous EPUB-loan reader's events and credentials. An admin
  opening an EPUB must not redeem, consume, or gain access through a borrower's emailed loan link.
- At the natural end of the native reader, offer an authenticated "mark read" completion action. It must prompt for
  the existing rating and review inputs and write the result through the canonical book reading-state behavior for the
  owner or explicitly selected household reader profile.
- Preserve the existing household rules: owner completion mirrors to the book-level read/completion fields; a
  non-owner household profile receives only that profile's personal reading state. The reader must make the active
  profile clear before progress or completion is recorded.
- Lock the selected profile for the life of an open reader tab/session; it cannot be changed in place. A separate tab
  or authenticated browser session may independently choose another profile for the same EPUB.
- Support resuming an unfinished admin reading session without prematurely changing the book/profile to read. If an
  already-read book/profile is opened again, start at the beginning: V1 does not create reread events or treat the old
  completed position as active progress. Rating and review submission must be validated and retriable without
  duplicating completion or feedback data.

### Admin PDF library

- Add an authenticated administrator-only PDF-library endpoint/page. It lists PDFs from one configured server-side
  root and its contained subdirectories, and allows an administrator to open/download a selected file from a phone or
  another personal device. The exact root remains deployment-dependent.
- Do not create database rows, catalog records, full-text indexes, or loans for PDFs. The filesystem remains the source
  of truth; additions and removals appear on the next listing request.
- Limit discovery and serving to a configured PDF root. Resolve and validate every path before use; reject traversal,
  symlinks escaping the root, non-PDF files, and directories. Do not expose arbitrary server filesystem paths.
- Return safe display metadata derived from the file system only (e.g., display filename, size, and modified timestamp).
  Do not leak absolute paths or unrelated file metadata.
- Order each directory view with subdirectories first, then files, alphabetically by display name within each group.
- Stream files only after authorization and with an appropriate PDF content type, content-disposition policy, cache
  policy, range-request behavior, and response headers suitable for mobile viewing. Support large PDFs without loading
  whole files into application memory; V1 has no arbitrary product file-size limit.
- Keep PDF routes out of viewer/public-mode exemptions. Admin session authentication remains required for listing and
  file retrieval, using the existing Shade admin-password/session model rather than a new role hierarchy.
- Treat an unavailable, unreadable, or malformed configured root as a controlled operational error rather than an
  empty success or an exposed traceback.

## Proposed API and data contract

Exact paths and schema names are implementation decisions, but the public contract should cover the following
operations:

- Administrator: configure/associate an EPUB lending asset with a book, inspect the asset state, create an EPUB loan,
  view active/historical EPUB-loan progress, return/revoke an EPUB loan, and reset/reissue its access material.
- Borrower browser: redeem an active invitation link or QR code to establish a local browser session, request protected
  EPUB manifest/content, fetch/write the shared loan progress, and display returned/completed/revoked/invalid states.
- Authenticated administrator browser: list/open available EPUBs, select the owner or a permitted household profile,
  fetch and write cross-browser reading progress, resume a prior position, and complete the book with rating/review.
- Administrator: list configured-root PDFs and retrieve a selected PDF by an opaque relative identifier, never an
  absolute path supplied by the client.

Database changes should keep physical and digital circulation distinct. A likely model is a digital-asset table, an
EPUB-loan extension with a revocable invitation credential and one-or-more browser-session credentials, and separate
borrower-loan and household-profile progress state associated with the existing loan/book identities. The final design
must preserve the current `loans` typed-FK invariant or deliberately evolve it with explicit schema constraints,
serialization, cleanup, dashboard, feedback, and OpenAPI changes.

Select the hosted/native EPUB reader library during implementation research and record the decision and rationale in
the implementation documentation. Evaluate candidates against the actual Shade frontend/backend architecture, React
browser integration, protected/proxied content delivery, reliable EPUB CFI resume, mobile usability, cross-browser
progress persistence, current maintenance status, and prevention of underlying asset-URL exposure. This is an
implementation decision, not a product decision required from the owner.

## Acceptance criteria

- An administrator can lend an EPUB-enabled book only after supplying a valid borrower email; an ordinary physical
  book checkout remains usable without an email.
- A successful EPUB checkout creates a loan audit record with no due date and uses Shade's existing email path to send
  one invitation containing both a reader link and QR code. Following existing checkout behavior, a delivery failure is
  observable but does not roll back the committed loan; an administrator can reset/reissue the invitation.
- The link or QR opens the reader without a borrower login and remains redeemable on multiple browsers/devices while
  the loan is active. Each redemption establishes a secure local credential, and all authorized sessions see and update
  the same borrower-loan progress.
- Progress persists through refresh, temporary network loss, tab closure, and authorized device changes; it is ordered
  safely under retries and is not attributed to another tenant or loan.
- Reset/reissue invalidates all earlier invitation and browser credentials for that loan, preserves loan/progress
  history, and issues fresh link/QR access without creating another loan. Returned, completed, revoked, malformed, and
  reset credentials produce safe, non-enumerating responses.
- A signed-in administrator can open an available EPUB without an email loan and resume their selected owner or
  household profile's independent progress in another authenticated browser. The profile must be selected before the
  reader opens and cannot change within that open reader session. This authenticated progress is never shared with an
  anonymous borrower loan or another household profile.
- Completing an EPUB in the authenticated reader prompts for rating and review, then marks the book read using the
  selected profile's canonical reading state. Owner completion updates book-level completion/read data; non-owner
  household completion does not overwrite the owner's book-level state.
- An admin cannot accidentally record progress or completion for the wrong household profile, and an incomplete
  reading session does not mark the book read. A book/profile already marked read opens at the beginning; rereads are
  not separately tracked. A mark-read action outside the reader may represent finishing elsewhere and does not require
  EPUB progress to have reached 100%.
- A returned, completed, or revoked EPUB loan cannot redeem an invitation, fetch content, or read/write progress; the
  administrator can still see its historical loan/progress summary.
- A physical checkout/check-in continues to work independently of an EPUB loan for the same catalog book. EPUB
  circulation is unlimited and never consumes or changes physical availability.
- No reader token, browser credential, borrower email, or external EPUB storage credential is present in application
  logs, analytics, API list responses, referrers, or client-visible asset URLs.
- An authenticated administrator can list and view only PDFs beneath the configured root from a phone-compatible
  response. An unauthenticated request, a viewer-mode request, a traversal attempt, a symlink escape, or a request
  for a non-PDF is denied.
- Adding/removing a PDF on disk changes the next admin listing without any database write. No PDF file or metadata is
  persisted in SQLite.
- The PDF browser exposes contained subdirectories and orders directories before files, alphabetically by display name
  within each group. It supports inline viewing and downloads using streaming/range responses without an arbitrary
  product file-size cap or whole-file application-memory load.
- Borrower email remains with the historical loan, and historical loan views retain the useful final/latest progress
  summary without accumulating an indefinitely growing detailed progress-event history for analytics.
- Tests cover authorization, tenant isolation, multi-device redemption/race conditions, replay, reset/reissue,
  invitation/session token confidentiality, return/completion/revocation invalidation, progress retry/order and
  cross-device sync, profile independence, email failure, read-only mode, PDF-root failures, and path/symlink
  traversal defenses. Regenerate OpenAPI and update the supplemental frontend contract when routes are finalized.

## Out of scope

- Building or operating the external EPUB file server and deciding its directory/object-key structure.
- Borrower accounts, passwords, social sign-in, DRM, watermarking, rights acquisition, and guarantees against copying
  content visible in a browser.
- Offline EPUB reading, service-worker/offline caching, and offline loan enforcement.
- Reread tracking as separate reading events.
- Importing, cataloging, searching, annotating, or tracking reading of the admin PDFs.
- A public or viewer-mode PDF gallery.

## Open questions

1. What external EPUB integration will the Marvin/NAS deployment expose (e.g., authenticated HTTP files, object
   storage, or an API), and how will Shade resolve the stable abstract asset identifier through it without coupling to
   a machine-specific mount path?
2. What is the configured PDF root in the eventual Marvin/NAS deployment? The browser behavior below that root is
   otherwise defined: expose contained subdirectories; list directories first, then files, alphabetically; and stream
   large PDFs without an arbitrary product file-size cap.
