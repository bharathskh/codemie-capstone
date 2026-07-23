# Plan: User Login Page (Username/Password)

## Story
As a registered user, I want to log into the application using my username and password, so that I can securely access the application and view the Home page.

## Acceptance Criteria (provided)
**AC1 – Display Login Page**
- Given the user launches the application
- When the application loads
- Then the Login page should be displayed with:
  - Username field
  - Password field
  - Login button
  - Reset button

> Note: This plan covers AC1 explicitly and includes minimal recommended follow-ups to make the feature usable end-to-end (auth + redirect), which can be implemented now or split into subsequent stories.

---

## Implementation Plan

### 1) Frontend

#### 1.1 Routes / Navigation
- Add/confirm routes:
  - `/login` -> LoginPage
  - `/home` (or `/`) -> HomePage (protected)
- On app load:
  - If unauthenticated, route/redirect to `/login`.
  - If authenticated, route/redirect to `/home`.

#### 1.2 Login Page UI (AC1)
- Build `LoginPage` with:
  - Username input (type `text`)
  - Password input (type `password`)
  - Login button (primary)
  - Reset button (secondary)
- Basic UX:
  - Controlled inputs with local state.
  - Disable Login button while request in-flight.
  - Show generic error banner/message area (optional but recommended).

#### 1.3 Reset button behavior
- Implement Reset to:
  - Clear username/password fields.
  - Clear validation/errors.
  - Set focus back to Username field.

#### 1.4 Form validation (recommended)
- Client-side checks before calling backend:
  - Username required
  - Password required
  - Optional: trim username
  - Optional: max lengths (e.g., 150 chars)

#### 1.5 API integration
- Call backend `POST /api/auth/login` with `{ username, password }`.
- On success:
  - Store session token (HTTP-only cookie preferred) or store access token (if SPA) securely.
  - Navigate to Home.
- On failure:
  - Show message: `Invalid username or password`.

#### 1.6 Protected Route (recommended)
- Create `RequireAuth` wrapper / middleware in the frontend router:
  - If no valid session, redirect to `/login`.

---

### 2) Backend

#### 2.1 Authentication endpoints
- Implement:
  - `POST /api/auth/login`
    - Input: username, password
    - Validate request schema
    - Verify credentials
    - On success: establish session
      - Preferred: set secure, HTTP-only cookie (SameSite=Lax/Strict as appropriate)
      - Alternative: return JWT access token + refresh token strategy
    - On failure: return 401 with generic error
  - `POST /api/auth/logout` (recommended)
    - Clear session/cookie
  - `GET /api/auth/me` (recommended)
    - Returns current user profile to support app bootstrapping

#### 2.2 Credential verification
- Store hashed passwords (bcrypt/argon2).
- Compare password hash securely.
- Ensure no password logging.

#### 2.3 Security controls (recommended)
- Enforce HTTPS in production.
- Rate limit login endpoint (IP and/or username based).
- Prevent user enumeration:
  - Always return the same error message for invalid user vs invalid password.
- CSRF protection if using cookies + browser.
- Set cookie flags: `HttpOnly`, `Secure`, `SameSite`.

#### 2.4 Authorization (for Home)
- Protect Home API endpoints (if any) by requiring authentication.
- Return 401/403 as appropriate.

---

### 3) Database

#### 3.1 Users table
- Ensure a `users` table exists with at least:
  - `id` (PK)
  - `username` (unique index)
  - `password_hash`
  - `created_at`, `updated_at`
  - Optional: `is_active`, `last_login_at`, `failed_login_count`, `locked_until`

#### 3.2 Session storage
Choose one:
- **Cookie session + server-side store (recommended for simplicity)**
  - `sessions` table or Redis:
    - `session_id` (PK)
    - `user_id` (FK)
    - `created_at`, `expires_at`, `revoked_at`
- **JWT-based**
  - No session table required, but consider refresh token storage:
    - `refresh_tokens` with `token_hash`, `user_id`, `expires_at`, `revoked_at`

#### 3.3 Migrations & seeds
- Create migrations for users and sessions (if missing).
- Add a seed user for development/testing (never in prod).

---

## Testing Plan

### Frontend
- Unit/UI tests:
  - Login page renders username/password/login/reset (AC1)
  - Reset clears fields
  - Login triggers API call with correct payload
- E2E tests:
  - Unauthenticated app load redirects to login
  - Successful login navigates to Home
  - Invalid login shows error

### Backend
- API tests:
  - Valid credentials -> 200 and session established
  - Invalid credentials -> 401
  - Rate limit behavior (if enabled)

---

## Rollout / Deployment Notes
- Ensure environment variables for:
  - Password hashing cost factor
  - Session/JWT secrets
  - Cookie domain/secure settings
- Confirm CORS settings if frontend and backend are on different origins.

---

## Open Questions (to confirm)
1. Is this a web app (SPA) or server-rendered?
2. Should auth use cookie sessions or JWT?
3. What is the Home route and what content confirms it loaded?
4. Reset button expected behavior (clear only vs clear + focus)?
