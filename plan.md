# plan.md — EPMCDMETST-55871 (Login: complete auth + validation + security)

## 1. Goal / Scope
Deliver a production-oriented login capability for registered users that:
- Shows the Login page (AC1) and supports login success/failure flows.
- Validates inputs on both client and server.
- Establishes a secure authenticated session and supports logout.
- Adds security controls (rate limiting, secure headers, password handling, logging hygiene).
- Is accessible and testable (UI + API + e2e).

> Note: The current `main` branch only contains `README.md`. This plan assumes we will implement a minimal full-stack app in this repository (Node/Express + vanilla web UI) unless product direction changes.

---

## 2. Architecture Overview
### 2.1 Frontend
- Static assets served from backend (or from a `public/` folder).
- Login page:
  - Username input
  - Password input
  - Login button
  - Reset button
  - Inline validation + accessible error messaging.
- Home page:
  - Displays a simple authenticated landing view.
  - Logout button.
- Session awareness:
  - On load, call `GET /api/me` to determine authenticated state and route accordingly.

### 2.2 Backend
- Node.js + Express application.
- Endpoints:
  - `POST /api/login` — authenticate credentials, create session.
  - `POST /api/logout` — destroy session.
  - `GET /api/me` — returns authenticated user info.
- Middleware:
  - Session middleware (cookie-based session id).
  - Validation middleware.
  - Rate limiting for login attempts.
  - Security headers (Helmet) and CORS policy.
  - Centralized error handler.

### 2.3 Database
- Use PostgreSQL (recommended for production) with a `users` table.
- Passwords stored as strong hashes (bcrypt/argon2).
- Optional: login attempts/audit table (if required by acceptance criteria).

---

## 3. Implementation Plan

## 3.1 Backend Implementation
### 3.1.1 Project setup
- Add `package.json` with scripts:
  - `dev`: run server with nodemon
  - `start`: production server
  - `test`: unit/integration tests
  - `test:e2e`: Playwright
- Dependencies (suggested):
  - `express`, `helmet`, `cookie-parser`
  - `express-session` + `connect-pg-simple` (store sessions in Postgres)
  - `bcrypt` (or `argon2`)
  - `zod` (request validation)
  - `express-rate-limit`
  - `dotenv`

### 3.1.2 Auth flows
- `POST /api/login`
  - Validate request body: `{ username: string, password: string }`.
  - Normalize username (trim; consistent casing policy).
  - Look up user by username/email.
  - Compare password hash.
  - On success: establish server session and return `{ ok: true }`.
  - On failure: return `401` with generic message (avoid user enumeration).
  - Log failures in a safe way (no password logging).

- `GET /api/me`
  - If session exists: return `{ authenticated: true, user: { id, username } }`.
  - Else: `{ authenticated: false }`.

- `POST /api/logout`
  - Destroy session and clear cookie.

### 3.1.3 Security
- Enable Helmet with a sensible CSP for static assets.
- Set secure session cookies:
  - `httpOnly: true`, `sameSite: 'lax'` (or `strict` if feasible), `secure` in production.
- Rate limiting:
  - Apply strict rate limit to `POST /api/login` (e.g., 5 attempts / 15 minutes per IP + optional username keying).
- CSRF:
  - If using cookie-based auth for state-changing requests beyond login/logout, implement CSRF (for this scope, login/logout may be acceptable with SameSite=Lax; confirm policy).
- Avoid hardcoded demo credentials in logs/code.

### 3.1.4 Error handling & observability
- Central error middleware that:
  - Returns structured JSON error.
  - Avoids leaking stack traces in production.
- Add minimal request logging (without secrets).

---

## 3.2 Database Implementation
### 3.2.1 Schema
- `users` table:
  - `id` (uuid, pk)
  - `username` (text, unique, not null)
  - `password_hash` (text, not null)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

- Optional `audit_login_events`:
  - `id` (uuid)
  - `user_id` (nullable)
  - `username_attempted` (text)
  - `success` (boolean)
  - `ip` (text)
  - `created_at` (timestamp)

### 3.2.2 Migrations & seed
- Use `node-pg-migrate` or `knex` migrations.
- Provide a dev seed user (configured through env vars) with hashed password.

---

## 3.3 Frontend Implementation
### 3.3.1 Pages & routing
- `GET /`:
  - If authenticated -> redirect to `/home`
  - Else -> serve login page
- `GET /home`:
  - If authenticated -> show home page
  - Else -> redirect to `/`

### 3.3.2 Login UI (AC1)
- Username input (with label, required).
- Password input (type=password, label, required).
- Login button.
- Reset button clears fields and errors.

### 3.3.3 Client validation & UX
- Disable Login until required fields are filled (optional).
- On submit:
  - Show inline error summary with aria-live.
  - Handle 401 with “Invalid username or password”.
  - Handle 429 with “Too many attempts, try again later.”

### 3.3.4 Accessibility
- Ensure labels are properly bound.
- Keyboard navigation.
- Error messages linked to inputs.

---

## 3.4 Testing Plan
### 3.4.1 Unit/Integration
- Backend tests:
  - Login success returns 200 and sets session.
  - Login failure returns 401.
  - Rate limit returns 429.
  - `/api/me` returns authenticated state.

### 3.4.2 E2E (Playwright)
- AC1: login page renders with required fields/buttons.
- Successful login takes user to Home.
- Invalid login stays on login and shows accessible error.
- Reset clears form.
- Logout returns to login.

---

## 4. Deliverables
- `plan.md` (this document)
- Backend: Express server + auth endpoints
- Frontend: login + home pages
- DB migrations + seed
- Tests (unit + e2e)
- README updates with local run instructions

---

## 5. Rollout Notes
- Configure env vars:
  - `DATABASE_URL`
  - `SESSION_SECRET`
  - `NODE_ENV`
  - Optional seed user: `SEED_USERNAME`, `SEED_PASSWORD`
- Production:
  - enforce HTTPS
  - set `secure` cookies
  - consider WAF / global rate limiting
