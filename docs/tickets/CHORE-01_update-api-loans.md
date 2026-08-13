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

## Dependencies

This ticket is a prerequisite for implementing FEAT-08 (check-in and loan history) cleanly. FEAT-08 requires
book-specific loan filtering and individual loan access. Complete this work before or alongside FEAT-08
implementation.

## Contract References

- `docs/technical-reference/openapi.json`: Lines 2051-2133 (`GET /loans` with optional `book_id`), lines 2135-2210
  (`GET /loans/{id}`)
- `docs/technical-reference/API-for-FE.md`: Lines 128-164 (checkout, check-in, loans behavior)
- FEAT-08 acceptance criteria expect book-specific loan queries and individual loan access

## Current State vs Required Changes

### 1. API Layer (`src/api/loansApi.ts`)

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
- Build query string with `book_id` parameter when `options.bookId` is provided (use `URLSearchParams`)
- Implement `get(id, options)` for fetching individual loans via `GET /loans/{id}`
- Handle optional `signal` in both methods (follow existing `withSignal` pattern from `booksApi.ts`)

### 2. Query Keys (`src/api/queryKeys.ts`)

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

### 3. Query Hooks (`src/api/loansQueries.ts`)

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

### 4. Book Details Page (`src/features/books/routes/BookDetailsPage.tsx`)

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
- Consider whether to add a link to view loan history for this book (e.g., `/loans?bookId=...`); defer to FEAT-08 for
  full loan-history UI decisions

### 5. Optional: Update FEAT-08 Ticket

**Consider:**

Update `docs/tickets/FEAT-08_checkin-and-loan-history.md` to reference this ticket as a completed prerequisite if
CHORE-01 is merged before FEAT-08 begins. If implementing concurrently, ensure changes don't conflict.

Specifically:

- Line 72: Update note about `useLoans` to mention it now supports optional `bookId` filtering
- Line 108-109: Clarify that book-specific loan queries are now available via `useLoans({ bookId })`

## Files to Change

### Must Change

1. **`src/api/loansApi.ts`**
   - Add `ListLoansOptions` interface with optional `bookId?: string`
   - Update `list()` to build query string with `book_id` parameter when provided
   - Add `get(id, options)` method for `GET /loans/{id}`

2. **`src/api/queryKeys.ts`**
   - Add `loans.list(bookId?: string)` factory
   - Add `loans.detail(id: string)` factory

3. **`src/api/loansQueries.ts`**
   - Update `useLoans()` to accept optional `{ bookId?: string }` and pass through
   - Add `useLoan(id: string)` hook with `enabled: Boolean(id)`

4. **`src/features/books/routes/BookDetailsPage.tsx`**
   - Fix Check In link from `/books/${book.id}/checkin` to `/checkin?bookId=${encodeURIComponent(book.id)}`

### Should Update (Tests)

5. **`src/api/loansApi.test.ts`**
   - Add tests for `list({ bookId })` with query parameter encoding
   - Add tests for `get(id)` covering success, 400 (malformed ID), 403, 404, and 422
   - Add abort signal coverage for both methods

6. **`src/api/serverStateQueries.test.tsx`** (or create separate `loansQueries.test.tsx`)
   - Add tests for `useLoans()` without bookId (queries all loans)
   - Add tests for `useLoans({ bookId })` (queries filtered loans)
   - Add tests for `useLoan(id)` with enabled/disabled states

7. **`src/features/books/routes/BookDetailsPage.test.tsx`**
   - Add test verifying Check In link uses `/checkin?bookId=...` format
   - Verify the link appears when `book.status === 'on_loan'` and `book.deletion_date === null`

### May Update (Documentation)

8. **`docs/AGENTS.md`**
   - Update line 260 (`loansApi.ts` description) to mention `bookId` parameter and `get(id)` method
   - Update line 271 (`loansQueries.ts` description) to mention `useLoan` hook

9. **`docs/tickets/FEAT-08_checkin-and-loan-history.md`**
   - Reference CHORE-01 as completed prerequisite (if this ticket merges first)
   - Adjust "Current baseline" section to reflect updated API capabilities

## Implementation Notes

### Pattern Consistency

Follow existing patterns from `booksApi.ts` and `booksQueries.ts`:

- Use `URLSearchParams` for building query strings with optional parameters
- Use `withSignal` helper or equivalent pattern for optional `AbortSignal` handling
- Export typed options interfaces (e.g., `ListLoansOptions`)
- Document request fields with comments referencing OpenAPI paths

### Error Handling

The API returns specific errors for loan endpoints:

- **400**: Malformed or empty GUID (loan ID or book_id query parameter)
- **403**: Authentication failure
- **404**: Unknown loan ID or unknown book_id (well-formed GUID but no matching resource)
- **422**: Validation error (framework-level)

Ensure error handling matches the patterns in `booksApi.ts` -- the `apiClient` already handles these status codes
correctly, so no special error mapping is needed.

### Query Key Invalidation

When FEAT-08 implements check-in and checkout mutations, those mutations should invalidate:

- `queryKeys.loans.all` (invalidates all loan queries including filtered ones)
- Consider whether to also invalidate `queryKeys.loans.detail(loanId)` when that loan is modified

This follows the existing pattern where `invalidateBookCaches` invalidates `queryKeys.books.all` (which covers both
list and detail queries via the prefix).

### Optional bookId Type Safety

The `bookId` parameter should be `string | undefined`, not `string | null`, to match JavaScript conventions and the
absence of the query parameter. Treat `undefined` as "query all loans" and any non-empty string value as "filter by
this book_id".

## Acceptance Criteria

1. `loansApi.list()` with no options queries `GET /loans` (existing behavior preserved)
2. `loansApi.list({ bookId: 'some-id' })` queries `GET /loans?book_id=some-id`
3. `loansApi.get(id)` queries `GET /loans/{id}` and returns `LoanRead`
4. `useLoans()` with no args uses query key `['loans']` and fetches all loans
5. `useLoans({ bookId: 'some-id' })` uses query key `['loans', { bookId: 'some-id' }]` and fetches filtered loans
6. `useLoan(id)` uses query key `['loans', id]` and is disabled when `id` is falsy
7. Check In link in `BookDetailsPage` navigates to `/checkin?bookId=...` (not `/books/.../checkin`)
8. All API tests cover success, auth failures, validation errors, and abort signals
9. Query hook tests verify correct query keys, enabled/disabled states, and signal passing
10. `make check` passes (lint, typecheck, tests, build)

## Out of Scope

This ticket does **not** implement:

- The full check-in UI (`CheckinPage` remains a placeholder)
- The full loan history UI (`LoansPage` remains a placeholder)
- Any mutations or cache invalidation logic beyond what already exists
- Changes to existing checkout or book-detail UI beyond the Check In link fix

Those are covered by FEAT-08. This ticket only updates the API client layer and fixes the routing inconsistency.

## Risks and Considerations

- **Breaking Change**: Updating `useLoans()` signature is not a breaking change because the options parameter is
  optional and defaults to `{}`, preserving existing behavior.
- **Query Key Structure**: Using `['loans', { bookId }]` vs `['loans']` ensures React Query treats them as separate
  cache entries. Invalidating `['loans']` (the prefix) will invalidate both.
- **FEAT-08 Coordination**: If CHORE-01 and FEAT-08 are being worked on concurrently, coordinate to avoid merge
  conflicts in `loansApi.ts`, `loansQueries.ts`, and query invalidation logic.

## Plan Coverage

This work is not explicitly called out in `docs/product-docs/PLAN.md` but supports Workstream 7 (borrowing and
loans) and is a technical prerequisite for FEAT-08 section 7.5 (cache invalidation around loans).
