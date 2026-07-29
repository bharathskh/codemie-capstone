# Login (Username/Password) – Implementation Plan

## Goal
Implement a secure login flow for registered users so they can authenticate with **username + password** and access the **Home** page.

This plan covers:
- UI for **Login page** (AC1)
- Authentication API + session handling
- Authorization (protect Home)
- Database schema for users/sessions
- Security controls + testing

---

## User Story
As a registered user, I want to log into the application using my username and password, so that I can securely access the application and view the Home page.

## Acceptance Criteria (provided)
**AC1 – Display Login Page**
- Given the user launches the application
- When the application loads
- Then the Login page should be displayed with:
  - Username field
  - Password field
  - Login button
  - Reset button

## Additional Acceptance Criteria (recommended to complete story)
These are strongly recommended to fully meet the user story (secure access + Home):

- **AC2 – Successful Login**: Valid credentials authenticate the user and redirect to Home.
- **AC3 – Invalid Credentials**: Invalid credentials show a generic error and remain on Login.
- **AC4 – Required Field Validation**: Username/password required; client+server validation.
- **AC5 – Reset Behavior**: Clears inputs + errors and focuses Username.
- **AC6 – Protected Home**: Unauthenticated users attempting to access Home are redirected to Login.
- **AC7 – Throttling**: Basic brute-force protection on login endpoint.
- **AC8 – Resilience**: Network/server failures show safe error messaging.
- **AC9 – Accessibility**: Labels, keyboard navigation, Enter-to-submit, password masking.

---

## Proposed Architecture

### High-level
- **Frontend** renders Login UI, performs basic client validation, calls backend auth endpoint.
- **Backend** validates input, verifies password hash, establishes a secure session (recommended: **httpOnly cookie** session).
- **Database** stores users (password hashes) and optionally sessions (or use Redis).

### Auth model (recommended)
- **Server-side session** stored in DB/Redis + **Secure httpOnly cookie**.
  - Pros: avoids token storage risks in browser, simpler CSRF controls with SameSite + CSRF token if needed.

---

## Frontend Design

### Routes / Pages
- `/login`
  - Controls: Username (text), Password (password), Login (submit), Reset (button)
  - Behavior:
    - Required validation before submit
    - Pressing **Enter** submits
    - Display generic auth error on 401
    - Display safe server error on 5xx/network
    - Reset clears fields + errors; focus returns to Username

- `/home` (protected)
  - If not authenticated: redirect to `/login`
  - Should display some logged-in indicator (e.g., username)

### UI/UX and Accessibility
- `<label>` associated with each input
- Tab order: Username → Password → Login → Reset
- Password masked
- Error messages announced (ARIA `role="alert"` where appropriate)

### Frontend API integration
- `POST /api/auth/login` with JSON: `{ "username": "...", "password": "..." }`
- On success:
  - If cookie session: backend sets cookie; frontend redirects to `/home`.
  - Optionally call `GET /api/auth/me` to hydrate user state.

---

## Backend Design

### Endpoints
1. `POST /api/auth/login`
   - Validates body
   - Looks up user by username
   - Verifies password (Argon2id/bcrypt)
   - Creates server session and sets secure cookie
   - Returns `200 OK` with minimal user info (optional), e.g. `{ id, username }`

2. `POST /api/auth/logout`
   - Invalidates session and clears cookie
   - Returns `204 No Content`

3. `GET /api/auth/me`
   - Returns authenticated user basic details
   - Returns `401` if not authenticated

### Validation rules
- username: required, trim whitespace, length constraints (e.g., 3–50)
- password: required, length constraints (e.g., 8–128)

### Error responses (REST)
- `400 Bad Request`: validation errors
- `401 Unauthorized`: invalid credentials (generic message)
- `429 Too Many Requests`: throttled
- `500 Internal Server Error`: unexpected failures (no sensitive details)

### Security controls
- Password storage: **Argon2id** (preferred) or bcrypt (strong cost)
- Prevent user enumeration: same generic message for username-not-found vs wrong password
- Rate limit login endpoint (IP and/or username)
- Cookie flags: `httpOnly`, `secure`, `sameSite=Lax` (or Strict)
- Avoid logging secrets; never log passwords

### Authorization
- Middleware/guard checks session for protected endpoints and Home route.

---

## Database Design

### Tables
#### `users`
- `id` (uuid/bigint, PK)
- `username` (unique, indexed)
- `password_hash` (text)
- `status` (optional: active/locked/disabled)
- `created_at`, `updated_at`

#### `sessions` (if DB-backed sessions)
- `id` (random session id, PK)
- `user_id` (FK → users.id, indexed)
- `created_at`
- `expires_at` (indexed)
- `last_seen_at`

### Indexing
- `users(username)` unique index
- `sessions(user_id)` index
- `sessions(expires_at)` index for cleanup

### Migrations/seed
- Migration to create tables + constraints
- Seed script for dev (create one test user with hashed password)

---

## Testing Plan

### Frontend
- Unit/component tests:
  - Renders all AC1 controls
  - Reset clears inputs and errors
  - Client-side required validation
- E2E:
  - Successful login redirects to Home
  - Invalid credentials show generic error
  - Direct `/home` access redirects to `/login`

### Backend
- Unit tests:
  - password verification
  - validation
- Integration tests:
  - login success creates session cookie
  - invalid credentials returns 401
  - throttling returns 429

---

## Recommended Technology Stack (suggested)
Option A (fastest for web):
- Frontend: React + TypeScript
- Backend: Node.js + TypeScript (Express/NestJS)
- DB: PostgreSQL
- ORM: Prisma
- Auth: Argon2id + server sessions (Redis/DB)
- Testing: Vitest/Jest + Supertest; Playwright for E2E

Option B (enterprise):
- Frontend: Angular
- Backend: Spring Boot + Spring Security
- DB: PostgreSQL

---

## Delivery Checklist
- [ ] Login page UI meets AC1
- [ ] Required validations
- [ ] Successful login redirects to Home
- [ ] Invalid login shows generic error
- [ ] Home is protected (unauthenticated redirect)
- [ ] Secure session management
- [ ] Rate limiting/throttling
- [ ] Migrations + seed user
- [ ] Tests implemented and passing
