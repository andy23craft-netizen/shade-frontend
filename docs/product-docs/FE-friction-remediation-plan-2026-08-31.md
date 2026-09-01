# Frontend Friction Remediation Plan

**Source:** `FE-friction-notes-2026-08-31.md`  
**Status:** Proposed for review; do not implement until approved  
**Priority order:** Phase 1 (P1) must complete before Phase 2 (P2); Phase 2 must complete before Phase 3 (P3).

## Planning principles

- Preserve the existing API-first architecture, React Query cache model, URL-backed Books filters, lifecycle endpoints, and accessibility/test gates.
- Build shared behavior for Collections and Wishlists where the domain contracts permit it, while keeping Collection/Wishlist membership data separate from the underlying Book.
- Treat responsive behavior as a supported interaction mode, not a CSS-only afterthought. Verify touch, keyboard, pointer, reduced-motion, and narrow-viewport behavior.
- Do not silently emulate missing backend capabilities in browser state. Contract work identified below must land before its dependent frontend work.
- Each phase is independently releasable and ends with focused unit/component coverage, Playwright coverage for the affected journeys, axe checks, and the canonical `make check` gate.

## Contract decisions required before implementation

1. **Collection membership descriptions — resolved:** `CollectionBookUpdate` accepts optional `notes`; `null` clears it.
2. **Wishlist membership descriptions — resolved:** `WishlistBookUpdate` accepts required nullable `notes`; `null` clears it.
3. **Books secondary ordering — resolved:** every supported server-side primary sort now uses publication date ascending and book ID ascending as stable tie-breakers; invalid/blank/null dates follow valid dates.
4. **Due date transport — resolved:** the current backend requires only `borrower`; `due_at` is nullable and may be omitted. Phase 2 can remove frontend due-date computation, presentation, and request data without a backend contract change.
	-The checkout conflict is already resolved by the current backend: checkout requires only `borrower`; the field is named `due_at`, is nullable, and may be omitted. 

## Phase 1 — P1 interaction and workflow correctness

### 1. Stabilize the Books category multi-select

**Scope:** `BooksListControls`, `BooksPage`, Books URL-state tests, and a mobile/desktop browser journey.

- Reproduce the failure under category toggles while React Query refetches and URL search parameters change; record whether the picker is unmounted, dismissed by outside-pointer handling, or reset by a changing component key.
- Keep picker-open and search-draft state in a component that remains mounted across result loading. Category changes update repeated `category_id` parameters without closing the chooser.
- Preserve selected check states through loading, success, empty, and error states. Close only on Escape, intentional outside interaction, or the explicit close control; restore/follow predictable focus.
- Add regression coverage for consecutive category selections during pending refetch, URL/history updates, outside dismissal, Escape, and existing selections after rerender.

**Exit:** a user can select or clear several categories without the chooser disappearing, and results/URL remain correct.
**Shipped** Will review on update. 

### 2. Make mobile ISBN scanning a full-screen task state

**Scope:** `IsbnCameraScanner`, the New Book scanner launcher/orchestration, scanner CSS, and scanner component/e2e tests.

- Introduce a reusable scanner task shell that, at the mobile breakpoint, occupies the visual viewport and suppresses underlying page interaction/scroll. Respect safe-area insets and dynamic viewport height.
- Constrain the video/viewfinder to the available viewport with no horizontal overflow; keep status, errors, camera choice (when needed), and a persistent Cancel action reachable.
- Preserve the originating form draft. A valid detection stops media tracks, closes the task state, restores the originating view/focus, and applies the ISBN once. Cancel stops tracks and restores the view without changing the ISBN.
- Keep the current inline/desktop behavior unless review chooses full-screen scanning on all viewports. Cover permission denial, timeout/retry, rotation/resize, cleanup on unmount, detection, and cancellation.

**Exit:** scanning is a contained phone-sized task with reliable cleanup and return semantics.
**Shipped** Will Review on update. 

### 3. Expose independent Wishlist removal

**Scope:** `WishlistsPage`, existing `useRemoveWishlistBook`, confirmation/error UI, and tests.

- Add “Remove from Wishlist” beside—but semantically independent from—move/acquire actions.
- Require clear confirmation naming the book and Wishlist; invoke only the existing membership DELETE operation, not book deletion or shelf placement.
- Disable duplicate submission, preserve the row on failure with an actionable error, and invalidate/refetch the affected Wishlist membership data on success.

**Exit:** a user can remove an unwanted entry without acquiring it or altering the Book record.
**Shipped** Will Review on update

### 4. Complete Collection/Wishlist description editing parity

- Retain current Collection description editing and add equivalent Edit Wishlist UI using the existing Wishlist PATCH mutation/model, including explicit clearing.
- Create a shared membership-notes editor interaction (view, edit, save, cancel, validation/error, focus handling), adapted to each resource’s generated types and mutations.
- Label the field as contextual to the containing Collection/Wishlist. Never call the Book update API.
- Invalidate only the relevant container/membership queries and cover 422, not-found/stale membership, retry, clearing, cancel, and isolation from bibliographic description.

**Exit:** container descriptions and per-membership contextual descriptions can be changed later without mutating books.
**Shipped** Will Review on update

### 5. Replace New Additions index state with scroll-boundary state

**Scope:** `HomeBookCarousel`, carousel styles, and component/browser tests.

- Remove the numeric position element and `activeIndex` as the authority.
- Derive `atStart`/`atEnd` from `scrollLeft`, `clientWidth`, and `scrollWidth` using a small tolerance; update on scroll, resize, content changes, manual drag, touch, and trackpad input.
- Move Previous/Next by a viewport-appropriate increment or nearest item, clamp to real boundaries, and disable controls from measured position.
- Define auto-advance as boundary-aware: advance while movement remains; at the end either stop or restart only after product review. Continue honoring reduced motion and interaction pauses.

**Exit:** controls always match the visible scroll range, including after manual movement and at the final partial viewport.
**Shipped** Will Review on update

## Phase 2 — P2 usability and mobile consistency

**Status:** Implemented; pending full user-run Vitest/Playwright gate and mobile-device verification.

### 1. Remove Due Date from frontend presentation and collection

- Inventory and remove due-date labels/status branches from Loans cards/history, checkout UI/copy, tests/fixtures intended to represent UI behavior, and other product surfaces. Preserve backend response tolerance so legacy `due_date` data does not render or break the page.
- Refocus active/returned states on checkout date, return date, borrower, notes, and status. Simplify `loanTemporal` to logic still needed by the UI.
- Remove checkout-side `due_at` computation/request data; the current API permits omission. Update mocks while preserving response compatibility.
- Review the About-page sentence mentioning due dates during copy review; retain it only if it remains intentional product narrative rather than UI guidance.

**Exit:** no operational frontend surface displays, explains, or asks for a due date, and checkout matches the approved API contract.
**Shipped** Will Review on update

### 2. Add publication-date ascending as the Books secondary sort

**Dependency:** contract item 3 above.

- Keep the current URL-backed primary sort controls unchanged. Send/use the approved server ordering and document null/partial-date behavior.
- Ensure stable ordering across infinite-page boundaries and refetches; do not sort individual loaded pages in the browser.
- Add API/query and Books page tests for author, title, shelf, date-added, descending primaries, publication-date primary (if supported), ties, and missing dates.

**Exit:** every primary ordering has deterministic publication-date-ascending ties without a new user control.
**Shipped** Will Review on update

### 3. Standardize mobile Collection/Wishlist action layout

- Introduce a shared responsive folder-header structure/style: title first, left-aligned action row second, description/content third.
- Remove content-length-dependent wrapping/positioning while preserving desktop layout and button keyboard/touch targets.
- Add narrow-viewport visual/browser assertions for short and long titles on both pages.

**Exit:** action placement is identical for short and long names across Collections and Wishlists.
**Shipped** Will Review on update

### 4. Prefer native mobile controls for eligible Add/Edit Book fields

- Audit `BookForm` fields by cardinality and interaction needs. Use native `<select>` on mobile for simple single-choice fields such as shelf; retain custom pickers for authors/categories because they are ordered/multi-select and cannot lose capability.
- Keep desktop presentation unchanged through a shared responsive field primitive or equivalent CSS/markup strategy; avoid duplicate form state and preserve validation, labels, error linkage, and removed/current shelf behavior.
- Test mobile and desktop interaction for both create and edit, including keyboard/focus behavior and no-JavaScript-native semantics where relevant.

**Exit:** eligible single-select fields invoke the platform picker on mobile; multi-select behavior is unchanged.
**Shipped** Will Review on update

### 5. Audit numeric inputs for mobile keypads

- Build a field inventory across Book create/edit, reading/rating, Bulk Add, and any other numeric metadata. Classify integer, decimal/currency, bounded numeric, and numeric-looking identifiers (ISBN must not become a number input).
- Apply appropriate `inputMode` (`numeric` or `decimal`) and patterns where helpful while preserving string-backed formatting, leading zeros, nullability, locale handling, and existing validation. Use `type="number"` only where its spinner/parsing semantics are already appropriate.
- Add semantic tests for representative integer, decimal, rating, year/date, and ISBN fields.

**Exit:** mobile keyboards match the expected data without changing accepted values or desktop validation.
**Shipped** Will Review on update

## Phase 3 — P3 visual polish

### 1. Protect Staff Picks carousel controls

- Establish an explicit control layer/protected zone using layout spacing, clipping, and stacking contexts. Decorative card transforms stay within the card viewport and cannot intercept pointer events.
- Check first, middle, and last items at mobile and desktop widths, with focus rings visible and arrow hit targets unobstructed.

### 2. Remove drawer-navigation stagger

- Remove per-item `nth-child` translate/offset rules and align links on one axis while retaining borders, tabs, texture, typography, hover, active, and focus treatments.
- Verify long labels retain space and drawer opening/closing behavior is unchanged.

### 3. Restore and share folder-tab styling

- Extract/shared-use the Wishlist folder tab/trapezoid treatment for both Wishlist and Collection folder containers, preferring CSS pseudo-elements/tokens over duplicated markup or raster assets.
- Keep collapse/expand semantics, focus order, and mobile action layout unchanged.

### 4. Restyle Loan dates as physical stamps

- Add a reusable semantic date-stamp class/component for checkout and return dates, using readable CSS typography/borders with restrained variation.
- Maintain contrast, zoom/reflow, screen-reader date text, and reduced-motion behavior; decorative imperfection must not reduce legibility.

**Phase 3 exit:** decoration is consistent and never obscures content, controls, labels, or focus states.

## Review and release gates

Before implementation approval, resolve the three remaining contract decisions and the New Additions end-of-list auto-advance behavior. The checkout `due_at` decision is resolved. For each phase:

1. Confirm scope and acceptance criteria with Product/Design; capture any visual references for P3 before styling.
2. Implement as small vertical slices in the listed order, keeping contract-generating backend work ahead of dependent frontend slices.
3. Run focused model/API/component tests during development, then affected Playwright journeys at desktop and phone viewports with axe checks.
4. Manually verify iOS Safari scanning/select/keypad behavior and at least one Android Chromium device for camera, viewport, touch, and keyboard behavior.
5. Run `make check`, inspect the final diff for unrelated changes/generated artifacts/secrets, and release the phase only when all of its exit criteria pass.

## Definition of complete

All fourteen friction-note workstreams are complete only when their behavior is covered at the appropriate test layer, required API contracts are checked in and regenerated, mobile device checks are recorded, no accessibility regressions are introduced, and the canonical quality gate passes.
