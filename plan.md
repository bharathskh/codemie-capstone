# Implementation Plan — EPMCDMETST-57369 (related: EPMCDMETST-57303)

## Goal
Implement/define the **Login page Reset button** behavior so that it:
- Clears entered **Username** and **Password** values
- Removes **field-level validation** messages and error styling
- Removes **form-level** error message (e.g., invalid credentials)
- Does **not navigate** away from Login page
- Moves focus to **Username** field after reset

> Note: Current repository contains only `README.md`, so this PR adds a planning artifact only. Code implementation will require app scaffolding or existing UI code.

---

## Frontend
### UI elements
- Username input
- Password input (masked)
- Login button (submit)
- Reset button (`type="button"`)

### Reset behavior (Acceptance Criteria mapping)
- **AC1:** Clear Username + Password values
- **AC2:** Clear field-level validation messages and reset invalid styling/state
- **AC3:** Clear form-level error message (e.g., API error banner/toast bound to form)
- **AC4:** Ensure Reset does not route away or reload page
- **AC5:** Move focus to Username input after Reset

### Validation considerations
- At minimum: required validation for Username and Password
- Ensure validation triggers (on blur and/or on submit) and that Reset clears:
  - validation messages
  - touched/dirty state
  - invalid CSS classes

### Recommended implementation patterns (pick based on stack)
- If using **React Hook Form**: call `reset()` with default values; also clear any external error state and set focus.
- If using **Formik**: use `resetForm()` and clear any external error state; set focus.
- If using plain state: set field state to empty strings; clear error state objects; call `usernameRef.focus()`.

---

## Backend
- No backend changes required for Reset (client-side behavior).
- If login failure returns an error, the UI should store it in a form-level error state so Reset can clear it.

---

## Database
- No database changes required.

---

## Testing
### Unit/component tests
- Reset clears input values
- Reset clears validation messages and invalid styling
- Reset clears form-level error message state
- Reset keeps the user on the Login page
- Reset sets focus back to Username

### E2E tests
- Trigger client-side validations → click Reset → all cleared
- Trigger invalid credentials error → click Reset → error and fields cleared

---

## Definition of Done
- Plan reviewed and agreed
- Implementation PR (separate) adds/reset behavior + tests per ACs
