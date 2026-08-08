# Product Requirements

A good product requirements list focuses on **user outcomes**, **functional requirements**, and **acceptance criteria**,
rather than implementation questions. It also separates open questions from requirements.

Here's a more structured version of your requirements.

---

# Library Management Application – Product Requirements

## Application Pages

The application must provide the following primary pages:

* **Dashboard:** Display the library overview, borrowing metrics, and reading metrics.
* **Check Out Book:** Allow a user to select an available book and record its checkout details.
* **Check In Book:** Allow a user to select a checked-out book and record its return.
* **Admin Management UI:** Provide administrative tools for managing the library and its books.

---

## Core Book Management

### Add a Book

**Goal:** Allow a user to quickly add a book to their personal library.

**Requirements**

* Add a book by scanning or entering an ISBN.
* Support barcode scanning using the device camera or a dedicated scanner.
* Automatically retrieve book metadata from an external book information service.
* Allow the user to review and edit imported metadata before saving.
* Record library-specific information, including:

  * Purchase location
  * Purchase date (optional)
  * Purchase price (optional)
  * Shelf or storage location
  * Personal notes
  * Tags or categories (optional)

**Open Questions**

* Should UPC barcodes also be supported, or only ISBN barcodes?
* What should happen if metadata cannot be found?

---

## Borrowing

### Check Out a Book

**Goal:** Track books that have been loaned to others.

**Requirements**

* Mark a book as checked out.
* Record:

  * Borrower's name
  * Checkout date
  * Optional due date
  * Optional notes
* Prevent multiple active checkouts for the same book.
* Clearly indicate that a book is currently unavailable.

---

### Check In a Book

**Goal:** Return a borrowed book to the library.

**Requirements**

* Mark a checked-out book as returned.
* Record the return date.
* Preserve borrowing history.
* Update borrowing statistics such as:

  * Number of times borrowed
  * Last borrowed date
  * Average loan duration (optional)

---

## Reading Tracking

### Mark a Book as Read

**Goal:** Track personal reading progress.

**Requirements**

* Mark a book as read.
* Record:

  * Date completed
  * Personal rating
  * Review or notes (optional)
* Support updating the rating or review later.

---

## Library Maintenance

### Remove a Book

**Goal:** Remove books from the active collection without losing historical information.

**Requirements**

* Support soft deletion by default.
* Allow deleted books to be restored.
* Exclude deleted books from normal searches and browsing.
* Preserve historical borrowing and reading data.

---

## Dashboard

### Library Overview

**Goal:** Provide a high-level view of the collection.

**Requirements**

* Display summary statistics such as:

  * Total books
  * Books currently checked out
  * Books read
  * Books unread
  * Books added recently
* Show borrowing metrics.
* Show reading metrics.
* Present information in a read-only dashboard.

---

# Non-Functional Requirements

* Barcode scanning should require minimal user interaction.
* External metadata lookup should complete within a few seconds under normal network conditions.
* Users should be able to edit any imported metadata.
* The application should function even when metadata lookup fails (manual entry).
* All operations should be reversible where practical (e.g., restore deleted books).

## API Integration Requirements

* Include a bearer token in the `Authorization` header of every request to the backend API.

---

# Future Enhancements (Out of Scope for MVP)

* Multiple library locations
* Multiple copies of the same title
* Reading lists
* Wish list
* Import/export
* Search and filtering
* Cover image management
* Notifications for overdue books
* Integration with Goodreads, StoryGraph, or similar services
* User accounts and multi-user support

This format distinguishes **what the product must do** from **how it might be implemented**, making it easier to
prioritize features, estimate work, and derive user stories and acceptance tests.
