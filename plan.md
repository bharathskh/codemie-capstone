# EPMCDMETST-57790 — Login: implement authentication flow, validation, and reset behavior

## Decision
- Session approach: **Option 1 — Cookie-based session** (server-managed session, Secure + HttpOnly cookies).

## Goal
Deliver an end-to-end login experience: login page UI, form validation, authenticate against backend, handle success/failure, and implement Reset behavior.

---

## Front end

### Pages / Routes
- Add/confirm route: `/login`
- Add auth-guard for protected routes (e.g., `/home`) redirecting unauthenticated users to `/login`

### UI Components
- `LoginPage`
  - Username input (text)
  - Password input (password/masked)
  - Login button (disabled while submitting)
  - Reset button (clears form + clears validation/errors)
  - Error banner/inline error area for generic auth errors

### Client-side Validation (AC3)
- Validate required fields:
  - Username required
  - Password required
- On validation failure:
  - show validation messages
  - do not call auth API

### Submit/Login Behavior (AC4/AC5)
- On submit:
  - call `POST /api/auth/login` with `{ username, password }`
  - handle 200 => session cookie set by server, redirect to `/home`
  - handle 401/403 => show generic error (“Invalid username or password”), remain on page
  - handle network/5xx => show “Unable to login, please try again.”

### Reset Behavior (AC6)
- Reset button clears:
  - username + password fields
  - validation errors
  - generic auth error banner

### Security basics (frontend)
- Never log passwords
- Use HTTPS endpoints only (AC7)

---

## Back end

### API Endpoints
- `POST /api/auth/login`
  - Request: `{ "username": "...", "password": "..." }`
  - Response: 200 + `Set-Cookie` session cookie (`HttpOnly`, `Secure`, `SameSite=Lax`), plus optional minimal user payload.
  - Errors:
    - 400 for missing fields
    - 401 for invalid credentials (generic message)
- Recommended (follow-up):
  - `POST /api/auth/logout`
  - `GET /api/auth/me`

### Auth Flow
- Look up user by username
- Verify password using a strong hash algorithm (bcrypt/argon2)
- On success:
  - create session (server-side store, e.g., Redis)
  - return 200 + cookie
- On failure:
  - return 401 + generic message

### Transport/security (AC7)
- Enforce HTTPS at ingress/load balancer (redirect HTTP->HTTPS)
- Cookies: `HttpOnly`, `Secure`, `SameSite`
- Recommended: basic rate limiting on login endpoint (can be separate story)

---

## Database

### Tables (minimum)
- `users`
  - `id` (pk)
  - `username` (unique)
  - `password_hash`
  - `status` (active/disabled)
  - timestamps

### Optional
- `sessions` table or Redis-backed session store

---

## Testing Plan

### Frontend
- Unit:
  - required field validation blocks submit
  - reset clears fields and errors
- E2E:
  - valid login redirects to home
  - invalid login shows generic error

### Backend
- Integration:
  - login success sets session cookie
  - invalid password returns 401
  - missing fields returns 400

---

## Deliverables
- Login page UI + validation + reset behavior
- Backend login endpoint (cookie session)
- Auth guard + redirect to Home
- Tests (unit + integration/E2E)
