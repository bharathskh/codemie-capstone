# Plan: User Login (Username/Password)

## Goal
Implement a secure username/password login that displays a Login page and authenticates the user, redirecting to the Home page on success.

> Note: This plan is implementation-oriented and can be adapted to the existing app architecture once repository context is available.

---

## 1) Front-end implementation

### 1.1 Routes / screens
- Add a **/login** route (or equivalent screen in SPA/mobile).
- Ensure unauthenticated access to protected routes redirects to `/login`.
- If the user is already authenticated, redirect from `/login` to `/home`.

### 1.2 Login page UI (AC1)
Create a Login view containing:
- Username input
- Password input (masked)
- Login button
- Reset button

UX details:
- Autofocus on Username field on page load.
- Keyboard support: Enter triggers login.
- Disable Login button while request is in-flight.
- Show inline validation errors and top-level auth error area.

### 1.3 Client-side validation (AC3)
- Username required
- Password required
- Trim leading/trailing whitespace for username before submission.
- Display field-level messages (e.g., “Username is required”).

### 1.4 Reset button behavior (AC5)
- Clears Username and Password fields.
- Clears validation and authentication error messages.
- Returns focus to Username field.

### 1.5 Authentication call
- Call `POST /api/auth/login` with `{ username, password }`.
- Handle responses:
  - **200 OK**: store session/token; redirect to Home.
  - **401 Unauthorized**: show “Invalid username or password” (generic).
  - **429 Too Many Requests**: show throttling message.
  - **5xx / network**: show service error message (AC7).

### 1.6 Session/token storage
Prefer:
- **HttpOnly Secure cookie** session (best for web) OR
- If token-based: store access token in memory and refresh token in HttpOnly cookie (avoid localStorage if possible).

### 1.7 Basic accessibility
- Proper `<label for>` association.
- `aria-invalid` and `aria-describedby` for errors.
- Ensure password field is masked by default (AC6).

---

## 2) Back-end implementation

### 2.1 Auth endpoints
Implement:
- `POST /api/auth/login`
  - Request: `{ username: string, password: string }`
  - Response:
    - 200 with user info + token/session cookie
    - 401 on invalid credentials
    - 423 or 403 for locked/disabled accounts (optional, if supported)
    - 429 on rate limit
- `POST /api/auth/logout` (recommended)
- `GET /api/auth/me` (recommended) for session validation on app boot

### 2.2 Authentication logic
- Normalize username (e.g., trim; optionally lower-case if usernames are case-insensitive).
- Lookup user record by username.
- Verify password using a strong hash algorithm:
  - **bcrypt** or **argon2**.
- On success:
  - Create session (server-side) OR mint JWT (short-lived) + refresh.
  - Return minimal user profile needed for UI.

### 2.3 Security requirements
- Enforce HTTPS.
- Do not log plaintext passwords.
- Add rate limiting / brute-force mitigation:
  - e.g., 5 attempts per minute per username/IP.
- Use generic error message for auth failures.

### 2.4 Error handling
- Standardize error response shape, e.g.:
  - `{ code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' }`
  - `{ code: 'SERVICE_UNAVAILABLE', message: 'Unable to login, try again later' }`

---

## 3) Database changes

### 3.1 User table
If not present, create `users` with fields:
- `id` (uuid/int, PK)
- `username` (unique, indexed)
- `password_hash`
- `status` (ACTIVE/LOCKED/DISABLED) (optional)
- `created_at`, `updated_at`

### 3.2 Session / refresh token storage (depending on approach)
**Option A: Server sessions**
- `sessions` table:
  - `id` (PK)
  - `user_id` (FK)
  - `created_at`, `expires_at`
  - `revoked_at` (nullable)

**Option B: Refresh tokens**
- `refresh_tokens` table:
  - `id` (PK)
  - `user_id` (FK)
  - `token_hash`
  - `created_at`, `expires_at`, `revoked_at`

### 3.3 Auditing (optional)
- `login_attempts` table (or centralized logging) to support lockout/rate-limit monitoring.

---

## 4) Testing plan

### 4.1 Front-end
- Unit tests:
  - Renders Login page fields/buttons (AC1)
  - Required field validation (AC3)
  - Reset clears fields/errors (AC5)
- Integration/e2e:
  - Successful login redirects to Home (AC2)
  - Invalid credentials shows error (AC4)
  - Network error shows friendly message (AC7)

### 4.2 Back-end
- Unit tests:
  - Password verification
  - Response codes for valid/invalid credentials
- Integration tests:
  - Login endpoint end-to-end with DB fixtures
  - Rate limit behavior (if enabled)

---

## 5) Rollout considerations
- Feature flag login changes if replacing an existing auth flow.
- Ensure environment secrets (JWT signing key, session secret) configured.
- Confirm CORS/CSRF posture:
  - Cookie sessions require CSRF protections.

---

## 6) Deliverables
- Login page UI + routing guard
- Backend login endpoint + session/token handling
- DB migrations (if needed)
- Automated tests
- Documentation update (README if applicable)
