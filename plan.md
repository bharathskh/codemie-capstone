# Plan: Login Page + Core Login Behaviors (AC1–AC7)

## Scope
Implement the login user story with acceptance criteria AC1–AC7:
- AC1: Login page UI renders Username, Password, Login, Reset
- AC2: Valid login authenticates user and redirects to Home
- AC3: Required field validation (no login attempt)
- AC4: Invalid credentials show generic error
- AC5: Reset clears inputs + errors + focuses Username
- AC6: Password is masked
- AC7: System/network error shows friendly message, stays on Login

> Note: Repo currently only contains `README.md`. This plan assumes we will add a minimal full-stack web app (frontend + backend) to satisfy the story.

---

## Frontend Implementation

### Pages / Views
1. **Login page (`/`)**
   - Fields:
     - Username `<input type="text" name="username" autocomplete="username">`
     - Password `<input type="password" name="password" autocomplete="current-password">` (AC6)
   - Buttons:
     - Login `<button type="submit">`
     - Reset `<button type="button">`

2. **Home page (`/home`)**
   - A simple page with a stable identifier for tests (e.g., `<h1>Home</h1>`).

### Client-side behavior
- **Validation (AC3)**
  - On Login click/submit:
    - If username empty: show inline error “Username is required”.
    - If password empty: show inline error “Password is required”.
    - Do **not** call backend when invalid.

- **Submit/Login (AC2/AC4/AC7)**
  - POST to backend endpoint (e.g., `POST /api/auth/login`) with JSON `{ username, password }`.
  - Handle responses:
    - `200`: store auth state (cookie-based session or JWT) and navigate to `/home`.
    - `401`: show generic error “Invalid username or password.”
    - `5xx` / network error: show “Login service unavailable. Please try again.” (AC7)

- **Reset (AC5)**
  - Clear username/password values.
  - Clear all validation/auth error messages.
  - Set focus to username input.

### Suggested structure
- `frontend/`
  - If React:
    - `src/pages/Login.tsx`, `src/pages/Home.tsx`
    - `src/api/client.ts`
    - `src/router.tsx`
  - If vanilla:
    - `public/index.html`, `public/home.html`, `public/app.js`, `public/styles.css`

### Testing (Frontend)
- Unit/integration tests:
  - AC1: elements exist
  - AC3: validation prevents API call
  - AC5: reset clears + focus
  - AC4/AC7: error messages render for 401 and 5xx

---

## Backend Implementation

### Endpoints
1. `POST /api/auth/login`
   - Request: `{ "username": "...", "password": "..." }`
   - Responses:
     - `200 OK`: `{ "ok": true }` and set session cookie (or return JWT)
     - `401 Unauthorized`: `{ "ok": false, "message": "Invalid username or password" }` (generic)
     - `500 Internal Server Error`: `{ "ok": false, "message": "Service unavailable" }`

2. `GET /api/auth/me` (optional but useful)
   - Returns authenticated user info if session valid.

3. Static serving for frontend routes (or separate dev server).

### Auth approach
- Prefer **cookie-based session** for simplicity:
  - `express-session` with secure cookie settings (in production)
  - Store `req.session.userId` on successful login

### Security basics
- Never log raw passwords.
- Add basic hardening headers (Helmet).
- Use environment variables for secrets (session secret).

### Error handling
- Centralized error middleware returns friendly message for unexpected failures (AC7).

### Testing (Backend)
- Tests for:
  - `200` with correct credentials
  - `401` with wrong credentials
  - `400` when payload missing username/password

---

## Database Implementation

### Minimal model
For a real “registered user” system, add a users table.

**Table: `users`**
- `id` (uuid / int, PK)
- `username` (unique)
- `password_hash` (bcrypt)
- `created_at`

### Seed / demo user
- Create a seed script creating a demo user.
- Credentials should be configured via env or seed only (not hardcoded in source).

### Storage choice
- For dev: SQLite
- For prod: Postgres

### Migration strategy
- Use migrations via Prisma or Knex.

---

## State / Flow Mapping to ACs
- Initial route loads Login page (AC1)
- Submit:
  - invalid fields → inline errors (AC3)
  - valid creds → session set and navigate home (AC2)
  - invalid creds → generic error (AC4)
  - server/network failure → friendly error, stay on login (AC7)
- Reset clears state and focuses username (AC5)

---

## Deliverables
- `plan.md` (this document)
- Frontend implementation (login + home)
- Backend implementation (auth endpoints)
- Database schema + migration/seed
- Automated tests

---

## Open Questions / Decisions Needed
- Framework choice (React vs vanilla) and backend runtime (Node/Express suggested).
- Authentication mechanism (session vs JWT).
- Whether `/home` should be protected by backend auth middleware.
