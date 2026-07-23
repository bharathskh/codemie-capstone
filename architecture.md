# architecture.md — System Architecture Overview

## 1) Goals (scope of this document)
This document describes the architecture for the **Login → Session → Home** flow.

In scope:
- Browser UI for login and home
- Backend stub with login/logout endpoints
- Session management via secure cookie
- Brute force mitigation via rate limiting / lockout

Out of scope:
- User registration, password reset, MFA
- Persistent production database and user admin tooling

---

## 2) Component diagram (ASCII)

```
+---------------------------+      HTTPS       +-----------------------------+
|        Web Browser        | <--------------> |      Node/Express API        |
|                           |                  |                             |
|  - Login Page (HTML/CSS)  |                  |  POST /api/login            |
|  - Home Page (protected)  |                  |  POST /api/logout           |
|  - app.js (fetch)         |                  |  GET  /api/session          |
|                           |                  |                             |
|  Stores:                  |                  |  Middleware:                |
|   - Cookie: session       |                  |   - Helmet security headers |
|   - (no credentials)      |                  |   - Rate limit / lockout    |
+---------------------------+                  |   - Session cookie mgmt      |
                                               +-----------------------------+
                                                          |
                                                          | (stub user store)
                                                          v
                                               +-----------------------------+
                                               | In-memory users + sessions  |
                                               | (for demo/testing only)     |
                                               +-----------------------------+
```

---

## 3) Tech stack choices

### Frontend
- Plain **HTML/CSS/JavaScript**
- Uses `fetch()` with `credentials: "include"` for cookie-based session

Rationale:
- Minimal dependencies
- Easy to run locally and in simple hosting

### Backend
- **Node.js + Express**
- Security headers: `helmet`
- Cookie parsing: `cookie-parser`
- Password hashing: Node `crypto.pbkdf2` (salted hash)
- Rate limiting/lockout: simple in-memory counters (demo)

Rationale:
- Matches requested `server.js` stub
- Allows documenting a realistic cookie session pattern

---

## 4) Repository/folder structure

```
/
  index.html
  styles.css
  app.js

  server.js
  package.json            (added by implementation)
  package-lock.json       (if npm install)

  architecture.md
  design.md
  api-contract.md

  README.md
```

---

## 5) Data flow (browser → login → session → home)

### 5.1 Page load
1. Browser loads `index.html` and `app.js`
2. `app.js` calls `GET /api/session`
   - If `authenticated: true` → show Home
   - Else → show Login

### 5.2 Login
1. User enters username/password and submits
2. Frontend validates required/max length and trims username
3. Frontend sends `POST /api/login` with JSON body
4. Backend validates input, checks lockout/rate limit
5. Backend verifies password hash
6. On success:
   - Backend sets `Set-Cookie: session=<id>; HttpOnly; Secure; SameSite=Lax; Path=/`
   - Returns JSON with `authenticated: true`
7. Frontend transitions UI to Home and clears password field

### 5.3 Logout
1. User clicks logout
2. Frontend calls `POST /api/logout`
3. Backend invalidates session id and expires cookie
4. Frontend returns to Login page and focuses username

---

## 6) Security architecture

### 6.1 Transport security (HTTPS)
- Credentials must be submitted over **HTTPS**.
- For local dev, allow HTTP but document that production requires TLS.

### 6.2 Session management
- Cookie-based session with flags:
  - `HttpOnly` to mitigate XSS cookie theft
  - `Secure` in production (HTTPS)
  - `SameSite=Lax` to reduce CSRF risk
  - Short TTL (demo) and server-side session store

### 6.3 Brute force / lockout
- Track failed login attempts per username + IP (demo uses IP only if available)
- After N failures, lock for a cooldown period
- Return generic messages that do not reveal whether the username exists

### 6.4 Sensitive logging
- Do **not** log passwords
- Do not return detailed auth failure reasons to clients

---

## 7) Non-functional considerations
- Timeout: client should handle slow responses (AbortController)
- Resilience: user sees friendly error on network/server failure
- Performance: login response should be fast; rate limiting should be lightweight
