# plan.md — EPMCDMETST-57561: Login page UI (display only)

## Goal
Implement the UI so that when the application launches, a Login page is displayed containing:
- Username input
- Password input
- Login button
- Reset button

Note: Authentication behavior and navigation are explicitly out of scope for this story.

---

## Front-end implementation

### UI/Route
- Create a `/login` route (or dedicated Login screen) and make it the default/initial route when the app launches.
- Add a `LoginPage` component/screen.

### Components
- Username input:
  - text input with label "Username"
  - test id / data-testid for automation (e.g., `username-input`)
- Password input:
  - password-masked input with label "Password"
  - test id (e.g., `password-input`)
- Buttons:
  - `Login` button
  - `Reset` button

### State handling (minimal)
- Keep local component state for username/password (optional but recommended for future stories).
- For this story:
  - `Login` click: no-op (ensure it doesn’t crash).
  - `Reset` click: no-op.

### Styling & layout
- Basic responsive layout:
  - centered login card/container
  - consistent spacing and alignment
- Ensure password field uses password-masked input.

### Testing (front-end)
- Unit/component tests:
  - renders username input, password input, login button, reset button
  - renders on app start / default route

---

## Back-end implementation
- No backend changes required for this story (UI display only).

## Database implementation
- No database changes required for this story.

---

## Deliverables
- Login page/screen added and reachable as default entry point on launch
- Automated tests verifying presence of required UI controls

---

## Out of scope (explicit)
- Authenticate credentials
- Error messages for invalid login
- Session/token storage
- Navigation to Home on success
- Lockout/rate limiting/audit logging
- Detailed reset behavior and form validation
