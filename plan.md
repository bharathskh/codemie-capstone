# Plan: Login Page UI + Authentication Flow (JWT)

## Goal
Enable registered users to log in using username + password and securely access the Home page.
This covers:
- Login page UI (fields/buttons/reset/password masking)
- Authentication flow (success redirect, validation, invalid creds handling)
- JWT-based auth (access + refresh)

---

## Front End

### Pages / Routes
- `/login` route
  - Form fields:
    - `username` (text)
    - `password` (password masked)
  - Buttons:
    - `Login` (primary submit)
    - `Reset` (clears form + errors, focuses username)
  - Behavior:
    - Enter key triggers submit
    - Inline validation messages for required fields

- `/home` route (protected)
  - Only accessible when authenticated; otherwise redirect to `/login`

### State / Logic
- Local form state:
  - username, password
  - touched/dirty flags
  - validation errors
- Submit handler:
  1. Validate required fields client-side
  2. Call backend `POST /api/auth/login`
  3. On success:
     - Store **access token** in memory (recommended) and/or short-lived storage per app policy
     - Store **refresh token** in an **HTTPOnly Secure cookie** (recommended)
     - Redirect to `/home`
  4. On failure:
     - Show generic error message
     - Keep user on `/login`

### Token Handling (JWT)
- Access token:
  - Short TTL (e.g., 5–15 minutes)
  - Used for API calls via `Authorization: Bearer <token>`
- Refresh token:
  - Longer TTL (e.g., 7–30 days)
  - Stored in HTTPOnly cookie and exchanged via `POST /api/auth/refresh`

### UX / Security
- Password input uses type="password" (masked by default)
- Do not log password or include it in query params
- Display generic error for invalid credentials (avoid account enumeration)

### Testing (FE)
- Unit tests:
  - Rendering login page controls
  - Reset clears fields and errors
  - Required validation blocks submit
- E2E/UI tests:
  - Successful login -> home
  - Invalid credentials -> error shown, no redirect
  - Refresh flow (optional): expired access token triggers refresh then continues

---

## Back End

### Endpoints
- `POST /api/auth/login`
  - Request body: `{ "username": "...", "password": "..." }`
  - Responses:
    - 200: `{ accessToken, user: { id, username, ... } }` and sets refresh cookie
    - 401: invalid credentials (generic message)
    - 400: missing username/password

- `POST /api/auth/refresh`
  - Reads refresh token from HTTPOnly cookie
  - Responses:
    - 200: `{ accessToken }`
    - 401: invalid/expired refresh token

- `POST /api/auth/logout`
  - Clears refresh cookie / invalidates refresh token server-side (recommended)

- `GET /api/auth/me` (optional)
  - Returns current user identity (requires valid access token)

### Auth Strategy (JWT)
- Access token signed with server secret/private key
- Refresh token rotation recommended:
  - On refresh, issue a new refresh token and invalidate the old one
- Store refresh token hashes server-side to support logout/rotation:
  - e.g., `user_refresh_tokens` table with `token_hash`, `expires_at`, `revoked_at`

### Validation & Security
- Validate request payload server-side
- Use secure password hashing (bcrypt/argon2)
- Rate limit login endpoint; optional lockout policy
- Avoid user enumeration: same error message for unknown user vs wrong password
- Audit logs (optional): login success/failure (without sensitive data)

### Testing (BE)
- Unit tests:
  - Valid login
  - Invalid login
  - Missing fields -> 400
- Integration tests:
  - Token issuance and protected route access
  - Refresh token flow
  - Logout invalidates refresh

---

## Database

### Tables (minimal)
- `users`
  - `id` (PK)
  - `username` (unique index)
  - `password_hash`
  - `status` (active/locked/disabled) (optional)
  - `created_at`, `updated_at`

### Refresh Token Storage (recommended)
- `user_refresh_tokens`
  - `id` (PK)
  - `user_id` (FK -> users.id)
  - `token_hash`
  - `expires_at`
  - `revoked_at` (nullable)
  - `created_at`

### Seed / Migration
- DB migration to create `users` and `user_refresh_tokens`
- Seed at least one test user for local/dev

---

## Implementation Steps (Suggested)
1. Add `/login` page UI with username/password + Login/Reset
2. Add client-side validations + masked password
3. Implement backend login endpoint + JWT issuance
4. Implement refresh endpoint + refresh cookie + rotation
5. Implement protected Home route (redirect unauthenticated to login)
6. Add invalid credential handling + error UI
7. Add tests (FE unit + E2E; BE unit/integration)
8. Add minimal documentation in README for running locally

---

## Definition of Done
- Login page renders per AC1 and reset behavior works
- Valid credentials authenticate and redirect to Home
- Invalid/empty credentials show error/validation and do not redirect
- Password is masked; no sensitive data logged
- JWT access + refresh flow implemented (refresh in HTTPOnly cookie recommended)
- Tests added and passing
