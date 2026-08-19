# Book Category Architecture — Future Work

## Purpose

Replace the current single-value book category enum with a flexible many-to-many category system.

The original spreadsheet encoded multiple classifications in one comma-separated `Category` cell—for example, `History, Fiction` allowed a book to be found conceptually as either history or fiction while the combination represented historical fiction.

The application should preserve that useful compositional behavior while modeling each classification independently.

Categories should ultimately be **data, not application enum values**. Adding a new category should not require backend source changes, OpenAPI regeneration, or a frontend deployment.

---

# Current Categories

Analysis of the existing catalog found:

* 586
* 162 unique nonblank complete category strings.
* 58 unique atomic category labels after splitting comma-separated values.
* 35 unique single-category combinations.
* 99 unique two-category combinations.
* 24 unique three-category combinations.
* 4 unique four-category combinations.

The existing comma-separated system should therefore be interpreted as **multiple classifications attached to a book**, rather than 162 distinct categories.

For example:

```text
History, Fiction
```

should become:

```text
categories:
- History
- Fiction
```

This allows:

* `History` to find the book;
* `Fiction` to find the book;
* `History + Fiction` to identify the intersection, effectively historical fiction.

The same principle applies to combinations such as:

```text
Young Adult + Fantasy + Romance
Fantasy + Horror
Religion + History
Queer + Literary Fiction
Writing + Reference
```

## Existing taxonomy

The 58 atomic labels currently span several conceptual types.

### Genre and subgenre

* Alternate History
* Cozy
* Crime
* Dystopia
* Fantasy
* Fiction
* Horror
* Literary Fiction
* Mystery
* Paranormal
* Psychological
* Romance
* Science Fiction
* Smut
* Suspense
* Thriller
* Urban
* Western

These should generally be retained.

Overlapping classifications such as Crime, Mystery, Thriller, Suspense, and Psychological are intentional and are well suited to a many-to-many model.

Broad and narrow classifications such as Fiction and Literary Fiction may coexist rather than requiring a strict hierarchy.

### Subject matter

* Art
* Christian
* Economics
* Gardening
* Grief
* History
* Legal
* New Age
* Philosophy
* Politics
* Pop Culture
* Religion
* Self Help
* Sex
* Writing

These should generally be retained.

The system should not initially attempt to encode semantic inheritance. For example, `Christian` does not need to automatically imply `Religion`. Books should carry the classifications that are useful for browsing and filtering.

### Form, format, and type

* Choose Your Own Adventure
* Classics
* Collection
* Comic
* Cookbook
* Graphic Novel
* How To
* Journal
* Magazine
* Play
* Poetry
* Pop-Up
* Puzzle
* Reference
* RPG
* Trivia

These can remain in the same generalized category/facet system. Creating separate Genre, Subject, Form, and Audience database systems would likely over-model the needs of a personal library.

`Comic` and `Graphic Novel` may remain distinct if they represent intentionally different materials in the catalog.

`Classics` is subjective but useful for this collection and should remain.

`Pop-Up` describes the nature/form of the book itself and can reasonably remain searchable as a category.

### Audience, tone, identity, and style

Current classifications include concepts such as:

* Children's
* Humor
* Meta
* Queer
* Young Adult

These should remain available as facets alongside genres and subjects.

`Meta` is intentional. It is currently used for *House of Leaves* and *Pale Fire* and represents the metafictional/formally self-referential character of those works.

The category system is intended to reflect how the owner actually understands and browses the collection rather than enforce a formal library-science taxonomy.

### Copy-specific attributes

Two existing labels should **not** become normal categories:

* Signed Edition
* Special Edition

These describe the particular physical copy rather than the intellectual/formal classification of the work.

They should eventually move into copy/edition metadata.

Until that functionality exists, migration work must ensure this information is preserved rather than silently discarded.

Removing these two copy-specific labels leaves approximately **56 starting categories** for the new category system.

---

# Work Needed in the Backend

## Replace the category enum

The current backend models a book as having one enum-backed `category`.

Replace that architecture with a many-to-many relationship conceptually equivalent to:

```text
books
  id
  ...

categories
  id
  name
  slug
  ...

book_categories
  book_id
  category_id
```

A book must be capable of having zero, one, or multiple categories.

Categories should be persisted data rather than Python enum members.

## Category management

The backend should expose enough category API functionality for the frontend to discover the currently available categories.

At minimum, the frontend needs a way to retrieve the category list, such as:

```text
GET /categories
```

The detailed CRUD requirements should be decided when the backend feature is ticketed. The important architectural requirement is that adding a category must **not require changing Python source code**.

## Book contracts

Book create/read/update contracts must support multiple categories rather than one `category` value.

The exact API representation should be determined during implementation, but it should provide stable category identity while remaining convenient for frontend use.

Existing serialization, validation, OpenAPI generation, tests, and fixtures will need to be updated accordingly.

## Filtering

Book listing/filtering should support category membership.

A single category filter should return books possessing that category.

The API should also support filtering by multiple categories using **intersection/AND semantics** when requested:

```text
History
→ all books classified History

History + Fiction
→ books classified both History AND Fiction

Young Adult + Fantasy
→ books classified both Young Adult AND Fantasy
```

This recreates the useful compositional behavior of the spreadsheet without encoding combinations as individual category values.

The detailed query-string representation should be selected during ticket design.

## Dashboard

Category breakdowns must continue working against the new relationship.

A book with multiple categories will naturally contribute to multiple category counts, so dashboard semantics and tests should explicitly account for that behavior.

## Seed/catalog import

The existing catalog data should be transformed by splitting comma-separated category cells into individual classifications and creating the appropriate category relationships.

The import/generation process should deduplicate category records.

`Signed Edition` and `Special Edition` must not simply disappear during conversion. Preserve those attributes until dedicated copy/edition metadata exists.

## Remove obsolete restrictions

Once the many-to-many system is established:

* remove the finite Python `Category` enum;
* remove the SQLite single-category `CHECK` constraint;
* remove other code/tests that assume one category per book;
* update OpenAPI and documentation to describe the new relationship.

---

# Work Needed in the Frontend

## Consume categories dynamically

The frontend should stop maintaining hard-coded arrays of category values.

Instead, it should retrieve available categories from the backend.

The current duplicated category lists in Books filtering, Book forms, Books display, and Book Details should disappear as part of this transition.

Adding a category through the supported backend mechanism should make it available to the frontend without rebuilding the application.

## Book forms

Add/Edit Book must support assigning multiple categories.

The current single-select category control should be replaced with an accessible multi-category control appropriate to a taxonomy of roughly 50–60 values and potentially more over time.

Users must be able to:

* see currently assigned categories;
* add categories;
* remove categories;
* submit multiple category assignments.

The interaction design should be chosen during the frontend ticket rather than prescribed here.

## Books filtering

Replace the current single-category filter with multi-category filtering.

The interface should allow progressive narrowing:

```text
Fantasy
→ all Fantasy books

+ Horror
→ books classified Fantasy AND Horror

remove Fantasy
→ all Horror books
```

Category filters should remain compatible with the Books page's existing URL-state, pagination/infinite-query, sorting, author/title filtering, and query-key behavior.

Selected categories should be representable in the URL so filtered library views remain navigable/bookmarkable.

## Display

Books list and Book Details should display multiple categories cleanly.

The UI should not assume one category string per book.

Category display should remain readable when a book has three or four classifications.

## Dashboard

The dashboard should continue rendering category breakdown data supplied by the backend.

It should not hard-code the available taxonomy.

## Generated API contract

After the backend contract changes:

* refresh the checked-in OpenAPI contract;
* regenerate TypeScript types through the existing workflow;
* update API adapters/query hooks;
* remove obsolete enum-specific frontend logic;
* preserve existing generated-contract drift checking.

---

# Unanswered Questions

These decisions can wait until individual feature tickets are written.

### Category creation and management

Where should new categories be created?

Possibilities include:

* an administrative category-management interface;
* creation directly from the Add/Edit Book form;
* backend-only management initially.

The architecture should support dynamic categories regardless of which UI is chosen first.

### Category deletion and renaming

Define what happens when a category is:

* renamed;
* merged with another category;
* deleted while books still reference it.

These operations may justify a later category-management feature rather than being required for the initial many-to-many conversion.

### Copy/edition metadata

`Signed Edition` and `Special Edition` need a permanent home outside Categories.

Future design should determine whether copy metadata uses simple flags or a more expressive edition/copy-attribute model.

This work does not need to block the category architecture, but existing information must be preserved until it is implemented.

### Taxonomy hierarchy

The initial implementation should **not** require hierarchical relationships such as:

```text
Christian → Religion
Literary Fiction → Fiction
Urban Fantasy → Fantasy
```

If the collection later benefits from parent/child categories, synonyms, or automatic implication, that can be designed separately.

For now, category membership should remain explicit, composable, and simple.
