# Plan — EPMCDMETST-57203: Enhance Login flow

## Goal
Implement an enhanced login experience for registered users: display login page, validate input, authenticate, handle success/failure states, define Reset behavior, and add basic security/UX requirements.

---

## Implementation Plan

### 1) Frontend

#### Pages / Components
- **Login page**
  - Username input
  - Password input (masked)
  - Login button
  - Reset button (clears fields and messages)
  - Area for inline field validation + global error banner

#### Behaviors
- **Initial load**
  - Render login form.
  - If an existing valid session/token is detected, redirect to **Home**.

- **Validation (client-side)**
  - Username required; trim leading/trailing whitespace.
  - Password required.
  - Optional: max length protection (e.g., username 150, password 256) to avoid oversized payloads.
  - Disable Login button until required fields are present OR allow click and show inline errors.

- **Submission**
  - Support clicking **Login** and pressing **Enter**.
  - Prevent duplicate submissions (disable button while request in-flight).

- **Success**
  - On 200 OK, store session indicator:
    - If cookie-based session: nothing client-side beyond redirect.
    - If token-based: store token securely (prefer HttpOnly cookie; avoid localStorage if possible).
  - Redirect to **Home**.

- **Failure states**
  - Invalid credentials: show generic message: "Invalid username or password".
  - Locked/throttled: show "Too many attempts. Try again later." (message text may vary).
  - Network/server errors: show "Login service unavailable. Please try again.".

- **Reset button**
  - Clears username/password.
  - Clears validation and global error messages.
  - Returns focus to Username field.

#### Accessibility / UX
- Proper `<label>` for inputs; `aria-describedby` for errors.
- Tab order: Username → Password → Login → Reset.
- Focus first invalid field on submit.

---

### 2) Backend

#### API Endpoints
- **POST /auth/login**
  - Request: `{ "username": string, "password": string }`
  - Response:
    - 200: authenticated (set session cookie or return token)
    - 401: invalid credentials (generic)
    - 429: throttled / too many attempts
    - 423 (optional): account locked
    - 5xx: service error

- **POST /auth/logout** (recommended)
  - Clears session/cookie or invalidates token.

- **GET /auth/me** (recommended)
  - Returns current authenticated user; enables "already logged in" redirect logic.

#### Authentication logic
- Lookup user by username.
- Verify password using strong hashing (bcrypt/argon2).
- Do not reveal if username exists.
- Create session (server-side) or issue JWT/opaque token.

#### Brute-force protection
- Implement rate limiting per username + IP (or IP alone if username not found).
- Example policy (confirm with stakeholders):
  - 5 failed attempts in 15 minutes → 15 minute lock/throttle.
- Return 429 on throttling.

#### Logging / auditing
- Log failed attempts with timestamp, username (as provided), IP, user-agent.
- Log successful login (user id) without any password or secrets.

#### Security headers / transport
- Enforce HTTPS.
- If cookie-based auth: use `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict` if feasible).

---

### 3) Database

> Exact schema depends on existing user/auth tables; if none exist, implement minimal.

#### Tables / fields (typical)
- **users**
  - `id` (PK)
  - `username` (unique, indexed)
  - `password_hash`
  - `status` (active/disabled/locked)
  - `created_at`, `updated_at`

- **login_attempts** (if implementing DB-based throttling)
  - `id` (PK)
  - `username` (indexed)
  - `ip_address` (indexed)
  - `success` (boolean)
  - `attempted_at` (indexed)

- **sessions** (if server-side sessions)
  - `id` (PK)
  - `user_id` (FK)
  - `session_token` (unique)
  - `expires_at`
  - `created_at`

#### Migrations
- Add any missing indexes: `users.username`, `login_attempts.(username, attempted_at)`, `login_attempts.(ip_address, attempted_at)`.

---

## Testing Plan

### Unit tests
- Username trimming.
- Password verification.
- Rate limiter behavior (threshold, window).

### API/Integration tests
- 200 on valid credentials.
- 401 on invalid credentials (generic message).
- 429 after too many attempts.
- Session/token set and `/auth/me` returns authenticated user.

### UI/E2E tests
- Login page renders required elements (AC1).
- Validation messages appear for empty fields.
- Successful login redirects to Home.
- Reset clears fields + errors.

---

## Rollout / Backward compatibility
- Keep error messages generic.
- Feature flag optional (if existing login behavior must remain during rollout).

---

## Open Questions
- Is auth cookie-based session or JWT required in this repo?
- Confirm exact lockout/throttle policy.
- Confirm whether "Reset" is strictly "clear form" (assumed yes).
