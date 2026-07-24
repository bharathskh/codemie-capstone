# Plan: User Login Page (AC1 – Display Login Page)

## Scope
Implement initial **Login Page UI** shown on application load, containing:
- Username field
- Password field
- Login button
- Reset button

> Note: This plan focuses on AC1 (displaying the login page). Authentication, API integration, session management, and navigation to Home can be implemented in subsequent stories.

---

## Front End Implementation

### 1) Route / Entry Behavior
- Configure the application’s initial route to render the `LoginPage` when the app loads.
  - If routing exists (e.g., React Router / Next.js routing), set `/login` as the default landing page or redirect `/` → `/login`.

### 2) Login Page UI Component
Create `LoginPage` with a simple form:
- **Username input**
  - type: `text`
  - name/id: `username`
  - label: `Username`
- **Password input**
  - type: `password`
  - name/id: `password`
  - label: `Password`
- **Login button**
  - type: `submit`
  - label: `Login`
- **Reset button**
  - type: `button` (or `reset` if using native form reset)
  - label: `Reset`

#### Basic UX behaviors (recommended even for AC1)
- Password is masked by default.
- Clicking **Reset** clears both fields.
- Initial focus on the Username field.

### 3) State Handling
- Maintain local state for `username` and `password`.
- Implement `onChange` handlers.
- Implement `onReset` handler to clear state.
- For AC1, `onSubmit` can be a no-op or stubbed (e.g., prevent default) until backend auth is implemented.

### 4) Styling / Layout
- Provide a simple centered login card or container.
- Ensure labels are associated with inputs for accessibility.

### 5) Front End Tests
- Component test to verify:
  - Login page renders on load
  - Presence of username field, password field, login button, reset button
  - Reset clears values

---

## Back End Implementation (For this AC)

No backend functionality is strictly required to **display** the login page.

However, to avoid rework, prepare a minimal auth endpoint contract for later stories:
- `POST /api/auth/login` accepting `{ username, password }`
- Returns `200` with token/session info on success, `401` on invalid credentials

*(Implementation can be deferred.)*

---

## Database Implementation (For this AC)

No database changes required for AC1.

For future authentication stories, plan for:
- `users` table with:
  - `id` (PK)
  - `username` (unique)
  - `password_hash`
  - `created_at`, `updated_at`
  - optional: `status`, `last_login_at`, `failed_attempts`

---

## Deliverables
- `plan.md` added to repository describing implementation plan.

---

## Out of Scope (Explicit)
- Credential validation rules
- Authentication integration
- Authorization / protected routes
- Session/token management
- Error states and messages
- Rate limiting / lockout
