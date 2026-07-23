# Plan: User Login (Username/Password) — Display Login Page (AC1)

## Story
As a registered user, I want to log into the application using my username and password, so that I can securely access the application and view the Home page.

## Acceptance Criteria in scope
**AC1 – Display Login Page**
- Given the user launches the application
- When the application loads
- Then the Login page should be displayed with:
  - Username field
  - Password field
  - Login button
  - Reset button

> Note: This plan focuses on AC1 (UI display). It also outlines the minimal backend/session pieces typically required to support the overall story (login -> home) so implementation can be extended without rework.

---

## Implementation Plan

### 1) Frontend

#### 1.1 Routing / App bootstrap
- Ensure the application entry route loads the **Login page** when the user is not authenticated.
- If a router exists, add/confirm a route such as:
  - `/login` -> `LoginPage`
  - `/` -> redirect to `/login` if not authenticated; otherwise redirect to `/home`

#### 1.2 Login Page UI
Create a `LoginPage` view/component that renders:
- **Username** input
  - type: `text`
  - label: "Username"
  - name/id: `username`
  - autocomplete: `username`
- **Password** input
  - type: `password`
  - label: "Password"
  - name/id: `password`
  - autocomplete: `current-password`
- **Login** button
  - primary action
  - type: `submit`
- **Reset** button
  - secondary action
  - clears username and password fields

#### 1.3 Form behavior (minimal for AC1)
- Inputs should be controlled (state-managed) so Reset can clear them.
- Implement `onSubmit` handler stub (even if backend not yet built):
  - Prevent default submit
  - (Optional now) basic required-field validation
  - Call auth API when available

#### 1.4 Accessibility & UX
- Ensure `label` is associated to inputs (`for`/`id`)
- Keyboard navigation works (Tab order: Username -> Password -> Login -> Reset)
- Enter key on password submits form
- Provide basic focus management (focus username on load)

#### 1.5 Styling
- Use existing design system/components if present; otherwise minimal CSS:
  - centered card/container
  - consistent spacing
  - button group alignment

---

### 2) Backend (recommended minimal endpoints for the full story)

Even though AC1 is UI-only, aligning with the story requires authentication support. Implementing these now (or stubbing contract) reduces future rework.

#### 2.1 API contracts
- `POST /api/auth/login`
  - Request: `{ "username": string, "password": string }`
  - Response (200): `{ "token": string, "user": { "id": string, "username": string } }`
  - Response (401): `{ "error": "Invalid username or password" }`

- `POST /api/auth/logout`
  - Clears session/token (server-side session or instruct client to discard token)

- `GET /api/auth/me`
  - Returns current user if session/token valid

#### 2.2 Security
- Use HTTPS/TLS
- Hash passwords (bcrypt/argon2)
- Do not log credentials
- Use secure cookie (HttpOnly, Secure, SameSite) if cookie-based auth
- Add rate-limiting to login endpoint

---

### 3) Database (recommended minimal schema)

#### 3.1 Users table
- `users`
  - `id` (uuid / bigint)
  - `username` (unique, indexed)
  - `password_hash`
  - `created_at`, `updated_at`
  - optional: `is_active`, `last_login_at`

#### 3.2 Sessions / refresh tokens (if applicable)
- If using refresh tokens or server sessions:
  - `user_sessions` / `refresh_tokens`
    - `id`
    - `user_id` (fk)
    - `token_hash`
    - `expires_at`
    - `created_at`

---

## Work Breakdown (tasks)

### Frontend
1. Add/confirm route to load `LoginPage` on app launch.
2. Implement `LoginPage` component with username/password fields + Login/Reset buttons.
3. Implement Reset button to clear fields.
4. Add basic accessibility (labels, keyboard submit).
5. Add minimal unit/component test (snapshot or DOM assertion) verifying required elements exist.

### Backend (optional for AC1, required for full story)
6. Create login endpoint (validate credentials, return token).
7. Add `me` endpoint for session validation.
8. Add logout endpoint.
9. Add rate limiting and secure session/token handling.

### Database
10. Create migration for `users` table.
11. Seed a test user (for dev only).

---

## Testing Strategy

### UI tests (AC1)
- On application load, Login page is displayed.
- The page contains:
  - Username field
  - Password field
  - Login button
  - Reset button

### Additional recommended tests (future ACs)
- Reset clears both fields.
- Login with valid credentials routes to Home.
- Login with invalid credentials shows generic error.

---

## Deliverables
- `plan.md` (this document)
- (Future) Login page implementation + tests
- (Future) Auth API + DB migrations
