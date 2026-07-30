# Plan: Login (EPMCDMETST-57198)

Story: **As a registered user, I want to log into the application using my username and password, so that I can securely access the application and view the Home page.**

Scope: Acceptance Criteria **AC1–AC8** (Accessibility/Keyboard Support AC removed per request).

---

## 1. Implementation Approach

### 1.1 Frontend

#### Pages / Routes
- **`/login`**
  - Shows login form (AC1):
    - Username input
    - Password input (masked)
    - Login button
    - Reset button
- **`/home`**
  - Protected route; only accessible if authenticated.
  - If not authenticated, redirect to `/login`.

#### UI Components
- `LoginForm`
  - Controlled inputs: `username`, `password`.
  - `Login` button disabled while request in-flight.
  - Error banner/inline errors:
    - Required-field validation (AC3)
    - Generic invalid credentials message (AC4)
    - Lockout/rate-limit message (AC7)
- `Reset` button behavior (AC5)
  - Clears username/password
  - Clears validation errors and server error
  - Sets focus back to username field

#### Client-side Validation (AC3)
- On submit:
  - Trim username for validation (do not mutate if product wants exact match; decide and document).
  - If empty username → show “Username is required”
  - If empty password → show “Password is required”
  - Do not call API until valid.

#### Login Flow (AC2, AC4)
- Call `POST /api/auth/login` with `{ username, password }`.
- Success:
  - Store auth state (cookie-based session recommended) and redirect to `/home`.
  - Home page displays a signed-in indicator (e.g., username, logout button, or “Welcome” message).
- Failure:
  - Show **generic** message: “Invalid username or password.” (no user enumeration).

#### Session Persistence (AC8)
- On app load, call `GET /api/auth/me` (or similar) to determine current user.
- If authenticated:
  - Redirect away from `/login` to `/home`.
- If unauthenticated:
  - Stay on `/login`.

#### Frontend Testing
- Unit/component tests:
  - Login page renders required elements (AC1)
  - Reset clears fields/errors (AC5)
  - Required validation blocks submit (AC3)
- E2E tests (Playwright/Cypress):
  - Successful login redirects to home (AC2)
  - Invalid credentials show generic error (AC4)
  - Rate-limited/locked attempt displays message (AC7)
  - Refresh keeps session (AC8)

---

### 1.2 Backend

#### API Endpoints
1. `POST /api/auth/login`
   - Request: `{ username, password }`
   - Responses:
     - `200 OK` with user payload (non-sensitive) **or** `204 No Content` if cookie session is used.
     - `400 Bad Request` if missing fields.
     - `401 Unauthorized` for invalid credentials (generic message).
     - `429 Too Many Requests` (or `423 Locked`) when rate limited/temporarily locked (AC7). Pick one and make FE consistent.

2. `POST /api/auth/logout`
   - Clears session cookie / revokes session.

3. `GET /api/auth/me`
   - Returns authenticated user (id, username, roles) if session is valid.
   - `401` if not authenticated.

#### Authentication & Security
- Password storage:
  - Hash passwords using **bcrypt/argon2**.
  - Never log passwords (AC6).
- Prevent user enumeration:
  - Same error message for “user not found” and “wrong password”.
- Rate limiting / lockout (AC7):
  - Implement per username and/or IP.
  - After N failed attempts in a window, block for a cooldown period.
  - Record attempts for auditing.
- Session management:
  - Recommend cookie-based session:
    - `HttpOnly`, `Secure` (in prod), `SameSite=Lax/Strict`.
  - Session expiry and rotation recommended.

#### Backend Testing
- Unit tests:
  - Password verify logic
  - Lockout thresholds
- Integration tests:
  - Login success sets session
  - Login failure increments attempt counters
  - Rate-limit returns correct status code and message
  - `/me` returns expected user when authenticated

---

### 1.3 Database

#### Tables (Example)
1. `users`
- `id` (PK)
- `username` (unique)
- `password_hash`
- `created_at`, `updated_at`
- optional: `is_active`, `roles`

2. `sessions` (if server-side sessions)
- `id` (PK)
- `user_id` (FK → users.id)
- `session_token_hash` (store hashed token)
- `expires_at`
- `created_at`, `revoked_at`

3. `login_attempts` (for lockout/rate limiting)
- `id` (PK)
- `username`
- `ip_address`
- `attempted_at`
- `success` (bool)

Optional: derived table `account_lockouts` for faster checks
- `username` (PK)
- `locked_until`
- `failed_count`

#### Migrations / Seeds
- Migration scripts to create the above schema.
- Seed a demo user for local/dev (ensure deterministic hashing and do not print plaintext credentials in logs).

---

## 2. Delivery Checklist (maps to ACs)
- **AC1**: `/login` renders username/password/login/reset.
- **AC2**: Valid login redirects to `/home` and shows signed-in indicator.
- **AC3**: Empty fields show validation; no API call.
- **AC4**: Invalid creds show generic error.
- **AC5**: Reset clears inputs and errors; focus returns to username.
- **AC6**: Password masked; never logged.
- **AC7**: Rate-limit/lockout after repeated failures.
- **AC8**: Session persists across refresh; `/me` supports bootstrapping auth.

---

## 3. Suggested Tech Stack

### Recommended (balanced, common, fast to deliver)
- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js (Express or NestJS)
- **DB:** PostgreSQL
- **ORM/Migrations:** Prisma (or TypeORM)
- **Auth:** Cookie-based sessions (express-session + Redis) or signed JWT in HttpOnly cookies
- **Testing:**
  - Unit: Vitest/Jest
  - E2E: Playwright
- **Security:** Helmet, rate-limiter middleware, centralized logging (pino/winston)

### Alternative (Python-first)
- **Backend:** FastAPI
- **DB:** PostgreSQL
- **ORM:** SQLAlchemy + Alembic
- **Testing:** Pytest + Playwright

---

## 4. Open Decisions (confirm with team)
- Username normalization rules (trim/case sensitivity).
- Lockout status code: `429` vs `423` (ensure FE/BE alignment).
- Session strategy: server-side sessions vs JWT cookie.
- Home page “signed-in” indicator definition.
