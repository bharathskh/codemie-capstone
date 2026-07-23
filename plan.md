# Plan: User Login (Username + Password)

## Story
As a registered user, I want to log into the application using my username and password, so that I can securely access the application and view the Home page.

### Current Acceptance Criteria (from story)
**AC1 – Display Login Page**
- Given the user launches the application
- When the application loads
- Then the Login page should be displayed with:
  - Username field
  - Password field
  - Login button
  - Reset button

> Note: AC1 covers only page display. A complete implementation typically also requires success/failure handling, routing, and security constraints. This plan includes the minimal AC1 UI plus the recommended baseline flows for a functional login.

---

## Implementation Plan

### 1) Frontend

#### 1.1 Routes / Navigation
- Add a `/login` route (or make it the default route if unauthenticated).
- Add a `Home` route/page (e.g., `/`) that is protected.
- Implement a `ProtectedRoute`/`AuthGuard` that:
  - Redirects unauthenticated users to `/login`.
  - Optionally redirects authenticated users away from `/login` to `/`.

#### 1.2 Login Page UI (AC1)
- Create `LoginPage` component with:
  - Username input (`type="text"`, label + placeholder)
  - Password input (`type="password"` to mask)
  - Login button (`type="submit"`)
  - Reset button (`type="button"`)
- Form behavior:
  - Pressing **Enter** triggers submit.
  - Client-side required validation for username/password.
  - Reset button clears both fields and clears any inline error message.

#### 1.3 State Management / Session Handling
- Create an `AuthContext`/store with:
  - `user` (or token payload)
  - `isAuthenticated`
  - `login(username, password)`
  - `logout()`
- Persist session using one of:
  - **Preferred**: HttpOnly secure cookie session (backend-managed)
  - Or: token in memory + refresh via cookie (avoid localStorage if possible)

#### 1.4 API Integration
- Call backend endpoint `POST /api/auth/login` with `{ username, password }`.
- On success:
  - Update auth state.
  - Navigate to Home.
- On failure:
  - Show generic error: `Invalid username or password`.

#### 1.5 UI/UX & Accessibility
- Ensure labels are associated to inputs.
- Provide visible focus state.
- Ensure tab order: Username -> Password -> Login -> Reset.

---

### 2) Backend

#### 2.1 Auth Endpoints
Implement:
- `POST /api/auth/login`
  - Input: `{ username, password }`
  - Validate required fields.
  - Verify user exists and password hash matches.
  - On success: create session and return 200 with user summary.
  - On failure: return 401 with generic message.

Optionally (recommended for completeness):
- `POST /api/auth/logout` (invalidate session)
- `GET /api/auth/me` (return current session user)

#### 2.2 Authentication & Session Strategy
Choose one:
- **Cookie session** (recommended):
  - Set `Set-Cookie: session=...; HttpOnly; Secure; SameSite=Lax/Strict`.
  - Add server middleware to read session cookie and attach user to request.
- **JWT**:
  - Issue access token (short-lived) + refresh token in HttpOnly cookie.
  - Middleware verifies token.

#### 2.3 Password Storage & Verification
- Store password hashes using a strong algorithm:
  - bcrypt / argon2
- Never store plain passwords.

#### 2.4 Security & Hardening (baseline)
- Rate limit login endpoint (e.g., 5-10 attempts/min per IP + username).
- Avoid user enumeration:
  - Always respond with a generic error for invalid credentials.
- Log auth events (success/failure) without logging secrets.

---

### 3) Database

#### 3.1 User Table
Create/ensure a `users` table with at least:
- `id` (uuid/int, PK)
- `username` (unique, indexed)
- `password_hash`
- `created_at`, `updated_at`

Optional (recommended):
- `is_active` / `locked_until` / `failed_login_count`

#### 3.2 Session Storage (if using server sessions)
- Option A: In-memory store for dev only.
- Option B (recommended): Persist sessions in Redis or DB table.
  - If DB: `sessions` table with `id`, `user_id`, `expires_at`, `created_at`, `revoked_at`.

#### 3.3 Migration Strategy
- Add migrations for `users` (and `sessions` if needed).
- Seed at least one test user for local/dev environments.

---

## Testing Plan

### Frontend
- Component tests:
  - Renders Username/Password/Login/Reset (AC1).
  - Reset clears inputs.
  - Submit calls API and handles success/failure.
- E2E tests (Cypress/Playwright):
  - Unauthenticated user is redirected to login.
  - Successful login navigates to home.
  - Invalid credentials show error.

### Backend
- Unit/integration tests:
  - Valid credentials -> 200 + session created.
  - Invalid credentials -> 401 (generic).
  - Missing fields -> 400.
  - Rate limiting behavior (if implemented).

---

## Delivery Breakdown (incremental)
1. Add routes + Login page UI (AC1).
2. Add backend login endpoint + user table (or integrate existing).
3. Wire UI to backend.
4. Add protected route and Home redirect.
5. Add basic tests + rate limiting.

---

## Notes / Open Questions
- Is “Reset” intended to clear the form, or initiate password reset/forgot password?
- What is the desired session approach (cookie session vs JWT)?
- Do we require MFA/SSO?
