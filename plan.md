# plan.md — EPMCDMETST-57787: Enhance Login feature (Option A: HttpOnly cookie auth)

## Goal
Enable users to authenticate with username/password and access the Home page securely, with complete UX behavior:
- show login UI
- validate required fields
- handle invalid credentials
- reset clears values/errors
- mask password
- redirect authenticated users away from login

## Scope
This plan covers AC1–AC7:
1) Display login page UI elements
2) Successful login redirects to Home
3) Invalid credentials show generic error
4) Required-field validation
5) Reset clears fields and errors
6) Password field masking
7) Already-authenticated user is redirected away from Login

## Option A (approved): Cookie-based auth
- Backend sets an **HttpOnly** cookie on successful login.
- Frontend relies on cookie-based session/JWT and calls `/api/auth/me` to detect authenticated state.
- Benefits: token not accessible to JS (better XSS resilience).

---

## Frontend
### Login Page UI (AC1)
- Username field
- Password field (type="password")
- Login button
- Reset button
- Area for form-level errors (e.g., invalid credentials)

### Client-side validation (AC4)
- On Login click (and optionally on blur):
  - Username is required
  - Password is required
- Show inline validation messages tied to their fields.

### Submit behavior
#### Successful login (AC2)
- Call `POST /api/auth/login` with `{ username, password }`.
- On HTTP 200:
  - Cookie is set by backend (HttpOnly)
  - Navigate to `/home`

#### Invalid credentials (AC3)
- On HTTP 401/403:
  - Show generic error: "Invalid username or password"
  - Stay on Login page

### Reset behavior (AC5)
- Clear username and password inputs
- Clear inline validation messages
- Clear form-level invalid-credentials error

### Password masking (AC6)
- Password input uses `type="password"`.

### Already authenticated redirect (AC7)
- On visiting `/login`, call `GET /api/auth/me`:
  - If authenticated (200): redirect to `/home`
  - If unauthenticated (401): remain on Login page

### Frontend tests
- Component tests:
  - Renders all required controls (AC1)
  - Password input is masked (AC6)
  - Empty submit shows validation (AC4)
  - Reset clears values and errors (AC5)
- E2E tests:
  - Valid credentials -> redirected to Home (AC2)
  - Invalid credentials -> error shown (AC3)
  - Authenticated user visiting /login -> redirected to /home (AC7)

---

## Backend
### Endpoints
#### `POST /api/auth/login`
- Request: `{ username: string, password: string }`
- Success (200):
  - Set HttpOnly cookie (session or JWT)
  - Return minimal user payload (optional): `{ id, username, roles }`
- Failure:
  - 401 Unauthorized with stable error code/message
  - Do not reveal whether username exists

#### `GET /api/auth/me`
- Success (200): return current user identity
- Failure (401): unauthenticated

### Authentication logic
- Lookup user by username
- Verify password using bcrypt/argon2 against stored password hash
- Issue cookie-based session:
  - Preferred: JWT in HttpOnly cookie OR server-side session id in HttpOnly cookie
- Cookie flags:
  - `HttpOnly`, `Secure` (non-local), `SameSite=Lax` (or `Strict` if compatible)

### Backend tests
- Unit tests:
  - valid credentials -> 200 + Set-Cookie
  - invalid credentials -> 401
  - missing username/password -> 400
- Integration tests:
  - login then `/me` returns user

---

## Data model
Minimum:
- `users` table with `username` (unique) and `password_hash`

If using server-side sessions:
- `sessions` table with `user_id`, `session_token`, `expires_at`

---

## Definition of Done
- AC1–AC7 demonstrably met
- Automated tests added/updated
- No plaintext password logging
- Cookie flags set appropriately per environment
