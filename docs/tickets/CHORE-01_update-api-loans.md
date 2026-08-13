# CHORE-01 -- Update Loans API Integration

## Objective

Update the frontend's Loans API integration to fully conform with the backend's OpenAPI contract, adding support for
the `book_id` query parameter on `GET /loans` and the `GET /loans/{id}` endpoint for individual loan details.

## Background

The backend API provides richer Loans endpoints than the frontend currently uses:

- `GET /loans` accepts an optional `book_id` query parameter to filter loans for a specific book
- `GET /loans/{id}` fetches a single loan by its ID

The frontend currently only implements `GET /loans` without query parameters, limiting its ability to efficiently
fetch book-specific loan history. Additionally, there is a routing inconsistency where `BookDetailsPage` links to
`/books/${book.id}/checkin` (an unregistered route) instead of the correct `/checkin?bookId=...` pattern.

Generated OpenAPI types in `src/api/generated/openapi.ts` are also behind the checked-in contract: they do not yet
include the `book_id` query parameter or the `GET /loans/{id}` operation.

## Dependencies

This ticket is a prerequisite for FEAT-08 (check-in and loan history). FEAT-08 requires book-specific loan filtering
and individual loan access. Complete and merge CHORE-01 before starting FEAT-08 implementation. Do not implement the
two tickets concurrently.

## Contract References

- `docs/technical-reference/openapi.json`: Lines 2051-2133 (`GET /loans` with optional `book_id`), lines 2135-2210
  (`GET /loans/{id}`)
- `docs/technical-reference/API-for-FE.md`: Lines 128-164 (checkout, check-in, loans behavior)
- FEAT-08 acceptance criteria expect book-specific loan queries and individual loan access

Confirm against a representative running backend `/openapi.json` when available; record drift as a blocker rather than
inventing frontend semantics. After updating the checked-in OpenAPI (if needed), regenerate
`src/api/generated/openapi.ts` with `yarn api:generate` and keep `yarn api:check` green.

## Current State vs Required Changes

### 1. Generated OpenAPI Types (`src/api/generated/openapi.ts`)

**Current:**

Generated types describe `GET /loans` with no query parameters and do not include `GET /loans/{id}`.

**Required:**

Regenerate from the checked-in OpenAPI document:

```sh
yarn api:generate
```

Do not hand-edit `src/api/generated/openapi.ts`. After regeneration, `yarn api:check` must pass.

### 2. API Layer (`src/api/loansApi.ts`)

**Current:**

```typescript
export function createLoansApi(client: ReturnType<typeof createApiClient>) {
    return {
        async list(options: ApiCallOptions = {}): Promise<LoanList> {
            // Only supports GET /loans with no query parameters
        },
    }
}
```

**Required:**

Add optional `bookId` parameter to `list()` and implement `get(id)`:

```typescript
export interface ListLoansOptions extends ApiCallOptions {
    bookId?: string
}

export function createLoansApi(client: ReturnType<typeof createApiClient>) {
    return {
        async list(options: ListLoansOptions = {}): Promise<LoanList> {
            // Support optional ?book_id=... query parameter
            // Pattern: follow booksApi.list() with includeDeleted parameter
            // Omit book_id when bookId is undefined; never send book_id=
        },

        async get(id: string, options: ApiCallOptions = {}): Promise<LoanRead> {
            // GET /loans/{id}
            // Pattern: follow booksApi.get(id, options)
        },
    }
}
```

**Changes:**

- Define `ListLoansOptions` interface extending `ApiCallOptions` with optional `bookId?: string`
- Update `list()` signature to accept `ListLoansOptions`
- Build query string with `book_id` parameter only when `options.bookId` is a non-empty string
  (use `URLSearchParams`)
- Implement `get(id, options)` for fetching individual loans via `GET /loans/{id}`
- Handle optional `signal` in both methods (follow existing `withSignal` pattern from `booksApi.ts`)

### 3. Query Keys (`src/api/queryKeys.ts`)

**Current:**

```typescript
loans: {
    all: ['loans'] as const,
},
```

**Required:**

Add query keys for filtered lists and individual loan details:

```typescript
loans: {
    all: ['loans'] as const,

    list: (bookId?: string) =>
        bookId !== undefined
            ? ['loans', { bookId }] as const
            : ['loans'] as const,

    detail: (id: string) => ['loans', id] as const,
},
```

**Changes:**

- Add `list(bookId?: string)` factory that returns `['loans', { bookId }]` when filtered, `['loans']` when unfiltered
- Add `detail(id: string)` factory returning `['loans', id]`
- Ensure `all: ['loans']` prefix covers both list variants for invalidation purposes

### 4. Query Hooks (`src/api/loansQueries.ts`)

**Current:**

```typescript
export function useLoans() {
    // Always queries GET /loans with no parameters
}
```

**Required:**

Add optional `bookId` parameter to `useLoans` and create `useLoan(id)` hook:

```typescript
export function useLoans(options: { bookId?: string } = {}) {
    const { apiClient } = useConnection()
    const loansApi = createLoansApi(apiClient)
    const bookId = options.bookId

    return useQuery({
        queryKey: queryKeys.loans.list(bookId),
        queryFn: ({ signal }) => loansApi.list({ bookId, signal }),
    })
}

export function useLoan(id: string) {
    const { apiClient } = useConnection()
    const loansApi = createLoansApi(apiClient)

    return useQuery({
        queryKey: queryKeys.loans.detail(id),
        queryFn: ({ signal }) => loansApi.get(id, { signal }),
        enabled: Boolean(id),
    })
}
```

**Changes:**

- Update `useLoans()` to accept optional `{ bookId?: string }` options parameter
- Pass `bookId` to `queryKeys.loans.list(bookId)` and `loansApi.list({ bookId, signal })`
- Create `useLoan(id: string)` hook following the pattern of `useBook(id)`
- Use `enabled: Boolean(id)` to prevent queries with empty/falsy IDs

### 5. Book Details Page (`src/features/books/routes/BookDetailsPage.tsx`)

**Current (line 447):**

```tsx
<AppLink
    to={`/books/${book.id}/checkin`}
    variant="primary"
>
    Check In
</AppLink>
```

**Required:**

Fix routing to use the registered `/checkin` route with `bookId` query parameter:

```tsx
<AppLink
    to={`/checkin?bookId=${encodeURIComponent(book.id)}`}
    variant="primary"
>
    Check In
</AppLink>
```

**Changes:**

- Update Check In link from `/books/${book.id}/checkin` to `/checkin?bookId=${encodeURIComponent(book.id)}`
- Follow the same pattern used by the Check Out link (line 438)
- Do not add a loan-history link here; defer book-filtered history UI to FEAT-08

### 6. Update FEAT-08 Ticket

After CHORE-01 merges, update `docs/tickets/FEAT-08_checkin-and-loan-history.md` so its baseline reflects completed
prerequisite work (not concurrent work):

- Dependencies: state that CHORE-01 is complete and required before FEAT-08
- Current baseline: note that `useLoans` supports optional `bookId` filtering, `loansApi.get` / `useLoan` exist, and
  the Check In link uses `/checkin?bookId=...`
- Remaining scope: treat book-specific loan queries as available via `useLoans({ bookId })`

## Files to Change

### Must Change

1. **`src/api/generated/openapi.ts`**
   - Regenerate via `yarn api:generate` from `docs/technical-reference/openapi.json`
   - Do not hand-edit; confirm with `yarn api:check`

2. **`src/api/loansApi.ts`**
   - Add `ListLoansOptions` interface with optional `bookId?: string`
   - Update `list()` to build query string with `book_id` only for non-empty `bookId`
   - Add `get(id, options)` method for `GET /loans/{id}`

3. **`src/api/queryKeys.ts`**
   - Add `loans.list(bookId?: string)` factory
   - Add `loans.detail(id: string)` factory

4. **`src/api/loansQueries.ts`**
   - Update `useLoans()` to accept optional `{ bookId?: string }` and pass through
   - Add `useLoan(id: string)` hook with `enabled: Boolean(id)`

5. **`src/features/books/routes/BookDetailsPage.tsx`**
   - Fix Check In link from `/books/${book.id}/checkin` to `/checkin?bookId=${encodeURIComponent(book.id)}`

### Should Update (Tests)

6. **`src/api/loansApi.test.ts`**
   - Add tests for `list({ bookId })` with query parameter encoding
   - Add tests that omit `book_id` when `bookId` is undefined
   - Add tests for `get(id)` covering success, 400 (malformed or empty ID), 403, 404, and 422
   - Add abort signal coverage for both methods

7. **`src/api/serverStateQueries.test.tsx`** (or create separate `loansQueries.test.tsx`)
   - Add tests for `useLoans()` without bookId (queries all loans)
   - Add tests for `useLoans({ bookId })` (queries filtered loans)
   - Add tests for `useLoan(id)` with enabled/disabled states

8. **`src/features/books/routes/BookDetailsPage.test.tsx`**
   - Add test verifying Check In link uses `/checkin?bookId=...` format
   - Verify the link appears when `book.status === 'on_loan'` and `book.deletion_date === null`

### May Update (Documentation)

9. **`docs/AGENTS.md`**
   - Update the `loansApi.ts` description to mention `bookId` parameter and `get(id)` method
   - Update the `loansQueries.ts` description to mention `useLoan` hook

10. **`docs/tickets/FEAT-08_checkin-and-loan-history.md`**
    - Reference CHORE-01 as a completed prerequisite (this ticket merges first)
    - Adjust "Current baseline" and remaining-scope notes to reflect updated API capabilities

## Implementation Notes

### Pattern Consistency

Follow existing patterns from `booksApi.ts` and `booksQueries.ts`:

- Use `URLSearchParams` for building query strings with optional parameters
- Use `withSignal` helper or equivalent pattern for optional `AbortSignal` handling
- Export typed options interfaces (e.g., `ListLoansOptions`)
- Document request fields with comments referencing OpenAPI paths
- Prefer regenerating OpenAPI types over hand-editing `src/api/generated/openapi.ts`

### Error Handling

The API returns specific errors for loan endpoints:

- **400**: Malformed or empty GUID (loan ID path, or `book_id` query parameter including `book_id=`)
- **403**: Authentication failure
- **404**: Unknown loan ID or unknown book_id (well-formed GUID but no matching resource)
- **422**: Validation error (framework-level)

The backend treats an empty-string `book_id` (`?book_id=` or `book_id=""`) as **400**, the same as other malformed or
empty GUID identifiers. Frontend callers must omit the query parameter when there is no book filter; do not send an
empty string. The `apiClient` already maps these status codes, so no special error mapping is needed in `loansApi`.

### Query Key Invalidation

Existing checkout/check-in mutations already invalidate `queryKeys.loans.all`. That prefix continues to cover filtered
list and detail keys added here. FEAT-08 may later decide whether additional detail-key invalidation is useful; do not
expand invalidation logic in this ticket.

### Optional bookId Type Safety

The `bookId` parameter should be `string | undefined`, not `string | null`, to match JavaScript conventions and the
absence of the query parameter:

- `undefined` -- omit `book_id` and query all loans
- non-empty string -- send `?book_id=<value>`
- empty string (`''`) -- do not send; callers must not pass `''` because the backend returns **400** for empty
  `book_id`

`useLoan` already uses `enabled: Boolean(id)` so empty path IDs do not fire `GET /loans/{id}`.

## Acceptance Criteria

1. `yarn api:generate` / `yarn api:check` succeed; generated types include `book_id` on `GET /loans` and
   `GET /loans/{id}`
2. `loansApi.list()` with no options queries `GET /loans` (existing behavior preserved)
3. `loansApi.list({ bookId: 'some-id' })` queries `GET /loans?book_id=some-id`
4. `loansApi.list()` / `list({ bookId: undefined })` never appends `book_id=` (empty string is a backend **400**)
5. `loansApi.get(id)` queries `GET /loans/{id}` and returns `LoanRead`
6. `useLoans()` with no args uses query key `['loans']` and fetches all loans
7. `useLoans({ bookId: 'some-id' })` uses query key `['loans', { bookId: 'some-id' }]` and fetches filtered loans
8. `useLoan(id)` uses query key `['loans', id]` and is disabled when `id` is falsy
9. Check In link in `BookDetailsPage` navigates to `/checkin?bookId=...` (not `/books/.../checkin`)
10. All API tests cover success, auth failures, validation errors, and abort signals
11. Query hook tests verify correct query keys, enabled/disabled states, and signal passing
12. `make check` passes (lint, typecheck, tests, build)

## Out of Scope

This ticket does **not** implement:

- The full check-in UI (`CheckinPage` remains a placeholder)
- The full loan history UI (`LoansPage` remains a placeholder)
- Any mutations or cache invalidation logic beyond what already exists
- Changes to existing checkout or book-detail UI beyond the Check In link fix

Those are covered by FEAT-08 after this ticket is complete. This ticket only updates the API client layer (including
generated types) and fixes the routing inconsistency.

## Risks and Considerations

- **Breaking Change**: Updating `useLoans()` signature is not a breaking change because the options parameter is
  optional and defaults to `{}`, preserving existing behavior.
- **Query Key Structure**: Using `['loans', { bookId }]` vs `['loans']` ensures React Query treats them as separate
  cache entries. Invalidating `['loans']` (the prefix) will invalidate both.
- **Sequencing**: Complete CHORE-01 before FEAT-08 so FEAT-08 can consume filtered `useLoans`, `useLoan`, and the fixed
  Check In deep-link without parallel edits to the same API files.
- **Empty book_id**: Sending `book_id=` is a contract **400**. Guard omission in `loansApi.list` and avoid passing `''`
  from hooks/call sites.

## Plan Coverage

This work is not explicitly called out in `docs/product-docs/PLAN.md` but supports Workstream 7 (borrowing and
loans) and is a technical prerequisite for FEAT-08 section 7.5 (cache invalidation around loans).
