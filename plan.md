# Plan: Login Page (Username/Password)

## Goal
Implement a basic login entrypoint so that when an unauthenticated user launches the application, they see a Login page with:
- Username field
- Password field
- Login button
- Reset button

This plan focuses on implementing AC1. It also outlines the typical wiring needed for a functional login (API + persistence) so the next iteration can add success/failure flows.

---

## Frontend implementation

### 1) Routing / Page shell
- Add a `/login` route (or make login the default route) that renders a **LoginPage**.
- Add an **Auth Guard** mechanism (even if stubbed) so unauthenticated users are directed to `/login`.

### 2) UI components
- Create a Login form with:
  - **Username** input (type `text`)
  - **Password** input (type `password`)
  - **Login** button (type `submit`)
  - **Reset** button (type `button` or `reset`)

### 3) Form behavior (AC1 + minimal ergonomics)
- On initial load, render fields/buttons.
- Reset button clears:
  - username value
  - password value
  - any local validation errors (if present)

### 4) Optional (recommended wiring for next AC)
- On submit, call `POST /api/auth/login` with `{ username, password }`.
- Store returned auth token/session indicator.
- Redirect to `/home` (or the protected landing page) upon success.
- Display a generic error on failure.

### 5) Accessibility
- Labels associated with inputs (`label` + `htmlFor`).
- Keyboard accessible buttons.
- Password field masked.

---

## Backend implementation

### 1) Authentication endpoint
- Create `POST /api/auth/login`
  - Request: `{ "username": string, "password": string }`
  - Response (option A - JWT): `{ "token": string, "user": { id, username } }`
  - Response (option B - session cookie): `Set-Cookie: session=...; HttpOnly; Secure; SameSite=Lax`

### 2) Validation
- Reject missing username/password with `400`.
- Normalize username (trim) as per agreed rules.

### 3) Password verification
- Fetch user by username.
- Compare password using a secure hash verification:
  - bcrypt/argon2 verify
- Avoid user enumeration: return same error for invalid username/password.

### 4) Security controls (recommended baseline)
- Rate limit login endpoint.
- Audit log for login attempts (do not log passwords).

---

## Database implementation

### 1) Users table
Minimum schema:
- `id` (uuid/int, PK)
- `username` (unique, indexed)
- `password_hash`
- `created_at`, `updated_at`

### 2) Optional tables
- `login_audit` (timestamp, username, success/failure, ip, user_agent)
- `sessions` table if using server-side sessions

---

## Testing plan

### Frontend
- Render test: Login page shows username field, password field, login button, reset button.
- Interaction test: entering text then clicking Reset clears both fields.

### Backend
- Unit test: login rejects empty username/password.
- Unit test: valid password returns token/session.
- Unit test: invalid credentials return 401 with generic error.

---

## Delivery checklist
- [ ] Login route exists and is the default for unauthenticated users
- [ ] UI displays required fields/buttons (AC1)
- [ ] Reset clears input state
- [ ] Backend endpoint + user store wired (if included)
- [ ] Minimal tests added
