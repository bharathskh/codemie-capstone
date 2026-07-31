# Plan — EPMCDMETST-57303: Login Reset button clears values + errors

## Jira Story
- **Key**: EPMCDMETST-57303
- **Summary**: Login: Reset button clears entered values and removes error/validation messages
- **Status**: Open
- **Priority**: Low
- **Labels**: login, ui, usability

## Goal
Implement a **Reset** action on the Login page that:
1. Clears Username + Password inputs.
2. Removes all login-form validation and error messages and restores default visual state.
3. Does **not** submit authentication or navigate away.
4. Returns keyboard focus to the Username field.

## Assumptions / Decisions
- Login form contains only **Username**, **Password**, **Login**, **Reset** (per AC1).
- "Validation/error messages" include inline field errors and/or a form-level banner for the login form.
- Reset should always clear to **empty string** values (not to any persisted defaults).
- Reset should remove error styling (CSS classes) and validation state flags for both fields.

---

## Front-End Implementation

### UI Behavior
- Add/confirm presence of a **Reset** button on the Login page.
- On click:
  - `username = ""`
  - `password = ""`
  - Clear validation state:
    - field errors (e.g., `usernameError`, `passwordError`)
    - form/banner error (e.g., `loginError`)
    - touched/dirty flags if used by the form library
  - Remove any error CSS classes.
  - Ensure no submit handler is invoked.
  - Set focus to Username input.

### Form Wiring
- If using a form library (Formik/React Hook Form/Angular Reactive Forms/Vue VeeValidate):
  - Use library reset APIs (preferred) and ensure they also clear errors:
    - **Formik**: `resetForm({ values: { username: '', password: '' } })`
    - **React Hook Form**: `reset({ username: '', password: '' }, { keepErrors: false, keepTouched: false })`
    - **Angular**: `form.reset({ username: '', password: '' }); form.markAsPristine(); form.markAsUntouched();`
- If using native form controls:
  - Prefer explicit state reset over `<button type="reset">` to avoid restoring default values unexpectedly.

### Prevent Submit / Navigation
- Ensure Reset button is `type="button"` (not `submit`).
- Ensure Reset handler does not call navigation or auth APIs.

### Focus Management
- Store a ref/element id for Username input and call `focus()` after clearing state.

### Tests (Front End)
- Unit/UI tests (depending on stack):
  - Fill both fields, click Reset ⇒ values empty.
  - Induce validation errors, click Reset ⇒ no inline errors, no banner, no error classes.
  - Ensure no auth submit function called.
  - Focus after reset is on Username.

---

## Back-End Implementation
- **No back-end changes expected**.
- Ensure no endpoint is called when Reset is clicked (validated via front-end tests).

---

## Database
- **No database changes expected**.

---

## Non-Functional Considerations
- Accessibility: focus is set to Username; error elements removed from DOM/state.
- Observability: optional UI analytics event `login_reset_clicked` if product uses tracking (not required by AC).

---

## Delivery Checklist
- [ ] Reset button present on Login page.
- [ ] Clears Username + Password.
- [ ] Clears validation + error messages and styling.
- [ ] Does not submit / does not navigate.
- [ ] Focus returns to Username.
- [ ] Automated test coverage added/updated.
