# CLAUDE.md — Code Writer Guide

This project implements a **Login → Session → Home** flow using vanilla HTML/CSS/JS (frontend) and Node/Express (backend).

Before writing any code, read and follow these three reference documents:

- [`architecture.md`](./architecture.md) — component diagram, tech stack, folder structure, data flow, security architecture
- [`design.md`](./design.md) — wireframes, component breakdown, accessibility patterns, responsive layout
- [`api-contract.md`](./api-contract.md) — API endpoints, request/response schemas, error codes, cookie spec

## File responsibilities

| File | Owns |
|------|------|
| `index.html` | All markup — login form, home section, status live region |
| `styles.css` | All styling — layout, focus indicators, error states, spinner |
| `app.js` | All client logic — session check, login/logout fetch, validation, a11y, double-submit prevention |
| `server.js` | All server logic — `/api/session`, `/api/login`, `/api/logout`, cookie session, lockout |
| `package.json` | Dependencies: express, helmet, cookie-parser only |

## Coding rules

### General
- No frameworks, no bundlers — plain HTML/CSS/JS on the frontend
- ES modules on the server (`"type": "module"` in package.json) or CommonJS — be consistent with what exists
- Do not add dependencies beyond express, helmet, cookie-parser unless explicitly asked

### HTML
- Every input must have a `<label for="...">` — never rely on placeholder as the only label
- Inline error containers use `aria-describedby` linking input → error div
- A single `<div id="status" aria-live="polite" aria-atomic="true">` handles non-field status messages
- Password field: `type="password"`, never `type="text"`

### CSS
- Never remove `outline` without providing an equivalent visible focus style
- Error state: add `.error` class to input + show sibling error div
- Loading state: disable inputs/buttons + show spinner via `.loading` on the form

### JavaScript (app.js)
- On page load: call `GET /api/session` → show Home if authenticated, else show Login
- Focus `#username` on login page display; focus `#username` after logout
- Validate before fetch: username required + max 64 chars, password required + max 128 chars
- Trim username; do NOT trim password
- Set `aria-invalid="true"` on invalid fields; clear on correction
- Use `AbortController` with a 10 s timeout on all fetch calls
- Disable submit button + all inputs during in-flight request (double-submit prevention)
- Clear password field after any server response (success or failure)
- Escape any user-supplied text inserted into the DOM (use `textContent`, not `innerHTML`)

### JavaScript (server.js)
- All auth endpoints return `Cache-Control: no-store`
- Passwords: PBKDF2 with salt — never store or log plaintext
- Login errors: always return generic `"Invalid username or password."` — no username enumeration
- Lockout: track failed attempts per username; after threshold return 423 with `retryAfterSeconds`
- Session cookie flags: `httpOnly: true`, `secure: true` in production, `sameSite: "lax"`, `path: "/"`
- Never log passwords or session tokens

## API contract (quick ref)

Follow `api-contract.md` exactly. Key shapes:

```
POST /api/login   { username, password } → 200 { authenticated, username } | 400 | 401 | 423 | 500
POST /api/logout  (no body)              → 200 { ok: true }
GET  /api/session (no body)              → 200 { authenticated, username? }
```

## Traceability tags

When adding or modifying code, note which tag the change satisfies (in a commit message or inline comment when the reason is non-obvious):

| Tag | Area |
|-----|------|
| AC1 | Login page display (username, password, login, reset) |
| UX-Focus | Focus management on load / error / logout |
| UX-Validation | Inline field-level error messages |
| UX-Loading | Spinner + double-submit prevention |
| A11y-Labels | `<label for>` programmatic labels |
| A11y-AriaInvalid | `aria-invalid` on invalid inputs |
| A11y-AriaLive | `aria-live` status announcements |
| A11y-Keyboard | Keyboard navigation and Enter-submits |
| Sec-HTTPS | Credentials over HTTPS only |
| Sec-Generic | Generic auth error messages |
| Sec-Hash | PBKDF2 password hashing |
| Sec-Cookie | HttpOnly/Secure/SameSite cookie flags |
| Sec-Lockout | Brute force lockout |
| Val-Required | Required field validation |
| Val-MaxLen | Max length constraints |
| Val-Trim | Whitespace trimming rules |
| EH-Network | Network/server error handling |
| EH-Timeout | AbortController timeout |

## Git workflow

After writing or modifying any code file, always commit the changes:

1. **Branch** — work on a feature branch, never directly on `main`:
   ```bash
   git checkout -b feature/<short-description>
   ```

2. **Stage only relevant files** — never `git add .` blindly:
   ```bash
   git add index.html styles.css app.js   # or whichever files changed
   ```

3. **Commit message format**:
   ```
   <type>(<scope>): <what changed> [<TraceabilityTag>]
   ```
   - `type`: `feat`, `fix`, `style`, `refactor`, `docs`, `test`
   - `scope`: `ui`, `api`, `auth`, `a11y`, `sec`, `val`
   - Include the traceability tag(s) from the table above

   Examples:
   ```
   feat(ui): add inline validation messages [UX-Validation, Val-Required]
   fix(api): return generic error on invalid credentials [Sec-Generic]
   feat(a11y): wire aria-live region for status announcements [A11y-AriaLive]
   ```

4. **Push and open a PR** targeting `main`:
   ```bash
   git push -u origin feature/<short-description>
   gh pr create --title "<commit title>" --body "Closes #<issue>. Implements <TraceabilityTag(s)>."
   ```

5. **One commit per logical change** — do not batch unrelated changes into a single commit.

6. **Never commit**:
   - `.env` files or secrets
   - `node_modules/`
   - Passwords, tokens, or session IDs

## How to run

```bash
npm install
npm start
# open http://localhost:3000
# demo credentials: demo / Password123!
```
