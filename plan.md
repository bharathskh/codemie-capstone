# Plan — EPMCDMETST-56726: User login (username/password)

## Goal
Implement the login experience so a registered user can authenticate with **username + password** and securely access the **Home** page.

This plan covers front end, back end, and database needs, plus validation/error handling per the story acceptance criteria.

---

## 1) Front-end implementation

### 1.1 Routes / pages
- Add/confirm a `/login` route.
- Add/confirm a `/home` route (protected/guarded).
- If user is already authenticated and navigates to `/login`, redirect to `/home`.

### 1.2 Login page UI (AC1)
Create a `LoginPage` with:
- **Username** input
- **Password** input (masked)
- **Login** button
- **Reset** button

Additional UX behaviors (from enhanced ACs):
- Pressing **Enter** submits the form.
- Disable Login button while request is in-flight to prevent double submits.
- Show inline validation messages for required fields.

### 1.3 Form validation
Client-side validation (before calling backend):
- Username: required, trim whitespace.
- Password: required.
- Show field-level error text when invalid; clear it when user edits.

### 1.4 Reset button behavior (AC5)
On Reset:
- Clear username + password fields
- Clear validation + API error messages
- Set focus back to Username field

### 1.5 API integration
- Call `POST /api/auth/login` with payload:
  ```json
  {"username": "...", "password": "..."}
  ```
- On success:
  - Store auth state (token/cookie depending on backend choice)
  - Redirect to `/home`
- On failure:
  - Display generic error: `Invalid username or password`
- On system error (5xx/timeout):
  - Display user-friendly message, e.g. `Login service is unavailable. Please try again.`

### 1.6 Auth guarding / session handling
- Implement an `AuthGuard` (route protection) that:
  - Allows access to `/home` only when authenticated
  - Redirects unauthenticated users to `/login`
- Implement logout (if already exists, ensure it clears auth state).

### 1.7 Accessibility / security basics
- Ensure inputs have labels and are keyboard navigable.
- Password field uses type `password`.
- Do not log password values to console.

---

## 2) Back-end implementation

> Exact framework is repository-dependent; this describes endpoints and behavior.

### 2.1 Auth endpoints
Implement:
- `POST /api/auth/login`
  - Request: `{ username, password }`
  - Responses:
    - `200 OK` on success (sets secure session or returns token)
    - `401 Unauthorized` on invalid credentials (generic message)
    - `400 Bad Request` on missing fields
    - `429 Too Many Requests` if rate limiting is enabled
- `POST /api/auth/logout` (optional but recommended)
- `GET /api/auth/me` (optional but useful for session restore)

### 2.2 Authentication mechanism
Choose one:
1) **Session cookie** (recommended for traditional web apps)
   - Server creates session, sets cookie with `HttpOnly`, `Secure`, `SameSite=Lax/Strict`.
   - CSRF protection required for state-changing requests.
2) **JWT access token**
   - Return token; client stores in memory (preferred) or secure storage.
   - Use refresh tokens if long-lived sessions are needed.

### 2.3 Credential verification
- Look up user by username (or email if that is the username).
- Verify password using strong hashing (e.g., bcrypt/argon2).
- Use constant-time comparison.
- On failure, return generic `401` (do not disclose whether username exists).

### 2.4 Security controls
- Enforce HTTPS in production.
- Rate-limit login endpoint (e.g., per IP + per username).
- Audit log events:
  - login_success, login_failure (no password)
- Optional: account lockout after N failures (confirm requirement).

### 2.5 Error handling
- Ensure consistent error response schema, e.g.:
  ```json
  {"error": {"code": "INVALID_CREDENTIALS", "message": "Invalid username or password"}}
  ```
- Timeouts/exceptions return safe message and correlation id for debugging.

---

## 3) Database changes

### 3.1 Users table (if not already present)
Minimum fields:
- `id` (PK)
- `username` (unique, indexed)
- `password_hash`
- `status` (active/disabled/locked)
- `created_at`, `updated_at`

### 3.2 Optional auth-related tables
Depending on chosen auth mechanism:
- **Sessions table** (if server-side sessions)
  - `session_id`, `user_id`, `expires_at`, `created_at`, `last_seen_at`, `ip`, `user_agent`
- **Login attempts table** (if implementing lockout/audit in DB)
  - `user_id/username`, `ip`, `success`, `created_at`

### 3.3 Indexing
- Unique index on `username`.
- Index on `user_id` for sessions.

---

## 4) Testing plan

### 4.1 Front-end tests
- Login page renders required fields/buttons (AC1).
- Required validation blocks submission (AC3).
- Reset clears fields and errors (AC5).
- Successful login redirects to Home (AC2).
- Invalid credentials shows generic error (AC4).

### 4.2 Back-end tests
- `POST /login` success with correct credentials.
- `POST /login` returns 401 for wrong password/unknown user.
- `POST /login` returns 400 for missing username/password.
- Rate limiting behavior (if enabled).

### 4.3 E2E
- Full happy-path: login → home → refresh still authenticated → logout.

---

## 5) Delivery steps
1. Implement `/login` UI + validation + reset.
2. Implement backend login endpoint + password verification.
3. Add auth state management and route guards.
4. Add unit/integration tests.
5. Verify security headers/cookies configuration.

---

## Open questions (confirm)
- Is **username** an email address or a distinct username?
- Do we require **remember me**?
- Any account lockout policy requirements?
- Is Home route `/home` or `/`?
