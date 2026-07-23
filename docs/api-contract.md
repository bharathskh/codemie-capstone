# api-contract.md — API Contract Reference

Base URL: same origin as the served UI.

All responses are JSON unless otherwise stated.

---

## Common headers

### Requests
- `Content-Type: application/json` for JSON bodies

### Responses
- `Cache-Control: no-store` for auth/session endpoints

---

## Session cookie specification

Cookie name: `session`

Attributes (production):
- `HttpOnly`
- `Secure`
- `SameSite=Lax`
- `Path=/`
- `Max-Age=<ttl seconds>`

Notes:
- In local development over HTTP, `Secure` may be disabled.

---

## GET /api/session
Check whether a browser session is currently authenticated.

### Response 200
```json
{
  "authenticated": true,
  "username": "demo"
}
```

If not authenticated:
```json
{
  "authenticated": false
}
```

---

## POST /api/login
Authenticate and start a session.

### Request
```json
{
  "username": "demo",
  "password": "Password123!"
}
```

Validation rules (client + server):
- `username`: required, trimmed, 1..64 chars
- `password`: required, 1..128 chars

### Response 200 (success)
- Sets `Set-Cookie: session=<id>; ...`

```json
{
  "authenticated": true,
  "username": "demo"
}
```

### Response 400 (validation)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the highlighted fields.",
    "fieldErrors": {
      "username": "Username is required.",
      "password": "Password is required."
    }
  }
}
```

### Response 401 (invalid credentials)
Generic error message to prevent username enumeration.
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password."
  }
}
```

### Response 423 (locked)
```json
{
  "error": {
    "code": "ACCOUNT_LOCKED",
    "message": "Too many failed attempts. Please try again later.",
    "retryAfterSeconds": 60
  }
}
```

### Response 429 (rate limit)
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later."
  }
}
```

### Response 500
```json
{
  "error": {
    "code": "SERVER_ERROR",
    "message": "Something went wrong. Please try again."
  }
}
```

---

## POST /api/logout
Invalidate current session.

### Request
No body required.

### Response 200
- Expires cookie
```json
{
  "ok": true
}
```
