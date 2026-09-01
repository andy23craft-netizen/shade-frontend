# Library V2 --- UI Design & Feature Priorities (Remaining)

**Already shipped (removed from this brief):** global layout/navigation,
Collection browse with core filters, Book Details (data-oriented),
Shelves catalog, Loans (active + history), Dashboard summary and
category breakdowns, New Additions and Staff Picks on Home, rotating
frontend quotes, Collections CRUD/membership UI, Wishlists
(create/add/move-to-shelf), reader notes/ratings/mark-read, covers, and
Staff Picks-as-Collection.

**Status:** Remaining V2 priorities and implementation questions for
ticket planning, reconciled to the V2/V3 scope defined in Pass 1.

------------------------------------------------------------------------

# 1. V2 Product Boundary

V2 is now intentionally narrower.

## V2 MVP

-   Deeper Dashboard analytics.
-   New Releases from in-collection publication dates.
-   Current Reading on Home.
-   Lightweight seasonal/theme-aware visual personality.
-   Responsive and accessibility polish for these additions.

## V2 stretch

-   Surprise Me / lightweight serendipity.
-   Additional decorative/environmental polish where it fits the
    skin/theme system without meaningful performance drag.
-   Empty-state personality copy.

## V3 / later

The following are no longer V2 implementation targets:

-   Quotes backend and weather-aware quote selection.
-   Weather-based book recommendations.
-   Library Journal.
-   On This Day.
-   Book of the Day.
-   Deep time-of-day/weather-reactive environment.
-   Fully spatial/interactive library simulation.

Those concepts should not drive new V2 backend tables or routes.

------------------------------------------------------------------------

# 2. Backend Work Required for V2

V2 should avoid introducing backend infrastructure for features now
assigned to V3.

## 2.1 Dashboard analytics

Review existing book and reading fields first. Add backend work only
where an agreed Dashboard metric cannot be calculated cleanly from
existing data.

Target V2 metrics include:

-   Pages owned.
-   **Pages turned** (preferred UI term for pages read).
-   Books acquired this year.
-   Books read this year.
-   Books read over time.
-   Pages turned over time.
-   Books read by shelf.
-   Books read by category.

Do not add speculative recommendation or journal metadata.

## 2.2 Current Reading

Use the reading-status model being added for the collection. The Home
module should be able to retrieve books currently being read by the
household.

Prefer extending the existing book/list contract over creating a
separate Home-specific data model.

## 2.3 New Releases

Use existing publication-date metadata.

V2 New Releases does **not** require an external release provider or
new-release aggregation service.

## 2.4 Surprise Me

If implemented, prefer existing collection filters/query logic. Do not
add a recommendation engine.

------------------------------------------------------------------------

# 3. Responsive / Mobile Requirement

Every remaining V2 feature ticket should specify:

1.  What is displayed?
2.  What is interactive?
3.  What happens on mobile?
4.  What is hidden, collapsed, or moved at smaller widths?

Do not assume desktop Dashboard layouts can simply stack on mobile.

Home should stay curated rather than becoming a container for every
possible discovery feature.

------------------------------------------------------------------------

# 4. Home

**Primary purpose:** Library overview and discovery.

Already on Home: New Additions, Staff Picks, category drawers, and
rotating frontend quotes.

## 4.1 Current Reading --- V2 MVP

Add a Home presentation for books currently being read by the household.

The exact presentation should reuse the established Home visual language
and remain compact enough for phone use.

This should be driven by reading status rather than a separate manual
Home curation mechanism.

## 4.2 New Releases --- V2 MVP

Surface recently published books that are already present in the
collection.

This may be a Home module or link into a deeper Discover presentation,
depending on the final density plan.

## 4.3 Surprise Me --- V2 stretch

If included, keep it lightweight: a simple action or compact module
rather than a large permanent Home section.

Historical and ambient modules previously proposed for Home --- weather
recommendation, Book of the Day, On This Day, and weather-aware quotes
--- are V3/later and should not be included in the V2 Home density plan.

------------------------------------------------------------------------

# 5. Dashboard

**Primary purpose:** High-level collection and reading analytics.

Summary metrics and category breakdowns already ship. Deeper analytics
are a **V2 MVP**.

## 5.1 Additional metrics

-   Pages owned.
-   **Pages turned**.
-   Books acquired this year.
-   Books read this year.

## 5.2 Reading visualizations

-   Books read over time.
-   Pages turned over time.
-   Books read by category.
-   Books read by shelf.

## 5.3 Visualization

Use conventional charts unless a book/library metaphor clearly improves
the experience without reducing readability.

Possible treatments include:

-   Timeline charts.
-   Bar/donut treatments.
-   Restrained book-cover or shelf-inspired visualizations.

Dashboard is more naturally a desktop-heavy analytics surface, but its
essential information must remain usable on mobile. Do not require a
large desktop canvas.

Weather quotes and other ambient information are no longer part of the
V2 Dashboard scope.

------------------------------------------------------------------------

# 6. Collection

Core All Books browse, URL-backed filters, sorting, infinite scroll,
covers, Shelves, Collections, and Wishlists already ship.

No new Collection sub-surface is required merely to expand V2 scope.

Any remaining filter/view work should be ticketed only when an observed
product need justifies it. Do not invent a second filter stack or
duplicate information already available through Browse, Home drawers, or
Dashboard.

Reading status should integrate into the existing collection model
rather than requiring a separate Reading section unless later use proves
that a dedicated surface is necessary.

------------------------------------------------------------------------

# 7. New Releases

**Priority:** V2 MVP.

**Display:** Books in the owned collection selected/sorted using
publication date.

Initial implementation should use only existing book metadata.

Do not introduce external release APIs for V2.

The feature may appear as a Home module, a Discover surface, or both if
the responsive density plan supports it without duplicating the same
presentation unnecessarily.

------------------------------------------------------------------------

# 8. Surprise Me / Serendipity

**Priority:** V2 stretch.

Prefer a simple action/button rather than a full route unless
implementation proves a route useful.

Potential modes:

-   Random book.
-   Random unread book.
-   Random read book.
-   Random category.
-   Random shelf.

Interaction: choose a mode → resolve one owned book → open Book Details.

Physical "pull from shelf" animation is not required for V2 and fits the
later spatial-library direction better.

------------------------------------------------------------------------

# 9. Seasonal / Theme-Aware UI

**Priority:** V2 MVP direction, kept lightweight.

**Backend:** None expected.

Potential themes:

-   Spring
-   Summer
-   Autumn
-   Winter

Potential changes:

-   Background/accent treatment.
-   Typography accents.
-   Decorative elements.
-   Small seasonal illustrations/effects.

The information architecture and page functionality must remain stable
across themes.

This can be implemented as part of the broader skin/theme system rather
than as a standalone feature family.

Weather-reactive and time-of-day-reactive environmental behavior belongs
in V3.

------------------------------------------------------------------------

# 10. Decorative Library Environment

**Priority:** V2 stretch / polish.

**Backend:** None.

Possible elements:

-   Plants.
-   Desk.
-   Lamp.
-   Window.
-   Clock.
-   Catalog cards.
-   Library labels.
-   Paper textures.
-   Book-spine motifs.
-   Subtle architectural framing.

These elements are visual only and must not become required navigation.

Prefer additions that can be shared with the skin/theme system and that
do not materially increase initial-load cost.

A fully spatial environment remains V3.

------------------------------------------------------------------------

# 11. Empty-State Personality Copy

**Priority:** V2 stretch / polish.

Existing empty states may receive library-specific language without
changing their behavior.

Examples:

-   No books found → **We searched the stacks. Nothing turned up.**
-   No checked-out books → **Everything is home.**
-   Empty shelf → **Even libraries need empty spaces.**

Keep the copy useful and concise; personality should not obscure the
action the user can take next.

------------------------------------------------------------------------

# 12. Visual Language

V2 should continue the V1 visual language:

-   Library/institutional typography.
-   Paper and ink.
-   Wood, plants, glass, and brass.
-   Book-spine imagery.
-   Catalog-card motifs.
-   Subtle depth and shadows.

Avoid excessive skeuomorphism.

The goal remains **inspired by physical libraries**, not pretending the
application is literally a room.

------------------------------------------------------------------------

# 13. V2 Data-First Principle

  V2 Feature               Existing/Primary Data
  ------------------------ ----------------------------------------------
  New Releases             Publication date
  Current Reading          Reading status
  Pages turned             Page count + reading history
  Dashboard trends         Existing acquisition/reading/completion data
  Surprise Me              Existing collection/filter data
  Seasonal themes          UI-only
  Decorative environment   UI-only

If a proposed feature requires substantial new historical, weather, or
environmental infrastructure, it should be reviewed against V3 rather
than automatically added to V2.

------------------------------------------------------------------------

# 14. V2 Responsive Design Requirements

Every new V2 ticket must explicitly define desktop and mobile behavior.

General rules:

-   Keep Home curated and compact.
-   Use carousels/horizontal scrolling only where they improve mobile
    browsing.
-   Use drawers/modals for complex controls where appropriate.
-   Keep Dashboard analytics readable on narrow screens.
-   Avoid tables where cards/lists are a better phone experience.
-   Preserve primary actions without requiring desktop-width layouts.
-   Keep covers and metadata legible at small sizes.

Mobile is a first-class layout, not a compressed desktop layout.

------------------------------------------------------------------------

# 15. Recommended Remaining V2 Priority

## Priority 1 --- MVP analytics and Home additions

1.  Dashboard metrics and visualizations.
2.  New Releases.
3.  Current Reading Home module.

## Priority 2 --- MVP visual personality

4.  Seasonal/theme-aware treatment.
5.  Responsive behavior for all new V2 modules.
6.  Accessibility and performance validation.

## Priority 3 --- Stretch / polish

7.  Surprise Me.
8.  Decorative/environmental UI additions.
9.  Empty-state personality copy.

These stretch items should not block completion of the V2 MVP.

------------------------------------------------------------------------

# 16. Explicit V2 Non-Goals

Do not create V2 backend models, routes, or UI commitments for:

-   Quotes/weather-tag backend.
-   Weather-based book recommendations.
-   Library Journal.
-   On This Day.
-   Book of the Day.
-   Deep time-of-day behavior.
-   Dynamic weather environment.
-   Interactive world/Tulsa/library map.
-   Interactive floor plan.
-   Physically navigable shelves.
-   Animated books moving between shelves.
-   Interactive librarian's desk.
-   Ambient audio.
-   Persistent virtual-library simulation.
-   External new-release aggregation.
-   Complex AI recommendation engine.

These belong to V3 or later.

------------------------------------------------------------------------

# 17. V3 Scope to Preserve

V3 is where the library can become more explicitly **a place**,
supported by the history accumulated through normal use.

## Historical personality

-   Library Journal.
-   On This Day.
-   Historical resurfacing and richer event history.
-   Book of the Day or similar daily resurfacing.

## Weather and living environment

-   Weather-based book recommendations.
-   Weather-aware quote selection if still desired.
-   Time-of-day behavior.
-   Reactive seasons, weather, lighting, and atmosphere.

## Spatial / interactive library

-   World → Oklahoma → Tulsa → Library → Room → Shelf → Book.
-   Interactive rooms and shelves.
-   Librarian's desk.
-   Books visually appearing, disappearing, and moving with collection
    state.
-   Shelf-capacity representation if a useful real model exists.
-   Ambient sound.
-   Environmental storytelling and library phenomena.
-   Walking/wandering through the library.

V2 architecture should avoid unnecessarily preventing these ideas, but
no V2 feature should depend on them.

------------------------------------------------------------------------

# 18. V2 Completion Criteria

The remaining V2 work is complete when:

1.  Dashboard analytics meaningfully deepen the existing summary using
    owned data.
2.  New Releases can surface recently published owned books without an
    external provider.
3.  Home can show books currently being read without becoming
    overcrowded on mobile.
4.  Seasonal/theme-aware personality strengthens the library identity
    without changing core navigation or creating meaningful performance
    drag.
5.  New V2 surfaces have explicit responsive and accessibility behavior.
6.  Stretch features can be omitted without leaving the MVP incomplete.

V2 finishes the catalog's analytics, discovery, and visual personality.

V3 can then use accumulated history, weather/time context, and spatial
interaction to make the library itself feel like a living place.
