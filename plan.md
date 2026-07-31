# plan.md — EPMCDMETST-57557 Enhance login flow

## Goal
Implement username/password authentication flow with validation, error handling, Home navigation, and baseline brute-force mitigation.

---

## Frontend plan

### UI (Login page)
- Ensure fields/buttons exist:
  - Username input (text)
  - Password input (type=password; masked)
  - Login button
  - Reset button
- Add UX behaviors:
  - Disable Login button OR block submission when required fields are empty (AC4).
  - Inline validation messages:
    - "Username is required"
    - "Password is required"
  - Generic auth failure message (AC3): "Invalid username or password".
  - Reset button clears:
    - username/password values
    - validation errors
    - auth error banner
    - sets focus to Username (AC6)
  - Enter key on password triggers submit (AC7)

### API integration
- Create `authService.login(username, password)` calling backend `/api/auth/login`.
- Handle responses:
  - 200: store session/token and navigate to `/home` (AC2)
  - 401/403: show generic invalid credentials message (AC3)
  - 429: show throttling/lockout message (ties to AC8)
- Token/session storage approach (depending on backend):
  - Prefer HttpOnly secure cookie session (reduces XSS risk)
  - If JWT in header: store in memory (or secure storage per project standards)

### Routing / guards
- Protect Home route with an auth guard:
  - If unauthenticated -> redirect to `/login`
- After successful login, verify Home page identifier renders (AC2).

### Frontend tests
- Unit tests:
  - Validation behavior for empty fields
  - Reset clears values/errors and focuses username
  - Enter key triggers submit
- E2E tests (Cypress/Playwright):
  - Valid credentials -> Home
  - Invalid credentials -> generic error on login page
  - Rate limited -> proper message

---

## Backend plan

### Endpoints
- `POST /api/auth/login`
  - Input: `{ username, password }`
  - Output (recommended):
    - 200 with session cookie OR access token
    - 401 for invalid credentials (generic)
    - 429 for throttling/lockout (AC8)
- (Optional but typical) `POST /api/auth/logout`
- (Optional) `GET /api/auth/me` for session check / route guarding

### Authentication logic
- Lookup user by username.
- Verify password using strong hashing (bcrypt/argon2) against stored hash.
- Respond with generic error for any auth failure (avoid user enumeration) (AC3).

### Brute force mitigation (AC8 baseline)
Implement one of:
- Rate limiting per IP + per username (recommended), returning 429.
- Temporary lockout after N failed attempts for an account (store counter + lockUntil).
Configuration knobs:
- `MAX_FAILED_ATTEMPTS`
- `LOCKOUT_DURATION`
- `RATE_LIMIT_WINDOW`
- `RATE_LIMIT_MAX_REQUESTS`

### Security headers / session hardening
- If using cookies:
  - HttpOnly, Secure, SameSite=Lax/Strict (based on app needs)
- TLS assumed at ingress.

### Backend tests
- Unit tests for:
  - successful login
  - invalid credentials
  - empty inputs -> 400 + validation errors (or consistent 422)
  - throttling/lockout triggers 429 after threshold
- Integration tests verifying session/token issuance.

---

## Database plan

### User table (if not already present)
- `users`
  - `id`
  - `username` (unique index)
  - `password_hash`
  - `status` (active/disabled) (optional)

### For lockout/throttling persistence (choose based on architecture)
Option A (DB-based lockout):
- Add to `users`:
  - `failed_login_attempts` INT
  - `lock_until` TIMESTAMP NULL
- Pros: simple, persistent across restarts
- Cons: more DB writes

Option B (Cache-based rate limit) — recommended when available
- Use Redis for:
  - per-IP counters
  - per-username counters
  - lockout keys with TTL
- Pros: performant, built-in TTL
- Cons: requires Redis

### Audit logging (optional but useful)
- `auth_audit` table/log stream:
  - username attempted, timestamp, outcome, ip (careful with PII policies)

---

## Acceptance Criteria mapping
- AC1: verify login page renders fields/buttons
- AC2: 200 login -> Home navigation + Home identifier
- AC3: invalid -> 401 -> generic message
- AC4: client-side required validation + server-side validation
- AC5: password input type=password
- AC6: reset clears fields/errors and focuses username
- AC7: Enter triggers submit
- AC8: rate limit/lockout -> 429 + UI message
