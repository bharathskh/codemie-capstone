# Login (username/password) – Implementation Plan

## Scope
Implement a login experience for registered users so they can authenticate with **username + password** and reach the **Home** page.

Covered acceptance criteria:
- **AC1** Display login page (username, password, login, reset)
- **AC2** Successful login redirects to Home
- **AC3** Required-field validation (no API call when invalid)
- **AC4** Invalid credentials show generic error
- **AC5** Reset clears fields and errors (optionally returns focus)
- **AC6** Password is masked
- **AC7** Service/network errors show generic error and re-enable controls
- **AC8** Basic anti-brute-force (throttle/temporary block)

---

## Front End Plan

### Pages / Routes
- Add/confirm route: `/login` (default landing if unauthenticated).
- Add/confirm route: `/home` (or `/`) as post-login destination.
- Add simple auth-guard:
  - If user is authenticated and visits `/login`, redirect to `/home`.
  - If user is unauthenticated and visits protected routes, redirect to `/login`.

### UI Components
- Login form with:
  - **Username** input (`type="text"`)
  - **Password** input (`type="password"`) (AC6)
  - **Login** button (submit)
  - **Reset** button (`type="reset"` or custom handler)

### Client-side validation (AC3)
- Required validation on both fields.
- Trim username (and optionally password) before submit.
- Show inline messages next to fields.
- Block submit and do **not** call API if invalid.

### Submit behavior (AC2, AC4, AC7)
- On submit:
  - Disable Login button (and optionally inputs) while request in-flight.
  - Call backend endpoint `POST /api/auth/login` with JSON `{ username, password }`.
  - Success:
    - Store auth state (via cookie-based session or token depending on backend decision).
    - Redirect to `/home`.
  - Invalid credentials (401/403):
    - Show generic error: `Invalid username or password` (AC4).
  - Network/5xx:
    - Show generic error: `Something went wrong. Please try again.` (AC7).
  - Always re-enable controls after response.

### Reset behavior (AC5)
- Reset clears:
  - Username and password fields
  - Field-level validation errors
  - Global error banner/message
- Optionally set focus back to username.

### Basic UI states
- Error area for generic auth/service errors.
- Loading state for Login button.

### Front-end tests
- Unit/component tests:
  - Renders required fields and buttons (AC1)
  - Required validation blocks submit (AC3)
  - Reset clears values and errors (AC5)
- E2E tests (preferred):
  - Valid login redirects to Home (AC2)
  - Invalid login shows generic message (AC4)
  - Service error shows generic message (AC7)

---

## Back End Plan

### API Endpoints

#### `POST /api/auth/login`
- Request body: `{ "username": string, "password": string }`
- Validate payload:
  - missing/empty fields -> `400 Bad Request`
- Authenticate:
  - Lookup user by normalized username
  - Verify password hash with a strong algorithm (bcrypt/argon2)
- Responses:
  - Success -> `200 OK`
    - If cookie-based session: set **HttpOnly**, **Secure**, **SameSite** cookie
    - Response body may include safe user info (e.g., `{ id, username }`) or `{ ok: true }`
  - Invalid credentials -> `401 Unauthorized` with generic error
  - Locked/throttled -> `429 Too Many Requests` (or `403`) with generic error
  - Server errors -> `500` with generic error

#### Optional supporting endpoints
- `POST /api/auth/logout` to clear session cookie
- `GET /api/auth/me` to return current user/session state for the UI auth-guard

### Session / Auth Strategy
Choose one:
1) **Cookie-based sessions** (recommended for web apps)
   - Server issues session id stored in cookie
   - Session stored in DB/Redis
2) **JWT**
   - Access token in HttpOnly cookie (avoid localStorage)
   - Optional refresh tokens

### Anti-brute-force controls (AC8)
- Add one of:
  - Rate limiting per IP (and/or per username)
  - Temporary lock after N failures for a username
- Minimal approach:
  - Use middleware rate limiter (e.g., 5 attempts / 15 minutes per IP) + per-username counter.
- Ensure responses remain generic (no account enumeration).

### Logging / Observability
- Log failed attempts (username + IP) **without** logging passwords.
- Add audit-friendly events: login success/failure.

### Back-end tests
- Unit tests for:
  - Validation errors (400)
  - Invalid credentials (401)
  - Success sets cookie/session and returns 200
  - Rate limit/lockout response (429)

---

## Database Plan

### Users
- Table/collection: `users`
  - `id` (uuid/int)
  - `username` (unique, indexed)
  - `password_hash`
  - `status` (active/locked) (optional)
  - `created_at`, `updated_at`

### Sessions (if cookie-based)
- Table: `sessions` (or use Redis)
  - `id` (session id)
  - `user_id`
  - `expires_at`
  - `created_at`

### Login attempts (optional, for AC8)
- Table: `login_attempts` or store in Redis
  - `key` (username/IP)
  - `attempt_count`
  - `locked_until`
  - `updated_at`

### Migration
- Add migrations for `users` and session storage if not present.

---

## Delivery Steps
1) Confirm existing repo structure and where FE/BE live.
2) Implement backend `/api/auth/login` + session strategy.
3) Implement rate limiting / lock.
4) Implement frontend login page + routing/guards.
5) Add tests (unit + e2e).
6) Update README with local run instructions and env vars.

---

## Open Questions (need product confirmation)
- Home route/path: `/home` vs `/`?
- AC8 thresholds: default proposal **5 attempts / 15 minutes** (per IP) + optional per-username lock.
- Authentication storage: cookie session vs JWT?
