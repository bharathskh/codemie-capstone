# Plan — Login Page (Username/Password)

## Story
As a registered user, I want to log into the application using my username and password so that I can securely access the application and view the Home page.

### Acceptance Criteria (provided)
**AC1 — Display Login Page**
- Given the user launches the application
- When the application loads
- Then the Login page should be displayed with:
  - Username field
  - Password field
  - Login button
  - Reset button

> Note: The current acceptance criteria only specifies UI presence. To complete the story end-to-end, we typically also implement submit/reset behavior and navigation to Home after successful login. If that is out of scope, we can implement UI-only.

---

## Implementation Plan

Because the repository currently contains only a `README.md` and no application code, the plan below describes a practical reference implementation that can be applied once the project structure (frontend/backend) is created.

### 1) Frontend

#### Pages / Routes
- **`/login`**: Login page (default landing page for unauthenticated users).
- **`/` or `/home`**: Home page (requires authenticated session).

#### Login UI (AC1)
- Create a Login form with:
  - Username input (text)
  - Password input (password)
  - Login button (submits form)
  - Reset button (clears form fields)
- Basic UX:
  - Disable Login button while submitting.
  - Show inline validation (optional but recommended): required fields.

#### Frontend state & behavior
- Manage form state with a lightweight form library or local component state.
- On **Login**:
  - Call backend endpoint `POST /api/auth/login` with `{ username, password }`.
  - On success:
    - Store auth state (preferably via **HttpOnly session cookie** rather than localStorage tokens).
    - Navigate to Home page.
  - On failure:
    - Display error message (generic: “Invalid username or password”).
- On **Reset**:
  - Clear both fields.
  - Clear validation/errors.
  - Focus username field.

#### Route protection
- Add an auth guard for protected routes:
  - If unauthenticated, redirect to `/login`.
  - If authenticated, allow access to `/home`.

#### Frontend testing
- Unit test:
  - Renders Username/Password/Login/Reset.
  - Reset clears fields.
- E2E (optional but recommended):
  - Successful login redirects to Home.
  - Invalid login stays on Login and shows error.

---

### 2) Backend

#### Authentication API
- `POST /api/auth/login`
  - Request: `{ "username": string, "password": string }`
  - Validate required fields.
  - Verify username exists; compare password hash.
  - On success:
    - Create session (server-side) and set cookie.
    - Return `{ user: { id, username } }`.
  - On failure:
    - Return `401 Unauthorized` with generic message.

- `POST /api/auth/logout` (recommended)
  - Destroys session and clears cookie.

- `GET /api/auth/me` (recommended)
  - Returns current authenticated user (used by frontend route guards).

#### Security considerations
- Always use password hashing (bcrypt/argon2).
- Do not log passwords.
- Use HTTPS in deployed environments.
- Use CSRF protection if using cookie-based sessions (or SameSite+CSRF token pattern).

#### Backend testing
- Unit/integration tests:
  - Successful login sets session.
  - Invalid credentials return 401.

---

### 3) Database

#### Tables
- `users`
  - `id` (PK)
  - `username` (unique, indexed)
  - `password_hash`
  - `created_at`, `updated_at`

- (If using server-side sessions) `sessions`
  - Either use an in-memory store (Redis) or DB-backed sessions.

#### Seed / migration
- Add migrations to create `users`.
- Add a seed user for local development/testing.

---

## Suggested Tech Stack

Because the current repository does not yet indicate a stack, here are two proven options.

### Option A (fastest for web app MVP)
- **Frontend**: Next.js (React + TypeScript), Tailwind CSS
- **Backend**: Next.js API routes (or separate Node/Express), TypeScript
- **Auth**: Cookie-based sessions with iron-session / lucia / next-auth (credentials provider)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Testing**: Playwright (E2E), Vitest/Jest (unit)

### Option B (clean separation)
- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + NestJS (TypeScript)
- **Auth**: Passport.js (local strategy) + server-side sessions stored in Redis
- **Database**: PostgreSQL (Prisma/TypeORM)
- **Testing**: Cypress/Playwright + Jest

> Recommendation: Option A if you want a single deployable web app quickly; Option B if you prefer separate services and clearer backend boundaries.
