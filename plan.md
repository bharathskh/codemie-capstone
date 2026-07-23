# Plan: User Login Page (AC1 – Display Login Page)

## Story
As a registered user, I want to log into the application using my username and password, so that I can securely access the application and view the Home page.

## Scope covered in this plan
This plan focuses on **AC1: Display Login Page** (UI scaffolding) and includes minimal supporting backend/database considerations to avoid dead ends when wiring authentication in later.

---

## 1) Front-end implementation

### 1.1 Routes / Pages
- Create a **Login page** route (e.g., `/login`).
- Ensure application entry loads `/login` when unauthenticated.
  - If the app already has routing, add a route guard to redirect unauthenticated users to `/login`.

### 1.2 UI Components
Login page should render:
- **Username input**
  - Type: `text`
  - Label: `Username`
  - Name/id: `username`
  - Auto-focus on page load (recommended)
- **Password input**
  - Type: `password` (masked)
  - Label: `Password`
  - Name/id: `password`
- **Login button**
  - Label: `Login`
  - Type: `submit`
- **Reset button**
  - Label: `Reset`
  - Type: `button` (to avoid form submission)
  - Behavior (recommended): clear username/password fields and clear any validation/error messages.

### 1.3 State & Validation (minimal for AC1)
- Maintain local component state for `username` and `password`.
- Implement required-field validation stubs (even if not in AC1) to support future ACs:
  - If either field empty on submit, show inline error and do not call backend.

### 1.4 Accessibility
- Use semantic form elements:
  - `<form>` wrapping inputs and buttons.
  - `<label for="username">` and `<label for="password">`.
- Ensure tab order: Username → Password → Login → Reset.
- Provide `aria-invalid` and `aria-describedby` when showing validation errors.

### 1.5 Front-end testing
- Unit/component tests:
  - Login page renders all required controls.
  - Reset clears fields.
- E2E smoke test:
  - Visiting the root URL redirects to `/login` when unauthenticated.

---

## 2) Back-end implementation (minimal scaffolding)

Even though AC1 is UI-only, define minimal endpoints to unblock later work.

### 2.1 Auth endpoint (stub for later)
- Create `POST /api/auth/login`
  - Request body: `{ "username": string, "password": string }`
  - For now, can return `501 Not Implemented` or a mocked success in dev.
- Create `POST /api/auth/logout` (optional stub)

### 2.2 Session/token strategy (recommended)
- Use **HTTP-only secure cookies** for session/token storage, or JWT with cookie.
- Enforce HTTPS in production.

### 2.3 Back-end testing
- API contract tests (basic): endpoint exists and returns expected status codes.

---

## 3) Database implementation (minimal)

If the system does not already have user storage, plan for:

### 3.1 Users table
- `users`
  - `id` (UUID / auto-increment)
  - `username` (unique, indexed)
  - `password_hash`
  - `created_at`, `updated_at`
  - optional: `is_active`, `last_login_at`, `failed_login_count`, `locked_until`

### 3.2 Migration
- Add a migration to create `users` table.
- Seed a development user for local testing (non-production only).

---

## 4) Delivery checklist
- [ ] Add `/login` page with Username, Password, Login, Reset.
- [ ] Confirm app shows Login page on load when unauthenticated.
- [ ] Add minimal route guard if applicable.
- [ ] Add unit test verifying required elements are present.
- [ ] Add plan for backend endpoint + users table (scaffolding).

---

## Notes / Out of scope (for later ACs)
- Actual authentication logic (credential verification, error handling)
- Rate limiting / lockout policy
- Remember-me
- Password reset flow
- Home page protection and redirect behavior on successful login
