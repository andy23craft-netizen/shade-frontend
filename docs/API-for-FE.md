# API for Frontend

Home library API (FastAPI).

**Default local base:** `http://127.0.0.1:8000`
**Routes:** server root; no `/api` prefix
**Interactive OpenAPI:** `/docs`

---

# Auth

Send the shared secret on every protected request:

Authorization: Bearer <API_SECRET_KEY>

There is no login/logout or session system.

Missing or invalid credentials return **403**:

{
"detail": "Invalid authentication credentials"
}

## Error contract

Protected endpoints use these HTTP status codes:

| Status | Meaning                   | Typical cases                                                                                         |
| ------ | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `403`  | Authentication failure    | Missing or invalid Bearer token                                                                       |
| `404`  | Resource not found        | Book does not exist; soft-deleted book on operations that exclude deleted books                       |
| `409`  | State conflict            | Restoring an active book; checking out an already-loaned book; checking in a book with no active loan |
| `422`  | Validation failure        | Invalid request body, invalid ISBN, invalid rating, invalid pages, missing required fields            |
| `502`  | Metadata provider failure | ISBN metadata provider returned an error                                                              |
| `504`  | Metadata provider timeout | ISBN metadata provider timed out                                                                      |

FastAPI validation errors (`422`) use the standard FastAPI shape:

{
"detail": [
{
"type": "string_too_long",
"loc": ["body", "title"],
"msg": "String should have at most 255 characters",
"input": "..."
}
]
}

### Public routes

* `GET /health`

### Protected routes

All other routes require authentication, including:

* `/books`
* `/loans`
* `/dashboard`
* `/protected`

CORS is not currently configured. A browser frontend running on another origin will need a proxy or backend CORS configuration.

---

# API routes

| Method   | Path                        | Auth | Success                    | Purpose                        |
| -------- | --------------------------- | ---- | -------------------------- | ------------------------------ |
| `GET`    | `/health`                   | No   | `200`                      | Health/liveness check          |
| `GET`    | `/protected`                | Yes  | `200`                      | Authentication smoke check     |
| `GET`    | `/books`                    | Yes  | `200` `BookList`           | List books                     |
| `GET`    | `/books/lookup?isbn={isbn}` | Yes  | `200` `BookLookupResponse` | Look up external ISBN metadata |
| `GET`    | `/books/{id}`               | Yes  | `200` `BookRead`           | Get a book                     |
| `POST`   | `/books`                    | Yes  | `201` `BookRead`           | Create a book                  |
| `PATCH`  | `/books/{id}`               | Yes  | `200` `BookRead`           | Partially update a book        |
| `DELETE` | `/books/{id}`               | Yes  | `204`                      | Soft-delete a book             |
| `POST`   | `/books/{id}/restore`       | Yes  | `200` `BookRead`           | Restore a soft-deleted book    |
| `POST`   | `/books/{id}/checkout`      | Yes  | `200` `BookRead`           | Check a book out               |
| `POST`   | `/books/{id}/checkin`       | Yes  | `200` `BookRead`           | Check a book in                |
| `POST`   | `/books/{id}/mark-read`     | Yes  | `200` `BookRead`           | Mark a book as read            |
| `GET`    | `/loans`                    | Yes  | `200` `LoanList`           | List loan history              |
| `GET`    | `/dashboard`                | Yes  | `200` `DashboardSummary`   | Dashboard statistics           |

---

# Common error responses

The API uses FastAPI's standard error shape:

{
"detail": "Human-readable error message"
}

| Status | Meaning                                                                             |
| ------ | ----------------------------------------------------------------------------------- |
| `403`  | Missing or invalid authentication                                                   |
| `404`  | Requested book does not exist, or operation is not permitted on a soft-deleted book |
| `409`  | Valid resource but requested state transition is invalid                            |
| `422`  | Request validation failed                                                           |
| `502`  | External metadata provider failed                                                   |
| `504`  | External metadata provider timed out                                                |

Examples of `409` conflicts:

* Restoring a book that is already active
* Checking out a book that is already checked out
* Checking in a book that is not currently checked out

---

# Book lifecycle

A book can move through several states independently of its soft-delete state.

### Normal book

available
|
| checkout
v
on_loan
|
| check-in
v
available

### Reading

A book can be marked as read independently of its loan status.

unread
|
| mark-read
v
read

### Soft deletion

Soft deletion does not remove the database record.

active book
|
| DELETE /books/{id}
v
soft-deleted
|
| POST /books/{id}/restore
v
active book

Soft-deleted books:

* are omitted from `GET /books` by default
* are included when `include_deleted=true`
* remain accessible through `GET /books/{id}`
* can be restored
* cannot be checked out
* cannot be marked as read
* retain their loan and reading data

---

# Books

## `GET /books`

Returns the books in the library.

Books are ordered by title.

There is currently no pagination.

### Query parameters

| Parameter         | Type    | Default | Description                               |
| ----------------- | ------- | ------- | ----------------------------------------- |
| `include_deleted` | boolean | `false` | Include soft-deleted books in the results |

When `include_deleted=false`, soft-deleted books are excluded from both `items` and `total`.

When `include_deleted=true`, soft-deleted books are included.

### Response

{
"items": [
{
"...": "BookRead"
}
],
"total": 1
}

---

## `GET /books/{id}`

Returns a single book.

The UUID in `{id}` is the book's primary key.

Unlike the normal book list, this endpoint can return a soft-deleted book.

Returns **404** if the book does not exist.

---

## `POST /books`

Creates a book.

### Request body

`BookCreate`

Required:

* `title`
* `authors`

All other fields are optional or have defaults.

### Example

{
"isbn13": "9780140449266",
"title": "The Count of Monte Cristo",
"authors": "Alexandre Dumas",
"publisher": "Penguin Books",
"publication_date": "2003-01-01",
"pages": 1276,
"category": "fiction",
"shelf": "a1",
"tags": ["classic"],
"rating": 5
}

Returns **201** with the created `BookRead`.

---

## `PATCH /books/{id}`

Partially updates a book.

Only fields included in the request are changed.

All fields in `BookUpdate` are optional.

Returns **404** if the book does not exist.

`PATCH` can modify loan-related fields such as:

* `status`
* `borrower`
* `datetime_loaned_out`

However, frontend clients should use the dedicated checkout/check-in endpoints for loan operations so that the corresponding `loans` records remain synchronized.

---

# Soft delete and restore

## `DELETE /books/{id}`

Soft-deletes a book.

The database record is retained and `deletion_date` is populated.

Returns:

204 No Content

A second delete of an already deleted book returns **404**.

Deleting a book does not delete its loan history or reading information.

---

## `POST /books/{id}/restore`

Restores a soft-deleted book.

Sets `deletion_date` back to `null`.

Returns the restored `BookRead`.

If the book is already active:

409 Conflict

{
"detail": "Book is not deleted"
}

---

# ISBN metadata lookup

## `GET /books/lookup?isbn={isbn}`

Looks up external metadata for an ISBN.

This endpoint **does not create or modify a book**.

Accepted input:

* ISBN-10
* ISBN-13
* ISBNs containing spaces
* ISBNs containing hyphens

ISBNs are normalized to ISBN-13 when possible.

## Frontend vs API responsibilities

| Responsibility                     | Frontend | API     |
| ---------------------------------- | -------- | ------- |
| Scan barcode / ISBN with camera    | **Yes**  | No      |
| Read ISBN from scanner input       | **Yes**  | No      |
| Normalize/validate ISBN            | No       | **Yes** |
| Look up ISBN metadata              | No       | **Yes** |
| Present/edit lookup draft          | **Yes**  | No      |
| Create book record                 | No       | **Yes** |
| Validate book fields               | No       | **Yes** |
| Track book checkout/check-in state | No       | **Yes** |
| Create and update loan records     | No       | **Yes** |
| Calculate borrowing statistics     | No       | **Yes** |
| Calculate dashboard statistics     | No       | **Yes** |

The frontend is responsible for capturing input and presenting the library UI. The API is the source of truth for validation, persistence, loan state, borrowing statistics, and dashboard calculations.

For ISBN-based book entry, the intended ownership is:

FE scans barcode
|
v
FE extracts ISBN
|
v
API validates / normalizes ISBN
|
v
API performs metadata lookup
|
v
FE displays editable draft
|
v
FE submits confirmed data
|
v
API creates book

### Recommended flow

Scan / enter ISBN
|
v
GET /books/lookup
|
v
Display editable draft
|
v
User confirms / edits fields
|
v
POST /books

Lookup is optional. A frontend may create a book manually without calling `/books/lookup`.

---

## Successful lookup

{
"found": true,
"draft": {
"isbn13": "9780140449266",
"title": "The Count of Monte Cristo",
"authors": "Alexandre Dumas",
"publisher": "Penguin Books",
"publication_date": "2003",
"pages": 1276
}
}

Metadata fields other than `isbn13` may be `null`.

The returned draft is editable and is not automatically persisted.

---

## ISBN not found

Unknown ISBNs return **200**, not an error:

{
"found": false,
"draft": null
}

The frontend should allow the user to continue with manual entry.

---

## Lookup errors

| Status | Meaning                   |
| ------ | ------------------------- |
| `422`  | Invalid ISBN              |
| `502`  | Metadata provider error   |
| `504`  | Metadata provider timeout |

---

# ISBN validation

The same ISBN normalization rules apply to:

* `GET /books/lookup`
* `POST /books`
* `PATCH /books/{id}`

### Accepted

0140449264
9780140449266
978-0-14-044926-6
978 0 14 044926 6

### Behavior

* ISBN-10 is converted to ISBN-13.
* Hyphens and spaces are removed.
* Stored ISBN is normalized to ISBN-13.
* Invalid ISBNs return **422**.
* Blank ISBN values are treated as unset and stored as `null`.

Example:

{
"isbn13": "0140449264"
}

becomes:

{
"isbn13": "9780140449266"
}

---

# Checkout

## `POST /books/{id}/checkout`

Checks a book out to a borrower and creates an active `Loan` record.

### Request

{
"borrower": "Alice Johnson",
"checked_out_at": "2026-08-08T10:00:00Z",
"due_at": "2026-08-21",
"notes": "Handle with care"
}

Only `borrower` is required.

If `checked_out_at` is omitted, the API uses the current UTC timestamp.

### Success

Returns `200` with the updated `BookRead`.

The book will have:

{
"status": "on_loan",
"borrower": "Alice Johnson",
"datetime_loaned_out": "2026-08-08T10:00:00Z"
}

A corresponding `Loan` is created with `returned_at=null`.

### Checkout errors

**404**

* Book does not exist
* Book is soft-deleted

**409**

Book is already checked out.

{
"detail": "Book is already checked out"
}

The frontend should disable or hide the checkout action when a book is already on loan.

---

# Check-in

## `POST /books/{id}/checkin`

Returns a book.

The request body is optional.

### Optional request body

{
"returned_at": "2026-08-08T18:30:00Z"
}

If `returned_at` is omitted, the API uses the current UTC timestamp.

### What happens

The active loan receives a `returned_at` timestamp.

The book is updated to:

{
"status": "available",
"borrower": null,
"datetime_loaned_out": null
}

The loan history remains in the database.

### Check-in errors

**404**

Book does not exist or is soft-deleted.

**409**

Book is not currently checked out:

{
"detail": "Book is not checked out"
}

---

# Loan history

## `GET /loans`

Returns all loan records, including active and returned loans.

Loans are ordered by `checked_out_at` descending.

There is currently no pagination or filtering.

### Response

{
"items": [
{
"id": "uuid",
"book_id": "uuid",
"borrower": "Alice Johnson",
"checked_out_at": "2026-08-08T10:00:00Z",
"due_at": "2026-08-21",
"notes": "Handle with care",
"returned_at": null,
"created_date": "2026-08-08T10:00:00.000Z",
"last_updated_date": "2026-08-08T10:00:00.000Z"
}
],
"total": 1
}

An active loan has:

"returned_at": null

A returned loan has a timestamp in `returned_at`.

There are currently no separate loan create, update, or delete HTTP endpoints. Loan records are managed through book checkout/check-in operations.

---

# Mark as read

## `POST /books/{id}/mark-read`

Marks a book as read.

The request body is required but all of its fields are optional.

### Request

{
"completion_date": "2026-08-08",
"rating": 5,
"review": "Excellent."
}

### Behavior

The API:

* sets `is_read=true`
* uses the supplied `completion_date`, if provided
* otherwise sets `completion_date` to the current UTC date when it is not already set
* applies `rating` when supplied
* applies `review` when supplied

Returns the updated `BookRead`.

### Validation

`rating` must be between **1 and 5**.

Invalid values return **422**.

### Errors

A soft-deleted or nonexistent book returns **404**.

---

# Dashboard

## `GET /dashboard`

Returns aggregate statistics for the library.

Soft-deleted books are excluded from dashboard calculations.

### Response

{
"total_books": 500,
"checked_out": 2,
"read": 250,
"unread": 250,
"recently_added": 12,
"recent_window_days": 30,
"borrowing": {
"active_loans": 2,
"lifetime_loans": 37,
"average_loan_days": 18.5
},
"reading": {
"books_read": 250,
"books_unread": 250,
"average_rating": 4.2
}
}

### Fields

| Field                         | Meaning                                     |
| ----------------------------- | ------------------------------------------- |
| `total_books`                 | Active books in the library                 |
| `checked_out`                 | Active books whose status is `on_loan`      |
| `read`                        | Active books where `is_read=true`           |
| `unread`                      | Active books where `is_read=false`          |
| `recently_added`              | Active books added during the last 30 days  |
| `recent_window_days`          | Current recent-book window; currently `30`  |
| `borrowing.active_loans`      | Active loans for non-deleted books          |
| `borrowing.lifetime_loans`    | All loans associated with non-deleted books |
| `borrowing.average_loan_days` | Average duration of returned loans          |
| `reading.books_read`          | Same active-book read count as `read`       |
| `reading.books_unread`        | Same active-book unread count as `unread`   |
| `reading.average_rating`      | Average rating of rated, non-deleted books  |

If there is insufficient data to calculate an average, the average field is `null`.

---

# Book payloads

## Enums

### `category`

unknown
religion
philosophy
fiction
nonfiction

### `shelf`

unknown
a1
a2
a3
a4
b1
b2
b3
bath
c1
c2
c3
c4
d1
d2
d3
d4
d5
e1
e2
e3
e4
e5
e6
f1
f2
f3
f4
f5
g1
g2
g3
g4
g5
g6
h1
h2
h3
h4
h5
liz_tbr

### `status`

unknown
available
on_loan
missing
display_only
reserved
reading

---

# BookCreate

`POST /books` accepts:

| Field                 | Type            | Default / requirement |
| --------------------- | --------------- | --------------------- |
| `isbn13`              | string / null   | Optional; normalized  |
| `title`               | string          | Required; max 255     |
| `authors`             | string          | Required; max 255     |
| `publisher`           | string / null   | Optional; max 255     |
| `publication_date`    | string / null   | Optional              |
| `pages`               | integer / null  | Optional; must be > 0 |
| `category`            | enum            | `unknown`             |
| `shelf`               | enum            | `unknown`             |
| `is_read`             | boolean         | `false`               |
| `status`              | enum            | `available`           |
| `tags`                | string[] / null | Optional              |
| `purchase_date`       | string / null   | Optional              |
| `purchase_price`      | number / null   | Optional              |
| `completion_date`     | string / null   | Optional              |
| `review`              | string / null   | Optional              |
| `borrower`            | string / null   | Optional              |
| `datetime_loaned_out` | string / null   | Optional              |
| `notes`               | string / null   | Optional              |
| `acquisition_source`  | string / null   | Optional              |
| `rating`              | integer / null  | Optional; 1–5         |

---

# BookUpdate

`PATCH /books/{id}` accepts the same book fields, except all fields are optional.

Only fields included in the request are modified.

ISBN validation and normalization are the same as `BookCreate`.

---

# BookRead

`BookRead` is returned by book create, update, get, restore, checkout, check-in, and mark-read operations.

It contains the book's normal fields plus:

id
creation_date
updated_date
deletion_date
times_borrowed
last_borrowed_at
average_loan_days

### Borrow statistics

`times_borrowed` is the number of loan records associated with the book.

`last_borrowed_at` is the most recent `checked_out_at` value, or `null` if the book has never been borrowed.

`average_loan_days` is calculated from returned loans only. Active loans are not included in the average.

If the book has no returned loans, `average_loan_days` is `null`.

---

# BookList

{
"items": [
{
"...": "BookRead"
}
],
"total": 4
}

There is currently no pagination.

`total` reflects the same filtering applied to `items`.

---

# Frontend/API responsibility

The frontend is responsible for:

* barcode scanner integration
* camera scanning
* manual ISBN entry
* displaying editable metadata
* book creation/editing forms
* checkout/check-in UI
* displaying book and loan state
* dashboard presentation

The API is responsible for:

* authentication
* ISBN validation and normalization
* external metadata lookup
* book persistence
* soft deletion/restoration
* loan creation and history
* checkout/check-in state transitions
* reading state and statistics
* dashboard calculations

### Recommended ownership for adding a book

FRONTEND                         API
|                              |
| Scan ISBN                    |
|----------------------------->|
|                              |
| GET /books/lookup            |
|----------------------------->|
|                              |
|<----- editable metadata -----|
|                              |
| User edits/confirms          |
|                              |
| POST /books                  |
|----------------------------->|
|                              |
|<--------- BookRead -----------|

### Recommended ownership for borrowing

FRONTEND                         API
|                              |
| User selects book             |
| User enters borrower          |
|                              |
| POST /books/{id}/checkout     |
|----------------------------->|
|                              |
|<--------- BookRead -----------|
|                              |
| Display on-loan state         |

### Recommended ownership for returning

FRONTEND                         API
|                              |
| User selects loan/book        |
|                              |
| POST /books/{id}/checkin      |
|----------------------------->|
|                              |
|<--------- BookRead -----------|
|                              |
| Display available state       |

---

# API contract notes

This document describes the current MVP API surface.

The frontend should use dedicated endpoints for stateful operations rather than reproducing their database effects with generic `PATCH` requests:

* Use `/checkout` to check a book out.
* Use `/checkin` to return a book.
* Use `/mark-read` to mark a book read.
* Use `/restore` to restore a deleted book.
* Use `/lookup` for external ISBN metadata.

The API does not expose direct CRUD endpoints for `Loan`. Loan records are created by checkout and completed by check-in.

OpenAPI at `/docs` is the authoritative interactive representation of the running API. If this document and the running implementation diverge, the discrepancy should be corrected in the owning feature or documented as a follow-up rather than silently introducing new behavior.
