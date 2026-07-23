# Plan: User Login (Username/Password)

## Story
As a registered user, I want to log into the application using my username and password, so that I can securely access the application and view the Home page.

## Acceptance Criteria (given)
**AC1 – Display Login Page**
- Given the user launches the application
- When the application loads
- Then the Login page should be displayed with:
  - Username field
  - Password field
  - Login button
  - Reset button

> Note: AC1 covers only initial rendering. This plan also includes the minimum additional behaviors needed to make the login usable and secure (success/failure, validation, navigation), which can be confirmed with the PO.

---

## Implementation Plan

### 1) Front End

#### 1.1 Routes / Pages
- Add/confirm route: `/login` renders **LoginPage**.
- Add/confirm protected route guard for `/home` (or `/`) that redirects unauthenticated users to `/login`.

#### 1.2 Login Page UI
- Create a form with:
  - **Username** input (text)
  - **Password** input (password/masked)
  - **Login** button (submit)
  - **Reset** button (clears form)
- UX details:
  - Submit on Enter.
  - Disable Login button while request in-flight.
  - Display inline validation and a global error banner/message.

#### 1.3 Client-side Validation (minimum)
- Required field validation:
  - If username empty → show “Username is required”.
  - If password empty → show “Password is required”.
- Trim username input (optional but recommended) before submit.

#### 1.4 API Integration
- On submit, call backend endpoint `POST /api/auth/login` with body:
  ```json
  {"username": "...", "password": "..."}
  ```
- Handle responses:
  - **200 OK**: store auth state (cookie/session) and navigate to **Home**.
  - **401 Unauthorized**: show generic error “Invalid username or password”.
  - **429 Too Many Requests** (if implemented): show throttling message.
  - **5xx**: show “Something went wrong. Please try again.”

#### 1.5 Reset Button Behavior
- Clear username/password fields.
- Clear validation and server error messages.

#### 1.6 Auth State
- Prefer **HttpOnly secure cookie** session/JWT set by backend.
- Frontend checks authentication via:
  - `/api/auth/me` endpoint, or
  - decode non-HttpOnly token (not recommended), or
  - rely on server session cookie and a simple “me” call.

#### 1.7 Front-end Testing
- Unit tests:
  - Renders username/password/login/reset.
  - Required validation.
  - Reset clears inputs and errors.
- Integration/e2e:
  - Successful login redirects to home.
  - Invalid credentials show error.

---

### 2) Back End

#### 2.1 Auth Endpoints
Implement minimal endpoints:

1) `POST /api/auth/login`
- Validates payload.
- Looks up user by username.
- Verifies password hash.
- On success, creates a session or issues token.
- Returns 200 and sets cookie (recommended) or returns token.

2) `POST /api/auth/logout` (recommended)
- Destroys session / invalidates refresh token.

3) `GET /api/auth/me` (recommended)
- Returns current authenticated user profile (id, username, roles).

#### 2.2 Security Requirements (baseline)
- Always use HTTPS in production.
- Do not leak whether username exists; return generic 401.
- Store passwords using strong hashing (bcrypt/argon2) with per-user salt.
- Set cookies with `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict` depending on needs).
- Add basic rate limiting on login endpoint (optional but recommended).
- Log auth events safely (no passwords in logs).

#### 2.3 Error Handling / Status Codes
- 400: missing username/password
- 401: invalid credentials
- 423 (optional): locked user
- 429: too many attempts (if rate limiting)
- 500: unexpected

#### 2.4 Backend Testing
- Unit tests for password verification.
- API tests:
  - login success sets cookie/returns token
  - invalid credentials → 401
  - missing fields → 400
  - me endpoint requires auth

---

### 3) Database

#### 3.1 Users Table (minimum)
If not already present, create/confirm schema:
- `users`
  - `id` (PK)
  - `username` (unique, indexed)
  - `password_hash`
  - `status` (active/disabled) (optional)
  - `created_at`, `updated_at`

#### 3.2 Sessions Table (if using server-side sessions)
- `sessions`
  - `id` (PK)
  - `user_id` (FK)
  - `session_token` (unique)
  - `expires_at`
  - `created_at`

> If using JWT-only, sessions table may not be needed; consider refresh-token persistence if required.

#### 3.3 Migrations
- Add DB migration scripts for the above tables/columns.

---

## Deliverables
- Login page with required fields and buttons (AC1).
- Working authentication flow to reach Home.
- Backend login endpoint + secure password verification.
- Basic persistence (users + optional sessions).
- Tests (unit/API/UI) for core flows.

---

## Open Questions (for PO/Team)
1) What is the Home route/path and what does it display?
2) Session model: cookie-based session vs JWT?
3) Username rules: case sensitivity, trimming, allowed characters?
4) Do we need account lockout, MFA, password reset now or later?
5) Should Reset clear only fields or also error messages? (plan assumes both)
