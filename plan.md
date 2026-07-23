# Plan: Username/Password Login (Display Login Page + Auth flow)

## Goal
Implement a secure username/password login entry point so a registered user can access the application and reach the Home page.

This plan covers:
- Front end: Login UI, validation, routing to Home
- Back end: Authentication endpoint, session/token issuance
- Database: Users table, password hashing storage, optional audit logging

---

## 1) Front End Implementation

### 1.1 Pages / Routes
- Add route: `/login`
- Add route: `/home` (or existing Home route) and protect it behind auth.
- Default app entry:
  - If unauthenticated: redirect to `/login`
  - If authenticated: redirect to `/home`

### 1.2 Login Page UI (AC1)
Create a `Login` page with:
- Username input field
- Password input field (masked)
- **Login** button
- **Reset** button

Behavior:
- Reset clears username + password and any validation errors; focus returns to username.
- Enter key submits the form (recommended).

### 1.3 Client-side validation
- Username required
- Password required
- Trim whitespace for username (recommended; confirm with product)

Show inline validation messages and prevent submission if invalid.

### 1.4 API integration
- On Login click:
  - Disable Login button while request is in-flight to prevent double submissions.
  - Call `POST /api/auth/login` with `{ username, password }`.
  - On success:
    - Store auth token securely (prefer HttpOnly cookie; if SPA token storage is needed, use in-memory + refresh strategy).
    - Navigate to `/home`.
  - On failure:
    - Show generic error: `Invalid username or password`.

### 1.5 Auth state management
- Add an auth provider/state module to:
  - check login status on app load
  - attach credentials (cookie or Authorization header)
  - guard protected routes (e.g., `RequireAuth` wrapper)

### 1.6 Basic accessibility & UX
- Labels tied to inputs (`for`/`id`)
- Logical tab order
- Visible focus states

---

## 2) Back End Implementation

### 2.1 Endpoints
1. `POST /api/auth/login`
   - Request: `{ "username": string, "password": string }`
   - Responses:
     - `200 OK`: returns session/token and minimal user info
     - `401 Unauthorized`: invalid credentials
     - `400 Bad Request`: missing fields

2. (Recommended) `POST /api/auth/logout`
   - Clears session/cookie.

3. (Recommended) `GET /api/auth/me`
   - Returns current authenticated user (used on app load).

### 2.2 Authentication logic
- Lookup user by username.
- Verify password using a strong hashing algorithm:
  - **bcrypt** or **argon2** (argon2 preferred if available).
- Do not reveal whether username exists; always return generic errors.

### 2.3 Session strategy
Choose one:
- **Cookie-based session** (recommended for web apps)
  - Issue secure, HttpOnly, SameSite cookie.
  - CSRF protection if state-changing endpoints are used.
- **JWT access token + refresh token**
  - Access token short-lived, refresh token stored in HttpOnly cookie.

### 2.4 Security controls
- Rate limit login endpoint (per IP and/or username).
- Log failed login attempts (without storing passwords).
- Enforce HTTPS in production.

---

## 3) Database Implementation

### 3.1 Users table
Minimum fields:
- `id` (UUID or auto-increment)
- `username` (unique, indexed)
- `password_hash`
- `status` (active/disabled) (optional but recommended)
- `created_at`, `updated_at`

### 3.2 Optional: login audit table
- `user_id` (nullable for unknown users)
- `username_attempted`
- `success` boolean
- `ip_address`
- `user_agent`
- `created_at`

---

## 4) Testing Plan

### 4.1 Front end
- Render test: login page shows username, password, login, reset.
- Reset clears fields and errors.
- Validation blocks empty submit.

### 4.2 Back end
- Login success with correct hash.
- Login failure returns 401.
- Missing fields return 400.
- Rate limiting behavior.

### 4.3 E2E
- Unauthenticated user redirected to login.
- Successful login lands on Home.
- Invalid credentials stays on login with error.

---

## 5) Delivery / Rollout
- Add feature flag if needed.
- Ensure secrets management for JWT signing keys / session keys.
- Verify cookie settings in staging (SameSite, domain, secure).
