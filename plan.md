# Login Feature Implementation Plan (EPMCDMETST-57239)

## Goal
Implement username/password login for registered users so they can securely access the application and land on the Home page. Includes validation, success/failure flows, reset behavior, basic brute-force protection, error handling, and accessibility.

---

## Frontend

### Pages / Components
- **Login Page**
  - Username input (text)
  - Password input (password masked)
  - Login button
  - Reset button
  - Error banner / inline validation messages

### Behavior
- On load: show Login page when user is unauthenticated.
- Validation (client-side):
  - Username required
  - Password required
  - Trim leading/trailing whitespace for username (confirm rule; default: trim)
- Submit:
  - Pressing **Enter** triggers login
  - Disable Login button while request in-flight to prevent double submit
- Success:
  - Redirect to **Home** route (e.g., `/home`) after receiving auth success
- Failure:
  - Show generic error message: “Invalid username or password”
  - Do not indicate whether username exists
- Reset button:
  - Clears username + password fields
  - Clears validation and error messages
- Accessibility:
  - Proper labels for inputs
  - Tab order: Username → Password → Login → Reset
  - Focus management: on error, focus error banner or first invalid field

### API Integration
- POST `/api/auth/login` with `{ username, password }`
- Store auth state:
  - Prefer **HttpOnly secure session cookie** (recommended)
  - If token-based, store token in memory (avoid localStorage if possible)

---

## Backend

### Endpoints
- `POST /api/auth/login`
  - Input: username, password
  - Output (success):
    - Create session or issue JWT
    - Return 200 + user summary (optional)
  - Output (failure):
    - Return 401 with generic error message
- `POST /api/auth/logout` (recommended)
  - Clears session / invalidates token
- `GET /api/auth/me` (recommended)
  - Returns current authenticated user; supports UI bootstrapping

### Authentication Logic
- Verify user exists and is active
- Compare password using secure hash verify (e.g., bcrypt/argon2)
- Do not log plaintext password
- Return generic failure responses to prevent user enumeration

### Brute-force / Rate limiting (basic)
- Implement one of:
  - IP-based rate limiting on `/login`
  - Username+IP attempt tracking with cooldown
- Return 429 (Too Many Requests) after threshold; message: “Too many attempts. Try again later.”

### Error Handling
- Network/service issues: return 5xx with safe message
- Ensure consistent error contract for frontend

---

## Database

### Tables / Data
Assuming a `users` table exists. If not, create minimal:

- `users`
  - `id` (PK)
  - `username` (unique, indexed)
  - `password_hash`
  - `status` (ACTIVE/LOCKED/DISABLED) (optional)
  - `created_at`, `updated_at`

Optional for brute-force:
- `login_attempts`
  - `id`
  - `username` (nullable)
  - `ip_address`
  - `attempt_count`
  - `last_attempt_at`
  - `locked_until` (optional)

If using sessions:
- `sessions`
  - `id`
  - `user_id`
  - `created_at`
  - `expires_at`

---

## Testing

### Frontend tests
- Renders Login page with required fields/buttons
- Validation errors for empty fields
- Reset clears inputs and messages
- Successful login redirects to Home (mock API)
- Invalid credentials shows generic message

### Backend tests
- Valid credentials returns 200 and session/JWT
- Invalid credentials returns 401 generic message
- Rate limiting returns 429 after threshold
- Password hashing/verification behavior

---

## Non-functional Requirements
- TLS in production
- Password masking on UI
- No sensitive values in logs
- Response time targets: login < ~1s under normal conditions (tunable)
