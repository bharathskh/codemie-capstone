# Plan — Login Feature (EPMCDMETST-55902)

## Goal
Implement the login page and authentication flow so a registered user can log in with username/password and be redirected to the Home page. Includes UX behaviors (reset, masking), validation and error messaging, basic brute-force protection, and accessibility expectations.

## Scope (from ACs)
- **AC1**: Display Login page with Username, Password, Login, Reset.
- **AC2**: Successful login establishes session and redirects to Home.
- **AC3**: Invalid credentials show non-revealing error.
- **AC4**: Required-field validation.
- **AC5**: Reset clears fields + validation errors.
- **AC6**: Password masking.
- **AC7**: Basic brute-force protection (rate limiting / lockout policy).
- **AC8**: Accessibility / keyboard navigation.

## Assumptions
- Repo currently contains only `README.md`; implementation will add a minimal full-stack skeleton.
- No existing auth provider is integrated. We will implement local auth with salted password hashing.
- “Home page” can be a protected route returning a simple welcome message for now.

---

## Implementation Plan

### 1) Front End

#### Pages / Routes
- `/login`
  - Form fields: username, password
  - Buttons: Login (submit), Reset
  - Inline validation messages
  - General error banner for invalid credentials and server errors
- `/` (Home)
  - Protected route; redirects to `/login` if not authenticated

#### Behaviors
- **Validation (AC4)**
  - On submit: if username empty => show “Username is required”
  - If password empty => show “Password is required”
  - Prevent API call until valid
- **Reset (AC5)**
  - Clears username + password fields
  - Clears validation messages and any general error banner
  - Returns focus to username field
- **Password masking (AC6)**
  - `<input type="password">`
- **Accessibility (AC8)**
  - Proper `<label for>` association
  - `aria-invalid` and `aria-describedby` for error text
  - Keyboard navigable: Tab order Username -> Password -> Login -> Reset
  - Enter key submits when focus is in inputs

#### API Integration
- POST `/api/auth/login` with `{ username, password }`
- On 200: store auth (cookie-based session recommended) and navigate to `/`
- On 401: show “Invalid username or password” (do not reveal which)
- On 429: show “Too many attempts. Please try again later.”

#### Front-end testing
- Unit tests for form validation and reset behavior
- E2E smoke test: login success redirects to Home; failure shows error

---

### 2) Back End

#### Endpoints
- `POST /api/auth/login`
  - Validates body presence
  - Checks credentials
  - On success: creates session, returns 200 with minimal user payload
  - On failure: 401 generic error
  - On too many attempts: 429
- `POST /api/auth/logout`
  - Destroys session
- `GET /api/me`
  - Returns current authenticated user (for client bootstrapping)
- `GET /api/home`
  - Protected resource; returns data for home page

#### Authentication
- Store users in DB with `password_hash` (bcrypt/argon2)
- Session strategy:
  - Prefer **httpOnly secure cookie session** (express-session) OR JWT in httpOnly cookie
  - Protect routes with middleware that verifies session

#### Brute-force protection (AC7)
- Add rate limiting on login endpoint (e.g., 5 attempts / 15 minutes per IP and/or per username)
- Optional: incremental backoff
- Ensure error message remains generic

#### Error handling
- Central error middleware
- Return consistent JSON:
  - `{ "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid username or password" } }`
  - `{ "error": { "code": "RATE_LIMITED", "message": "Too many attempts" } }`

#### Back-end testing
- Unit tests for auth service
- Integration tests for login success/failure/rate limit

---

### 3) Database

#### Tables
- `users`
  - `id` (uuid / serial)
  - `username` (unique, indexed)
  - `password_hash`
  - `created_at`, `updated_at`
  - Optional: `is_active`
- (Optional) `login_attempts` if you want per-username locking beyond simple IP rate limiting

#### Seed / Migration
- Create initial migration for `users`
- Add a seed user for local testing

---

## Milestones / Order of Work
1. Initialize repo structure (frontend + backend + db migration tooling).
2. Implement DB schema + seed.
3. Implement backend auth endpoints + session + rate limiting.
4. Implement frontend Login page UI + validation + reset.
5. Implement protected Home route.
6. Add tests (unit/integration/e2e minimal).
7. Documentation: update README with run steps.

---

## Definition of Done
- Login page renders with all required UI elements (AC1).
- Successful login redirects to Home and protected routes require auth (AC2).
- Invalid credentials show generic error (AC3).
- Required field validation blocks submission (AC4).
- Reset clears fields and errors (AC5).
- Password input is masked (AC6).
- Rate limiting returns 429 and UI displays message (AC7).
- Keyboard navigation and accessible labels/errors are present (AC8).
