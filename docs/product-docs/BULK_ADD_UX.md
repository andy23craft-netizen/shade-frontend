# Bulk Add — User Experience Specification

## Purpose

Bulk Add is the high-volume intake workflow for adding many items to a library efficiently.

Unlike the discovery and browsing portions of the application, Bulk Add belongs firmly to the **administrative side of the product**. It should feel like an inventory-management application rather than a simulation of a physical library.

The primary UX goal is:

> **Minimize user interactions while allowing the user to continuously scan physical items, monitor metadata lookup, correct problems, and save valid records without being interrupted by individual failures.**

The workflow should optimize for someone physically standing at a shelf with a barcode scanner and processing many items in sequence.

---

## Core UX Principles

### 1. Scanning is the primary interaction

Once a Bulk Add session has started, the user should be able to scan items continuously without interacting with the mouse or keyboard between scans.

After every scan:

1. The ISBN is immediately added to the intake queue.
2. Metadata lookup begins asynchronously.
3. Scanner/input focus is automatically restored.
4. The user can immediately scan the next item.

Metadata lookup must **never block continued scanning**.

### 2. Problems do not interrupt intake

A failed or incomplete metadata lookup should not open a modal, navigate away from the page, or require immediate correction.

Instead, the affected item changes status in the intake queue.

The user can continue scanning and return to problem records whenever convenient.

### 3. Review is available, not mandatory

The workflow must support both users who want to:

* scan everything and save all valid records immediately; or
* manually inspect/edit every record before saving.

These should **not be separate modes**.

Both behaviors should naturally emerge from the same intake interface.

### 4. The application should infer state

The user should not manually classify records as ready, incomplete, etc.

The application determines status from lookup and validation results and moves each item through the workflow automatically.

### 5. Preserve physical momentum

Bulk Add exists to make cataloging a physical collection fast.

Whenever there is a choice between interrupting the user to resolve something and recording the problem for later attention, prefer recording the problem for later.

---

# Entry Workflow

## 1. Start Bulk Add

From the appropriate administrative interface, the user selects:

**Bulk Add**

The application prompts for the destination shelf.

Example:

> **Select Shelf**
> E4

Selecting the shelf creates a new Bulk Add intake session associated with that shelf.

The shelf is selected **once per session**, not once per item.

---

## 2. Enter Intake Mode

After the shelf is selected, the Bulk Add workspace opens immediately.

The scanner/ISBN input receives focus automatically.

Example header:

> **Bulk Add — Shelf E4**
> 27 scanned · 21 ready · 4 review · 1 incomplete · 1 duplicate

The user can immediately begin scanning.

No additional setup or confirmation is required.

---

# Scanning Workflow

Each successful barcode scan immediately creates an item in the intake queue.

Initial state:

> **LOOKING UP**
> `9780143127741`

Metadata lookup begins asynchronously.

The scanner input immediately regains focus so another item can be scanned.

When lookup completes, the row updates in place.

For example:

> **READY**
> *The Wright Brothers* — David McCullough

or:

> **NEEDS REVIEW**
> *Example Book* — Author missing

or:

> **INCOMPLETE**
> Metadata lookup failed

The user should be able to scan dozens of books while earlier records continue resolving in the background.

---

# Intake Queue

The main Bulk Add interface should use a compact, technical table/list rather than the more decorative visual language used elsewhere in the application.

Example:

| Status     | ISBN | Title   | Author        | Metadata       | Actions |
| ---------- | ---- | ------- | ------------- | -------------- | ------- |
| Ready      | 978… | Dune    | Frank Herbert | Complete       | Edit    |
| Review     | 978… | Solaris | —             | Author missing | Edit    |
| Existing   | 978… | 1984    | George Orwell | In library     | View    |
| Looking Up | 978… | —       | —             | Fetching…      | —       |

The interface should prioritize information density, status visibility, and fast correction.

---

# Item States

Each intake item progresses independently through a simple state machine.

Conceptually:

**Scanned → Looking Up → Ready / Needs Review / Incomplete / Already Exists → Saved**

## Scanned

The barcode has been accepted by the scanner/input system.

This may be effectively instantaneous before transitioning to Looking Up.

## Looking Up

Metadata lookup is currently running.

The user does not need to wait for this process before scanning another item.

## Ready

The item contains the required information and metadata lookup produced no meaningful concerns.

It is eligible to be persisted immediately.

## Needs Review

The item is valid and **can be saved**, but some metadata is absent, questionable, or incomplete.

Examples may include:

* missing publisher;
* missing publication year;
* missing page count;
* missing categories;
* missing cover;
* potentially unusual metadata returned by the lookup provider.

Needs Review is advisory rather than blocking.

## Incomplete

The item does not contain enough information to create a valid record.

For books, this means required creation fields are missing.

An Incomplete item cannot be submitted until corrected.

## Already Exists

The ISBN already exists in the current library.

The system should not silently create another record.

The user should be able to inspect or navigate to the existing record without interrupting the rest of the intake process.

## Saved

The item has been successfully persisted.

It should no longer participate in subsequent save operations.

---

# Status Filtering

The top of the intake queue should provide immediate filtering by status.

For example:

**All 27 | Ready 21 | Needs Review 4 | Incomplete 1 | Existing 1**

This allows the user to scan an entire shelf and then immediately isolate only the records requiring attention.

Status filters should not alter or interrupt the active intake session.

---

# Editing Records

Every unsaved item remains editable regardless of status.

Selecting **Edit** or clicking an appropriate portion of the row should expand the item in place into the complete metadata form.

The user should not be navigated to the standard individual-item creation page.

The expanded editor should allow correction of all supported fields, including metadata that was successfully imported.

This is necessary because metadata providers may return technically complete but undesirable values, such as:

* malformed titles;
* unwanted subtitles;
* unusual author formatting;
* incorrect categories;
* incorrect publication information.

After editing, the item should be revalidated and its status automatically recalculated.

For example:

**Incomplete → Ready**

No manual status change should be necessary.

---

# Missing Metadata Presentation

Not every empty field should be presented as an error.

The UI should distinguish between:

* required missing information;
* expected/useful metadata that could not be retrieved;
* genuinely optional fields that simply have no value.

Required missing fields should receive the strongest visual treatment because they block persistence.

Missing metadata that warrants inspection should contribute to **Needs Review**.

Ordinary optional empty fields should remain visually neutral.

This prevents a valid record from appearing broken simply because fields such as notes or purchase information are empty.

---

# Saving a Shelf

The primary completion action is:

**Save Shelf**

Its behavior should be simple and deterministic:

> **Save every currently valid unsaved item.**

This includes both:

* Ready items; and
* Needs Review items that satisfy creation requirements.

Incomplete items remain in the intake session.

Already Existing items are not duplicated.

Items still undergoing lookup should not be submitted until their state is resolved.

The user should not receive an additional dialog asking which valid items should be saved.

---

# Partial Success

Bulk Add must support partial success.

For example, if 26 items were scanned and 23 can be created:

> **23 books saved successfully**
> **3 books still need attention**

The successful records transition to Saved.

The three unresolved records remain available for editing.

The user can correct them and select **Save Shelf** again without resubmitting the 23 successful records.

One bad record must never cause the entire shelf import to fail.

---

# Completing a Shelf

Once all desired records have been handled, the application should present two primary paths:

**Start Next Shelf**

or

**Finish Bulk Add**

### Start Next Shelf

Starts another intake session without leaving the Bulk Add workflow.

The application prompts for the next destination shelf and immediately returns focus to the scanner after selection.

The shelf selector may prioritize logically adjacent shelves based on the previously completed shelf.

For example, after E4, E5 may be prominently suggested.

The application should **not automatically choose the next shelf**, because an incorrect assumption could assign many records to the wrong physical location.

### Finish Bulk Add

Ends the active Bulk Add workflow and returns the user to the appropriate administrative destination.

No additional confirmation should be necessary if there is no unsaved work.

---

# Duplicate Handling

## Duplicate Scan During Current Session

If the same ISBN is scanned twice during the same active session, the application should not create another intake row.

Instead:

* briefly highlight the existing row;
* indicate **Already scanned**;
* return focus to the scanner immediately.

Rapid duplicate scans from scanner hardware should also be debounced where appropriate.

## Item Already in Library

If the ISBN already exists in the library, the intake item should transition to:

**Already Exists**

This must not stop scanning.

The user can inspect the existing record later.

The system should not silently create duplicate records.

---

# Failure and Recovery

Bulk Add should be designed around the assumption that interruptions will eventually occur.

Possible interruptions include:

* metadata provider failure;
* temporary backend failure;
* network loss;
* browser refresh;
* accidental navigation;
* application closure;
* intentionally stopping before all problem records have been corrected.

The user should not have to physically rescan an entire shelf because of one of these events.

## Metadata Lookup Failure

The scanned ISBN remains in the intake session.

The user should be able to:

* retry lookup;
* manually enter metadata; or
* leave the record unresolved for later.

## Navigation Protection

If unsaved intake work exists and the user attempts to leave the workflow, the application should warn them before discarding work.

## Recoverable Sessions

Bulk Add should ultimately support unfinished intake sessions that can be resumed later.

For example:

> **Bulk Add — E4**
> 3 items incomplete
> Last updated today

A recoverable intake session makes Bulk Add function as an **import job** rather than a temporary form.

This is particularly valuable when processing large physical collections.

---

# Visual Direction

Bulk Add belongs to the application's administrative/tooling experience.

It should therefore prioritize:

* information density;
* obvious system state;
* compact controls;
* clear validation;
* rapid keyboard/scanner interaction;
* visible progress;
* predictable behavior.

It does **not** need to strongly imitate the physical-library aesthetic used by the discovery-oriented portions of the application.

The surrounding application can retain its overall visual identity, but Bulk Add itself should feel like a professional inventory/catalog-management interface.

Status should be visually distinguishable at a glance, while never relying exclusively on color.

Possible states should have consistent iconography, labels, and visual treatment.

---

# Interaction Target

For a normal successful shelf, the ideal workflow is:

**Bulk Add → Select Shelf → Scan → Scan → Scan → … → Save Shelf → Start Next Shelf → Select Shelf → Scan…**

There should be no required interaction between individual successful scans.

For a shelf containing metadata problems:

**Bulk Add → Select Shelf → Scan entire shelf → Filter Needs Review/Incomplete → Correct desired records → Save Shelf → Next Shelf**

This is the core UX objective.

---

# Conceptual Data Model

The frontend should treat Bulk Add as an **intake/import job**, not as repeated uses of the individual New Item form.

A Bulk Add session:

* has a destination shelf or equivalent location;
* contains multiple intake items;
* tracks progress and aggregate status;
* survives individual lookup failures;
* permits partial persistence;
* can potentially be resumed later.

Each intake item:

* represents one physical item being added;
* has its own lookup state;
* has its own validation state;
* contains editable metadata;
* can succeed or fail independently;
* transitions to Saved only after confirmed persistence.

This model should guide both frontend architecture and eventual backend API design.

---

# Backend/API Considerations

The final API contract should follow the authoritative backend plans, but the desired UX favors a bulk-create operation rather than requiring the frontend to orchestrate a long series of individual record creations.

Ideally, the backend should eventually support:

* submission of multiple valid intake items;
* independent validation of each item;
* partial success;
* per-item success/failure responses;
* duplicate detection;
* idempotency or equivalent protection against accidental repeated submission;
* association of all submitted items with the selected shelf/location;
* preservation/recovery of unfinished import sessions if resumable sessions are implemented server-side.

The frontend should never assume that because one item failed, the entire submitted batch failed.

The exact API shape should be established in coordination with the backend feature plan rather than allowing the frontend implementation to create a competing contract.

---

# Future Multi-Media Requirement

Bulk Add is initially being designed around **books and ISBN-based metadata lookup**, but it must not be architected as a permanently book-specific feature.

The application is expected to eventually support **multiple kinds of media**.

Different media types may have:

* different identifiers;
* different scanners or lookup mechanisms;
* different required fields;
* different metadata providers;
* different validation rules;
* different duplicate-detection rules;
* different location/container concepts;
* different editable columns;
* different record-creation endpoints.

Therefore, the Bulk Add workflow should be designed as a reusable **bulk intake framework**.

The general process should remain:

**Choose destination/context → capture identifier or manual entry → perform lookup → populate table entry → validate → classify status → optionally edit → persist valid records → resolve exceptions**

Books are the first implementation of that framework, not the definition of the framework itself.

In particular, the intake table should be adaptable so that its columns, editor, validation behavior, lookup process, and persistence operation can change according to the selected media type.

The implementation should avoid deeply coupling concepts such as `ISBN`, `author`, or `shelf` to the generic Bulk Add infrastructure when those concepts can instead be supplied by the book-specific intake configuration.

The long-term goal is for future media types to reuse the **same administrative workflow and interaction model** while supplying their own table-entry and metadata requirements.

---

# Summary

Bulk Add should feel like managing an import operation in a technical application.

The user chooses where the items belong, begins scanning, and continues scanning without interruption. The application performs lookup and validation asynchronously and moves each record through its appropriate state automatically.

Problems accumulate visibly rather than interrupting the user.

Valid records can be saved regardless of whether other records require attention. Every imported value remains editable. Failed records can be corrected manually. Duplicate records are prevented. Unfinished work can eventually be recovered.

Most importantly, the user should spend their time **scanning and correcting actual exceptions**, not repeatedly confirming things the application already knows.

The initial book/ISBN implementation should establish this workflow as a generic bulk-intake pattern capable of supporting additional media types as the application expands.

