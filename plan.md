# Plan: Login (Username/Password) – Display Login Page + Auth Flow

## Story
As a registered user, I want to log into the application using my username and password, so that I can securely access the application and view the Home page.

### Acceptance Criteria (provided)
**AC1 – Display Login Page**
- Given the user launches the application
- When the application loads
- Then the Login page should be displayed with:
  - Username field
  - Password field
  - Login button
  - Reset button

> Note: The story implies successful authentication should route to the Home page; this plan includes a minimal end-to-end auth flow to make the Login page functional.

---

## Implementation Plan

### 1) Front-end

#### 1.1 Routes / Navigation
- Add a `/login` route that renders `LoginPage`.
- Ensure the application default route redirects to `/login` when the user is not authenticated.
- Add a protected route wrapper for `/home` (or `/`) that checks authentication state; unauthenticated users are redirected to `/login`.

#### 1.2 Login Page UI
- Create a `LoginPage` component with:
  - **Username** input (type `text`)
  - **Password** input (type `password`, masked)
  - **Login** button (submits the form)
  - **Reset** button (clears username/password and any validation errors)
- Form behaviors:
  - Client-side validation: both fields required.
  - Disable Login button while request is in-flight.
  - Display generic error message for invalid credentials.
  - Support Enter-to-submit.
- Accessibility:
  - Use `<label for>` (or equivalent) linked to inputs.
  - Proper `aria-invalid` and error message association.
  - Logical tab order.

#### 1.3 State management / Session
- Store auth token/session after login:
  - Prefer HTTP-only cookie set by backend (best security) OR
  - Store short-lived access token in memory and refresh token in HTTP-only cookie.
- Add an `AuthContext`/store with:
  - `login(username,password)`
  - `logout()`
  - `isAuthenticated` and user profile (optional)
- On app load, call `/api/auth/me` (or similar) to hydrate auth state if a session cookie exists.

#### 1.4 API Integration
- POST `/api/auth/login` with `{ username, password }`.
- Handle responses:
  - `200 OK` => navigate to Home page.
  - `401 Unauthorized` => show “Invalid username or password”.
  - `429 Too Many Requests` => show rate-limit message.
  - `5xx` => show generic “Something went wrong. Try again.”

#### 1.5 Front-end testing
- Component tests:
  - Renders fields + buttons (AC1).
  - Reset clears fields.
  - Required validation.
- E2E (optional but recommended):
  - Successful login routes to Home.
  - Invalid login shows error.

---

### 2) Back-end

#### 2.1 Auth endpoints
- `POST /api/auth/login`
  - Validate payload.
  - Look up user by username.
  - Verify password hash.
  - On success, create session:
    - Option A: set signed HTTP-only cookie session id.
    - Option B: issue JWT access token + refresh cookie.
  - Return `200` with minimal user info.
- `POST /api/auth/logout`
  - Clear cookie / invalidate session.
- `GET /api/auth/me`
  - Returns current authenticated user if session is valid, else `401`.

#### 2.2 Security controls (baseline)
- Password hashing: bcrypt/argon2.
- Rate limiting on login endpoint (per IP and/or username).
- Do not reveal whether username exists; always return generic `401`.
- Audit logs for login success/failure (without logging passwords).
- Enforce HTTPS in production.

#### 2.3 Back-end testing
- Unit tests:
  - Password verification.
  - Login returns 200 with valid credentials.
  - Login returns 401 with invalid credentials.
- Integration tests:
  - Cookie/session issuance and `/me` behavior.

---

### 3) Database

#### 3.1 Schema
- `users`
  - `id` (uuid/int)
  - `username` (unique, indexed)
  - `password_hash`
  - `created_at`, `updated_at`
  - Optional: `is_active`, `last_login_at`

- If using server-side sessions:
  - `sessions`
    - `id`
    - `user_id` (FK)
    - `created_at`, `expires_at`
    - `revoked_at` (nullable)
    - `ip_address`, `user_agent` (optional)

#### 3.2 Seed / Migration
- Migration scripts to create tables.
- Seed a test user for local development.

---

## Delivery Steps (suggested sequencing)
1. Add backend auth endpoints + password hashing + minimal user table.
2. Implement frontend `/login` page per AC1.
3. Wire login form to backend.
4. Add protected route and redirect behavior to Home.
5. Add tests (FE + BE).
6. Verify accessibility and basic security.

---

## Tech Stack Recommendation

### Front-end
- **React + TypeScript** (or Next.js if SSR is desired)
- **React Router** for routing (if not using Next.js routing)
- **React Hook Form** + **Zod** for validation
- **Testing**: Vitest/Jest + React Testing Library; Playwright/Cypress for E2E
- **UI**: Tailwind CSS or MUI (depending on existing design system)

### Back-end
- **Node.js (NestJS/Express) + TypeScript**
- Auth:
  - **Passport.js** (session strategy) OR
  - **JWT** (access token) + refresh token via HTTP-only cookie
- Security:
  - **Helmet**, **cors**, **express-rate-limit**
  - **bcrypt** or **argon2**
- Testing: Jest + Supertest

### Database
- **PostgreSQL**
- ORM/Migrations:
  - **Prisma** (recommended for TS projects) or TypeORM/Sequelize

### DevOps (optional)
- Docker compose for `app + db`.
- GitHub Actions for CI (lint/test).
