# Plan: Login (Username/Password) -> Home

## Story
As a registered user, I want to log into the application using my username and password, so that I can securely access the application and view the Home page.

### Current Acceptance Criteria (AC1)
- Display Login Page with:
  - Username field
  - Password field
  - Login button
  - Reset button

> Note: The story implies navigation to Home after successful authentication, but that is not explicitly covered in AC1. This plan includes a minimal, secure login flow to satisfy the story intent.

---

## Implementation Plan

### 1) Frontend

#### Pages / Routes
- **`/login`**
  - Render login form:
    - Username input (text)
    - Password input (password masked)
    - Login button (submit)
    - Reset button (clears form)
- **`/home`** (or `/`)
  - Protected route/page visible only to authenticated users.

#### UI Behavior
- Username and Password are required.
- Clicking **Login**:
  - Client-side validate required fields.
  - Call backend `POST /api/auth/login` with `{ username, password }`.
  - On success:
    - Store auth state (cookie-based session or token depending on backend choice).
    - Navigate to Home.
  - On failure:
    - Show a generic error message: `Invalid username or password`.
- Clicking **Reset**:
  - Clear both fields.
  - Clear validation/error messages.
  - Focus username field.

#### Security/UX Notes
- Do **not** log passwords in client logs.
- Always use HTTPS in production.
- Ensure password field is masked by default.

#### Testing (Frontend)
- Unit tests for:
  - Renders all required controls.
  - Reset clears fields.
  - Login submits when fields provided.
  - Error message on failed login.
- E2E tests (optional):
  - Successful login redirects to Home.

---

### 2) Backend

#### Endpoints
- `POST /api/auth/login`
  - Input: `{ username: string, password: string }`
  - Output:
    - `200 OK` on success; establish session / return token.
    - `401 Unauthorized` on invalid credentials.
    - `400 Bad Request` on missing fields.
- `POST /api/auth/logout` (recommended)
  - Clears session/cookie.
- `GET /api/auth/me` (recommended)
  - Returns current authenticated user profile to support app bootstrapping.

#### Authentication Logic
- Validate request body.
- Lookup user by username.
- Compare password using a secure hash verifier (e.g., bcrypt/argon2).
- On success:
  - Create session (server-side session store) **or** issue a signed JWT.
  - Return minimal user info.

#### Error Handling
- Return generic 401 message (avoid leaking which field is wrong).

#### Security
- Password hashing: **bcrypt** or **argon2**.
- Rate limiting / throttling (recommended): limit login attempts by IP/username.
- Secure cookies if using sessions:
  - `HttpOnly`, `Secure`, `SameSite=Lax`.

#### Testing (Backend)
- Unit/integration tests for:
  - Valid login returns 200.
  - Invalid login returns 401.
  - Missing fields returns 400.
  - Password verification uses hash compare.

---

### 3) Database

#### Users Table (minimum)
- `users`
  - `id` (PK)
  - `username` (unique, indexed)
  - `password_hash`
  - `created_at`
  - `updated_at`

Optional additions (future):
- `is_active`, `locked_until`, `last_login_at`, `failed_login_attempts`

#### Seed / Migration
- Add migration to create `users`.
- Seed a test user for local/dev environments.

---

## Milestones / Tasks
1. Add `/login` UI with required fields/buttons.
2. Implement reset behavior.
3. Add backend auth endpoint(s) and password hashing.
4. Add users table + migration + seed.
5. Add protected Home route and redirect unauthenticated users to Login.
6. Add tests (FE + BE).
7. Update documentation (README) with local setup.

---

## Open Questions (to confirm)
1. Is this a **web** app? If yes, do we prefer **cookie-based sessions** or **JWT**?
2. What is the exact Home route (`/home` vs `/`)?
3. Username format: free-form vs email? Case sensitivity?
4. Do we need account lockout/rate limiting in this first iteration?

