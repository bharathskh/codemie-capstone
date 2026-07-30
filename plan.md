# Plan: User Login (Username + Password)

## Goal
Implement a secure username/password login flow that displays a Login page on app launch and authenticates the user to reach the Home page.

Scope is driven by Acceptance Criteria AC1–AC8 (AC9 removed).

---

## Front End Implementation

### 1) Login Page UI (AC1)
- Create a dedicated **Login page/screen** that is the default route when the user is unauthenticated.
- Components:
  - Username input
  - Password input (masked) (AC5)
  - Login button
  - Reset button (AC6)
  - Area for validation and server error messages (AC3, AC4)

### 2) Form State + Validation (AC4)
- Client-side validation rules:
  - Username required (trim whitespace)
  - Password required
- On submit:
  - If validation fails: show inline messages and do not call API.
  - Disable Login button while request is in-flight to prevent double submit.

### 3) Reset Behavior (AC6)
- Reset button clears:
  - Username and password fields
  - Validation messages
  - Server error message banner/state
  - Any "in-flight" flags

### 4) Authentication Request Flow (AC2, AC3)
- On Login:
  - POST to backend `/api/auth/login` with `{ username, password }`.
- On success:
  - Store returned auth token/session indicator (cookie or token; see Backend section)
  - Redirect to Home route.
- On failure:
  - Display generic error: e.g., `Invalid username or password.` (do not reveal which is wrong).

### 5) Route Guarding (AC7)
- Protect Home route:
  - If no valid session/token: redirect to Login.
- On app load:
  - Check auth status (e.g., call `/api/auth/me` or validate existing token) to decide whether to show Login or Home.

---

## Back End Implementation

### 1) Auth Endpoints
Implement endpoints (names can be adapted to repo conventions):

- `POST /api/auth/login`
  - Request: `{ username: string, password: string }`
  - Validate payload (non-empty)
  - Verify user exists and password hash matches
  - Apply brute-force protection (AC8)
  - Response (success):
    - If using sessions: set secure HTTP-only cookie + return user profile basics
    - If using JWT: return `{ token, user }`
  - Response (failure): `401 Unauthorized` with generic message

- `POST /api/auth/logout` (recommended)
  - Clear session/cookie or invalidate token

- `GET /api/auth/me` (recommended for AC7)
  - Returns authenticated user info if session is valid, else `401`

### 2) Security & Session Handling (AC7)
Choose one primary approach:

**Option A: Cookie-based sessions (recommended for web apps)**
- Use server-managed session store (DB/Redis)
- Set cookie flags: `HttpOnly`, `Secure`, `SameSite=Lax/Strict`
- Add CSRF protection for state-changing endpoints if needed

**Option B: JWT tokens**
- Sign JWT with rotation-ready keys
- Store token in HttpOnly cookie (preferred) or in-memory (avoid localStorage if possible)
- Implement token expiration and refresh strategy

### 3) Brute Force Protection (AC8)
- Implement throttling/lockout rules, e.g.:
  - Track failed login attempts per username + IP
  - If `N` failures in `T` minutes:
    - Temporarily lock username for `L` minutes OR
    - Rate-limit requests from IP
- Always return generic error to avoid account enumeration.

### 4) Password Handling
- Store passwords as salted hashes (e.g., bcrypt/argon2)
- Constant-time compare
- Ensure logs never contain raw passwords

---

## Database Changes

### 1) Users Table (if not present)
- `users`
  - `id` (PK)
  - `username` (unique, indexed)
  - `password_hash`
  - `status` (active/locked) (optional)
  - `created_at`, `updated_at`

### 2) Login Attempt Tracking (for AC8)
One of:

**A) Table-based**
- `login_attempts`
  - `id` (PK)
  - `username` (nullable)
  - `ip_address`
  - `success` (boolean)
  - `created_at`

**B) Aggregated counters**
- `login_throttle`
  - `key` (e.g., `username:ip`)
  - `fail_count`
  - `locked_until`
  - `updated_at`

**C) Redis (preferred for throttling)**
- Use TTL keys to track attempts quickly without growing DB.

### 3) Sessions (if using cookie sessions)
- If using DB sessions:
  - `sessions` table with `session_id`, `user_id`, `expires_at`, etc.
- If using Redis sessions: no DB changes required.

---

## Testing Plan

### Front End
- Component tests:
  - Login page renders all controls (AC1)
  - Password is masked (AC5)
  - Reset clears fields and messages (AC6)
  - Validation prevents submit on empty fields (AC4)
- E2E tests:
  - Successful login redirects to Home (AC2)
  - Invalid login shows generic error (AC3)
  - Protected Home redirects to Login when unauthenticated (AC7)

### Back End
- Unit tests:
  - Valid credentials -> success
  - Invalid credentials -> 401
  - Missing fields -> 400
  - Throttling/lockout triggers after threshold (AC8)
- Security tests:
  - Ensure cookies are HttpOnly/Secure/SameSite when using sessions

---

## Rollout Notes
- Add environment variables for auth secrets (JWT secret, session secret), bcrypt cost, and rate limit thresholds.
- Ensure HTTPS is enforced in production.
