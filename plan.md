# Plan — EPMCDMETST-56732: User login with username/password

## Goal
Deliver a basic, secure login capability that displays a Login page (AC1) and supports the core behaviors from the story (AC1–AC9): successful authentication and redirect to Home, required-field validation, generic invalid-credentials messaging, reset behavior, password masking, duplicate-submission prevention, graceful network/system error handling, and baseline accessibility.

> Note: This repo currently contains only `README.md` (no application code). This plan describes the intended implementation and the concrete files/modules we would add once the app scaffold exists.

---

## Implementation approach

### 1) Frontend

#### UI: Login page
- Route/page: `/login`
- Components:
  - `LoginPage` container
  - `LoginForm` with:
    - Username input (text)
    - Password input (password)
    - Login button
    - Reset button
    - Inline validation / error summary area
    - Optional loading spinner/indicator

#### Behaviors mapped to acceptance criteria
- **AC1 Display Login Page**
  - Render Username, Password, Login, Reset.
- **AC2 Successful Login**
  - On submit, call `POST /api/auth/login` with `{ username, password }`.
  - On success, store auth (cookie-based session or token—see Backend) and redirect to `/home`.
- **AC3 Required fields**
  - Client-side validation on submit (and optionally on blur):
    - Username required
    - Password required
  - Show inline field errors and prevent API call.
- **AC4 Invalid credentials**
  - Show generic error message (no indication whether username exists).
- **AC5 Reset**
  - Clear both fields + clear errors; focus username.
- **AC6 Password masking**
  - Use `<input type="password">`.
- **AC7 Prevent duplicate submissions**
  - Disable Login button while request in-flight.
- **AC8 System/network error**
  - Catch non-401 errors/timeouts and show friendly error.
- **AC9 Accessibility**
  - Ensure `<label for>` or equivalent, ARIA for errors.
  - Tab order: Username → Password → Login → Reset.
  - Focus management: first invalid field on submit; focus Username on reset.

#### Frontend structure (suggested)
- `src/pages/LoginPage.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/services/auth.ts` (API client)
- `src/routes.tsx` or router config
- `src/pages/HomePage.tsx` (minimal placeholder with stable selector e.g. `data-testid="home-page"`)

#### Frontend tests
- Unit/component tests (React Testing Library):
  - Renders required fields/buttons (AC1)
  - Required validation (AC3)
  - Reset clears fields and errors (AC5)
  - Disable button on submit (AC7)
- E2E tests (Playwright/Cypress):
  - Successful login redirects to Home (AC2)
  - Invalid login shows generic error (AC4)

---

### 2) Backend

#### API endpoints
- `POST /api/auth/login`
  - Input: `{ username: string, password: string }`
  - Responses:
    - `200 OK` with user payload (optional) and auth mechanism established
    - `401 Unauthorized` with generic error message
    - `429 Too Many Requests` if rate-limiting is enabled (optional)
    - `500` for unexpected errors (return generic message)

- `POST /api/auth/logout`
  - Clears session/cookie.

- `GET /api/auth/me`
  - Returns current authenticated user for session persistence.

#### Auth mechanism (recommended)
- Prefer **cookie-based session** (HTTP-only, Secure, SameSite=Lax/Strict) for SPA + API under same domain.
  - Mitigates XSS token theft (since token not in localStorage).
  - Use CSRF protections if needed (double-submit cookie or CSRF token) depending on architecture.

Alternative:
- JWT access token (short-lived) + refresh token in HTTP-only cookie.

#### Business logic
- Validate request payload server-side.
- Find user by username.
- Verify password using strong hashing (bcrypt/argon2).
- Return **generic** `401` for any auth failure.
- Log auth events without logging passwords.

#### Backend tests
- Unit tests for auth service (password hashing/verification).
- Integration tests for `/login` success/failure and error responses.

---

### 3) Database

#### Schema additions
- `users` table (or collection):
  - `id` (UUID/serial)
  - `username` (unique, indexed)
  - `password_hash`
  - `status` (active/locked/disabled) (optional)
  - `created_at`, `updated_at`

- `sessions` table (if server-side sessions):
  - `id`
  - `user_id` (FK)
  - `created_at`, `expires_at`
  - `ip`, `user_agent` (optional)

#### Migration strategy
- Create migrations for `users` and `sessions`.
- Seed a test user for local dev/testing.

---

## Delivery steps (recommended sequence)
1. Scaffold app structure (frontend + backend) if not already present.
2. Implement Login page UI with local validation.
3. Implement backend `/api/auth/login` (with password hashing and generic errors).
4. Wire frontend to backend via `auth` service.
5. Add `/home` route and auth guard (redirect unauthenticated users to `/login`).
6. Implement reset behavior, loading state, and error rendering.
7. Add tests (unit + e2e).
8. Security hardening: secure cookies, rate limiting, audit logs (as required).

---

## Out of scope (unless later requested)
- MFA/SSO
- Forgot password
- Account lockout policies beyond basic rate limiting
- UI polish beyond baseline accessibility and functional requirements

---

## Open questions
1. Is “username” strictly a username, or can it be email?
2. What is the canonical Home route and what element should be used to assert it loaded?
3. Preferred auth: cookie session vs JWT?
4. Should we implement rate limiting/lockout now (AC10 optional)?
