# Smart Home Software Roadmap

**Status:** Planning notes — September 2026  
**Purpose:** Define the software roadmap that lets the existing Shade
catalog participate in the physical-library system while keeping library
data, device control, and automation responsibly separate. The companion
[`smart-home-hardware-roadmap.md`](smart-home-hardware-roadmap.md) owns
the Pi/server equipment, network, Home Assistant installation, NFC/LED
hardware, and physical-library build-out.

------------------------------------------------------------------------

## 1. Guiding Idea

Shade already understands the digital library: individual book copies,
shelves, collections, loans, reading state, QR labels, code resolution,
and filtered catalog results. Smart Shade is the next layer: it makes
those existing facts useful in the room without making the catalog into a
smart-home platform.

The central interaction is:

```text
find or filter books in Shade
             │
             ▼
select the matching stable book IDs
             │
             ▼
translate IDs through a physical shelf map
             │
             ▼
light the applicable shelf or book position locally
```

This works in the other direction too:

```text
physical shelf / NFC tag / shelf photograph
             │
             ▼
context for a Shade library workflow
             │
             ▼
catalog placement or map reconciliation
```

The design rule is:

> **Shade remains the source of truth for library facts. Smart Shade
> translates approved library intent into physical-library actions.
> Home Assistant remains the source of truth for devices and household
> automation.**

------------------------------------------------------------------------

## 2. Current Position

The foundation is farther along than a greenfield physical-computing
project. The current Shade product already provides a meaningful set of
the identities and workflows that Smart Shade needs.

### Dependency checklist

Checked items are capabilities present in the current Shade frontend and
documented backend contract. An unchecked item is a planned dependency;
it is not authorization to invent an API before its contract is designed.

#### Catalog and identity

- [x] Stable per-copy book identity (`BookRead.book_id` UUID).
- [x] Stable shelf resource identity (`ShelfRead.shelf_id`).
- [x] Human-readable shelf names, separate from shelf IDs.
- [x] Book placement state and shelf membership in the catalog.
- [x] Structured book metadata for filtering and reconciliation
  candidates (title, authors, ISBN, categories).
- [x] QR labels using tenant-free `shade:v1:book:<book_id>` payloads.
- [x] Safe server-side catalog-code resolution for Shade labels and
  commercial identifiers.
- [ ] A canonical, physical-ready `book_id → shelf_id` relation in the
  transport contract. Current book placement commonly exposes
  `shelf_name`; Smart Shade must not depend on a mutable display name.
- [ ] A stable shelf NFC/deep-link contract.

#### Existing workflows that can become physical-aware

- [x] URL-backed catalog filters and infinite book results.
- [x] Explicit book selection and atomic bulk move-to-shelf.
- [x] Single-book shelf changes through normal catalog editing.
- [x] Hardware/camera scan entry points and collection ISBN jump.
- [x] Shelf management UI and shelf-detail/count presentation.
- [ ] A shelf-specific mobile route suitable for NFC entry.
- [ ] Contextual NFC selection for bulk import/add and bulk move.
- [ ] A "Find on shelf" action on a book detail.
- [ ] A "View on shelves" action for the current results/selection.
- [ ] A physical-display session UI, including clear/expiry/device-error
  feedback.

#### Spatial mapping and staleness

- [ ] Persistent shelf-map record and map revision.
- [ ] Persistent normalized book spine coordinates (`x_start`, `x_end`).
- [ ] Mapping confidence and source (manual, photo-assisted, corrected).
- [ ] Automatic stale-map marking on single placement changes.
- [ ] Atomic stale-map marking for bulk move, removal, and import flows.
- [ ] A manual, mobile-friendly shelf mapping editor.
- [ ] Shelf-photo capture and storage policy.
- [ ] Local CV/OCR-assisted reconciliation workflow.

#### Physical integration and operations

- [ ] A separately deployed Smart Shade / Shade Physical service.
- [ ] Local service authentication and narrowly scoped credentials.
- [ ] Shelf-to-controller/LED calibration storage.
- [ ] WLED adapter and one-shelf hardware prototype.
- [ ] Optional Home Assistant adapter for device state and automations.
- [ ] Durable events/outbox or webhook delivery for catalog placement
  changes.
- [ ] Command/session status, expiry, controller-health, and audit model.
- [ ] Backup/restore plan for physical maps and calibration.

------------------------------------------------------------------------

## 3. What the New Software Is—and Is Not

The new software should be a small, local service called **Smart Shade**
(or **Shade Physical** in APIs and repositories). It is not a second
catalog, a browser-only feature, or a replacement for Home Assistant.

### Responsibilities

| Component | Owns | Must not own |
| --- | --- | --- |
| Shade | Books, shelves, book/shelf identities, placement, filters, loans, catalog workflows, map freshness | LED pixels, WLED credentials, generic home devices |
| Smart Shade | Map projections, controller calibration, physical-display sessions, conversion from positions to LED segments, local device adapters | Independent book/shelf truth, checkout, catalog filtering semantics |
| Home Assistant | Devices, rooms, WLED entities, automations, sensors, voice exposure | Book records, physical book coordinates, catalog policy |
| WLED / ESP32 | Strip-level pixels, brightness, effects, electrical behavior | Library identity, workflow decisions |
| CV/OCR worker (later) | Image analysis proposals and confidence scores | Final catalog or spatial-map decisions without user confirmation |

### How they interact

```text
Phone / browser
      │ authenticated HTTPS
      ▼
Shade frontend ───────────► Shade API / backend
                                  │
                      approved local command or event
                                  ▼
                         Smart Shade service
                          ├── physical-map store
                          ├── calibration store
                          ├── WLED local API
                          └── Home Assistant API/events (optional)
                                      │
                                      ▼
                                ESP32 / LEDs
```

The frontend normally speaks only to Shade. A Shade API endpoint creates
or clears a physical-display session after it has resolved the requested
book IDs. Shade then communicates with Smart Shade over an authenticated
local network boundary. This keeps Smart Shade off the normal browser
attack surface and stops the frontend from handling device secrets.

For an early prototype, Shade may call Smart Shade synchronously and
report whether the command was accepted. The production shape should add
durable delivery or an outbox/event stream so placement changes and
longer-running operations are not silently lost during a restart.

### Side-by-side build and mounting plan

Build and deploy the systems side by side—not as one merged process. The
physical server, network, Home Assistant, controllers, wiring, NFC tags,
and LED installation requirements are specified in the
[hardware roadmap](smart-home-hardware-roadmap.md):

```text
local server / Pi or later small server
├── Shade frontend container / static host
├── Shade backend + database
├── Smart Shade service + physical-map database/schema
├── Home Assistant (separate supported installation/container/host)
└── optional later CV/OCR worker

LAN
├── NFC-capable phones → Shade HTTPS route
├── Smart Shade → WLED controllers
└── Home Assistant → WLED and household devices
```

- Keep the existing Shade deployment and its database independently
  deployable and restorable.
- Mount Smart Shade beside it as a separate service with its own
  configuration, health check, logs, release cadence, and persistent
  data volume.
- Do not mount its storage inside Shade's database directory or give it
  unrestricted database access. Prefer a versioned API plus explicit
  events; a read-only replica/adapter is a possible later optimization,
  not the initial boundary.
- Put WLED controllers on stable LAN addresses. Smart Shade owns their
  endpoint configuration; Home Assistant can discover/expose them for
  household automation.
- Home Assistant should remain independently usable if Shade is down.
  Conversely, Shade must remain fully usable if Home Assistant, WLED, or
  Smart Shade is unavailable.
- Keep image-analysis jobs and shelf photographs out of the frontend
  container. They need explicit retention, backup, and deletion rules.

------------------------------------------------------------------------

## 4. The Physical Data Model

### Stable IDs

`book_id` is the canonical identity for a physical copy. `shelf_id` is
the canonical identity for a physical shelf. Display names such as `C3`
may change and are never a durable physical reference.

NFC tags should contain a minimal reference such as a local HTTPS URL or
custom link resolving to `shelf_id`. They must not contain credentials,
database paths, controller addresses, or a writable action.

### Spatial positions

Store spatial meaning independently from electrical hardware:

```text
book_id:     2f…
shelf_id:    83…
x_start:     0.382
x_end:       0.411
map_revision: 14
```

`0.0` is the left edge and `1.0` the right edge of the usable shelf
span. Smart Shade later transforms those coordinates through a
controller calibration:

```text
shelf_id:    83…
controller:  library-bookcase-a
pixel_start: 180
pixel_end:   239
orientation: left-to-right
```

No book record should permanently store raw LED pixel numbers.

### Map freshness

A map becomes stale when catalog placement may no longer match reality:

- a book is moved to another shelf;
- a book is removed/deleted;
- a bulk move or import changes shelf contents;
- a mapped book becomes wishlisted, unshelved, stashed, or otherwise
  leaves the physical shelf;
- a user explicitly marks the shelf rearranged.

One move affects both the source and destination maps. Bulk operations
must mark all affected shelves in the same successful operation; never
issue one per-book request solely to update physical state.

------------------------------------------------------------------------

## 5. Smart Shade Interaction Vocabulary

| User intent | Shade action | Physical response |
| --- | --- | --- |
| Find one title | Resolve one book ID and request a short session | Warm amber pulse at its mapped position |
| View filtered results | Send the already-resolved result IDs | Steady warm-ivory positions, across mapped shelves |
| Select bulk-move destination | Set a shelf context | Whole destination shelf softly glows |
| Add a book | Suggest destination after normal intake | Destination shelf glows; later, insertion gap highlights |
| Tap shelf NFC tag | Resolve `shelf_id` and current workflow context | Open browse, select destination, or start map flow |
| Clear physical view | End session | LEDs return to their prior/normal state |
| Missing/stale map | Preserve normal catalog result | Explain that the physical location is unavailable or needs remapping |

Use warm ivory and amber as the normal physical vocabulary. Reserve red
for real conflicts or errors, and avoid effects that conceal library
meaning behind decoration.

------------------------------------------------------------------------

## 6. Ordered Software Roadmap

## Stage 1 — Contract and safety foundation

**Goal:** Make physical references stable without adding hardware.

- Add a backend-supported book-to-`shelf_id` relation for physically
  shelved books.
- Specify physical-map, coordinate, map-revision, and stale-state API
  models.
- Define placement-change invalidation semantics for create, edit,
  bulk move, wishlist moves, stash, delete, and import paths.
- Define Smart Shade service authentication, health checks, and local
  network topology.
- Decide ownership of maps and calibrations: Shade owns map semantics;
  Smart Shade owns hardware calibration.

**Milestone:** A precise API contract exists and a shelf rename cannot
break a physical reference.

## Stage 2 — NFC shelf identity and mobile context

**Goal:** Make a physical shelf a safe, useful UI entry point.

- Add a shelf route addressed by `shelf_id`.
- Add NFC/deep-link resolution with invalid/removed-tag handling.
- Add normal shelf browse, bulk destination selection, and mapping entry
  contexts.
- Preserve existing picker-based workflows for devices without NFC.

**Milestone:** Tapping a shelf opens the right Shade context without
requiring LEDs or computer vision.

## Stage 3 — One-shelf Smart Shade prototype

**Goal:** Prove catalog-to-room output without changing catalog behavior.

- Create Smart Shade as a separate local service.
- Add one WLED controller, one strip, channel, diffuser, and calibration
  record.
- Implement session create, replace, expiry, clear, and hardware status.
- Start with a whole-shelf glow; add a manual mapped-position pulse only
  after calibration works.

**Milestone:** A Shade book detail can reliably make one real shelf—or
one manually mapped location—light up.

## Stage 4 — Shade physical-display features

**Goal:** Expose physical output as an optional extension of existing
library workflows.

- Add **Find on shelf** to Book Details.
- Add **View on shelves** to catalog results and explicit selection.
- Show physical-map status and clear/replace controls.
- Make bulk move and intake destination cues opt-in.
- Ensure a controller failure never blocks browsing, loans, intake, or
  normal shelf moves.

**Milestone:** A phone filter can reveal currently mapped matching books
without duplicate filtering logic in Smart Shade.

## Stage 5 — Trusted manual mapping

**Goal:** Make positions maintainable with no AI dependency.

- Build a phone-friendly shelf map editor.
- Show expected catalog contents and allow order/boundary correction.
- Validate overlapping or missing spans.
- Publish immutable map revisions and mark a map current only after user
  confirmation.
- Surface stale maps after relevant catalog placement changes.

**Milestone:** One shelf can be remapped accurately after a rearrangement.

## Stage 6 — Photograph-assisted reconciliation

**Goal:** Reduce mapping effort while retaining user control.

- Capture a straight-on shelf image from the mapping route.
- Run local spine segmentation and OCR as an asynchronous job.
- Match only against Shade's expected books for that shelf.
- Present proposed boundaries/matches and confidence for correction.
- Apply only confirmed results to a new map revision.

**Milestone:** A user can rebuild a shelf map rapidly after a physical
rearrangement without trusting OCR as catalog truth.

## Stage 7 — Whole-library scale and final interactions

**Goal:** Make the physical and digital library operate as one coherent
system.

- Add more controllers/shelves and calibration tooling.
- Establish backup, restore, update, and failure-recovery procedures.
- Add filtered multi-shelf illumination and map-health reporting.
- Add insertion-gap guidance only after spatial order and map freshness
  are demonstrably reliable.
- Expose a small, curated set of Smart Shade actions to Home Assistant
  and voice systems.

**Milestone:** "Where is this book?" and "show these unread books" work
reliably in the real room.

------------------------------------------------------------------------

## 7. Smart Shade Service Contract

Smart Shade should receive concrete physical-display requests, not a
free-form Shade filter language. Shade remains responsible for applying
its filters and resolving the current matching `book_id` set.

Illustrative service boundary:

```text
Shade API → Smart Shade

create display session
  book_ids: [UUID, …]
  mode: find | filter | destination
  duration_seconds: bounded

clear display session
  session_id

get health/status
  controller state, active session, unmapped/stale counts
```

Smart Shade returns a status such as accepted, partially mapped,
unavailable, or expired. It must not accept arbitrary WLED commands from
the browser and must never interpret a book title, ISBN, or shelf label
as its canonical device identifier.

------------------------------------------------------------------------

## 8. Privacy and Resilience Rules

- Core catalog workflows remain available with no Smart Shade, Home
  Assistant, or internet connection.
- WLED and Home Assistant credentials live only in local service
  configuration, never in frontend code or QR/NFC payloads.
- Shelf images are private library data. Retain them deliberately,
  encrypt/secure their storage appropriately, and provide deletion.
- CV/OCR produces suggestions, not silent catalog or placement changes.
- A physical-display session is time-limited and replaceable; it should
  clear lights reliably on completion, error, or restart.
- Home Assistant receives only approved high-level library state/actions
  where useful, never unrestricted catalog/database access.
- Logs record operational facts—command IDs, controller health, mapping
  state—not unnecessary scans, images, secrets, or complete reading
  history.

------------------------------------------------------------------------

## 9. End State

```text
PHYSICAL SHELF                         DIGITAL LIBRARY
NFC tag / books / LEDs                 Shade catalog and workflows
        │                                         │
        └──────────────► Smart Shade ◄───────────┘
                         │
                 local device adapter
                         │
              WLED and Home Assistant
```

The endpoint is not a novelty LED feature. It is a reliable local
library interface: Shade knows what a copy is and where it belongs;
Smart Shade knows how to indicate that meaning in the room; Home
Assistant remains free to coordinate the surrounding home without
becoming the library catalog.
