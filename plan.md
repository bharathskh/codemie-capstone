# Plan — User Login (EPMCDMETST-57201)

## Goal
Implement a secure username/password login flow that:
- Displays a Login page (Username, Password, Login, Reset)
- Authenticates users
- Redirects authenticated users to the Home page
- Handles validation, invalid credentials, reset behavior
- Applies baseline security controls (HTTPS, rate limiting/lockout policy TBD, secure session cookies)

> Note: The repository currently contains only `README.md`. This plan assumes a typical web app architecture. The next step is to align the plan with the actual framework once the application code is present.

---

## Front End Implementation

### 1) Routes / Pages
- Add a `/login` route that renders the Login page.
- Add a protected `/home` route.
- Add an auth-guard that:
  - If user is not authenticated and hits `/home`, redirect to `/login`.
  - If user is already authenticated and hits `/login`, redirect to `/home`.

### 2) Login Page UI
Components:
- Username input
- Password input (masked)
- Login button
- Reset button

Behavior:
- Username and password are required.
- On submit:
  - Disable Login button while request is in-flight to prevent double submits.
  - Call backend `POST /api/auth/login`.
- On success:
  - Store session state (typically cookie-based; avoid storing raw tokens in localStorage unless required).
  - Redirect to `/home`.
- On error:
  - Show a generic message: “Invalid username or password.”

Reset button:
- Clears Username and Password fields.
- Clears validation and server error messages.
- Sets focus to Username.

### 3) Client-side Validation
- Username: required, trim whitespace.
- Password: required.
- Display inline field errors before making network request.

### 4) Session Handling
- Prefer HTTP-only secure cookies for session.
- Provide a `GET /api/auth/me` endpoint to retrieve current user session and drive UI state.

### 5) Testing (Front End)
- Unit tests for login form validation.
- Component tests for:
  - Rendering inputs/buttons
  - Reset behavior
  - Submit with required fields
  - Error message on invalid credentials
- E2E tests (Playwright/Cypress):
  - Successful login redirects to Home
  - Invalid credentials stay on Login

---

## Back End Implementation

### 1) API Endpoints
- `POST /api/auth/login`
  - Input: `{ username, password }`
  - Output (success): 200 + set session cookie (or return token)
  - Output (failure): 401 with generic error message
- `POST /api/auth/logout`
  - Clears session cookie
- `GET /api/auth/me`
  - Returns authenticated user profile/basic info or 401

### 2) Authentication Logic
- Retrieve user by username.
- Verify password using strong hashing algorithm (bcrypt/argon2).
- On success:
  - Create server-side session or issue signed token.
  - Set cookie flags: `HttpOnly`, `Secure`, `SameSite` (Lax/Strict depending on needs).

### 3) Rate Limiting / Lockout (AC7)
- Add request rate limiting on `POST /api/auth/login` (per IP + per username if possible).
- Optionally implement temporary lockout after N failed attempts:
  - Define N and duration with product/security stakeholders.
  - Store failed attempt counters keyed by username (and optionally IP).

### 4) Security Controls
- Enforce HTTPS (redirect HTTP to HTTPS at edge/reverse proxy).
- Do not log plaintext passwords.
- Return generic authentication failure messages.
- Add CSRF protection if using cookie-based sessions (framework-dependent).

### 5) Testing (Back End)
- Unit tests:
  - password verification
  - login success/failure
  - rate limiting/lockout behaviors
- Integration tests:
  - login sets cookie/session
  - `/me` returns user when authenticated

---

## Database Implementation

### 1) Tables
Assuming a relational DB.

#### `users`
- `id` (PK)
- `username` (unique, indexed)
- `password_hash`
- `status` (active/disabled)
- `created_at`, `updated_at`

Optional fields depending on product/security requirements:
- `failed_login_attempts`
- `locked_until`
- `last_login_at`

#### `sessions` (if server-side sessions)
- `id` (PK)
- `user_id` (FK)
- `session_token` (unique, indexed)
- `created_at`, `expires_at`, `revoked_at`
- `ip_address`, `user_agent` (optional)

### 2) Migrations
- Add migration(s) for `users` and optional `sessions`.
- Seed/dev tooling to create at least one test user.

---

## Implementation Steps (Suggested Order)
1. Confirm auth approach: cookie session vs JWT; confirm Home route.
2. Implement backend auth endpoints + password hashing verification.
3. Implement DB migrations for users (and sessions if needed).
4. Implement frontend Login page + validation + reset.
5. Add route guards + Home redirect.
6. Add rate limiting/lockout (policy confirmation required).
7. Add automated tests (unit/integration/e2e).

---

## Open Questions
- What framework(s) are used for frontend and backend?
- Cookie session vs JWT?
- Lockout policy: N attempts and duration?
- Is there an existing Home page route or should it be created?
- Should username matching be case-sensitive?
