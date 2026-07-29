# Plan — EPMCDMETST-56737: User login with username/password and access to Home page

## Goal
Implement a login experience where a registered user can authenticate using username and password, establish a secure session, and be redirected to the Home page. Includes basic validation, reset behavior, and minimum accessibility.

> Note: This plan is implementation-agnostic because the repository currently contains only a README. Adjust to your actual application architecture once the codebase is present.

---

## Front-end implementation

### Pages / Routes
- **`/login`**
  - Render a Login page containing:
    - Username input (text)
    - Password input (password)
    - Login button (primary)
    - Reset button (secondary)
- **`/home`**
  - Protected route; only accessible when the user is authenticated.
  - Display a signed-in indicator (e.g., username in header).

### UI behavior
- **Form state**
  - Track `username`, `password`, `errors`, `isSubmitting`.
  - Trim username on submit (if required by backend) and keep password as-is.

- **Validation (AC3)**
  - On Login click:
    - If username empty -> show inline error
    - If password empty -> show inline error
    - Do not call API if errors.

- **Submit (AC2, AC4)**
  - Call `POST /api/auth/login` with `{ username, password }`.
  - While submitting: disable buttons, show spinner or loading indicator.
  - On 200:
    - Store auth state (cookie-based session preferred; avoid localStorage tokens if possible)
    - Redirect to `/home`
  - On 401/403:
    - Show generic error message: `Invalid username or password`
  - On 5xx/network:
    - Show `Something went wrong. Please try again.`

- **Reset button (AC5)**
  - Clears username/password
  - Clears error/validation messages
  - Focuses username field

### Accessibility (AC7)
- Ensure every input has an associated `<label for>`.
- Keyboard navigation:
  - Tab order: Username -> Password -> Login -> Reset
- Error messages announced via `aria-live="polite"`.
- Buttons are reachable and operable with Enter/Space.

### Protected routing
- Add a route guard:
  - If unauthenticated -> redirect to `/login`
  - If authenticated and user navigates to `/login` -> redirect to `/home` (recommended).

---

## Back-end implementation

### Authentication endpoint
- **`POST /api/auth/login`**
  - Request: `{ "username": string, "password": string }`
  - Responses:
    - `200 OK`: returns minimal user payload (e.g., `{ id, username, displayName }`) and sets secure session cookie
    - `400 Bad Request`: missing fields
    - `401 Unauthorized`: invalid credentials
    - `429 Too Many Requests`: rate limited (optional but recommended)

### Session handling (AC6)
Prefer **server-managed session cookies**:
- Cookie flags:
  - `HttpOnly: true`
  - `Secure: true` (in production)
  - `SameSite: Lax` (or `Strict` if compatible)
- Session expiration:
  - Define idle/absolute timeout (e.g., 30 min idle, 8 hrs absolute) depending on requirements.

Alternative: JWT in HttpOnly cookie (still cookie-based).

### Password verification
- Store password hashes using a strong algorithm (e.g., bcrypt/argon2).
- Login flow:
  1. Find user by username
  2. Verify password hash
  3. On success create session / issue token

### Error and audit logging
- Log authentication attempts without storing passwords.
- Use generic error messages for invalid credentials.

### Security hardening (recommended)
- Rate limiting on login endpoint (e.g., per IP and/or per username).
- Optional lockout policy after N failed attempts (if required).
- Ensure HTTPS is enforced.
- CSRF protection if using cookies (framework-dependent).

---

## Database implementation

### Tables / Collections
If using a relational DB:

**`users`**
- `id` (PK)
- `username` (unique, indexed)
- `password_hash`
- `display_name` (optional)
- `status` (active/disabled) (optional)
- `created_at`, `updated_at`

**`sessions`** (if server-side session store)
- `id` (session id, PK)
- `user_id` (FK -> users.id)
- `created_at`
- `last_accessed_at`
- `expires_at`
- `ip_address` (optional)
- `user_agent` (optional)

### Migrations / seed
- Provide migration scripts for tables.
- Seed at least one test user for local development (never seed real passwords; use known dev credentials).

---

## API / contract summary
- `POST /api/auth/login`
- `POST /api/auth/logout` (recommended)
- `GET /api/auth/me` (recommended; used by front-end to determine authenticated user)

---

## Testing plan

### Front-end
- Unit tests:
  - Renders fields/buttons
  - Required validation shown on empty submit
  - Reset clears fields and errors
- Integration/E2E:
  - Successful login redirects to Home
  - Invalid credentials show error and stay on Login

### Back-end
- Unit tests:
  - Valid credentials -> 200 and session cookie
  - Invalid credentials -> 401
  - Missing fields -> 400
- Security tests:
  - Cookie flags set properly
  - Rate limiting (if implemented)

---

## Rollout considerations
- Feature flag (optional)
- Ensure environment config for session secret, cookie domain, HTTPS, and CORS.

