# Project Rotation Guide

> **Purpose:** Keep all five major project tracks moving without letting
> the most exciting one consume every available weekend, dollar, or
> hour.
>
> This document does **not** replace or combine the five roadmaps. Each
> roadmap remains the source of truth for its own project. This is the
> layer above them: a rule for deciding **what gets attention next, when
> to stop, and when to rotate.**

------------------------------------------------------------------------

# The Core Rule

## One milestone, then rotate.

At any given time, each project group has **one active milestone**.

Work on that milestone until one of three things happens:

-   [ ] **Milestone complete** --- mark it finished and rotate.
-   [ ] **Waiting** --- parts, money, drying/curing, another project, or
    outside information blocks progress; rotate rather than filling the
    wait with the next milestone from the same group.
-   [ ] **Deliberate pause** --- the milestone has become too large for
    the current week; leave a written restart note and rotate.

**Do not begin the next milestone in the same project group just because
momentum is good.**

That is the important part.

The reward for finishing something is not immediately starting the next
thing in the same category. The reward is getting to move to a different
kind of project.

------------------------------------------------------------------------

# The Five Lanes

  -----------------------------------------------------------------------
  Lane                    Project Group           What It Scratches
  ----------------------- ----------------------- -----------------------
  🏠                      **Home Improvement**    Physical building,
                                                  visible transformation,
                                                  working with your hands

  🎒                      **Bug-Out Bag**         Collecting,
                                                  preparedness, tangible
                                                  gear, the "field kit"
                                                  feeling

  🖥️                      **Smart Home Hardware** Servers, networking,
                                                  devices, physical
                                                  technology

  💻                      **Smart Shade           Coding, architecture,
                          Software**              library systems,
                                                  problem-solving

  🏡                      **Home UI**             Product design,
                                                  household software,
                                                  interfaces, automation
                                                  experiences
  -----------------------------------------------------------------------

The lanes are intentionally different. Rotating between them is not
losing momentum. **The rotation is the plan.**

------------------------------------------------------------------------

# The Rotation

Use this as the default sequence:

``` text
HOME IMPROVEMENT
        ↓
BUG-OUT BAG
        ↓
SMART HOME HARDWARE
        ↓
SMART SHADE SOFTWARE
        ↓
HOME UI
        ↓
      REPEAT
```

The order is less important than the rule that **the same lane does not
get two milestones in a row**.

If a lane is blocked, skip it temporarily and come back to it on the
next circuit. Do not use a blocked lane as permission to spend the
entire circuit on one of the others.

------------------------------------------------------------------------

# The Anti-Obsession Rules

These are the guardrails that make the system work.

### 1. A milestone is a stopping point, not an invitation.

When the milestone is achieved, **stop that lane**.

You are allowed to write down the next idea. You are allowed to make a
note about what comes next. You are not allowed to turn "I'll just start
the next piece" into another three-week tunnel.

### 2. Leave yourself a runway marker.

Before rotating away, write:

``` text
LAST COMPLETED:
NEXT MILESTONE:
FIRST ACTION WHEN I RETURN:
BLOCKED BY:
```

The goal is to make returning easy enough that you do not feel compelled
to keep going merely because all the context is currently in your head.

### 3. Waiting counts as a stopping point.

Drywall compound drying, a part in the mail, saving for a purchase,
waiting for hardware, or a software dependency are all legitimate
reasons to rotate.

**Do not invent filler work inside the same lane just to stay there.**

### 4. Research needs a finish line too.

"Research PoE switches" can expand forever.

Instead:

> **Finish line:** I have chosen the requirements and have either
> selected a product or written down exactly what information is still
> missing.

Planning is work, but only when it ends in a decision.

### 5. Purchases do not have to happen at the same speed.

A cheap Bug-Out Bag phase and a software phase can move while money
accumulates for a large home project. The five lanes need **attention
balance**, not equal spending.

### 6. A giant milestone may be split---but only before starting it.

If a milestone obviously requires many weekends, define its
sub-milestones first. Each sub-milestone becomes a legitimate rotation
point.

Do not redefine the finish line halfway through simply because you want
to keep working on the exciting thing.

### 7. Dependencies do not erase lanes.

Smart Shade Software and Smart Home Hardware deliberately meet each
other. Home UI depends on Home Assistant. The hidden emergency area
belongs inside the future closet plan.

Keep the documents separate anyway.

A dependency means:

``` text
THIS LANE IS WAITING.
THE OTHER LANE GETS ITS NORMAL TURN.
COME BACK NEXT CIRCUIT.
```

It does **not** mean that everything touching the same dependency
becomes one mega-project.

------------------------------------------------------------------------

# Choosing What to Do Today

When you have project time, ask these questions in order:

1.  **Which lane is next in the rotation?**
2.  **What is that lane's current milestone?**
3.  **Is there an unblocked action I can take toward that milestone with
    the time and money I have today?**
4.  If yes, do that.
5.  If no, record the blocker and move to the next lane.
6.  When the milestone is complete, mark it complete and rotate.

Do not ask:

> "Which of my projects am I most excited about right now?"

That question is exactly how one project wins every time.

Instead ask:

> **"Whose turn is it?"**

------------------------------------------------------------------------

# Circuit 1 --- Make Every Project Real

This is the first balanced circuit: five concrete wins, one from each
world.

## 🏠 Home Improvement --- Closet Charging Station

**Finish line:** The closet has its own permanent, tidy charging
station.

-   [ ] Decide exact charger/device arrangement.
-   [ ] Confirm outlet and cable route.
-   [ ] Buy any needed charger, cables, mounting, and cable-management
    supplies.
-   [ ] Install it.
-   [ ] Route and secure cables.
-   [ ] Plug in the actual devices and verify the setup works cleanly.

### 🏁 ROTATION POINT

**The charging station is installed and usable. Stop. Do not immediately
roll into the laundry room.**

------------------------------------------------------------------------

## 🎒 Bug-Out Bag --- Milestone I: Pocket Kit

**Finish line:** I own a compact, self-contained emergency kit.

-   [ ] Assemble the small utility pouch.
-   [ ] Add notebook and writing tools.
-   [ ] Add emergency blanket.
-   [ ] Add waterproof matches.
-   [ ] Add compact flashlight.
-   [ ] Add glow sticks.
-   [ ] Add a small amount of paracord.
-   [ ] Add a small roll of duct tape.
-   [ ] Remove packaging and organize it.
-   [ ] Test the flashlight.
-   [ ] Put the finished pouch in its designated location.

### 🏁 ROTATION POINT

**The project physically exists. Stop. The Medical Module belongs to the
next circuit.**

------------------------------------------------------------------------

## 🖥️ Smart Home Hardware --- Stage 1: Pi Foundation

**Finish line:** Shade is served from the Pi reliably.

-   [ ] Establish the Pi as a stable server.
-   [ ] Configure storage appropriately.
-   [ ] Establish networking and SSH.
-   [ ] Configure Git/repository access.
-   [ ] Deploy Shade.
-   [ ] Confirm database persistence and frontend/backend routing.
-   [ ] Confirm phone access.
-   [ ] Test reboot recovery.
-   [ ] Establish the update procedure.
-   [ ] Establish backups.

### 🏁 ROTATION POINT

**Shade survives a reboot and comes back on the Pi without babysitting.
Stop. Do not immediately install and configure the rest of the smart
home.**

------------------------------------------------------------------------

## 💻 Smart Shade Software --- Stage 1: Contract & Safety Foundation

**Finish line:** Physical references are stable enough that a shelf
rename cannot break them.

-   [ ] Complete the canonical `book_id → shelf_id` transport
    relationship.
-   [ ] Define the physical-map and coordinate contract.
-   [ ] Define map revision and stale-state behavior.
-   [ ] Define invalidation behavior for placement-changing workflows.
-   [ ] Define the Smart Shade authentication/network boundary.
-   [ ] Lock down ownership: Shade owns map semantics; Smart Shade owns
    hardware calibration.

### 🏁 ROTATION POINT

**The contract is stable. Stop. NFC is the prize waiting for the next
circuit.**

------------------------------------------------------------------------

## 🏡 Home UI --- Phase 1: Foundation

**Finish line:** Home UI can display useful Home Assistant state without
exposing raw Home Assistant complexity.

-   [ ] Create the frontend application.
-   [ ] Create the backend application.
-   [ ] Establish the Home Assistant API/authentication wrapper.
-   [ ] Add basic health/status.
-   [ ] Define the room model.
-   [ ] Define the device-alias model.
-   [ ] Read useful Home Assistant entity/device state.

### 🏁 ROTATION POINT

**The Home UI is a real application that can see the house. Stop.
Calendar is next circuit.**

------------------------------------------------------------------------

# Circuit 2 --- First Useful Systems

Do not start this circuit until Circuit 1 has either been completed or
each unfinished lane has a legitimate blocker recorded.

  -----------------------------------------------------------------------
  Lane                    Next Milestone          Finish Line
  ----------------------- ----------------------- -----------------------
  🏠 Home Improvement     **Laundry Room          Laundry-room walls are
                          Sheetrock Repair**      whole and ready for
                                                  finishing.

  🎒 Bug-Out Bag          **Medical Module**      One dedicated
                                                  first-aid/trauma pouch
                                                  is assembled,
                                                  understood, and ready
                                                  to grab.

  🖥️ Smart Home Hardware  **Home Assistant        Home Assistant is
                          Foundation**            stable, accessible, and
                                                  has the basic household
                                                  structure defined.

  💻 Smart Shade Software **NFC Shelf Identity &  Tapping a shelf opens
                          Mobile Context**        the correct Shade
                                                  context without
                                                  requiring LEDs or
                                                  computer vision.

  🏡 Home UI              **Google Calendar**     The household's
                                                  existing Google
                                                  Calendar is visible and
                                                  useful inside Home UI.
  -----------------------------------------------------------------------

### 🏁 CIRCUIT MILESTONE

**All five project worlds have moved beyond setup and now contain
something useful.**

------------------------------------------------------------------------

# Circuit 3 --- The Fun Starts Showing

  -----------------------------------------------------------------------
  Lane                    Next Milestone          Finish Line
  ----------------------- ----------------------- -----------------------
  🏠 Home Improvement     **Laundry Room Shelving The laundry room is
                          & Styling**             finished, organized,
                                                  and styled rather than
                                                  merely repaired.

  🎒 Bug-Out Bag          **Water & Fire**        I can independently
                                                  produce drinkable water
                                                  and basic warmth.

  🖥️ Smart Home Hardware  **Roku + Spotify**      "Play \_\_\_ on the
                                                  living-room TV" works
                                                  reliably.

  💻 Smart Shade Software **One-Shelf Smart Shade A Shade book detail can
                          Prototype**             make one real shelf or
                                                  mapped position light
                                                  up.

  🏡 Home UI              **Room UI + Roku**      One Home UI can replace
                                                  most remote switching.
  -----------------------------------------------------------------------

### 🏁 CIRCUIT MILESTONE

**Every lane now has a visible or physical payoff.**

This is an important point to enjoy. The house looks better, the
emergency kit has real capability, the smart home does something useful,
Shade reaches into the physical room, and Home UI controls something you
actually use.

------------------------------------------------------------------------

# Circuit 4 --- Capability Upgrade

  -----------------------------------------------------------------------
  Lane                    Next Milestone          Finish Line
  ----------------------- ----------------------- -----------------------
  🏠 Home Improvement     **Hidden Hallway Mirror The hallway ends at a
                          Door**                  full-length mirror and
                                                  the storage visually
                                                  disappears.

  🎒 Bug-Out Bag          **The Field Bag**       The separate modules
                                                  become one tested,
                                                  wearable bug-out bag.

  🖥️ Smart Home Hardware  **Existing Devices**    Home Assistant is
                                                  genuinely useful with
                                                  equipment already in
                                                  the house.

  💻 Smart Shade Software **Physical-Display      Find-on-shelf and
                          Features**              physical filtered
                                                  results are normal
                                                  optional Shade
                                                  workflows.

  🏡 Home UI              **Scenes**              The family can create
                                                  and use scenes without
                                                  navigating Home
                                                  Assistant internals.
  -----------------------------------------------------------------------

### 🏁 CIRCUIT MILESTONE

**These are no longer experiments. Each project has become part of the
house or daily life.**

------------------------------------------------------------------------

# Later Circuits

From here, costs, dependencies, and project sizes diverge more sharply.
Continue the same rotation rule, but do not force all five lanes to
advance at the same speed.

## 🏠 Home Improvement Queue

1.  [ ] Kitchen Repaint
2.  [ ] Coordinate the **Hidden Safe / Bug-Out Area** and **Walk-In
    Closet** design before either construction project begins.
3.  [ ] Hidden Safe & Bug-Out Area
4.  [ ] Walk-In Closet Conversion
5.  [ ] Living Room Library --- design, measurements, structural
    approach, and budget
6.  [ ] Living Room Library --- lower bookcases
7.  [ ] Living Room Library --- upper shelving
8.  [ ] Living Room Library --- ladder rail
9.  [ ] Living Room Library --- final completion

**Special rule:** The living-room library is the horizon project. Treat
each of its existing milestones as a separate turn in the rotation
rather than allowing "build the library" to become one enormous
uninterrupted season of life.

## 🎒 Bug-Out Bag Queue

1.  [ ] Documents & Money --- **Paper Trail**
2.  [ ] Comms & Power --- **Off-Grid Comms**
3.  [ ] Upgrade Pass --- **Field-Ready**
4.  [ ] Gray Pouch --- specialized kit evaluated and deliberately
    assembled
5.  [ ] Final Deployment Test --- **The Cache**

**Special rule:** The cash reserve and slow equipment upgrades may
accumulate between circuits, but they do not count as permission to skip
ahead. The bag roadmap already says to finish, test, and enjoy each
phase before moving on.

## 🖥️ Smart Home Hardware Queue

1.  [ ] Wired Network / PoE Backbone
2.  [ ] Zigbee Backbone
3.  [ ] Smart Thermostats
4.  [ ] Local Outdoor Cameras
5.  [ ] NFC Shelf Identity
6.  [ ] One-Shelf LED Prototype
7.  [ ] Spatial Shelf Model
8.  [ ] Shelf Photography / Computer Vision
9.  [ ] Shade Physical Filters
10. [ ] Full Physical Library
11. [ ] Final-form interactions

**Special rule:** Do not buy library-wide hardware merely because the
prototype is exciting. The roadmap explicitly keeps the one-shelf
prototype as the proof point before scaling.

## 💻 Smart Shade Software Queue

1.  [ ] Trusted Manual Mapping
2.  [ ] Photograph-Assisted Reconciliation
3.  [ ] Whole-Library Scale & Final Interactions

The hardware and software roadmaps converge increasingly after the
one-shelf prototype. At that point, a hardware milestone and software
milestone may depend on each other.

**Dependency rule:** It is fine for one lane to say **WAITING ON:
\[other lane milestone\]**. That is a reason to rotate, not a reason to
collapse the two roadmaps into one project.

## 🏡 Home UI Queue

1.  [ ] Spotify
2.  [ ] Plex
3.  [ ] Household Activities --- **a calendar event can cause the house
    to prepare itself**
4.  [ ] Recipes
5.  [ ] Shopping
6.  [ ] Kitchen Mode
7.  [ ] Presence-Aware Displays
8.  [ ] Voice Expansion
9.  [ ] Ambient / Mirror UI

Phases without an explicit milestone in the product plan should still
receive a temporary **rotation finish line** before work starts. Define
one sentence describing what must be demonstrably usable before the lane
gives up its turn.

----------------------------------------------------------------------------

# Current Circuit Board

Use this as the page you actually look at most often.

  --------------------------------------------------------------------------
  Lane              Active Milestone  Status            Next Action
  ----------------- ----------------- ----------------- --------------------
  🏠 Home           Closet Charging   ⬜                Decide layout /
  Improvement       Station                             gather materials

  🎒 Bug-Out Bag    Pocket Kit        ⬜                Gather or purchase
                                                        the pouch contents

  🖥️ Smart Home     Pi Foundation     ⬜                Begin Pi/server
  Hardware                                              setup when hardware
                                                        is available

  💻 Smart Shade    Contract & Safety ⬜                Finish the stable
  Software          Foundation                          physical-reference
                                                        contract

  🏡 Home UI        Foundation        ⬜                Create the
                                                        application
                                                        foundation when this
                                                        lane's turn arrives
  --------------------------------------------------------------------------

Status key:

-   ⬜ **READY**
-   🟨 **IN PROGRESS**
-   🟦 **WAITING / BLOCKED**
-   ✅ **MILESTONE COMPLETE**

------------------------------------------------------------------------

# Circuit Check-In

At the end of each full circuit, answer only these:

-   [ ] What five things are now true that were not true at the
    beginning of the circuit?
-   [ ] Which lane felt disproportionately hungry for attention?
-   [ ] Did I respect the stopping points?
-   [ ] Is any next milestone too large and in need of subdivision?
-   [ ] Is any lane blocked by money, hardware, weather, another
    project, or a decision?
-   [ ] What is the first milestone of the next circuit?

Then begin again.

------------------------------------------------------------------------

# The Point

The end goal is not to have a finished smart home, a finished house, a
finished library system, a finished Home UI, **or** a finished emergency
kit as quickly as possible.

The goal is to look around periodically and realize:

> **The house got a little better.**
>
> **The emergency kit got a little more capable.**
>
> **The infrastructure got a little more real.**
>
> **Shade learned something new.**
>
> **The Home UI became a little more useful.**
>
> **And none of them had to swallow the others to get there.**

Progress is the circuit, not the sprint.
