# Login (Username/Password) – Implementation Plan

Story: As a registered user, I want to log into the application using my username and password, so that I can securely access the application and view the Home page.

Acceptance Criteria (baseline + enhancements)
- AC1: Display Login Page with Username, Password, Login, Reset.
- AC2: Successful login redirects to Home and creates an authenticated session/token.
- AC3: Invalid credentials show a generic error and user remains on login.
- AC4: Client/server validation prevents empty submit; field-level errors.
- AC5: Reset clears fields and errors and focuses Username.
- AC6: Password is masked; optional show/hide.
- AC7: Brute-force protections (rate limit/lockout) and audit logging.
- AC8: Session timeout/refresh handling.
- AC9: Accessibility + keyboard support (Enter submits, focus management, labels).

---

## 1) Frontend implementation

### Pages / Routes
- Add a `/login` route/page that is the default landing route for unauthenticated users.
- Add a `Home` route/page (or existing) protected by auth guard.

### UI components
- `LoginForm`
  - Username input (text)
  - Password input (password)
  - **Login** button (primary)
  - **Reset** button (secondary)

### Client-side behavior
- Initial load shows login page.
- Validation
  - Username required
  - Password required
  - Disable login button while submitting
  - Show inline validation messages (accessible)
- Submit
  - On click **Login** or pressing Enter in password field: call backend `POST /api/auth/login`
  - Handle loading state and errors
  - On success: store auth state (cookie/token) and redirect to Home
- Reset
  - Clears username/password fields
  - Clears any validation + server error banners
  - Sets focus back to Username

### Accessibility
- Associate labels with inputs (`label` + `htmlFor`)
- Use proper `aria-invalid`, `aria-describedby` for errors
- Ensure focus visible and logical tab order
- Error summary/banner uses `role="alert"` (or equivalent)

### Frontend tests
- Unit/component tests
  - Renders required elements
  - Required field validations
  - Reset behavior
  - Successful login redirect mocked
  - Invalid login shows generic error
- E2E smoke test (optional)
  - Loads login
  - Logs in with seeded user
  - Redirects to home

---

## 2) Backend implementation

### API design
- `POST /api/auth/login`
  - Request body: `{ username: string, password: string }`
  - Responses:
    - `200 OK` with session/token details (or set-cookie)
    - `400 Bad Request` for validation issues
    - `401 Unauthorized` for invalid credentials (generic message)

### Authentication/session
- Preferred: HttpOnly secure cookie session/JWT
  - If JWT: short-lived access token + refresh token (refresh token in HttpOnly cookie)
  - If session: server-side session store + session cookie

### Security controls
- Password hashing: Argon2 (preferred) or bcrypt
- Rate limiting on login endpoint (e.g., per IP + per username)
- Account lockout policy (optional): e.g., 5 failed attempts / 15 minutes (config-driven)
- Generic error message to prevent username enumeration
- Audit logging
  - Successful login: user id + timestamp
  - Failed login: username attempted + IP + timestamp
- Always enforce HTTPS in production; set cookies as `Secure`, `HttpOnly`, `SameSite=Lax/Strict`

### Backend tests
- Unit tests for auth service
- Integration tests for `POST /api/auth/login`
  - success returns 200
  - invalid credentials returns 401
  - missing fields returns 400
  - rate limit triggers expected status

---

## 3) Database implementation

### Tables
- `users`
  - `id` (uuid/bigint)
  - `username` (unique, indexed)
  - `password_hash`
  - `status` (active/disabled) optional
  - `created_at`, `updated_at`

Optional supporting tables
- `login_audit`
  - `id`, `user_id` nullable, `username_attempted`, `ip`, `user_agent`, `success`, `created_at`
- If using server sessions: `sessions` (depending on framework/store)

### Migrations / seeds
- Migration to create `users` (and optional audit)
- Seed a test user for local/dev

---

## 4) Definition of Done
- Login page available and default for unauthenticated users
- Validations and reset behavior meet ACs
- Backend login endpoint implemented with secure password verification
- Authenticated users can access Home; unauthenticated users are redirected to Login
- Rate limiting enabled for login endpoint
- Unit/integration tests added and passing
- Minimal documentation for env/config (JWT secret, cookie settings, rate limit)

---

## 5) Suggested tech stack

### Recommended (balanced, common)
- Frontend: **React + TypeScript** (or **Next.js** if SSR/routing is desired)
- Backend: **Node.js + NestJS** (structured) or **Express/Fastify** (lighter)
- DB: **PostgreSQL**
- ORM: **Prisma**
- Auth: Cookie-based session or JWT + refresh token
- Testing: **Jest** + **Testing Library**; E2E: **Playwright**

### Alternative (fullstack in one)
- **Next.js + TypeScript + NextAuth** (credentials provider) + PostgreSQL
  - Custom credential verification + password hashing
  - Useful if repository is intended to be a single web app
