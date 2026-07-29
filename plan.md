# Plan: Login Page + Authentication Flow

Story: As a registered user, I want to log into the application using my username and password, so that I can securely access the application and view the Home page.

## Goals
- Show a Login page with Username, Password, Login, and Reset.
- Validate inputs and provide secure error handling.
- Authenticate against backend and establish a session/token.
- Redirect authenticated users to Home.

---

## Frontend Implementation

### 1) UI: Login Page
- Create `/login` route/page.
- Components:
  - Username input (type=text)
  - Password input (type=password, masked)
  - Login button
  - Reset button
- UX behaviors:
  - Enter key on Password triggers submit.
  - Disable Login button while submitting.
  - Show inline validation errors.
  - Reset clears fields + errors and focuses Username.

### 2) Client-side Validation
- Username required; trim whitespace.
- Password required.
- Max length constraints (recommended): username 150, password 256.

### 3) API Integration
- Call backend `POST /api/auth/login` with JSON:
  ```json
  { "username": "...", "password": "..." }
  ```
- Handle responses:
  - **200 OK**: store auth (cookie or token) and redirect to `/` (Home).
  - **401**: show generic error `Invalid username or password`.
  - **429**: show `Too many attempts. Try again later.`
  - **5xx**: show `Login service unavailable.`

### 4) Session Storage Strategy (choose one)
- **Preferred (web)**: HttpOnly Secure SameSite cookie set by backend.
  - Frontend does not store tokens in localStorage.
- Alternative: store short-lived access token in memory + refresh token in HttpOnly cookie.

### 5) Route Guards
- If user is already authenticated, navigating to `/login` redirects to Home.
- Protect Home route: unauthenticated users are redirected to `/login`.

### 6) Accessibility
- Proper labels/`aria-describedby` for errors.
- Keyboard navigation and visible focus.

---

## Backend Implementation

### 1) Auth Endpoint
- Implement `POST /api/auth/login`
  - Validate request body.
  - Authenticate credentials.
  - Return generic error on failure (avoid user enumeration).

**Response options**
- Cookie session:
  - On success: set session cookie + return user summary.
  - On failure: `401`.

### 2) Password Handling
- Store passwords hashed with **bcrypt/argon2**.
- Compare provided password with stored hash.

### 3) Session / Token
- Option A: Server sessions
  - Create session record and set cookie.
  - Session TTL and sliding expiration optional.
- Option B: JWT
  - Access token short TTL; refresh token rotation.

### 4) Security Controls
- Rate-limit login attempts (per IP and/or per username).
- Optional account lockout policy (if required by org security).
- Enforce HTTPS.
- Audit logging:
  - Log login success/failure events (without passwords).

### 5) Auth Check Endpoint (recommended)
- `GET /api/auth/me` returns current authenticated user.
- Used by frontend on app boot to determine session state.

---

## Database Changes

### 1) Users Table (if not existing)
Minimum fields:
- `id` (PK)
- `username` (unique, indexed)
- `password_hash`
- `status` (active/locked/disabled)
- `created_at`, `updated_at`

### 2) Sessions Table (if using server sessions)
- `id` (PK)
- `user_id` (FK)
- `session_token` (unique)
- `expires_at`
- `created_at`, `last_seen_at`

### 3) Login Attempts (optional)
- For rate limiting / lockout:
  - `id`, `username`, `ip`, `attempted_at`, `success`

---

## Testing Plan

### Frontend
- Unit tests:
  - Required field validation.
  - Reset clears fields and errors.
- Integration/E2E:
  - Successful login redirects to Home.
  - Invalid login shows generic error.
  - Rate-limited shows 429 message.

### Backend
- Unit tests:
  - Password hash verification.
  - Login endpoint responses.
- Integration tests:
  - Session cookie set on success.
  - Access protected route requires auth.

---

## Rollout Notes
- Add environment config for auth base URL and cookie/security settings.
- Ensure CORS configured if frontend/backend are different origins.
- Set SameSite appropriately (Lax for same-site, None+Secure for cross-site).
