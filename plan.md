# Plan: Login Page + Authentication Flow (AC1–AC9)

## Goal
Implement a secure username/password login flow that:
- Displays a login page (AC1)
- Authenticates users and redirects to Home on success (AC2)
- Shows generic errors on failure (AC3)
- Validates required fields (AC4)
- Masks passwords (AC5)
- Resets form state (AC6)
- Enforces session-based protected access (AC7)
- Redirects authenticated users away from Login (AC8)
- Handles network/service failures gracefully (AC9)

> Note: Accessibility baseline AC was explicitly removed per request.

---

## Frontend Implementation

### Routes & Pages
- Add/confirm routes:
  - `GET /login` → Login page
  - `GET /` or `GET /home` → Home page (protected)
- Add a route guard:
  - If not authenticated → redirect to `/login`
  - If authenticated and visiting `/login` → redirect to `/home`

### Login Page UI (AC1)
- Components:
  - Username input
  - Password input (`type="password"`) (AC5)
  - Login button (submit)
  - Reset button
- Form behavior:
  - Pressing Enter submits (AC2)
  - Disable Login button while submitting to avoid double submits

### Client-side Validation (AC4)
- Validate before calling backend:
  - Username required (trim whitespace)
  - Password required
- Display inline errors (field-level) when missing

### Submit Handling (AC2, AC3, AC9)
- On submit:
  - `POST /api/auth/login` with `{ username, password }`
  - On 200:
    - Update auth state (e.g., fetch `/api/auth/me` or store `isAuthenticated`)
    - Redirect to Home
  - On 401:
    - Show **generic** error: `Invalid username or password`
  - On network error / 5xx:
    - Show retryable message: `Something went wrong. Please try again.` (AC9)

### Reset Handling (AC6)
- Reset button clears:
  - Username
  - Password
  - Inline validation errors
  - Generic error banner
- Return focus to username field

### Auth State Management (AC7, AC8)
- Prefer cookie-based session auth:
  - Use `credentials: 'include'` on fetch calls
- Add a lightweight auth bootstrap:
  - App init calls `/api/auth/me`
  - If 200, mark authenticated; else unauthenticated

### Frontend Testing
- Unit/component tests:
  - Renders username/password/login/reset (AC1)
  - Required field validation (AC4)
  - Reset clears fields and errors (AC6)
- E2E tests (recommended):
  - Successful login redirects to Home (AC2)
  - Invalid credentials shows generic error (AC3)
  - Protected route redirects to login when unauthenticated (AC7)

---

## Backend Implementation

### API Endpoints
- `POST /api/auth/login`
  - Input: `{ username, password }`
  - Behavior:
    - Validate required fields (server-side)
    - Authenticate against stored password hash
    - On success: create session and set HTTP-only cookie
    - On failure: return 401 with generic message
- `POST /api/auth/logout`
  - Destroys session, clears cookie
- `GET /api/auth/me`
  - Returns current user summary if session is valid

### Authentication & Security
- Password storage:
  - Store password hashes using Argon2 or bcrypt
- Session cookie settings:
  - `HttpOnly`, `Secure` (in prod), `SameSite=Lax` (or `Strict` if compatible)
  - Reasonable TTL
- Generic errors (AC3):
  - Avoid user enumeration: same response for unknown username vs wrong password
- Brute-force mitigation (recommended even if not explicitly in ACs):
  - Basic rate limit on `/api/auth/login`

### Error Handling (AC9)
- Ensure consistent error schema:
  - 400 for missing required fields
  - 401 for invalid credentials
  - 500 for unexpected errors (no stack traces leaked)

### Backend Testing
- Unit/integration tests:
  - Valid login creates session and returns 200
  - Invalid credentials returns 401 generic
  - Missing fields returns 400
  - `/me` returns user when session exists
  - `/logout` clears session

---

## Database Implementation

### Tables (relational example)
1. `users`
   - `id` (PK)
   - `username` (unique, indexed)
   - `password_hash`
   - `status` (e.g., `ACTIVE`, `DISABLED`) (optional but useful)
   - `created_at`, `updated_at`

2. `sessions` (if server-side sessions)
   - `id` (PK)
   - `user_id` (FK → users.id)
   - `session_token` (unique, indexed)
   - `expires_at`
   - `created_at`, `revoked_at` (optional)

> If using a managed session store (Redis) you may not need a SQL `sessions` table.

### Migrations/Seeds
- Migration to add required tables/indices
- Seed an example user for local dev/testing (ensure no real credentials in logs)

---

## Delivery Checklist
- [ ] Login page renders with required controls (AC1)
- [ ] Valid credentials redirect to Home and show authenticated state (AC2)
- [ ] Invalid credentials show generic error (AC3)
- [ ] Required-field validation blocks submit (AC4)
- [ ] Password masked (AC5)
- [ ] Reset clears fields + errors and focuses username (AC6)
- [ ] Protected routes enforce auth; unauthenticated redirected to Login (AC7)
- [ ] Authenticated user visiting Login is redirected to Home (AC8)
- [ ] Network/server errors show retryable message (AC9)

---

## Notes for Next Assistant (handoff)
- Implement cookie-based session auth (`/login`, `/logout`, `/me`) for simplest protected-route UX.
- Keep error messaging generic on 401 to prevent username enumeration.
- Add route guard + initial `/me` check so refreshes keep user logged in.
