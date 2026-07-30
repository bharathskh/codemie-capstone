# Login Feature Plan (Option A: Next.js full-stack)

## Goal
Implement login UI + authentication flow so a registered user can log in with username/password and be redirected to Home. Include UI display, validation, invalid-credential error handling, and Reset behavior aligned to Jira:

- **EPMCDMETST-57299** — Login page UI displays username/password fields and actions
- **EPMCDMETST-57300** — Authenticate user and redirect to Home on success
- **EPMCDMETST-57301** — Generic error on invalid credentials (no user enumeration)
- **EPMCDMETST-57302** — Required-field validation for username and password
- **EPMCDMETST-57303** — Reset clears inputs and any errors

## Scope
- **Frontend**: Next.js pages for `/login` and `/home`, route protection, form validations.
- **Backend**: Next.js Route Handler/API endpoint for login, session issuance via secure **httpOnly cookie**.
- **Data**: User table with `username` + `password_hash`.
- **Testing**: Unit + integration + e2e checks for the above behaviors.

---

## Architecture (Option A)
- **Framework**: Next.js (App Router)
- **Auth**: Custom credentials auth using `POST /api/auth/login`
- **Session**: Signed JWT stored in **httpOnly cookie** (preferred) OR server session cookie.
- **DB**: PostgreSQL
- **ORM**: Prisma
- **Hashing**: bcrypt or argon2

> Note: If you later decide to use NextAuth, the UI and most AC remain the same, but the endpoint/session implementation changes.

---

## Frontend Plan

### 1) Login page UI (AC1)
- Route: `/login`
- Components:
  - Username input (`name="username"`, `type="text"`)
  - Password input (`name="password"`, `type="password"`, masked by default)
  - Login button (`type="submit"`)
  - Reset button (`type="button"`)

### 2) Client-side validation (AC4)
On submit:
- If username empty → show inline error: **"Username is required"**
- If password empty → show inline error: **"Password is required"**
- Focus the first invalid field.
- Pressing **Enter** in either field submits the form.

### 3) Login submission + loading state
- Call: `POST /api/auth/login` with JSON `{ username, password }`
- While pending:
  - disable Login/Reset
  - show loading indicator (optional)

### 4) Success flow (AC2)
- On 200 OK:
  - browser receives session cookie
  - redirect to `/home`

### 5) Invalid credentials (AC3)
- On 401/403:
  - keep user on `/login`
  - show generic message: **"Invalid username or password"**
  - do not reveal whether username exists

### 6) Reset behavior (AC5)
- Clears username/password fields
- Clears validation errors + authentication errors
- Resets loading state (if set)

### 7) Route protection
- If user is unauthenticated and navigates to `/home`:
  - redirect to `/login`

---

## Backend Plan

### 1) Endpoint: `POST /api/auth/login`
- Validate request body:
  - `username` required
  - `password` required
- Lookup user by username.
- Verify password using bcrypt/argon2 against stored `password_hash`.
- If invalid:
  - return **401 Unauthorized** with a generic message (e.g., `{ error: "Invalid credentials" }`).

### 2) Issue session
Preferred: JWT in **httpOnly cookie**
- Cookie settings:
  - `HttpOnly: true`
  - `Secure: true` in production
  - `SameSite: Lax` (or Strict depending on app flows)
  - reasonable expiration

### 3) (Optional but recommended)
- Rate limit login attempts
- Audit log successful/failed logins

---

## Data Plan (PostgreSQL + Prisma)

### User model
- `id` (uuid)
- `username` (unique)
- `password_hash`
- optional: `status` (active/locked/disabled)
- timestamps

### Migrations
- Create initial `User` table
- Add unique index on `username`

---

## Testing Plan

### Unit tests
- Validation helpers
- Password verification logic

### Integration tests
- `POST /api/auth/login`:
  - success returns 200 + sets cookie
  - invalid returns 401 with generic error

### E2E/UI tests (Playwright recommended)
- `/login` renders Username, Password, Login, Reset
- Empty-field submit shows correct validation errors
- Reset clears fields and errors
- Invalid credentials shows generic error
- Valid credentials redirects to `/home`

---

## Deliverables
- `plan.md` (this document)
- Next step after approval: implement Next.js app scaffold, login page, API route, Prisma schema, and tests.
