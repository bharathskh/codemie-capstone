# Plan — User Login (Username/Password)

## Story
As a registered user, I want to log into the application using my username and password, so that I can securely access the application and view the Home page.

## Acceptance Criteria in scope (from story)
**AC1 – Display Login Page**
- On application load, show Login page with:
  - Username field
  - Password field
  - Login button
  - Reset button

> Note: This plan includes minimal additional behaviors necessary to complete the story goal (“securely access… and view Home page”), plus standard validation/error flows to make the feature testable.

---

## Implementation Plan

### 1) Frontend

#### Pages / Routes
- `/login`
  - Default landing page for unauthenticated users.
- `/home`
  - Protected route requiring authentication.

#### UI Components
- **LoginForm**
  - Inputs:
    - `username` (text)
    - `password` (password masked)
  - Buttons:
    - `Login` (primary, submits form)
    - `Reset` (secondary, clears fields and errors)

#### Client-side validation
- Required validation:
  - Username required
  - Password required
- Trim username on submit (optional, recommended).
- Disable Login button while request is in-flight.

#### API integration
- Call `POST /api/auth/login`
  - Body: `{ "username": string, "password": string }`
- On success:
  - Store auth token/session indicator (see backend section)
  - Navigate to `/home`
- On failure:
  - Show generic error message: `Invalid username or password`

#### Route guarding
- If user is unauthenticated and tries to access `/home`, redirect to `/login`.
- If user is authenticated and opens `/login`, redirect to `/home` (optional but typical).

#### Accessibility / UX
- Proper labels for inputs.
- Keyboard:
  - Tab order: username → password → login → reset
  - Enter submits.

---

### 2) Backend

#### Endpoints
1. **POST `/api/auth/login`**
   - Validates payload.
   - Verifies user credentials.
   - Returns:
     - `200 OK` with auth session (cookie) or token.
     - `401 Unauthorized` for invalid credentials.
   - Error messages should be generic to avoid user enumeration.

2. **POST `/api/auth/logout`** (recommended)
   - Clears session/cookie.

3. **GET `/api/auth/me`** (recommended)
   - Returns current authenticated user (used by route guard / app bootstrap).

#### Authentication mechanism
Choose one:
- **Cookie-based session (recommended for traditional web apps)**
  - Server creates session, sets `HttpOnly`, `Secure`, `SameSite=Lax/Strict` cookie.
- **JWT access token**
  - Returned to client and stored securely (prefer HttpOnly cookie if possible).

#### Security considerations (minimum)
- Passwords are never logged.
- Use constant-time password compare (handled by bcrypt/argon2 libs).
- Rate-limit login endpoint (basic protection).

---

### 3) Database

#### Tables
- **users**
  - `id` (PK)
  - `username` (unique, indexed)
  - `password_hash`
  - `status` (e.g., ACTIVE/LOCKED/INACTIVE) (optional)
  - `created_at`, `updated_at`

If using server sessions:
- **sessions** (or use managed store)
  - `id` (PK)
  - `user_id` (FK to users)
  - `expires_at`
  - `created_at`

#### Seed / test users
- Add a seed user for local/dev testing.

---

## Testing Plan

### Frontend
- Unit tests:
  - Renders Username/Password/Login/Reset.
  - Required field validation.
  - Reset clears inputs and errors.
- Integration tests:
  - Successful login redirects to Home.
  - Invalid login shows error.

### Backend
- Unit/integration tests:
  - Login success returns 200 and sets session/token.
  - Login failure returns 401.
  - Rate limit behavior (if enabled).

---

## Rollout Notes
- Ensure environment variables for auth secrets (JWT secret or session secret).
- Enforce HTTPS in production.
