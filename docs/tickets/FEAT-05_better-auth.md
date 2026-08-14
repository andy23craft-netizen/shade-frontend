# FEAT-05 — Better auth

## Objective

Replace the runtime connection-settings flow with a root `.env`-sourced Bearer token, remove `/settings/connection`,
and ensure every API-driven page shows a clear error when the backend returns `403` instead of spinning indefinitely.

## Dependencies

FEAT-02 (runtime configuration and connection) and FEAT-03 (typed API and server state) are complete. Reuse the existing
`createApiClient` Bearer injection, `ApiError` model (`kind: 'unauthorized'`, status `403`), and page-level
loading/error patterns from FEAT-04 through FEAT-08. Do not introduce login, sessions, or roles.

## Problem statement

### Symptom

When a protected route such as `/books` receives `403` from the backend, the UI often stays on a loading spinner
(`Loading books…`, etc.) instead of surfacing an error.

### Root cause

Two behaviors interact:

1. **`apiClient.ts`** calls `onUnauthorized` on every authenticated `403`, then throws `ApiError` with
   `kind: 'unauthorized'`.
2. **`ConnectionProvider`** `onUnauthorized` clears the in-memory token, clears `sessionStorage`, sets connection status
   to `unauthorized`, and calls `notifyConnectionInvalidated()`.
3. **`queryInvalidation.ts`** subscribes to that notification and runs `queryClient.clear()`, wiping all cached query
   results.
4. Mounted pages immediately refetch. With the token cleared, requests may omit `Authorization` or repeat the same
   failure. React Query returns to a pending/no-data state (`isPending: true`, `isError: false`), so pages that check
   `isPending` before `isError` show the spinner again.

Individual pages already have error branches (e.g. `BooksPage`), but the post-403 cache clear prevents those branches
from stabilizing.

### Desired behavior after this ticket

- On `403`, show a user-visible error on the current page (and any other page waiting on the same query), e.g.
  **"API access was rejected."**
- Do not loop back into an indefinite loading state.
- Do not redirect to a connection settings screen (that route is removed).
- Tell the operator to fix the token in `.env` and restart or rebuild the dev server.

## Contract references

- `../technical-reference/API-for-FE.md` — Bearer auth: `Authorization: Bearer <API_SECRET_KEY>`; missing or invalid
  credentials return `403` with `{"detail": "Invalid authentication credentials"}`.
- `../technical-reference/openapi.json` — documents `403` on protected routes.
- Backend `.env.example` uses `API_SECRET_KEY`; the frontend value must match the running backend secret.

## Architectural change (intentional)

Today the token is runtime-only (user entry + `sessionStorage`) and must not be compiled into JS
(`scripts/productionBuildTokenInspection.test.ts`, `README.md`, `PLAN.md` §7.3). This ticket **reverses that policy**
for the Bearer secret:

- Source the token from a repository-root `.env` file via Vite's `import.meta.env`.
- The value is injected at dev-server and production **build** time and will appear in generated JS bundles.
- `.env` stays gitignored; `.env.example` is committed with a non-secret placeholder.

Document this tradeoff in `README.md` and update or replace the production token-inspection test accordingly.

Recommended variable name (aligns with backend naming, follows Vite's `VITE_` prefix rule):

```dotenv
VITE_API_SECRET_KEY=change-me
```

## Remaining scope

### 1. Add `.env` / `.env.example`

| File | Change |
|------|--------|
| **`.env.example`** (new) | Add `VITE_API_SECRET_KEY=change-me` and a short comment that the value must match the backend `API_SECRET_KEY`. No real secrets. |
| **`.gitignore`** | No change required — `.env` is already ignored (lines 31–34). Confirm `.env.example` is **not** matched by any ignore rule. |
| **`README.md`** | Replace the "API token storage" section. Document `cp .env.example .env`, set `VITE_API_SECRET_KEY`, restart `make run` after changes. Remove references to the connection screen and `sessionStorage`. Note that the secret is embedded in built assets. |
| **`Makefile`** | Optional: add a `setup` or document in `README` only — e.g. `cp -n .env.example .env` in onboarding. Keep minimal unless maintainers want a Make target. |

### 2. Read and validate the token from the environment

| File | Change |
|------|--------|
| **`src/vite-env.d.ts`** | Extend `ImportMetaEnv` with `readonly VITE_API_SECRET_KEY: string` (and `ImportMetaEnv` interface per Vite docs). |
| **`src/config/apiToken.ts`** (new) | Export `readApiToken(): string` that reads `import.meta.env.VITE_API_SECRET_KEY`, trims whitespace, throws a typed `ApiTokenError` (or reuses `RuntimeConfigError` pattern) when missing/blank. Export `readApiTokenState(): { token: string \| null, error: ... }` for non-throwing bootstrap if preferred. Colocate unit tests. |
| **`src/config/apiToken.test.ts`** (new) | Cover missing, blank, whitespace-only, and valid values. Use Vitest `vi.stubEnv('VITE_API_SECRET_KEY', ...)` or equivalent. |

Vite loads `.env` automatically for `yarn dev` and `yarn build`. No `vite.config.ts` change is required unless tests
need explicit `env` configuration.

### 3. Simplify connection state (env token, no user entry)

| File | Change |
|------|--------|
| **`src/features/connection/connectionToken.ts`** | Initialize from `readApiToken()` at module load or via explicit `initializeApiToken()` called once during provider mount. Remove the "clear on 403" semantics — the env token does not change at runtime. Keep `getCurrentToken()` for `createApiClient`. Remove or no-op `clearCurrentToken()` / `setCurrentToken()` unless tests still need setters (prefer injecting token in tests via env stub). |
| **`src/features/connection/connectionToken.test.ts`** | Update for env-sourced token; drop tests that assume manual set/clear lifecycle unless still applicable. |
| **`src/features/connection/connectionStorage.ts`** | **Delete.** Remove `shade.apiToken` `sessionStorage` usage entirely. |
| **`src/features/connection/ConnectionProvider.tsx`** | Major simplification: load token from env at startup (fail fast or expose error if missing). Remove `connect`, `forgetConnection`, `retry`, `hasToken`, and `sessionStorage` imports. On startup, optionally `checkHealth` + `verifyToken` against `GET /protected` using the env token. Revise `onUnauthorized`: set status to `unauthorized` and surface `errorMessage`, but **do not** clear the env token or wipe storage. Remove `setup_required` transitions tied to missing user token — replace with a startup/config error when `.env` is missing the key. |
| **`src/features/connection/connectionTypes.ts`** | Trim status union: drop `setup_required` if nothing uses it post-removal; keep at minimum `checking`, `connected`, `unauthorized`, `unreachable`, and consider `misconfigured` for missing env token at bootstrap. |
| **`src/features/connection/ConnectionContext.ts`** | Remove `connect`, `retry`, `forgetConnection`, and `hasToken` from the public context shape. Expose `status`, `apiBaseUrl`, `release`, `errorMessage`, and `apiClient` (and any new auth-error flag if added). |
| **`src/features/connection/useConnection.ts`** | Update types only if the hook file re-exports changed context fields. |
| **`src/features/connection/connectionApi.ts`** | Keep `checkHealth` and `verifyToken` for startup verification; update error copy to reference `.env` instead of "enter a valid API token". |
| **`src/features/connection/connectionInvalidation.ts`** | Keep the subscribe/notify seam, but see query invalidation changes below — invalidation on `403` should not cause infinite refetch loops. |

**Bootstrap when `.env` is missing:** Either block the app with a dedicated screen (parallel to `RuntimeConfigScreen`)
or set connection status to a non-recoverable misconfiguration state with instructions. Do not fall through to protected
routes with an empty Bearer header.

### 4. Fix `403` handling so pages show errors

| File | Change |
|------|--------|
| **`src/api/queryInvalidation.ts`** | Stop calling `queryClient.clear()` on connection invalidation triggered by `403`, **or** narrow invalidation to a flag that pages read without destroying in-flight error state. Preferred: remove the cache clear on auth rejection; let queries settle with `isError: true`. If cache clearing is kept for other invalidation reasons, gate it so `403` does not trigger a full clear. |
| **`src/features/connection/ConnectionProvider.tsx`** | On `onUnauthorized`, set `status: 'unauthorized'` and `errorMessage: 'API access was rejected.'` without clearing the token or triggering destructive cache resets. |
| **`src/api/apiErrors.ts`** | Add `formatApiQueryError(error: unknown): string` (or `getQueryErrorPresentation`) that returns `"API access was rejected."` for `ApiError` with `kind === 'unauthorized'`, preserves existing messages for other kinds, and falls back safely for non-`ApiError` values. Colocate tests. |
| **`src/components/QueryErrorState.tsx`** (new, optional but recommended) | Shared section: `Alert variant="error"` + optional Retry button. Accept `title`, `error`, `onRetry`. Use `formatApiQueryError`. Export from `src/components/index.ts`. |
| **`src/features/books/routes/BooksPage.tsx`** | Use shared error formatter/component. Ensure unauthorized errors render the `403` message, not a generic spinner. Consider `isPending && !isFetching` vs `isLoading` carefully — after fix, `isError` should win once the request completes. |
| **`src/features/books/routes/BookDetailsPage.tsx`** | Same unauthorized error treatment in the existing `bookQuery.isError` branch (distinct from `404` not-found handling). |
| **`src/features/books/routes/NewBookPage.tsx`** | Surface `403` on list/lookup/create mutations and queries with the same message pattern. |
| **`src/features/loans/routes/CheckoutPage.tsx`** | Surface `403` on `booksQuery`, `isbnSearchQuery`, and checkout mutation errors. |
| **`src/features/loans/routes/CheckinPage.tsx`** | Surface `403` on `bookQuery`, `booksQuery`, `loansQuery`, and check-in mutation errors. |
| **`src/features/loans/routes/LoansPage.tsx`** | Surface `403` on `loansQuery` and `booksQuery` errors. |
| **`src/features/dashboard/routes/DashboardPage.tsx`** | When FEAT-11 implements dashboard data loading, use the same pattern. If still a placeholder, no change until dashboard queries exist — note in tests checklist. |

**Retry behavior:** Retry may refetch the query. For `403`, retry is optional (token fix requires env change + restart);
either disable retry for unauthorized errors or keep retry but ensure the error state remains visible after failure.

### 5. Remove `/settings/connection`

| File | Change |
|------|--------|
| **`src/features/connection/ConnectionScreen.tsx`** | **Delete.** |
| **`src/features/connection/ConnectionScreen.test.tsx`** | **Delete.** |
| **`src/features/connection/routes/ConnectionPage.tsx`** | **Delete.** |
| **`src/routes/routes.tsx`** | Remove `ConnectionPage` import and the `routeMetadata.connection` child route. |
| **`src/routes/routeMetadata.ts`** | Remove the `connection` entry. |
| **`src/layout/AppShell.tsx`** | Remove the "Connection Settings" `NavLink` (`to="/settings/connection"`). Remove any now-unused connection context fields from destructuring if applicable. |
| **`src/layout/AppShell.test.tsx`** | Remove assertions for the connection nav link and `/settings/connection` route metadata. |

There is no replacement settings page. Misconfiguration is resolved by editing `.env` and restarting the dev server or
rebuilding for production.

### 6. Tests and quality gates

| File | Change |
|------|--------|
| **`src/features/connection/ConnectionProvider.test.tsx`** | Rewrite for env token: stub `VITE_API_SECRET_KEY`; remove `connect` / `forgetConnection` / `sessionStorage` cases; add test that simulated `403` on a protected fetch sets `unauthorized` **without** leaving a child query stuck pending; verify invalidation no longer causes a refetch loop. |
| **`src/api/queryInvalidation.test.ts`** | Update expectations if `403` no longer clears the entire cache. |
| **`src/features/books/routes/BooksPage.test.tsx`** | Add integration-style case: `useBooks` returns `isError: true` with `ApiError` `kind: 'unauthorized'` → assert alert shows "API access was rejected." (or chosen copy). |
| **`src/test/renderAppTree.tsx`** | Stub `import.meta.env.VITE_API_SECRET_KEY` (or set via Vitest env) so tests mount without a real `.env` file. Update `mockReachableApi` if startup now hits `/protected`. |
| **`scripts/productionBuildTokenInspection.test.ts`** | **Replace or rewrite.** Current test fails if known tokens appear in `dist/`. With env-sourced tokens, the build **will** embed the test env value. Options: (a) build with a known dummy `VITE_API_SECRET_KEY` and assert only that `.env` itself is not copied into `dist/`; (b) rename to a test that `.env` is not present in artifacts; (c) remove token-from-bundle prohibition and document the new policy. |
| **Route / workflow tests** (`docs/tickets/FEAT-13_*.md` scope) | Update any planned "connection setup" journeys to ".env setup" instead. |

Run `make check` after implementation.

### 7. Documentation updates (same PR)

| File | Change |
|------|--------|
| **`docs/AGENTS.md`** | Update Authentication, connection feature inventory, route list, and "never compile token" convention to reflect `.env` sourcing and removed connection page. |
| **`docs/MAINTAINERS.md`** | Same adjustments for maintainers. |
| **`docs/product-docs/PLAN.md`** | Revise §7.3 runtime connection and token handling; remove connection settings screen requirement. |
| **`docs/tickets/FEAT-12_operational-and-browser-hardening.md`** | Note dependency on updated auth model if FEAT-12 assumes runtime token entry. |
| **`docs/tickets/FEAT-13_workflow-and-accessibility-tests.md`** | Replace connection-screen journey with env setup. |
| **`docs/tickets/FEAT-14_continuous-integration-quality-pipeline.md`** | CI must supply `VITE_API_SECRET_KEY` for any step that runs `vite build` expecting a token, or use a documented dummy value for build-only checks. Do not commit real secrets. |
| **`docs/tickets/FEAT-15_podman-development-and-preview.md`** | Replace "token outside image layers" guidance with env-file or build-arg strategy for container previews. |
| **`docs/tickets/FEAT-16_versioned-release-artifacts.md`** | Update smoke checklist: remove "connection" UI step; add env verification. |

## Acceptance criteria

- Repository includes a committed `.env.example` with `VITE_API_SECRET_KEY=change-me` (no real secret).
- `.env` at the repo root is gitignored and is the sole source of the Bearer token at runtime.
- `/settings/connection` is removed from routes, navigation, and tests.
- No connection settings UI remains; operators configure auth via `.env` only.
- Missing or blank `VITE_API_SECRET_KEY` produces a clear startup or connection error with remediation steps (create
  `.env` from `.env.example`).
- When any protected page receives `403`, the page shows an error alert (e.g. "API access was rejected.") instead of an
  indefinite loading spinner.
- Simulated `403` on `/books` (and at least one other route, e.g. `/loans`) is covered by automated tests.
- `make check` passes.
- Documentation reflects the new auth model and the intentional embedding of the env token in built JS.

## Out of scope

- User accounts, login, logout, OAuth, or refresh tokens.
- Storing the token in `public/config.js` or URLs.
- Runtime token editing in the browser.
- Changing backend auth semantics or `API_SECRET_KEY` format.
- Fixing non-`403` error presentation (existing retry/network behavior stays unless broken by this change).

## Implementation notes

- **Vite env access:** Only variables prefixed with `VITE_` are exposed to client code. Access via
  `import.meta.env.VITE_API_SECRET_KEY`, not `process.env`, in browser modules.
- **Dev workflow:** After editing `.env`, restart the Vite dev server; hot reload does not reload env files.
- **Production:** Set `VITE_API_SECRET_KEY` in the build environment (CI secret, deployment env) before `make build`.
- **403 copy:** Prefer the existing generic product string **"API access was rejected."** (`apiClient.ts`) over exposing
  raw backend `detail` text, consistent with `AGENTS.md`.
- **Historical FEAT-05:** This ticket reuses the FEAT-05 number for auth improvements; it is unrelated to the completed
  book-creation and ISBN-checkout FEAT-05 work described in `AGENTS.md`.
