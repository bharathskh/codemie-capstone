# Plan — Login (EPMCDMETST-57195)

## Goal
Implement secure username/password login so registered users can authenticate and access the Home page.

Scope includes:
- Login page UI (Username, Password, Login, Reset)
- Successful login redirect to Home
- Validation + error handling
- Reset behavior
- Basic security protections (masked password, generic errors, rate limiting/lockout policy)
- Accessibility + keyboard support

---

## Front-end implementation

### 1) Routes / pages
- Add/confirm a `/login` route/page.
- Ensure unauthenticated users are redirected to `/login` when accessing protected routes (e.g., `/home`).
- Ensure authenticated users visiting `/login` are redirected to `/home`.

### 2) Login UI
- Create a Login form with:
  - Username input (type=text)
  - Password input (type=password)
  - Login button (type=submit)
  - Reset button (type=button)

### 3) Client-side validation
- Required validation:
  - Username required
  - Password required
- Optional guardrails:
  - Trim username leading/trailing whitespace before submit
  - Enforce max lengths to match backend (e.g., username 150, password 256)

### 4) Submit behavior
- On submit:
  - Disable Login button and show loading state
  - Call backend `POST /api/auth/login`
  - On success:
    - Store session/token per chosen auth mechanism (see Backend section)
    - Load current user (`GET /api/auth/me` or from login response)
    - Navigate to `/home`
  - On failure:
    - Show generic error message (e.g., "Invalid username or password")
    - Keep user on login page

### 5) Reset behavior
- Reset clears:
  - Username value
  - Password value
  - Validation and server error messages
- Set focus back to Username field.

### 6) Accessibility & UX
- Labels associated with inputs (`label for` + input `id`).
- Keyboard:
  - Tab order: Username → Password → Login → Reset
  - Enter submits from Username/Password fields
- Errors:
  - Inline field errors with `aria-describedby`
  - Summary/banner error with `role="alert"` for auth failures
- Ensure visible focus states.

---

## Back-end implementation

### 1) API endpoints
Implement/confirm authentication endpoints:

1. `POST /api/auth/login`
   - Request body:
     ```json
     {"username": "string", "password": "string"}
     ```
   - Responses:
     - `200 OK` on success
       - Option A (cookie session): set HttpOnly secure session cookie; return user payload
       - Option B (JWT): return `{ accessToken, refreshToken?, user }`
     - `400 Bad Request` for missing fields
     - `401 Unauthorized` for invalid credentials (generic message)
     - `429 Too Many Requests` for rate limiting
     - `5xx` for unexpected errors

2. `POST /api/auth/logout` (if not present)
   - Clears session cookie or invalidates refresh token.

3. `GET /api/auth/me`
   - Returns current authenticated user.

### 2) Authentication logic
- Look up user by username.
- Verify password using a secure password hash algorithm (e.g., bcrypt/argon2).
- Do not reveal whether username exists; always return generic message for invalid credentials.

### 3) Security controls
- Enforce HTTPS in production.
- Rate limiting:
  - Apply per IP and per username (where feasible)
  - Return `429` with generic message
- Optional lockout policy:
  - Track failed attempts; temporarily lock account or require cooldown.
- CSRF protection if using cookie-based auth.
- Secure cookies if cookie-based:
  - `HttpOnly`, `Secure`, `SameSite=Lax/Strict`

### 4) Logging / auditing
- Log authentication events:
  - success/failure, timestamp, userId (if known), IP
- Avoid logging raw passwords.

---

## Database implementation

### 1) User table expectations
Ensure the user storage supports:
- `id` (PK)
- `username` (unique index)
- `password_hash`
- `status` (active/disabled/locked)
- `created_at`, `updated_at`

### 2) Optional security tables/fields
For lockout / tracking:
- `failed_login_attempts`
- `last_failed_login_at`
- `locked_until`

For refresh token strategy:
- `refresh_tokens` table:
  - `id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`

---

## Testing plan

### Front-end
- Unit tests:
  - Required field validation
  - Reset clears values and errors
- Integration/UI tests:
  - Successful login redirects to Home
  - Invalid login shows generic error
  - Keyboard navigation + Enter submit

### Back-end
- Unit tests:
  - Password verification
  - Generic error response
- Integration tests:
  - Login 200/401/400/429
  - Session/token issuance and `me` endpoint

---

## Rollout / checklist
- Feature flag if needed.
- Confirm environment config for auth secrets.
- Confirm CORS settings (if SPA + API separated).
- Update documentation for endpoints and error codes.
