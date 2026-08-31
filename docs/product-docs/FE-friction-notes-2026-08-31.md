# Shade Library --- Frontend Friction & Polish Notes

**Date:** August 31, 2026\
**Purpose:** Frontend handoff after real-world use following the recent
stability and Bulk Add work.

## Status / Context

The application was substantially more stable in today's use. The
previous crashing/shakiness issues did not recur, and the recently
tested Bulk Add workflow changes were a significant improvement.

Most items below are therefore **frontend usability, parity,
interaction, or visual-polish work**, rather than architectural
problems.

### Priority legend

-   **P1 --- Actual friction / interaction bug:** Interrupts or
    misrepresents a workflow.
-   **P2 --- Page improvement / usability:** Working behavior that
    should be easier or more consistent.
-   **P3 --- Visual redesign / polish:** Primarily presentation,
    provided controls remain usable.

------------------------------------------------------------------------

# Books Page

## P1 --- Category multi-select chooser intermittently disappears

When filtering Books by category, selecting a category sometimes causes
the page/results to reload or re-render and the category chooser
disappears.

This is particularly disruptive because categories support **multiple
simultaneous selections**.

### Desired behavior

-   Selecting a category must not end the category-selection
    interaction.
-   The chooser should remain open/stable while results update.
-   Existing category selections must remain visibly selected.
-   The chooser should close only through intentional dismissal
    behavior.
-   Investigate whether the filter/query/navigation update is
    intermittently unmounting and recreating the chooser.

## P2 --- Automatic publication-date secondary sort

Add **publication date ascending** as an automatic secondary sort for
Books.

The physical shelves are arranged this way, and it also naturally puts
many series into publication order without another sorting interaction.

### Desired behavior

Preserve the user's selected primary sort, then use publication date
ascending as the secondary ordering where applicable.

Examples:

-   Author ascending → author ASC, then publication date ASC.
-   Title ascending → title ASC, then publication date ASC.
-   Other primary sorts should receive the same deterministic
    publication-date tiebreaker where sensible.
-   If publication date is already the primary sort, do not redundantly
    apply it as a secondary sort.

This is intended as an automatic secondary ordering, not a new
secondary-sort control the user must manage.

------------------------------------------------------------------------

# Collections Page

## P1 --- Edit contextual book descriptions

The **description attached to a book within a Collection** must remain
editable after the book has been added.

This is **not the Book record's bibliographic description**. It is
contextual metadata belonging to that book's membership in the
particular Collection.

### Desired behavior

-   The Collection's own description remains editable.
-   A Collection membership/book entry's contextual description can be
    added or changed later.
-   Editing this contextual description must not alter the underlying
    Book record.

## P2 --- Mobile action buttons need deterministic placement

On mobile, Collection action buttons currently change sides/position
depending on the length of the Collection name.

### Desired behavior

At the mobile breakpoint, always use:

1.  Collection title
2.  Action buttons on their own row, **left-aligned beneath the title**
3.  Description / remaining content

Long and short Collection names should produce the same layout.

## P3 --- Restore folder-tab/trapezoid styling

Collections were collapsed into the same folder-style presentation used
by Wishlists, but the decorative **tab/separator trapezoid at the top of
the folders** was not carried over.

### Desired behavior

-   Restore the trapezoid/tab CSS/image treatment to Collection folders.
-   Do not change collapse/expand behavior.
-   Prefer shared folder/tab presentation styles between Collections and
    Wishlists to reduce future visual drift.

------------------------------------------------------------------------

# Wishlists Page

## P1 --- Complete editing/removal parity

Wishlist management has several operations that need to be exposed
consistently in the frontend.

### Desired behavior

-   Add an **Edit Wishlist** action so the Wishlist's own description
    can be changed after creation.
-   Allow editing the **contextual description attached to an individual
    book within the Wishlist** after it has been added.
-   This membership description is separate from the underlying Book
    record.
-   Allow a book to be **removed from a Wishlist without acquiring it /
    adding it to the owned collection**.
-   "Remove from Wishlist" and "Add to Collection/Acquire" must remain
    independent actions.

## P2 --- Mobile action buttons need deterministic placement

Apply the same mobile rule as Collections:

1.  Wishlist title
2.  Action buttons on their own row, **left-aligned beneath the title**
3.  Description / remaining content

Do not allow title length to determine where the controls land.

Where practical, Collections and Wishlists should share these responsive
presentation rules.

------------------------------------------------------------------------

# Home Page --- New Additions

## P1 --- Replace card-number-based carousel state with scroll-position state

The New Additions carousel currently displays numbered positions with
Previous/Next arrows.

Near the end of the carousel, the last several numbers continue to
increment even though the carousel cannot move farther. Manually
dragging the scrollbar to the end can also leave the displayed number
out of sync with the actual viewport.

### Desired behavior

-   **Remove the numeric position indicator entirely.**
-   Treat actual scroll position as the source of truth rather than a
    "current card" index.
-   Previous/Next may move the carousel by an appropriate increment,
    but:
    -   Previous disables at the actual beginning of the scroll range.
    -   Next disables at the actual end of the scroll range.
-   Manual scrollbar, swipe, touch, or trackpad movement must update
    control availability naturally.
-   If auto-advance exists, its stopping/looping behavior should
    likewise be based on the actual scroll boundary.

------------------------------------------------------------------------

# Home Page --- Staff Picks

## P3 --- Constrain stacked-notecard boundaries around controls

Keep the stacked-notecard visual treatment, but decorative/background
cards can currently descend into the carousel control area and cover the
navigation arrows at certain positions, observed particularly around
items 1 and 7.

### Desired behavior

-   Preserve the stacked-card effect.
-   Establish a protected control zone that background/decorative cards
    cannot enter.
-   Navigation arrows must remain fully visible and tappable at every
    carousel position.
-   Review transforms/offsets/clipping at the beginning and end of the
    list, where the issue is most apparent.

------------------------------------------------------------------------

# Drawer Navigation

## P3 --- Remove staggered notecard offsets

The original staggered/offset notecard treatment for drawer navigation
no longer improves the design.

### Desired behavior

-   Align all drawer navigation cards consistently on the same axis.
-   Remove the per-card stagger/offset.
-   Retain the notecard aesthetic through borders, typography, tabs,
    texture, etc.
-   Do not sacrifice label space for decorative offsetting.

------------------------------------------------------------------------

# Loans Page / Circulation UI

## P2 --- Remove Due Date from the frontend

Shade Library does not use due dates.

### Desired behavior

Audit the frontend and remove Due Date from **every surface that
currently displays or requests it**, including as applicable:

-   Loan cards
-   Loan details/history
-   Checkout/check-in UI
-   Tables
-   Labels
-   Empty placeholders
-   Related explanatory copy

Loan presentation should instead focus on meaningful data such as
checkout date, return date, borrower, and status.

This is a frontend alignment change: do not introduce a replacement
due-date concept.

## P3 --- Restyle loan dates as physical date stamps

The dates displayed on the Loans page should visually resemble
traditional library/date stamps rather than ordinary metadata text.

### Desired direction

-   Compact stamped-date treatment.
-   Ink/stamp-like typography and/or border treatment.
-   Slight physical/imperfect character is welcome.
-   Maintain strong readability and accessibility.
-   Prefer CSS/typography over requiring a raster image asset unless an
    asset later proves worthwhile.

------------------------------------------------------------------------

# Add Book / Edit Book

## P2 --- Prefer native mobile selectors for simple choices

Collections and Wishlists currently trigger the native Apple/iOS
selector behavior on mobile, which is preferable to the website-styled
dropdowns currently used on Add Book and Edit Book.

### Desired behavior

-   On mobile, prefer native platform selection UI for **single-select**
    fields.
-   Desktop behavior can remain unchanged.
-   Audit Add Book and Edit Book selectors rather than fixing only one
    field.

### Acceptable blocker

If a field genuinely requires **multiple selections** and native iOS
controls cannot provide an adequate multi-select experience, retain the
custom website selector for that field.

Do not reduce functionality merely to obtain the native appearance.

------------------------------------------------------------------------

# Scan ISBN / Camera Scanner

## P1 --- Make mobile scanning a full-screen task state

On mobile, the current Scan ISBN camera viewer is wider/larger than the
phone viewport, forcing horizontal scrolling or zooming.

Rather than merely resizing the embedded scanner, change the interaction
model.

### Desired behavior

When Scan ISBN is activated on mobile:

-   The scanner **replaces the normal page view** for the duration of
    scanning.
-   The camera/viewfinder fits entirely within the phone viewport.
-   No horizontal scrolling or zooming is required.
-   The rest of the site's page content should not remain visible around
    the scanner.
-   Keep a clearly visible, persistent **Cancel** action.
-   After detecting a valid barcode, automatically close the scanner and
    return to the originating page/workflow with the ISBN populated or
    processed.
-   Cancel returns to the originating page/workflow without applying a
    scan.

Treat camera scanning as a temporary full-screen task state rather than
an inline page component.

This interaction should become the reusable mobile scanning pattern for
other scanning workflows as they are added.

------------------------------------------------------------------------

# Site-Wide Mobile Forms

## P2 --- Numeric fields must open the numeric keypad

Any mobile textbox whose valid input is numeric should summon the
appropriate numeric keypad instead of the full keyboard.

### Desired behavior

Perform a site-wide audit of numeric inputs, including fields such as:

-   Page counts
-   Publication years
-   Ratings where numeric entry is used
-   Purchase prices
-   Quantities/counts
-   Other numeric-only metadata

Use the appropriate HTML input/input-mode behavior for the data. Do
**not** blindly convert every numeric-looking field to `type="number"`
if doing so would create validation or formatting problems.

Desktop behavior and existing validation should remain intact.

### UX rule

On mobile, the keyboard presented to the user should match the data the
field expects.

------------------------------------------------------------------------

# Cross-Page Consistency / Implementation Notes

Several of today's findings are instances of an established frontend
pattern not being carried through to a parallel surface. Where
practical, fix these through **shared presentation or interaction
primitives** rather than page-specific duplication.

Especially review shared behavior between:

-   Collections and Wishlists
-   Collection/Wishlist folder styling
-   Collection/Wishlist mobile action layouts
-   Collection/Wishlist membership editing
-   Mobile select controls
-   Carousel control boundaries/scroll-state handling

The goal is to prevent intentionally parallel UI surfaces from drifting
again.

------------------------------------------------------------------------

# Suggested Implementation Order

## P1 --- Actual friction / interaction bugs

1.  Books category multi-select chooser intermittently disappearing.
2.  Mobile Scan ISBN full-screen scanner behavior and viewport sizing.
3.  Wishlist removal without acquisition.
4.  Wishlist editing and Collection/Wishlist membership-description
    editing.
5.  New Additions carousel: remove misleading card numbers and make
    actual scroll position authoritative.

## P2 --- Page and mobile usability improvements

1.  Remove Due Date UI everywhere.
2.  Add publication-date ascending as the automatic Books secondary
    sort.
3.  Fix mobile Collection/Wishlist action placement.
4.  Use native mobile selectors for eligible Add/Edit Book fields.
5.  Audit numeric fields for numeric mobile keypads.

## P3 --- Visual redesign / polish

1.  Prevent Staff Picks background cards from overlapping controls.
2.  Align drawer-nav notecards instead of staggering them.
3.  Restore Collection folder trapezoid/tab styling.
4.  Restyle Loans page dates as physical date stamps.

------------------------------------------------------------------------

# Acceptance Summary

This pass should be considered successful when:

-   Multi-select filtering cannot be interrupted by its own result
    refresh.
-   Wishlist/Collection contextual metadata that can be entered can also
    be edited later.
-   Wishlist entries can be removed without being acquired.
-   Mobile scanning occupies a clean, usable phone-sized task view.
-   Mobile forms use platform-appropriate keyboards/selectors wherever
    functionality permits.
-   Collections and Wishlists behave and lay out consistently on mobile.
-   New Additions navigation reflects real scroll boundaries instead of
    artificial card positions.
-   Decorative carousel/notecard styling never interferes with controls.
-   Due dates no longer appear in a system that does not use them.
-   Loan dates reinforce the physical-library visual language.
-   Books naturally receive publication-date ordering beneath the user's
    primary sort.

## Overall assessment from today's use

The important context for this list is that **stability appears
substantially improved**. The previous crashing issues were not observed
today, and the recent Bulk Add changes tested much better in real use.

This is therefore primarily a **friction, parity, mobile-UX, and
visual-polish pass**. The remaining problems are of a different order
from the stability/workflow issues being addressed over the previous two
days.
