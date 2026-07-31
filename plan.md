# Plan — EPMCDMETST-57303 (Login Reset clears values and errors)

## Goal
Implement **Reset** behavior on the Login page so that it:
- clears entered **Username** and **Password** values
- removes **field-level validation messages**
- removes any **form-level error messages** (e.g., invalid credentials banner)
- restores the form to its initial (pristine/untouched) state
- sets focus to the **Username** field after reset

This plan assumes the UI contains: Username input, Password input, Login button, Reset button.

---

## Scope
### In scope
- Frontend-only changes to implement Reset behavior.
- Update UI state management so Reset returns the form to its initial baseline.
- Add/extend automated tests (unit/component and E2E where available) that assert Reset behavior.

### Out of scope
- Backend authentication logic changes.
- API contract changes.
- New UI redesign unrelated to Reset.

---

## Acceptance Criteria mapping
Implement behavior to satisfy the following (suggested) ACs:
- **AC2** Reset clears Username/Password values
- **AC3** Reset removes validation messages and form-level errors
- **AC4** Reset restores default field state (no invalid styling, pristine)
- **AC5** Reset does nothing harmful when already empty
- **AC6** Focus goes to Username after reset (or the team-defined expected focus target)

---

## Implementation approach (frontend)

### 1) Wire Reset button
- Ensure Reset button is present and has a dedicated click handler.
- Prefer `type="button"` (not `submit`) to avoid triggering submission.
- If native HTML reset is used (`type="reset"`), still ensure custom validation/auth error state is cleared.

### 2) Reset form values
On reset click:
- Set Username to empty string
- Set Password to empty string

**If using a form library**:
- **React Hook Form**: `reset({ username: "", password: "" }, { keepErrors: false, keepDirty: false, keepTouched: false })`
- **Formik**: `resetForm({ values: { username: "", password: "" } })`
- **Angular reactive forms**: `form.reset({ username: null, password: null })` + ensure validators/dirty/touched are cleared
- **Vue**: reset model values + clear validation state (e.g., Vuelidate `$reset()`)

### 3) Clear validation and error UI
- Clear field-level errors (required/format validations)
- Clear form-level error banner/summary (e.g., `authError`, `apiError`, `loginErrorMessage`)
- Remove invalid styling classes/states from inputs
- Ensure Reset does **not** trigger validation; it should restore pristine state

### 4) Restore pristine/untouched state
- Clear `touched`/`dirty` markers
- Ensure required-field messages do not immediately reappear after reset

### 5) Focus behavior
- After reset completes, move focus to the Username input.
  - In React: keep a ref on username input and call `ref.current?.focus()`.
  - In Angular: `ViewChild` focus after `form.reset()`.

### 6) Ensure Reset does not call Login API
- Confirm the handler does not trigger the authentication call.
- In tests, assert no network request is made on Reset click (E2E).

---

## Testing plan

### Unit/component tests
Add tests that cover:
1. Enter username/password, click Reset → both inputs are empty.
2. Trigger required-field validation errors, click Reset → validation messages disappear.
3. Simulate failed login (form-level error banner), click Reset → banner cleared.
4. Reset restores pristine state (no `aria-invalid`, no invalid CSS, no error summary).
5. Focus moves to Username after reset.

### E2E tests (if suite exists)
- Load login page
- Enter values, trigger validation and/or failed login message
- Click Reset
- Assert:
  - inputs are empty
  - error elements are not visible
  - focus is on username
  - no login request fired by reset

---

## Notes / Open questions to confirm
- What constitutes “error/validation messages” in this app?
  - Field-level required/format errors
  - Form-level invalid credentials banner
  - Any server errors displayed on the page
- Should Reset clear other controls if present (Remember me, tenant selector, captcha)?
- Confirm desired focus target after reset (assumed: Username).
