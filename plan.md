# Plan: Login feature (EPMCDMETST-57242)

## Goal
Implement a secure username/password login flow so a registered user can authenticate and be redirected to the Home page, with validation, error handling, reset/clear behavior, protected route handling, and basic security/accessibility requirements.

---

## Frontend

### Pages / Routes
- Create/Login route: `/login`
- Home route: `/` (or `/home`)
- Protected route guard:
  - If user is unauthenticated and tries to access a protected route, redirect to `/login`.
  - If user is authenticated and visits `/login`, redirect to Home.

### UI Components (Login page)
- Fields:
  - Username input (text)
  - Password input (password)
- Buttons:
  - **Login** (primary submit)
  - **Reset** (secondary; clears inputs and error messages)
- UX:
  - Enter key in password field triggers submit
  - Disable Login button while request is in-flight
  - Display inline validation errors (required fields)
  - Display generic authentication error: `Invalid username or password`
  - Display generic system error: `Something went wrong. Please try again.`

### Client-side Validation
- Username: required; trim whitespace
- Password: required; do not trim by default (preserve)
- On submit:
  - if missing required fields, prevent request and show messages

### Auth State Handling
- Store auth session token (prefer HttpOnly cookie if backend supports)
- Maintain auth state in app store/context
- Provide `logout` action clearing auth state and server session

### Accessibility
- Label inputs with `<label for=...>` (or aria-label)
- Ensure tab order: Username → Password → Login → Reset
- Errors announced via `aria-live="polite"` region
- Buttons accessible with keyboard

---

## Backend

### API Endpoints
1. `POST /api/auth/login`
   - Request: `{ "username": string, "password": string }`
   - Responses:
     - `200 OK` + session established (cookie) OR `{ token, user }`
     - `401 Unauthorized` for invalid credentials (generic message)
     - `423 Locked` or `429 Too Many Requests` for lockout/rate limiting (generic message)
     - `500` for unexpected errors

2. `POST /api/auth/logout`
   - Invalidates session/token

3. `GET /api/auth/me`
   - Returns current authenticated user (for route guards / app bootstrap)

### Authentication Logic
- Lookup user by username (case normalization rules defined consistently)
- Verify password using secure hash (bcrypt/argon2)
- Do not leak whether username exists (always return generic auth failure)
- Create session:
  - Preferred: server session + HttpOnly Secure SameSite cookie
  - Alternative: JWT access token (with refresh token pattern if needed)

### Security Controls
- Rate limiting on login attempts (IP-based and/or username-based)
- Optional account lock after N failed attempts for M minutes (configurable)
- Audit log:
  - log successful and failed logins (no password, no sensitive info)

### Error Handling
- Centralized error handler returning sanitized messages
- Correlation ID in logs

---

## Database

### Tables / Fields (minimum)
If not already present:
- `users`
  - `id`
  - `username` (unique)
  - `password_hash`
  - `is_active`
  - `created_at`, `updated_at`
- Optional security enhancements:
  - `failed_login_attempts`
  - `lock_until` timestamp
  - `last_login_at`

### Sessions (if server-side sessions)
- `sessions`
  - `id`
  - `user_id`
  - `expires_at`
  - `created_at`
  - `revoked_at`

### Migration Plan
- Add columns for lockout (if chosen) + indexes on `username`
- Add sessions table if using DB sessions

---

## Testing

### Frontend tests
- Login page renders required controls (AC1)
- Reset clears fields and errors (AC5)
- Required validation prevents submit (AC2)
- Successful login redirects to home (AC3)
- Invalid credentials shows generic error (AC4)
- Protected route redirects to /login (AC6)
- Accessibility smoke checks

### Backend tests
- Valid login returns 200 and establishes session
- Invalid login returns 401 with generic message
- Rate limit/lockout behavior returns 429/423
- `/me` returns user when authenticated, 401 otherwise

---

## Delivery Checklist
- Env config for API base URL
- Secrets for session signing/JWT
- HTTPS and secure cookie settings
- Docs: how to run locally
