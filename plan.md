# EPMCDMETST-57521 — Login: authentication flow, validation, and secure UX

## Goal
Implement login capability for registered users using username + password so they can securely access the application and view the Home page.

## Scope
### In scope
- Login page UI: username, password, Login, Reset
- Client-side required-field validation
- Submit login to an authentication endpoint
- Handle success (authenticated) and route to Home
- Handle failure (invalid credentials) with generic error messaging
- Password masking by default
- Reset clears fields and clears validation/error messages
- Basic accessibility + keyboard support (labels, tab order, Enter submits)

### Out of scope / follow-ups (unless product confirms)
- Account lockout / captcha / rate limiting policies
- Remember-me functionality
- Forgot password / reset password flows
- Multi-factor authentication

## Acceptance Criteria mapping
- **AC1** Display Login Page (fields + buttons)
- **AC2** Successful login redirects to Home
- **AC3** Invalid credentials stays on Login and shows generic error
- **AC4** Required-field validation prevents submit
- **AC5** Password masked by default
- **AC6** Reset clears fields + messages
- **AC7** Accessibility/keyboard support

## Implementation plan

### 1) Frontend
1. Create/extend `Login` page component:
   - Username input (with visible label)
   - Password input (`type="password"`)
   - Login button
   - Reset button
2. Form behavior:
   - Validate required fields (username, password)
   - On submit:
     - show loading/submitting state
     - call auth API `POST /api/auth/login` (or project equivalent)
     - on **200**: persist auth state (token/cookie) and navigate to Home
     - on **401**: show generic error: `Invalid username or password`
3. Reset button:
   - clears username/password
   - clears validation + API error messages
   - optionally returns focus to username field
4. Accessibility:
   - `<label for>` associations or equivalent
   - sensible tab order: username → password → login → reset
   - Enter key submits (especially when focused in password field)

### 2) Backend
1. Confirm/implement authentication endpoint:
   - `POST /api/auth/login`
   - request body: `{ "username": string, "password": string }`
   - responses:
     - `200 OK` on success (session cookie or JWT + minimal profile)
     - `401 Unauthorized` on invalid credentials (generic message)
     - `400/422` on missing/invalid payload
2. Security:
   - do not reveal whether username exists (generic error)
   - never log raw passwords
   - ensure password verification uses constant-time comparison and secure hashing (bcrypt/argon2)

### 3) Database (only if no existing identity store)
- Add `users` table with unique username + password hash
- Index on username
- Store only salted hashes (bcrypt/argon2)

## Testing plan
### Frontend
- Render test: username/password inputs + login/reset buttons present
- Validation tests:
  - empty username/password shows messages and blocks submit
- Reset test:
  - after entering values and/or triggering errors, Reset clears fields/messages
- Auth flow tests (mock API):
  - 200 redirects to Home
  - 401 shows generic error and stays on Login

### Backend
- Unit/integration tests:
  - success returns 200
  - invalid credentials returns 401 with generic error
  - missing fields returns 400/422

## Assumptions
- Registered users already exist and have credentials stored securely.
- Home page requires authentication.
- Transport security (HTTPS) is provided by the hosting environment.

## Notes / Decisions to confirm
- Session strategy: JWT vs HttpOnly session cookies (prefer cookies if browser-only app).
- API base path and error format should follow existing project conventions.
