# Library V2 — UI Design & Feature Priorities (Remaining)

**Already shipped (removed from this brief):** global layout/navigation, Collection browse with core filters,
Book Details (data-oriented), Shelves catalog, Loans (active + history), Dashboard summary and category breakdowns,
New Additions and Staff Picks on Home, rotating frontend quotes, Collections CRUD/membership UI, Wishlists
(create/add/move-to-shelf), reader notes/ratings/mark-read, covers, and Staff Picks-as-Collection.

**Status:** Remaining V2 priorities and open backend questions for ticket planning.

## 0. Response from Senior Engineer (still open)

Summarized Notes:
* For each remaining page or section, specify how features/data will be displayed and how the user will interact.
* Prefer finishing current tickets, then revisiting this document.

Detailed Notes (unresolved):
* You may focus on the UI first, then back into required DB/BE changes.
* Is the Library Journal manual, or an automated summary of events created through this tool?
* Home and Discover still risk packing too much onto mobile. How should remaining modules scroll or defer?
* Remaining Home items need concrete presentation (weather recommendation, Surprise Me, On This Day, etc.): placement,
  scroll behavior, modal vs inline.
* Weather-driven author quotes (backend + weather tags) are higher priority than weather book recommendations; keep
  them separate. Current Home quotes are a hardcoded frontend bucket, not weather-aware.
* Dashboard is more for desktop (charts). Homepage is more for mobile.

Resolved by shipping (removed): Collection vs Shelves vs Categories IA as separate Collection-drawer destinations
(Browse, Shelves, Collections, Wishlists); Staff Picks as a named Collection rather than a special shelf/ribbon;
Circulation consolidated on `/loans`; multiple named wishlists.

---

## 1. Backend Work Required (remaining)

### 1.1 Quotes

If quotes are stored and associated with books/weather, they should be represented in the backend rather than hardcoded
in the frontend (`homeQuotes` today).

**New table: `quotes`**

* `quote_id`
* `created_date`
* `book_id` (optional if quotes are not always book-linked)
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
* Book Details (optional)
* Potentially Dashboard

Weather-based quote selection should remain separate from weather-based book recommendations.

See also `PRODUCT_REQS.V2.quote-bucket.md`.

---

### 1.2 Library Journal

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

Determine whether these events can be derived from existing tables or require a dedicated journal/event table.

**Frontend uses:**

* Dashboard or Home
* Dedicated Library Journal page if the resulting history warrants one

---

### 1.3 Additional Book Metadata

Review existing book fields before creating new models.

Potential fields still needed for remaining V2 features:

* Last discussed date, only if "neglected books" / Surprise Me "neglected" mode remains desired
* Other recommendation metadata only when a specific remaining feature requires it

Do not add fields unless a specific V2 feature requires them. Staff Pick / collection membership, reader review, and
reading date already ship via Collections and book reading fields.

---

# 2. Remaining Site Structure

Shipped primary destinations: Home, Collection (Browse, Manage, Collections, Wishlists), Circulation (Loans),
Dashboard, Book Details.

Remaining destinations / surfaces (illustrative, not all must be top-level routes):

```text
Discover (or Home modules)
  ├── New Releases
  └── Surprise Me

Reading
  └── Reading History (single page; optional if Books `is_read` filters suffice)

Collection
  └── Categories (dedicated browse, if product wants more than Books filters + Home drawers)

Library Journal
On This Day (component; host TBD)
```

### Still-open consolidations / rules

**Reading**

If a Reading surface is added, do not create separate "Read" and "Reading History" pages. Use one page with
filters/statuses (Currently Reading / Read / Unread), or deepen Books `is_read` filtering instead.

**Staff Picks / Exhibitions**

Continue treating these as Collections. Optional: stronger exhibition presentation and Home featuring beyond Staff
Picks.

---

# 3. Responsive / Mobile Requirement

Every remaining feature ticket should specify:

1. What is displayed?
2. What is interactive?
3. What happens on mobile?
4. What is hidden, collapsed, or moved at smaller widths?

Do not assume desktop dashboard layouts can simply stack on mobile.

Avoid putting every remaining feature on Home. Home should stay a curated subset with links to deeper pages.

---

# 4. Home (remaining modules)

**Primary purpose:** Library overview and discovery.

### Remaining recommended contents

Prioritize among:

1. Weather recommendation (book)
2. Currently Checked Out / Reading
3. Random Book / Surprise Me
4. Featured Exhibition (beyond Staff Picks), if desired
5. Weather-aware quote upgrade (when Quotes backend exists)
6. On This Day (small component)

Already on Home: New Additions, Staff Picks, category drawers, rotating frontend quotes.

### Weather-aware Author Quote (upgrade)

**Display:** Small quote block (placement already exists on Home; may move).

**Backend:** Quotes model with `weather_options`.

**Interaction:** None required.

---

# 5. Dashboard (remaining)

**Primary purpose:** High-level collection analytics.

Summary metrics (totals, read/unread, checked out, recently added) and category donut already ship.

### Remaining analytics

**Reading**

* Books read over time
* Pages read
* Read by category (beyond current breakdowns if product wants more)
* Read by shelf

**Collection composition**

* Stronger books-by-shelf visualization on Dashboard (Shelves page already maps `by_shelf` counts)

### Visualization

Use conventional charts unless a book metaphor clearly improves readability.

Possible additions:

* Timeline charts
* Additional bar/donut treatments
* Book-cover visualizations

Book-shaped bar charts only if they fit the established visual design and stay readable.

### Weather Quote

**Display:** Short quote from a novel that describes the current weather.

Example:

> Snowy today
> "The snow fell quietly without, and the fire crackled cheerfully within." -- Louisa May Alcott, Little Women

**Interaction:** Optional link to an outside weather service.

### Mobile

Dashboard cards should stack or become horizontally scrollable. Avoid requiring a large desktop canvas.

---

# 6. Collection (remaining depth)

Core All Books browse, URL-backed filters (category / author / title / ISBN / shelf / read status), sort, infinite
scroll, and covers already ship.

### Remaining display options

* Grid (covers and titles)
* List / card density variants
* Compact catalog view (if product defines it)

### Remaining filters (only if product explicitly needs them)

* Checked out / available (`status`)
* Rating
* Publication year
* Acquisition date
* Collection membership

Do not invent a second filter stack. Prefer extending the existing Books URL model.

### Remaining search

Potentially notes (currently intentionally not a normal V1 list filter per `docs/AGENTS.md`).

### Mobile

Filters as drawer/modal remain the right pattern for any new controls.

---

# 7. Shelves (remaining depth)

Shelf catalog, counts, and `/books?shelf_name=` deep links already ship.

Optional remaining depth:

* Utilization information **only if** capacity is actually tracked in the database
* In-shelf book grid/list on the shelf surface (vs deep-link-only)

Do **not** invent capacity percentages from arbitrary book counts.

Interactive physical shelves remain V3.

---

# 8. Categories (dedicated browse)

Category vocabulary, Books multi-`category_id` filters, Home featured category drawers, and Dashboard category
breakdown already ship.

**Still open:** a dedicated Collection → Categories browse surface, if product wants more than filters/drawers.

### Display options

* Category list with book counts
* Category cards
* Category → filtered collection (`/books?category_id=`)

Potential metrics:

* Total books
* Read
* Unread

Avoid duplicating Dashboard category visualizations.

---

# 9. Book Details (remaining polish)

Core identity, bibliographic fields, location, reading, current loan, acquisition, covers, checkout, mark-read /
edit reading, soft delete, and Add to Collection already ship.

### Remaining display

**Collections**

* Lightweight "collections containing this book" readout (beyond the add dialog)

**Wishlist**

* Wishlist membership display, if applicable (add-from-detail may stay out unless product asks; shelf/wishlist
  exclusivity still applies)

### Digital Library Record

Optional visual treatment (library ID emphasis, richer history presentation). A more elaborate digital checkout
card/signature treatment should not block other work; full skeuomorphic checkout card can wait.

Mark-unread remains out of scope unless explicitly requested.

---

# 10. Reading History

**Primary purpose:** Show reading activity as a first-class surface (optional if Books `is_read` filters are enough).

**Best fit:** Reading.

### Display

Single page with filters/statuses:

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

# 11. Discover (remaining)

**Primary purpose:** Browse without knowing exactly what you want.

Remaining sections:

* New Releases
* Surprise Me

New Additions and Collections already ship (Home / Collection drawer).

---

## 11.1 New Releases

**Display:** Books in the collection sorted/filterable by publication date.

Initially based only on existing book metadata. Do not introduce external release APIs for V2.

---

## 11.2 Surprise Me

**Display:** A simple action/button rather than a full page if possible.

Potential modes:

* Random book
* Random unread
* Random category
* Random shelf

**Interaction:** Select option → randomly selected Book Details.

Physical "pull from shelf" animation is not required for V2.

---

# 12. Exhibitions (optional presentation)

Collections already provide curated groupings. Remaining work is stronger exhibition presentation if desired:

* Optional active date range (likely needs backend fields)
* Home featuring of an active exhibition beyond Staff Picks
* Editorial visual treatment

**Best fit:** Discover → Collections / Home feature slot.

---

# 13. Wishlists (remaining gaps)

Multiple named wishlists, add unshelved book, display priority/status/notes/url, and move-to-shelf already ship.

### Remaining if product asks

* Membership field edit (priority/status/notes/url after add)
* Standalone membership remove without move-to-shelf
* Book Details wishlist membership display
* Add existing shelved catalog book (blocked today by shelf/wishlist exclusivity **412**; do not invent a bypass)

Acquisition/purchase workflows beyond this are V3.

---

# 14. Weather Features

Two separate features; keep them separate.

## 14.1 Weather-Based Quote (higher priority)

**Best fit:** Home / Dashboard.

Select from the quote database based on weather options attached to the quote.

Example:

> Rainy weather → quote tagged `rainy`

Requires the Quotes model. Do not couple to book recommendations.

---

## 14.2 Weather-Based Book Recommendation (lower priority)

**Best fit:** Home.

Uses current weather to select a book.

Example:

> Rainy evening
> A good night for something atmospheric.

Then display a book.

---

# 15. Seasonal Themes

**Backend:** None.

**Best fit:** Global UI/theme system.

Potential themes: Spring, Summer, Autumn, Winter.

Potential visual changes: background, decorative elements, accent treatments, small animations.

Keep lightweight; not a core feature dependency.

---

# 16. Time-of-Day Behavior

**Backend:** None.

**Best fit:** Global UI.

Potential behavior: morning / daytime / evening / night treatments.

Possible elements: lighting, background, window appearance, greeting.

Do not create separate page layouts for different times.

---

# 17. Decorative Library Environment

**Backend:** None.

**Best fit:** Home initially; potentially global layout.

Possible elements: plants, desk, window, clock, catalog cards, library labels, paper textures, book-spine motifs.

Visual only; not functional navigation. No fully spatial environment in V2.

---

# 18. Author Quotes (remaining)

Basic rotating Home quotes ship via frontend `homeQuotes`.

**Remaining:** Quotes backend, weather-aware selection, optional Book Details placement, unobtrusive reuse elsewhere.

---

# 19. Library Journal

**Backend:** Requires investigation / likely new journal event model (or derived events).

**Best fit:** Dashboard or dedicated Journal page.

Potential display:

```text
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

# 20. On This Day

**Backend:** Depends on existing historical dates.

**Best fit:** Home or Dashboard (small component, not a dedicated page).

Potential examples:

* Book acquired on this date
* Book read on this date
* Loan event on this date

If sufficient historical data exists, display **On this day...**. If not, defer until Journal/history model exists.

---

# 21. Responsive Design Requirements

Every remaining feature ticket should explicitly define desktop and mobile behavior.

### General rules

* Avoid placing all Home modules in one long page.
* Use carousels/horizontal scrolling where appropriate.
* Use drawers/modals for filters.
* Stack dashboard cards on narrow screens.
* Avoid tables where cards/lists provide a better mobile experience.
* Preserve access to primary actions without requiring horizontal desktop layouts.
* Ensure book covers and metadata remain legible at small sizes.

Mobile is a first-class layout, not a compressed desktop layout.

---

# 22. Recommended Remaining V2 Priority

## Priority 1 — Collection depth & optional Reading/Categories surfaces

1. Remaining Books filters/views only when product explicitly needs them
2. Dedicated Categories browse (optional)
3. Reading History page (optional vs Books `is_read` filters)
4. Book Details membership readouts (collections / wishlist)

---

## Priority 2 — Discovery

5. New Releases
6. Surprise Me
7. Exhibition presentation / Home featuring beyond Staff Picks (optional)
8. Wishlist membership edit gaps (only if product asks)

---

## Priority 3 — Personalization & analytics

9. Dashboard timelines / pages-read / richer composition charts
10. Weather-based quotes + Quotes backend
11. Weather-based book recommendations
12. Seasonal themes
13. Time-of-day UI
14. Empty-state personality copy
15. Decorative library environment
16. Book of the Day
17. On This Day

---

## Priority 4 — Historical / experimental

18. Library Journal
19. Additional environmental polish

These should not block core remaining discovery UI.
