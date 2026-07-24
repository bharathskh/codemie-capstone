# Plan: Login Page (AC1 – Display Login Page)

## Goal
Implement the initial login UI so that when the application loads, a Login page is displayed with:
- Username field
- Password field
- Login button
- Reset button

> Note: The provided acceptance criteria cover UI presence only. This plan includes minimal implementation to satisfy AC1, plus recommended stubs/hooks to support future authentication (AC2+), without forcing backend behavior yet.

---

## Frontend Implementation

### 1) Routing / App Entry
- Ensure the application root route (`/`) renders the **Login** page by default when the user is not authenticated.
- If an auth/session concept already exists later, add a conditional redirect (not required for AC1):
  - unauthenticated → `/login`
  - authenticated → `/home`

### 2) Login Page UI
Create a `Login` page/component with:
- **Username input**
  - `type="text"`
  - label: “Username”
  - `name="username"`
  - optional: `autoComplete="username"`
- **Password input**
  - `type="password"`
  - label: “Password”
  - `name="password"`
  - optional: `autoComplete="current-password"`
- **Login button**
  - `type="submit"`
  - disabled state optional (future)
- **Reset button**
  - `type="button"`
  - clears both fields and sets focus to username (recommended)

Basic behaviors (safe to implement now, won’t conflict with future backend):
- Form state managed locally (e.g., component state)
- On submit:
  - prevent default
  - call a placeholder `login()` function (no-op or mock) OR simply log to console
- On reset:
  - clear username/password state

### 3) UI/UX and Accessibility
- Visible labels tied to inputs (e.g., `label htmlFor`)
- Proper tab order: username → password → login → reset
- Enter key submits from password field
- Password masked by default

### 4) Testing (Frontend)
- Add a basic UI test to assert:
  - page renders on load
  - username field exists
  - password field exists
  - login button exists
  - reset button exists

---

## Backend Implementation (Minimal for AC1)
AC1 does not require backend changes.

Recommended minimal scaffolding for future AC2+ (optional, can be deferred):
- Create an authentication endpoint stub:
  - `POST /api/auth/login`
  - Accepts `{ username, password }`
  - Returns `200` with a token/session placeholder or `401` on invalid creds

If not implementing now, document an interface contract in code comments or an OpenAPI snippet.

---

## Database Implementation (Not required for AC1)
AC1 is UI-only; no database changes required.

Recommended future tables (for AC2+):
- `users`
  - `id` (PK)
  - `username` (unique)
  - `password_hash`
  - `created_at`, `updated_at`
  - optional: `is_active`, `failed_login_attempts`, `locked_until`

---

## Deliverables
- `plan.md` describing implementation plan
- (Optional) Skeleton Login component/page and routing (if repository has an app codebase)

---

## Open Questions (Need Product/Team Confirmation)
1. What does **Reset** mean: clear fields or password reset flow?
2. Should app default route always show Login, or only when not authenticated?
3. Any UI framework requirements (e.g., Material UI, Bootstrap)?
4. Any security requirements for login (lockout, rate limiting, MFA) planned for next stories?
