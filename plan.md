# Login (Username/Password) – Implementation Plan

## Story reference
- **Jira:** EPMCDMETST-57293
- **Goal:** Registered users can log in with username + password to securely access the app and reach the Home page.

## Scope
Deliver the baseline login experience with:
- Login page UI (Username, Password, Login, Reset)
- Required-field validation
- Successful authentication redirects to Home
- Invalid credentials show a generic error
- Password field masked
- Reset clears fields and errors

> Note: This repository currently contains documentation only. This plan outlines how the feature should be implemented once the application codebase (frontend/backend) is available.

---

## Acceptance Criteria mapping

### AC1 — Display Login Page
**Given** the user launches the application
**When** the application loads
**Then** the Login page is displayed with:
- Username field
- Password field
- Login button
- Reset button

### AC2 — Successful Login
**Given** the user is on the Login page
**When** the user enters a valid username and password and submits
**Then** the user is authenticated and redirected to the Home page

### AC3 — Invalid Credentials
**Given** the user is on the Login page
**When** the user enters an invalid username or password and submits
**Then** a generic error is shown (e.g., `Invalid username or password`) and the user remains on the Login page

### AC4 — Mandatory Field Validation
- If Username is blank on submit → show `Username is required`
- If Password is blank on submit → show `Password is required`
- Focus moves to the first invalid field

### AC5 — Password Field Behavior
- Password input is masked

### AC6 — Reset Button
**When** the user clicks Reset
**Then** username/password values are cleared, validation/errors are cleared, and focus returns to Username

---

## Frontend plan

### Pages/components
- **LoginPage**
  - Fields: `username`, `password`
  - Buttons: `Login` (submit), `Reset` (clear)
  - Error area for authentication failure (generic)

### Client-side validation
- Validate on submit (and optionally on blur):
  - `username`: required, trim leading/trailing whitespace
  - `password`: required
- On validation failure:
  - show inline messages next to fields
  - set focus to the first invalid field

### Interaction behaviors
- **Enter key** in password field submits the form
- **Tab order**: username → password → login → reset
- **Reset**:
  - clears username + password values
  - clears all validation messages
  - clears authentication error message
  - focuses username

### Navigation
- On success, route to **Home** (e.g., `/home`)
- On failure, remain on Login page

### Suggested test cases (UI)
- Login page renders required elements
- Submit with empty username/password → required errors
- Submit with empty password only → password required
- Reset clears values and errors
- Password field masks characters
- Successful login redirects to Home
- Invalid login shows generic error

---

## Backend plan

### Endpoint
- `POST /api/auth/login`
  - Request body: `{ "username": "...", "password": "..." }`
  - Responses:
    - `200 OK`: session established or token returned
    - `401 Unauthorized`: generic message for invalid credentials
    - `400 Bad Request`: missing/invalid body

### Authentication implementation
- Fetch user by username
- Verify password with a strong hash algorithm (bcrypt/argon2)
- Do not reveal whether the username exists

### Session/token
Choose one:
1. **Server session** (cookie-based) if stateful backend
2. **JWT** (bearer token) if stateless architecture

Document the selected approach in the codebase once chosen.

### Security requirements (baseline)
- Passwords stored only as salted hashes
- Avoid sensitive data in logs
- Use HTTPS in deployed environments

> Optional / out of scope unless requested: rate limiting, lockout/captcha, MFA/SSO.

---

## Database plan

### Users storage
Minimum fields:
- `id`
- `username` (unique index)
- `password_hash`
- `status` (optional: active/locked)
- timestamps (`created_at`, `updated_at`)

### Data for development/testing
- Provide seed/test user(s) in dev environments
- Ensure password hashing used for seeded users

---

## Definition of Done
- All AC1–AC6 implemented and tested
- Unit/integration tests for backend auth
- UI tests for form validation and navigation
- Security checklist reviewed (password hashing, generic errors, no sensitive logs)
- Documentation updated (API contract + environment setup)
