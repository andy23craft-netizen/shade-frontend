# Smart Home Hardware Roadmap

**Status:** Planning notes --- September 2026\
**Purpose:** Consolidate the hardware, local-network, deployment, and
Home Assistant plan for Shade and the wider local-first home. This
document owns physical installation and equipment decisions. The
corresponding application architecture, API contracts, mapping model,
and frontend/service delivery plan live in
[`smart-home-software-roadmap.md`](smart-home-software-roadmap.md).

------------------------------------------------------------------------

## 1. Guiding Idea

The goal is bigger than putting Shade on a Raspberry Pi.

Shade currently understands the **digital library**: books, shelves,
collections, reading state, loans, filters, and workflows. The next
phase is to give it a **physical layer** so the software can both
understand and affect the real library.

At the same time, the Pi can become part of a broader **local-first home
infrastructure**:

-   Shade runs locally on hardware I control.
-   Home Assistant becomes the home's automation bus.
-   Existing devices are integrated where useful.
-   New devices should favor local protocols such as Zigbee,
    Ethernet/PoE, Matter/Thread, ESPHome, and local APIs.
-   Security cameras should record locally rather than requiring vendor
    cloud storage.
-   Voice control should eventually provide the convenience of
    Alexa/Siri without making a vendor's cloud the center of the house.
-   Shade should eventually be another "citizen" of that home automation
    system.

The architectural principle is:

> **Keep identity, automation, video, and physical-library state under
> local control whenever practical. Use cloud services only where the
> device or desired service genuinely requires them.**

------------------------------------------------------------------------

# 2. Immediate Raspberry Pi Setup

These are the things that can begin as soon as the Pi arrives.

## Decided Raspberry Pi BOM

The first Shade/Home Assistant host is a Compute Module 5 build:

| Part | Spec |
| ---- | ---- |
| Carrier | Raspberry Pi Compute Module 5 IO Board REV 2 |
| Module | Raspberry Pi Compute Module 5, Wireless, 8GB RAM, Lite -- CM5108000 |
| Cooling | Raspberry Pi Compute Module 5 Active Cooler |
| Case | Raspberry Pi Compute Module 5 IO Case REV 2 |
| Power | Raspberry Pi 27W USB-C Power Supply, Black, US |
| Antenna | Raspberry Pi WiFi Antenna kit |
| Primary SSD | AData Legend 860 PCIe Gen4 x4 M.2 2280, 500GB (SLEG-860-500GCS; up to 6,000 MB/s) |

Notes:

-   The Lite CM5 has no eMMC; boot and root live on the M.2 SSD (or a
    temporary microSD only for initial bring-up if needed).
-   The 500GB SSD is for OS, Shade, Home Assistant, and ordinary app
    data -- not continuous camera NVR retention.
-   Wireless + antenna kit covers Wi-Fi/Bluetooth when Ethernet is not
    yet available; prefer wired Ethernet once the network backbone
    exists.
-   This host is **not** assumed sufficient for a full NVR workload or
    heavy Edge AI inference. Those need separate hardware planning
    (see Sections 7 and 14).

## Phase 1 --- Establish the Pi as a Server

### Base system

-   Install the chosen Raspberry Pi OS/server environment.
-   Give the Pi a stable hostname.
-   Give it a stable LAN address, preferably through a DHCP reservation
    in the router.
-   Enable SSH.
-   Configure SSH keys rather than relying only on passwords.
-   Apply OS updates.
-   Confirm remote administration from the main Windows development
    machine.
-   Set up Git credentials/access for the Shade repositories.
-   Decide where persistent application data will live (default:
    the Legend 860 M.2 SSD).

### Storage

Do not treat a microSD card as long-term high-write storage. The CM5
Lite + Legend 860 SSD is the primary durable disk for this host.

Also plan:

-   Separate or larger SSD/HDD (or a dedicated NAS/NVR appliance) for
    security-camera recordings when cameras arrive -- not the 500GB
    application SSD alone.
-   Backup strategy for Shade and Home Assistant configuration.

### Deploy Shade

The first real deployment milestone should be:

> **Shade runs reliably on the Pi and is reachable from phones/computers
> on the home network.**

Tasks:

-   Clone/pull `shade-backend`, `shade-frontend`, and
    `shade-orchestrator`.
-   Establish production/local-server environment variables.
-   Deploy the existing container stack.
-   Confirm backend/database persistence.
-   Confirm frontend → backend routing.
-   Confirm tenant configuration remains `shade`.
-   Confirm phone access.
-   Test reboot recovery: the Pi should return to a working Shade
    deployment without manual intervention.
-   Establish a simple update/deployment procedure from the existing
    repositories.
-   Establish automated or easy backups before putting additional
    infrastructure on the machine.

This gives the Pi a useful job before any smart-home hardware is
purchased.

------------------------------------------------------------------------

# 3. Add Home Assistant

After Shade is stable, add Home Assistant.

Home Assistant should become the **automation/control layer**, not a
replacement for Shade.

Conceptually:

``` text
                    ┌───────────────┐
                    │     Shade     │
                    │ books/library │
                    └───────┬───────┘
                            │
                            │ local API/events
                            │
                    ┌───────▼───────┐
                    │ Home Assistant│
                    │ automation bus│
                    └───────┬───────┘
                            │
       ┌────────────────────┼─────────────────────┐
       │                    │                     │
     Zigbee               Network               Voice
       │                    │                     │
thermostats/sensors   Roku/cameras/etc.      Assist/Siri
```

Home Assistant should know **devices, rooms, states, automations, and
physical outputs**.

Shade should continue to know **books, shelves, collections, filters,
loans, reading state, and library workflows**.

The two can communicate without either system absorbing the other's
responsibilities.

------------------------------------------------------------------------

# 4. First Home Assistant Integrations

## Roku + Spotify --- Early Priority

This has moved near the top because it gives an immediate household
benefit.

Desired experience:

> "Play Fleetwood Mac on the living-room TV."

The eventual logical model should be:

``` text
PLAY [music] ON [room/device]
```

rather than creating separate automations for every artist or playlist.

Examples:

-   Play a particular artist on the living-room TV.
-   Play a Spotify playlist on the TV.
-   Play the cleaning playlist in a particular room.
-   Open Spotify on the Roku and hand playback to it.

Give devices natural household names such as:

-   Living Room TV
-   Bedroom TV

The objective is for the technology to disappear behind normal household
language.

### Voice

Liz already uses Siri for Spotify, so preserve that behavior rather
than forcing a new interface.

Long-term possibilities:

-   Home Assistant Assist app/voice.
-   Home Assistant local voice satellite.
-   Siri/HomeKit exposed Home Assistant entities/actions.
-   Multiple voice interfaces controlling the same underlying Home
    Assistant automations.

If Siri (or another phone assistant) can turn speech into structured
commands that Home Assistant or Shade already understand, prefer that
path for some voice use cases before buying dedicated speech-to-text /
text-to-speech Edge AI hardware. Dedicated Edge AI gear remains on the
research list for offline STT/TTS, image recognition, and workloads the
phone cloud path cannot own locally.

------------------------------------------------------------------------

## LG ThinQ Oven

Research/connect the existing LG ThinQ oven.

Likely useful capabilities include:

-   Temperature state.
-   Writable target temperature where supported.
-   Cook mode.
-   Operation state.
-   Preheat-complete event.
-   Cooking-complete event.
-   Error events.

Desired interaction:

> "Preheat the oven to 400."

Important: LG ThinQ is a **cloud integration**, so this is not part of
the fully local trust boundary.

Also distinguish:

-   **Oven preheat/control** → LG ThinQ integration.
-   **"Set a 20-minute timer"** → can be a Home Assistant voice timer
    rather than necessarily controlling the oven's built-in timer.

Exact functionality depends on the oven model and which entities LG
exposes.

------------------------------------------------------------------------

## Robot Vacuums

### iRobot

Connect and identify the exact model.

Home Assistant has local support for many Roomba/Braava devices,
although compatibility varies by generation.

Desired eventual actions:

-   Start cleaning.
-   Pause.
-   Return to dock.
-   Report battery/charging.
-   Use cleaning state in automations.

### Bissell Mop Robot

Research exact model separately.

There is not currently an obvious official Home Assistant path
comparable to Roku/LG/iRobot. Possibilities to investigate:

-   Community integration.
-   Local API.
-   MQTT bridge.
-   Matter/HomeKit compatibility.
-   Vendor-cloud bridge.

Do not buy replacement hardware solely for integration until the
existing unit has been investigated.

------------------------------------------------------------------------

# 5. Zigbee Infrastructure

Zigbee should be one of the major local-device protocols for the house.

Good candidates:

-   Thermostats.
-   Temperature sensors.
-   Humidity sensors.
-   Door/window sensors.
-   Presence/motion sensors.
-   Buttons.
-   Smart plugs.
-   Light switches.
-   Some lighting.

## Coordinator

Current preferred candidate:

### SONOFF Dongle Max / Dongle-M

Why it is attractive:

-   Modern Silicon Labs EFR32MG24 radio.
-   Zigbee 3.0.
-   Ethernet/PoE.
-   Does not have to be physically attached to the Pi.
-   Can be positioned where Zigbee radio coverage is best.
-   External antennas.
-   Compatible with Zigbee2MQTT and appropriate Home Assistant
    configurations.
-   Can be dedicated permanently to the Zigbee network.

Preferred deployment:

``` text
Home Assistant / Pi
        │
      LAN
        │
    PoE switch
        │
    Ethernet + power
        │
SONOFF Dongle Max
        │
     Zigbee mesh
```

Use wired Ethernet rather than Wi-Fi for the coordinator.

Do **not** plan on making one radio simultaneously serve Zigbee and
Thread. If Thread/Matter becomes substantial later, give Thread its own
dedicated radio.

## ZHA vs. Zigbee2MQTT

Both remain viable.

### ZHA

Advantages:

-   Built directly into Home Assistant.
-   Simpler architecture.
-   Good first-time experience.

### Zigbee2MQTT

Advantages:

-   Broad device support.
-   Detailed device exposure/configuration.
-   Strong visibility into the Zigbee network.
-   Fits the more elaborate/self-hosted system this project is becoming.

Current leaning: **Zigbee2MQTT**, but this decision can be made during
Home Assistant setup.

------------------------------------------------------------------------

# 6. PoE & Wired Network Infrastructure

## What a PoE Switch Does

A network switch takes one Ethernet connection to the LAN and provides
many wired network ports.

A **PoE (Power over Ethernet) switch** can also supply electrical power
through those Ethernet cables.

Example:

``` text
Router / LAN
     │
     │ Ethernet
     ▼
  PoE Switch
     ├── Raspberry Pi / server connection
     ├── Zigbee coordinator
     ├── Front camera
     ├── Back camera
     ├── Driveway camera
     └── Future PoE devices
```

A compatible camera can therefore use one cable for:

``` text
DATA + POWER
```

instead of needing Ethernet/Wi-Fi plus a nearby electrical outlet.

## Current House Question

The house currently has one known **coax** location and multiple
Ethernet ports.

Before buying networking hardware:

### Do some house-network archaeology

Find:

-   Every Ethernet wall jack.
-   Where those Ethernet cables terminate.
-   Any structured-media panel.
-   Utility/communications closet.
-   Cable bundle near electrical equipment.
-   Existing network patch panel.
-   Whether the Ethernet jacks are actually terminated and usable.
-   Whether coax exists elsewhere but is hidden/unused.

The router does **not** necessarily have to move.

If the Ethernet runs converge somewhere useful, the router can remain
where Wi-Fi coverage is good while a PoE switch/server equipment lives
at the Ethernet termination point.

Possible final arrangement:

``` text
Coax
  │
Modem / Router
  │
existing Ethernet run
  │
  ▼
Network / server location
  │
PoE Switch
  ├── Pi
  ├── Zigbee coordinator
  ├── Cameras
  └── other wired devices
```

Alternatively, if coax can be brought to the central wiring location,
modem/router/switch/server equipment could eventually be consolidated
there.

## Switch Research

Do not buy a tiny non-PoE switch just to solve an immediate port
problem.

Research:

-   8-port vs. 16-port.
-   Gigabit Ethernet.
-   PoE+ / IEEE 802.3at.
-   Total PoE power budget.
-   Per-port power.
-   Fanless vs. actively cooled.
-   Managed vs. unmanaged.
-   VLAN support if security-camera/network isolation becomes desirable.
-   Reliability and idle power use.

Given the planned cameras plus Zigbee coordinator, an **8- or 16-port
Gigabit PoE+ switch** is likely the useful category.

------------------------------------------------------------------------

# 7. Local Security Cameras

This is planned as the **first purpose-bought smart-home hardware
system**.

The privacy objective is:

``` text
camera
  │
home network
  │
local NVR/storage
  │
Home Assistant
```

rather than:

``` text
camera
  │
vendor cloud
  │
subscription/service
  │
home
```

## Site plan before camera purchase

Do **not** firm camera SKUs, count, or power/network type until a
walkthrough answers:

-   How many cameras are desired (minimum useful set vs. later expand)?
-   Exact mount locations (front door, driveway, backyard, side yard,
    garage, interior choke points, etc.)?
-   Field of view and height for each location?
-   Day/night requirements and whether interior cameras are in scope?
-   For each location: can Ethernet be run reasonably, or is wireless
    the only practical path?

**PoE is preferred** wherever a cable run is feasible. This is an older
house, so fishing Ethernet can be difficult; wireless (or hybrid)
cameras may be required for some placements. That trade-off must be
documented per location before buying a uniform camera family.

Cable/site survey should happen alongside Section 6 network archaeology.

## Camera Requirements to Research

Once locations and count are known, favor cameras that:

-   Prefer PoE when cabling is practical; document wireless exceptions.
-   Support RTSP and/or ONVIF.
-   Can operate without mandatory cloud storage.
-   Do not require an active vendor subscription for basic recording.
-   Allow local network streaming.
-   Have good Home Assistant/NVR ecosystem support.
-   Continue recording if the internet connection is unavailable.
-   Have appropriate night vision.
-   Have useful person/object detection options without requiring cloud
    processing.

## NVR vs. Home Assistant

Keep these jobs separate.

### NVR

Responsible for:

-   Receiving video streams.
-   Continuous/event recording.
-   Retention.
-   Playback.
-   Camera-specific detection/inference if used.

The CM5 + 500GB application SSD is **not** the NVR platform. Expect
**additional hardware** for recording and retention.

A **NAS** may be a useful intermediate project: shared backups and
media storage first, then grow into (or host) NVR duties. That eases
into camera recording without jumping straight to a full NVR appliance.

### Home Assistant

Responsible for:

-   Automation.
-   Notifications.
-   Combining camera events with other sensors.
-   Turning on lights when a person is detected.
-   Announcing events.
-   Triggering household actions.

Example:

``` text
Driveway camera
      │
person detected
      │
      ├──── NVR saves footage
      │
      └──── Home Assistant
                 │
                 ├── phone notification
                 └── porch light on
```

## Storage

Do not continuously record security video to the CM5 application SSD
(or any microSD).

Research:

-   Dedicated SSD/HDD, NAS, or NVR appliance (separate from the CM5
    500GB disk).
-   Retention requirements.
-   Number of cameras (from the site plan above).
-   Resolution/frame rate.
-   Continuous vs. event-only recording.
-   NVR software (Frigate, Blue Iris, vendor NVR, NAS package, etc.).
-   Whether video inference needs a separate accelerator or mini PC.

------------------------------------------------------------------------

# 8. Smart Thermostats

Smart thermostats are a planned local-control addition.

## Primary Requirement

Prefer **Zigbee thermostats controllable locally through Home
Assistant** rather than Wi-Fi thermostats dependent on manufacturer
clouds.

Desired architecture:

``` text
Home Assistant
      │
Zigbee coordinator
      │
 Zigbee mesh
      │
 Thermostat
```

No thermostat vendor account should be required in that control path
when a suitable local model is available.

## Do Not Buy Yet

HVAC compatibility must be established first.

Before choosing thermostats, document:

-   Existing thermostat model.
-   Photograph of thermostat wiring.
-   Terminal labels.
-   C-wire availability.
-   Conventional furnace/AC vs. heat pump.
-   Heating/cooling stages.
-   Auxiliary/emergency heat if applicable.
-   Number of thermostats/zones.

Then research Zigbee thermostats that support the actual HVAC
configuration.

### Candidate to investigate

**Centralite Pearl 3157100**

Reasons it is interesting:

-   Zigbee.
-   Heating/cooling setpoints.
-   Temperature.
-   HVAC system mode.
-   Running state.
-   Fan mode.
-   Temperature calibration.
-   Battery state.

This is a research candidate, **not yet a purchase recommendation**.

## Why Thermostats Become More Interesting with Home Assistant

The wall thermostat no longer has to be the only source of truth.

Future Zigbee sensors can provide:

-   Bedroom temperature.
-   Library temperature.
-   Humidity.
-   Window/door state.
-   Presence.

That allows automations based on actual occupied-room conditions rather
than only the temperature measured in a hallway.

------------------------------------------------------------------------

# 9. Library Hardware Layer

This is the long-term library-specific physical-computing system. This
document covers the equipment and installation side; see the
[software roadmap](smart-home-software-roadmap.md) for system ownership,
physical-map records, Smart Shade, and application stages.

The useful mental model is:

> **Shade Physical is an API between the digital catalog and the
> physical library.**

The components have different jobs:

  -----------------------------------------------------------------------
  Layer                               Purpose
  ----------------------------------- -----------------------------------
  QR                                  Visually identifies a book/object

  NFC                                 Identifies a shelf/object through
                                      touch and supplies context

  OCR / computer vision               Lets Shade perceive the physical
                                      shelves

  Spatial mapping                     Connects a book UUID to a position
                                      on a real shelf

  LEDs                                Lets Shade communicate back into
                                      the physical library

  Home Assistant                      General physical-device/automation
                                      bus

  Shade Physical service              Translates library concepts into
                                      physical actions
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 10. Shade Physical Filters --- Dependencies

This is the key dependency chain for the feature:

> **Apply a filter in Shade → matching physical books illuminate on the
> shelves.**

For example:

-   Unread books glow.
-   Philosophy books glow.
-   Books published before 1950 glow.
-   Books matching several filters glow.
-   "Find on Shelf" causes one specific book position to pulse.

This requires substantially more than attaching LED strips.

## Dependency 1 --- Stable Book Identity

Already present in Shade. Its software contract and lifecycle are owned
by the [software roadmap](smart-home-software-roadmap.md).

Each physical copy needs a stable Shade book UUID.

The lighting system should never depend on:

-   Title text.
-   ISBN alone.
-   Shelf index.
-   Array position.

Those can change or be ambiguous.

**Canonical identity: book UUID.**

------------------------------------------------------------------------

## Dependency 2 --- Stable Physical Shelf Identity

Each physical shelf needs a stable identifier independent of its
human-readable name.

Example:

``` text
shelf_uuid: 83c7...
display_name: C3
```

If C3 is renamed or reorganized, its physical identity remains intact.

NFC tags should resolve to this identity.

Possible NFC payload:

``` text
shade://shelf/<shelf_uuid>
```

or a local Shade URL resolving to the shelf UUID.

------------------------------------------------------------------------

## Dependency 3 --- Book → Shelf Relationship

Shade already tracks which shelf a book belongs to.

Conceptually:

``` text
book UUID
   │
   ▼
shelf UUID
```

This tells Shade **which strip** should react, but not yet **where on
that strip**.

------------------------------------------------------------------------

## Dependency 4 --- Spatial Position on Shelf

Each book needs a position within its shelf.

Do **not** permanently store raw LED pixel numbers against books.

Instead use normalized shelf coordinates:

``` text
book_uuid: ...
shelf_uuid: ...
x_start: 0.382
x_end:   0.411
```

where:

-   `0.0` = left edge of shelf.
-   `1.0` = right edge of shelf.

Benefits:

-   LED strips can later be replaced.
-   Pixel density can change.
-   Shelf width can change.
-   The spatial model remains independent of lighting hardware.

------------------------------------------------------------------------

## Dependency 5 --- Shelf → LED Hardware Calibration

The physical lighting system needs to know which controller/LED range
represents each shelf.

Example:

``` text
Shelf C3
controller: bookcase-a
pixel_start: 180
pixel_end: 239
```

Then Shade Physical converts:

``` text
book x position
        ↓
shelf pixel range
        ↓
actual LED pixels
```

This separation is important. The installed hardware calibration is
documented here; its durable service/API model is defined in the
[software roadmap](smart-home-software-roadmap.md).

**Shade knows spatial meaning.\
The lighting layer knows electrical addressing.**

------------------------------------------------------------------------

## Dependency 6 --- Shelf Lighting Hardware

Each instrumented shelf needs:

-   Addressable LED strip.
-   Controller.
-   Power.
-   Wiring.
-   Mounting/channel.
-   Diffuser.

Initial prototype:

-   ESP32.
-   WLED.
-   1--5 m addressable LED strip.
-   Approximately 60 LEDs/m as a reasonable starting density.
-   Proper power supply.
-   Aluminum LED channel.
-   Frosted diffuser.

Do one shelf before designing the entire library installation.

The diffuser matters aesthetically: the desired effect is **a subtle
library indicator**, not exposed RGB dots or a gaming-PC bookshelf.

Preferred normal colors:

-   Warm ivory.
-   Amber.

Use strong red/green only where the workflow meaning benefits from it.

------------------------------------------------------------------------

## Dependency 7 --- Physical Control Service

The separate **Smart Shade** / **Shade Physical** service is required
to operate the installed hardware. Its implementation boundary,
authentication, data ownership, and deployment plan are defined in the
[software roadmap](smart-home-software-roadmap.md).

Responsibilities:

1.  Receive a list of matching book UUIDs from Shade.
2.  Resolve book → shelf.
3.  Resolve book → normalized position.
4.  Resolve shelf → LED controller/pixel range.
5.  Calculate pixels.
6.  Send commands to WLED/Home Assistant.
7.  Clear/replace previous physical filter state.

Conceptually:

``` text
Shade Filter
    │
    │ [book UUIDs]
    ▼
Shade Physical
    │
    ├── book → shelf
    ├── book → x position
    ├── shelf → controller
    └── x → pixels
            │
            ▼
      Home Assistant/WLED
            │
            ▼
         ESP32
            │
            ▼
       shelf LEDs
```

------------------------------------------------------------------------

## Dependency 8 --- Filter API / Frontend Action

Shade's frontend needs an explicit physical-display action. The feature
roadmap is owned by the [software roadmap](smart-home-software-roadmap.md);
this document records the hardware capabilities it will command.

Possible controls:

-   **View Results**
-   **View on Shelves**
-   **Light on Shelves**

The normal web filter should remain useful without physical hardware.

The physical action sends the resulting **book UUID set**, not the
filter expression itself, to Shade Physical.

That keeps Shade Physical simple and prevents it from duplicating
Shade's filtering logic.

------------------------------------------------------------------------

## Dependency 9 --- Mapping Workflow

Manually assigning normalized coordinates to hundreds of books would be
miserable.

The intended mapping workflow is:

1.  Tap shelf NFC tag.
2.  Choose **Map Shelf** / **Update Physical Map**.
3.  Take a straight-on photograph of the shelf.
4.  Shade already knows which books are expected on that shelf.
5.  Computer vision identifies spine boundaries.
6.  OCR reads likely title/author text.
7.  Expected Shade books constrain the matching problem.
8.  User corrects uncertain matches.
9.  Store normalized spine regions.

This is much easier than asking computer vision:

> "What are all these random books?"

Instead the task becomes:

> "Here are the 23 books that should be on C3. Match these 23 visible
> spines to them."

------------------------------------------------------------------------

## Dependency 10 --- Map Staleness

Any physical move can invalidate the position map.

Operations that should mark shelf maps stale include:

-   Bulk Add.
-   Bulk Move.
-   Single-book shelf change.
-   Book removal.
-   Major rearrangement.

Shade can then prompt:

> **C3's physical map may have changed. Update it?**

Tap shelf NFC → photograph → reconcile.

------------------------------------------------------------------------

# 11. NFC Shelf Workflows

NFC should not merely open a URL. Tag format, mounting, and read
reliability belong here; context resolution and Shade UI behavior are
specified in the [software roadmap](smart-home-software-roadmap.md).

The same shelf tag should mean different things depending on what the
user is currently doing.

## Normal browsing

Tap C3:

-   Open C3 in Shade.
-   Show its books.
-   Offer shelf actions.

## Bulk Add

Shade is waiting for a destination shelf.

Tap C3:

-   Destination = C3.
-   Continue scan/import flow.

No dropdown search required.

## Bulk Move

Shade is waiting for a destination.

Tap C3:

-   Destination = C3.
-   Confirm move.
-   Continue workflow.

## Mapping

Tap C3:

-   Open physical-map tools.
-   Take/update shelf photograph.

The important principle is:

> **The physical shelf becomes a contextual button in the UI.**

------------------------------------------------------------------------

# 12. Shade LED Interaction Vocabulary

The physical library should use a consistent visual language.

Suggested meanings:

  Action                       Physical response
  ---------------------------- --------------------------------------
  Find one book                Single warm amber pulse
  Filter results               Matching positions steady warm ivory
  Selected destination shelf   Whole shelf soft glow
  Insertion location           Small focused amber/green marker
  Wrong shelf / conflict       Restrained red indication
  Clear filter                 Lights return to normal/off

Avoid gratuitous rainbow effects.

The lights should feel like part of the library furniture.

------------------------------------------------------------------------

# 13. Future "Find the Gap" Shelving

One of the strongest final-form interactions:

1.  Scan/add a new book.
2.  Shade knows the destination shelf and sort order.
3.  Shade knows the spatial order of the books currently there.
4.  It calculates the correct insertion point.
5.  The **actual gap on the shelf lights up**.

Instead of:

> "Put this on C3."

Shade effectively says:

> **"Put it right here."**

This requires the complete hardware and software dependency chain, so it
belongs late in both roadmaps. See the
[software roadmap](smart-home-software-roadmap.md) for the data and
algorithm requirements.

------------------------------------------------------------------------

# 14. Hardware Research List

## Raspberry Pi / Server

**Decided (see Section 2 BOM):**

-   CM5 IO Board REV 2 + CM5108000 (Wireless, 8GB, Lite).
-   Active Cooler + IO Case REV 2.
-   Official 27W USB-C PSU (US) + WiFi Antenna kit.
-   AData Legend 860 500GB M.2 (application disk).

Still to decide:

-   Physical server location.
-   Backup storage (beyond the primary SSD).
-   UPS eventually.
-   Whether this host stays Shade/HA-only as NVR and Edge AI move
    elsewhere.

## Network

Research:

-   Existing Ethernet topology.
-   Cable termination point.
-   Patch panel if applicable.
-   8 vs. 16-port switch.
-   Gigabit.
-   PoE+.
-   PoE power budget.
-   Managed vs. unmanaged.
-   VLAN support.
-   Fanless vs. fan.
-   Router location.
-   Whether current Wi-Fi remains adequate.
-   Per-camera cable feasibility in an older house (feeds camera
    PoE vs. wireless decisions).

## Zigbee

Research:

-   SONOFF Dongle Max/Dongle-M.
-   Zigbee2MQTT vs. ZHA.
-   Coordinator placement.
-   Initial Zigbee router devices.
-   Zigbee channel vs. 2.4 GHz Wi-Fi channel planning.
-   Dedicated Thread radio later.

## Thermostats

Document before buying:

-   Current models.
-   Wiring photos.
-   C-wire.
-   HVAC type.
-   Stages.
-   Heat pump/conventional.
-   Number of zones.

Research:

-   Centralite Pearl 3157100.
-   Other US-central-HVAC Zigbee thermostats.
-   Current Zigbee2MQTT/ZHA compatibility.
-   Local operation with no vendor cloud.

## Security Cameras

**Prerequisite:** finish the site plan (count + install locations +
cable feasibility) before locking SKUs or a single camera family.

Then research:

-   PoE preferred; wireless where cable runs are impractical.
-   ONVIF / RTSP.
-   Local-only operation.
-   Night vision.
-   Resolution.
-   Field of view.
-   Weather rating.
-   Local person/object detection.
-   NVR compatibility.
-   Vendor-cloud independence.

## NVR / NAS

Additional hardware is required; do not overload the CM5 application
host.

Research:

-   NAS as an easing step (backups/shares first, then camera retention).
-   Dedicated NVR appliance or mini PC vs. NAS-hosted NVR software.
-   NVR software (Frigate, Blue Iris, vendor, NAS package).
-   SSD/HDD requirements separate from the CM5 500GB disk.
-   Retention period.
-   Event vs. continuous recording.
-   Number of streams (from camera site plan).
-   Hardware decoding.
-   Local AI inference placement (NVR box vs. separate Edge AI host).

## Edge AI

Expect **additional hardware** beyond the CM5 for serious local
inference. Research only after use cases are clearer:

-   Speech-to-text / text-to-speech (local Assist satellites, USB mics,
    accelerators).
-   Image recognition (shelf mapping, person detection assist).
-   Whether phone Siri/HomeKit can supply structured commands for some
    voice flows and reduce early STT hardware needs.
-   Accelerator options (Coral, Hailo, NPU mini PC, etc.) vs. staying
    phone/cloud-assisted for selected tasks.
-   Power, noise, and placement relative to the CM5 Shade/HA host.

## Shade Shelf Lighting

Prototype hardware research:

-   ESP32.
-   WLED.
-   Addressable strip type.
-   60 LEDs/m starting point.
-   Power requirements.
-   Wire gauge.
-   Voltage drop/power injection.
-   Aluminum channels.
-   Frosted diffusers.
-   Hidden wiring routes.
-   Controller placement.
-   Number of shelves per controller.

Do not purchase a library-wide LED system until one shelf prototype
works.

## NFC

Research:

-   Small adhesive NFC tags.
-   Read reliability through/near wood.
-   Tag placement.
-   Human-visible vs. hidden markers.
-   URL/deep-link format.
-   iPhone behavior.
-   Stable shelf UUID design.

------------------------------------------------------------------------

# 15. Ordered Roadmap to the Final Shade Physical System

This order intentionally alternates useful household improvements with
infrastructure Smart Shade will eventually reuse. Coordinate its
software milestones with the [software roadmap](smart-home-software-roadmap.md).

## Stage 1 --- Pi Foundation

**Goal:** Reliable local server.

-   Assemble CM5 IO Board REV 2 + CM5108000 + cooler + case + PSU +
    antenna + Legend 860 500GB SSD.
-   Networking (Ethernet preferred when available).
-   SSH.
-   Updates.
-   Git.
-   Deploy Shade.
-   Reboot recovery.
-   Backups.

**Milestone:** Shade is served from the Pi reliably.

------------------------------------------------------------------------

## Stage 2 --- Home Assistant Foundation

**Goal:** Establish the home's local automation bus.

-   Install/deploy Home Assistant.
-   Define rooms/areas.
-   Connect phones.
-   Learn entity/device/automation model.
-   Decide initial voice path.

**Milestone:** Home Assistant is stable and accessible.

------------------------------------------------------------------------

## Stage 3 --- Immediate Household Win: Roku + Spotify

**Goal:** Make something already used every day easier.

-   Discover/add Rokus.
-   Add Spotify.
-   Give TVs natural names.
-   Test Spotify playback destinations.
-   Build voice action.
-   Test with Liz's existing habits.
-   Explore Siri/HomeKit bridge where useful.

**Milestone:** "Play \_\_\_ on the living-room TV" works reliably.

------------------------------------------------------------------------

## Stage 4 --- Existing Devices

**Goal:** Gain value without buying much hardware.

-   LG ThinQ oven.
-   iRobot.
-   Investigate Bissell.
-   Useful notifications/automations.
-   Avoid unnecessary cloud dependencies where alternatives exist.

**Milestone:** Home Assistant is genuinely useful rather than just
installed.

------------------------------------------------------------------------

## Stage 5 --- Wired Network / PoE Backbone

**Goal:** Prepare for permanent infrastructure.

-   Map existing Ethernet wiring.
-   Identify termination point.
-   Decide router/server/switch placement.
-   Install appropriate PoE switch.
-   Clean up network layout.

**Milestone:** There is a proper wired backbone for cameras and other
infrastructure.

------------------------------------------------------------------------

## Stage 6 --- Zigbee Backbone

**Goal:** Establish local low-power device network.

-   Install SONOFF Dongle Max or final chosen coordinator.
-   Ethernet/PoE placement.
-   Choose Zigbee2MQTT or ZHA.
-   Pair first device.
-   Add a few mains-powered routers as the network grows.
-   Document Zigbee channel/network.

**Milestone:** Stable local Zigbee mesh.

------------------------------------------------------------------------

## Stage 7 --- Smart Thermostats

**Goal:** Move HVAC control into local automation.

-   Inspect current HVAC wiring.
-   Select compatible Zigbee thermostats.
-   Replace/configure.
-   Test local control.
-   Add room temperature/humidity sensors later.

**Milestone:** HVAC can be controlled locally by Home Assistant.

------------------------------------------------------------------------

## Stage 8 --- Local Cameras + NVR/NAS

**Goal:** Local security without mandatory cloud storage.

-   Walk the house: decide camera count and install locations.
-   Per location, note PoE cable feasibility vs. wireless necessity.
-   Select ONVIF/RTSP cameras accordingly (PoE preferred).
-   Run Ethernet where practical.
-   Stand up separate NVR storage (NAS first is an acceptable path).
-   Integrate events with Home Assistant.
-   Add local person detection if appropriate (may need Edge AI
    hardware beyond the CM5).

**Milestone:** Security video remains usable locally even if the
internet/vendor cloud disappears.

------------------------------------------------------------------------

## Stage 9 --- NFC Shelf Identity

**Goal:** Give every physical shelf a digital identity.

-   Provision tags against the stable shelf UUIDs supplied by Shade.
-   Write NFC tags.
-   Implement contextual shelf deep links.
-   Bulk Add destination by tap.
-   Bulk Move destination by tap.
-   Normal shelf browse by tap.

**Milestone:** Touching a shelf can drive Shade workflows.

------------------------------------------------------------------------

## Stage 10 --- One-Shelf LED Prototype

**Goal:** Prove digital → physical output.

-   One ESP32.
-   WLED.
-   One addressable strip.
-   Channel/diffuser.
-   Manual pixel tests.
-   Home Assistant control.
-   Shade-triggered test.

**Milestone:** Shade can intentionally light a physical shelf.

------------------------------------------------------------------------

## Stage 11 --- Spatial Shelf Model

**Goal:** Know where books are within a shelf.

-   Add normalized coordinates.
-   Add shelf→controller/pixel calibration.
-   Build manual mapping UI first.
-   Test Find on Shelf.

**Milestone:** Shade can light one specific book position.

------------------------------------------------------------------------

## Stage 12 --- Shelf Photography & Computer Vision

**Goal:** Make spatial mapping maintainable.

-   Map Shelf workflow.
-   Straight-on photograph.
-   Spine segmentation.
-   OCR.
-   Match against expected shelf contents.
-   Correction UI.
-   Stale-map tracking.

**Milestone:** Shelf position maps can be rebuilt quickly after
rearrangement.

------------------------------------------------------------------------

## Stage 13 --- Shade Physical Filters

**Goal:** Turn web search/filter results into a physical result set.

-   Filter produces book UUIDs.
-   Shade Physical resolves positions.
-   WLED/HA receives commands.
-   Matching books illuminate.
-   Clear/replace physical result set.
-   Add physical-view controls to frontend.

**Milestone:** Apply a filter on the phone and the matching books appear
physically on the shelves.

------------------------------------------------------------------------

## Stage 14 --- Full Physical Library

**Goal:** Instrument the entire library.

-   Scale LED channels/controllers.
-   Hide wiring.
-   Calibrate shelves.
-   Map all shelves.
-   Establish maintenance workflow.
-   Monitor power/controller reliability.

**Milestone:** The digital and physical library behave as one system.

------------------------------------------------------------------------

## Stage 15 --- Final-Form Interactions

Potential final capabilities:

-   "Where's *Pale Fire*?" → exact shelf position pulses.
-   Filter unread philosophy → all matching spines illuminate.
-   Scan a new book → destination shelf glows.
-   Shade lights the exact insertion gap.
-   Tap shelf → Bulk Add knows destination.
-   Tap shelf → Bulk Move completes destination selection.
-   Photograph shelf → Shade reconciles physical arrangement.
-   Home Assistant knows library state/events where useful.
-   Voice can query or trigger selected Shade actions.
-   Physical dashboard/e-ink display can show library status.
-   Presence/sensors can affect library lighting without compromising
    Shade's domain model.

------------------------------------------------------------------------

# 16. Hardware Responsibilities and Integration Boundaries

As this grows, keep responsibilities clear. The full service/API
ownership matrix and side-by-side software deployment arrangement live
in the [software roadmap](smart-home-software-roadmap.md).

## Shade owns

-   Books.
-   Book UUIDs.
-   Shelves.
-   Shelf UUIDs.
-   Collections.
-   Loans.
-   Reading state.
-   Filters.
-   Library workflows.
-   Book-to-shelf relationship.
-   Book spatial positions.
-   Whether a shelf map is stale.

## Shade Physical owns

-   Translation from Shade identities to physical coordinates/actions.
-   Shelf calibration.
-   Book coordinate → LED pixel calculation.
-   Physical filter sessions.
-   Communication with the device-control layer.

## Home Assistant owns

-   Devices.
-   Rooms.
-   General automations.
-   Zigbee.
-   Sensors.
-   Thermostats.
-   Voice.
-   Camera-event automations.
-   Household integrations.
-   Potential WLED device control.

## WLED / ESP32 owns

-   Actual LED electrical control.
-   Pixel addressing.
-   Effects/brightness.
-   Strip-level hardware behavior.

## NVR owns

-   Video recording.
-   Retention.
-   Playback.
-   Camera stream management.
-   Video inference where appropriate.

Keeping these boundaries prevents Shade from becoming an entire
smart-home platform and prevents Home Assistant from needing to
understand the internals of the library database.

------------------------------------------------------------------------

# 17. Privacy / Local-First Rules

When evaluating new hardware, ask these questions:

1.  **Can it perform its core function if the internet is down?**
2.  **Does Home Assistant control it locally or through a vendor
    cloud?**
3.  **Can it be used without a subscription?**
4.  **Does it expose a documented/local protocol?**
5.  **If the manufacturer disappears, does the device become useless?**
6.  **Can it be isolated from the internet later if desired?**
7.  **Where is its data stored?**
8.  **For cameras/microphones: does media have to leave the house?**

Cloud integration is not automatically forbidden --- Spotify and the
existing LG oven are obvious examples where cloud services may remain
useful --- but cloud dependence should be **intentional rather than
accidental**.

------------------------------------------------------------------------

# 18. The End State

The final system is not really "a smart library" plus "a smart home."

It is a local computing environment in which software understands enough
about the physical house to make digital information physically useful.

``` text
                         HOUSE
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
     Library              HVAC             Security
        │                  │                  │
      Shade           Zigbee thermostat    PoE cameras
        │                  │                  │
        └──────────────┐   │   ┌──────────────┘
                       ▼   ▼   ▼
                    Home Assistant
                         │
                    Local network
                         │
                  Raspberry Pi/server
```

For Shade specifically, the loop eventually becomes:

``` text
PHYSICAL BOOK
     │
 QR / NFC / camera
     │
     ▼
   SHADE
     │
 search / filter / workflow
     │
     ▼
SHADE PHYSICAL
     │
 LEDs / NFC context / Home Assistant
     │
     ▼
PHYSICAL LIBRARY
```

That closes the loop.

The physical library can **tell Shade what and where things are**, and
Shade can **point back into the physical library**.

That is the defining objective of **Shade Physical**.
