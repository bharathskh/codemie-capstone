# design.md — UI/UX Design Decisions

## 1) Screens in scope
- Login screen
- Home screen (protected)

---

## 2) Wireframes (ASCII)

### Login
```
+---------------------------------------------------+
| App Name                                           |
|                                                   |
|  Sign in                                          |
|                                                   |
|  Username  [________________________]             |
|           (error text inline)                     |
|                                                   |
|  Password  [________________________]             |
|           (error text inline)                     |
|                                                   |
|  [ Login ]   [ Reset ]                            |
|                                                   |
|  (status / errors announced here via aria-live)   |
+---------------------------------------------------+
```

### Home
```
+---------------------------------------------------+
| Welcome, <username>                     [Logout]  |
|                                                   |
|  You are signed in.                               |
+---------------------------------------------------+
```

---

## 3) Component breakdown

### Shared
- `#app` root container
- `#status` live region for non-field errors

### Login form
- `<form id="loginForm">`
- Username input + `<label for>` + inline error `<div>`
- Password input type="password" + `<label for>` + inline error `<div>`
- Login button (submit)
- Reset button (resets fields, clears errors, focuses username)
- Loading indicator / disabled state during request

### Home
- Welcome text (HTML-escaped)
- Logout button

---

## 4) Visual design choices

### Color
- Background: light neutral
- Primary button: high-contrast dark
- Error: red tone with sufficient contrast
- Focus outline: visible and high-contrast

### Typography
- System font stack
- Clear label sizing

---

## 5) Accessibility design patterns (WCAG-minded)

- **Programmatic labels**: use `<label for="...">` not placeholder-only
- **Keyboard**:
  - Enter submits form (native form submit)
  - All controls reachable by Tab
- **Focus management**:
  - On page load: focus Username
  - On validation error: focus first invalid field
  - On auth/server error: focus status region (or keep focus on submit with announcement)
  - On logout: focus Username
- **Errors**:
  - Inline per-field error messages
  - Inputs set `aria-invalid="true"` when invalid
  - Error text associated via `aria-describedby`
  - A global `aria-live="polite"` region announces status
- **Visible focus indicator**: do not remove outline; provide custom outline style

---

## 6) Responsive layout approach
- Single-column layout
- Form container centered with max-width
- Inputs/buttons full-width on small screens; buttons can sit side-by-side when space allows
