# Plan — EPMCDMETST-57197: Login flow (UI + auth + validations + security baseline)

## Goal
Implement a basic, secure login experience for registered users:
- Display a Login page with username, password, Login and Reset.
- Authenticate against a backend endpoint.
- Establish a session (token/cookie).
- Redirect authenticated users to Home.
- Provide validations, error handling, and basic security/accessibility.

> Note: This repository currently contains only `README.md`. This plan is implementation-agnostic and assumes we will add the necessary app scaffolding (frontend + backend + DB) or integrate into an existing system.

---

## 1) Frontend implementation

### 1.1 Pages / routes
- `/login`
  - Public route.
  - If user already authenticated, redirect to `/` (Home).
- `/` (Home)
  - Protected route.
  - If not authenticated, redirect to `/login`.

### 1.2 Login page UI
- Components
  - Username input (text)
  - Password input (type=password)
  - Login button (primary)
  - Reset button (secondary)
  - Inline validation messages
  - Global auth error banner (generic: “Invalid username or password”)
- UX behaviors
  - Tab order: Username → Password → Login → Reset
  - Pressing **Enter** in password triggers Login
  - On Reset:
    - Clear username/password
    - Clear validation + auth error
    - Focus username
  - On invalid credentials:
    - Keep username value
    - Clear password field

### 1.3 Form validation
- Client-side
  - Required: username, password
  - Trim username (and optionally password only for leading/trailing spaces if agreed)
  - Length constraints (define constants; e.g., username 3–255, password 8–255)
  - Disable Login while request in-flight

### 1.4 Auth state management
- Store auth state using one of:
  - **HTTP-only secure cookie session** (preferred for web) OR
  - Token stored in memory + refresh via cookie (avoid localStorage if possible)
- Create an `auth` module:
  - `login(username, password)` → calls backend
  - `logout()`
  - `getCurrentUser()` / `me()` call to hydrate session
- Route guards:
  - On app start, call `/api/auth/me` to determine current user

### 1.5 Error handling
- Map server responses:
  - 400 → validation errors (show per-field)
  - 401 → generic invalid credentials message
  - 429 → rate limited (“Too many attempts. Try again later.”)
  - 5xx/network → “Something went wrong. Please try again.”

### 1.6 Accessibility
- Proper `<label for>` association
- `aria-invalid` and `aria-describedby` for errors
- Buttons with clear text
- Focus management on error (focus first invalid field)

### 1.7 Frontend tests
- Unit/component tests:
  - Renders all fields/buttons (AC1)
  - Required validation
  - Reset clears fields
- E2E tests:
  - Successful login redirects to home
  - Invalid creds stay on login + shows generic error

---

## 2) Backend implementation

### 2.1 API endpoints
- `POST /api/auth/login`
  - Request: `{ "username": string, "password": string }`
  - Response (200): user summary (e.g., `{ id, username, displayName }`)
  - Sets session cookie OR returns JWT (depending on approach)
- `POST /api/auth/logout`
  - Clears session cookie / token
- `GET /api/auth/me`
  - Returns current authenticated user or 401

### 2.2 Authentication logic
- Validate input:
  - username required
  - password required
- Lookup user by username
- Verify password using secure hashing:
  - bcrypt/argon2
- On success:
  - Create session record (DB) and set cookie, or sign JWT
- On failure:
  - Return 401 with generic message (avoid user enumeration)

### 2.3 Rate limiting / brute force protection (baseline)
- Rate limit `POST /login` (IP-based + username-based if feasible)
- Optional temporary lockout after N failed attempts per username
- Return 429 when throttled

### 2.4 Security headers / transport
- Enforce HTTPS (in deployment)
- Cookies: `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict` if compatible)
- CSRF protection if using cookies for auth (anti-CSRF token / double submit)
- Audit logging:
  - log login success/failure (without logging password)

### 2.5 Backend tests
- Unit tests for auth service:
  - password verification
  - invalid credentials
- Integration tests:
  - login success sets cookie / returns token
  - me returns user for valid session
  - rate limiting returns 429

---

## 3) Database implementation

### 3.1 Tables
**users**
- `id` (uuid/int, pk)
- `username` (unique, indexed)
- `password_hash`
- `display_name` (optional)
- `created_at`, `updated_at`
- `is_active` (optional)

**sessions** (if using server-side sessions)
- `id` (uuid, pk)
- `user_id` (fk users.id)
- `created_at`
- `expires_at`
- `revoked_at` (nullable)
- `ip_address` (optional)
- `user_agent` (optional)

**login_attempts** (optional; can also be in Redis)
- `id`
- `username`
- `ip_address`
- `attempted_at`
- `success` (bool)

### 3.2 Migrations / seed
- Migration scripts for tables + indexes
- Seed one test user for local dev:
  - username: `demo`
  - password: `Password123!` (hashed)

---

## 4) Implementation steps (sequence)
1. Add minimal project scaffolding (frontend + backend folders) OR align to existing app structure.
2. Implement DB migrations and user seed.
3. Implement backend auth endpoints + session/JWT handling.
4. Implement frontend login page with validations, reset, and error handling.
5. Add route protection and home redirect.
6. Add tests (unit + e2e/integration).
7. Add documentation to README (how to run, env vars, seed user).

---

## 5) Configuration / environment variables (examples)
- `DATABASE_URL=...`
- `SESSION_SECRET=...` (cookie/session)
- `JWT_SECRET=...` (if JWT)
- `BCRYPT_COST=...`
- `RATE_LIMIT_WINDOW_MS=...`
- `RATE_LIMIT_MAX=...`

---

## 6) Out of scope (unless explicitly required)
- Registration / Forgot Password flows
- MFA
- SSO/OAuth
- Role-based authorization beyond simple “authenticated vs not”

