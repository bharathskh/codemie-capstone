# Plan — Login (EPMCDMETST-56727)

## Goal
Implement user login with username/password so a registered user can securely authenticate and access the Home page. Provide login UI, backend authentication endpoint, session handling, and basic security measures.

> Note: This repo currently contains only `README.md`; this plan assumes we will add the necessary application skeleton or integrate into an existing app when available.

---

## Scope & Acceptance Criteria Mapping
- **AC1 Display Login Page**: Username + Password inputs, Login and Reset buttons.
- **AC2 Successful Login**: Valid credentials authenticate and redirect to Home; session established.
- **AC3 Invalid Credentials**: Generic error, remain on login.
- **AC4 Required Field Validation**: Client/server validation.
- **AC5 Reset Button**: Clear fields + errors.
- **AC6 Brute force protection**: Rate limiting / lockout policy.
- **AC7 Already Authenticated**: Visiting `/login` redirects to Home.
- **AC8 Keyboard/Accessibility**: Labels, tab order, Enter submits.

---

## Frontend Implementation Plan
### Pages/Routes
- **`/login`**: public route.
- **`/` (Home)**: protected route (requires authenticated session).

### Components
- `LoginForm`
  - Inputs: `username`, `password` (type=password).
  - Buttons:
    - **Login**: submits form
    - **Reset**: clears inputs + validation + server error; focus username
  - Validation:
    - required fields
    - max length constraints (e.g., 150) to prevent abuse
  - UX:
    - Pressing **Enter** submits
    - Disable Login while request in-flight
    - Show generic error banner/text for invalid creds

### Auth State
- On successful login, store auth state via **cookie-based session** (preferred) or token.
- Add an `AuthContext` (or equivalent) and `useAuth()` hook to:
  - check session (`GET /api/auth/me`) on app load
  - protect routes (redirect to `/login` if not authenticated)
  - redirect `/login` → `/` if already authenticated

### API Integration
- `POST /api/auth/login` with `{ username, password }`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Accessibility
- Label elements tied to inputs (`htmlFor`/`id`).
- Error message announced (e.g., `aria-live="polite"`).
- Maintain logical tab order.

---

## Backend Implementation Plan
### Endpoints
1. **POST `/api/auth/login`**
   - Validate body schema
   - Authenticate user
   - On success: establish session (Set-Cookie) and return minimal user profile
   - On failure: return `401` with generic message

2. **GET `/api/auth/me`**
   - Validate session
   - Return current user identity (id, username, displayName, roles)

3. **POST `/api/auth/logout`**
   - Invalidate session (server-side) and clear cookie

### Authentication Logic
- Fetch user by username.
- Verify password using strong hashing:
  - **bcrypt/argon2** (argon2 preferred)
- Ensure constant-time comparisons.
- Do not log passwords.

### Session Management (recommended)
- Cookie-based sessions:
  - `HttpOnly`, `Secure`, `SameSite=Lax` (or Strict depending on app)
  - Server-side session store (Redis) or signed cookie session depending on scale
- CSRF:
  - If same-site cookie session, CSRF risk reduced, but for state-changing endpoints consider CSRF token if cross-site usage is expected.

### Security Controls
- Rate limiting on login endpoint (per IP + per username):
  - e.g., 5 attempts / 5 minutes, exponential backoff or temporary lock
- Optional account lock after threshold; if implemented, keep error message generic.
- Input length limits and request body size limits.

### Observability
- Audit logs for login success/failure (without sensitive data):
  - timestamp, username (or hash), IP, userAgent, result

---

## Database Implementation Plan
### Tables (example)
1. **users**
   - `id` (uuid / bigserial)
   - `username` (unique, indexed)
   - `password_hash`
   - `status` (active/locked/disabled)
   - `created_at`, `updated_at`

2. **sessions** (if server-side sessions)
   - `id` (session id)
   - `user_id` (fk)
   - `created_at`, `expires_at`
   - `ip`, `user_agent` (optional)

3. **login_attempts** (optional, if not using middleware/redis)
   - `id`
   - `username`
   - `ip`
   - `attempted_at`
   - `success` boolean

### Migrations
- Add migration scripts to create the tables and indexes.
- Seed script for creating a test user in non-prod.

---

## Testing Plan
### Frontend
- Unit tests for `LoginForm` validation and reset behavior.
- Integration tests for redirect behavior:
  - unauthenticated → `/login`
  - authenticated visiting `/login` → `/`

### Backend
- Unit tests:
  - password verification
  - login endpoint responses (200/401/400)
- Integration tests:
  - successful session establishment
  - rate limiting behavior

### E2E
- Login happy path → Home visible
- Invalid credentials → error
- Empty fields → validation

---

## Rollout / Configuration
- Environment variables:
  - session secret
  - DB connection
  - Redis connection (if used)
  - rate limit thresholds
- Ensure TLS in production.

---

## Deliverables
- Login page UI with required controls
- Auth APIs (`login`, `me`, `logout`)
- Session handling and protected route behavior
- Basic rate limiting / brute force mitigation
- Tests + documentation
