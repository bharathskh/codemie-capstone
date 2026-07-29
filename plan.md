# Plan: Login (Username/Password) -> Home

## Scope
Implement the **Login page** UI (Username, Password, Login, Reset) and the supporting authentication flow so a registered user can sign in and reach the **Home** page securely.

Includes:
- Login screen rendering and UX
- Validation + error handling
- Backend authentication endpoint
- Session/token handling
- Basic access control (redirect unauthenticated users)

Out of scope (unless later added): MFA, remember-me, password reset flow.

---

## Front-end implementation

### 1) Routes / Pages
- Add/confirm a `/login` route that renders the Login page.
- Add/confirm a protected `/home` route.
- Route guards:
  - If **not authenticated** and trying to access `/home`, redirect to `/login`.
  - If **authenticated** and navigating to `/login`, redirect to `/home`.

### 2) Login Page UI (AC1)
- Components:
  - Username input (text)
  - Password input (password masked)
  - **Login** button
  - **Reset** button
- Usability:
  - Enter key submits the form
  - Disable Login while submitting
  - Show inline validation errors
  - Show generic credential error (e.g., `Invalid username or password`)

### 3) Form behavior
- Client-side validations:
  - Username required
  - Password required
- Reset button behavior:
  - Clears both fields
  - Focus returns to Username

### 4) Auth state management
- Store auth state via one of:
  - **HttpOnly cookie session** (preferred for web security)
  - or JWT access token (if required by architecture)
- Provide a small auth module:
  - `login(username, password)` -> calls backend
  - `logout()`
  - `getCurrentUser()` or `sessionCheck()` to hydrate auth on app load

### 5) API integration
- POST `/api/auth/login`
  - Request: `{ "username": string, "password": string }`
  - Response (example): `{ "user": {id, username, ...} }` (and cookie set) OR `{ token, user }`
- Handle error codes:
  - 400 validation
  - 401 invalid credentials
  - 429 too many attempts (if implemented)

### 6) Testing (FE)
- Unit tests:
  - Renders all fields/buttons (AC1)
  - Required validation for empty fields
  - Reset clears fields
- E2E/UI tests:
  - Successful login redirects to Home
  - Invalid login shows generic error
  - Unauthenticated access to Home redirects to Login

---

## Back-end implementation

### 1) Auth endpoints
- `POST /api/auth/login`
  - Validate request payload
  - Look up user by username
  - Compare password using a secure hash verification
  - On success:
    - Create session (server-side) and set cookie **OR** issue JWT
    - Return user profile summary
  - On failure:
    - Return `401` with generic message

- `POST /api/auth/logout`
  - Invalidate session / revoke token

- `GET /api/auth/me` (optional but recommended)
  - Returns current user if authenticated; otherwise 401
  - Used to hydrate auth state on front-end refresh

### 2) Password handling
- Store passwords as salted hashes (e.g., bcrypt/argon2)
- Never log raw passwords

### 3) Security considerations
- Use HTTPS
- If cookie-based sessions:
  - HttpOnly, Secure, SameSite=Lax/Strict
  - CSRF protection strategy (SameSite + CSRF token if needed)
- Rate limiting / throttling:
  - Add per-IP and/or per-username rate limits on login endpoint
  - Optionally lock account temporarily after N failures

### 4) Access control middleware
- Middleware/guard to protect `/api/*` endpoints requiring auth
- Ensure `/home` data endpoints require auth

### 5) Testing (BE)
- Unit tests for:
  - Successful authentication
  - Invalid credential responses
  - Validation errors
- Integration tests:
  - Session cookie set on login
  - Protected endpoint requires authentication

---

## Database implementation

### 1) User table (if not already present)
Minimum fields:
- `id` (PK)
- `username` (unique, indexed)
- `password_hash`
- `created_at`, `updated_at`

Optional fields:
- `failed_login_attempts`
- `locked_until`
- `last_login_at`

### 2) Session storage (if server-side sessions)
- `sessions` table:
  - `id` (session id)
  - `user_id` (FK)
  - `created_at`
  - `expires_at`
  - `revoked_at` (nullable)

If JWT-only, no sessions table required, but consider a token revocation strategy if needed.

### 3) Migrations
- Add migrations for new columns/tables.
- Ensure indices on `username`, and `sessions.user_id`.

---

## Delivery checklist
- [ ] Login page meets AC1
- [ ] Successful login redirects to Home
- [ ] Invalid credentials show generic error
- [ ] Reset clears fields
- [ ] Home route is protected
- [ ] Backend endpoint implemented + tested
- [ ] Passwords stored/verified securely
- [ ] Basic rate limiting enabled (if in scope)

---

## Notes / Assumptions
- “Reset” means clearing the username/password inputs (not password reset).
- Home page exists or will be stubbed as part of integration.
