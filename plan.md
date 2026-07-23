# Plan: Login Page (AC1 – Display Login Page)

## Scope
Implement the **Login page UI** that displays:
- Username field
- Password field
- Login button
- Reset button

> Note: The provided acceptance criteria only covers displaying the page and controls. Authentication logic, validations, and redirects are intentionally out of scope unless added in a follow-up story.

---

## Implementation Plan

### 1) Front end

#### UI/UX
- Create a dedicated **Login page/screen** with a simple form layout.
- Components:
  - **Username input**
    - Label: "Username"
    - Type: text
    - Autocomplete: `username`
  - **Password input**
    - Label: "Password"
    - Type: password (masked)
    - Autocomplete: `current-password`
  - **Login button**
    - Type: submit (or button with handler)
  - **Reset button**
    - Type: reset (or button with handler)

#### Behavior (minimum for AC1)
- Page loads and renders these controls.
- Reset button clears inputs (recommended even if not explicitly stated in AC1).

#### Accessibility
- Ensure each input has an associated label.
- Ensure buttons are reachable via keyboard.
- Provide proper focus order: Username → Password → Login → Reset.

#### Suggested structure (generic)
- `/src/pages/Login.*` (page)
- `/src/components/LoginForm.*` (optional reusable form)

#### Minimal test cases (front end)
- Render test: Login page contains Username field, Password field, Login button, Reset button.
- Interaction test: Reset clears both fields.

---

### 2) Back end

AC1 does not require server changes. However, to support future ACs (login submission), plan for:
- `POST /api/auth/login` endpoint accepting `{ username, password }`.
- Return a session cookie or token on success.

For this story (AC1 only):
- No backend implementation required.

---

### 3) Database

AC1 does not require database changes.

For future authentication work, typical needs:
- `users` table with username and password hash.
- Optional tables for sessions/refresh tokens/audit logs.

---

## Suggested Tech Stack

Because the repository currently contains only a README, here are two viable stack options depending on your product direction.

### Option A (recommended): Modern web app
- **Front end**: React + TypeScript + Vite
- **UI**: Tailwind CSS (or MUI)
- **Form handling**: React Hook Form
- **Testing**: Vitest + React Testing Library
- **Back end**: Node.js (NestJS or Express)
- **Auth**: Cookie-based session (httpOnly, secure) or JWT (if required)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **API**: REST (simple) or GraphQL (if needed)

### Option B: Full-stack framework
- **Framework**: Next.js (App Router) + TypeScript
- **Auth**: NextAuth.js (if fits requirements)
- **Database**: PostgreSQL + Prisma
- **Testing**: Playwright (E2E) + Vitest/Jest (unit)

---

## Deliverables
- `plan.md` (this document)
- (Future) Login page implementation files once the repo has an application scaffold

---

## Open Questions / Confirmations
1. Is this a **web** application (browser) or mobile/desktop?
2. Should the Reset button clear only fields or also clear validation messages and set focus to Username?
3. Is username an email or a unique username string?
4. Should pressing Enter submit the form (future AC)?
