# plan.md — EPMCDMETST-57497

## Goal
Ensure the Login page **Reset** button clears **Username/Password** values and removes *all* error/validation UI and accessibility state (including auth error banner), without triggering authentication, and returns focus to **Username**.

---

## Frontend

### UI behavior
1. **Reset handler**
   - Implement an explicit click handler for Reset (avoid relying only on native `<button type="reset">` if form libraries/custom state exist).
   - On click:
     - Clear Username value
     - Clear Password value
     - Clear field-level validation errors for both fields
     - Clear form-level/auth error banner (e.g., “invalid credentials”)
     - Reset “touched/dirty/submitted” state (depends on form library)
     - Set focus to Username input

2. **Validation and error rendering**
   - Ensure inline validation messages are conditional on validation state that can be fully reset.
   - Ensure auth error banner is driven by a state variable (e.g., `authError`) that is set to `null` in Reset handler.

3. **Visual state reset**
   - Reset any error CSS classes on inputs (commonly tied to `hasError`).
   - Restore default helper text if the component library supports it.

4. **Accessibility cleanup**
   - Remove/reset:
     - `aria-invalid`
     - `aria-describedby` references to error message IDs
   - Ensure after reset the DOM no longer includes error message nodes (or they are hidden and not referenced).
   - Focus management: call `.focus()` on Username input after state is reset.

5. **Networking guarantee**
   - Confirm Reset handler does not call submit logic, auth service, or dispatch login action.
   - If there is an effect that triggers auth on certain state changes, ensure reset does not satisfy those conditions.

### Tests (frontend)
- Unit/component tests:
  - Enter values + trigger validation → click Reset → values empty, errors removed, `aria-invalid` cleared.
  - Simulate failed login (auth banner visible) → Reset → banner gone.
  - Spy/mock auth API → Reset does not call.
  - Focus assertion: active element is Username after reset.
- E2E test (Cypress/Playwright):
  - Validate UI behavior across full page flow.

---

## Backend
- **No backend changes required** (Reset must be UI-only).
- Verify that no endpoint is called on Reset (covered by tests and network inspection).

---

## Database
- **No database changes required**.

---

## Implementation notes / risks
- If using a form library, prefer the library’s official reset APIs:
  - Formik: `resetForm()`
  - React Hook Form: `reset({ username: '', password: '' })` + `clearErrors()`
  - Angular Reactive Forms: `form.reset()` + ensure validators/touched states cleared
- Browser autofill/password managers may repopulate fields; document expected behavior if needed.
