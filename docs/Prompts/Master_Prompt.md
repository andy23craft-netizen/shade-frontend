# Shade Frontend — Master Implementation Context

You are assisting me with implementation of the **Shade Library frontend**, a React/TypeScript/Vite application providing the browser UI for my home-library API.

This document is the persistent implementation context for the project. It describes the project's purpose, architecture, API contract, requirements, and engineering conventions.

The **current feature ticket will be supplied separately after this context**.

Do not ask me to provide the documents listed under **Synthesized Project Documents** again. Their relevant contents have already been incorporated here.

---

# 1. Critical Repository-Visibility Rule

**ChatGPT does not automatically have access to my repository.**

This master context describes the intended architecture and known project requirements. It does **not** prove that a particular file, component, hook, provider, API client, route, or abstraction currently exists.

Unless I explicitly provide a file or command output in the current conversation:

* Do not pretend you have inspected it.
* Do not invent its contents.
* Do not assume a planned file already exists.
* Do not assume the repository has already reached the target architecture.
* Do not tell me to modify code you have not seen when its current contents could affect the implementation.

The actual repository state supplied during the current conversation takes precedence over assumptions in this document.

## When information is missing

Before implementing a ticket, determine the **minimum repository information required** to implement it safely.

If files are needed, provide a concise:

### What I need from you

List:

* exact file paths
* why each file is needed
* whether the entire file or a relevant section is sufficient
* exact terminal commands when command output is more useful than a file

Prefer asking for a small structural command first when appropriate, for example:

```sh
find src -maxdepth 3 -type f | sort
```

Do not request the entire repository merely to obtain context.

Do not request documents already synthesized into this prompt.

If a file does not yet exist and the ticket requires creating it, do not ask me for it. State that we will create it.

## Repository authority hierarchy

When sources disagree, use this order:

1. Current repository contents supplied in the conversation
2. Current ticket and its acceptance criteria
3. Running backend/OpenAPI behavior, when relevant
4. This master context
5. Older/planned architecture described in documentation

If the actual repository differs from the target architecture described here, explain the discrepancy rather than silently forcing the planned architecture onto the current codebase.

---

# 2. Engineer Skill Level and Working Style

I am a **junior software engineer** working under the guidance of a more senior engineer.

Give me:

* complete, copy/pasteable code
* exact file paths
* explicit instructions for additions/replacements
* complete files when creating new files
* explicit terminal commands
* expected results after important steps
* manageable implementation steps

Do not say things like:

> "Update the component accordingly."

Tell me exactly what to change.

However, I also want to understand the implementation.

For each meaningful step, explain:

1. What we are changing.
2. Why it belongs there.
3. How it fits the architecture.
4. What problem it solves.
5. Important React, TypeScript, API, testing, browser, or accessibility concepts involved.
6. How we will verify it.

Prefer:

> **Here's what we're going to do → here's why → here's the exact code → here's what it does → here's how we test it.**

Do not bury the practical implementation beneath unnecessary theory.

Do not silently make architectural decisions that materially affect the project.

If multiple approaches are reasonable, explain the tradeoff and recommend one.

---

# 3. Project

Project:

**shade-frontend**

Purpose:

A browser-based frontend for the **Shade home-library FastAPI backend**.

Technology:

* React 19
* TypeScript
* Vite
* Yarn 4
* Node.js 26
* ESLint
* Vitest
* React Testing Library
* jsdom

The backend is a separate project and is the authoritative source for API behavior.

The frontend will eventually provide:

* Dashboard
* Active library browsing
* Book details
* Add book
* ISBN lookup
* Camera barcode scanning
* Dedicated barcode-scanner support
* Book editing
* Checkout
* Check-in
* Loan history
* Reading tracking
* Soft deletion
* Deleted-book administration
* Restoration
* SQL backup download
* Runtime API connection configuration
* CI
* Podman preview/development
* Versioned production artifacts

---

# 4. Current Repository vs. Target Architecture

The repository is being built incrementally.

The architecture described later in this document is the **target architecture**, not a claim that every piece already exists.

The current repository may contain only a subset of that architecture.

For example, the initial frontend scaffold currently includes files such as:

```text
src/App.tsx
src/App.test.tsx
src/index.css
src/main.tsx
src/styles/base.css
src/styles/components.css
src/styles/shell.css
src/styles/tokens.css
src/test/setup.ts
src/vite-env.d.ts
```

The application may therefore still be substantially incomplete.

Never infer implementation from the target architecture alone.

---

# 5. Frontend Environment

Current package configuration establishes:

```text
Node.js: 26.7.0
Yarn: 4.18.0
```

The repository uses:

* Corepack
* Yarn
* Make

Typical setup:

```sh
nvm use
corepack enable
make install
```

Development:

```sh
make run
```

Quality gate:

```sh
make check
```

Production build:

```sh
make build
```

Production output:

```text
dist/
```

Do not casually replace the project's package manager, build system, test framework, or existing quality commands.

The existing quality gate should be extended rather than replaced.

---

# 6. Backend API

The backend is a separate FastAPI application.

Default local API:

```text
http://127.0.0.1:8000
```

There is **no `/api` prefix**.

OpenAPI documentation:

```text
http://127.0.0.1:8000/docs
```

OpenAPI schema:

```text
http://127.0.0.1:8000/openapi.json
```

When implementing API-dependent behavior:

1. Use the documented contract in this context.
2. When the running backend is available, verify against its OpenAPI schema.
3. Treat the running API as authoritative if it conflicts with documentation.
4. Do not silently invent frontend behavior to compensate for an API discrepancy.
5. Identify genuine backend blockers clearly.

---

# 7. Authentication

The backend uses a shared Bearer token.

Protected requests require:

```http
Authorization: Bearer <API_SECRET_KEY>
```

There is:

* no login system
* no logout API
* no user accounts
* no backend sessions
* no role-based authorization

Missing or invalid credentials return:

```http
403
```

The frontend should describe this generically as:

> API access was rejected.

Do not claim to know whether the token was specifically missing or invalid.

The token must never:

* be committed
* be compiled into the Vite bundle
* appear in source maps
* appear in URLs
* be logged
* be sent to analytics/error reporting
* appear in diagnostics

MVP token behavior:

* token entered/injected at runtime
* token held in memory and `sessionStorage`
* explicit "forget token" action
* `/protected` verifies credentials
* protected requests automatically receive the Bearer token
* confirmed `403` clears the active token and returns the user to connection setup

Security limitation:

A browser-held token is still inspectable by the user or code running in the browser. This is an accepted risk for a trusted deployment and is **not equivalent to real user authentication**.

---

# 8. API Routes

## Public

```text
GET /health
GET /docs
GET /docs/oauth2-redirect
GET /redoc
GET /openapi.json
```

## Protected

```text
GET /protected

GET /books
GET /books/lookup?isbn={isbn}
GET /books/{id}

POST /books
PATCH /books/{id}
DELETE /books/{id}
POST /books/{id}/restore

POST /books/{id}/checkout
POST /books/{id}/checkin
POST /books/{id}/mark-read

GET /loans
GET /dashboard
GET /backup
```

There are currently:

* no WebSockets
* no SSE
* no subscriptions
* no loan CRUD endpoints
* no pagination

Books and loans are returned as complete result sets.

---

# 9. API Errors

Normalize API failures into a consistent frontend error model while preserving safe server details and HTTP status.

| Status | Meaning                                         |
| ------ | ----------------------------------------------- |
| 403    | Authentication/access rejected                  |
| 404    | Resource not found or unavailable for operation |
| 409    | Valid resource but invalid state transition     |
| 422    | Validation failure                              |
| 500    | Backup generation or unexpected backend failure |
| 502    | Metadata provider failure                       |
| 504    | Metadata provider timeout                       |

FastAPI validation errors may look like:

```json
{
  "detail": [
    {
      "type": "string_too_long",
      "loc": ["body", "title"],
      "msg": "String should have at most 255 characters",
      "input": "..."
    }
  ]
}
```

Application errors generally look like:

```json
{
  "detail": "Human-readable error message"
}
```

Support both forms.

Also handle:

* network errors
* timeouts
* invalid JSON
* unexpected 5xx responses
* cancellation
* stale resources
* `204 No Content`
* binary/blob responses

Never attempt to parse JSON from a `204`.

---

# 10. CORS

The backend permits local Vite origins by default:

```text
http://localhost:5173
http://127.0.0.1:5173
```

Deployed origins must be configured in backend `CORS_ORIGINS`.

The origin must exactly match:

* scheme
* hostname
* port

Do not include a path or trailing slash.

The backend permits:

* `Authorization`
* `Content-Type`

and exposes:

```text
Content-Disposition
```

Credentialed cookie-based CORS is not part of the architecture.

---

# 11. API Lifecycle Rules

Never use generic PATCH to simulate lifecycle operations.

Use the dedicated endpoint.

| Operation     | Endpoint                        |
| ------------- | ------------------------------- |
| Create        | `POST /books`                   |
| Edit metadata | `PATCH /books/{id}`             |
| Delete        | `DELETE /books/{id}`            |
| Restore       | `POST /books/{id}/restore`      |
| Checkout      | `POST /books/{id}/checkout`     |
| Check-in      | `POST /books/{id}/checkin`      |
| Mark read     | `POST /books/{id}/mark-read`    |
| ISBN lookup   | `GET /books/lookup?isbn={isbn}` |
| Backup        | `GET /backup`                   |

Checkout/check-in modify loan history and associated book state. PATCH must not be used as a substitute.

---

# 12. Book Lifecycle

Books have independent lifecycle dimensions.

### Availability

```text
available → on_loan → available
```

### Reading

```text
unread → read
```

### Soft deletion

```text
active → soft-deleted → active
```

Soft-deleted books:

* disappear from normal `/books`
* may be requested with `include_deleted=true`
* remain accessible by ID
* can be restored
* cannot be checked out
* cannot be checked in
* cannot be marked read
* retain loan history
* retain reading information

Important:

The backend permits deletion of an on-loan book while leaving its active loan open.

The frontend must therefore **prevent deletion of an on-loan book**.

A deleted on-loan book must be restored before its loan can be checked in.

---

# 13. Books API

List:

```text
GET /books
```

Optional:

```text
include_deleted=true
```

Default:

```text
include_deleted=false
```

Response:

```json
{
  "items": [],
  "total": 0
}
```

Books are title-ordered.

Detail:

```text
GET /books/{id}
```

Soft-deleted books may still be returned.

Create:

```text
POST /books
```

Required:

* title
* authors

Frontend additionally requires:

* non-blank title
* non-blank authors
* maximum 255 characters

Update:

```text
PATCH /books/{id}
```

Send only intentionally changed fields.

Do not send `null` for required database fields such as:

* title
* authors
* category
* shelf
* is_read
* status

---

# 14. Book Model and Enums

Main book fields include:

```text
id
isbn13
title
authors
publisher
publication_date
pages
category
shelf
is_read
status
tags
purchase_date
purchase_price
completion_date
review
borrower
datetime_loaned_out
notes
acquisition_source
rating
creation_date
updated_date
deletion_date
times_borrowed
last_borrowed_at
average_loan_days
```

`acquisition_source` represents the product requirement's purchase location.

### Category

```text
unknown
religion
philosophy
fiction
nonfiction
```

### Shelf

```text
unknown
a1
a2
a3
a4
b1
b2
b3
bath
c1
c2
c3
c4
d1
d2
d3
d4
d5
e1
e2
e3
e4
e5
e6
f1
f2
f3
f4
f5
g1
g2
g3
g4
g5
g6
h1
h2
h3
h4
h5
liz_tbr
```

### Status

```text
unknown
available
on_loan
missing
display_only
reserved
reading
```

Handle future/unknown enum values safely rather than crashing.

---

# 15. ISBN

Supported:

* ISBN-10
* ISBN-13
* spaces
* hyphens

Backend behavior:

* removes spaces/hyphens
* converts ISBN-10 to ISBN-13
* validates ISBN-13
* stores ISBN-13

Known limitation:

The backend does not correctly validate ISBN-10 check digits.

Therefore the frontend must validate ISBN-10 check digits.

Frontend responsibilities:

* capture ISBN
* validate it
* provide immediate feedback
* send accepted ISBN to the API

Backend responsibilities:

* normalize
* validate ISBN-13
* perform lookup
* persist canonical ISBN

---

# 16. ISBN Lookup

```text
GET /books/lookup?isbn={isbn}
```

Lookup does not create a book.

Successful lookup:

```json
{
  "found": true,
  "draft": {
    "isbn13": "9780140449266",
    "title": "The Count of Monte Cristo",
    "authors": "Alexandre Dumas",
    "publisher": "Penguin Books",
    "publication_date": "2003",
    "pages": 1276
  }
}
```

`publication_date` may contain only a year:

```text
2003
```

Do not convert that into a fake full date.

Not found:

```json
{
  "found": false,
  "draft": null
}
```

This is a normal manual-entry path, not an error.

Failures:

* `422` invalid ISBN
* `502` provider failure
* `504` timeout

A failed lookup must still permit manual creation.

---

# 17. Checkout and Check-in

## Checkout

```text
POST /books/{id}/checkout
```

Example:

```json
{
  "borrower": "Alice Johnson",
  "checked_out_at": "2026-08-08T10:00:00Z",
  "due_at": "2026-08-21",
  "notes": "Handle with care"
}
```

Only borrower is required.

Frontend must:

* require non-blank borrower
* limit borrower to 255 characters
* normalize dates/timestamps
* prevent duplicate submission
* prevent selecting on-loan books
* prevent selecting deleted books

A `409` indicates an invalid/currently changed resource state.

After successful checkout, invalidate/update:

* books
* book detail
* loans
* dashboard

## Check-in

```text
POST /books/{id}/checkin
```

Body may be:

```json
{}
```

or:

```json
{
  "returned_at": "2026-08-08T18:30:00Z"
}
```

Successful check-in:

* closes active loan
* makes book available
* clears borrower
* clears loaned-out timestamp
* preserves loan history

A `409` means there is no active loan.

After successful check-in, invalidate/update:

* books
* book detail
* loans
* dashboard

---

# 18. Loan History

```text
GET /loans
```

Returns all active and historical loans.

No pagination or filtering.

Order:

```text
checked_out_at descending
```

Fields:

```text
id
book_id
borrower
checked_out_at
due_at
notes
returned_at
created_date
last_updated_date
```

Active loan:

```text
returned_at = null
```

Returned loan:

```text
returned_at != null
```

The frontend should join `book_id` to book data for display and provide a safe fallback when the book is unavailable.

---

# 19. Reading Tracking

Initial action:

```text
POST /books/{id}/mark-read
```

The body is required but all fields are optional, so `{}` is valid.

Example:

```json
{
  "completion_date": "2026-08-08",
  "rating": 5,
  "review": "Excellent."
}
```

Rating:

```text
1–5
```

Later edits use:

```text
PATCH /books/{id}
```

Frontend should:

* prevent marking deleted books read
* allow editing completion date/rating/review
* allow clearing nullable reading fields where appropriate
* not provide "mark unread"

---

# 20. Dashboard

```text
GET /dashboard
```

The API provides authoritative aggregate statistics.

Example:

```json
{
  "total_books": 500,
  "checked_out": 2,
  "read": 250,
  "unread": 250,
  "recently_added": 12,
  "recent_window_days": 30,
  "borrowing": {
    "active_loans": 2,
    "lifetime_loans": 37,
    "average_loan_days": 18.5
  },
  "reading": {
    "books_read": 250,
    "books_unread": 250,
    "average_rating": 4.2
  }
}
```

Display API-provided statistics.

Do not recalculate business statistics in the frontend.

If an average is `null`, display something such as:

> Not enough data

Do not display zero unless the API actually returns zero.

---

# 21. Backup

```text
GET /backup
```

Protected.

Returns SQL rather than JSON.

The backup includes the complete SQLite database, including:

* active books
* deleted books
* loan history
* reading data

Use authenticated `fetch`.

Do not navigate directly to `/backup`, because navigation cannot attach the Bearer token.

Expected flow:

1. authenticated fetch
2. check response
3. `response.blob()`
4. inspect `Content-Disposition`
5. determine a safe filename
6. create object URL
7. trigger download
8. remove temporary link
9. revoke object URL

A failed backup must show a recoverable error and must not produce a bogus file.

---

# 22. Runtime Configuration

The static frontend must be deployable to different environments without rebuilding.

Runtime configuration must provide at least:

```text
API base URL
release/application version
```

The frontend must not assume `/api`.

The API is rooted at the configured base URL.

The API token is separate from runtime configuration and must never be embedded in static runtime configuration.

---

# 23. Server-State Architecture

Use a query/cache layer for server-owned state.

Server state:

* books
* book details
* loans
* dashboard

Local state:

* forms
* scanner state
* dialogs
* transient UI

Application-wide state:

* runtime connection state

Do not introduce a general-purpose global state store without a real requirement.

After mutations, invalidate affected server data.

### Create/edit/delete/restore

Invalidate:

* active books
* deleted books
* book detail
* dashboard

### Checkout/check-in

Invalidate:

* books
* book detail
* loans
* dashboard

### Reading changes

Invalidate:

* books
* book detail
* dashboard

There is no realtime API.

Do not imply that multiple browser sessions synchronize instantly.

---

# 24. Target Routes

```text
/
```

Dashboard.

```text
/books
```

Active collection.

```text
/books/new
```

Book creation.

```text
/books/:bookId
```

Book detail.

```text
/books/:bookId/edit
```

Book editing.

```text
/checkout
```

Checkout.

```text
/checkin
```

Check-in.

```text
/loans
```

Loan history.

```text
/admin/deleted
```

Deleted books and restore.

```text
/admin/backup
```

Authenticated SQL backup.

```text
/settings/connection
```

Runtime API configuration.

Also provide a not-found route.

The persistent application shell should provide access to:

* Dashboard
* Books
* Add Book
* Check Out
* Check In
* Loans

Administrative functions may be visually separated.

There is no role-based authorization.

---

# 25. Target Frontend Architecture

Target organization:

```text
src/
  app/
    bootstrap
    router
    providers
    layouts
    error boundary

  api/
    types
    client
    errors
    query keys
    fixtures

  components/
    reusable UI primitives

  features/
    books/
    scanning/
    loans/
    reading/
    dashboard/

  config/
    runtime configuration

  test/
    shared setup
    mocks
    builders
    render helpers
```

This is a target structure, not a guarantee that these directories currently exist.

Prefer clear feature-oriented code.

Do not create abstractions solely because they might theoretically be reusable.

---

# 26. Forms and Validation

Frontend validation exists for immediate feedback, accessibility, and UX. Backend validation remains authoritative.

### Title

* required
* non-blank
* max 255

### Authors

* required
* non-blank
* max 255

### Pages

Positive integer.

### Rating

Integer 1–5.

### ISBN

Validate ISBN-10 check digit and ISBN-13 where practical.

### Borrower

* required
* non-blank
* max 255

### Dates

Date-only:

```text
YYYY-MM-DD
```

Timestamp:

```text
UTC ISO 8601
```

Convert blank optional fields into the API's expected null/omitted representation.

Do not blindly send arbitrary browser date strings.

---

# 27. Date and Time Rules

Use:

```text
YYYY-MM-DD
```

for date-only values.

Use normalized UTC ISO 8601 for timestamps, e.g.:

```text
2026-08-08T10:00:00.000Z
```

Do not mix arbitrary local browser timestamp strings into API requests.

This matters because backend statistics parse timestamps.

---

# 28. Accessibility

The application must work with:

* keyboard
* touch
* phone
* tablet
* desktop

Use:

* semantic HTML
* landmarks
* headings
* native controls where practical
* persistent labels
* linked help/error text
* visible focus indicators
* logical focus order
* skip link
* accessible dialogs
* focus restoration
* live/status regions where appropriate

On route changes:

* update document title
* move focus to the route heading

Validation failures:

* provide a focusable summary
* provide field-level errors

Never use color as the only indicator of state.

Support a 320 CSS-pixel viewport.

Respect reduced-motion preferences.

---

# 29. Barcode Scanner

Two modes are required.

## Camera

Must:

* operate in supported secure contexts
* request permission only after explicit user action
* stop media tracks after success
* stop tracks on cancellation
* stop tracks on navigation
* stop tracks on unmount
* explain unsupported browsers
* explain permission denial
* provide manual entry

## Dedicated scanner

Hardware scanners behave like keyboard input.

The frontend must:

* recognize scanner-style input
* filter supported ISBN barcode data
* handle trailing Enter
* suppress duplicate scans
* avoid capturing ordinary typing elsewhere

A scanner never directly creates a book.

Flow:

```text
scan
→ extract ISBN
→ lookup
→ editable draft
→ user confirmation
→ create
```

Lazy-load scanner code when practical.

---

# 30. Error and Recovery Philosophy

Never leave the user at an unexplained dead end.

Relevant states include:

* loading
* empty
* success
* validation failure
* authentication failure
* network failure
* timeout
* provider failure
* conflict
* not found
* stale data
* unexpected server failure
* unsupported browser
* denied camera permission
* malformed runtime configuration
* backup failure

When a resource changes elsewhere:

1. Explain that the state changed.
2. Refresh the affected resource.
3. Preserve safe unsaved input where possible.

When a recoverable request fails:

* preserve form input
* provide retry
* explain what failed

---

# 31. Security

Never:

* commit the API token
* compile it into JavaScript
* put it in URLs
* log it
* log Authorization headers
* render API text as HTML
* upload SQL backup contents to telemetry
* log borrower/private-library information by default

Production should use:

* HTTPS
* restrictive Content Security Policy
* appropriate security headers
* locked dependencies
* explicit camera permissions
* dependency review

SQL backups are sensitive data.

---

# 32. Operational Requirements

Eventually provide:

* root error boundary
* visible application version/release
* safe diagnostics
* optional runtime-configured error reporting

Never send by default:

* borrower names
* notes
* reviews
* ISBN drafts
* API tokens
* Authorization headers
* complete request/response bodies

A backend correlation/request ID may be displayed in safe diagnostics.

---

# 33. Product Requirements

The MVP must allow a user to:

1. Open a read-only dashboard.
2. Browse active books.
3. View book details.
4. Add a book manually.
5. Add a book through ISBN lookup.
6. Scan an ISBN with a camera.
7. Capture an ISBN from a dedicated scanner.
8. Review/edit metadata before creation.
9. Edit book metadata.
10. Check out an available book.
11. Check in an on-loan book.
12. Review loan history.
13. Mark a book as read.
14. Edit completion date/rating/review.
15. Soft-delete a book.
16. View deleted books.
17. Restore a deleted book.
18. Download an authenticated SQL backup.
19. Configure runtime API access.
20. Recover gracefully from errors.

---

# 34. Explicit Scope Decisions

## In scope

* ISBN-10
* ISBN-13
* camera scanning
* dedicated scanner input
* metadata lookup
* manual creation
* book editing
* checkout
* check-in
* loan history
* reading tracking
* soft delete
* restore
* deleted-book administration
* dashboard
* SQL backup
* runtime configuration
* CI
* Podman preview
* production tarball

## Out of scope unless explicitly requested

* UPC scanning
* multiple libraries
* multiple copies
* reading lists
* wish lists
* general import/export
* catalog search
* catalog filtering
* custom sorting
* backend pagination
* cover images
* overdue notifications
* Goodreads
* StoryGraph
* other reading-service integrations
* user accounts
* roles
* multi-user support
* realtime synchronization
* individual loan CRUD
* mark-unread
* remote Ansible deployment
* systemd deployment
* TLS provisioning
* production rollback orchestration

Do not expand a ticket into these features.

---

# 35. Production Artifacts

This repository eventually produces:

1. A versioned static production tarball.
2. A Podman image for local development/preview.

It does not own:

* remote installation
* Ansible
* systemd
* production web-server configuration
* TLS
* remote deployment
* production rollback orchestration

A production artifact eventually contains:

* deployable static assets
* required runtime-config templates
* release manifest

It must not contain:

* API secrets
* dependency trees
* development caches
* source secrets

A SHA-256 checksum accompanies releases.

The release manifest should include:

* version
* commit
* build time
* runtime configuration shape
* SPA fallback requirement

---

# 36. SPA Deployment

Client-side routing requires SPA fallback.

Unknown application paths must serve:

```text
index.html
```

For example:

```text
/books/123
```

must work when loaded directly or refreshed.

This requirement belongs in artifact/deployment documentation.

---

# 37. CI and Quality Gate

The canonical local quality gate is:

```sh
make check
```

Eventually CI must cover:

* immutable dependency installation
* lint
* type checking
* unit tests
* component tests
* accessibility checks
* browser tests
* production build
* artifact generation

CI must fail on:

* lockfile drift
* lint failures/warnings as configured
* type errors
* test failures
* accessibility regressions
* browser test failures
* build failures

---

# 38. Known Backend Limitations

These are intentional frontend compensations.

### ISBN-10

Backend does not properly validate ISBN-10 check digits.

**Frontend validates them.**

### Temporal strings

Backend accepts poorly formatted dates/timestamps.

**Frontend sends normalized values.**

### Required database fields

Backend schemas may accept null for database-required fields.

**Frontend avoids sending null to required fields.**

### Empty required strings

Backend may allow blank title/authors/borrower values.

**Frontend prevents blank input.**

### Soft-deleted on-loan books

Backend permits deletion while an active loan remains.

**Frontend prevents deletion of on-loan books.**

### Generic PATCH

Backend may technically permit loan-related PATCH operations.

**Frontend does not use PATCH for lifecycle transitions.**

### Unknown enum values

Backend may evolve.

**Frontend renders unknown values safely.**

---

# 39. Backend Statistics

The frontend presents API statistics rather than recreating business calculations.

`times_borrowed`:

* number of associated loan records

`last_borrowed_at`:

* greatest stored checkout timestamp
* reliable chronologically when timestamps are normalized

`average_loan_days`:

* returned loans only
* active loans excluded
* null when no returned loans exist

Dashboard statistics are authoritative from the API.

---

# 40. Ticket Ordering

Current ticket files:

```text
FEAT-01_application-shell-and-shared-ui.md
FEAT-02_runtime-configuration-and-connection.md
FEAT-03_typed-api-and-server-state.md
FEAT-04_active-collection-and-book-details.md
FEAT-05_book-form-and-creation.md
FEAT-06_isbn-scanner-capture.md
FEAT-07_checkout-workflow.md
FEAT-08_checkin-and-loan-history.md
FEAT-09_reading-tracking.md
FEAT-10_book-edit-delete-and-restore.md
FEAT-11_library-dashboard.md
FEAT-12_operational-and-browser-hardening.md
FEAT-13_workflow-and-accessibility-tests.md
FEAT-14_continuous-integration-quality-pipeline.md
FEAT-15_podman-development-and-preview.md
FEAT-16_versioned-release-artifacts.md
```

The ticket supplied for the current task is authoritative for its acceptance criteria unless it contradicts the backend contract or established architecture.

Do not implement future tickets prematurely.

---

# 41. Ticket Implementation Procedure

When I provide a feature ticket:

## Step 1 — Understand

Determine:

* prerequisites
* existing architecture it depends on
* API endpoints involved
* expected tests
* acceptance criteria
* contradictions or blockers

## Step 2 — Inspect the minimum necessary repository state

Before editing, determine which current files must be supplied.

Do not ask for broad documentation that this context already covers.

If needed, ask me for exact files or command output.

## Step 3 — Plan

Briefly tell me:

* what we are implementing
* files likely involved
* why those files are appropriate
* architectural decisions
* anything that must be created first

## Step 4 — Implement incrementally

For every meaningful step:

1. Explain the purpose.
2. Give the exact file path.
3. Provide full contents for new files.
4. Provide explicit replacement/addition instructions for existing files.
5. Explain important code.
6. Tell me how to verify it.

Do not dump unrelated changes.

## Step 5 — Test

Testing is part of implementation.

Identify appropriate:

* unit tests
* component/integration tests
* API mocks
* accessibility tests
* browser tests where applicable

Test user-visible behavior rather than implementation details.

## Step 6 — Verify

Use:

```sh
make check
```

at appropriate milestones.

Use targeted tests when useful.

Do not call the implementation complete merely because TypeScript compiles.

## Step 7 — Acceptance criteria

Explicitly walk through every acceptance criterion:

```text
[X] Criterion satisfied — explanation
[X] Criterion satisfied — explanation
[ ] Intentionally deferred — reason
```

Identify remaining work and blockers.

---

# 42. Do Not Invent Backend Behavior

The frontend does not redesign the backend contract.

If desired behavior does not exist in the API:

1. Determine whether the frontend can reasonably compensate.
2. Do not fake lifecycle behavior with PATCH.
3. Do not silently introduce conflicting business logic.
4. Identify a backend dependency/blocker when necessary.

Examples:

Checkout:

```text
POST /books/{id}/checkout
```

Check-in:

```text
POST /books/{id}/checkin
```

Restore:

```text
POST /books/{id}/restore
```

Mark read:

```text
POST /books/{id}/mark-read
```

---

# 43. Cross-Cutting Edge Cases

Address relevant cases for the current ticket, but do not build unnecessary machinery merely for theoretical completeness.

Potential cases include:

* API unavailable at startup
* API becoming unavailable
* malformed runtime configuration
* missing/rejected token
* stale resource
* resource deleted elsewhere
* empty library
* no loans
* no returned loans
* no ratings
* null optional metadata
* future enum values
* ISBN not found
* metadata provider failure/timeout
* partial metadata
* malformed backup filename
* interrupted backup
* slow requests
* duplicate clicks
* duplicate scanner frames
* route changes during requests
* cancellation
* local/UTC date boundaries
* unsupported camera
* denied camera permission
* camera interruption
* scanner trailing Enter
* ordinary keyboard typing
* direct URL refresh
* narrow viewport
* long titles
* long authors
* long borrower names
* long notes/reviews/tags

---

# 44. Synthesized Project Documents

The following project documents have already been supplied and synthesized into this master context.

Do not ask me to provide them again unless a specific contradiction cannot be resolved from this context.

### Product requirements

The relevant contents of:

```text
docs/PRODUCT_REQS.V1.md
docs/PRODUCT_REQS.V2.pass-1.md
docs/PRODUCT_REQS.V2.pass-2.md
docs/PRODUCT_REQS.V2.quote-bucket.md
```

have been synthesized.

### Production plan

```text
docs/PLAN.md
```

has been synthesized, including architecture, workstreams, runtime configuration, authentication, state management, accessibility, security, scanner behavior, CI, Podman, artifacts, and release requirements.

### API contract

```text
docs/API-for-FE.md
```

has been synthesized, including endpoints, authentication, request/response behavior, errors, enums, ISBN behavior, lifecycle transitions, loans, reading, dashboard, backup, CORS, responsibility boundaries, and known backend limitations.

### Project README

```text
README.md
```

has been synthesized for relevant environment, development, and build information.

### Frontend build requirements

The supplied frontend TODO/build plan has been synthesized, including FEAT-01 through FEAT-16 and the relationship to the backend/deployment projects.

### Other project documentation

The repository may contain additional documentation such as:

```text
docs/AGENTS.md
docs/MAINTAINERS.md
docs/ToDo.md
docs/UI_DESIGN_NOTES.MD
docs/Version 2 Design and Function Notes.md
docs/full-project-context.md
```

Do not automatically request these merely for general context. Request a particular document only when its contents are genuinely necessary for the current ticket and are not already represented here.

---

# 45. Files That May Need to Be Supplied

When repository access is unavailable, the following may need to be supplied depending on the ticket:

* current source files
* current test files
* `package.json`
* `yarn.lock`
* `Makefile`
* `vite.config.ts`
* `tsconfig.json`
* `tsconfig.app.json`
* `tsconfig.node.json`
* `eslint.config.js`
* current ticket file
* relevant CSS
* generated OpenAPI output
* relevant backend source when API behavior is unclear

Only request files that can materially affect the implementation.

Prefer the smallest useful set.

---

# 46. Final Working Principle

The goal is not merely to make code compile.

The goal is to build the Shade frontend **correctly, incrementally, and in a way I understand**.

Treat me as a capable junior engineer who wants to learn the reasoning behind the implementation.

Be:

* explicit
* practical
* incremental
* honest about what you can and cannot see
* conservative about architectural changes
* respectful of the backend contract
* focused on the current ticket

Use complete code.

Explain the why.

Do not invent requirements.

Do not implement future tickets prematurely.

Do not pretend to have inspected files that I have not supplied.

When information is missing, ask for the **minimum specific repository information necessary** to proceed safely.

When something is genuinely ambiguous, explain the ambiguity rather than guessing silently.

At the point where design comes into question, stop and ask for design notes. 