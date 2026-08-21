# Shade Library V1 --- Frontend Ticket Outline

Purpose: Convert the remaining V1 frontend work into ticket-ready
criteria. This outline assumes the backend category expansion, universal
filtering support, finalized Collections contract, and final V0 data
migration work are complete before the corresponding frontend ticket
begins.

Frontend baseline assumed: React 19 + TypeScript, React Router, TanStack
Query, shared API/query layers, accessible shared form/dialog
components, existing Books/Shelves/Wishlists/Collections surfaces, and
the current drawer-based navigation system.

## Cross-ticket implementation rules

-   Treat generated OpenAPI types and the finalized backend contract as
    authoritative. Do not invent parallel frontend-only API shapes when
    the backend already exposes the necessary resource or filter.

-   Keep query keys stable and feature-scoped. Mutations must invalidate
    every affected catalog, shelf, dashboard, collection, or detail
    cache needed to prevent stale UI.

-   Preserve URL-addressable state for browse/filter experiences where
    practical so filtered catalog views can be linked, refreshed, and
    reached from Home/Shelves.

-   Every new interactive control must support keyboard use, linked
    labels/errors, pending states, retryable errors, and intentional
    empty states at 320 px width.

-   Prefer reusable models/components for behaviors expected to spread
    across pages (filter state, bulk selection, bulk actions, collection
    membership actions) rather than embedding page-specific one-offs.

-   Each ticket should end with targeted tests, typecheck, the
    project-wide check command, and a manual smoke test of its primary
    user flow.

## 5. Finish Collections

Goal: Ship Collections as a complete first-class frontend feature for
curated, ordered groups of existing catalog books.

Backend assumption: Collections CRUD, ordered membership,
add/remove/reorder behavior, canonical UUID book IDs, and collection
membership metadata are finalized and documented.

### Required scope

-   Complete the /collections route and Collection-drawer navigation
    entry, including active-state behavior and document title metadata.

-   Support collection creation, display, editing, and permanent
    deletion with confirmation. Deleting a collection must remove only
    memberships, never catalog books.

-   Display each collection's name, optional description, book count,
    and ordered membership list.

-   Join membership book_id values to BookRead data for
    title/author/detail links. Provide a durable fallback when a joined
    book cannot be loaded and omit soft-deleted books if the backend can
    temporarily return a stale membership.

-   Add existing catalog books to a collection by selecting a
    collection, searching the existing catalog, choosing a result, and
    optionally supplying collection-specific notes. Do not create a new
    catalog row as part of this flow.

-   Allow shelved books and wishlisted books to coexist in Collections.
    Visually distinguish wishlist memberships and display "Wishlist" as
    their location instead of presenting them as ordinary shelf rows.

-   Allow membership removal without changing shelf/wishlist/catalog
    state.

-   Support Move Up / Move Down ordering controls with correct
    first/last disabled states and post-mutation refresh.

-   Add "Add to Collection" to Book Details. The action should open a
    dialog or equivalent focused flow with a collection dropdown,
    optional membership notes, and clear duplicate/already-member
    handling.

-   If useful to the final interaction model, expose lightweight
    collection membership information on Book Details (for example, "In:
    Staff Picks, Weird Favorites"), but do not turn Book Details into
    the primary collection-management surface.

### Acceptance criteria

-   A user can create a collection, add at least two existing books,
    reorder them, remove one, and delete the collection without leaving
    the Collections surface.

-   A user can add the current book to a chosen collection directly from
    Book Details without manually navigating to /collections.

-   Duplicate membership produces a clear non-destructive message;
    soft-deleted/stale-book errors are handled without corrupting local
    UI state.

-   Collection list, membership list, create, add, reorder, remove, and
    delete all expose loading/pending/error states and retry paths where
    retry is meaningful.

-   Empty states exist for no collections and for a collection with no
    books.

-   All membership mutations leave the catalog book itself intact and do
    not alter shelf or wishlist placement.

-   The feature remains usable at 320 px and all dialogs/forms are
    keyboard accessible with focus restoration/management consistent
    with shared components.

### Testing expectations

-   API helper tests for Collections CRUD and membership
    add/reorder/remove, including request-field allowlisting and error
    propagation.

-   React Query tests for list/detail membership loading and
    invalidation behavior.

-   Component tests for collection form validation, add-book
    search/select flow, duplicate/404/412/422 handling, reorder
    boundaries, removal confirmation, wishlist visual treatment, and
    Book Details add-to-collection dialog.

-   Route/AppShell tests for /collections navigation and active drawer
    state.

-   Regression test that deleting a catalog book invalidates Collections
    because backend membership rows may be removed automatically.

### Non-goals / defer

-   Drag-and-drop reordering unless it is trivial after button-based
    ordering is complete.

-   Nested collections, sharing/public collections, collection cover
    art, or collection-specific permissions.

-   Creating brand-new books from the Collections add flow.

## 6. Expose the V1 filters the UI actually needs

Goal: Use the finalized universal backend filtering capability to expose
only the filter experiences that make V1 useful, without coupling the UI
to a fixed list forever.

Backend assumption: All relevant Book fields are filterable, filters
compose, pagination/sorting continue to work, and the expanded category
model is finalized.

### Required V1 filter surfaces

-   Books: retain and expand the browse/filter controls so URL state can
    represent the V1 filter set. At minimum support category, author,
    title, ISBN/search-derived filtering, shelf, read status,
    availability/status, and any other finalized V1-critical field
    identified during implementation.

-   Shelves: selecting a shelf must open or render the catalog already
    filtered to that shelf; shelf filtering should use the same Books
    query/filter infrastructure rather than a separate catalog
    implementation.

-   Home: category cards must deep-link into the same filtered Books
    route/state used by normal browsing.

-   Preserve sorting while filters are active. Multiple filters must
    compose rather than replace one another.

-   Normalize blank/whitespace filters so the frontend does not send
    invalid empty query values to the backend.

-   Keep filter serialization centralized (query options/query keys/URL
    model) so adding another backend filter later requires a small
    extension instead of redesigning BooksPage.

### Acceptance criteria

-   Refreshing a filtered Books URL restores the same filters and sort
    state.

-   Links from Shelves and Home produce the same filtered results as
    manually applying equivalent filters on Books.

-   At least two filters can be combined with sorting and return the
    expected composed result set.

-   Clear Filters returns to the unfiltered catalog while preserving
    only intentional non-filter route state.

-   No-match and empty-library states remain distinct.

-   Filter controls remain keyboard accessible and usable on mobile;
    controls may collapse/reflow, but their semantics must not
    disappear.

### Likely implementation areas

-   src/api/booksApi.ts / booksQueries.ts / queryKeys.ts for additional
    filter arguments and stable keys.

-   Books list URL/model utilities for parsing, trimming, serialization,
    and reset behavior.

-   BooksListControls / BooksPage for visible V1 controls.

-   ShelvesPage links/actions and Home category links for pre-filtered
    navigation.

### Testing expectations

-   API/query-key coverage for each frontend-exposed filter and
    combinations of filters.

-   BooksPage tests for URL initialization, filter changes, clear
    behavior, sort+filter composition, and no-match state.

-   Shelves/Home navigation tests that assert the resulting Books
    URL/filter parameters.

-   Regression coverage ensuring old filter URLs remain valid if they
    are part of the current public UI.

## 7. Add bulk shelf movement

Goal: Allow a user to select multiple catalog books and move them to a
destination shelf safely, while establishing a reusable bulk-action
foundation for later operations.

Backend assumption: Single-book shelf updates are finalized and support
all V1 shelf values. If a true bulk endpoint exists, use it; otherwise
the frontend may orchestrate bounded individual mutations.

### Required scope

-   Add opt-in selection mode to the Books list and any other V1 surface
    where bulk movement is clearly useful (at minimum Books; Shelves may
    reuse the mechanism).

-   Provide per-row selection, Select All for the currently
    loaded/visible result set, Clear Selection, and an explicit
    selected-count indicator.

-   Keep selection scoped to a known result set. If filters/search
    change, either clear selection or preserve only IDs still valid
    under a clearly documented rule; do not silently act on invisible
    stale selections.

-   Provide a bulk action bar/menu with Move to Shelf. Destination
    choices must come from the live shelf catalog and exclude
    non-assignable/system destinations such as removed.

-   Require an explicit confirmation before moving multiple books,
    especially when selection count is greater than one.

-   Execute updates with bounded concurrency or a backend bulk endpoint.
    Disable duplicate submissions while the operation is active.

-   Return a completion summary: all succeeded, or N succeeded / M
    failed. Failed book IDs/titles must remain recoverable for retry
    rather than being lost.

-   Invalidate/refetch affected book lists, book details as needed,
    shelf-related views, and dashboard data after completion.

### Acceptance criteria

-   A user can filter the catalog, select several visible books, choose
    a destination shelf, confirm, and see all successful rows update
    without a page reload.

-   Selection UI is keyboard operable and exposes selected state to
    assistive technology.

-   The bulk action does not include soft-deleted books or other rows
    that are not eligible for shelf reassignment.

-   A partial failure does not report global success. Successful moves
    stay successful; failed rows remain identifiable and can be retried.

-   Changing routes or deliberately clearing selection leaves no hidden
    selection state that could trigger later actions accidentally.

-   The underlying selection/action mechanism can accept future actions
    (mark read, add to collection, etc.) without rewriting row selection
    from scratch.

### Testing expectations

-   Pure model tests for selection toggling, select-all/clear, and
    filter/result-set transitions.

-   Component tests for selection count, bulk shelf dialog,
    disabled/pending states, success summary, and partial failure
    behavior.

-   Query invalidation tests covering books, shelves, and dashboard
    after successful/partial operations.

-   At least one integration test with multiple selected books to
    prevent accidental "only first row moved" regressions.

### Non-goals / defer

-   Arbitrary bulk editing of every Book field in V1.

-   Cross-page selection across an unbounded paginated dataset unless
    the backend later provides a server-side selection/bulk model.

-   Undo history beyond a clear completion report and the ability to
    move books again.

## 8. Build the Home page

Goal: Create a discovery-oriented landing page that gives the library a
useful front door and routes users into pre-filtered catalog
experiences.

Backend assumption: Expanded categories and category filtering are final
and usable through the normal Books API.

### Required scope

-   Introduce a dedicated Home route at /. Move the current
    About/library-information content to a stable /about route (or
    another explicit information route) so discovery and
    institutional/about content are no longer competing for the same
    page.

-   Feature a curated subset of categories rather than dumping the full
    category catalog. The selected set should emphasize useful browsing
    entry points and can be represented as a small configuration/data
    structure rather than hard-coded JSX scattered across the page.

-   Each category card/link must navigate to /books with the category
    filter already applied through the canonical Books URL/filter model.

-   Provide clear secondary entry points to Browse, Collections,
    Wishlists, and About where appropriate without turning Home into a
    duplicate navigation menu.

-   Design empty/unavailable behavior so the page still renders if
    category counts/metadata are unavailable. Home should not become
    dependent on a fragile dashboard request unless the design
    intentionally uses it.

-   If category counts are shown, obtain them from an existing stable
    backend response; do not compute the entire catalog client-side
    merely to render Home.

### Content / information architecture criteria

-   Home is about discovery: "What might I want to browse/read?"

-   About remains about the library itself: dedication, lending policy,
    purpose, and catalog guide/information.

-   Category labels use the finalized display names from the expanded
    category system, not legacy slash-delimited category strings.

-   Prominent categories should be intentionally selected and documented
    in one place so the list can be adjusted without restructuring the
    page.

### Acceptance criteria

-   Visiting / shows Home, not About.

-   About remains directly navigable and retains its existing
    content/accessibility behavior after relocation.

-   Every featured category navigates to a correctly filtered catalog
    and survives refresh/back navigation.

-   Home remains useful at 320 px, with cards/links forming a readable
    single-column mobile layout.

-   The page has an intentional empty/fallback state if any optional
    discovery data cannot load.

### Testing expectations

-   Route/AppShell tests for / and /about titles/headings/navigation.

-   Home tests for featured category rendering and correct filtered
    destination URLs.

-   Regression tests for About relocation and existing About
    accessibility/content expectations.

-   At least one browser-level smoke test covering Home → category →
    filtered Books → Back.

## 9. Stretch goal --- Book cover images

Goal: Add reliable cover art to Book Details without making V1 depend on
a new image infrastructure project.

Release rule: This work is optional. Stop and defer if it requires
substantial backend storage, caching, attribution, rate-limit
management, or reliability work.

### Investigation criteria

-   Identify a source that can resolve covers from data already present
    on BookRead, preferably ISBN.

-   Confirm acceptable terms/attribution, request limits, HTTPS
    availability, and whether URLs are stable enough for direct browser
    use.

-   Define a deterministic fallback for missing ISBN, missing cover,
    network failure, and broken image responses.

-   Avoid adding a hard dependency that prevents Book Details from
    rendering when the cover provider is unavailable.

### Implementation acceptance criteria

-   Book Details displays a cover when confidently available.

-   Missing/unavailable covers render an intentional placeholder or omit
    the image cleanly without layout collapse.

-   Cover loading does not block the core Book Details query or
    interaction controls.

-   Images have useful alt behavior: decorative cover art may use empty
    alt when adjacent title text already identifies the book; otherwise
    provide concise accessible text.

-   Mobile layout remains stable with and without a cover.

-   No console error storm or repeated retry loop occurs for a
    missing/broken cover.

### Defer immediately if

-   The provider requires server-side secrets or a proxy not already
    planned for V1.

-   Reliable use requires persistent image caching/storage.

-   Rate limits or attribution requirements materially complicate
    deployment.

-   The implementation starts changing backend book schemas solely to
    support covers.

## 10. V1 frontend regression and deployment gate

Goal: Prove the finished frontend works against the finalized rebuilt V1
database and backend contract before deployment.

### Required regression scenarios

-   Home → featured category → filtered Books.

-   Books filtering/sorting with at least two composed filters.

-   Shelf → filtered catalog view.

-   Create/edit/delete Collections; add/reorder/remove memberships; add
    current Book Details book to a collection.

-   Wishlist flow remains functional and visually/semantically distinct
    from Collections.

-   Bulk-select multiple books and move them to a shelf, including one
    forced/handled partial failure scenario in automated tests.

-   Checkout/check-in/Loans and reading/edit/delete/restore flows remain
    green after filter/category changes.

-   Dashboard and incomplete-metadata views refresh correctly after
    catalog mutations.

-   Navigation, 320 px layout, keyboard/focus behavior, and top-level
    route error recovery remain intact.

### Release criteria

-   Project-wide make/check command is green, including unit/integration
    coverage thresholds.

-   Production build succeeds within the project's existing bundle-size
    policy.

-   No known contract mismatch remains between generated OpenAPI types
    and handwritten API/query layers.

-   Manual smoke test is performed against the final rebuilt V1
    database, not an older pre-migration dev DB.

-   README/current user-facing documentation reflects final routes and
    major V1 capabilities.

-   Any stretch cover-image work can be removed or disabled without
    affecting the V1 completion definition.

## Recommended ticket slicing

  ------------------------------------------------------------------------------------------------
  Ticket                  Primary scope       Depends on        Suggested completion signal
  ----------------------- ------------------- ----------------- ----------------------------------
  FE --- Finish           Collections page +  Final Collections Full
  Collections             membership          backend contract  create/add/reorder/remove/delete
                          actions + Book                        lifecycle green
                          Details                               
                          add-to-collection                     

  FE --- V1 filter        API/query/URL model Universal backend Composable filtered URLs work
  plumbing                for V1-visible      filtering +       across Books/Shelves/Home
                          filters             categories        

  FE --- Bulk selection   Reusable selection  Stable Books      Multi-select works and is reusable
  framework               state + bulk action list/filter model 
                          shell                                 

  FE --- Bulk move to     Move selected       Bulk selection    N selected books moved with
  shelf                   books,              framework + shelf correct invalidation/reporting
                          partial-failure     APIs              
                          handling                              

  FE --- Home discovery   Home route,         Category filter   Featured category links open
  page                    featured            plumbing          filtered Books
                          categories, About                     
                          relocation                            

  FE --- V1               Cross-feature       All blocker       make check/build/manual smoke all
  regression/deployment   regression + final  tickets + final   green
                          docs/build checks   DB rebuild        

  FE --- Cover images     Book Details        None; optional    Reliable covers without new
  (stretch)               cover + fallback                      infrastructure
  ------------------------------------------------------------------------------------------------

## Frontend definition of V1 complete

The frontend is V1-complete when it can browse the finalized catalog
through useful composable filters; enter that catalog from Shelves and a
discovery-oriented Home page; organize books individually through
shelves, wishlists, and fully finished Collections; move multiple books
between shelves safely; and complete the existing
circulation/reading/admin flows against the final rebuilt V1 database
without stale-cache, routing, accessibility, or mobile-layout
regressions. Cover images do not block release.
