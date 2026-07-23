# Plan: User Login Page (AC1)

## Scope
Implement the Login page UI that is displayed when the application loads.

**Acceptance Criteria (AC1)**
- On application load, show Login page containing:
  - Username field
  - Password field
  - Login button
  - Reset button

> Note: Authentication behavior (successful/failed login, routing to Home, API integration) is not included in AC1 and should be covered by subsequent stories/ACs.

---

## Implementation Plan

### Front End

#### 1) Add/Login Route & Initial Render
- Ensure the application entry route renders the Login page by default.
  - If routing exists, set `/login` as the default route or redirect `/` -> `/login`.
  - If no routing exists, render `LoginPage` as the initial component.

#### 2) Create `LoginPage` UI
- Create a `LoginPage` component with:
  - **Username** input (`type="text"`, label, placeholder optional)
  - **Password** input (`type="password"`)
  - **Login** button (`type="submit"`)
  - **Reset** button (`type="reset"`)

#### 3) Form State & Reset Behavior
- Use a controlled form (state) or native form reset behavior.
- Reset button should clear:
  - Username field
  - Password field
  - Any inline errors (if present in the UI)

#### 4) Basic UX/Accessibility
- Provide labels associated with inputs (`<label for>` or aria-label).
- Tab order: Username -> Password -> Login -> Reset.
- Autofocus on Username field (optional but recommended).

#### 5) Styling
- Add minimal styling to align inputs and buttons.
- Ensure password field is masked.

---

### Back End

AC1 does not require backend work. However, to prepare for future login functionality:

- Define an authentication endpoint contract (to be implemented later):
  - `POST /api/auth/login`
    - Request: `{ "username": string, "password": string }`
    - Response: 200 with session/token, or 401 on invalid credentials

---

### Database

AC1 does not require database changes. For future stories, expect:
- `users` table/collection storing:
  - username (unique)
  - password_hash
  - status fields (active/locked)

---

## Deliverables
- `plan.md` (this document)
- Login page visible on application load, containing the four required UI elements.

---

## Test Plan (AC1)
- Launch/load application
- Verify Login page is displayed
- Verify presence of:
  - Username input field
  - Password input field (masked)
  - Login button
  - Reset button
- Enter text in both fields, click Reset, verify both clear.
