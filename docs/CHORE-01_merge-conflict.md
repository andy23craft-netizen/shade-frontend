# CHORE-01 -- Merge Conflict Resolution

## Context

A junior engineer implemented FEAT-05 (book form and creation) but had not pulled recent changes from `main` before
starting work. The `main` branch was merged into the feature branch, resulting in conflicts across 6 files in the books
feature module.

## Background

- **Theirs (main branch)**: Contains baseline implementations from earlier tickets (FEAT-01 through FEAT-04)
- **Mine (HEAD/feature branch)**: Contains the junior engineer's FEAT-05 implementation with ISBN lookup, enhanced
  validation, and improved book creation workflow

## Ticket Ownership

Per `docs/AGENTS.md` and `docs/tickets/FEAT-05_book-form-and-creation.md`:

- **FEAT-04** (complete): Active collection and book details (`BooksPage`, `BookDetailsPage`)
- **FEAT-05** (current): Book form and creation with ISBN lookup (`NewBookPage`, `BookForm`, ISBN validation)
- **FEAT-10** (future): Edit route implementation (`EditBookPage`)

## File-by-File Resolution

### 1. `src/features/books/routes/BookDetailsPage.test.tsx`

**Resolution: Mine (HEAD)**

**Rationale:**
- HEAD contains comprehensive test coverage that aligns with FEAT-04's completed implementation
- Includes tests for:
  - Loading states
  - Error handling with retry functionality
  - 404 not-found state with proper messaging
  - Complete book details rendering
  - Nullable field handling without rendering "null" or "undefined"
  - Unknown enum value safety (`enumDisplayValue`)
  - Date formatting without timezone shifting
  - Malformed date handling
  - Lifecycle action gating (checkout/check-in/delete based on status)
  - Soft-deleted book handling
- Main branch has simpler, less comprehensive test coverage
- HEAD's tests match the acceptance criteria for FEAT-04

### 2. `src/features/books/routes/BookDetailsPage.tsx`

**Resolution: Mine (HEAD)**

**Rationale:**
- HEAD contains the complete FEAT-04 implementation with:
  - Proper date display helper that avoids timezone shifting for `YYYY-MM-DD` dates
  - Improved enum display using `enumDisplayValue` from the API layer
  - Better structured field presentation with multiple sections (Bibliographic, Acquisition, Lifecycle, Reading,
    Borrowing Statistics, Audit)
  - Correct action gating (prevents checkout/delete for on-loan books)
  - Soft-delete handling with appropriate messaging and hidden actions
  - Query invalidation on 404 to keep the books list cache fresh
- Main branch has a simpler implementation with inline enum display and less sophisticated date handling
- HEAD's implementation follows the architectural conventions established in FEAT-03 and FEAT-04

### 3. `src/features/books/routes/BooksPage.test.tsx`

**Resolution: Mine (HEAD)**

**Rationale:**
- HEAD contains comprehensive test coverage including:
  - Loading state rendering
  - Error handling with error message display
  - Empty state with "Add Book" link
  - Complete collection rendering with book metadata
  - Unknown enum value safety with explicit "(unknown)" suffix
- Main branch has simpler tests with less enum coverage
- HEAD's test structure uses `makeBookList` helper for cleaner test data generation
- Tests verify the enum display behavior that is part of FEAT-04's safe rendering requirements

### 4. `src/features/books/routes/BooksPage.tsx`

**Resolution: Mine (HEAD)**

**Rationale:**
- HEAD has improved enum display with title case formatting:
  - `displayEnum` uses `enumDisplayValue` and formats results with title case and space replacement
  - Example: `'on_loan'` displays as `'On Loan'`
- Better structured list items using semantic `<dl>`, `<dt>`, `<dd>` elements for book metadata
- Includes `displayReadState` helper for consistent read/unread display
- Main branch has simpler enum display without formatting (`Unknown (value)` pattern)
- HEAD's implementation provides better visual presentation and follows FEAT-04's polish requirements

### 5. `src/features/books/routes/EditBookPage.tsx`

**Resolution: Theirs (main)**

**Rationale:**
- **CRITICAL**: `EditBookPage` is owned by FEAT-10 (metadata edit), not FEAT-05
- Per `docs/AGENTS.md` line 292-293: "`EditBookPage` (`/books/:bookId/edit`, FEAT-10)"
- Per `docs/tickets/FEAT-05_book-form-and-creation.md` line 22: "FEAT-10 owns edit route wiring that reuses this form
  for `PATCH /books/{id}`"
- HEAD contains a complete edit implementation, but this work is premature
- Main branch correctly has `RoutePlaceholder` as the route is not yet in scope
- The junior engineer should not have implemented edit functionality in FEAT-05
- **Action**: Keep `RoutePlaceholder`; the edit implementation will be handled in FEAT-10

### 6. `src/features/books/routes/NewBookPage.tsx`

**Resolution: Combination (mostly Mine with selective cleanup)**

**Rationale:**
- This is the core FEAT-05 deliverable (book creation with ISBN lookup)
- HEAD contains the full implementation including:
  - ISBN lookup integration with `useBookLookup`
  - Lookup state management (`lookupIsbn`, `lookupRequested`)
  - Draft metadata application from successful lookups
  - Manual fallback when lookup fails or returns no results
  - Form state management for all book fields
  - Proper nullable string/number conversions
  - Dynamic enum options that include unknown values
  - Read state handling that clears completion date when unchecked
- Main branch has a minimal baseline using `BookForm` component with `bookFormDefaults`
- **However**, the HEAD implementation should be preserved because:
  - It implements FEAT-05's core requirement: "Create books through typed ISBN lookup or fully manual entry"
  - It includes the acceptance criteria from FEAT-05: ISBN validation, `found: false` handling, error recovery, manual
    fallback
  - The lookup UI and state management are essential to the ticket
- **Note**: The junior engineer's implementation appears to have been done before `BookForm` component was extracted,
  but the functionality is complete and correct for FEAT-05

**Combination Details**:
- Use HEAD's full implementation
- Verify that ISBN validation from `src/features/books/utils/isbn.ts` is wired (per FEAT-05 requirements)
- Ensure test coverage in `NewBookPage.test.tsx` covers the lookup flows

## Summary Table

| File                         | Resolution  | Reason                                                                              |
|------------------------------|-------------|-------------------------------------------------------------------------------------|
| `BookDetailsPage.test.tsx`   | Mine (HEAD) | Comprehensive FEAT-04 test coverage                                                 |
| `BookDetailsPage.tsx`        | Mine (HEAD) | Complete FEAT-04 implementation with proper enum/date handling                      |
| `BooksPage.test.tsx`         | Mine (HEAD) | Complete FEAT-04 test coverage with enum safety                                     |
| `BooksPage.tsx`              | Mine (HEAD) | Improved enum display with title case and better semantic structure                 |
| `EditBookPage.tsx`           | Theirs      | **FEAT-10 ownership** -- must remain `RoutePlaceholder`                             |
| `NewBookPage.tsx`            | Mine (HEAD) | Core FEAT-05 implementation with ISBN lookup                                        |

## Resolution Commands

```bash
# Accept Mine (HEAD) for FEAT-04 files
git checkout --ours src/features/books/routes/BookDetailsPage.test.tsx
git checkout --ours src/features/books/routes/BookDetailsPage.tsx
git checkout --ours src/features/books/routes/BooksPage.test.tsx
git checkout --ours src/features/books/routes/BooksPage.tsx

# Accept Theirs (main) for FEAT-10 file
git checkout --theirs src/features/books/routes/EditBookPage.tsx

# Accept Mine (HEAD) for FEAT-05 file
git checkout --ours src/features/books/routes/NewBookPage.tsx

# Stage all resolved files
git add src/features/books/routes/
```

## Post-Resolution Actions

1. **Run the test suite** to ensure all tests pass:
   ```bash
   make test
   ```

2. **Run the full quality gate**:
   ```bash
   make check
   ```

3. **Verify NewBookPage functionality**:
   - Confirm ISBN lookup integration works
   - Verify manual entry fallback
   - Check that ISBN validation from `isbn.ts` is wired correctly
   - Ensure `found: false` handling displays appropriate messaging

4. **Confirm EditBookPage reverts correctly**:
   - Visit `/books/:bookId/edit` in the dev server
   - Should render `RoutePlaceholder` with "Edit Book" heading
   - No edit functionality should be present

5. **Review test alignment**:
   - Ensure `NewBookPage.test.tsx` exists and covers lookup flows
   - Verify `BookForm.test.tsx` is aligned with the gated create fields per FEAT-05

## Notes

- The junior engineer implemented a valid and complete FEAT-05 solution, but prematurely included edit functionality
  (FEAT-10)
- The main branch had baseline implementations that were simpler but incomplete for FEAT-04 and FEAT-05
- This resolution preserves the completed work while respecting ticket boundaries
- FEAT-10 will re-implement the edit functionality when that ticket is active
