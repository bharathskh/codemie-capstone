# Login Feature Implementation Plan

## Story
As a registered user, I want to log into the application using my username and password, so that I can securely access the application and view the Home page.

### Current Acceptance Criteria (provided)
**AC1 – Display Login Page**
- Given the user launches the application
- When the application loads
- Then the Login page should be displayed with:
  - Username field
  - Password field
  - Login button
  - Reset button

### Clarifying Assumptions / Recommended AC Additions (to implement end-to-end)
While AC1 focuses on rendering the login page, an end-to-end implementation typically also includes:
- Successful login redirects to Home.
- Invalid credentials show a generic error.
- Reset clears inputs and errors.
- Session handling (JWT/cookie) and route protection.
- Basic security controls (rate limit, password hashing).

---

## Implementation Plan

### 1) Frontend

#### Pages / Routes
- Add a `/login` route that renders the Login page.
- Add a protected route for `/` or `/home` (depending on existing routing) that requires authentication.
  - If unauthenticated, redirect to `/login`.
  - If authenticated and user navigates to `/login`, redirect to Home.

#### UI Components
- Login form containing:
  - Username input
  - Password input (masked)
  - Login button (primary action)
  - Reset button

#### Form Behavior
- Client-side validations:
  - Required: username, password.
  - Trim whitespace in username on submit.
- Login button:
  - On click/submit, call the backend login endpoint.
  - Disable while submitting to prevent duplicate requests.
  - Show error banner/inline message on failure.
- Reset button:
  - Clears username + password fields.
  - Clears validation errors and server error messages.
  - Returns focus to username field.

#### Auth State Management
- Store auth state in a centralized place (depending on stack):
  - React: Context + reducer, or Zustand/Redux.
- If using cookie-based auth:
  - Frontend does not store tokens in localStorage.
  - Use `fetch/axios` with `credentials: 'include'`.
- Provide a `useAuth()` hook or equivalent that exposes:
  - `login(username, password)`
  - `logout()` (optional but recommended)
  - `isAuthenticated`
  - `user` (optional)

#### Accessibility / UX
- Proper `<label>` for inputs.
- Password field uses `type="password"`.
- Keyboard support: Enter submits form.
- Error messaging announced (ARIA live region for form errors).

#### Frontend Testing
- Unit/component tests:
  - Renders all required controls (AC1).
  - Reset clears fields.
  - Submits calls API and handles success/failure.
- E2E tests (optional but recommended):
  - Successful login -> redirected to Home.
  - Invalid login -> error displayed.

---

### 2) Backend

#### API Endpoints
- `POST /api/auth/login`
  - Request body: `{ "username": string, "password": string }`
  - Responses:
    - `200 OK`: sets session cookie and returns user summary OR returns JWT (depending on approach).
    - `401 Unauthorized`: invalid credentials (generic message).
    - `400 Bad Request`: missing username/password.
- Recommended supporting endpoints:
  - `POST /api/auth/logout` (clears cookie/session)
  - `GET /api/auth/me` (returns current user if authenticated)

#### Authentication Implementation
- Look up user by username (case sensitivity to be defined; typically normalize to lowercase).
- Verify password using a secure hash algorithm:
  - Prefer **Argon2id**; acceptable **bcrypt**.
- On success:
  - Cookie/session approach (recommended for web apps):
    - Issue secure, httpOnly cookie (`Secure`, `HttpOnly`, `SameSite=Lax/Strict`).
  - JWT approach (also viable):
    - If using JWT, still prefer httpOnly cookie storage.

#### Security Controls
- Rate limiting on login endpoint (per IP + per username if possible).
- Generic error messages to prevent user enumeration.
- Audit logging (without secrets):
  - login success/failure with timestamp, username, IP.
- Enforce HTTPS in production.

#### Backend Testing
- Unit tests:
  - Password verification.
  - Login success sets session.
  - Invalid credentials return 401.
- Integration tests:
  - Login endpoint + database.

---

### 3) Database

#### Users Table (minimum)
- `users`
  - `id` (uuid / serial)
  - `username` (unique, indexed)
  - `password_hash` (string)
  - `created_at`, `updated_at`
  - Optional: `is_active`, `locked_until`, `failed_login_attempts`, `last_login_at`

#### Seed / Migration
- Add migration to create `users` table.
- Add seed script for a test user (non-production) if needed.

#### Optional Audit Table
- `auth_events`
  - `id`
  - `user_id` (nullable)
  - `username_attempted`
  - `event_type` (LOGIN_SUCCESS, LOGIN_FAILURE)
  - `ip_address`
  - `created_at`

---

## Delivery Checklist
- [ ] `/login` page renders Username, Password, Login, Reset (AC1).
- [ ] Reset clears fields and errors.
- [ ] Backend login endpoint verifies credentials using secure hashing.
- [ ] Secure session established and Home is protected.
- [ ] Basic rate limit enabled.
- [ ] Tests added for UI + backend.

---

## Open Questions
1. Is this a web app (React/Vue/Angular) or mobile?
2. Should "username" accept email? Is it case-insensitive?
3. What is the Home route (`/`, `/home`, something else)?
4. Preferred auth method: cookie session vs JWT?
5. Required lockout/rate-limit policy?
