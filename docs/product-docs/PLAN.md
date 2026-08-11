# Frontend Production Plan

## 1. Purpose

This document is the implementation roadmap for turning the current Shade frontend scaffold into a production-ready
interface for the home-library API.

It is intentionally organized so that each numbered workstream can be converted into one or more independently
reviewable feature tickets. The plan is complete when every in-scope workstream and release gate in this document has
been satisfied.

## 2. Sources and authority

This plan reconciles:

- `PRODUCT_REQS.V1.md` for user outcomes and MVP scope.
- `../technical-reference/openapi.json` for paths, methods, status codes, request/response schemas, enums, and
  nullability (OpenAPI 3.1; LibraryV2).
- `../technical-reference/API-for-FE.md` for behavioral guidance OpenAPI does not fully express (auth, CORS, error
  meanings, lifecycle rules, ISBN quirks, backup download, FE vs API ownership).
- `../ToDo.md` for the requested stack, pages, and build artifacts.
- The current repository for the implemented frontend baseline.

Treat the two technical-reference files as complementary, not interchangeable. The checked-in OpenAPI document is the
in-repo source of truth for schemas. Before implementing an API-dependent ticket, compare that file (and the relevant
portion of `API-for-FE.md`) with a representative running backend `/openapi.json`. Contract drift must be corrected in
the owning system or recorded as an explicit blocker; the frontend must not silently invent backend behavior.

## 3. Confirmed product and delivery decisions

The following decisions remove ambiguities in the source documents:

- The MVP supports ISBN-10 and ISBN-13 barcodes only. UPC support is deferred.
- A failed, timed-out, or unsuccessful metadata lookup always permits manual entry.
- API field `acquisition_source` represents the product requirement's purchase location.
- The frontend validates ISBN-10 check digits before lookup or creation because the backend currently validates only
  ISBN-13 check digits after normalization.
- The frontend sends date-only values as `YYYY-MM-DD` and timestamps as normalized UTC ISO 8601 strings. The API stores
  temporal fields as unvalidated strings, and malformed loan timestamps can later break borrowing-statistics requests.
- The UI prevents soft-deleting an on-loan book. The backend permits it but leaves the active loan open and requires the
  book to be restored before it can be checked in.
- Search, filtering, and the other future enhancements in `PRODUCT_REQS.V1.md` remain outside the MVP. The active list may
  still be browsed in the title order returned by the API.
- The browser will be given the shared Bearer token at runtime. The token must never be committed, emitted into logs, or
  compiled into a Vite bundle.
- Browser-side use of a shared token is an accepted risk for a trusted, access-controlled deployment. It is not
  equivalent to secure user authentication.
- This repository produces a versioned static production tarball.
- This repository also provides a Podman image for local development and previews.
- A separate deployment repository owns remote transfer, extraction, web serving, Ansible, systemd, TLS, production
  configuration, and rollback orchestration.

## 4. Current baseline

The repository already provides:

- React 19, TypeScript, Vite, Node.js, and Yarn.
- Strict TypeScript compilation.
- ESLint, Vitest, React Testing Library, and a jsdom test environment.
- Make targets wrapping install, run, preview, lint, type-check, test, build, and complete quality checks.
- A responsive but placeholder `Hello, world!` page.
- A production build emitted to `../../dist`.

The repository does not yet provide:

- Routes, navigation, feature pages, or reusable application components.
- API configuration, types, requests, authentication, caching, or error handling.
- Forms or any product workflow.
- Barcode scanning.
- Automated accessibility or browser-level tests.
- A CI pipeline, production tarball target, or Podman definition.
- Runtime error reporting or release/version metadata.

This means no backward-compatible product UI needs to be preserved. The existing quality commands should remain the
baseline and be extended rather than replaced.

## 5. MVP user outcomes

Completing this plan must let a user:

1. Open a read-only dashboard and understand the collection, borrowing, and reading totals.
2. Browse active books and inspect a book's metadata, availability, reading state, and borrowing statistics.
3. Add a book by camera scan, dedicated scanner, typed ISBN, or fully manual entry.
4. Review and edit looked-up metadata before creating a book.
5. Edit a book's bibliographic and library-specific metadata.
6. Check out an available book with borrower and optional loan details.
7. Check in an on-loan book while preserving its history.
8. Review active and returned loan history.
9. Mark an active book as read and later update its completion date, rating, and review.
10. Soft-delete a book, keep its history, view deleted books, and restore one.
11. Understand and recover from validation, authentication, conflict, lookup, connectivity, and empty-data states.
12. Download an authenticated SQL backup containing the complete library and loan history.

## 6. Target information architecture

Use client-side routing with these user-facing destinations:

- `/` — dashboard.
- `/books` — active collection.
- `/books/new` — ISBN-assisted or manual book creation.
- `/books/:bookId` — book details and available lifecycle actions.
- `/books/:bookId/edit` — editable metadata.
- `/checkout` — select and check out an available book.
- `/checkin` — select and return an on-loan book.
- `/loans` — active and returned loan history.
- `/admin/deleted` — soft-deleted books and restore actions.
- `/admin/backup` — authenticated full-library SQL backup.
- `/settings/connection` — runtime API URL and Bearer-token configuration.
- A not-found route with a path back into the application.

The application shell must provide persistent access to Dashboard, Books, Add Book, Check Out, Check In, and Loans.
Administrative deletion/restore and connection settings may be visually separated, but there is no role-based
authorization in the MVP.

Direct navigation and refreshes on client routes require an SPA fallback to `../../index.html`. The production tarball
documentation must state this requirement for the deployment repository.

## 7. Target frontend architecture

### 7.1 Code organization

Organize code by responsibility without creating a global abstraction for every component:

- `src/app/` — application bootstrap, router, providers, layouts, and error boundary.
- `src/api/` — generated or contract-derived types, client, errors, query keys, and API test fixtures.
- `../../src/components` — reusable, product-agnostic UI primitives.
- `src/features/books/` — catalog, details, create, edit, delete, and restore.
- `src/features/scanning/` — camera and hardware-scanner input.
- `src/features/loans/` — checkout, check-in, and loan history.
- `src/features/reading/` — reading completion, rating, and review.
- `src/features/dashboard/` — dashboard queries and presentation.
- `src/config/` — validated runtime configuration.
- `../../src/test` — shared test setup, API mocks, builders, and render helpers.

Feature code may be split further when a ticket demonstrates a need. Avoid a general client-state store unless a
concrete cross-route state requirement emerges.

### 7.2 API contract and types

- Derive TypeScript models from `../technical-reference/openapi.json` when a stable generation path is available. If
  generation is not yet practical, maintain explicit types and contract fixtures checked against that file. Re-check
  against a representative running backend `/openapi.json` before locking transport types.
- Model nullable fields, dates, timestamps, enums, and no-content responses exactly.
- Keep API transport models separate from form values when HTML inputs require different representations.
- Treat the API as the source of truth for ISBN normalization, persistence, lifecycle transitions, loan records, and
  dashboard calculations, while compensating for the documented ISBN-10 and temporal-string validation gaps in
  `API-for-FE.md`.
- Model collection responses as `{ items, total }`. The books API is title-ordered and the loans API is ordered by
  `checked_out_at` descending; neither endpoint currently supports pagination, and loans do not support filtering.
- Send date values as `YYYY-MM-DD` and timestamps as normalized UTC ISO 8601 strings. Keep `publication_date` as an API
  string because lookup may return a year only; use `YYYY-MM-DD` for user-entered purchase dates without coercing
  year-only lookup metadata into a full date.
- Represent `BookRead` borrowing statistics (`times_borrowed`, `last_borrowed_at`, and `average_loan_days`) and the
  exact loan audit names (`created_date` and `last_updated_date`) without renaming them in transport types.
- Serialize only documented request fields because backend request models silently ignore unknown properties. Do not
  treat `updated_date` as a concurrency token because generic `PATCH` currently does not update it.
- Preserve unknown response fields and fail safely if a future enum value is returned. The UI should display a neutral
  fallback rather than crash.

### 7.3 Runtime connection and token handling

The static bundle must load non-secret connection configuration at runtime so one artifact can be promoted between
environments. At minimum, runtime configuration must provide the API base URL and application release identifier.

API routes are rooted directly at the configured base URL; the client must not assume an `/api` prefix. Use public `GET
/health` to distinguish basic API reachability from protected-access verification where useful.

The Bearer token must be entered or injected at runtime and kept out of source files, build arguments, generated
JavaScript, source maps, URLs, analytics, and error reports. The default browser implementation should:

- Provide a connection settings screen before protected routes are used.
- Keep the token in memory and `sessionStorage`, not in the static runtime config.
- Offer an explicit "forget token" action.
- Verify credentials using `GET /protected`.
- Send `Authorization: Bearer <token>` on every protected request.
- Clear the active token and return to connection setup after a confirmed invalid credential response.

Because the API returns `403` for both missing and invalid credentials, the UI should describe this as "API access was
rejected" rather than pretending to know the cause.

The token remains inspectable by a user or script running in the browser. Production release therefore requires trusted
network access, strong content-security controls at the host, and acceptance of this limitation. A future
user-authentication or server-side token-injection design supersedes this model.

### 7.4 Browser connectivity

The backend permits the default local Vite origins and supports deployed cross-origin frontends through its
`CORS_ORIGINS` configuration. Production must configure the frontend's exact origin, including scheme, hostname, and
port, with no path or trailing slash. Cross-origin requests may send `Authorization` and `Content-Type`, and frontend
JavaScript may read `Content-Disposition`; cookies and credentialed CORS are not part of the contract.

A deployment-managed same-origin reverse proxy remains optional. Whichever arrangement is selected must be tested with
the production tarball, including preflight behavior and authenticated backup filename access.

### 7.5 Requests, server state, and refresh

Use a query/cache layer for server-owned data:

- Books, individual book details, loans, and dashboard summaries are server state.
- Forms own transient form values.
- Scanner state and dialogs remain local UI state.
- Runtime connection state is application-wide.

After a successful mutation, update the returned book in cache and invalidate every affected aggregate:

- Create/edit/delete/restore: active/deleted book lists, book detail, dashboard.
- Checkout/check-in: book lists, detail, loans, dashboard.
- Mark read or edit reading fields: book lists, detail, dashboard.

There is no realtime API. Refetch on route entry, after mutations, on an explicit refresh action, and when the browser
regains focus or connectivity if the data is stale. Do not imply that multiple open clients update instantly.

### 7.6 API error model

Normalize transport and API failures into one UI-facing error model while preserving the HTTP status and safe server
detail:

- `403` — access rejected; guide the user to connection settings.
- `404` — resource unavailable; refresh stale lists and offer safe navigation.
- `409` — state changed or action is invalid; show the server message and refetch the affected resource.
- `422` — map FastAPI `detail[].loc` entries to fields and provide an error summary; also support string `detail`, which
  the ISBN lookup uses for an explicitly rejected ISBN.
- `500` from backup — explain that backup generation failed and preserve the current page for retry.
- `502` and `504` during lookup — explain provider failure and offer retry or manual entry.
- Network, timeout, invalid JSON, and unexpected `5xx` — show a retryable generic error without leaking request headers
  or private form data.

Handle `204 No Content` without parsing JSON. Treat lookup response `found: false` as a normal manual-entry path, not an
error. The backup success response is a SQL blob rather than JSON and must use its exposed `Content-Disposition`
filename when safely parseable.

### 7.7 Forms and validation

Client validation exists for timely, accessible feedback; backend validation remains authoritative.

- Require non-blank title and authors and enforce documented 255-character limits even though the API currently accepts
  empty strings.
- Validate pages as a positive integer and rating as an integer from 1 through 5.
- Validate ISBN-10 and ISBN-13 check digits for immediate feedback; still send accepted ISBNs to the API for canonical
  normalization and authoritative persistence validation.
- Require a non-blank borrower of at most 255 characters even though the API currently accepts whitespace-only values.
- Present category, shelf, and status using API enum controls with `unknown` support. A metadata status control may
  expose non-loan states, but it must not use `available` or `on_loan` to simulate check-in or checkout.
- Use date or date-time controls matching each documented API field and serialize normalized values as specified in
  section 7.2; do not pass arbitrary temporal strings through to the API.
- Convert blank optional values to the API's expected `null` or omitted value.
- Keep tags editable as individual strings and define deterministic whitespace and duplicate handling in the
  implementation ticket.
- Never expose direct editing of `borrower` or `datetime_loaned_out` in the generic metadata form.
- Preserve unsaved user input when a recoverable request fails.

Allow explicit `null` only for documented nullable fields. Never send `null` for `title`, `authors`, `category`, `shelf`,
`is_read`, or `status`, because the request schema accepts it but the database commit can fail. Before form
implementation, verify purchase-price precision/currency and duplicate-ISBN behavior; any unresolved difference must be
captured in that ticket.

### 7.8 UI, responsiveness, and accessibility

Build for keyboard, touch, phone, tablet, and desktop use:

- Use semantic landmarks, headings, controls, tables/lists, and native inputs.
- Provide a skip link, visible focus indicators, and logical focus order.
- On route changes, update the document title and move focus to the route heading.
- Every input has a persistent label, help text where needed, and linked error text.
- Validation failures include a focusable summary and field-level messages.
- Loading and mutation states use appropriate status/live regions without excessive announcements.
- Confirmation dialogs trap and restore focus and are fully keyboard operable.
- Color is never the only indicator of read, loan, deletion, or error state.
- Layout and hit targets remain usable at a 320 CSS-pixel viewport.
- Respect reduced-motion preferences.
- Camera permission denial and unsupported scanning receive accessible explanations and a manual alternative.

### 7.9 Operational visibility

At minimum, provide:

- A root error boundary with recovery navigation.
- A visible application release/version identifier.
- Consistent, redacted diagnostic reporting hooks.
- Optional production error reporting configured only at runtime.
- No borrower names, notes, reviews, ISBN drafts, or tokens in telemetry by default.

If the backend supplies a request or correlation ID, show it in safe error details and forward it to diagnostics.
Observability vendor selection is not required for the MVP frontend implementation.

## 8. API operation rules

Use only the dedicated endpoint for each state transition:

- Metadata lookup: `GET /books/lookup?isbn={isbn}`.
- Create: `POST /books`.
- Metadata and later reading edits: `PATCH /books/{id}`.
- Soft delete: `DELETE /books/{id}`.
- Restore: `POST /books/{id}/restore`.
- Checkout: `POST /books/{id}/checkout`.
- Check-in: `POST /books/{id}/checkin`.
- Mark read: `POST /books/{id}/mark-read`.
- Full SQL backup: `GET /backup`.

Generic `PATCH` must not simulate checkout, check-in, restore, deletion, or the initial mark-read action. This protects
the API's loan history and lifecycle invariants.

## 9. Phased implementation workstreams

Each workstream below should become a feature, quality, or operations ticket. A ticket may be divided if its review
surface becomes too large, but its acceptance criteria must not be lost.

### Workstream 1 — Application shell and accessible navigation

**Goal:** Replace the placeholder with the stable structure used by all workflows.

**Prerequisites:** None.

**Deliverables:**

- Client router and the route map in section 6.
- Responsive application layout and primary navigation.
- Not-found route, route titles, skip link, and route-focus management.
- Shared button, link, field, alert, loading, empty-state, dialog, and notification primitives.
- Initial design tokens for spacing, type, color, focus, status, and breakpoints.
- Root error boundary and a provider composition point.

**Acceptance criteria:**

- Every route can be reached by keyboard and direct URL.
- Current navigation state is conveyed visually and semantically.
- Phone and desktop layouts do not overflow at supported sizes.
- Shared states have component tests, including focus and accessible naming.
- The existing quality gate passes.

**Suggested ticket:** `FEAT-02 — Application shell, routing, and shared UI`.

### Workstream 2 — Runtime configuration and typed API foundation

**Goal:** Give all product features one tested and safe integration layer.

**Prerequisites:** Workstream 1 may proceed in parallel, but both must finish before product pages.

**Deliverables:**

- Runtime config loading and validation for API URL and release identifier.
- Connection settings and session token management.
- Public reachability checking through `/health`.
- Credential verification through `/protected`.
- Typed client for all documented routes.
- Authenticated blob-download support for `/backup`, including safe `Content-Disposition` filename parsing.
- Normalized error model, request timeout policy, and safe retry rules.
- Query/cache provider, query keys, mutation invalidation helpers, and offline/focus behavior.
- API mocks and builders for success and every documented error family.
- Local development proxy or documented cross-origin setup.

**Acceptance criteria:**

- No secret appears in the built assets, source maps, test snapshots, URLs, or logs.
- Protected requests consistently include the runtime token.
- `403`, `404`, `409`, `422`, backup `500`, `502`, `504`, network failures, binary success responses, and `204` are
  covered by client tests.
- Changing runtime API URL does not require rebuilding the frontend.
- Health and credential checks produce distinct, actionable connection states.
- A contract smoke test succeeds against a representative running API.

**Suggested ticket:** `FEAT-03 — Runtime API configuration and client platform`.

### Workstream 3 — Active collection and book details

**Goal:** Let users browse and understand their active library.

**API:** `GET /books`, `GET /books/{id}`.

**Deliverables:**

- Active title-ordered collection page.
- Book detail page showing all useful bibliographic and library metadata.
- Clear available, on-loan, read/unread, missing, display-only, reserved, and reading states.
- Borrowing statistics: times borrowed, last borrowed date, average completed-loan duration.
- Contextual links to edit, checkout/check-in, mark read, and delete when valid.
- Loading, empty, not-found, stale, and retry states.

**Acceptance criteria:**

- Deleted books never appear in normal browsing.
- On-loan books are visibly unavailable and cannot start another checkout.
- Null optional fields and unknown enum values render safely.
- Detail links and back navigation work on narrow and wide screens.
- API success and failure states have component/integration tests.

**Suggested ticket:** `FEAT-04 — Library collection and book details`.

### Workstream 4 — Manual and ISBN-assisted book creation

**Goal:** Add books without depending on successful external metadata.

**API:** `GET /books/lookup`, `POST /books`.

**Deliverables:**

- One creation flow supporting typed ISBN lookup and a manual-entry path.
- Editable draft populated from successful lookup metadata.
- Required title and authors plus ISBN, publisher, publication date, pages, category, shelf, tags, purchase date,
  purchase price, acquisition source, and notes.
- Lookup progress, not-found, invalid ISBN, provider failure, timeout, retry, and cancel behavior.
- Successful creation navigation to the new book detail.
- Protection against accidental duplicate submissions.

**Acceptance criteria:**

- ISBN-10, ISBN-13, spaces, and hyphens are sent to the API without frontend assumptions about normalization.
- Invalid ISBN-10 check digits are rejected by the frontend before the API's documented normalization gap can accept
  them.
- `found: false`, `502`, `504`, and unexpected lookup failures retain the ISBN and open editable manual entry.
- Every imported field can be changed before save.
- No lookup creates a record; only explicit confirmation calls `POST /books`.
- Backend validation maps to the correct fields while preserving input.
- Manual creation works without ever invoking lookup.

**Suggested ticket:** `FEAT-05 — Manual and ISBN-assisted book creation`.

### Workstream 5 — Barcode and scanner capture

**Goal:** Minimize interaction when acquiring an ISBN.

**API:** Uses the Workstream 4 lookup after extracting scanner input.

**Deliverables:**

- Camera scanner for supported browsers and secure contexts.
- Dedicated hardware-scanner input using keyboard-like scan events.
- ISBN barcode format filtering and duplicate-scan suppression.
- Camera permission request, cancellation, stream cleanup, and camera switching when supported.
- Unsupported-browser, denied-permission, unreadable-code, and timeout paths.
- Immediate handoff of a captured ISBN to the editable lookup flow.
- Manual entry always visible and usable.

**Acceptance criteria:**

- Camera media tracks stop on success, cancellation, navigation, and component unmount.
- A scan cannot create a book without user review and confirmation.
- Repeated frames do not trigger repeated lookup or create requests.
- Dedicated scanner input does not capture ordinary typing elsewhere in the app.
- The flow is manually verified on the documented phone/browser support matrix.
- Unit tests cover parsing/state transitions; browser tests use a controllable media mock where real camera automation
  is unavailable.

**Suggested ticket:** `FEAT-06 — ISBN camera and hardware-scanner capture`.

### Workstream 6 — Checkout

**Goal:** Loan one available book to a borrower.

**API:** `GET /books`, `POST /books/{id}/checkout`.

**Deliverables:**

- Checkout page with available-book selection.
- Required borrower and optional checkout timestamp, due date, and notes.
- An entry point from eligible book details.
- Confirmation, in-flight duplicate prevention, and success feedback.
- Refreshed book, loan, and dashboard data after success.
- Conflict and stale-resource recovery.

**Acceptance criteria:**

- On-loan and deleted books cannot be selected.
- The API default is used when checkout time is omitted.
- Submitted borrower text is non-blank and at most 255 characters; submitted dates and timestamps use normalized
  formats.
- A `409` explains that the state changed, refreshes the book, and does not lose safe form input.
- Success visibly changes the book to unavailable and records the borrower.
- Generic book `PATCH` is never used for checkout.

**Suggested ticket:** `FEAT-07 — Book checkout workflow`.

### Workstream 7 — Check-in and loan history

**Goal:** Return books and make preserved borrowing history useful.

**API:** `GET /loans`, `GET /books`, `POST /books/{id}/checkin`.

**Deliverables:**

- Check-in page restricted to books with active loans.
- Optional return timestamp with API-default behavior when omitted.
- Active and returned loan-history presentation.
- Loan history shown in API order (`checked_out_at` descending), with client-side active/returned views derived from
  whether `returned_at` is null; the API currently provides no loan filters or pagination.
- Client-side join from loan `book_id` to book title, with a safe fallback if the book is unavailable.
- Due/overdue presentation derived from due and return dates.
- Updated per-book and dashboard borrowing statistics after return.

**Acceptance criteria:**

- Returning an available book is impossible in the current UI.
- A `409` refreshes state and explains that no active checkout exists.
- A successful return displays the book as available and preserves the loan record.
- Active and returned records are distinguishable without color alone.
- Timezone/date behavior is tested around local-day boundaries.
- Custom return timestamps are normalized UTC values so text ordering and borrowing-statistics parsing remain reliable.

**Suggested ticket:** `FEAT-08 — Check-in and loan history`.

### Workstream 8 — Reading tracking

**Goal:** Record reading completion and maintain personal feedback.

**API:** `POST /books/{id}/mark-read`, then `PATCH /books/{id}` for later edits.

**Deliverables:**

- Mark-read action for active unread books.
- Optional completion date, rating from 1 to 5, and review.
- Edit flow for completion date, rating, and review after a book is read.
- Read-state and rating presentation in list/detail views.
- Dashboard invalidation after relevant changes.

**Acceptance criteria:**

- Soft-deleted books cannot be marked read.
- The initial action uses `/mark-read`, including `{}` when all optional fields are omitted.
- Later edits do not mutate loan-related fields and may explicitly clear nullable completion date, rating, or review
  values.
- Rating validation is accessible and backend validation preserves input.
- The UI does not offer "mark unread" because no coherent API operation is documented.

**Suggested ticket:** `FEAT-09 — Reading completion, rating, and review`.

### Workstream 9 — Metadata administration, lifecycle recovery, and backup

**Goal:** Maintain and safeguard the collection without discarding history.

**API:** `PATCH /books/{id}`, `DELETE /books/{id}`,
`GET /books?include_deleted=true`, `POST /books/{id}/restore`, `GET /backup`.

**Deliverables:**

- Metadata edit form using the safe field boundaries in section 7.7.
- Delete confirmation that explains soft deletion and historical preservation.
- Deleted-books page derived by requesting `include_deleted=true` and filtering the mixed active/deleted response on a
  non-null `deletion_date`.
- Deleted-book details loaded through `GET /books/{id}`, which remains available for soft-deleted records.
- Restore action and return to active browsing.
- Disabled lifecycle actions that the API disallows on deleted books.
- Backup page/action that fetches the authenticated SQL attachment as a blob, uses the server-provided UTF-8 filename
  when valid, triggers a browser download, and always revokes the temporary object URL.
- Backup progress, generation-failure, connectivity, and retry states, with a warning that the file contains all active
  and deleted books plus complete loan history.

**Acceptance criteria:**

- Edit sends only intentionally changed fields.
- Loan state cannot be edited through metadata administration.
- A successful delete removes the book from normal browsing and dashboard-derived frontend caches.
- Deleted records retain reading and borrowing information when viewed.
- Restore returns the record to the active collection.
- Repeated/stale delete and restore operations handle `404` or `409` by refreshing.
- On-loan books cannot be deleted through the UI because deletion would strand the active loan until restoration.
- A successful backup downloads a non-empty SQL attachment with a sensible fallback filename; a `500` does not create a
  bogus download.

**Suggested ticket:** `FEAT-10 — Book administration, restoration, and backup`.

### Workstream 10 — Read-only dashboard

**Goal:** Provide an accurate high-level collection overview.

**API:** `GET /dashboard`.

**Deliverables:**

- Total books, checked-out, read, unread, and recently added values.
- The API-provided recent-window length in the label.
- Active loans, lifetime loans, and average returned-loan duration.
- Books read/unread and average rating.
- Useful empty, loading, stale, retry, and null-average states.
- Links from actionable summary cards to existing relevant pages where appropriate.

**Acceptance criteria:**

- Values are displayed from the API without recalculating business statistics.
- `null` averages display "Not enough data" rather than zero.
- Deleted books are not added client-side to any metric.
- The dashboard refreshes after relevant mutations and on explicit user refresh.
- The page remains readable without charts and does not rely on color alone.

**Suggested ticket:** `FEAT-11 — Library dashboard`.

### Workstream 11 — Test and accessibility hardening

**Goal:** Prove critical behavior before release.

**Prerequisites:** Product workstreams substantially complete.

**Deliverables:**

- API mock coverage for all routes and documented statuses.
- Unit tests for parsing, date formatting, validation, cache invalidation, and scanner state.
- Component/integration tests for every loading, empty, success, validation, conflict, and retry path.
- Automated accessibility checks for routes, forms, dialogs, and notifications.
- Browser-level tests for the critical journeys:
  - Configure API access.
  - Add manually.
  - Look up and edit an ISBN draft.
  - Checkout and check in.
  - Mark read and edit review.
  - Delete and restore.
  - Download a backup and recover from backup-generation failure.
  - View updated dashboard values.
- Responsive and keyboard test checklist.
- Meaningful coverage thresholds that fail CI on regression.

**Acceptance criteria:**

- Tests assert outcomes and accessibility, not implementation details.
- No critical journey depends on test ordering or a shared mutable backend record.
- Accessibility scans have no serious or critical known violations.
- Scanner limitations that cannot be automated are covered by a documented manual device matrix.
- `make check` remains the single local quality gate.

**Suggested ticket:** `QUAL-01 — Workflow, browser, and accessibility test hardening`.

### Workstream 12 — CI, Podman preview, and production tarball

**Goal:** Produce reproducible, verifiable frontend release artifacts.

**Prerequisites:** The local quality gate and runtime-config design are stable.

**Deliverables:**

- CI on pull requests and the default branch using immutable Yarn installation.
- CI execution of lint, type-check, tests, production build, and browser tests.
- Dependency and build caching that never changes lockfile semantics.
- A Podman-compatible container definition for local development and production-build previews; it is not the production
  deployment unit.
- A Make target that creates a deterministic static tarball from `../../dist`.
- Artifact naming with application version or commit identifier.
- A SHA-256 checksum and a manifest containing version, commit, build time, expected runtime-config shape, and required
  SPA-host behavior.
- Documentation for build, preview, runtime configuration, artifact contents, and handoff to the deployment repository.

**Acceptance criteria:**

- A clean checkout can run the complete pipeline using documented prerequisites.
- CI rejects lockfile drift, type errors, lint warnings, test failures, accessibility regressions, browser-test
  failures, or build failures.
- The Podman image starts a usable local/preview frontend and accepts runtime API configuration without rebuilding.
- Extracting the tarball produces only deployable static assets and required public runtime-config templates; it
  contains no source secrets, token, dependency tree, or development cache.
- The checksum validates and the release identifier is visible in the app.
- The deployment repository has all information needed to install and serve the artifact, including SPA fallback and
  cache-header guidance.

**Suggested ticket:** `OPS-01 — CI and frontend release artifacts`.

## 10. Cross-cutting edge cases

Every relevant ticket must address these cases rather than deferring them to a final
cleanup:

- API unavailable at startup or after the app has loaded.
- Runtime configuration missing, malformed, or pointed at the wrong environment.
- Missing/invalid token and rejected credentials.
- A resource changed in another browser between display and mutation.
- A book was deleted between list and detail navigation.
- Empty library, no active loans, no returned loans, and no rated books.
- Null optional metadata and future/unknown enum values.
- Metadata lookup found nothing, failed, timed out, or returned partial data.
- Backup generation failed, returned a malformed filename, or was interrupted during blob download.
- Slow requests, duplicate clicks, cancellation, route changes, and stale responses.
- Date-only values versus timestamps and local versus UTC display.
- Camera unsupported, permission denied, stream interrupted, or no barcode found.
- A scanner sends duplicate characters, a trailing Enter, or ordinary keyboard input.
- Direct route refresh on the deployed static host.
- Long titles, authors, borrower names, tags, notes, and reviews.

## 11. Backend and deployment dependencies

The following are not frontend implementations, but they block release if unresolved:

### Backend contract dependencies

- Use `../technical-reference/openapi.json` for exact OpenAPI types and nullability (including every `BookRead`
  field). Re-verify against a running backend `/openapi.json` when the backend changes; record drift as a blocker.
- Confirm purchase-price currency, precision, and valid range. OpenAPI currently models `purchase_price` as an
  unconstrained nullable `number` with no currency or `multipleOf`.
- Confirm duplicate ISBN behavior. OpenAPI documents no duplicate-ISBN conflict (`409` or otherwise) on `POST /books`.
- Configure the deployed frontend's exact origin in backend `CORS_ORIGINS` when using cross-origin browser access.
- Track backend hardening for temporal validation, ISBN-10 check-digit validation, required-field null handling, and
  `updated_date` maintenance; the frontend mitigations in this plan do not repair the backend contract.

### Deployment repository dependencies

- Serve the extracted static files over HTTPS.
- Supply environment-specific non-secret runtime configuration.
- Preserve `../../index.html` and runtime config with no-cache/revalidation headers while allowing immutable hashed assets to
  be cached long-term.
- Route unknown client paths to `../../index.html`.
- Restrict network access because the browser token is a shared secret.
- Apply a restrictive Content Security Policy and other appropriate browser security headers.
- Provide atomic install, rollback, process/service supervision, and health checks.
- Retain and verify the tarball checksum and release manifest.

## 12. Security and privacy requirements

- Never commit or compile the API token.
- Never pass the token in a query string.
- Redact `Authorization` and runtime connection state from logs and errors.
- Do not log borrower names, notes, reviews, or full request/response bodies by default.
- Treat downloaded SQL backups as sensitive data; do not inspect, log, cache, or upload their contents.
- Use HTTPS for production frontend and API traffic.
- Avoid rendering API-provided text as HTML.
- Keep dependencies locked and review production dependency changes.
- Add a Content Security Policy compatible with camera use and the configured API.
- Request camera access only in response to an explicit user action.
- Stop camera streams as soon as they are no longer needed.
- Document that session storage reduces persistence but does not hide the token from a browser user or same-origin
  script.

The accepted shared-secret design is a release risk, not a solved authentication system. If the application becomes
publicly reachable or supports untrusted users, release must be blocked until authentication is redesigned.

## 13. Performance and browser support

- Establish and document a supported browser matrix before barcode implementation.
- Prioritize current evergreen desktop browsers and current mobile Safari/Chrome, subject to scanner-library capability.
- Lazy-load camera/scanner code so it does not delay ordinary navigation.
- Metadata lookup should show immediate progress and complete within a few seconds under normal API conditions; client
  timeout must exceed the backend's normal lookup window and offer retry/manual fallback.
- Avoid loading the book list repeatedly within one navigation session.
- Because the API has no pagination, test with a representative large personal library and record the practical limit.
  Pagination/search is a backend follow-up if the result is not acceptable.
- Set bundle-size expectations in the foundation or scanning ticket and report material regressions in CI.

## 14. Requirement traceability

The product requirements are covered as follows:

- Add by ISBN, metadata lookup, editable draft, and manual fallback: Workstream 4.
- Camera and dedicated barcode scanner: Workstream 5.
- Purchase location/date/price, shelf, notes, tags, and category: Workstreams 4 and 9.
- Checkout details, duplicate-active-loan prevention, and unavailable state: Workstreams 3 and 6.
- Check-in, return date, history, and borrowing statistics: Workstream 7.
- Mark read, completion date, rating, review, and later edits: Workstream 8.
- Soft deletion, excluded active browsing, history preservation, and restore: Workstream 9.
- Full authenticated SQL backup: Workstreams 2 and 9.
- Dashboard collection, borrowing, and reading metrics: Workstream 10.
- Minimal scanning interaction, fast lookup feedback, editable imports, failure fallback, and reversibility: Workstreams
  4, 5, and 9.
- TypeScript/React/Node/Yarn/Vite and Make-driven build: Current baseline and Workstream 12.
- Dashboard, Check Out, Check In, and Admin Management UI: Workstreams 1, 6, 7, 9, and 10.
- Bearer authentication: Workstream 2 and sections 7.3 and 12.
- CI, Podman, and tarball: Workstream 12.
- Remote Ansible and systemd deployment: explicitly assigned to the deployment repository in sections 3 and 11.

## 15. Explicitly out of scope for MVP

- UPC barcode support.
- Multiple libraries or locations.
- Multiple copies of one title.
- Reading lists and wish lists.
- Import and export formats other than the API-provided full SQL backup.
- Catalog search, filters, custom sorting, and backend pagination.
- Cover image management.
- Overdue notifications.
- Goodreads, StoryGraph, or similar integrations.
- User accounts, roles, and multi-user support.
- Realtime updates between browser sessions.
- Editing or deleting individual loan-history records.
- Marking a read book as unread until lifecycle semantics are defined.
- Ansible, remote installation, static-server configuration, systemd units, TLS, and production rollback implementation
  in this repository.

Out-of-scope items may be documented as follow-ups but must not expand MVP tickets.

## 16. Production release gates

### Product gate

- Every MVP user outcome in section 5 passes acceptance testing.
- Every traceability entry in section 14 has an implemented and tested ticket.
- No release-blocking contract ambiguity remains.
- Empty, loading, failure, conflict, and recovery states are usable.

### Quality gate

- Immutable dependency installation succeeds.
- `make check` passes from a clean checkout.
- Browser-level critical journeys pass against a representative API.
- Automated accessibility checks have no serious or critical known violations.
- Keyboard-only, 320-pixel mobile, tablet, and desktop checks pass.
- Supported camera/scanner combinations pass the manual device matrix.

### Integration gate

- Checked-in `openapi.json`, running backend OpenAPI, and frontend contract types agree.
- Protected requests work with runtime credentials.
- Production CORS or same-origin proxy behavior is verified, including exposed backup response headers.
- All dedicated lifecycle endpoints preserve expected backend state.
- Authenticated backup downloads a valid SQL attachment and backup failures remain recoverable.
- Dashboard and caches reflect mutations after refresh/invalidation.

### Artifact gate

- CI produces the same successful static build used for packaging.
- The production tarball has a unique version, manifest, and valid SHA-256 checksum.
- Artifact inspection confirms no token or other secret is present.
- The tarball runs correctly when served with production-like runtime config, SPA fallback, and cache behavior.
- The Podman preview starts and passes a smoke test.

### Operational handoff gate

- The deployment repository has artifact, checksum, runtime-config, SPA fallback, cache, HTTPS, security-header, and
  rollback requirements.
- Release/version information is visible for support.
- Known limitations, browser support, and accepted shared-token risk are documented.
- A smoke-test checklist covers connection, dashboard, list, create, checkout, check-in, mark-read, delete, restore, and
  backup.

## 17. Definition of done

The frontend is ready for production release when:

1. Workstreams 1 through 12 are complete or their requirements are demonstrably satisfied by equivalent reviewed work.
2. Every production release gate passes in CI or documented manual verification.
3. All product requirements map to working, accessible user journeys.
4. The browser communicates with the deployed API using runtime configuration without a secret in the artifact.
5. The production tarball and checksum are reproducible and accepted by the deployment repository.
6. The Podman image supports documented local development and preview use.
7. No critical or high-severity defect, serious accessibility violation, exposed secret, or unresolved release-blocking
   API mismatch remains.
8. Deferred features and accepted risks are documented without being confused with completed MVP capability.
