# Plan — EPMCDMETST-57196: User Login (Username/Password)

## Goal
Implement a secure username/password login flow that shows a Login page (username, password, login, reset), authenticates users, redirects to Home on success, shows generic errors on failure, validates required fields, supports reset behavior, and enforces protected routes.

> Note: This repo currently contains only `README.md`. This plan assumes we will add a minimal full-stack skeleton or integrate into an existing app in a subsequent PR. The intent of this PR is to document an implementable approach.

---

## Architecture assumptions
- Web application with a front-end SPA and a back-end API.
- Authentication via session cookie (recommended for web) or JWT (acceptable). This plan focuses on **cookie-based session** for better security defaults.

---

## Front-end implementation plan

### 1) Routes & pages
- Add routes:
  - `/login` — public route
  - `/` or `/home` — protected route (Home page)
- Route guard:
  - If user is **not authenticated**, redirect any protected route to `/login`.
  - If user **is authenticated**, visiting `/login` should redirect to `/home`.

### 2) Login page UI (AC1)
- Create Login page with:
  - Username input (type `text`, label + placeholder)
  - Password input (type `password`, masked) (AC5)
  - Login button (primary)
  - Reset button (secondary)
- Accessibility (AC9):
  - Proper `<label for>` usage
  - `aria-live` region for error banner
  - Tab order: Username → Password → Login → Reset
  - Enter on password submits

### 3) Form behavior
- Client validation (AC4):
  - Username required
  - Password required
  - Trim username before submit
- On submit:
  - Disable buttons during request
  - Call `POST /api/auth/login` with `{ username, password }`
- On success (AC2):
  - Store authenticated state (e.g., by calling `GET /api/auth/me` after login or relying on login response)
  - Navigate to `/home`
- On failure (AC3):
  - Show generic message: `Invalid username or password`
  - Keep user on `/login`

### 4) Reset behavior (AC6)
- Reset button clears:
  - Username value
  - Password value
  - Validation messages
  - Error banner

### 5) Auth state management
- Use a small auth client:
  - `login(username, password)`
  - `logout()`
  - `me()` to validate session
- Store only non-sensitive state in memory; do not store password.

### 6) Front-end tests
- Unit tests:
  - Renders all required fields/buttons
  - Required validation triggers
  - Reset clears fields and errors
- Integration/E2E tests (Playwright/Cypress):
  - Successful login redirects to Home
  - Invalid login shows generic error
  - Protected route redirects to Login

---

## Back-end implementation plan

### 1) API endpoints
- `POST /api/auth/login`
  - Request: `{ username: string, password: string }`
  - Response: `200` on success
  - On success, create session and set cookie
  - On failure, return `401` with generic error
- `POST /api/auth/logout`
  - Clears session cookie
- `GET /api/auth/me`
  - Returns current authenticated user (id, username, roles)

### 2) Authentication logic
- Validate input:
  - Reject missing username/password with `400`
- Lookup user by username
- Verify password hash (bcrypt/argon2)
- On success:
  - Create session record (db) and set cookie `sid=<token>`
  - Cookie flags: `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict` if feasible)
- On failure:
  - Return `401` with generic message
  - Do not leak whether username exists

### 3) Security controls (AC8 + secure access)
- Rate limiting:
  - Per IP and per username (e.g., 5 attempts / 5 minutes)
- Optional account lockout:
  - After N failed attempts, lock for X minutes
- Logging & auditing:
  - Log auth failures/successes without storing passwords

### 4) Protected routes middleware (AC7)
- Middleware to check session cookie:
  - If missing/invalid → `401`
- Apply to all protected endpoints and/or to Home page API.

### 5) Back-end tests
- Unit tests:
  - Valid credentials return 200 and set cookie
  - Invalid credentials return 401
  - Missing fields return 400
- Integration tests:
  - `/api/auth/me` returns user when cookie present
  - `/api/auth/me` returns 401 without cookie

---

## Database implementation plan

### 1) Tables

#### `users`
- `id` (PK)
- `username` (unique, indexed)
- `password_hash`
- `status` (active/locked/disabled)
- `created_at`, `updated_at`

#### `sessions`
- `id` (PK)
- `user_id` (FK → users.id)
- `session_token_hash` (store hash of token, not raw token)
- `created_at`
- `expires_at`
- `revoked_at` (nullable)
- indexes on `user_id`, `expires_at`

#### `login_attempts` (optional, if not using only edge rate limit)
- `id`
- `username`
- `ip`
- `attempted_at`
- `success` (boolean)

### 2) Migration & seed
- Migration scripts for tables
- Seed script to create a test user in non-prod environments

---

## Acceptance Criteria mapping
- AC1: Login page UI fields/buttons
- AC2: Successful login redirects to Home + session established
- AC3: Invalid credentials show generic error
- AC4: Required field validation
- AC5: Password masking
- AC6: Reset clears fields and errors
- AC7: Session + protected routes redirect/401
- AC8: Brute-force protection policy
- AC9: Accessibility + keyboard behavior

---

## Delivery checklist
- [ ] Front-end login page + routing + guard
- [ ] Back-end auth endpoints + session cookie
- [ ] DB migrations for users/sessions
- [ ] Rate limiting / lockout policy implemented
- [ ] Automated tests (unit + integration/e2e)
- [ ] Security review: cookie flags, CSRF posture, logging hygiene
