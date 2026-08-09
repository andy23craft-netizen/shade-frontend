# Library V2 — UI Design & Feature Brief

**Purpose:** Define the desired direction and scope for the V2 user interface so it can be broken into implementation tickets.

**Status:** Design direction / ticket-planning document

---

# 1. V2 Vision

V2 should turn the existing library data into a polished, intuitive, and personal web interface.

The current system already contains the underlying library information: books, shelves, categories, reading status, ratings, notes, acquisitions, and loans. V2 should make that information significantly easier and more enjoyable to browse, understand, and interact with.

The core principle is:

> **V2 is the library's digital catalog made beautiful.**

It should feel like a personal library rather than a generic CRUD application, while remaining fundamentally grounded in the existing data model.

V2 should prioritize:

* Collection browsing
* Book discovery
* Reading information
* Circulation
* Shelf organization
* Statistics and visualization
* Personal recommendations
* Wishlist/acquisition planning
* Light environmental personality

V2 should **not** attempt to build a fully simulated or spatial library.

That is reserved for V3.

---

# 2. V2 vs. V3 Scope Boundary

The key distinction is:

> **V2 makes the data beautiful.**
>
> **V3 makes the library itself a place.**

V2 can use visual metaphors, illustrations, seasonal themes, decorative elements, and atmospheric design.

However, V2 should remain primarily a conventional web application underneath.

### V2

* Dashboard
* Book browsing
* Shelf browsing
* Book detail pages
* Reading history
* Loan history
* Ratings and notes
* New additions
* New releases
* Staff picks
* Exhibitions/curated collections
* Wishlist
* Recommendations
* Statistics
* Seasonal themes
* Weather-based recommendations
* Random/serendipitous book selection
* Library journal
* Decorative library environment

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

---

# 4. Primary V2 Areas

V2 should conceptually consist of several major areas.

## 4.1 Library Home

The home page should act as the main entry point into the collection.

Potential sections:

* New Additions
* New Releases
* Staff Picks
* Current Reading / Current Loans
* Featured Exhibition
* Weather-based recommendation
* Book of the Day
* Random/Surprise Me
* Library statistics
* Rotating author quote

The exact layout should be determined during ticket planning.

---

# 5. Dashboard

The dashboard is a major V2 feature.

It should transform existing collection data into useful visualizations.

## Collection statistics

Potential metrics:

* Total books
* Books read
* Books unread
* Books currently checked out
* Recently acquired books
* Pages read
* Books acquired this year
* Books read this year

## Shelf statistics

Visualize:

* Books by shelf
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

## Category statistics

Visualize:

* Books by category
* Read by category
* Unread by category

## Reading statistics

Potential visualizations:

* Books read over time
* Pages read over time
* Books read by shelf
* Books read by category

## Visual style

Where appropriate, charts should use library/book metaphors.

For example:

* Bars resembling stacks of books
* Book spines representing counts
* Shelf-like capacity meters

Charts should remain readable and useful rather than becoming decorative at the expense of clarity.

---

# 6. Book Detail

Every book should have a richer presentation than a simple database record.

Potential information:

* Cover
* Title
* Author
* Publication information
* ISBN
* Shelf
* Category
* Reading status
* Loan status
* Borrower
* Date acquired
* Date read
* Rating
* Reader notes
* Review
* Loan history
* Reading history
* Acquisition information

The page should make the book feel like an **artifact in the collection**.

Potential visual concept:

> **Library Record No. 00427**

---

# 7. Digital Library Record / Bookplate

Each book should have a persistent library identity.

Potential elements:

* Library ID
* Acquisition information
* Shelf location
* Reading history
* Circulation history
* Reader notes
* Rating
* Personal recommendation status

The initial V2 implementation can remain data-oriented.

A more elaborate physical/digital bookplate or animated checkout card can be deferred to V3.

---

# 8. Reader Notes and Reviews

Reader notes should be treated as first-class information rather than hidden metadata.

Potential functionality:

* Add/edit reader notes
* Display notes on book detail
* Display personal rating
* Display review
* Display read date
* Display reading history

If the data model eventually supports multiple readers:

* Personal rating
* Aggregate library rating
* Individual reviews

The V2 design should avoid prematurely assuming that all reviews are public or anonymous.

---

# 9. New Additions

Create a **New Additions** section/page.

Purpose:

> Show what has recently entered the collection.

Potential presentation:

* Horizontal carousel
* Book cards
* Cover + title + author
* Date acquired
* Shelf/category
* Link to book detail

Primary data source should be existing acquisition information.

---

# 10. New Releases

Create a **New Releases** section based initially on books already present in the collection.

For V2, "New Releases" means books with recent publication dates within the collection.

This should **not** initially require external book APIs or internet-based release tracking.

Future versions may incorporate external book data.

---

# 11. Staff Picks

Create a curated recommendation area.

A book can be marked as a Staff Pick.

Potential presentation:

> ## Staff Picks
>
> Books the librarian would recommend to almost anyone.

Potential metadata:

* Book
* Short recommendation
* Rating
* Category
* Optional reason for recommendation

This feature should be simple enough to maintain manually.

---

# 12. Exhibitions

Exhibitions should represent temporary or permanent curated collections.

An exhibition could contain:

* Title
* Description
* Curator's note
* Selected books
* Optional start date
* Optional end date
* Optional visual treatment

Examples:

> **THE END OF THE WORLD**
>
> Books about civilization, collapse, survival, and what comes afterward.

or:

> **BOOKS THAT CHANGED MY MIND**

or:

> **THE 1930s**

An exhibition is essentially a curated collection with a stronger editorial presentation.

The initial implementation should not require a complex content-management system.

---

# 13. Wishlist / Donations

Create a dedicated area for books the library would like to acquire.

Potential statuses:

* Suggested
* Wishlist
* High priority
* Ordered
* Acquired

Potential fields:

* Title
* Author
* ISBN
* Notes
* Priority
* Status

The V2 version should remain simple.

Potential future versions could add:

* Purchase links
* External book APIs
* Donation tracking
* Acquisition workflow

---

# 14. Browse by Shelf

Users should be able to browse the collection according to its physical shelf organization.

Each shelf should display:

* Shelf name/label
* Number of books
* Capacity
* Percentage full
* Books currently on shelf
* Read/unread information

The initial V2 implementation should be **data-driven rather than spatial**.

Example:

```text
SHELF 04 — PHILOSOPHY

86 books
73% capacity

[Book] [Book] [Book] [Book]
[Book] [Book] [Book] [Book]
...
```

Do not attempt to render a fully interactive physical shelf in V2.

---

# 15. Surprise Me / Serendipity

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

# 16. Forgotten / Neglected Books

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

This turns existing metadata into a discovery feature.

---

# 17. Weather-Based Recommendations

V2 may incorporate the current weather into recommendations.

The simplest implementation should use deterministic rules rather than AI.

Examples:

### Rain

Recommend:

* Cozy fiction
* Horror
* Mystery
* Atmospheric books

### Snow

Recommend:

* Classics
* Fantasy
* Long novels

### Sunny weather

Recommend:

* Adventure
* Travel
* Outdoor reading

Potential presentation:

> 🌧 **A rainy evening in Tulsa**
>
> We think you should read...

This feature should remain lightweight.

The goal is personality, not a complex recommendation engine.

---

# 18. Book of the Day

Create a daily featured book.

Potential information:

* Title
* Author
* Cover
* Rating
* Reading status
* Short reason for selection

Selection could initially be deterministic or random.

Future versions could use more sophisticated recommendation logic.

---

# 19. Library Journal

Create a chronological history of significant library events.

Potential events:

* Book acquired
* Book read
* Book checked out
* Book returned
* Book restored
* Exhibition opened
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

This should primarily be built from existing event/date information.

---

# 20. “On This Day”

Use historical library dates to surface past activity.

Examples:

> **One year ago today...**
>
> You acquired *The Brothers Karamazov.*

or:

> **Three years ago today...**
>
> You finished your 12th book of the year.

This is a lightweight historical feature with high personality value.

---

# 21. Seasonal Themes

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

The core UI should remain stable.

The theme should change the atmosphere, not the functionality.

---

# 22. Environmental / Decorative Design

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

These should initially be primarily decorative.

They should not become required navigation mechanisms.

---

# 23. Time and Weather Awareness

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

# 24. Author Quotes

Display rotating quotes from authors/writers.

Potential implementation:

* Curated quote collection
* Random or rotating selection
* Author attribution
* Optional quote category/theme

Quotes can appear throughout the application as small environmental elements.

They should not dominate the UI.

---

# 25. Empty States

Empty states should have library-specific language rather than generic application messages.

Examples:

### No books found

> **We searched the stacks. Nothing turned up.**

### No checked-out books

> **Everything is home.**

### No reading history

> **The journal is waiting for its first entry.**

### Empty shelf

> **Even libraries need empty spaces.**

These are small details but contribute significantly to the personality of the application.

---

# 26. Visual Language

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

# 27. Suggested V2 Navigation

The exact navigation should be determined during implementation planning, but a possible structure is:

```text
LIBRARY

Home
Collection
  ├── All Books
  ├── Shelves
  ├── Categories
  └── Staff Picks

Reading
  ├── Currently Reading
  ├── Read
  └── Reading History

Circulation
  ├── Checked Out
  └── Loan History

Discover
  ├── New Additions
  ├── New Releases
  ├── Exhibitions
  ├── Forgotten Books
  └── Surprise Me

Wishlist
Dashboard
Library Journal
```

This is illustrative rather than prescriptive.

---

# 28. Data-First Principle

Where possible, V2 should derive UI features from data the backend already maintains.

Examples:

| UI Feature              | Existing/Primary Data              |
| ----------------------- | ---------------------------------- |
| New Additions           | Acquisition date                   |
| New Releases            | Publication date                   |
| Staff Picks             | Recommendation flag/field          |
| Ratings                 | Rating                             |
| Reader Notes            | Notes                              |
| Shelf browsing          | Shelf                              |
| Capacity                | Shelf + capacity                   |
| Read statistics         | Reading status/history             |
| Pages read              | Page count + reading history       |
| Loan status             | Loans                              |
| Loan history            | Loans                              |
| Wishlist                | Wishlist records                   |
| Library Journal         | Existing event/date data           |
| On This Day             | Historical dates                   |
| Forgotten Books         | Existing reading metadata          |
| Weather recommendations | Existing categories/tags + weather |
| Book of the Day         | Existing collection                |
| Seasonal themes         | UI-only                            |

If a feature requires substantial new external data infrastructure, it should be reviewed for V3 scope.

---

# 29. V2 Ticketing Guidance

The goal of ticket decomposition should be to create independently testable pieces of functionality rather than one giant "build the UI" ticket.

Likely ticket areas include:

1. V2 UI foundation / layout
2. Book collection browsing
3. Book detail redesign
4. Shelf browsing
5. Dashboard metrics
6. Dashboard visualizations
7. Reading history
8. Reader notes and ratings
9. Staff Picks
10. New Additions
11. New Releases
12. Exhibitions
13. Wishlist
14. Surprise Me
15. Forgotten Books
16. Weather recommendations
17. Book of the Day
18. Library Journal
19. On This Day
20. Seasonal themes
21. Author quote system
22. Environmental/decorative UI
23. Empty-state copy/design
24. Responsive/mobile presentation
25. Accessibility/polish

The senior developer should determine the actual ticket boundaries based on the existing architecture.

---

# 30. Explicit V2 Non-Goals

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

# 31. V3 Concepts to Preserve for Future Design

V2 should avoid architectural choices that make the following impossible later.

Potential V3 features:

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

The V2 implementation should not depend on these features, but its data model and component architecture should avoid unnecessarily preventing them later.

---

# 32. Overall Success Criteria

V2 should succeed if a user can:

1. Quickly understand the state of the library.
2. Browse the collection more naturally than they could in the spreadsheet.
3. Find a particular book quickly.
4. Discover books they had forgotten about.
5. See what has recently entered the collection.
6. Understand which shelves/categories are full or underused.
7. See reading and circulation history.
8. Record personal notes and ratings.
9. Identify recommended/staff-pick books.
10. Maintain a wishlist.
11. Discover curated exhibitions.
12. Get useful recommendations from the existing collection.
13. Feel that the interface represents **this particular library**, rather than a generic book-management application.
14. Enjoy spending time browsing the collection even when they aren't looking for a specific book.

The final goal is not simply:

> **“A spreadsheet with a nicer interface.”**

It is:

> **“A digital library built from the information that used to live in a spreadsheet.”**

V2 should establish the collection, visual language, and personality.

V3 can then turn that foundation into a place.
