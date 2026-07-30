# Plan: Username/Password Login (EPMCDMETST-57247)

## Goal
Enable a registered user to authenticate using username and password, securely establish a session, and access the Home page. Ensure login page UI elements exist (Username, Password, Login, Reset) and basic validation/error handling is present.

## Scope (based on approved story)
- Login page displays Username + Password inputs, Login and Reset buttons.
- Basic client-side validation (required fields).
- Successful login navigates to Home.
- Invalid credentials show generic error and remain on Login page.
- Reset clears fields and validation/error messages.
- Access control: unauthenticated access to Home redirects to Login.

## Out of scope / TBD
- Brute-force protection thresholds (N attempts / M minutes) and lockout duration.
- Session timeout duration and exact storage mechanism.
- Username rules (email vs username, case-sensitivity).

## Assumptions
- This repository currently contains only planning artifacts; implementation will be added in subsequent stories/PRs.
- Application type (web/mobile) and framework are not specified; the plan is framework-agnostic.

## Deliverables in this PR
- `plan.md` containing the implementation plan for the story.

## Implementation Plan

### 1) UX/UI
- Create/confirm Login page route/screen.
- Add the following components:
  - Username text input with label and placeholder.
  - Password input (masked) with label.
  - Login button.
  - Reset button.
- Add inline validation presentation (field-level messages).
- Add generic error banner/message area for failed auth.
- Add loading state on Login action (disable buttons to prevent double submit).

### 2) Frontend Behavior
- On page load, show login form.
- On Login click:
  - Trim username.
  - Validate required fields.
  - If valid, call auth endpoint.
  - On success, store session token as per platform convention and navigate to Home.
  - On failure, show generic error (do not reveal whether username exists).
- On Reset click:
  - Clear username/password values.
  - Clear validation messages.
  - Clear generic error message.

### 3) Backend/API (if applicable)
- Provide `/auth/login` endpoint:
  - Request: `{ username, password }`
  - Response success: session token/JWT + user payload (minimal necessary)
  - Response failure: 401 with generic message
- Provide middleware/guard for protected routes (e.g., `/home`).
- Ensure secure password verification (hashed + salted in storage).

### 4) Access Control
- If unauthenticated user hits Home route, redirect to Login.
- If authenticated user hits Login route, optionally redirect to Home (confirm requirement).

### 5) Security (baseline)
- Use HTTPS in deployed environments.
- Use secure session storage:
  - Web: secure, HttpOnly cookies preferred; otherwise secure storage + CSRF considerations.
- Generic error messages to prevent account enumeration.

### 6) Testing

#### Unit tests
- Login form validation (required fields).
- Reset clears state.

#### Integration tests
- Successful login -> Home.
- Invalid login -> shows error and stays on Login.
- Unauthenticated -> Home redirects to Login.

#### E2E tests
- Happy path: registered user logs in and sees Home page.
- Negative path: invalid credentials.

### 7) Definition of Done
- `plan.md` committed.
- Acceptance Criteria in plan are mapped to test cases.
- Follow-up implementation tasks are identified.

## Acceptance Criteria Mapping
- **AC1**: Login page shows Username, Password, Login, Reset.
- **AC2**: Required field validation prevents login attempt.
- **AC3**: Valid creds authenticate and redirect to Home.
- **AC4**: Invalid creds show generic error.
- **AC5**: Reset clears fields and errors.
- **AC6**: Unauthenticated access to Home redirects to Login.

## Risks / Open Questions
- Confirm app type and tech stack.
- Confirm session strategy and timeout.
- Confirm lockout/rate-limiting policy and thresholds.
- Confirm whether username is email and whether it is case-sensitive.
