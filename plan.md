# Plan: User Login (Username + Password)

## Scope
Implement a basic login experience for registered users:
- Display login page with **Username**, **Password**, **Login**, **Reset**.
- Authenticate against backend.
- On success, establish session/token and navigate to **Home**.
- On failure, show a generic error.

> Note: Repository currently only contains `README.md`. This plan is implementation-agnostic and can be applied to a new or existing codebase.

---

## Architecture (High-level)
- **Front end**: Login page UI + form validation + API call to auth endpoint + routing to Home.
- **Back end**: Auth API endpoint validates credentials, issues session/token.
- **Database**: Users table with password hash + metadata.

---

## Front-end Implementation Plan

### 1) Routes / Pages
- `/login` route renders Login page.
- `/` or `/home` route renders Home page (requires authentication).

### 2) Login Page UI (AC1)
Components:
- Username input (text)
- Password input (password type; masked)
- Login button (primary)
- Reset button (secondary)

Behavior:
- Login button triggers submit.
- Reset clears username/password and any errors; focuses Username.
- Disable Login button while request in-flight.

### 3) Client-side Validation
- Required checks for username and password.
- Trim username (optional, but recommended) before submit.
- Show inline validation errors.

### 4) API Integration
- POST `/api/auth/login` with payload:
  ```json
  { "username": "...", "password": "..." }
  ```
- On **200 OK**: store auth state and redirect to Home.
- On **401**: show generic error: `Invalid username or password`.
- On **5xx/timeout**: show `Unable to login right now. Please try again.`

### 5) Auth Guard
- Protect `/home` route:
  - If not authenticated, redirect to `/login`.
  - Optionally preserve intended path.

### 6) Accessibility / UX
- Proper labels for inputs and buttons.
- Tab order: Username → Password → Login → Reset.
- Pressing Enter in password submits.

---

## Back-end Implementation Plan

### 1) Auth Endpoint
Create endpoint:
- `POST /api/auth/login`

Request:
- JSON body `{ username, password }`

Response:
- **200**: returns user profile minimal info and sets session/cookie or returns token.
- **401**: invalid credentials.
- **400**: malformed request.

### 2) Password Handling
- Store password hashes using **Argon2id** (preferred) or **bcrypt**.
- Verify password using constant-time compare provided by library.
- Never log passwords.

### 3) Session / Token Strategy (choose one)
**Option A: Cookie-based session (recommended for traditional web apps)**
- Issue secure session cookie:
  - `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict` if possible)
- Maintain server-side session store (in-memory for dev, Redis for prod).

**Option B: JWT access token (recommended for SPA/mobile)**
- Return JWT (short-lived) + refresh token.
- Store tokens securely (HttpOnly cookies preferred over localStorage for web).

### 4) Security Controls
- Rate-limit login attempts per IP/username.
- Generic error messages to avoid account enumeration.
- Enforce HTTPS in deployment.
- Add CSRF protection if using cookie auth (depending on framework).

### 5) Observability
- Log login success/failure events (without sensitive data).
- Add request correlation id if platform supports it.

---

## Database Plan

### 1) Users Table
Minimum schema:
- `id` (uuid/int, PK)
- `username` (unique, indexed)
- `password_hash`
- `created_at`
- `updated_at`
- `is_active` (bool)

Optional:
- `last_login_at`
- `failed_login_attempts`
- `locked_until`

### 2) Migrations
- Create initial migration for users.
- Seed a test user for local/dev.

---

## Testing Plan

### Front-end
- Unit tests for validation.
- Component tests:
  - Renders fields/buttons.
  - Reset clears fields.
  - Error shown on 401.
- E2E test:
  - Successful login navigates to Home.

### Back-end
- Unit tests:
  - Password hashing/verification.
- Integration tests:
  - Login success returns 200.
  - Invalid returns 401 with generic message.
  - Rate limiting behavior.

---

## Rollout / Deployment Notes
- Configure environment variables:
  - DB connection string
  - Session/JWT secret
  - Cookie settings
- Ensure HTTPS termination in production.

---

## Deliverables
- Login page (UI + behavior per AC1)
- Auth API endpoint
- Users table/migration
- Basic Home page route protected by auth
