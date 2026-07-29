# Plan: Username/Password Login (Display + Auth Flow)

## Goal
Implement a secure username/password login so registered users can authenticate and be redirected to the Home page. Include a Login page UI (username, password, login, reset), validation, error handling, basic security measures, and minimal persistence/session handling appropriate to the existing application.

> Note: This plan is implementation-oriented. Exact framework/library choices should align with the existing repository; currently the repository contains only a README, so this plan assumes a typical web architecture and can be adapted.

---

## Scope (from approved story + proposed AC)
- Login page UI:
  - Username field
  - Password field (masked)
  - Login button
  - Reset button
- Behaviors:
  - Required field validation
  - Invalid credentials show generic error
  - Reset clears fields + errors and focuses username
  - Enter submits from password field
  - On successful login redirect to Home
- Security basics:
  - HTTPS only
  - Do not log passwords
  - Generic error to avoid username enumeration

### Out of scope (unless specified later)
- MFA/SSO
- Account lockout/captcha/rate limiting (can be added later)
- Password reset / forgot password flows
- Remember-me persistent login

---

## Frontend Implementation Plan

### 1) Routes & Page Structure
- Add route `/login` to render Login page.
- Add guarded route `/home` (or `/`) requiring authentication.
- If user is already authenticated:
  - navigating to `/login` should redirect to `/home`
  - app launch should go to `/home` directly (or default route) based on auth state

### 2) Login Page UI
- Components:
  - `LoginPage`
  - `LoginForm`
- Fields:
  - Username input (text)
  - Password input (password type, masked)
- Buttons:
  - Login (primary)
  - Reset (secondary)

### 3) Form State & Validation
- Client-side validation rules (minimal):
  - Username required (trim leading/trailing whitespace)
  - Password required
- On submit:
  - If invalid: show inline field errors; do not call API.
  - If valid: call backend login endpoint.

### 4) Error Handling
- For invalid credentials (401/403):
  - Show generic message: `Invalid username or password`.
- For network/server errors (5xx/timeouts):
  - Show generic message: `Login failed. Please try again.`
- Clear password field on failed login (recommended; confirm with product).

### 5) Reset Behavior
- Clear username, password, and any error messages.
- Set focus back to Username input.

### 6) Accessibility & UX
- Proper `<label for>` or accessible labels.
- Tab order: Username → Password → Login → Reset.
- Pressing Enter in Password triggers submit.
- Ensure error messages are associated with fields (ARIA `aria-describedby`), and a form-level error is announced.

### 7) Auth State Management
- Maintain auth state in a centralized store (context/redux/pinia/etc.).
- Store access token/session indicator securely:
  - Prefer HttpOnly secure cookies from backend session/token.
  - If using tokens in browser storage, prefer memory + refresh via cookie (best practice).

---

## Backend Implementation Plan

### 1) API Endpoints
Implement minimal auth endpoints:
- `POST /api/auth/login`
  - Input: `{ username, password }`
  - Output:
    - 200 OK + session cookie OR `{ token, user }`
    - 401 Unauthorized on invalid creds (generic message)
- `POST /api/auth/logout`
  - Clears session/cookie
- `GET /api/auth/me`
  - Returns authenticated user profile if session valid

### 2) Authentication Logic
- Normalize username input (trim; decide case-sensitivity—commonly case-insensitive for username/email).
- Verify password using a strong password hashing algorithm:
  - `bcrypt` / `argon2`.
- Prevent username enumeration:
  - Always return same generic message for invalid username or password.
- Do not log passwords; sanitize request logging.

### 3) Session vs JWT (choose one)
**Option A: Cookie-based session (recommended for web apps)**
- Issue signed session cookie (HttpOnly, Secure, SameSite=Lax/Strict).
- Store session in server memory/Redis/DB.

**Option B: JWT access token + refresh strategy**
- Issue short-lived access token + refresh cookie.

Given simplicity and security, start with **Option A**.

### 4) Authorization Middleware
- Add middleware to protect `/api/*` routes requiring authentication.
- Ensure `/home` data endpoints require auth.

### 5) Security Hardening (baseline)
- Enforce HTTPS (in production) and set `Secure` cookie flag.
- Add CSRF protection if using cookies (e.g., CSRF token or SameSite strict + custom header).
- Add basic rate limiting on login endpoint (even if light) if feasible.

### 6) Logging & Auditing
- Log login success/failure events without sensitive data.
- Include correlation id/request id.

---

## Database Implementation Plan

### 1) Users Table (minimum)
Create (or ensure existing) `users` table/collection with:
- `id` (uuid/int)
- `username` (unique)
- `password_hash` (string)
- `created_at`, `updated_at`
- Optional: `is_active`, `locked_at`, `last_login_at`

Indexes:
- Unique index on `username`.

### 2) Sessions (if using server sessions)
If using cookie-based sessions:
- `sessions` table (or Redis store) with:
  - `session_id` (primary)
  - `user_id` (foreign key)
  - `created_at`, `expires_at`
  - optional metadata: `ip`, `user_agent`

### 3) Seed / Migration
- Provide migration scripts for `users` (+ `sessions` if DB-backed sessions).
- Seed one test user for development (password stored as hash only).

---

## Testing Plan

### Frontend
- Unit tests:
  - validation rules (required fields)
  - reset clears fields/errors
- Component/integration tests:
  - successful login redirects to Home (mock API)
  - invalid credentials shows generic error

### Backend
- Unit tests:
  - password verification
  - login endpoint responses
- Integration tests:
  - login success sets session cookie
  - login failure returns 401 with generic message

### End-to-end (recommended)
- Launch app → login page shown.
- Enter valid creds → Home page visible.
- Enter invalid creds → error shown, remain on login.

---

## Delivery Steps (Implementation Order)
1. Define data model/migrations for users (and sessions if needed).
2. Implement backend auth endpoints + middleware.
3. Implement frontend login page + routing + auth state.
4. Hook up API calls and error handling.
5. Add tests and basic documentation.

---

## Tech Stack Recommendation
Because repository context is minimal, choose a common, maintainable stack:

### Frontend
- React + TypeScript
- Form handling: React Hook Form + Zod validation
- Routing: React Router
- UI: Material UI or Tailwind
- Testing: Vitest + React Testing Library

### Backend
- Node.js + TypeScript
- Framework: NestJS (structured) or Express/Fastify (lightweight)
- Auth: bcrypt/argon2, cookie-based sessions
- Validation: Zod/class-validator
- Testing: Jest + Supertest

### Database
- PostgreSQL
- ORM: Prisma
- Sessions: Redis (optional) or DB-backed session table

### DevOps
- Docker Compose for Postgres/Redis
- CI: GitHub Actions for lint/test
