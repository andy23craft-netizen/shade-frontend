# Shade Library Frontend Workflow

## Future-State Product Flow for Tenant-Aware Catalogs, Build Mode, Media Domains, and Themes

## 1. Purpose

Shade Library should evolve from a single-catalog frontend into a tenant-aware application that can serve multiple independent personal libraries from one running deployment.

The top-level library identity is not a user-created container inside the application. It is the configured tenant selected by hostname and `Library-Username`, with one SQLite database per tenant.

Within each tenant library, the application may support multiple media domains such as Books and Albums. These media domains share the same tenant boundary and application shell while keeping their own catalog models, metadata, language, interactions, and visual treatment.

The central frontend principle is:

> **The hostname selects whose library is active. The application then exposes the media catalogs available inside that library.**

For example:

```text
andy.library.spir.es
└── Andy's Library
    ├── Books
    ├── Albums
    ├── Shelves
    ├── Loans
    ├── Wishlists
    ├── Collections
    └── Dashboard
```

and independently:

```text
jamie.library.spir.es
└── Jamie's Library
    ├── Books
    ├── Albums
    ├── Shelves
    ├── Loans
    ├── Wishlists
    ├── Collections
    └── Dashboard
```

Books and Albums are therefore catalog domains inside one tenant library, not separate tenant libraries.

---

## 2. Core Product Model

The frontend should treat these concepts separately:

### Application

One deployed Shade Library frontend and backend stack.

### Tenant Library

One independently isolated personal library selected by hostname and `Library-Username`.

Examples:

- `andy.library.spir.es` → `Library-Username: andy` → `data/andy.db`
- `jamie.library.spir.es` → `Library-Username: jamie` → `data/jamie.db`

The tenant library is provisioned through deployment/configuration rather than created by an in-app workflow.

### Media Domain

A catalog family inside the active tenant library.

Initial and planned domains include:

- Books
- Albums / Music

Future domains may include:

- Movies / DVDs
- Comics
- other media types

Each media domain may define its own:

- catalog records;
- metadata providers;
- filters and sorts;
- intake/build workflow;
- terminology;
- dashboard presentation;
- decorative metaphor.

### Theme / Skin

The visual treatment loaded for the active tenant.

In the PLAN-02 implementation, the tenant hostname/username selects the theme tokens from frontend configuration. Themes remain presentation-only and must not alter catalog semantics.

### Catalog

The actual media records stored inside the active tenant database.

---

## 3. Tenant Resolution at Startup

The application should resolve tenant identity before loading tenant-scoped catalog data.

Startup behavior:

1. Read `window.location.hostname`.
2. Derive the tenant username from the leftmost hostname label.
3. Validate that the hostname maps to a supported configured tenant.
4. Use that username as `Library-Username` on authenticated API requests.
5. Load the theme configuration associated with that username.
6. Only then begin loading tenant-scoped application data.

Examples:

```text
andy.localhost
→ andy
→ Library-Username: andy
→ Andy's catalog and theme
```

```text
jamie.library.spir.es
→ jamie
→ Library-Username: jamie
→ Jamie's catalog and theme
```

Direct navigation and refresh naturally preserve tenant identity because the hostname itself is the source of truth.

Backend requirement: All protected catalog routes must require and honor the same `Library-Username` selected from the hostname. Public health/version/docs routes remain unscoped.

---

## 4. Unknown or Unsupported Tenant

The frontend must never silently fall back to another tenant.

If the hostname does not resolve to an allowed tenant:

- do not load another tenant's theme;
- do not issue catalog requests using a fallback username;
- do not render cached tenant catalog data as though it belongs to the unknown host;
- present the configured unknown-host experience once PLAN-02's remaining UX decision is finalized.

Bare `localhost` / `127.0.0.1` should not silently become one of the configured tenant libraries.

---

## 5. Tenant Isolation in Frontend State

All tenant-scoped frontend state must respect the hostname-derived tenant identity.

This includes:

- TanStack Query cache keys;
- route-loader state;
- optimistic updates;
- locally persisted preferences that are tenant-specific;
- Build Mode session storage;
- any future media-intake draft storage.

A cache entry or local session created for `andy` must never surface while `jamie` is active.

Recommended conceptual cache identity:

```text
["andy", "books", ...]
["andy", "albums", ...]
["jamie", "books", ...]
["jamie", "albums", ...]
```

The exact implementation may vary, but tenant identity must be part of the scope wherever state could otherwise survive a tenant transition.

---

## 6. Tenant Switching

PLAN-02 treats hostname as the tenant switch.

Local development:

```text
http://andy.localhost:5173
http://jamie.localhost:5173
```

Deployment:

```text
https://andy.library.spir.es
https://jamie.library.spir.es
```

Opening another tenant hostname activates that library.

Do not build an in-application tenant switcher unless the PLAN-02 support-access decision later explicitly permits one.

If a switcher is introduced later, it should navigate to the other tenant hostname rather than changing a hidden in-app library ID while staying on the same host.

---

## 7. Media Domains Inside One Library

A tenant library may contain multiple catalog domains.

Books and Albums should be modeled as sibling domains inside the same active tenant context.

Conceptually:

```text
Active tenant: Andy

Books
- book catalog
- ISBN metadata
- authors
- reading state
- Book Build Mode

Albums
- album catalog
- barcode/provider metadata
- artists
- tracks
- played state
- album intake workflow

Shared tenant services
- shelves
- loans
- wishlists
- collections
- dashboard
```

The frontend must not treat moving from Books to Albums as moving into another tenant database.

Backend requirement: `/books` and `/albums` remain distinct catalog APIs, but both operate against the database selected by the same `Library-Username`.

---

## 8. First-Use / Empty-Catalog Onboarding

A newly provisioned tenant may have an empty catalog.

The application should not greet that tenant with a barren dashboard or a wall of empty-state cards.

Instead, the first-use experience should act as catalog onboarding.

Suggested flow:

1. Tenant resolves successfully from hostname.
2. Frontend determines that the tenant has no meaningful catalog content yet.
3. Normal discovery content is de-emphasized.
4. The user is invited to begin building the catalog.
5. The user chooses the available catalog domain they want to start with.
6. If Books is chosen, Book Build Mode opens.
7. If Albums is available, the frontend may route into the appropriate album intake workflow.

For an implementation in which Books is the only domain with a completed high-throughput Build workflow, the primary CTA should be:

> **Build Your Book Library**

This is onboarding into an already provisioned tenant library, not creation of a new backend library container.

---

## 9. Returning to an Empty Catalog

If a tenant later removes all catalog content, the application may return to the same onboarding-oriented empty state.

This does not mean the tenant itself has ceased to exist.

The hostname, tenant database, configuration, and theme remain valid; only the catalog is empty.

Locally persisted Build sessions should still be handled according to their tenant-scoped session rules.

---

## 10. Book Build Mode

Book Build Mode is the high-throughput intake workflow for cataloging an existing physical book collection.

It is not a replacement for ordinary Add Book.

The conceptual distinction is:

- **Add Book:** I have one book.
- **Book Build Mode:** I have a shelf full of books.
- **Bulk Selection:** These books already exist in the catalog and I want to modify them.

The guiding prompt remains:

> **What's going on shelf ____?**

Book Build Mode is shelf-first and scan-first.

---

## 11. Entering Book Build Mode

Book Build Mode should be reachable from:

- empty-catalog onboarding;
- the Books area as a first-class utility;
- an appropriate management/intake surface.

It should not be buried inside the ordinary Add Book form.

Entering Build Mode does not create catalog rows.

---

## 12. Choose the Destination Shelf First

The first required Build action is selecting one destination shelf.

The chosen shelf applies to the reviewed items eventually imported from that session.

Example:

```text
Building shelf: D3
```

The destination should remain visible throughout the workflow.

The user should not have to choose `D3` independently on every scanned Book.

If the queue is empty, changing the selected shelf is harmless.

Once scans exist, changing the shelf should require an intentional confirmation because it changes the eventual destination of the current session.

Changing the selected shelf does not immediately mutate existing catalog records.

---

## 13. Optional Session Defaults

Build Mode may support session-wide defaults already supported by the Build import contract.

V1 should include:

- required destination shelf;
- optional acquisition source.

Do not turn Build Mode into a generic bulk editor merely because other Book fields exist.

Fields such as:

- categories;
- rating;
- read status;
- notes;
- purchase date;
- completion date;

remain per-book unless separately designed later.

---

## 14. Continuous Scanning

After a shelf is selected, scanning becomes the primary interaction.

Support the existing Book ISBN input methods where practical:

- hardware barcode scanner;
- camera scanner;
- manual ISBN entry.

After each accepted scan:

1. normalize and validate using the normal ISBN behavior;
2. add the ISBN to the local Build queue;
3. provide immediate visual confirmation;
4. provide existing scanner/audio feedback where appropriate;
5. clear the input;
6. restore focus immediately.

The intended hardware-scanner rhythm is:

```text
scan
scan
scan
scan
scan
```

without mouse interaction between books.

Scanning never creates a Book.

---

## 15. Local Build Session

The unfinished Build session remains frontend-owned.

It should survive ordinary accidental interruption where practical, including:

- refresh;
- leaving Build Mode;
- navigating elsewhere in the same tenant.

The persisted session should include enough state to resume meaningful work:

- tenant username;
- destination shelf;
- optional acquisition source;
- scanned ISBNs;
- lookup results;
- manually edited drafts;
- review decisions;
- import readiness;
- duplicate/existing-record decisions.

Recommended conceptual key:

```text
shade-build:<tenant-username>:books
```

For example:

```text
shade-build:andy:books
shade-build:jamie:books
```

A Build session belonging to one tenant must never appear under another hostname.

If an unfinished session exists, entering Book Build Mode should offer an explicit Resume or Discard path rather than silently replacing it.

No backend Build-session table is required for this first implementation.

---

## 16. Session Queue

The queue represents scanned physical items that have not yet become catalog records.

Each queue item should make its current state obvious.

Useful states include:

- scanned / awaiting lookup;
- looking up;
- found;
- not found;
- provider error;
- missing required metadata;
- existing owned match;
- wishlist-only match;
- Ready;
- intentionally skipped.

Duplicate scans within the same Build session should be flagged rather than silently duplicated.

A duplicate ISBN is not automatically invalid because the catalog supports multiple physical copies.

The interface should distinguish:

- duplicate scan within this local intake session;
- an ISBN already existing in the tenant catalog.

---

## 17. Batch Metadata Lookup

The user may accumulate multiple scans and then perform metadata lookup across the queue.

Batch lookup must be non-mutating.

The backend should return one result per requested ISBN with:

- normalized ISBN;
- lookup status;
- lookup draft when found;
- explicit missing metadata information;
- existing catalog matches.

Book lookup drafts must follow the current Book contract, including ordered author-name arrays.

Conceptual draft:

```json
{
  "isbn13": "9780140449266",
  "title": "The Count of Monte Cristo",
  "authors": ["Alexandre Dumas"],
  "publisher": "Penguin Books",
  "publication_date": "2003",
  "pages": 1276
}
```

A lookup draft may contain:

```json
"authors": []
```

when the provider has no author names, but that item cannot become Ready for persistence until valid author data is supplied according to the Book create contract.

Provider failure for one ISBN must not invalidate the lookup results for unrelated ISBNs in the batch.

---

## 18. Metadata Review

Lookup is followed by deliberate review before persistence.

Each item should expose enough information to judge what the provider returned:

- ISBN;
- title;
- ordered authors;
- publisher;
- publication date/year;
- pages;
- missing lookup-supported metadata;
- existing catalog matches.

Required missing fields block Ready state.

Optional missing fields should remain visible without necessarily blocking import.

The user may manually correct or complete a draft without rescanning the physical book.

Lookup failures and genuine Not Found results must remain distinct states.

Provider failures should be retryable.

---

## 19. Existing Catalog Matches

Matching ISBN does not mean the new physical copy is invalid.

If batch lookup finds existing owned Books:

- show **Already in Library** or equivalent;
- show the matching records clearly enough for the user to understand the conflict;
- allow Skip;
- allow deliberate creation of another physical copy.

Existing matching Books must never be implicitly modified merely because the ISBN matched.

Existing-record identifiers exposed by the frontend/API should follow the post-FEAT-17 Book contract and use `book_id`.

---

## 20. Wishlist-Only Matches

If an ISBN matches a Book record that exists only as wishlist membership rather than as an owned shelved copy, flag it separately.

Offer an explicit action such as:

> **Acquire Existing**

Acquiring the wishlist item should:

- reuse the existing Book record;
- remove the conflicting wishlist membership as required by backend rules;
- assign the Book to the Build session destination shelf;
- preserve other valid Book data.

No wishlist Book is acquired merely because its ISBN appears in the Build queue.

This must always be an explicit review decision.

---

## 21. Ready State

Only reviewed items can become Ready.

A Ready item must satisfy the same persistence rules as ordinary Book creation after all current backend contracts have landed.

This includes, among other applicable rules:

- valid normalized ISBN where supplied;
- required title;
- at least one valid author name;
- no invalid/duplicate author names under the Book author contract;
- valid pages/rating/category data where supplied;
- explicit resolution of existing-record conditions;
- a known Build action: create new physical copy or acquire eligible existing wishlist record.

Build Mode should reuse Book semantics rather than maintain a separate frontend definition of a valid Book.

---

## 22. Import Reviewed Subset

The queue and the import payload are intentionally not the same thing.

Example:

```text
40 scans
32 Ready
8 unresolved
```

Only the 32 Ready items are submitted.

The unresolved eight remain local.

The final Build import request applies:

- one required destination shelf;
- optional session acquisition source;
- the submitted reviewed actions.

The submitted subset is transactional.

Either every submitted action commits or none of them do.

If import fails:

- preserve the complete local Build session;
- keep Ready decisions;
- show the error;
- allow correction or retry.

If import succeeds:

- remove successfully imported items from the local queue;
- retain unresolved/unsubmitted items.

The backend remains stateless with respect to unfinished Build-session state.

---

## 23. Finishing a Shelf

Importing the Ready subset and finishing the shelf are separate actions.

After a successful import:

- unresolved items may remain;
- the user may continue resolving them;
- the user may run additional lookups;
- the user may import another reviewed subset.

`Finish Shelf` means the user is intentionally done with that local intake session.

If unresolved items remain, warn before discarding them.

Completing the shelf clears that tenant's local Book Build session.

The next obvious action should be:

> **Build Another Shelf**

The intended rhythm is:

```text
choose shelf
→ scan
→ lookup
→ review
→ import
→ resolve exceptions
→ finish shelf
→ next shelf
```

---

## 24. Album / Music Catalog Domain

The album plan adds Albums as a parallel catalog domain inside the same tenant library.

Albums are not Book records and must not appear in `GET /books`.

The frontend should consume the dedicated Album contract for:

- album list/detail/create/update;
- artists;
- tracks;
- genres;
- format;
- metadata lookup;
- checkout/check-in;
- mark played;
- dashboard album metrics;
- wishlist album membership where supported.

The application may give the Music domain a different visual metaphor, such as a record shop or listening room, while preserving the same overall Shade Library shell.

Moving between Books and Albums changes catalog domain, not tenant identity.

---

## 25. Future Album Intake / Build Workflow

Book Build Mode should not be generalized prematurely into one backend-neutral intake API.

A future album intake workflow may share frontend interaction patterns such as:

- scan rapidly;
- accumulate local drafts;
- batch or repeated lookup;
- review;
- import only approved items;
- persist unfinished local work.

But album intake should use album-specific concepts and APIs, such as:

- barcode / UPC;
- Discogs release ID;
- MusicBrainz identifiers;
- artists;
- tracks;
- media format.

The backend album lookup remains separate from Book ISBN lookup.

Shared frontend components are welcome where behavior genuinely overlaps, but the contracts remain media-specific.

---

## 26. Shared Shelves

Books and Albums may both use the shared shelf catalog, but through their own membership tables and media-aware backend rules.

The frontend must not assume that one shelf assignment endpoint or membership object can blindly handle all media.

Books use Book shelf behavior.

Albums use Album shelf behavior.

The UI should honor backend enforcement preventing invalid mixed-media use where the finalized album contract requires it.

---

## 27. Loans and Circulation

Loans are a shared tenant concept that can contain Book or Album loans after the album workstream lands.

Frontend loan rows should determine their media kind from the typed catalog references in the finalized contract:

- `book_id`;
- `album_id`.

Exactly one represents the loaned catalog object.

Book actions continue to use Book checkout/check-in routes.

Album actions use Album checkout/check-in routes.

The Loans UI may offer a shared history/active-loans experience while adapting labels and links according to the loaned media.

---

## 28. Wishlists

Wishlists become media-aware within one tenant.

A wishlist may contain both Books and Albums once the album wishlist contract ships.

The frontend should treat each membership as a typed catalog reference according to the finalized backend contract.

Wishlists must remain tenant-scoped through the normal `Library-Username` request context.

Book Build Mode's wishlist-acquisition behavior remains Book-specific even though the broader wishlist may also contain Album memberships.

---

## 29. Collections

Collections remain a shared tenant catalog concept with media-specific membership behavior.

The frontend must follow the finalized album contract rather than assuming a generic polymorphic collection item.

Book collection behavior remains valid.

Album collection schema/support may exist separately from the frontend HTTP work that exposes it.

The frontend should not infer album collection operations that the shipped API has not yet exposed.

---

## 30. Dashboard

The Dashboard remains tenant-scoped and may summarize multiple media domains.

Book fields retain Book meaning.

Album support adds separate/additive Album metrics rather than silently redefining Book counts.

The frontend should therefore avoid labels that imply a Book-only dashboard when rendering media-wide information.

Examples of domain-aware presentation may include:

```text
Books
- total books
- read / unread
- book borrowing

Albums
- total albums
- played / unplayed
- album borrowing
```

Book incomplete-metadata workflows remain Book-specific unless a later album incomplete-metadata feature is explicitly added.

---

## 31. Themes / Skins

Themes alter presentation, not product semantics.

A theme may change:

- palette;
- background texture;
- wordmark treatment;
- decorative assets;
- paper/card surfaces;
- restrained component styling.

A theme must not change:

- API behavior;
- routes;
- metadata meaning;
- tenant identity;
- Book/Album persistence rules;
- accessibility requirements;
- core navigation hierarchy.

In the PLAN-02 implementation, tenant identity selects the theme from a frontend username-to-theme map.

Conceptually:

```text
andy → theme configuration A
jamie → theme configuration B
```

This may later be replaced with a configurable/persisted theme system without requiring catalog components to be redesigned.

---

## 32. Media-Specific Visual Language

The active media domain may change decorative language while retaining a recognizable application shell.

### Books

Behavioral identity:

- ISBNs;
- authors;
- shelves;
- covers;
- reading;
- circulation;
- Book Build Mode.

Visual direction:

- private library;
- index/catalog cards;
- paper;
- wood;
- literary desk objects.

### Albums / Music

Behavioral identity:

- albums;
- artists;
- tracks;
- formats;
- music metadata;
- listening/played state.

Visual direction:

- listening room;
- record shop;
- record sleeves;
- music catalog motifs.

A new media domain should not require the entire application shell to be reinvented.

---

## 33. Stable Application Shell

The shell should remain recognizable across media domains.

Keep stable:

- primary navigation location;
- tenant identity treatment;
- management access;
- search/browse conventions;
- detail-page hierarchy;
- accessibility behavior.

Adapt where appropriate:

- labels;
- icons;
- discovery content;
- metadata forms;
- build/intake utilities;
- decorative assets;
- domain-specific dashboard panels.

The shell should make it clear which tenant is active and which media domain is being viewed without conflating the two concepts.

---

## 34. Manage Collection

Manage Collection remains an administration area for the active tenant's catalog.

It should not create a new tenant library.

Appropriate responsibilities may include:

- Book catalog intake / Build Mode entry;
- shelves;
- collections;
- metadata cleanup;
- catalog utilities;
- tenant-specific presentation/settings supported by the frontend;
- future media-domain management.

Adding another tenant such as a new friend remains an operator/deployment action under PLAN-02, not a Manage Collection button.

---

## 35. Backend Capabilities Required by This Frontend Vision

The frontend depends on the backend plans providing the following capabilities.

### Tenant support

- Require a valid `Library-Username` on protected routes.
- Route each tenant to its own SQLite database.
- Keep catalogs isolated structurally.
- Return an error for missing/unknown/disallowed tenant identity rather than falling back.
- Apply all relevant schema changes independently to every tenant database.
- Scope backup and other protected operations to the active tenant.

### Books / Build Mode

- Non-mutating batch ISBN lookup.
- Per-item lookup status.
- Missing lookup-supported metadata.
- Existing Book detection.
- Explicit wishlist-only acquisition.
- Atomic reviewed-subset Build import.
- Book contracts aligned with ordered `authors: string[]`.
- Existing Book identifiers aligned with `book_id`.

### Albums

- Parallel `/albums` catalog APIs.
- Album artists/tracks/genres and metadata lookup.
- Album loan support.
- Album played state.
- Additive album dashboard metrics.
- Album-aware wishlist membership according to the finalized FEAT-15–23 contract.

No runtime API for creating/listing/deleting tenant libraries is required by this frontend workflow under PLAN-02.

---

## 36. End-to-End Tenant Lifecycle

### Provisioned Tenant — First Use

```text
1. Operator provisions tenant in deployment/config.
2. User opens the tenant hostname.
3. Frontend derives Library-Username from hostname.
4. Backend routes requests to that tenant's SQLite file.
5. Frontend loads that tenant's theme.
6. Catalog is empty.
7. Frontend presents catalog onboarding.
8. User chooses Books.
9. Book Build Mode opens.
10. User chooses a shelf.
11. User scans, reviews, and imports.
12. User finishes the shelf.
13. User repeats for additional shelves.
14. User enters normal library use.
```

### Normal Use

```text
1. Open tenant hostname.
2. Tenant/theme resolve automatically.
3. Navigate between Books, Albums, Circulation, Wishlists, Collections, Shelves, Dashboard, and Manage.
4. Every request remains scoped to the same tenant database.
```

### Moving to Another Tenant

```text
1. Open the other tenant hostname.
2. Frontend derives the other Library-Username.
3. Other tenant database and theme load.
4. No cached catalog or Build session from the previous tenant leaks across.
```

---

## 37. Non-Negotiable Product Boundaries

- Hostname/`Library-Username` defines the active tenant library.
- Each tenant library maps to its own SQLite database under PLAN-02.
- The application does not create tenant libraries at runtime.
- Adding a tenant is an operator/configuration action.
- Books and Albums are catalog domains inside the same tenant library.
- Switching media domain does not switch tenant database.
- Switching tenant means changing hostname.
- Book Build Mode is shelf-first and scan-first.
- Scanning and lookup do not create Book records.
- Unfinished Book Build sessions remain frontend-owned in V1.
- Build-session persistence is tenant-scoped.
- Only reviewed Ready items are submitted.
- Submitted Build imports are atomic for the reviewed subset.
- A failed import must not destroy the local Build session.
- Book lookup/create contracts follow the later Book author and `book_id` contracts.
- Album UI follows the finalized FEAT-15–23 backend contract rather than inventing a generic media schema.
- Themes alter presentation, not catalog semantics.
- Theme selection in PLAN-02 is initially configuration-driven by tenant username.
- Tenant catalog data must never leak across frontend caches, local storage, or API calls.

---

## 38. Future Extensions Enabled by This Model

This architecture leaves room for:

- an Album-specific high-throughput Build/intake mode;
- Movie/DVD catalog support;
- Comic catalog support;
- additional media-domain visual treatments;
- reusable frontend intake components where domain behavior overlaps;
- configurable theme packs;
- community-contributed themes;
- future server-side Build-session persistence;
- cross-device Build-session resume;
- richer tenant settings;
- a future tenant-management system if PLAN-02 is deliberately replaced by a new plan;
- a future support/owner tenant switcher if access policy explicitly allows it.

Those extensions should not be treated as shipped or implied by the current backend plans.

---

## 39. Summary

Shade Library should be tenant-aware without inventing an in-app multi-library registry.

The tenant hostname is the top-level library identity:

```text
hostname
→ Library-Username
→ tenant SQLite database
→ tenant theme
```

Inside that tenant, Books and Albums are sibling media domains sharing the same application and tenant boundary while preserving their own catalog contracts.

For Books, Build Mode remains the initial high-throughput catalog workflow:

```text
choose shelf
→ scan rapidly
→ batch lookup
→ review
→ import Ready subset
→ resolve exceptions
→ finish shelf
→ repeat
```

The frontend owns unfinished Build state, scoped to the active tenant. No scan or lookup becomes catalog data until final import.

Albums should plug into the same tenant-aware application as a separate catalog domain, using the FEAT-15–23 backend contract rather than becoming a separate tenant library.

This structure keeps PLAN-02 authoritative for isolation, keeps FEAT-15–23 authoritative for Book/Album catalog semantics, and lets Build Mode operate cleanly inside both without introducing a competing library-container model.
