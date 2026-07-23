# Plan: Login Page (Username/Password) + Login/Reset Buttons

## Story
As a registered user, I want to log into the application using my username and password so that I can securely access the application and view the Home page.

## Acceptance Criteria (in scope)
**AC1 – Display Login Page**
- On application load, show Login page containing:
  - Username field
  - Password field
  - Login button
  - Reset button

> Note: Only AC1 is explicitly provided. Items like authentication, error states, session handling, and redirect to Home should be clarified/added as follow-up ACs.

---

## Implementation Plan

### 1) Frontend

#### Pages / Routes
- Add a `/login` route (or make it the default route) that renders a **LoginPage**.
- Ensure app load redirects to `/login` when the user is unauthenticated.

#### Components
- **LoginForm** component with controlled inputs:
  - `username` text input
  - `password` password input (masked)
  - `Login` submit button
  - `Reset` button

#### UI Behaviors
- On load, autofocus `username` field.
- `Reset` clears both fields and any visible validation messages.
- `Login` triggers a submit handler.

#### Client-side Validation (recommended even though not in AC1)
- Required validation on username/password.
- Disable Login button while request is pending.

#### API Integration (future-ready)
- Call backend endpoint `POST /api/auth/login`.
- On success store session token (cookie-based session preferred; otherwise store JWT in memory/local storage per security policy).
- On success navigate to `/home`.
- On error show generic message.

#### Testing (frontend)
- Unit/UI tests:
  - renders fields/buttons
  - reset clears values
  - submit calls handler with username/password

---

### 2) Backend

#### Endpoints
- `POST /api/auth/login`
  - Request: `{ "username": string, "password": string }`
  - Response (200): `{ "user": { id, username, ... } }` and establish session/cookie
  - Response (401): `{ "message": "Invalid username or password" }`

#### Authentication Logic
- Validate inputs.
- Look up user by username.
- Verify password hash.
- Create session (server-side session store) or sign JWT.

#### Security (recommended)
- Rate limiting for login attempts.
- Do not log raw passwords.
- Use HTTPS; secure, HttpOnly cookies if using cookie sessions.

#### Testing (backend)
- Unit tests for password verification and user lookup.
- API tests for success/failure.

---

### 3) Database

#### Schema
- `users` table/collection:
  - `id` (PK)
  - `username` (unique, indexed)
  - `password_hash`
  - `created_at`, `updated_at`
  - optional: `status` (active/locked)

#### Migrations / Seed
- Migration to create `users`.
- Seed script to create at least one test user.

---

## Suggested Tech Stack

Because the repository currently only contains a README, below are two effective stack options depending on target platform.

### Option A (Recommended): React + Node.js
- **Frontend**: React + TypeScript + Vite, React Router, React Hook Form
- **Backend**: Node.js + TypeScript (NestJS or Express)
- **Auth**: Cookie-based sessions (express-session) or JWT (Passport.js)
- **DB**: PostgreSQL
- **ORM**: Prisma
- **Testing**: Vitest/React Testing Library (FE), Jest + Supertest (BE)
- **CI**: GitHub Actions

### Option B: Next.js Fullstack
- **Framework**: Next.js (App Router) + TypeScript
- **Auth**: NextAuth.js (Credentials provider) or custom session
- **DB**: PostgreSQL + Prisma
- **Testing**: Playwright (e2e), Vitest/Jest

---

## Deliverables for this PR
- `plan.md` documenting the approach for frontend/backend/database and suggested tech stack.

## Follow-ups (Not in current AC)
- Add ACs for successful login redirect to Home, error handling, validation, lockout/rate-limit, session timeout, and accessibility.
