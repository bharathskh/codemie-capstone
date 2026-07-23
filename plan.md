# Plan: User Login (Username/Password) -> Home Page

## Story
As a registered user, I want to log into the application using my username and password, so that I can securely access the application and view the Home page.

## Acceptance Criteria in scope (from story)
**AC1 – Display Login Page**
- On application launch/load, display Login page with:
  - Username field
  - Password field
  - Login button
  - Reset button

> Note: The story statement mentions navigating to Home after login, but ACs only specify rendering the login page. This plan includes a minimal login flow (submit + success/failure) as implementation scaffolding, but those behaviors should be confirmed in acceptance criteria.

---

## Implementation Plan

### 1) Front End

#### Pages / Routes
- Create a **`/login`** route/page.
- Ensure app default route (`/`) redirects to `/login` when unauthenticated.
- (Optional/Recommended) Create a **`/home`** route/page placeholder for post-login navigation.

#### UI Components
- Login form containing:
  - Username input
  - Password input (masked)
  - Login button (primary)
  - Reset button (secondary)

#### Behavior
- On load: render Login page.
- Reset button:
  - Clears both fields
  - Clears validation/error messages
  - Sets focus to Username input
- Login button:
  - Client-side required-field validation (username/password non-empty)
  - Calls backend auth endpoint
  - On success: store auth token/session (per stack choice) and navigate to `/home`
  - On failure: show generic error message

#### Validation & UX (recommended)
- Disable Login button while request in-flight.
- Support pressing **Enter** to submit.
- Display inline errors for required fields.

#### Front-end Testing
- Unit/component tests:
  - Renders required fields/buttons.
  - Reset clears fields.
  - Login triggers API call.
- E2E tests (optional):
  - Launch app -> login page visible.

---

### 2) Back End

#### Auth Endpoints
- `POST /api/auth/login`
  - Request: `{ "username": "...", "password": "..." }`
  - Response (success):
    - 200 with `{ "token": "<jwt>", "user": { "id": ..., "username": ... } }`
  - Response (failure):
    - 401 with `{ "message": "Invalid username or password" }`

#### Authentication approach
- Validate user credentials against stored user records.
- Password handling:
  - Store only password hashes (bcrypt/argon2)
  - Compare using secure hash verification
- Token/session:
  - Prefer JWT (stateless) for simple apps
  - Alternatively cookie-based session (HTTP-only secure cookie)

#### Authorization middleware
- Protect `GET /api/home` or any authenticated endpoints.
  - Validate JWT/cookie session.

#### Security considerations (baseline)
- Generic error message (no user enumeration).
- Rate limiting on login endpoint (recommended).
- Ensure TLS/HTTPS in deployment.
- Do not log plaintext passwords.

#### Back-end Testing
- Unit tests:
  - Login success with valid credentials.
  - Login fails with invalid credentials.
- Integration tests:
  - End-to-end auth flow with test DB.

---

### 3) Database

#### Data model
- `users` table/collection:
  - `id` (PK)
  - `username` (unique, indexed)
  - `password_hash`
  - `created_at`
  - `updated_at`
  - (Optional) `status` (ACTIVE/LOCKED/DISABLED)

#### Migrations / Seeds
- Add migration for `users`.
- Add seed user(s) for local development/testing.

#### Constraints
- Unique constraint on username.
- Password hash non-null.

---

## Delivery Steps (PR scope)
1. Add `plan.md` with implementation plan (this file).
2. (Optional) Add minimal skeleton notes in README (not included unless requested).

---

## Open Questions (to confirm with PO)
1. Should successful login redirect to Home page? (Story says yes; ACs don’t.)
2. What is expected behavior on invalid credentials?
3. Reset button: clear errors as well?
4. Username format: any validation rules (email vs free text)?
5. Session mechanism preference: JWT vs secure cookie session?

