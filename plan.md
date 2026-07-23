# Plan: Login Page (Username/Password) — AC1 Display Login Page

## Scope
Implement **AC1 – Display Login Page**:
- On application load, show a **Login page** with:
  - Username field
  - Password field
  - Login button
  - Reset button

> Note: This plan focuses on UI display (AC1). Authentication behavior (API calls, sessions, redirects) is referenced for completeness but can be implemented in later stories.

---

## Frontend Implementation

### 1) Routing / App Entry
- Make the Login page the default route on app load.
  - SPA (React Router): `/` renders `<LoginPage />`.
  - Next.js:
    - `app/page.tsx` renders login, or
    - `pages/index.tsx` renders login.

### 2) Login Page UI
Create a `LoginPage` view/component with:
- **Username input**
  - `type="text"`
  - `name="username"`
  - `autocomplete="username"`
  - Visible label (not placeholder-only)
- **Password input**
  - `type="password"`
  - `name="password"`
  - `autocomplete="current-password"`
  - Visible label
- **Login button**
  - `type="submit"`
  - Primary style
- **Reset button**
  - `type="button"` (or `reset` if using HTML form reset)
  - Clears fields to empty

### 3) State Management
- Use local component state (e.g., `useState`) for `username` and `password`.
- Implement `onChange` handlers for both fields.

### 4) Reset Behavior (AC1 minimum)
- Clicking **Reset** clears:
  - username field
  - password field
- Also clears client-side validation messages if present (optional for AC1, but recommended).

### 5) Basic Accessibility
- Ensure `label` is associated with input via `htmlFor`/`id`.
- Ensure tab order is natural.
- Buttons should be focusable and have discernible text.

### 6) Styling
- Use existing styling system if present.
- If none exists, use a minimal, consistent layout:
  - Centered card/panel
  - Adequate spacing
  - Mobile-friendly width

### 7) Frontend Tests (recommended)
Using React Testing Library (or framework equivalent):
- When app loads, login page renders
- Username input is present
- Password input is present and uses `type=password`
- Login button is present
- Reset button is present
- Reset clears both fields

---

## Backend Implementation (Not Required for AC1, placeholder)

If future ACs include actual login:

### API Endpoint
- `POST /api/auth/login`
  - Request: `{ username: string, password: string }`
  - Response (example): `{ token: string, user: { id, username, ... } }`

### Security
- Rate limit login endpoint
- Use secure password hashing (bcrypt/argon2)
- Do not reveal whether username exists in error messages

---

## Database (Not Required for AC1, placeholder)

If future ACs include persisted registered users:

### Table: `users`
- `id` (uuid / serial)
- `username` (unique, indexed)
- `password_hash`
- `created_at`, `updated_at`

---

## Delivery Checklist
- [ ] Login page is the default view on application load
- [ ] Username field rendered
- [ ] Password field rendered (masked)
- [ ] Login button rendered
- [ ] Reset button rendered and clears inputs
- [ ] Basic accessibility labels present
- [ ] Unit/UI tests added (if test framework exists)
