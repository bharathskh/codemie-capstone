# Plan — EPMCDMETST-57303
Login: Reset button clears entered values and removes error/validation messages

## Goal
Implement Reset behavior on the Login page so that:
- Username + Password inputs are cleared
- All validation/error messages (inline and/or banner) are removed
- Error styling is removed and fields return to default visual state
- No authentication call is triggered
- Focus is moved to Username after reset

---

## Front End (UI)
### 1) Identify current Login form implementation
- Locate the Login page component and determine the form state management approach (e.g., React Hook Form/Formik/Angular Reactive Forms/Vue).
- Identify how validation errors are stored and rendered:
  - field-level errors (username/password)
  - banner/global error (e.g., invalid credentials)

### 2) Implement/verify Reset button behavior
- Ensure Reset button has `type="button"` (prevents form submission).
- On Reset click:
  - Clear input values:
    - `username = ""`
    - `password = ""`
  - Clear all UI validation errors:
    - field-level error messages removed
    - banner/global errors removed (if the login form shows such a message)
  - Clear error styling:
    - remove `is-invalid`/error classes
    - reset touched/dirty states if the form library supports it
  - Set focus to Username field:
    - use a ref/element id and call `.focus()` after state updates

### 3) Ensure “no side effects”
- Ensure Reset handler does not call the login submit handler and does not trigger an auth API call.
- Ensure no navigation/redirect occurs on Reset.

### 4) Testing (frontend)
- Unit/component tests:
  - Enter username/password → click Reset → fields empty
  - Trigger inline errors → click Reset → errors gone + styling default
  - Trigger banner error (if applicable) → click Reset → banner cleared
  - Click Reset → verify submit/auth handler not called
  - Click Reset → focus asserted on username field
- E2E tests (Playwright/Cypress):
  - Cover same scenarios in a real browser and verify no network request on Reset.

---

## Back End
- No changes expected (Reset is UI-only).

## Database
- No changes expected.

---

## Non-functional / UX notes
- Reset must be accessible via keyboard (tab + enter/space).
- Reset should be idempotent: clicking Reset on an already-clean form should not introduce validation errors.
- If the UI includes password reveal toggle / caps-lock indicator, decide whether Reset restores those to default.

---

## Deliverables
- Updated Login page/component behavior (Reset)
- Automated tests (unit + e2e where applicable)
- `plan.md` checked into the repo
