# Plan: Username/Password Login (AC1 – Display Login Page)

## Story Summary
As a registered user, I want to log into the application using my username and password, so that I can securely access the application and view the Home page.

Current acceptance criteria scope (AC1) covers **only** displaying the Login page with:
- Username field
- Password field
- Login button
- Reset button

> Note: This plan includes the minimum to satisfy AC1, plus a small amount of scaffolding to support the rest of the login flow later (without forcing full auth implementation if not in scope).

---

## 1) Frontend Implementation

### 1.1 Routes / Page
- Add a `Login` route/page that is the default landing page when the app loads.
- Ensure the page is accessible at `/login` and is the initial route (or is shown when unauthenticated).

### 1.2 Login UI Components
Create a login form containing:
- **Username** input
  - `type="text"`
  - label: `Username`
  - `name="username"`
  - `autocomplete="username"`
- **Password** input
  - `type="password"`
  - label: `Password`
  - `name="password"`
  - `autocomplete="current-password"`
- **Login** button
  - `type="submit"`
  - text: `Login`
- **Reset** button
  - `type="button"` (or `reset` if using native form reset)
  - text: `Reset`

### 1.3 Form Behavior (minimal)
- On page load, place focus on Username field.
- Clicking **Reset** clears both fields and clears any inline error messages.
- Clicking **Login** (submit) should, at minimum, prevent empty submissions (client-side validation):
  - If username or password is empty, show field-level required message.

### 1.4 Styling / Layout
- Keep layout simple and responsive (centered form card, consistent spacing).
- Ensure labels are associated with inputs (`for`/`id`) and tab order is correct.

### 1.5 Accessibility
- Inputs must have visible labels.
- Error messages should be announced (e.g., `aria-live="polite"` on a validation summary region).

### 1.6 Frontend Tests
- Add UI tests (unit/integration depending on framework) that verify:
  - Login page renders on app load
  - Presence of Username field, Password field, Login button, Reset button
  - Reset clears the inputs
  - Empty submit shows validation messages

---

## 2) Backend Implementation

> If AC1 is strictly UI-only, backend can be stubbed. However, to support the story intent (“securely access … view Home page”), implement an auth endpoint in a follow-up AC.

### 2.1 Minimal API Contract (recommended scaffold)
- Add endpoint: `POST /api/auth/login`
  - Request body: `{ "username": string, "password": string }`
  - Response (success): `200 OK` with `{ "token": "<jwt>" }` or session cookie
  - Response (failure): `401 Unauthorized` with `{ "message": "Invalid username or password" }`

### 2.2 Security Basics (recommended)
- Always return a generic invalid-credentials message.
- Rate limit login attempts per IP/username (even a basic limiter).
- Never log raw passwords.
- Ensure HTTPS in deployment.

### 2.3 Backend Tests
- Unit test login controller/handler for:
  - Valid user returns 200
  - Invalid user returns 401
  - Missing fields return 400

---

## 3) Database Implementation

### 3.1 Users Table (recommended)
If not present, create a `users` table:
- `id` (pk)
- `username` (unique, indexed)
- `password_hash`
- `created_at`, `updated_at`
- Optional: `is_active`, `locked_until`, `failed_attempts`

### 3.2 Password Storage
- Store hashed passwords only (e.g., bcrypt/argon2).

### 3.3 Migration
- Add DB migration for users table.

---

## 4) Delivery Steps (suggested)
1. Create Login page/route and render required controls (AC1).
2. Add basic form state + reset behavior.
3. Add client-side required validation.
4. Add frontend tests.
5. (Optional next AC) Implement backend `POST /api/auth/login` + JWT/session.
6. (Optional next AC) Add Home route gating + session persistence.

---

## 5) Definition of Done (for AC1)
- App loads to Login page.
- Login page contains Username, Password, Login, Reset.
- Reset clears inputs.
- Tests covering rendering and reset pass.
- `plan.md` added to repo documenting approach.
