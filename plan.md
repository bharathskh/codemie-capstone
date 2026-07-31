# plan.md — EPMCDMETST-57303

## Goal
Implement Reset behavior on the Login page:
- Clears Username and Password fields
- Removes any validation/auth error messages and error styling
- Does not submit the form, authenticate, or navigate
- Sets focus to Username after reset

## Front-end implementation

### UI/Component changes
1. Ensure Login page has a dedicated **Reset** button.
2. Ensure Reset button is not treated as submit:
   - HTML: `<button type="button">Reset</button>` (NOT `submit`)
3. Wire an `onResetClick` handler to:
   - Clear username/password state values
   - Clear validation state (touched/dirty flags)
   - Clear displayed error messages (inline + banner)
   - Reset any error CSS classes
   - Programmatically set focus to Username input

### Form state handling (typical patterns)
- If using React Hook Form:
  - `reset({ username: "", password: "" }, { keepErrors: false, keepTouched: false })`
  - Also clear any custom/global error banner state (e.g., `setAuthError(null)`)
- If using Formik:
  - `resetForm()` and explicitly clear any auth error banner state
- If using custom state:
  - `setUsername("")`, `setPassword("")`
  - `setFieldErrors({})`, `setBannerError(null)`
  - `setTouched({ username: false, password: false })` (if applicable)

### Error message removal (AC3)
- Remove/clear:
  - Required field validation messages
  - Any “invalid format” messages if present
  - Any login/auth failure banner shown on the page (if it shares login-form error region)
- Reset CSS/UI state:
  - remove `error`, `invalid`, `has-error` classes
  - restore default helper text (if any)

### Focus (AC5)
- Use a `ref` to Username input and call `ref.current.focus()` after reset.
- Ensure focus happens after state update (e.g., `setTimeout(0)` or `useEffect` on cleared state if needed).

### Prevent backend calls / navigation (AC4)
- Confirm Reset handler:
  - does not call login API
  - does not trigger router navigation
  - does not trigger form submit event
- If form listens to submit on Enter key, ensure Reset click does not bubble into submit logic.

### Testing (front-end)
- Unit/component tests:
  - Fill inputs -> click Reset -> inputs empty
  - Render errors -> click Reset -> errors removed and styling cleared
  - Spy on login API -> click Reset -> not called
  - Focus is on Username after reset
- E2E tests (optional but recommended):
  - Validate network panel shows no auth call on reset
  - Works with both inline and banner error variants

## Back-end implementation
- **No backend changes expected** for Reset itself (UI-only behavior).
- If the login error banner is produced from a stored auth error state after failed login:
  - Ensure the UI resets/clears that state locally (not via API).
- Verify there is no endpoint being called implicitly by Reset.

## Database changes
- **None** (no persistence required for Reset).

## Definition of Done checklist
- Meets AC1–AC5
- No auth/login request fired on Reset
- No navigation triggered
- Errors cleared and visual state restored
- Username receives focus after Reset
- Tests added/updated and passing
