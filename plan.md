# Plan: User Login (Username/Password)

## Story
As a registered user, I want to log into the application using my username and password, so that I can securely access the application and view the Home page.

## Acceptance Criteria in scope
**AC1 – Display Login Page**
- When the application loads, show a Login page with:
  - Username field
  - Password field
  - Login button
  - Reset button

> Note: The story mentions redirecting to Home page after login, but only AC1 is provided. This plan includes minimal scaffolding for the login action and routing so the story goal is achievable; if this is out of scope, we can omit AC2+ behaviors.

---

## Implementation Plan

### 1) Frontend

#### Pages / Routes
- Create `/login` route and set it as the default landing route when unauthenticated.
- Create `/home` route as a placeholder Home page.

#### Login UI
- Build a `LoginPage` with:
  - **Username input** (text)
  - **Password input** (password type)
  - **Login button** (primary)
  - **Reset button** (secondary)

#### Behaviors
- **Initial render**: focus on Username field.
- **Reset button**: clears username/password and any validation errors; returns focus to Username.
- **Login button**:
  - Client-side validation (required fields, trim username)
  - Disable button and show loading state during request
  - On success: store auth state (cookie-based session or token storage per backend) and navigate to `/home`
  - On failure: show generic error message (avoid user enumeration)

#### State management
- Add an `AuthContext` (or similar) that exposes:
  - `login(username, password)`
  - `logout()`
  - `isAuthenticated`
- Add a `ProtectedRoute` wrapper for `/home` redirecting to `/login` when unauthenticated.

#### Accessibility
- Proper `<label>` for inputs, `aria-invalid` and inline error messages.
- Tab order: Username → Password → Login → Reset.

#### Tests (FE)
- Component test:
  - Login page displays username, password, login, reset.
  - Reset clears both fields.
- E2E smoke (if available): visit app root redirects/shows login.

---

### 2) Backend

#### API Endpoints
- `POST /api/auth/login`
  - Request: `{ "username": "...", "password": "..." }`
  - Response (success): `200 OK` with session cookie **or** JWT token + user payload
  - Response (failure): `401 Unauthorized` with generic message

- `POST /api/auth/logout`
  - Invalidates session / token (where applicable)

- `GET /api/auth/me`
  - Returns currently authenticated user (supports FE bootstrapping)

#### Authentication logic
- Validate request payload.
- Look up user by username.
- Verify password hash.
- Apply rate limiting / throttling (recommended, even if not in AC1).

#### Error handling
- Use generic error messages for auth failures.
- Log auth failures for audit, but do not expose sensitive details.

#### Tests (BE)
- Unit tests:
  - Valid login returns 200.
  - Invalid login returns 401.
  - Missing fields returns 400.

---

### 3) Database

#### Schema
- `users`
  - `id` (pk)
  - `username` (unique, indexed)
  - `password_hash`
  - `created_at`, `updated_at`
  - Optional: `is_active`, `locked_until`, `failed_attempts`

#### Password storage
- Store passwords using a strong adaptive hash (bcrypt/argon2).
- Never store plaintext passwords.

#### Seed / Migration
- Add migration to create `users` table.
- Seed at least one test user for local dev.

---

## Delivery Checklist
- [ ] `/login` page renders with 2 fields + 2 buttons (AC1)
- [ ] Reset clears inputs
- [ ] Login calls backend and on success navigates to Home
- [ ] Basic error handling for invalid creds
- [ ] README updated with local run + seeded credentials

---

## Open Questions
1. Is this a web app (React) or another platform? Confirm framework.
2. Should authentication be **session-cookie** based or **JWT** based?
3. What is the desired behavior when user is already authenticated and visits `/login`?
4. Any specific password policy or account lockout rules?
