# Library V2 — UI Design & Feature Priorities

## 1. Backend Work Required

The following V2 features require new database models or meaningful backend changes.

These should be considered before frontend tickets are finalized.

### 1.1 Collections

**Purpose:** Support curated groups of books such as Exhibitions, Staff Picks, seasonal collections, or other custom groupings.

**New table: `collections`**

* `collection_id`
* `created_date`
* `name`
* `description`
* `last_updated_date`

**Book membership:**

The initial proposal used `book_ids` directly on the collection. Prefer a normalized join table if the backend conventions support it:

`collection_books`

* `collection_id`
* `book_id`
* `created_date`

This allows a book to belong to multiple collections.

**Frontend uses:**

* Discover → Collections
* Home → Featured Collection
* Book Details → Collections this book belongs to

**Examples:**

* Staff Picks
* Exhibitions
* Books That Changed My Mind
* Seasonal collections
* Thematic collections

---

### 1.2 Wishlists

A single wishlist is probably too restrictive. Support multiple named wishlists.

**New table: `wishlists`**

* `wishlist_id`
* `created_date`
* `name`
* `description`
* `last_updated_date`

**New table: `wishlist_books`**

* `wishlist_id`
* `created_date`
* `book_id`
* `priority`
* `status`
* `notes`
* `url`

Potential statuses:

* Suggested
* Wishlist
* High Priority
* Ordered
* Acquired

**Frontend uses:**

* Wishlist page
* Book Details
* Potentially Discover

Examples:

* Books to Buy
* Donations
* Complete the Collection
* Philosophy Wishlist

---

### 1.3 Quotes

If quotes are stored and associated with books, they should be represented in the backend rather than hardcoded into the frontend.

**New table: `quotes`**

* `quote_id`
* `created_date`
* `book_id`
* `quote_text`
* `weather_options`
* `last_displayed_date`

Potential weather options:

* sunny
* cloudy
* rainy
* stormy
* snowy
* hot
* cold
* humid

**Frontend uses:**

* Home
* Book Details
* Potentially Dashboard

Weather-based quote selection should remain separate from weather-based book recommendations.

---

### 1.4 Library Journal

Determine the backend representation before implementing the UI.

The journal should record meaningful library events rather than git history.

Potential events:

* Book acquired
* Book read
* Book checked out
* Book returned
* Book restored
* Collection created/updated
* Wishlist item added/acquired

The implementation should determine whether these events can be derived from existing tables or require a dedicated journal/event table.

**Frontend uses:**

* Dashboard or Home
* Dedicated Library Journal page if the resulting history warrants one

---

### 1.5 Additional Book Metadata

Review existing book fields before creating new models.

Potential fields needed for V2:

* Staff Pick / collection membership
* Reader review
* Reading date/history
* Last discussed date, only if "neglected books" remains a desired feature
* Other recommendation metadata

Do not add fields unless a specific V2 feature requires them.

---

# 2. V2 Site Structure

The frontend should be organized around a small number of primary destinations.

Recommended structure:

```text
Home
Collection
  ├── All Books
  ├── Shelves
  └── Categories

Book Details
  └── accessed from Collection / search / recommendations

Discover
  ├── New Additions
  ├── New Releases
  ├── Collections
  └── Surprise Me

Reading
  └── Reading History

Circulation
  └── Loans / Checked Out

Wishlist
  └── Named Wishlists

Dashboard

Library Journal
```

This is a starting point for ticket planning, not a requirement that every item become a separate route.

### Consolidations

**Reading**

Do not create separate "Read" and "Reading History" pages.

Use a single **Reading History** page with filters/statuses such as:

* Currently Reading
* Read
* Unread

**Circulation**

Do not create separate "Checked Out" and "Loan History" pages.

Use a single **Loans** page with:

* Currently Checked Out
* Active loans
* Historical loans

**Staff Picks**

Treat Staff Picks as a collection rather than a separate top-level data type.

---

# 3. Responsive / Mobile Requirement

Every page and feature should specify:

1. What is displayed?
2. What is interactive?
3. What happens on mobile?
4. What is hidden, collapsed, or moved at smaller widths?

The design should not assume that desktop dashboard layouts can simply be stacked vertically on mobile.

Avoid putting every feature on the Home page.

Home should contain a curated subset of the available information, with links to deeper pages.

---

# 4. Home

**Primary purpose:** Library overview and discovery.

### Recommended contents

Prioritize:

1. New Additions
2. Featured Collection
3. Weather recommendation
4. Currently Checked Out / Reading
5. Random Book / Surprise Me
6. Author quote

Lower-priority content should be accessible elsewhere rather than stacked onto the Home page.

### New Additions

**Display:**

* Horizontal book-card carousel on desktop
* Horizontally scrollable carousel on mobile
* Cover
* Title
* Author
* Acquisition date

**Interaction:**

* Select book → Book Details
* "View All" → Collection filtered by recent acquisition

### Featured Collection

**Display:**

* Collection name
* Description
* Small selection of book covers
* "View Collection"

**Interaction:**

* Select collection → Collection view

Possible collections:

* Staff Picks
* Current Exhibition
* Seasonal collection


### Author Quote

**Display:**

Small quote block.

Potential location:

* Bottom of Home
* Sidebar on desktop
* Between sections on mobile

**Interaction:**

None required.

---

# 5. Dashboard

**Primary purpose:** High-level collection analytics.

**Best fit:** Top-level Dashboard.

The dashboard should prioritize useful metrics rather than attempting to display every V2 feature.

### Collection

* Total books
* Books read
* Books unread
* Books checked out
* Recent acquisitions

### Reading

* Books read over time
* Pages read
* Read by category
* Read by shelf

### Collection composition

* Books by category
* Books by shelf

### Visualization

Use conventional charts unless a book metaphor clearly improves readability.

Possible visual treatments:

* Bar charts
* Donut/pie charts where appropriate
* Timeline charts
* Book-cover visualizations

Book-shaped bar charts should only be used if they fit the established visual design.

### Weather Quote

**Display:**

Short quote from a novel that describes the current weather 

Example:

> Snowy today
> "The snow fell quietly without, and the fire crackeld cheerfully within." -- Louisa May Alcott, Little women

**Interaction:**

* Maybe link to outside weather service, though not required


### Mobile

Dashboard cards should stack or become horizontally scrollable.

Avoid requiring a large desktop canvas.

---


# 6. Collection

**Primary purpose:** Browse and manage the library's books.

This should be the main V2 replacement for the spreadsheet.

### All Books

**Display options:**

* Grid - Covers and titles only
* List -- Cards (picture Doordash, with the cover on the side, the title across the top, and the rest of the information listed below it, like ingredients)
* Potentially compact catalog view -- ???

Each book card should display enough information to identify the book without opening it.

Potential fields:

* Cover
* Title
* Author
* Shelf
* Category
* Reading status
* Loan status
* Rating

### Filters

Potential filters:

* Author
* Category
* Shelf
* Read/unread
* Checked out/available
* Rating
* Publication year
* Acquisition date
* Collection

### Search

Search should support at minimum:

* Title
* Author
* Category
* ISBN

Potentially:

* Notes
* Shelf

### Sorting

Potential options:

* Title
* Author
* Publication date
* Acquisition date
* Rating
* Shelf

### Mobile

Prioritize:

* Search
* Filters
* Book cards

Filters can open as a drawer/modal rather than occupying permanent screen space.

---

# 7. Shelves

**Primary purpose:** Browse the physical organization of the collection.

**Best fit:** Collection → Shelves.

### Display

Each shelf should show:

* Shelf name
* Number of books
* Books currently assigned
* Optional utilization information if meaningful

Do **not** assume physical shelf capacity unless that data is actually tracked.

If capacity is not represented in the database, do not build a capacity percentage based on arbitrary book counts.

### Book display

Books can be displayed in:

* Grid
* List
* Shelf-oriented layout if useful

A physical shelf illustration is optional visual treatment, not a required V2 feature.

### Future/V3

Actual interactive physical shelves are V3.

---

# 8. Categories

**Primary purpose:** Browse the collection by subject/category.

**Best fit:** Collection → Categories.

### Display

Potential options:

* Category list with book counts
* Category cards
* Category → filtered collection
* Possibly different skins for different collections?

Potential metrics:

* Total books
* Read
* Unread

Avoid building complex category visualizations here if they are already represented in the Dashboard.

---

# 9. Book Details

**Primary purpose:** Provide the complete record for an individual book.

### Display

Sections:

**Identity**

* Cover
* Title
* Author
* ISBN
* Library ID

**Bibliographic data**

* Publisher
* Publication date
* Pages
* Category

**Location**

* Shelf

**Reading**

* Read/unread/currently reading
* Reading history
* Rating
* Reader notes/review

**Circulation**

* Current loan status
* Borrower
* Loan history

**Collections**

* Collections containing the book

**Wishlist**

* Wishlist membership, if applicable

### Actions

Depending on existing backend functionality:

* Edit
* Mark read/unread
* Add/edit notes
* Add rating
* Check out
* Return
* Restore
* Add to collection
* Add to wishlist

### Digital Library Record

The book detail page can visually incorporate:

* Library ID
* Acquisition date
* Reading history
* Loan history

A more elaborate digital checkout card/signature treatment is optional and should not block the basic Book Details implementation.

---

# 10. Reading History

**Primary purpose:** Show reading activity.

**Best fit:** Reading.

### Display

Use a single page with filters/statuses:

* Currently Reading
* Read
* Unread

Potential views:

* Chronological list
* Book grid
* Year/month grouping

### Statistics

Potential summary:

* Books read
* Pages turned
* Books read this year
* Average rating

These may link to the Dashboard for more detailed visualization.

---

# 11. Loans / Circulation

**Primary purpose:** Manage current and historical circulation.

**Best fit:** Circulation → Loans.

### Display

Separate active and historical information within one page.

**Active loans**

* Book
* Borrower
* Checkout date
* Due/return information

**History**

* Book
* Borrower
* Checkout date
* Return date

### Actions

* Check out
* Return
* View Book Details

The current checkout system should remain the primary implementation.

A full signature/checkout-card experience can be treated as visual enhancement rather than a separate system.

---

# 12. Discover

**Primary purpose:** Help users browse the collection without knowing exactly what they want.

Recommended sections:

* New Additions
* New Releases
* Collections
* Surprise Me

These should not all necessarily appear simultaneously.

---

## 12.1 New Additions

**Display:**

Book cards sorted by acquisition date.

**Interaction:**

Select book → Book Details.

---

## 12.2 New Releases

**Display:**

Books in the collection sorted/filterable by publication date.

This is initially based only on existing book metadata.

Do not introduce external release APIs for V2.

---

## 12.3 Collections

**Display:**

Collection cards containing:

* Name
* Description
* Representative book covers
* Book count

**Interaction:**

Select collection → collection book listing.

Examples:

* Staff Picks
* Exhibitions
* Seasonal collections
* Personal curated lists

This feature requires the Collections backend model.

---

## 12.4 Surprise Me

**Display:**

A simple action/button rather than a full page if possible.

Potential modes:

* Random book
* Random unread
* Random category
* Random shelf

**Interaction:**

Select option → randomly selected Book Details.

The visual metaphor of physically pulling a book from a shelf is not required for V2.

---

# 13. Staff Picks

**Implementation:** Collection.

Do not create a separate Staff Picks data model unless future requirements justify it.

Create a collection named something like:

> Staff Picks

Display it under Discover and potentially feature it on Home.

This allows Staff Picks to use the same infrastructure as Exhibitions and other curated collections.

---

# 14. Exhibitions

**Implementation:** Collection.

An exhibition is a curated collection with additional presentation.

Potential fields:

* Name
* Description
* Books
* Created date
* Last updated
* Optional active date range

**Best fit:**

Discover → Collections.

Potentially feature the active exhibition on Home.

---

# 15. Wishlists

**Primary purpose:** Track books the library wants to acquire.

**Best fit:** Top-level Wishlist page.

Multiple wishlists should be supported.

Example:

```
Wishlist

Books to Buy
Donations
Philosophy
Complete a Series
```

### Wishlist display

Each wishlist shows:

* Name
* Description
* Number of books
* Priority/status summary

### Wishlist book display

* Cover
* Title
* Author
* Priority
* Status
* Notes
* Optional URL

### Actions

* Add book
* Edit wishlist
* Add existing book
* Remove book
* Change priority
* Change status

Acquisition/purchase workflows beyond this are V3.

---

# 16. Weather Features

There are two separate features and they should remain separate.

## 16.1 Weather-Based Quote
```Higher Priority of the two```

**Best fit:** Home / Dashboard.

Select from the quote database based on weather options attached to the quote.

Example:

> Rainy weather → quote tagged `rainy`

This feature requires the Quotes model.

The quote system should not be coupled to the book recommendation system.

---

## 16.2 Weather-Based Book Recommendation 
```Lower Priority of the two```

**Best fit:** Home.

Uses current weather to select a book.

Example:

> Rainy evening
> A good night for something atmospheric.

Then display a book.

---


# 17. Seasonal Themes

**Backend:** None.

**Best fit:** Global UI/theme system.

Seasonal themes should affect the overall visual treatment without changing navigation or data.

Potential themes:

* Spring
* Summer
* Autumn
* Winter

Potential visual changes:

* Background
* Decorative elements
* Accent treatments
* Small animations

Keep this lightweight enough that it does not become a core feature dependency.

---

# 18. Time-of-Day Behavior

**Backend:** None.

**Best fit:** Global UI.

Potential behavior:

* Morning visual treatment
* Daytime treatment
* Evening treatment
* Night treatment

Possible elements:

* Lighting
* Background
* Window appearance
* Greeting

Do not create separate page layouts for different times.

---

# 19. Decorative Library Environment

**Backend:** None.

**Best fit:** Home initially; potentially global layout.

Possible elements:

* Plants
* Desk
* Window
* Clock
* Catalog cards
* Library labels
* Paper textures
* Book-spine motifs

These are visual elements rather than functional navigation.

Do not build a fully spatial environment in V2.

---

# 20. Author Quotes

**Backend:** Quotes model.

**Best fit:** Home and potentially Book Details.

Possible display:

* Small quote block
* Author attribution
* Optional book title

Quotes should be unobtrusive.

Weather-aware quotes can be selected using `weather_options`.

---

# 21. Library Journal

**Backend:** Requires investigation / likely new journal event model.

**Best fit:** Dashboard or dedicated Journal page.

The purpose is to show significant historical library events.

Potential display:

```
August 8
Added 4 books

August 6
Book returned

August 3
Book finished
```

Before implementation, determine:

* Which events are worth tracking?
* Can they be derived from existing data?
* Does a dedicated table provide sufficient value?
* How much historical information should be retained?

Do not treat git commit history as the Library Journal.

---

# 22. On This Day

**Backend:** Depends on existing historical dates.

**Best fit:** Home or Dashboard.

This should be a small component rather than a dedicated page.

Potential examples:

* Book acquired on this date
* Book read on this date
* Loan event on this date

If sufficient historical data exists, display:

> **On this day...**

If not, defer until the Library Journal/history model exists.

---

# 23. Responsive Design Requirements

Every feature ticket should explicitly define desktop and mobile behavior.

### General rules

* Avoid placing all Home modules in one long page.
* Use carousels/horizontal scrolling where appropriate.
* Use drawers/modals for filters.
* Stack dashboard cards on narrow screens.
* Avoid tables where cards/lists provide a better mobile experience.
* Preserve access to primary actions without requiring horizontal desktop layouts.
* Ensure book covers and metadata remain legible at small sizes.

Mobile should be treated as a first-class layout, not a desktop layout compressed into a phone.

---

# 24. Recommended V2 Priority

The following is the recommended implementation order.

## Priority 1 — Core UI

These replace the spreadsheet experience and should establish the basic application structure.

1. Global layout/navigation
2. Responsive design foundation
3. Collection / All Books
4. Search and filtering
5. Book Details
6. Shelves
7. Categories
8. Reading History
9. Loans / Circulation

---

## Priority 2 — Dashboard & Core Discovery

Once the basic collection UI works:

10. Dashboard
11. New Additions
12. New Releases
13. Collections backend + UI
14. Staff Picks collection
15. Exhibitions
16. Wishlist backend + UI
17. Surprise Me

---

## Priority 3 — Personalization & Analytics

18. Reader notes / reviews / ratings
19. Weather-based book recommendations
20. Author quotes / Quotes backend
21. Seasonal themes
22. Time-of-day UI
23. Empty states
24. Decorative library environment
25. Book of the Day
26. On This Day

---

## Priority 4 — Historical / Experimental Features

27. Library Journal
28. Additional environmental polish

These should not block the core V2 UI.

