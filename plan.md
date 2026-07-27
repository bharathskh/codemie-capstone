# Login Story Implementation Plan

## Scope
Implement a basic login experience for a registered user so they can authenticate with **username + password** and access the **Home** page.

This plan covers:
- **Frontend**: Login page UI + client-side validation + routing to Home
- **Backend**: Authentication endpoint + session/token issuance
- **Database**: User storage (username + password hash) and supporting indexes

> Note: The provided Acceptance Criteria only covers displaying the login page (AC1). This plan also includes the minimal expected behaviors required to make login functional (success/failure, validation, redirect), which are typically needed to satisfy the story outcome “view the Home page.”

---

## Frontend Plan

### 1) Routes / Pages
- Create route/page: `/login`
- Create route/page: `/home` (or reuse an existing Home page if present)
- Default landing:
  - If unauthenticated → redirect to `/login`
  - If authenticated → allow `/home`

### 2) Login Page UI (AC1)
Implement a login form with:
- **Username** input
- **Password** input (masked)
- **Login** button (primary action)
- **Reset** button (secondary action)

Behavior:
- Login button triggers form submit
- Reset clears fields and validation messages; focus returns to Username
- Allow Enter key from password field to submit

### 3) Client-side validation
- Required validation:
  - Username required
  - Password required
- Disable Login button while request in-flight
- Display error message area for:
  - Validation errors
  - Authentication failures (generic message)

### 4) API integration
- Call backend endpoint: `POST /api/auth/login`
- Request payload:
  ```json
  { "username": "...", "password": "..." }
  ```
- Handle responses:
  - `200 OK`: store token/session indicator, navigate to `/home`
  - `401 Unauthorized`: show generic error “Invalid username or password”
  - `429 Too Many Requests`: show “Too many attempts. Please try again later.”
  - other errors: show “Something went wrong. Please try again.”

### 5) Auth state management
Choose one:
- **Cookie session** (recommended if backend supports HttpOnly cookie) OR
- **JWT** stored in memory (and optionally secure storage depending on platform)

Implement:
- Auth context/store to track logged-in state
- Route guard for `/home` (redirect to `/login` if unauthenticated)

### 6) Accessibility
- Add labels associated with inputs
- Ensure tab order: Username → Password → Login → Reset
- Provide aria-live region for form error feedback

---

## Backend Plan

### 1) Authentication API
Implement endpoint:
- `POST /api/auth/login`

Processing:
1. Validate request body contains `username` and `password`
2. Fetch user record by username
3. Verify password hash (bcrypt/argon2)
4. On success:
   - Issue session or token
   - Return success response
5. On failure:
   - Return `401` with generic message

Response examples:
- Success (JWT style):
  ```json
  { "token": "<jwt>", "user": { "id": "...", "username": "..." } }
  ```
- Success (cookie session style):
  - Set-Cookie: `session=...; HttpOnly; Secure; SameSite=Lax`
  - Response body can be minimal: `{ "ok": true }`

### 2) Security
- Use HTTPS only (deployment/config)
- Do not log passwords
- Use generic error responses to avoid user enumeration
- Add rate limiting (IP and/or username based):
  - e.g., 5 attempts / 15 minutes → `429`
- Consider account lockout policy (optional; rate limiting is a minimum)

### 3) Authorization middleware
- Add middleware to protect authenticated routes (e.g., `/api/*` protected endpoints)
- Add endpoint `GET /api/auth/me` (optional but useful) to validate session/token and return current user

### 4) Testing (backend)
- Unit tests for:
  - password verification
  - invalid credentials
  - missing fields → `400`
  - throttling → `429`
- Integration tests for login flow

---

## Database Plan

### 1) User table
Create/ensure a users table/collection with at least:
- `id` (UUID/serial)
- `username` (unique)
- `password_hash`
- `created_at`, `updated_at`

Recommended constraints/indexes:
- Unique index on `username`

### 2) Password storage
- Store only strong hash (bcrypt/argon2) + salt (built-in)
- No plaintext passwords

### 3) Optional tables
If using persistent sessions:
- `sessions` table:
  - `id`, `user_id`, `expires_at`, `created_at`, `revoked_at`

If implementing audit:
- `login_attempts` table for monitoring (optional; rate limiting can be in memory/redis)

---

## Delivery Checklist

### Frontend
- [ ] `/login` page created and matches AC1 fields/buttons
- [ ] Reset clears inputs + errors
- [ ] Login calls API and handles success/failure
- [ ] Route guard redirects unauthenticated users
- [ ] Accessible labels and keyboard submit

### Backend
- [ ] `POST /api/auth/login` implemented
- [ ] Password verification using bcrypt/argon2
- [ ] Session/JWT issuance
- [ ] Rate limiting / throttling

### Database
- [ ] Users schema in place with unique username
- [ ] Migration added (if applicable)

---

## Open Questions (to confirm)
1. Is this a **web** app (SPA) or **mobile** app?
2. Is **username** an email address or a separate unique handle?
3. Preferred auth mechanism: **cookie session** vs **JWT**?
4. Do we need **Remember me** and **Forgot password** in this story (likely separate)?
5. What is the required session timeout?
