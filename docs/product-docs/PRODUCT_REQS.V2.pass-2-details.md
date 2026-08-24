# Library V2 — UI Design & Feature Brief (Pass-2 Details, Remaining)

**Purpose:** Capture remaining V2 design direction after the shipped catalog, Home discovery core, Collections,
Wishlists, Dashboard summary, circulation, and reading surfaces. Companion detail brief to the pass-1 remaining doc.

**Status:** Design direction / ticket-planning document for unfinished V2 work

**Already shipped (removed from this brief):** discovery Home core (New Additions, Staff Picks via named Collections,
rotating quotes), Browse / Shelves / Collections / Wishlists, Book Details (data-oriented record), reader notes and
ratings, loan history on `/loans`, Dashboard summary and category breakdowns, soft delete/restore, covers, and the
current drawer navigation.

## Response from Senior Engineer (still open for remaining work)

Summarized Notes:
* For each remaining page or section, specify how features/data will be displayed and how the user will interact.
* Prefer finishing current tickets, then revisiting this document.

Detailed Notes (unresolved):
* Home and Discover surfaces still risk packing too many features onto a mobile viewport. Plan layout density before
  adding New Releases, Featured Exhibition, Current Loans, Book of the Day, Surprise Me, weather recommendations, or
  statistics on Home.
* Tracking physical shelf capacity in inches seems unlikely. Confirm whether capacity meters remain desired or should
  drop from V2.
* Book-metaphor charts (spines as bars, etc.) are an odd priority if they hurt readability. Keep charts useful first.
* How does a "neglected" book differ from one that has not been read recently? As defined today, most unread books
  meet the criteria. Do you want `last_discussed_date` (or similar), or a narrower rule set?
* Weather-driven author quotes and weather-based title recommendations are separate features. Keep them separate.
* Is the Library Journal a manual log, or an automated summary of events created through this tool?
* "On This Day" is not placed on any page yet. Where should it live?
* Seasonal themes and time-of-day behaviors are UI-only; decide where they appear.
* Decorative environmental elements (plants, desk, lamp, signage) need explicit page placement so they do not become
  accidental navigation.

---

# 1. V2 Vision (remaining priorities)

V2 should turn existing library data into a polished, personal web interface. Much of the catalog and circulation
baseline already ships. Remaining V2 work should prioritize:

* Deeper discovery (serendipity, forgotten books, new releases, book of the day)
* Richer statistics and visualization beyond the current Dashboard summary
* Wishlist/acquisition planning polish only if product asks beyond the shipped Wishlists surface
* Light environmental personality (seasonal themes, weather awareness, decorative library atmosphere)
* Library Journal and "On This Day" historical personality

V2 should **not** attempt to build a fully simulated or spatial library. That is reserved for V3.

The core principle remains:

> **V2 is the library's digital catalog made beautiful.**

---

# 2. V2 vs. V3 Scope Boundary

> **V2 makes the data beautiful.**
>
> **V3 makes the library itself a place.**

### Remaining V2 candidates

* New releases (publication-date based, in-collection)
* Stronger exhibition / featured-collection presentation on Home (beyond Staff Picks)
* Recommendations and Surprise Me / serendipity
* Forgotten / neglected books
* Weather-based recommendations
* Book of the Day
* Library Journal
* "On This Day"
* Seasonal themes
* Weather / time-of-day awareness
* Decorative library environment
* Empty-state personality copy
* Deeper Dashboard visualizations (time series, shelf capacity if retained, book-metaphor charts where readable)
* Richer shelf browsing (capacity / read-unread by shelf) if retained after capacity decision

### V3

* Fully spatial library environment
* Interactive rooms
* World → Tulsa → Library → Shelf → Book map
* Physically navigable shelves
* Books physically moving between shelves
* Interactive librarian's desk
* Living environmental states
* Ambient sound
* Environmental storytelling / "library phenomena"
* Fully simulated physical collection
* Walking/wandering through the library

V2 should leave architectural room for these concepts but should not depend on them.

---

# 3. Design Philosophy

## 3.1 The UI should feel like a library

The interface should not simply contain photographs of a library.

Instead, the **visual language of the UI should evoke a library** through:

* Typography
* Paper/card metaphors
* Shelf labels
* Book-spine imagery
* Subtle textures
* Plants
* Desk elements
* Catalog-card styling
* Library signage
* Shadows and depth
* Seasonal/environmental accents

The goal is:

> **Don't make the UI look like a library. Make the UI behave like one.**

See also `docs/product-docs/UI_DESIGN_NOTES.MD` for aesthetic direction (Nabokov office, jewel tones, card-catalog
metaphors).

---

# 4. Library Home (remaining sections)

Home already ships New Additions, Staff Picks, featured category drawers, and a rotating quote. Remaining potential
sections:

* New Releases
* Current Reading / Current Loans
* Featured Exhibition (editorial presentation beyond Staff Picks)
* Weather-based recommendation
* Book of the Day
* Random / Surprise Me
* Library statistics summary (if Home should surface Dashboard signals)

Exact layout must fit mobile; do not add all of these without a density plan.

---

# 5. Dashboard (remaining visualizations)

Summary metrics and category breakdowns already ship. Remaining potential work:

## Additional collection metrics

* Pages read
* Books acquired this year
* Books read this year
* Richer "recently acquired" presentation if product wants more than `recently_added` / Home New Additions

## Shelf statistics

Visualize (pending capacity decision):

* Books by shelf (counts exist via breakdowns; Shelves page deep-links today)
* Shelf capacity
* Percentage of shelf capacity used
* Read/unread by shelf

Example concept:

```text
PHILOSOPHY

██████████████████░░░░

86 / 100 books
86% capacity
```

## Reading statistics

Potential visualizations:

* Books read over time
* Pages read over time
* Books read by shelf
* Books read by category

## Visual style

Where appropriate, charts may use library/book metaphors (stacks, spines, shelf meters) **only when readability
stays first**. Charts should remain useful rather than decorative at the expense of clarity.

---

# 6. New Releases

Create a **New Releases** section based initially on books already present in the collection.

For V2, "New Releases" means books with recent publication dates within the collection.

This should **not** initially require external book APIs or internet-based release tracking.

Future versions may incorporate external book data.

---

# 7. Browse by Shelf (remaining depth)

Basic shelf catalog, counts, and `/books?shelf_name=` deep links already ship. Remaining V2 depth (if retained):

* Capacity
* Percentage full
* Read/unread information on the shelf surface
* Optional in-shelf book grid (data-driven, not spatial)

Example:

```text
SHELF 04 — PHILOSOPHY

86 books
73% capacity

[Book] [Book] [Book] [Book]
...
```

Do not attempt to render a fully interactive physical shelf in V2.

---

# 8. Surprise Me / Serendipity

Add a simple discovery mechanism that allows the user to randomly select books from the collection.

Potential options:

* Random book
* Random unread book
* Random read book
* Random book from a shelf
* Random book from a category
* Random book not read recently
* Random neglected book

The implementation should primarily be query/filter logic.

A more elaborate physical "pull a book from the shelf" animation can be deferred.

---

# 9. Forgotten / Neglected Books

Create a way to surface books that have received little attention.

Potential categories:

* Never read
* Longest since last read
* Never reviewed
* Never rated
* Never loaned
* Oldest unread acquisitions

Possible presentation:

> ## The Forgotten Shelf
>
> These books have been sitting quietly for a while.

Resolve the senior-engineer definition question before ticketing (narrow rules vs new metadata).

---

# 10. Weather-Based Recommendations

V2 may incorporate the current weather into recommendations.

The simplest implementation should use deterministic rules rather than AI.

Examples:

### Rain

Recommend cozy fiction, horror, mystery, or atmospheric books.

### Snow

Recommend classics, fantasy, or long novels.

### Sunny weather

Recommend adventure, travel, or outdoor reading.

Potential presentation:

> A rainy evening in Tulsa
>
> We think you should read...

This feature should remain lightweight. Personality, not a complex recommendation engine.

Keep this separate from weather-driven quote selection (`PRODUCT_REQS.V2.quote-bucket.md`).

---

# 11. Book of the Day

Create a daily featured book.

Potential information:

* Title
* Author
* Cover
* Rating
* Reading status
* Short reason for selection

Selection could initially be deterministic or random.

---

# 12. Library Journal

Create a chronological history of significant library events.

Potential events:

* Book acquired
* Book read
* Book checked out
* Book returned
* Book restored
* Exhibition / collection opened
* Book added to Staff Picks
* Wishlist item acquired

Example:

```text
AUGUST 8, 2026

Added four books to the collection.

AUGUST 6, 2026

The Left Hand of Darkness was returned.

AUGUST 3, 2026

Finished The Master and Margarita.
```

Decide manual vs automated (automated is largely a chronological view of existing event/date data).

---

# 13. "On This Day"

Use historical library dates to surface past activity.

Examples:

> **One year ago today...**
>
> You acquired *The Brothers Karamazov.*

or:

> **Three years ago today...**
>
> You finished your 12th book of the year.

Decide host page (Home, Journal, Dashboard, or shared component) before implementation.

---

# 14. Seasonal Themes

The application should support seasonal visual themes without changing its core information architecture.

Potential themes:

* Spring
* Summer
* Autumn
* Winter

Potential effects:

* Background treatment
* Typography/accent changes
* Decorative elements
* Falling leaves
* Snow
* Seasonal illustrations
* Seasonal recommendations

The core UI should remain stable. The theme should change atmosphere, not functionality.

---

# 15. Environmental / Decorative Design

V2 should introduce a sense of place through decorative UI elements rather than photographs.

Potential visual motifs:

* Plants
* Desk
* Lamp
* Paper
* Catalog cards
* Book spines
* Shelf labels
* Library signage
* Window
* Clock
* Subtle architectural framing

These should initially be primarily decorative. They should not become required navigation mechanisms.

---

# 16. Time and Weather Awareness

V2 can have light environmental awareness.

Potential examples:

* Morning/evening greeting
* Current time
* Current weather
* Seasonal decoration
* Weather-based recommendation

The environment should feel slightly different depending on when the user visits.

A fully reactive environment belongs in V3.

---

# 17. Empty States (personality copy)

Empty states exist functionally today. Remaining work is library-specific language rather than generic messages.

Examples:

### No books found

> **We searched the stacks. Nothing turned up.**

### No checked-out books

> **Everything is home.**

### No reading history

> **The journal is waiting for its first entry.**

### Empty shelf

> **Even libraries need empty spaces.**

---

# 18. Visual Language

The interface should combine:

* Library/institutional typography
* Paper
* Ink
* Wood
* Plants
* Glass
* Brass
* Book-spine imagery
* Catalog-card motifs
* Subtle depth/shadows

Avoid making the application overly skeuomorphic.

The goal is **inspired by physical libraries**, not pretending to literally be one.

---

# 19. Suggested remaining navigation / Discover surface

Current primary navigation already covers Dashboard, Collection (Browse, Manage, Collections, Wishlists), and
Circulation (Loans). Remaining Discover-oriented IA (illustrative):

```text
Discover
  ├── New Releases
  ├── Forgotten Books
  └── Surprise Me

Library Journal
On This Day (host TBD)
```

Featured Exhibition / Book of the Day / weather personality may live on Home rather than as top-level nav.

---

# 20. Data-First Principle (remaining features)

| UI Feature              | Existing/Primary Data              |
| ----------------------- | ---------------------------------- |
| New Releases            | Publication date                   |
| Capacity                | Shelf + capacity (if retained)     |
| Pages read              | Page count + reading history       |
| Library Journal         | Existing event/date data           |
| On This Day             | Historical dates                   |
| Forgotten Books         | Existing reading metadata          |
| Weather recommendations | Existing categories/tags + weather |
| Book of the Day         | Existing collection                |
| Seasonal themes         | UI-only                            |

If a feature requires substantial new external data infrastructure, review it for V3 scope.

---

# 21. Remaining V2 Ticketing Guidance

Likely remaining ticket areas:

1. Dashboard visualizations beyond current summary / category breakdowns
2. Shelf browsing depth (capacity / read-unread) if retained
3. New Releases
4. Surprise Me
5. Forgotten Books
6. Weather recommendations
7. Book of the Day
8. Library Journal
9. On This Day
10. Seasonal themes
11. Environmental / decorative UI
12. Empty-state personality copy
13. Home density / remaining Home sections
14. Responsive polish for new Discover surfaces
15. Accessibility/polish on new surfaces

Ticket boundaries should follow the existing feature-module architecture under `src/features/*/routes/`.

---

# 22. Explicit V2 Non-Goals

The following should **not** be required for V2 acceptance:

* Interactive world map
* Tulsa → library geographic navigation
* Interactive floor plan
* Fully spatial library
* Clickable physical shelves
* Animated books moving between shelves
* Interactive librarian's desk
* Ambient audio
* Dynamic environmental simulation
* Complex weather animation
* Persistent virtual library state
* Fully simulated physical book collection
* External new-release aggregation
* Complex AI recommendation engine

These can be recorded as V3 candidates.

---

# 23. V3 Concepts to Preserve for Future Design

V2 should avoid architectural choices that make the following impossible later.

### Spatial Library

World → Oklahoma → Tulsa → Library → Room → Shelf → Book

### Interactive Environment

* Desk
* Bookshelves
* Window
* Chair
* Plants
* Catalog
* Displays

### Physical Collection

* Books appear when acquired
* Books disappear when checked out
* Books move when reshelved
* Shelf capacity changes visually

### Living Environment

* Time of day
* Weather
* Seasons
* Lighting
* Ambient sound

### Environmental Storytelling

* Notes appearing
* Objects moving
* Forgotten books resurfacing
* Changing desk contents
* Other subtle library "phenomena"

The V2 implementation should not depend on these features, but its data model and component architecture should avoid
unnecessarily preventing them later.

---

# 24. Remaining Success Criteria

V2 remaining work should succeed if a user can:

1. Discover books they had forgotten about.
2. Understand which shelves/categories are full or underused (if capacity work is retained).
3. Discover curated exhibitions / featured collections beyond Staff Picks when product asks for that presentation.
4. Get useful recommendations from the existing collection (weather, Surprise Me, Book of the Day).
5. Feel that the interface represents **this particular library**, rather than a generic book-management application
   (seasonal/environmental personality, empty-state voice, decorative atmosphere).
6. Enjoy spending time browsing the collection even when they aren't looking for a specific book.

Already largely met by the shipped app (kept here only as context, not open work): understand library state, browse
and find books, see recent additions, see reading/circulation history, record notes/ratings, Staff Picks, and
wishlist maintenance.

The final goal remains:

> **"A digital library built from the information that used to live in a spreadsheet."**

V2 should finish collection personality and discovery. V3 can then turn that foundation into a place.
