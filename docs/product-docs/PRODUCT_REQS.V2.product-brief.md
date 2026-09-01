# Library V2 --- UI Design & Feature Brief (Remaining)

**Purpose:** Capture remaining V2 design direction after the shipped
catalog, Home discovery core, Collections, Wishlists, Dashboard summary,
circulation, and reading surfaces.

**Status:** Design direction / ticket-planning document for unfinished
V2 work.

**Already shipped (removed from this brief):** discovery Home core (New
Additions, Staff Picks via named Collections, rotating quotes), Browse /
Shelves / Collections / Wishlists, Book Details (data-oriented record),
reader notes and ratings, loan history on `/loans`, Dashboard summary
and category breakdowns, soft delete/restore, covers, and the current
drawer navigation.

------------------------------------------------------------------------

# 1. V2 Vision

V2 should turn existing library data into a more polished, personal web
interface without trying to simulate a physical library.

Remaining V2 priorities are:

-   **Richer statistics and visualization** beyond the current Dashboard
    summary.
-   **New Releases** using publication dates already stored in the
    collection.
-   **Current Reading on Home**, showing books currently being read by
    the household.
-   **Light environmental personality**, especially seasonal/theme-aware
    presentation, where it can be added without meaningful performance
    drag.
-   **Optional lightweight serendipity**, such as Surprise Me, if it
    fits cleanly after the V2 MVP work is complete.
-   Continued visual refinement that takes the successful V1 library
    language further without making the application cumbersome.

The core principle remains:

> **V2 is the library's digital catalog made beautiful.**

V2 does **not** need historical personality features that depend on
years of accumulated library data, nor does it need a simulated/spatial
library environment.

------------------------------------------------------------------------

# 2. V2 vs. V3 Scope Boundary

> **V2 makes the data beautiful.**
>
> **V3 makes the library itself a place and uses accumulated history to
> make it feel alive.**

## V2 MVP

-   New Releases based on in-collection publication dates.
-   Current Reading on Home.
-   Deeper Dashboard statistics and visualizations.
-   Light seasonal/theme-aware visual personality where practical.
-   Continued visual polish and environmental decoration that does not
    create performance or navigation drag.
-   Empty-state personality copy where existing surfaces need it.

## V2 optional / stretch

-   Surprise Me / simple serendipity.
-   Additional decorative library atmosphere beyond the V2 MVP,
    especially where it can become part of the skin/theme system.

## V3

-   Weather-based book recommendations.
-   Book of the Day.
-   Library Journal.
-   On This Day.
-   Time/weather-aware living environmental behavior beyond lightweight
    V2 theming.
-   Fully spatial library environment.
-   Interactive rooms.
-   World → Tulsa → Library → Shelf → Book map.
-   Physically navigable shelves.
-   Books physically moving between shelves.
-   Interactive librarian's desk.
-   Living environmental states.
-   Ambient sound.
-   Environmental storytelling / library phenomena.
-   Fully simulated physical collection.
-   Walking/wandering through the library.

V2 should leave architectural room for these concepts but should not
depend on them.

------------------------------------------------------------------------

# 3. Design Philosophy

## 3.1 The UI should feel like a library

The interface should not simply contain photographs of a library.

Instead, the **visual language of the UI should evoke a library**
through:

-   Typography
-   Paper/card metaphors
-   Shelf labels
-   Book-spine imagery
-   Subtle textures
-   Plants
-   Desk elements
-   Catalog-card styling
-   Library signage
-   Shadows and depth
-   Restrained seasonal/environmental accents

The goal is:

> **Don't make the UI look like a library. Make the UI behave like
> one.**

See also `docs/product-docs/UI_DESIGN_NOTES.MD` for aesthetic direction
(Nabokov office, jewel tones, card-catalog metaphors).

V1 established this direction successfully. V2 should take it further
without causing meaningful drag on the system.

------------------------------------------------------------------------

# 4. Library Home

Home already ships New Additions, Staff Picks, featured category
drawers, and a rotating quote.

Remaining V2 additions:

-   **New Releases**
-   **Current Reading** --- show books that the household is currently
    reading.
-   **Surprise Me** --- optional/stretch.

Do not add every possible discovery feature to Home. Exact layout must
remain comfortable on mobile.

Historical and ambient features such as On This Day, Book of the Day,
and weather recommendations are V3 rather than additional V2 Home
modules.

------------------------------------------------------------------------

# 5. Dashboard

Summary metrics and category breakdowns already ship. Dashboard
expansion is a **V2 MVP**.

## 5.1 Additional collection metrics

-   Pages owned.
-   **Pages turned** --- preferred display name for pages read.
-   Books acquired this year.
-   Books read this year.

## 5.2 Reading statistics

Potential visualizations:

-   Books read over time.
-   Pages turned over time.
-   Books read by shelf.
-   Books read by category.

## 5.3 Visual style

Where appropriate, charts may use library/book metaphors (stacks,
spines, shelf-like treatments) **only when readability stays first**.
Conventional charts are preferable whenever the metaphor makes the data
harder to read.

Dashboard is primarily a richer desktop analytics surface; mobile still
needs a deliberate usable presentation.

------------------------------------------------------------------------

# 6. New Releases

Create a **New Releases** section based on books already present in the
collection.

For V2, "New Releases" means books with recent publication dates within
the collection.

This is a **V2 MVP** feature and should not initially require external
book APIs or internet-based release tracking.

Future versions may incorporate external book data if there is a clear
product need.

------------------------------------------------------------------------

# 7. Surprise Me / Serendipity

This is a **V2 stretch feature**, not required for the V2 MVP.

Provide a simple discovery mechanism that can randomly select from the
existing collection.

Potential options:

-   Random book.
-   Random unread book.
-   Random read book.
-   Random book from a shelf.
-   Random book from a category.

Implementation should primarily be query/filter logic. A physical "pull
a book from the shelf" animation belongs with the later spatial-library
vision.

------------------------------------------------------------------------

# 8. Seasonal Themes

Seasonal/theme-aware personality is part of the **V2 MVP direction**,
but it should remain lightweight.

Potential themes:

-   Spring
-   Summer
-   Autumn
-   Winter

Potential effects:

-   Background treatment.
-   Typography/accent changes.
-   Decorative elements.
-   Small seasonal illustrations or effects.

The core UI should remain stable. Themes change atmosphere, not
functionality.

More deeply reactive time/weather environmental behavior belongs in V3.

------------------------------------------------------------------------

# 9. Environmental / Decorative Design

V2 may introduce a stronger sense of place through decorative UI
elements rather than photographs.

Potential visual motifs:

-   Plants
-   Desk
-   Lamp
-   Paper
-   Catalog cards
-   Book spines
-   Shelf labels
-   Library signage
-   Window
-   Clock
-   Subtle architectural framing

These should be primarily decorative and must not become required
navigation mechanisms.

This work can overlap with the skin/theme system and is not required to
become a large standalone V2 feature. It should be pursued where it
strengthens the interface without meaningful asset or performance drag.

------------------------------------------------------------------------

# 10. Empty States

Empty states exist functionally today. V2 may give them library-specific
language rather than generic messages.

Examples:

### No books found

> **We searched the stacks. Nothing turned up.**

### No checked-out books

> **Everything is home.**

### No reading history

> **The journal is waiting for its first entry.**

### Empty shelf

> **Even libraries need empty spaces.**

------------------------------------------------------------------------

# 11. Visual Language

The interface should combine:

-   Library/institutional typography
-   Paper
-   Ink
-   Wood
-   Plants
-   Glass
-   Brass
-   Book-spine imagery
-   Catalog-card motifs
-   Subtle depth/shadows

Avoid making the application overly skeuomorphic.

The goal is **inspired by physical libraries**, not pretending to
literally be one.

------------------------------------------------------------------------

# 12. V2 Data-First Principle

  V2 Feature                 Existing/Primary Data
  -------------------------- ----------------------------------
  New Releases               Publication date
  Current Reading            Reading status
  Pages turned               Page count + reading history
  Dashboard reading trends   Existing reading/completion data
  Seasonal themes            UI-only
  Surprise Me                Existing collection/filter data

V2 should favor features that can be built from data already owned by
the application. Features requiring substantial new historical or
environmental infrastructure should be evaluated as V3 work.

------------------------------------------------------------------------

# 13. Remaining V2 Ticketing Guidance

Likely remaining V2 ticket areas:

1.  Dashboard visualizations and additional collection/reading metrics.
2.  New Releases.
3.  Current Reading Home module.
4.  Seasonal/theme-aware visual treatment.
5.  Environmental/decorative UI additions that fit the theme/skin system
    without performance drag.
6.  Empty-state personality copy.
7.  Surprise Me / serendipity as a stretch ticket.
8.  Home density and responsive behavior for the new V2 modules.
9.  Accessibility and polish for all new surfaces.

Ticket boundaries should follow the existing feature-module architecture
under `src/features/*/routes/`.

------------------------------------------------------------------------

# 14. Explicit V2 Non-Goals

The following should **not** be required for V2 acceptance:

-   Library Journal.
-   On This Day.
-   Weather-based book recommendations.
-   Book of the Day.
-   Fully reactive time/weather environment.
-   Interactive world map.
-   Tulsa → library geographic navigation.
-   Interactive floor plan.
-   Fully spatial library.
-   Clickable physical shelves.
-   Animated books moving between shelves.
-   Interactive librarian's desk.
-   Ambient audio.
-   Dynamic environmental simulation.
-   Persistent virtual library state.
-   Fully simulated physical book collection.
-   External new-release aggregation.
-   Complex AI recommendation engine.

These belong to V3 or later.

------------------------------------------------------------------------

# 15. V3 Concepts to Preserve for Future Design

V3 can use the deeper history accumulated through normal use of V1/V2
and turn the library into a more living place.

## 15.1 Historical personality

-   Library Journal.
-   On This Day.
-   Historical acquisition, reading, loan, and collection events.
-   Book of the Day or similar resurfacing features when enough history
    exists.

## 15.2 Weather and living environment

-   Weather-based book recommendations.
-   Weather-aware presentation.
-   Time-of-day behavior.
-   More reactive seasons, lighting, and ambient environmental states.

## 15.3 Spatial Library

World → Oklahoma → Tulsa → Library → Room → Shelf → Book

## 15.4 Interactive Environment

-   Desk
-   Bookshelves
-   Window
-   Chair
-   Plants
-   Catalog
-   Displays

## 15.5 Physical Collection

-   Books appear when acquired.
-   Books disappear when checked out.
-   Books move when reshelved.
-   Shelf capacity changes visually.

## 15.6 Living Environment

-   Time of day.
-   Weather.
-   Seasons.
-   Lighting.
-   Ambient sound.

## 15.7 Environmental Storytelling

-   Notes appearing.
-   Objects moving.
-   Forgotten books resurfacing.
-   Changing desk contents.
-   Other subtle library "phenomena."

V2 should avoid architectural choices that unnecessarily prevent these
later ideas, but V2 implementation should not depend on them.

------------------------------------------------------------------------

# 16. V2 Success Criteria

V2 remaining work succeeds if:

1.  The Dashboard turns existing collection and reading data into
    richer, useful statistics.
2.  The Home page can surface New Releases and books currently being
    read without becoming overcrowded on mobile.
3.  The interface feels more distinctly like this library through
    restrained visual/theme personality.
4.  New Releases work entirely from existing collection metadata.
5.  Optional serendipity can help users browse when they do not have a
    specific title in mind.
6.  New visual treatments preserve performance, accessibility, and the
    clarity of the V1 information architecture.

Already largely met by the shipped app: understand library state, browse
and find books, see recent additions, see reading/circulation history,
record notes/ratings, maintain Staff Picks/Collections, and maintain
wishlists.

The final goal remains:

> **"A digital library built from the information that used to live in a
> spreadsheet."**

V2 should finish the catalog's analytics, discovery, and visual
personality. V3 can use the accumulated history and that foundation to
make the library itself feel like a living place.
