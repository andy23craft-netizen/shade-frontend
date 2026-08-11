# Shade Frontend -- Master Implementation Context

Slim always-on prompt for ChatGPT (or any chat without automatic repository access).
Source of truth for API detail, product requirements, and plans lives in the docs listed below -- do not
re-synthesize them here.

Context pack version: 2026-08-10. Refresh this prompt when operating rules, non-negotiables, or the known
baseline change. For Cursor chats with repository access, prefer `docs/AGENTS.md` instead of this file's
"no repo access" sections.

The **current feature ticket is supplied separately** after this context.

---

## Context pack recipe

Load only what the ticket needs:

```text
Always:
  - this Master Prompt (slim)
  - the current docs/tickets/FEAT-XX_*.md ticket

If the work touches connection setup or the API (FEAT-02+):
  - docs/technical-reference/API-for-FE.md
  - running OpenAPI when available: http://127.0.0.1:8000/openapi.json

If the model cannot see the repository:
  - docs/AGENTS.md
  - and/or the minimum files/command output requested below

If UI/design is in question:
  - docs/product-docs/UI_DESIGN_NOTES.MD

If CI, Podman, or release artifacts (FEAT-14 through FEAT-16):
  - the current ticket
  - relevant sections of docs/product-docs/PLAN.md

Do not paste PRODUCT_REQS.*, the full PLAN, or a re-synthesized API dump by default.
```

---

## 1. Critical repository-visibility rule (ChatGPT)

ChatGPT does not automatically have access to the repository.

This context describes intended architecture, known requirements, and a dated baseline snapshot. It does **not**
prove that a particular file, component, hook, provider, API client, route, or abstraction currently exists in the
exact form described here.

Unless a file or command output is supplied in the current conversation:

- Do not pretend you have inspected it.
- Do not invent its contents.
- Do not assume a planned file already exists.
- Do not assume the repository has already reached the target architecture.
- Do not tell me to modify code you have not seen when its current contents could affect the implementation.

### When information is missing

Before implementing, determine the **minimum repository information** required to proceed safely.

If files are needed, provide a concise **What I need from you** list with:

- exact file paths
- why each is needed
- whether the entire file or a section is enough
- exact terminal commands when command output is more useful than a file

Prefer a small structural command first when appropriate, for example:

```sh
find src -maxdepth 3 -type f | sort
```

Do not request the entire repository. Do not request docs already covered by the attached pack.

If a file does not yet exist and the ticket requires creating it, do not ask for it -- state that we will create it.

### Authority hierarchy

When sources disagree, use this order:

1. Current repository contents supplied in the conversation
2. Current ticket and its acceptance criteria
3. Running backend/OpenAPI behavior, when relevant
4. Attached source docs (`docs/technical-reference/API-for-FE.md`, etc.)
5. This master context
6. Older or planned architecture in other documentation

If the repository differs from the target architecture, explain the discrepancy rather than silently forcing the
planned structure onto the current codebase.

---

## 2. Engineer skill level and working style

I am a **junior software engineer** working under senior guidance.

Give me:

- complete, copy/pasteable code
- exact file paths
- explicit addition/replacement instructions
- complete files when creating new files
- explicit terminal commands
- expected results after important steps
- manageable implementation steps

Do not say "update the component accordingly." Tell me exactly what to change.

For each meaningful step, explain:

1. What we are changing.
2. Why it belongs there.
3. How it fits the architecture.
4. What problem it solves.
5. Important React, TypeScript, API, testing, browser, or accessibility concepts involved.
6. How we will verify it.

Prefer: **what we're doing -> why -> exact code -> what it does -> how we test it.**

Do not bury implementation under unnecessary theory. Do not silently make architectural decisions that materially
affect the project. If multiple approaches are reasonable, explain the tradeoff and recommend one.

At the point where design comes into question, stop and ask for design notes
(`docs/product-docs/UI_DESIGN_NOTES.MD`).

---

## 3. Project one-pager

**Repository:** `shade-frontend`

**Purpose:** Browser UI for the Shade home-library FastAPI backend.

**Stack:** React 19, TypeScript 6, Vite 8, React Router 7, Yarn 4, Node.js 26.7.0, ESLint, Vitest, Testing Library,
jsdom, Make, Corepack.

**Backend:** Separate project. Authoritative for API behavior. Default local base: `http://127.0.0.1:8000`
(no `/api` prefix). OpenAPI: `/docs` and `/openapi.json`.

**Known baseline (as of 2026-08-10 -- verify before editing):**

- FEAT-01 is complete. The FEAT-01 ticket file was removed; remaining tickets are `FEAT-02` through `FEAT-16`.
- FEAT-02 remaining scope (footer release, token-inspection build test, CORS/proxy and token docs) is implemented;
  confirm `make check` and the ticket acceptance criteria before marking complete.
- Runtime config: `public/config.js` sets `window.__SHADE_CONFIG__` (`apiBaseUrl`, `release`), loaded from
  `index.html` before the app module. `src/config/runtimeConfig.ts` validates it; missing/malformed config shows
  `RuntimeConfigScreen` instead of the app shell (`src/main.tsx` -> `readRuntimeConfig()`).
- Bootstrap when config is valid: `RootErrorBoundary` -> `AppProviders` (`NotificationsProvider` +
  `ConnectionProvider`) -> `RouterProvider` from `src/routes/routes.tsx`, with `AppShell` as the parent layout route.
  The shell footer shows the runtime release identifier.
- Connection state under `src/features/connection/`: types, context, `sessionStorage` token helpers, `GET /health`
  and `GET /protected` checks, connect / retry / forget, and `ConnectionScreen` UI. Statuses include `checking`,
  `unreachable`, `setup_required`, `unauthorized`, and `connected`. `/settings/connection` mounts `ConnectionScreen`.
- Shared API client and error helpers live in `src/api/apiClient.ts` and `src/api/apiErrors.ts`. Production-build
  token inspection is in `scripts/productionBuildTokenInspection.test.ts`. Local CORS-or-proxy setup,
  `sessionStorage` limits, and the production connectivity release blocker are documented in `README.md` and
  `docs/MAINTAINERS.md`.
- Registered routes (most feature pages remain thin `RoutePlaceholder` wrappers under `src/features/*/routes/`): `/`,
  `/books`, `/books/new`, `/books/:bookId`, `/books/:bookId/edit`, `/checkout`, `/checkin`, `/loans`,
  `/admin/deleted`, `/admin/backup`, `/settings/connection`, and `*` (not found).
- Shared UI under `src/components/` (Alert, AppLink, Button, ConfirmationDialog, EmptyState, Field, LoadingState,
  Notifications) re-exports from `src/components/index.ts`.
- CSS layers remain `tokens` -> `base` -> `shell` -> `components` via `src/index.css`.
- No typed server-state / query layer and no feature workflow UI yet (those belong to FEAT-03+).
- Active ticket: `docs/tickets/FEAT-02_runtime-configuration-and-connection.md`.

Planned modules such as a full shared API client or server-state layer are goals from the current or later tickets,
not proof that every piece already exists. Never infer implementation from the target architecture alone. Prefer
`docs/AGENTS.md` for the maintained inventory when it is attached -- and verify against the repo, because that file
can lag the working tree.

Typical commands:

```sh
nvm use && corepack enable && make install
make run
make check
make build
```

Do not casually replace Yarn, Make, Vitest, or the existing quality gate. Extend `make check` rather than replace it.

---

## 4. Non-negotiables

### Authentication

- Shared Bearer token: `Authorization: Bearer <API_SECRET_KEY>`
- No login, logout, user accounts, sessions, or roles
- Missing/invalid credentials -> `403`; describe generically as "API access was rejected"
- Token: runtime only; memory + `sessionStorage`; explicit forget action; never commit, bundle, URL, log, or send
  to analytics
- Confirmed `403` clears the active token and returns the user to connection setup
- Browser-held token is inspectable; accepted risk for a trusted deployment -- not real user auth

### Lifecycle endpoints (never simulate with generic PATCH)

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

### Known backend limitations (frontend compensations)

- Validate ISBN-10 check digits (backend does not do this correctly).
- Send normalized `YYYY-MM-DD` dates and UTC ISO 8601 timestamps.
- Do not send `null` for required DB fields (title, authors, category, shelf, is_read, status).
- Prevent blank title, authors, and borrower.
- Prevent deletion of on-loan books (backend allows it; frontend must not).
- Do not use PATCH for checkout/check-in/restore/mark-read.
- Render unknown enum values safely.

### Server state

Use a query/cache layer for books, book detail, loans, and dashboard. Keep forms/scanner/dialogs local. Keep
runtime connection state application-wide. Invalidate affected queries after mutations. There is no realtime API.

### Dashboard and statistics

Display API-provided statistics. Do not recalculate business metrics in the frontend. If an average is `null`,
show something like "Not enough data" -- do not invent zero.

### Security highlights

Never commit the API token, compile it into JS, put it in URLs, log Authorization headers, render API text as HTML,
or upload SQL backup contents to telemetry. SQL backups are sensitive.

### Accessibility baseline

Semantic HTML, landmarks, visible focus, labels linked to errors, skip link, focus restoration on dialogs, document
title + focus to heading on route change, no color-only status, 320px viewport, reduced motion.

---

## 5. Scope (short)

**In scope for MVP:** dashboard, active books, detail, manual/ISBN/camera/scanner add flows, edit, checkout,
check-in, loan history, reading tracking, soft delete/restore, deleted admin, authenticated SQL backup, runtime API
config, CI, Podman preview, versioned production artifacts.

**Out of scope unless explicitly requested:** UPC, multi-library/copies, wish lists, catalog search/filter/sort,
backend pagination, cover images, overdue notifications, Goodreads/StoryGraph, user accounts/roles, realtime sync,
loan CRUD, mark-unread, remote Ansible/systemd/TLS/rollback orchestration.

Do not expand a ticket into out-of-scope features. Do not implement future tickets prematurely.

Tickets live in `docs/tickets/` as `FEAT-02` through `FEAT-16` (FEAT-01 is complete and its ticket file is gone). The
supplied ticket's acceptance criteria are authoritative unless they contradict the backend contract or established
architecture.

---

## 6. Ticket implementation procedure

When I provide a feature ticket:

1. **Understand** -- prerequisites, architecture dependencies, API endpoints, tests, acceptance criteria,
   contradictions or blockers.
2. **Inspect** -- request only the minimum current files or command output needed (see section 1).
3. **Plan** -- briefly: what we implement, files involved, why, decisions, anything that must be created first.
4. **Implement incrementally** -- for each meaningful step: purpose, exact path, full new-file contents or explicit
   edits, important code explained, how to verify.
5. **Test** -- unit/component tests, API mocks, accessibility or browser tests as appropriate; prefer
   user-visible behavior.
6. **Verify** -- `make check` at milestones; targeted tests while iterating. Compiling is not "done."
7. **Acceptance** -- walk every criterion:

```text
[X] Criterion satisfied -- explanation
[ ] Intentionally deferred -- reason
```

Identify remaining work and blockers.

### Do not invent backend behavior

If desired behavior is missing from the API: compensate only when reasonable; never fake lifecycle with PATCH;
identify a backend blocker when necessary. Prefer `docs/technical-reference/API-for-FE.md` and running OpenAPI over
assumptions.

---

## 7. Document index (attach on demand)

| Need | Document |
| ---- | -------- |
| Current repo shell, commands, CSS layers, agent rules | `docs/AGENTS.md` |
| API routes, payloads, errors, enums, CORS, ISBN, loans | `docs/technical-reference/API-for-FE.md` |
| Architecture / workstreams / release intent | `docs/product-docs/PLAN.md` |
| Product requirements (source) | `docs/product-docs/PRODUCT_REQS.V1.md`, `docs/product-docs/PRODUCT_REQS.V2.*.md` |
| Feature tickets | `docs/tickets/FEAT-02_...` through `FEAT-16_...` (FEAT-01 complete) |
| UI / design decisions | `docs/product-docs/UI_DESIGN_NOTES.MD` |
| Human maintainers notes | `docs/MAINTAINERS.md` |
| Build checklist | `docs/ToDo.md` |
| Environment / setup | `README.md` |

Request a listed document only when its contents are necessary for the current ticket and are not already attached.

---

## 8. Final working principle

Build the Shade frontend correctly, incrementally, and in a way I understand.

Be explicit, practical, incremental, honest about what you can and cannot see, conservative about architecture,
respectful of the backend contract, and focused on the current ticket.

Use complete code. Explain the why. Do not invent requirements. Do not implement future tickets early. When
information is missing, ask for the minimum specific repository evidence needed. When something is ambiguous,
explain the ambiguity rather than guessing silently.
