# Home UI Product Plan

**Status:** Planning document  
**Purpose:** Define the family-facing Home UI that sits above Home Assistant and coordinates household routines, media, calendars, recipes, scenes, room controls, and other non-library experiences.

This document is intentionally separate from:
- **Smart Home Hardware** — physical devices, networking, Zigbee, PoE, cameras, sensors, thermostats, etc.
- **Smart Shade / Shade Physical** — library-specific hardware/software such as NFC shelves, shelf mapping, LEDs, physical filters, and book-finding interactions.

The Home UI described here is the **household application layer outside of Shade**.

---

# 1. Product Vision

The goal is not to build another generic smart-home dashboard.

The goal is to create a **family-facing household operating interface** that makes the house easier to live in.

Home Assistant should handle device integrations, entity state, automations, calendars, scenes, media players, sensors, and physical device control.

The custom Home UI should handle the human concepts that matter to the household:
- What is happening today?
- What are we eating?
- What are we watching?
- What room am I in?
- What does this scene mean?
- What does "movie night" mean?
- What should the house prepare automatically?
- What needs attention?
- What can guests do without learning the system?

Core principle:

> **The house should feel thoughtful, not computerized.**

---

# 2. Architectural Role

The Home UI should be its own application.

It should not replace Home Assistant.
It should not duplicate Home Assistant's device-management responsibilities.
It should not absorb Shade.

```text
                    FAMILY / USERS
                         │
                         ▼
                    HOME UI
                         │
             ┌───────────┼───────────┐
             │           │           │
          Calendar     Recipes      Rooms
             │           │           │
          Activities    Meals      Scenes
             │           │           │
             └───────────┼───────────┘
                         │
                  Home UI Backend
                         │
                         ▼
                  HOME ASSISTANT
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
     Zigbee            Network          Cloud APIs
       │                 │                 │
 lights/sensors     Roku/Plex/etc.   Spotify/LG/etc.
 thermostats
```

The Home UI backend should contain **household-domain logic**.

Examples:
- "Movie Night" is a household activity.
- "Dinner" is a household activity.
- "Goodnight" is a household routine.
- "Make this recipe Tuesday at 6:30" is a household scheduling request.

Home Assistant should execute the device-level effects of those concepts.

Examples:
- Set light brightness.
- Turn on TV.
- Launch Plex.
- Change thermostat.
- Read presence state.
- Create or respond to calendar events.

---

# 3. Recommended Technology Stack

Use a stack analogous to Shade so the project reuses existing experience.

## Frontend

**React + TypeScript**

Likely same general ecosystem:
- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Vitest
- Playwright

Advantages:
- Existing familiarity.
- Reusable development patterns.
- Responsive UI for phones, tablets, wall-mounted tablets, and mirror displays.
- Straightforward REST/WebSocket integration.
- Easy kiosk/browser deployment.

## Backend

**Python + FastAPI**

Likely responsibilities:
- Household activity definitions.
- Recipe scheduling logic.
- Calendar orchestration.
- Scene metadata.
- Home Assistant abstraction.
- Plex/media orchestration.
- Rule evaluation.
- User-facing activity state.
- Validation.
- Storage of Home-UI-specific metadata.

The backend should not become a second Home Assistant.

It should issue higher-level actions such as:

```text
start_activity("movie_night")
schedule_meal(recipe_id, datetime)
prepare_room("living_room")
```

and translate those into appropriate Home Assistant calls.

---

# 4. Design Principles

## 4.1 Normal things must still work normally

Guests should be able to:
- Turn on lights with switches.
- Use a television remote.
- Make coffee.
- Watch the news.
- Adjust ordinary household things without an app.
- Function even if the Home UI is unavailable.

Automation is an enhancement, not a requirement for basic habitation.

> **If Home Assistant vanished temporarily, the house should still be understandable.**

## 4.2 Expose household concepts, not device internals

A user should see:
- Movie Night
- Goodnight
- Reading
- Dinner
- Cleaning
- Away
- Morning

They should not need to think about entity IDs, automation IDs, brightness values, source IDs, service calls, or MQTT topics.

## 4.3 Automations should remove friction

Good automation:
- A mirror halo fades on after someone stands there for three seconds.
- Movie Night prepares the room automatically.
- Dinner planning adds a thaw reminder.
- The house presents today's schedule when useful.

Bad automation:
- Requires opening an app for every light.
- Replaces a wall switch with something guests cannot understand.
- Creates more steps than the manual action.
- Triggers instantly and annoyingly on every passing motion.

## 4.4 Human-readable names everywhere

Examples:
- Living Room TV
- Bedroom TV
- Hall Mirror
- Kitchen
- Movie Night
- Reading
- Goodnight

---

# 5. Core Navigation

```text
HOME
├── Today
├── Calendar
├── Rooms
├── Scenes
├── Media
├── Meals
├── Recipes
├── Shopping
├── Routines
└── Settings / Admin
```

Some sections may eventually merge:
- Media may primarily live inside each Room.
- Shopping may live under Meals.
- Routines may live alongside Scenes.
- Today may become the default landing page.

---

# 6. Today Dashboard

The default family-facing screen should answer:

> **What matters right now?**

Possible sections:
- Current date/time.
- Weather summary.
- Today's calendar.
- Next household event.
- Dinner tonight.
- Recipe prep reminders.
- Upcoming movie night.
- Relevant household tasks.
- Active scene/activity.
- Simple room shortcuts.
- Important alerts.

Example:

```text
FRIDAY, SEPTEMBER 11

Today
────────────────────────────
8:00 AM    Work
5:30 PM    Dinner — Pot Roast
7:30 PM    Movie Night
           The Princess Bride

Dinner
────────────────────────────
Pot Roast
Thaw meat this morning
Start slow cooker by 10:00

House
────────────────────────────
Living Room     71°
Bedroom         69°
Front Door      Locked

Tonight
────────────────────────────
Movie Night • 7:30 PM
Living Room
[ Prepare ] [ Details ]
```

---

# 7. Calendar

## 7.1 Source of Truth

Normal family scheduling should continue to use **Google Calendar**.

Do not create an isolated Home-UI-only calendar.

```text
Google Calendar
      │
      ▼
Home Assistant
      │
      ▼
Home UI
```

The Home UI should display calendar events and, where appropriate, create household events that also appear in Google Calendar.

A dentist appointment created outside the Home UI should still appear in the Home UI.
A Movie Night created in the Home UI should still appear in Google Calendar.

## 7.2 Calendar Display

Support:
- Today.
- Week.
- Month.
- Family agenda.
- Upcoming household activities.
- Meal events.
- Movie nights.
- Appointments.
- General Google Calendar events.

## 7.3 Smart Household Events

Some calendar events should carry additional Home-UI meaning.

Example:

```text
title: Movie Night
time: Friday 7:30 PM
activity_type: movie_night
room: living_room
media: The Princess Bride
scene: movie_night
```

The normal calendar shows "Movie Night."
The Home UI understands the structured metadata.

---

# 8. Household Activity Model

An **activity** is a meaningful household event that may coordinate multiple systems.

Examples:
- Movie Night.
- Dinner.
- Cleaning.
- Goodnight.
- Morning.
- Reading.
- Guests Arriving.
- Leaving Home.
- Bedtime.
- Date Night.

Example:

```text
Activity: movie_night

Default room:
  living_room

Preparation:
  - activate movie lighting scene
  - turn on living-room TV
  - launch Plex

Optional:
  - selected movie
  - start time
  - reminder offset
```

Activities should reference behaviors rather than raw device commands.

---

# 9. Scenes

## 9.1 Purpose

Scenes capture the desired state of a room or group of devices.

Examples:
- Movie Night.
- Reading.
- Bright.
- Evening.
- Cleaning.
- Guests.
- Goodnight.
- Morning.
- All Off.

## 9.2 Custom Scene Builder

Allow users to:
1. Name a scene.
2. Choose rooms.
3. Select lights/devices.
4. Set brightness.
5. Set color temperature/color where applicable.
6. Optionally include TV/media state.
7. Preview.
8. Save.
9. Edit later.

Example:

```text
Create Scene
──────────────────────────

Name: Movie Night

Living Room

[x] Floor Lamp      18%
[x] Side Lamp       25%
[ ] Ceiling Light
[x] TV Backlight    10%

TV
[x] Turn on Living Room TV
[x] Open Plex

[ Preview ]    [ Save ]
```

## 9.3 Scene vs. Activity

**Scene**
- Describes physical state.

**Activity**
- Describes household intent.

Movie Night may activate a Movie Night scene, launch Plex, prepare media, and schedule reminders.

---

# 10. Rooms

Treat rooms as first-class navigation.

```text
Rooms
├── Living Room
├── Kitchen
├── Bedroom
├── Bathroom
├── Hall
└── Library
```

Each room page should show only relevant controls.

Example Living Room:

```text
LIVING ROOM

Lighting
[ Movie Night ] [ Reading ] [ Bright ] [ All Off ]

TV
        ▲
    ◀   OK   ▶
        ▼

⏮     ▶/❚❚     ⏭
VOL−   MUTE    VOL+

[ Plex ] [ Spotify ] [ Home ]

Climate
71°
```

---

# 11. Television Remote UI

A custom TV remote is a high-priority quality-of-life feature.

Goals:
- Reduce remote switching.
- Combine Roku/media controls with scenes.
- Provide consistent controls for every television.
- Make Plex and Spotify launchable from the same interface.
- Keep physical remotes usable.

Possible controls:
- Power.
- Directional pad.
- OK/select.
- Back.
- Home.
- Play/pause.
- Skip.
- Volume.
- Mute.
- App/source shortcuts.
- Plex.
- Spotify.

---

# 12. Media Hub

## 12.1 Plex

Desired interactions:
- Search movie library.
- Search TV library.
- Select a movie.
- Select destination room/TV.
- Queue or prepare media.
- Start playback where supported.

Examples:
- Play *The Princess Bride* in the living room.
- Put on the next episode of *The X-Files*.
- Find us an unwatched horror movie.

## 12.2 Movie Night Workflow

When scheduled:

```text
Movie Night
Friday
7:30 PM
The Princess Bride
Living Room
```

Potential sequence:

### 10 minutes before
- Activate Movie Night lighting.
- Turn on TV.
- Wake Roku.
- Launch Plex.
- Prepare selected movie.
- Send optional notification.

### At event start
- Display "Movie Night is ready."
- Offer Play.
- Optionally start automatically if explicitly configured.

Default toward **preparing rather than unexpectedly playing media**.

## 12.3 Spotify

Use the same destination model.

```text
PLAY [music] ON [room/device]
```

Examples:
- Play Fleetwood Mac in the living room.
- Play the cleaning playlist on the bedroom TV.
- Play dinner music in the kitchen.

Avoid separate hard-coded automation per artist or playlist.

---

# 13. Meals and Recipes

Recipes should be part of the household calendar and routine system rather than a standalone utility.

## 13.1 Recipe Picker

Possible filters:
- Quick.
- Cheap.
- Healthy.
- Chicken.
- Beef.
- Pasta.
- Under 30 min.
- Ingredient availability.

Example:

```text
What sounds good?

[ Quick ]
[ Cheap ]
[ Healthy ]
[ Chicken ]
[ Beef ]
[ Pasta ]
[ Under 30 min ]

Chicken Parmesan
45 min
8 / 11 ingredients available

[ Make Thursday's Dinner ]
```

## 13.2 Schedule a Recipe

Desired interaction:

> Make pot roast Tuesday at 6:30.

Result:
1. Create/update the dinner event in Google Calendar.
2. Associate the recipe with the event.
3. Calculate preparation dependencies.
4. Schedule reminders/tasks.
5. Add missing ingredients to a shopping workflow if requested.
6. Present the recipe at the appropriate time.
7. Trigger relevant Home Assistant actions where explicitly supported.

---

# 14. Recipe Dependencies

Recipes should support structured preparation metadata.

Example:

```text
Pot Roast

Serve:
  Tuesday 6:30 PM

Dependencies:
  thaw_meat:
    offset: -10 hours

  start_cooking:
    offset: -8 hours

  preheat:
    offset: -15 minutes
    temperature: 325 F
```

Then scheduling dinner can automatically produce useful cues:

```text
DINNER TONIGHT
Pot Roast — 6:30 PM

Now:
Thaw roast

Later:
10:00 AM — Start slow cooker
```

---

# 15. Shopping List Integration

Possible flow:

```text
Recipe selected
      │
compare ingredients
      │
missing ingredients
      │
      ▼
Shopping List
```

User should choose whether missing ingredients are automatically added or reviewed first.

Voice should support:
> Add milk to the shopping list.

The shopping list should remain easy to use from phones while away from home.

---

# 16. Kitchen UI

The kitchen is likely one of the highest-value dedicated tablet locations.

The Kitchen screen may combine:
- Today's meals.
- Current recipe.
- Cooking timers.
- Shopping list.
- Calendar.
- Upcoming meal-prep requirements.
- Oven state.
- Music controls.
- Relevant lighting scenes.

Example:

```text
KITCHEN

Tonight
──────────────────────
Chicken Parmesan
6:30 PM

Prep
──────────────────────
5:40  Start prep
6:05  Preheat oven 400°
6:30  Dinner

[ Open Recipe ]

Timers
──────────────────────
Pasta              08:32

Music
──────────────────────
Fleetwood Mac
Kitchen Speaker

Oven
──────────────────────
Current: 72°
Target: 400°
```

---

# 17. Oven Integration

Possible UI concepts:
- Current oven temperature.
- Target temperature.
- Current mode.
- Preheat status.
- Cooking complete.
- Error/warning state.

Recipes may offer:

```text
[ Preheat Oven to 400° ]
```

Automatic preheating should only be enabled when hardware capability and household safety expectations support it.

A recipe can always create a **prompt** even if fully automatic remote preheat is unavailable or undesirable.

---

# 18. Timers

Cooking and household timers should be available through Home UI and voice.

Examples:
- Set a pasta timer for 11 minutes.
- Set a timer called laundry for 45 minutes.

Timers may be surfaced on:
- Kitchen tablet.
- Phones.
- Mirror.
- Other nearby displays.

They do not need to be tied to a physical oven timer.

---

# 19. Presence-Aware UI

Sensors provide signals.
The automation layer decides what those signals mean.

Example:

```text
presence detected
     │
wait 3 seconds
     │
still present?
     │
     ├── no → do nothing
     │
     └── yes → perform action
```

Configurable concepts:
- Activation delay.
- Exit delay.
- Minimum dwell time.
- Time-of-day behavior.
- Room state.
- Current activity.

---

# 20. Hall Full-Length Mirror

Desired behavior:
1. Person enters area in front of mirror.
2. mmWave/presence sensor detects them.
3. Presence persists for approximately 2–3 seconds.
4. Halo/backlighting fades on.
5. Brightness/color temperature may depend on time of day.
6. After departure, wait approximately 15–30 seconds.
7. Fade lighting off.

Possible scene variants:
- Day/photo brightness.
- Evening.
- Late-night low brightness.

The effect should feel deliberate and elegant rather than like a utility motion light.

---

# 21. Smart Mirror / Ambient Displays

A future two-way smart mirror may become another Home UI surface.

The mirror should primarily be a **glance display**, not a full control panel.

It may show:
- Weather.
- Today's schedule.
- Dinner.
- Movie night.
- House status.
- Relevant reminders.
- Next event.

Morning example:

```text
GOOD MORNING

63° / Sunny

TODAY
8:00  Work
5:30  Chicken Parmesan
7:30  Movie Night

HOUSE
71°
Front Door Locked
```

Behavior:
- Display normally appears off/black.
- Presence for a configured dwell period wakes the display.
- Information fades in.
- After departure, display returns to black.

Use:
- Black background.
- Sparse high-contrast typography.
- Minimal chrome.
- Context-specific information.

---

# 22. Wall Tablet Strategy

Likely high-value locations:
- Kitchen.
- Living room.
- Bedroom.
- Possibly entry/hall.
- Future smart mirror.

A wall tablet is a **surface for the Home UI**, not the automation brain.

Potential behavior:
- Wake on presence.
- Show room-specific default screen.
- Return to Today after inactivity.
- Use kiosk/fullscreen mode.
- Keep primary actions large and simple.

---

# 23. Voice

Voice is an additional interface, not the only interface.

## Siri

Preserve existing household habits where possible.

Goal:
> Keep familiar interfaces while Home Assistant remains the backend.

Examples:
- Siri, movie night.
- Siri, turn off the living room.
- Siri, play Fleetwood Mac in the living room.

The wife should not need to learn Home Assistant merely because it powers the house.

## Home Assistant Assist

Potential future uses:
- Dedicated voice satellites.
- Wall tablets.
- Mirror.
- Kitchen.
- Other household spaces.

A future architecture may support both Siri and Home Assistant Assist.

---

# 24. Routines

## Goodnight

Potential actions:
- Turn off common-area lights.
- Set bedroom lighting.
- Adjust thermostat.
- Check/lock doors where supported.
- Stop media.
- Report unresolved issues.

## Morning

Potential actions:
- Set appropriate lights.
- Present schedule.
- Present weather.
- Show breakfast/dinner prep reminders.
- Optional media/news.

## Leaving Home

Potential actions:
- Turn off selected lights.
- Adjust HVAC.
- Stop media.
- Start robot vacuum if appropriate.
- Confirm doors.

## Guests

Potential actions:
- Comfortable lighting.
- Normal thermostat setpoint.
- Disable overly personal or surprising automations.
- Keep physical controls fully functional.

---

# 25. Guest-Friendly Design

A guest should not need:
- Home Assistant credentials.
- Home UI training.
- Siri setup.
- A custom app.

They should still be able to:
- Use light switches.
- Use television remotes.
- Make coffee.
- Adjust reasonable household controls.
- Navigate basic media.

Where wall tablets exist, guest-safe controls may be exposed without sensitive settings.

---

# 26. Household Notifications

Good examples:
- "Thaw roast this morning."
- "Movie Night starts in 10 minutes."
- "Preheat complete."
- "Leak detected under kitchen sink."
- "Front door has been open for 10 minutes."

Avoid noisy informational alerts that do not change behavior.

Different surfaces may receive different alerts:
- Phones for urgent events.
- Tablets for household status.
- Mirror for glance reminders.
- Voice for time-sensitive cues.

---

# 27. User Experience by Surface

## Phone
Best for:
- Remote control.
- Calendar edits.
- Shopping while away.
- Notifications.
- Quick room controls.
- Scheduling events.

## Wall Tablet
Best for:
- Shared family status.
- Room controls.
- Kitchen workflows.
- Media.
- Scene selection.
- Calendar.

## Desktop
Best for:
- Configuration.
- Scene design.
- Recipe management.
- Administration.
- Complex scheduling.
- Debugging.

## Mirror
Best for:
- Passive context.
- Schedule.
- Weather.
- Reminders.
- House state.
- Minimal voice interaction.

---

# 28. API Boundary with Home Assistant

The Home UI backend should abstract Home Assistant behind stable internal concepts.

Avoid having the frontend directly depend everywhere on raw HA entity IDs.

Example:

```text
Home UI:
living_room_tv.power_on()

Backend adapter:
media_player.turn_on
entity_id = media_player.roku_living_room
```

Similarly:

```text
Home UI:
activate_scene("movie_night")

Backend:
resolve scene definition
call Home Assistant services
```

This makes hardware replacement easier.

---

# 29. Suggested Backend Domain Models

These are conceptual, not finalized schemas.

## Room

```text
id
name
slug
home_assistant_area_id
display_order
```

## Device Alias

```text
id
room_id
role
friendly_name
home_assistant_entity_id
```

Example roles:
- primary_tv
- ceiling_light
- reading_lamp
- thermostat

## Scene Definition

```text
id
name
scope
home_assistant_scene_id
icon
display_order
```

## Activity Type

```text
id
name
default_room
scene_id
preparation_offset
completion_behavior
```

## Scheduled Activity

```text
id
activity_type_id
calendar_event_id
start_datetime
room_id
metadata
```

## Recipe

```text
id
name
ingredients
instructions
prep_time
cook_time
dependencies
oven_requirements
tags
```

## Meal Plan Entry

```text
id
recipe_id
scheduled_datetime
calendar_event_id
servings
notes
```

---

# 30. Admin / Setup Screens

Admin mode may expose:
- Home Assistant connection status.
- Entity mapping.
- Room mapping.
- Scene mapping.
- TV/device mapping.
- Calendar connection.
- Plex connection.
- Spotify connection.
- Recipe management.
- Activity definitions.
- Presence delays.
- Kiosk/tablet configuration.

This prevents technical configuration from leaking into ordinary household screens.

---

# 31. Failure Modes and Fallbacks

## Plex offline
Movie Night can still set the scene, turn on TV, and show a manual media message.

## Google Calendar unavailable
Show last known data and clearly indicate sync failure.

## Home Assistant unavailable
Physical switches/remotes continue to work.

## Internet unavailable
Local Home Assistant functions should remain available where integrations are local.

Cloud-dependent services such as Spotify or LG ThinQ may not.

## Tablet offline
Other tablets/phones remain usable.

No single display should be critical infrastructure.

---

# 32. Privacy Boundary

Prefer local data and local control.

Expected cloud-connected services may include:
- Google Calendar.
- Spotify.
- LG ThinQ.
- Siri/Apple services depending on use.

Keep local household logic and local device control local wherever practical.

---

# 33. Initial Build Order

## Phase 1 — Foundation
- Create frontend repo/application.
- Create backend repo/application.
- Establish Home Assistant authentication/API wrapper.
- Basic health/status screen.
- Define room model.
- Define device alias model.
- Read Home Assistant entity/device state.

**Milestone:** Home UI can display useful HA state without exposing raw HA complexity.

## Phase 2 — Google Calendar
- Connect Google Calendar through Home Assistant.
- Read calendar events.
- Build Today view.
- Build basic Calendar view.
- Support household event creation.
- Store optional Home-UI metadata separately where needed.

**Milestone:** Existing Google Calendar becomes visible in Home UI.

## Phase 3 — Room UI + Roku
- Create Living Room screen.
- Add Roku controls.
- Create reusable TV remote component.
- Add other TVs.
- Add room lighting controls as available.
- Preserve physical remotes.

**Milestone:** One Home UI can replace most remote switching.

## Phase 4 — Scenes
- Read/activate existing Home Assistant scenes.
- Build friendly scene cards.
- Build scene editor.
- Support room-specific scenes.
- Add preview.

**Milestone:** Family can create/use lighting scenes without navigating HA internals.

## Phase 5 — Spotify
- Add Spotify account/integration.
- Build source/device selection.
- Implement PLAY [music] ON [device].
- Add music controls to room pages.

## Phase 6 — Plex
- Integrate Plex library.
- Browse/search movies and shows.
- Select destination TV.
- Start/prepare playback.
- Build Movie Night activity prototype.

## Phase 7 — Household Activities
- Create activity model.
- Implement Movie Night.
- Connect activities to scenes/media.
- Allow scheduling activity on calendar.
- Add pre-event preparation timing.

**Milestone:** A calendar event can cause the house to prepare itself.

## Phase 8 — Recipes
- Add recipe storage/import.
- Build recipe picker.
- Meal scheduling.
- Associate meals with Google Calendar.
- Add preparation dependencies.
- Add recipe presentation screen.

## Phase 9 — Shopping
- Ingredient comparison.
- Missing ingredient review.
- Shopping list integration.
- Voice add.
- Mobile shopping view.

## Phase 10 — Kitchen Mode
- Dedicated kitchen dashboard.
- Recipe step display.
- Cooking timers.
- Dinner timeline.
- Oven state/actions.
- Music controls.

## Phase 11 — Presence-Aware Displays
- Presence integration.
- Configurable dwell delays.
- Exit grace periods.
- Tablet wake/sleep behavior.
- Hall mirror halo workflow.

## Phase 12 — Voice Expansion
- HomeKit/Siri exposure.
- Home Assistant Assist experiments.
- Voice activity triggers.
- Media requests.
- Shopping additions.
- Household queries.

## Phase 13 — Ambient / Mirror UI
- Dedicated glance-only route.
- Weather.
- Schedule.
- Meal reminders.
- House state.
- Presence wake/sleep.
- Fullscreen kiosk deployment.

---

# 34. Near-Term Ticket Candidates

## Foundation
- FEAT: Create Home UI frontend shell.
- FEAT: Create Home UI FastAPI backend.
- FEAT: Add Home Assistant API client.
- FEAT: Add backend health endpoint.
- FEAT: Add Home Assistant connectivity status.
- FEAT: Introduce Room model.
- FEAT: Introduce Device Alias model.

## Calendar
- FEAT: Read Home Assistant calendar entities.
- FEAT: Build Today agenda component.
- FEAT: Build weekly calendar view.
- FEAT: Create calendar event workflow.
- FEAT: Add Home-UI activity metadata mapping.

## Rooms and Media
- FEAT: Build Room details route.
- FEAT: Add Roku remote component.
- FEAT: Add TV device role mapping.
- FEAT: Add room scenes.
- FEAT: Add Plex search.
- FEAT: Add Plex playback destination.
- FEAT: Add Spotify playback controls.

## Activities
- FEAT: Create Activity Type model.
- FEAT: Create Scheduled Activity model.
- FEAT: Implement Movie Night activity.
- FEAT: Add pre-event actions.
- FEAT: Add activity preparation status.

## Recipes
- FEAT: Create Recipe model.
- FEAT: Build Recipe Picker.
- FEAT: Schedule recipe as dinner.
- FEAT: Create recipe preparation dependencies.
- FEAT: Surface meal prep reminders.
- FEAT: Create shopping-list integration.

---

# 35. Explicit Non-Goals

The Home UI should **not** initially attempt to become:
- A replacement for Home Assistant.
- A device firmware manager.
- A Zigbee coordinator UI.
- An NVR.
- A camera-recording platform.
- A replacement for Google Calendar.
- A replacement for Plex.
- A replacement for Spotify.
- A replacement for Shade.
- A mandatory interface for ordinary household actions.

It should coordinate those systems around human household activities.

---

# 36. Long-Term Experience

## Morning

Walk into bathroom.

Mirror wakes after a short dwell.

```text
Good morning.

63° and sunny.

Today:
8:00 Work
5:30 Pot Roast
7:30 Movie Night

Reminder:
Thaw roast this morning.
```

## Dinner Planning

On Sunday:

> Make pot roast Tuesday at 6:30.

System:
- adds dinner to Google Calendar
- associates recipe
- schedules thaw reminder
- schedules cooking-start reminder
- adds missing ingredients after approval
- presents recipe Tuesday
- exposes oven preheat action when appropriate

## Movie Night

Calendar contains:

```text
Movie Night
Friday 7:30
The Princess Bride
Living Room
```

At 7:20:
- lights transition to Movie Night scene
- TV wakes
- Roku/Plex prepare
- UI says Movie Night is ready

At 7:30:
- movie is ready to start

## Hall Mirror

Walk up to full-length mirror.

Nothing happens while merely passing.

Stand in front for three seconds.

Halo lighting fades up.

Leave.

After a short grace period, lighting fades down.

## Guest Morning

A friend wakes before the household.

They can:
- use the coffee maker normally
- use wall switches normally
- turn on TV with the remote
- watch the news
- optionally use a simple room tablet

They do not need to understand Home Assistant.

---

# 37. North Star

The Home UI succeeds when family members stop thinking about "smart-home technology."

They simply experience:
- the right information in the right place
- easier household coordination
- fewer repeated tasks
- fewer separate remotes/apps
- reminders tied to actual plans
- rooms that quietly prepare themselves
- voice that works through familiar interfaces
- normal physical controls that still work

> **The Home UI is the family's interface to household intent.**
