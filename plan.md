# Login Feature Implementation Plan (Username + Password)

## Scope
Implement the **Login page display** (AC1) and supporting application layers required for a secure username/password login.

**User story:** As a registered user, I want to log into the application using my username and password, so that I can securely access the application and view the Home page.

**Acceptance Criteria in scope (explicit):**
- AC1 – Display Login Page
  - Username field
  - Password field
  - Login button
  - Reset button

> Note: This plan also outlines the minimal backend/auth/session plumbing needed for the page to function end-to-end, even if not explicitly stated in AC1.

---

## Frontend Plan

### 1) Create Login Page UI
- Route: `/login` (or app default route if unauthenticated)
- Components:
  - `Username` input
    - `type="text"`
    - label + placeholder
    - required
  - `Password` input
    - `type="password"` (masked)
    - required
  - `Login` button
    - triggers submit
  - `Reset` button
    - clears username/password + clears validation errors
- Form behavior:
  - Pressing **Enter** submits
  - Disable Login button while request is in-flight
  - Inline validation for required fields
  - Display generic error on failed login (avoid indicating which field is wrong)

### 2) Authentication Client Integration
- Create API client method: `POST /api/auth/login`
  - payload: `{ username, password }`
- Handle response:
  - On success: store session token (httpOnly cookie preferred) or memory token; update auth state; navigate to `/home`
  - On failure: show generic error message; keep user on login page

### 3) Routing / Guards
- If user is **unauthenticated**:
  - accessing protected routes redirects to `/login`
- If user is **authenticated**:
  - visiting `/login` redirects to `/home`

### 4) Accessibility / UX
- Proper `<label for>` associations
- Logical tab order (Username → Password → Login → Reset)
- Focus on Username on initial load
- Error message area announced via `aria-live="polite"`

---

## Backend Plan

### 1) Auth API
Implement endpoints:
- `POST /api/auth/login`
  - Validate request body
  - Look up user by username
  - Verify password hash
  - Return success with session (recommended: set secure cookie)
- `POST /api/auth/logout` (recommended for completeness)
  - Clear session cookie / invalidate token
- `GET /api/auth/me` (recommended)
  - Return current authenticated user profile for frontend auth bootstrap

### 2) Security
- Password hashing:
  - Use bcrypt/argon2 with strong parameters
- Transport:
  - Enforce HTTPS in production
- Session management (recommended):
  - **httpOnly**, **Secure**, **SameSite=Lax/Strict** cookie
  - Session expiration + rolling session option
- Brute-force mitigation (recommended):
  - Rate limit login endpoint (per IP + per username)
- Logging:
  - Log auth success/failure events without logging password

### 3) Validation & Error Handling
- Validate:
  - `username`: required, trim whitespace
  - `password`: required
- Error responses:
  - `401 Unauthorized` for invalid credentials with generic message
  - `400 Bad Request` for missing fields

---

## Database Plan

### 1) User Table
Minimum schema (relational example):
- `users`
  - `id` (PK)
  - `username` (unique, indexed)
  - `password_hash`
  - `created_at`, `updated_at`
  - optional: `is_active`, `last_login_at`

### 2) Sessions (if server-side sessions)
Option A — Stateless JWT (no session table):
- Store JWT in httpOnly cookie; validate signature + expiration

Option B — Server-side sessions (recommended for revoke/rotation):
- `sessions`
  - `id` (PK)
  - `user_id` (FK users.id)
  - `session_token_hash` (store hash of token)
  - `expires_at`
  - `created_at`, `revoked_at`

---

## Testing Plan

### Frontend
- Unit tests:
  - Renders username/password inputs + login/reset buttons
  - Reset clears fields and errors
- Integration tests:
  - Successful login redirects to Home
  - Invalid login shows generic error

### Backend
- Unit tests:
  - Password verification
  - Validation errors (400)
- Integration tests:
  - Login success sets cookie / returns token
  - Login failure returns 401

---

## Delivery Steps
1. Add `/login` route + page with AC1 UI
2. Implement backend `/api/auth/login` with password verification
3. Add session/token mechanism
4. Wire frontend to backend
5. Add basic tests
6. Document run steps and environment variables
