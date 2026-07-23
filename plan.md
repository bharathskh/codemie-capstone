# Plan: User Login (Username/Password) + Home Access

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

> Note: The story implies successful authentication leads to the Home page. The repo currently contains only `README.md`, so this plan describes an implementation approach and recommended additions.

---

## Implementation Plan

### 1) Frontend

#### Pages / Routes
- `/login` (default route when unauthenticated)
- `/home` (protected route, visible only when authenticated)

#### UI Components (Login Page)
- **Username input**
  - type: `text`
  - label: `Username`
  - required
- **Password input**
  - type: `password`
  - label: `Password`
  - required
  - masked by default
- **Login button**
  - triggers submit
  - disabled while request is in-flight
- **Reset button**
  - clears username/password fields
  - clears validation errors

#### Client-side validation
- On submit, validate:
  - username not empty
  - password not empty
- Show inline messages and prevent API call if invalid.

#### Auth flow
- On login submit:
  - POST credentials to backend (`/api/auth/login`).
  - If success: store auth token (prefer httpOnly cookie; if SPA token, store in memory and refresh via cookie).
  - Redirect to `/home`.
  - If error: show generic error message.

#### Route protection
- Use a guard (e.g., React Router loader/PrivateRoute) to:
  - If unauthenticated → redirect to `/login`.
  - If authenticated → allow `/home`.

#### UX / Accessibility
- Ensure labels are associated with inputs.
- Keyboard navigable.
- Show error summary or aria-live region for login failure.

---

### 2) Backend

#### API Endpoints
1. `POST /api/auth/login`
   - Request body: `{ "username": string, "password": string }`
   - Responses:
     - `200 OK`: sets session cookie/JWT, returns `{ user: { id, username }, token? }`
     - `401 Unauthorized`: invalid credentials
     - `400 Bad Request`: missing fields

2. `POST /api/auth/logout` (recommended)
   - Clears session cookie

3. `GET /api/auth/me` (recommended)
   - Returns current user info if authenticated

#### Authentication implementation
- Verify password using a strong hash (bcrypt/argon2).
- Prefer **httpOnly, secure cookies** for session/JWT storage.
- Add rate-limiting on login endpoint to reduce brute-force risk.
- Do not reveal whether username exists (generic error message).

#### Middleware
- `requireAuth` middleware for protected endpoints (e.g., `/api/home` if needed).

---

### 3) Database

#### Tables
- `users`
  - `id` (PK)
  - `username` (unique, indexed)
  - `password_hash`
  - `created_at`
  - `updated_at`
  - optional: `is_active`, `last_login_at`

#### Seed / test data
- Provide a development seed user for local testing.

---

## Suggested Deliverables / Tasks

1. **Scaffold app** (if not present)
   - Frontend + backend skeleton, environment config, basic routing.
2. **Login page UI**
   - Username, password, login, reset.
3. **Auth API**
   - `/api/auth/login` validation + password verification.
4. **Session/JWT handling**
   - Cookie/JWT issuance, middleware.
5. **Home page**
   - Protected route; show minimal content like “Welcome, {username}”.
6. **Tests**
   - Frontend: render login fields/buttons, reset clears inputs.
   - Backend: login success/failure, validation.

---

## Security Considerations (baseline)
- TLS/HTTPS required in non-local environments.
- Password hashing (bcrypt/argon2) and constant-time comparison.
- httpOnly cookies + SameSite policy.
- CSRF protection if using cookies and state-changing endpoints.
- Rate limiting and audit logs (without sensitive data).

---

## Out of Scope (unless requested)
- MFA
- “Forgot password” workflow
- Account lockout policy details

---

## Definition of Done
- Login page displays required controls (AC1).
- Valid login authenticates user and allows access to Home.
- Unauthenticated users cannot access Home directly.
- Reset clears fields.
- Minimal tests and documentation included.
