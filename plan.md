# Plan: Login Page + Authentication Flow (Username/Password)

## Story
As a registered user, I want to log into the application using my username and password, so that I can securely access the application and view the Home page.

## Acceptance Criteria in scope
### AC1 – Display Login Page
**Given** the user launches the application  
**When** the application loads  
**Then** the Login page should be displayed with:
- Username field
- Password field
- Login button
- Reset button

### Recommended ACs (to complete end-to-end login)
> AC2+ are recommended to make the story testable end-to-end. If these are already covered by separate stories, link them and keep implementation aligned.
- **AC2 Successful Login**: valid credentials redirect to Home.
- **AC3 Invalid Credentials**: error shown; stay on login.
- **AC4 Required Field Validation**: prevent submit; show validation.
- **AC5 Password Masking**: password field masks characters.
- **AC6 Reset Behavior**: clears fields and errors.
- **AC7 Secure Transmission**: HTTPS/TLS; do not log secrets.

---

## Implementation Plan
Because the repository currently contains only `README.md`, this plan is implementation-agnostic and can be applied to a typical web app. Adjust filenames/framework specifics to match the actual app when scaffolding exists.

### 1) Front End

#### 1.1 UI: Login Page
- Create a **Login page route/screen** (e.g., `/login`).
- Components:
  - Text input: **Username** (`name="username"`, `autocomplete="username"`).
  - Password input: **Password** (`type="password"`, `name="password"`, `autocomplete="current-password"`).
  - **Login** button (primary) triggers form submit.
  - **Reset** button (secondary) clears fields + errors.
- UX/Accessibility:
  - Use `<label for>` or equivalent to associate labels.
  - Keyboard friendly: tab order Username → Password → Login → Reset.
  - Provide `aria-invalid` and inline validation messages.
  - On submit error, focus the error summary or first invalid field.

#### 1.2 Client-side validation
- Username required.
- Password required.
- Trim username (unless business rules require exact match).

#### 1.3 API integration
- On submit, call backend `POST /auth/login` with `{ username, password }`.
- Handle responses:
  - **200 OK**: store session/token (see security notes) and navigate to Home.
  - **401 Unauthorized**: show invalid credentials error.
  - **429 Too Many Requests**: show throttling/try later message (if enabled).
  - **5xx**: show generic error.

#### 1.4 Session handling (frontend)
- Prefer **HttpOnly Secure SameSite cookies** (best for browser security) when feasible.
- If using JWT in storage:
  - Avoid localStorage if possible; prefer HttpOnly cookies.
  - If must store client-side, use memory storage + refresh flows.

#### 1.5 Reset button behavior
- Clear username/password values.
- Clear validation errors and server errors.

---

### 2) Back End

#### 2.1 Authentication endpoint
- Implement `POST /auth/login`.
- Input:
  - `username` string
  - `password` string
- Validation:
  - Reject missing fields with **400 Bad Request**.
- Authentication:
  - Lookup user by username.
  - Verify password using strong hashing (bcrypt/argon2).
- Response patterns:
  - Success: **200** with either:
    - Set-Cookie session (`Set-Cookie: session=...; HttpOnly; Secure; SameSite=Lax`) and return user profile summary, **or**
    - Return `{ accessToken, refreshToken }` (less preferred for browser)
  - Failure: **401** with generic error `Invalid username or password`.

#### 2.2 Security requirements
- Enforce HTTPS in production.
- Never log passwords; sanitize request logging.
- Add brute-force mitigation:
  - Rate limit login endpoint (IP + username keying).
  - Optional temporary lock after N failed attempts.
- CSRF protection if using cookie-based sessions.

#### 2.3 Home page protection
- Protect `/home` (or equivalent) behind auth middleware.
- If unauthenticated:
  - Redirect to `/login` (web) or return **401** (API).

---

### 3) Database

#### 3.1 User table
- `users`
  - `id` (UUID/int, PK)
  - `username` (unique, indexed)
  - `password_hash`
  - `status` (active/disabled/locked) (optional but recommended)
  - `created_at`, `updated_at`

#### 3.2 Session / token storage
Choose one:
- **Session table** (for server-side sessions):
  - `sessions`: `id`, `user_id`, `session_token_hash`, `expires_at`, `created_at`, `revoked_at`
- **Refresh token table** (for JWT approach):
  - `refresh_tokens`: `id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`

#### 3.3 Audit/security tables (optional)
- `login_attempts`: `id`, `username`, `ip`, `success`, `created_at`
- Or implement via centralized logging/monitoring.

---

## Testing Plan

### Frontend tests
- Unit/component:
  - Renders username, password, login, reset.
  - Password input uses type=password.
  - Reset clears fields + errors.
- E2E:
  - Visit app root → redirected/shown login.
  - Successful login → Home visible.
  - Invalid login → error shown.

### Backend tests
- Unit/integration:
  - Missing fields → 400.
  - Invalid credentials → 401.
  - Valid credentials → 200; session cookie present.
  - Rate limiting enforced (if enabled).

---

## Deployment/Config Notes
- Environment variables:
  - `DATABASE_URL`
  - `SESSION_SECRET` or JWT secrets/keys
  - `PASSWORD_HASH_COST` (bcrypt cost) or argon2 params
  - `CORS_ORIGIN` (if separated FE/BE)
- Secure cookie flags in production.

---

## Rollout Plan
- Ship Login page UI (AC1) first behind feature flag if needed.
- Enable backend auth endpoint.
- Protect Home route and verify redirect.
- Add monitoring for login failures and rate limit hits.
