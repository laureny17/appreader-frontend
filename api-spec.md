# API Specification: AuthAccounts Concept

**Purpose:** Handle user registration and login securely with hashed passwords and unique emails.

---

## API Endpoints

### POST /api/AuthAccounts/register

**Description:** Creates a new user account with a unique email and hashed password.

**Requirements:**

- `name`, `email`, and `password` are provided.
- No existing account with the same `email`.

**Effects:**

- Hashes the password.
- Creates a new user account and returns its ID.

**Request Body:**
{
"name": "string",
"email": "string",
"password": "string"
}

**Success Response Body (Action):**
{
"user": "ID"
}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/AuthAccounts/login

**Description:** Authenticates a user using their email and password.

**Requirements:**

- An account with the given `email` exists.
- The provided `password` matches the stored hash.

**Effects:**

- Returns the authenticated user’s ID.

**Request Body:**
{
"email": "string",
"password": "string"
}

**Success Response Body (Action):**
{
"user": "ID"
}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/AuthAccounts/\_getAccountByUserId

**Description:** Retrieves an account by its user ID.

**Requirements:**

- The user ID exists.

**Effects:**

- Returns the account document.

**Request Body:**
{
"userId": "ID"
}

**Success Response Body (Query):**
[
{
"_id": "ID",
"email": "string",
"name": "string",
"passwordHash": "string"
}
]

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/AuthAccounts/\_getAccountByEmail

**Description:** Retrieves an account by its email.

**Requirements:**

- An account with the given email exists.

**Effects:**

- Returns the account document.

**Request Body:**
{
"email": "string"
}

**Success Response Body (Query):**
[
{
"_id": "ID",
"email": "string",
"name": "string",
"passwordHash": "string"
}
]

**Error Response Body:**
{
"error": "string"
}

---

# API Specification: ApplicationAssignments Concept

**Purpose:** Manage user-to-application assignment data, track reads, and assign applications one at a time to users for review, allowing skips.

---

## API Endpoints

### POST /api/ApplicationAssignments/registerApplicationForAssignment

**Description:** Registers a new application for assignment within an event.

**Requirements:**

- None; if already registered, no effect.

**Effects:**

- Creates an `AppStatus` entry for the `(application, event)` pair with `readsCompleted = 0` and empty readers list.

**Request Body:**
{
"application": "ID",
"event": "ID"
}

**Success Response Body (Action):**
{}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/ApplicationAssignments/getNextAssignment

**Description:** Assigns the next eligible application to a user for review.

**Requirements:**

- The user has no current assignment for this event.

**Effects:**

- Selects an application the user has not read/skipped and that has the fewest reads so far.
- Creates a new `CurrentAssignment` record.

**Request Body:**
{
"user": "ID",
"event": "ID",
"startTime": "Date"
}

**Success Response Body (Action):**
{
"assignment": {
"\_id": "ID",
"user": "ID",
"application": "ID",
"startTime": "Date",
"event": "ID"
}
}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/ApplicationAssignments/skipAssignment

**Description:** Allows a user to skip their current assignment.

**Requirements:**

- The specified assignment exists and belongs to the user.

**Effects:**

- Adds the user to the readers set for the related `AppStatus`.
- Deletes the current assignment.

**Request Body:**
{
"user": "ID",
"assignment": {
"\_id": "ID",
"user": "ID",
"application": "ID",
"startTime": "Date",
"event": "ID"
}
}

**Success Response Body (Action):**
{}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/ApplicationAssignments/submitAndIncrement

**Description:** Submits a completed assignment and increments the read count for that application.

**Requirements:**

- The specified assignment exists and belongs to the user.

**Effects:**

- Increments `readsCompleted` in `AppStatus`.
- Adds the user to the readers set.
- Deletes the current assignment.
- Returns the `application` ID.

**Request Body:**
{
"user": "ID",
"assignment": {
"\_id": "ID",
"user": "ID",
"application": "ID",
"startTime": "Date",
"event": "ID"
},
"endTime": "Date"
}

**Success Response Body (Action):**
{
"application": "ID"
}

**Error Response Body:**
{
"error": "string"
}

---

# API Specification: ApplicationStorage Concept

**Purpose:** Store and manage applications and AI-generated review comments based on rubric and questions.

---

## API Endpoints

### POST /api/ApplicationStorage/addApplication

**Description:** Adds a new application to an event.

**Requirements:**

- `applicantID` and `applicantYear` are non-empty.
- `answers` is non-empty.

**Effects:**

- Creates an application record for the event with applicant data and answers.

**Request Body:**
{
"adder": "string",
"event": "ID",
"applicantID": "string",
"applicantYear": "string",
"answers": ["string"]
}

**Success Response Body (Action):**
{
"application": "ID",
"event": "ID"
}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/ApplicationStorage/generateAIComments

**Description:** Generates AI feedback comments for an application using rubric and questions.

**Requirements:**

- Application with the given ID exists.

**Effects:**

- Deletes existing AI comments.
- Inserts AI-generated comments grouped by category (`Strong`, `Weak`, `Attention`).

**Request Body:**
{
"application": "ID",
"questions": ["string"],
"rubric": ["string"],
"eligibilityCriteria": ["string"]
}

**Success Response Body (Action):**
{}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/ApplicationStorage/\_getAICommentsByApplication

**Description:** Retrieves all AI comments for a specific application.

**Requirements:**

- Application exists.

**Effects:**

- Returns all stored comments.

**Request Body:**
{
"application": "ID"
}

**Success Response Body (Query):**
[
{
"_id": "ID",
"application": "ID",
"category": "Strong|Weak|Attention",
"quotedSnippet": "string",
"justification": "string"
}
]

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/ApplicationStorage/\_getApplication

**Description:** Retrieves an application by its ID.

**Requirements:**

- Application exists.

**Effects:**

- Returns the application document.

**Request Body:**
{
"application": "ID"
}

**Success Response Body (Query):**
[
{
"\_id": "ID",
"event": "ID",
"applicantID": "string",
"applicantYear": "string",
"answers": ["string"]
}
]

**Error Response Body:**
{
"error": "string"
}

---

# API Specification: EventDirectory Concept

**Purpose:** Manage events, admins, and reader memberships with configuration and verification controls.

---

## API Endpoints

### POST /api/EventDirectory/createEvent

**Description:** Creates a new event.

**Requirements:**

- Caller is an admin.
- No event with the same name exists.

**Effects:**

- Adds a new event, sets it active, and returns its ID. Stores the optional `"endDate"` field if provided.

**Request Body:**
{
"caller": "ID",
"name": "string",
"requiredReadsPerApp": "number",
"rubric": [
{
"name": "string",
"description": "string",
"scaleMin": "number",
"scaleMax": "number"
}
],
"endDate": "Date (optional)"
}

**Success Response Body (Action):**
{
"event": "ID"
}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/EventDirectory/activateEvent

**Description:** Activates an event.

**Requirements:**

- Caller is admin.
- Event exists and is inactive.

**Effects:**

- Sets `active = true`.

**Request Body:**
{
"caller": "ID",
"name": "string"
}

**Success Response Body (Action):**
{}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/EventDirectory/inactivateEvent

**Description:** Inactivates an event.

**Requirements:**

- Caller is admin.
- Event exists and is active.

**Effects:**

- Sets `active = false`.

**Request Body:**
{
"caller": "ID",
"name": "string"
}

**Success Response Body (Action):**
{}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/EventDirectory/updateEventConfig

**Description:** Updates event settings.

**Requirements:**

- Caller is admin.
- Event exists.

**Effects:**

- Updates `rubric`, `requiredReadsPerApp`, `eligibilityCriteria`, or `endDate` for the event.

**Request Body:**
{
"caller": "ID",
"event": "ID",
"requiredReadsPerApp": "number",
"rubric": [
{
"name": "string",
"description": "string",
"scaleMin": "number",
"scaleMax": "number"
}
],
"eligibilityCriteria": ["string"],
"endDate": "Date (optional)"
}

**Success Response Body (Action):**
{}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/EventDirectory/addReader

**Description:** Approves a user as a verified reader for an event.

**Requirements:**

- Caller is admin.
- Event exists.

**Effects:**

- Adds or updates a membership record with `verified = true`.

**Request Body:**
{
"caller": "ID",
"event": "ID",
"user": "ID"
}

**Success Response Body (Action):**
{}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/EventDirectory/removeReader

**Description:** Revokes a reader’s verification.

**Requirements:**

- Caller is admin.
- User is verified for the event.

**Effects:**

- Updates membership to `verified = false`.

**Request Body:**
{
"caller": "ID",
"event": "ID",
"user": "ID"
}

**Success Response Body (Action):**
{}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/EventDirectory/addAdmin

**Description:** Grants admin privileges to a user.

**Requirements:**

- Caller is admin.
- Target user is not already admin.

**Effects:**

- Inserts user into admins collection.

**Request Body:**
{
"caller": "ID",
"user": "ID"
}

**Success Response Body (Action):**
{}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/EventDirectory/removeAdmin

**Description:** Removes admin privileges.

**Requirements:**

- Caller is admin.
- User is admin.

**Effects:**

- Deletes user from admin collection.

**Request Body:**
{
"caller": "ID",
"user": "ID"
}

**Success Response Body (Action):**
{}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/EventDirectory/\_getEventByName

**Description:** Retrieves event details by name.

**Requirements:**

- Event exists.

**Effects:**

- Returns event document.

**Request Body:**
{
"name": "string"
}

**Success Response Body (Query):**
[
{
"\_id": "ID",
"name": "string",
"active": "boolean",
"requiredReadsPerApp": "number",
"rubric": [
{
"name": "string",
"description": "string",
"scaleMin": "number",
"scaleMax": "number"
}
],
"eligibilityCriteria": ["string"],
"endDate": "Date (optional)"
}
]

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/EventDirectory/\_getEventById

**Description:** Retrieves event details by event ID.

**Requirements:**

- Event with the given ID exists.

**Effects:**

- Returns the event document.

**Request Body:**
{
"event": "ID"
}

**Success Response Body (Query):**
[
{
"\_id": "ID",
"name": "string",
"active": "boolean",
"requiredReadsPerApp": "number",
"rubric": [
{
"name": "string",
"description": "string",
"scaleMin": "number",
"scaleMax": "number"
}
],
"eligibilityCriteria": ["string"],
"endDate": "Date (optional)"
}
]

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/EventDirectory/\_isReaderVerified

**Description:** Checks whether a user is a verified reader for a given event.

**Requirements:**

- Event and user IDs are valid.

**Effects:**

- Returns the verification status.

**Request Body:**
{
"event": "ID",
"user": "ID"
}

**Success Response Body (Query):**
{
"verified": true | false
}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/EventDirectory/\_getUserMembership

**Description:** Retrieves the membership record for a user in a specific event.

**Requirements:**

- Event and user IDs are valid.

**Effects:**

- Returns the membership document if it exists.

**Request Body:**
{
"event": "ID",
"user": "ID"
}

**Success Response Body (Query):**
[
{
"\_id": "ID",
"event": "ID",
"user": "ID",
"verified": true | false
}
]

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/EventDirectory/\_getVerifiedEventsForUser

**Description:** Retrieves all events for which the user is a verified reader.

**Requirements:**

- User ID is valid.

**Effects:**

- Returns a list of event IDs.

**Request Body:**
{
"user": "ID"
}

**Success Response Body (Query):**
[
{
"event": "ID",
"name": "string"
}
]

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/EventDirectory/\_getPendingReadersForEvent

**Description:** Retrieves all users who have requested to be readers for an event but are not yet verified.

**Requirements:**

- Event ID is valid.

**Effects:**

- Returns a list of user IDs who are pending verification for the event.

**Request Body:**
{
"event": "ID"
}

**Success Response Body (Query):**
[
{
"user": "ID"
}
]

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/EventDirectory/\_isAdmin

**Description:** Checks whether a user is an administrator.

**Requirements:**

- User ID is valid.

**Effects:**

- Returns the admin status of the user.

**Request Body:**
{
"user": "ID"
}

**Success Response Body (Query):**
{
"isAdmin": true | false
}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/EventDirectory/getAllEvents

**Description:** Retrieves all events in the system (admin only).

**Requirements:**

- Caller is an admin.

**Effects:**

- Returns all events with their full details.

**Request Body:**
{}

**Success Response Body (Query):**
[
{
"\_id": "ID",
"name": "string",
"active": "boolean",
"requiredReadsPerApp": "number",
"rubric": [
{
"name": "string",
"description": "string",
"scaleMin": "number",
"scaleMax": "number"
}
],
"eligibilityCriteria": ["string"],
"endDate": "Date"
}
]

**Error Response Body:**
{
"error": "string"
}

---

# API Specification: ReviewRecords Concept

**Purpose:** Store and manage reviews, scores, flags, and comments for each application.

---

## API Endpoints

### POST /api/ReviewRecords/submitReview

**Description:** Submits a new review for an application.

**Requirements:**

- Author has not already reviewed the application.

**Effects:**

- Creates a review document and returns its ID.

**Request Body:**
{
"author": "ID",
"application": "ID",
"currentTime": "Date"
}

**Success Response Body (Action):**
{
"review": "ID"
}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/ReviewRecords/setScore

**Description:** Sets or updates a score for a criterion in a review.

**Requirements:**

- Author must be the review’s creator.

**Effects:**

- Inserts or updates a score document for that criterion.

**Request Body:**
{
"author": "ID",
"review": "ID",
"criterion": "string",
"value": "number"
}

**Success Response Body (Action):**
{
"application": "ID"
}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/ReviewRecords/editReview

**Description:** Allows an author to mark a review as editable.

**Requirements:**

- Editor is the author.

**Effects:**

- Enables subsequent score edits.

**Request Body:**
{
"editor": "ID",
"review": "ID"
}

**Success Response Body (Action):**
{
"success": true
}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/ReviewRecords/addRedFlag

**Description:** Adds a red flag to a review.

**Requirements:**

- Author is the review’s author.
- Author hasn’t flagged this review before.

**Effects:**

- Creates a RedFlag document.

**Request Body:**
{
"author": "ID",
"review": "ID"
}

**Success Response Body (Action):**
{
"flag": "ID"
}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/ReviewRecords/removeRedFlag

**Description:** Removes a red flag.

**Requirements:**

- Author previously added a flag to this review.

**Effects:**

- Deletes the RedFlag document.

**Request Body:**
{
"author": "ID",
"review": "ID"
}

**Success Response Body (Action):**
{
"success": true
}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/ReviewRecords/addComment

**Description:** Adds a comment to a review.

**Requirements:**

- Both `text` and `quotedSnippet` are non-empty.

**Effects:**

- Creates a new Comment document.

**Request Body:**
{
"author": "ID",
"review": "ID",
"text": "string",
"quotedSnippet": "string"
}

**Success Response Body (Action):**
{
"comment": "ID"
}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/ReviewRecords/editComment

**Description:** Edits a comment text.

**Requirements:**

- Author is the comment’s author.
- `newText` is non-empty.

**Effects:**

- Updates the comment text.

**Request Body:**
{
"author": "ID",
"comment": "ID",
"newText": "string"
}

**Success Response Body (Action):**
{
"success": true
}

**Error Response Body:**
{
"error": "string"
}

---

### POST /api/ReviewRecords/deleteComment

**Description:** Deletes a comment.

**Requirements:**

- Author is the comment’s author.

**Effects:**

- Deletes the comment.

**Request Body:**
{
"author": "ID",
"comment": "ID"
}

**Success Response Body (Action):**
{
"success": true
}

**Error Response Body:**
{
"error": "string"
}
