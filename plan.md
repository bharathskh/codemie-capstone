# Login (Username/Password) – Implementation Plan

## Goal
Implement a secure login experience for registered users so they can authenticate with **username + password** and access the **Home** page. This plan supports the enhanced acceptance criteria (AC1–AC8): login screen, validations, reset behavior, success/failure flows, session handling, route protection, and baseline security.

---

## Frontend (Web)

### 1) Pages & Routing
- **Route**: `/login`
  - Displays login form with:
    - Username input
    - Password input (masked)
    - **Login** button
    - **Reset** button
- **Route**: `/home`
  - Protected route; accessible only when authenticated.
- **Unauthenticated redirect**
  - If user navigates to protected routes without an active session, redirect to `/login`.

### 2) Login Form Behavior
- **Client-side validation**
  - Required fields: username, password.
  - Trim username (optional); never trim password.
  - Disable Login button while request is in-flight.
- **Reset button**
  - Clears username + password fields.
  - Clears validation errors and any server error message.
  - Returns focus to username field.
- **Error display**
  - Show inline field errors for empty/invalid inputs.
  - Show a form-level error on authentication failure:
    - Use a generic message: `Invalid username or password.`
- **Success flow**
  - On successful login, navigate to `/home`.

### 3) Auth State Management
- Prefer **HttpOnly cookie** session/JWT to avoid exposing tokens to JavaScript.
- Maintain lightweight client state:
  - `isAuthenticated` derived from `/me` endpoint or presence of session cookie + successful `/me` fetch.
- App initialization:
  - Call `/api/auth/me` to hydrate auth state.

### 4) Accessibility & UX
- Proper `<label>` for inputs.
- Keyboard navigation and visible focus.
- Password field uses `type="password"`.
- Announce form error via `aria-live="polite"` region.

### 5) Frontend Testing
- Unit tests for form validation and reset behavior.
- E2E tests:
  - `/login` renders required fields/buttons.
  - Successful login redirects to `/home`.
  - Failed login shows generic error.
  - Reset clears fields.
  - Protected route redirects unauthenticated users.

---

## Backend (API)

### 1) Endpoints
Implement under `/api/auth`:

1. `POST /api/auth/login`
   - Request body:
     ```json
     {"username": "string", "password": "string"}
     ```
   - Responses:
     - `200 OK` sets secure auth cookie and returns minimal user payload
     - `401 Unauthorized` for invalid credentials (generic)
     - `400 Bad Request` for missing fields

2. `POST /api/auth/logout`
   - Clears auth cookie/session.
   - `204 No Content`

3. `GET /api/auth/me`
   - Returns authenticated user profile info if logged in.
   - `200 OK` with user info, or `401 Unauthorized`.

### 2) Authentication & Security
- Password storage: **bcrypt/argon2** hash in DB.
- Compare password with constant-time comparison (provided by library).
- Cookies:
  - `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict` if feasible)
  - Reasonable expiration.
- Rate limiting:
  - Apply per-IP and/or per-username throttling on login endpoint.
- Logging/monitoring:
  - Log authentication failures without storing passwords.
  - Include correlation/request IDs.

### 3) Authorization Middleware
- Middleware/guard checks session/JWT on protected endpoints.
- Return `401` when missing/invalid session.

### 4) Backend Testing
- Unit tests for:
  - Valid login
  - Invalid login returns 401
  - Missing fields returns 400
- Integration tests for cookie/session handling.

---

## Database

### 1) Users Table
Minimum fields:
- `id` (uuid/int, PK)
- `username` (unique, indexed)
- `password_hash`
- `created_at`, `updated_at`
- (Optional) `is_active`, `last_login_at`, `failed_login_count`, `locked_until`

### 2) Sessions (If using server sessions)
If choosing server-side sessions over JWT:
- `sessions` table:
  - `id` (session id)
  - `user_id` (FK)
  - `expires_at`
  - `created_at`
  - `revoked_at` (optional)

---

## Suggested Tech Stack

### Option A (Recommended, lightweight)
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + NestJS (or Express/Fastify)
- **DB**: PostgreSQL
- **ORM**: Prisma
- **Auth**: Cookie-based JWT (HttpOnly) or server sessions
- **Testing**:
  - Frontend unit: Vitest + React Testing Library
  - E2E: Playwright
  - Backend: Jest + Supertest

### Option B (Enterprise Java)
- **Frontend**: React/Angular
- **Backend**: Spring Boot + Spring Security
- **DB**: PostgreSQL
- **Testing**: JUnit + Testcontainers; Playwright/Cypress

---

## Delivery Checklist
- [ ] `/login` UI meets AC1 (fields + buttons)
- [ ] Reset behavior implemented
- [ ] Validations + error messages implemented
- [ ] Backend login/logout/me endpoints implemented
- [ ] Secure cookie/session configured
- [ ] Route guarding for `/home`
- [ ] Unit + E2E tests added
- [ ] Basic rate limiting & safe logging
