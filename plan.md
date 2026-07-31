# Plan — EPMCDMETST-57506
Login: Reset returns form to initial pristine state (touched/dirty, default button state)

## Goal
Implement Reset behavior on the Login page so that clicking Reset:
- clears Username & Password values
- removes all validation/error UI
- restores the form to the same pristine state as initial page load
- focuses Username
- does not navigate and does not trigger authentication

---

## Front end
### UI behavior
1. Add/confirm a Reset button exists on the Login form.
2. On Reset click:
   - Clear controlled input values: `username = ""`, `password = ""`.
   - Clear validation state:
     - set `touched = {}` / `dirty = false` / `errors = {}` (exact fields depend on form library).
     - remove any global/banner error state related to validation (not auth failure; that’s separate story unless shared state exists).
   - Restore default control state:
     - Ensure Login button enabled/disabled matches initial render rules.
     - Reset “show password” toggle to default (if present) **only if** it is part of initial render definition for this app.
   - Focus Username input via ref after state reset.

### Suggested implementation approach (depending on current stack)
- **React + Formik**: use `formik.resetForm()` with initialValues; also clear any external error states; then `usernameRef.current?.focus()`.
- **React Hook Form**: use `reset(defaultValues, { keepErrors: false, keepDirty: false, keepTouched: false })`; then focus.
- **Angular reactive forms**: call `form.reset(initialValueState)` and `form.markAsPristine(); form.markAsUntouched();` then focus with `ViewChild`.
- Ensure Reset handler does **not** call submit handler and does not dispatch login thunk/action.

### Testing (FE)
- Unit/component tests:
  - set values + trigger blur to show validation -> click Reset -> expect inputs empty, validation text gone, error styles removed.
  - verify `touched/dirty` cleared.
  - verify Login button state equals initial.
  - verify focus on Username.
- E2E test (Cypress/Playwright):
  - assert **no** network request to auth endpoint after clicking Reset.

---

## Back end
- No backend changes expected.
- Ensure no API call is made from UI; if there is a shared action that fires on any button click, decouple Reset from auth logic.

---

## Database
- No DB changes expected.

---

## Notes / Risks
- “Initial render” rules must be consistent: if Login button is disabled until form valid, Reset should restore that exact initial rule.
- If username is pre-filled by “remember me” or SSO hints, confirm product expectation: Reset may need to restore to that prefilled initial value rather than empty. (Current AC implies clearing values; confirm with PO if autofill/remembered value exists.)

---

## Deliverables
- Updated Login form Reset handler
- Updated validation/UI state reset logic
- Automated tests (unit + e2e)
