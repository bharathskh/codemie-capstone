# Plan: User Login Page (Username/Password)

## Story
As a registered user, I want to log into the application using my username and password so that I can securely access the application and view the Home page.

## Acceptance Criteria in scope (provided)
**AC1 – Display Login Page**
- Given the user launches the application
- When the application loads
- Then the Login page should be displayed with:
  - Username field
  - Password field
  - Login button
  - Reset button

> Note: This plan focuses on delivering AC1. Typically, login submission, validation, session management, and redirect-to-home would be additional ACs.

---

## Implementation Plan

### 1) Frontend

#### 1.1 Pages / Routes
- Create a `/login` route and make it the default landing route.
- Ensure unauthenticated users are routed to `/login` when opening the app.

#### 1.2 Login Page UI
- Build a `LoginPage` component containing:
  - **Username input** (type: `text`, label: `Username`, name/id: `username`)
  - **Password input** (type: `password`, label: `Password`, name/id: `password`)
  - **Login button** (type: `submit`)
  - **Reset button** (type: `reset`)

#### 1.3 Form behavior (minimal for AC1)
- Use a standard HTML form (or a form library) so `Reset` works natively:
  - Clicking **Reset** clears username/password inputs.
- Initial focus recommendation: focus on Username field on page load.

#### 1.4 Styling & accessibility
- Ensure inputs have visible labels (not placeholder-only).
- Add basic layout:
  - centered card/container
  - spacing between fields
- Accessibility:
  - label `for` matches input `id`
  - buttons have clear text

#### 1.5 Testing (frontend)
- Unit/UI tests:
  - renders Username field
  - renders Password field
  - renders Login button
  - renders Reset button
- Basic e2e (optional): app loads to login and elements exist.

---

### 2) Backend

AC1 does not require backend functionality; however, to keep the architecture ready for subsequent ACs (login submission and secure access), scaffold a minimal auth endpoint.

#### 2.1 API endpoints (scaffold)
- `POST /api/auth/login`
  - Input: `{ "username": string, "password": string }`
  - Output (future): auth token/session cookie, user profile
- `POST /api/auth/logout` (future)

#### 2.2 Auth strategy (future-ready)
- Prefer secure, industry standard approach:
  - Hash passwords with bcrypt/argon2
  - Issue secure HTTP-only cookie session or JWT
  - Enforce HTTPS in production

#### 2.3 Testing (backend)
- Add a basic contract test stub for `/api/auth/login` (even if it returns 501/not implemented for now).

---

### 3) Database

AC1 does not require a database change. For later login functionality, define a `users` table.

#### 3.1 Users table (future)
- `users`
  - `id` (uuid / bigint)
  - `username` (unique, indexed)
  - `password_hash`
  - `created_at`, `updated_at`
  - (optional) `is_active`, `last_login_at`, `failed_login_count`, `locked_until`

#### 3.2 Migration approach
- Use a migrations tool (Prisma migrations / Knex migrations / Flyway / Liquibase depending on stack).

---

## Deliverables for AC1
- App default route renders `/login`.
- Login page displays:
  - Username field
  - Password field
  - Login button
  - Reset button
- Automated test coverage for rendering.

---

## Suggested Tech Stack

Because the repository currently contains only a minimal README and no existing stack constraints, here are pragmatic defaults:

### Option A (Recommended): Full-stack TypeScript
- **Frontend:** React + Vite + TypeScript, React Router
- **Backend:** Node.js + NestJS (or Express/Fastify) + TypeScript
- **Database:** PostgreSQL
- **ORM/Migrations:** Prisma
- **Auth (future):** bcrypt for password hashing, JWT or secure cookie-based sessions
- **Testing:** Vitest + React Testing Library (FE), Jest/Supertest (BE)

### Option B: Python backend
- **Frontend:** React + Vite + TypeScript
- **Backend:** FastAPI + Python
- **Database:** PostgreSQL
- **ORM/Migrations:** SQLAlchemy + Alembic

---

## Branch / PR Notes
- Branch: `feature/login-plan`
- This PR adds `plan.md` describing implementation steps and recommended stack.
