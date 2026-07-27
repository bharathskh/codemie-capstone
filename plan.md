# Plan: Login Page (AC1 – Display Login Page)

## Goal
Implement the Login page shown on app launch with:
- Username field
- Password field
- Login button
- Reset button

> Note: The provided acceptance criteria only covers displaying the page. Items like authentication, errors, and redirect to Home are noted as future ACs.

---

## Implementation Plan

### 1) Front End

#### UI/UX
- Create a **Login page/screen** that is the default route when the application loads (unless an authenticated session exists).
- Layout:
  - Title/header: "Login"
  - Form controls:
    - Username: text input
    - Password: password input (masked)
    - Primary action: **Login** button
    - Secondary action: **Reset** button
- Basic accessibility:
  - Proper labels for inputs (`for`/`id` or equivalent)
  - Keyboard tab order: Username → Password → Login → Reset
  - Support Enter key to submit (optional but recommended)

#### State & behavior
- Local state to hold `username` and `password`.
- Reset button:
  - Clears both fields and returns focus to Username (recommended).

#### Routing
- Configure app entry route to point to `/login`.
- Ensure the Login page is reachable directly.

#### Optional (future-ready)
- Add client-side validation hooks (required fields) but keep it non-blocking if not in scope.
- Stub handler for Login action to integrate with backend later (`POST /auth/login`).

---

### 2) Back End

> AC1 does not require backend changes; however, to support the story’s intent (secure access), define the contract now.

#### API contract (proposed)
- `POST /api/auth/login`
  - Request body: `{ "username": string, "password": string }`
  - Response (200): `{ "token": string, "user": { ... } }` or session cookie
  - Response (401): `{ "message": "Invalid username or password" }`

#### Security (baseline)
- Enforce HTTPS in deployment.
- Do not log plaintext credentials.
- Rate limiting on login endpoint (future).

---

### 3) Database

> AC1 does not require DB changes. For full login support, define schema expectations.

#### Minimum user table (proposed)
- `users`
  - `id` (uuid / int PK)
  - `username` (unique, indexed)
  - `password_hash`
  - `password_salt` (if applicable)
  - `status` (active/locked)
  - `created_at`, `updated_at`

#### Notes
- Store only password hashes (bcrypt/argon2 recommended).

---

## Tasks Breakdown (Implementation Steps)

1. **Repo setup**
   - If no app exists, scaffold a minimal frontend application.
   - Add basic routing.

2. **Create Login page**
   - Implement `Login` component/page.
   - Add controlled inputs for username/password.
   - Add Login and Reset buttons.

3. **Wire entry route**
   - Configure default route to Login page.

4. **Add basic tests** (recommended)
   - Render test: page shows Username, Password, Login, Reset.
   - Reset behavior test clears inputs.

5. **Documentation**
   - Update README with how to run and where the login page is.

---

## Definition of Done (for AC1)
- On application load, the Login page renders.
- Username and Password inputs are visible.
- Login and Reset buttons are visible.
- Reset clears fields.
- Basic accessibility labels exist.

---

## Open Questions
- What framework is used (React/Angular/Vue/Next.js) or is this repository currently empty?
- Should authenticated users be redirected away from Login to Home?
- Reset button requirements: clear errors, focus behavior?
- Do we need Enter-to-submit behavior?
