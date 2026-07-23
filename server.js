// server.js — Node/Express backend stub matching api-contract.md
// Demo-only: in-memory users/sessions; do not use as-is for production.

const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');

const app = express();

app.use(helmet({
  contentSecurityPolicy: false // keep simple for demo; add CSP if serving inline assets
}));
app.use(express.json());
app.use(cookieParser());

// Static assets
app.use(express.static(path.join(__dirname)));

// --- Security/session configuration ---
const SESSION_COOKIE_NAME = 'session';
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const IS_PROD = process.env.NODE_ENV === 'production';

function setNoStore(res) {
  res.setHeader('Cache-Control', 'no-store');
}

function createSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

function pbkdf2Hash(password, salt, iterations = 120000, keylen = 32, digest = 'sha256') {
  const dk = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest);
  return dk.toString('hex');
}

function timingSafeEqualHex(a, b) {
  const ab = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// --- Demo user store ---
// Username: demo
// Password: Password123!
const demoSalt = crypto.randomBytes(16).toString('hex');
const demoPasswordHash = pbkdf2Hash('Password123!', demoSalt);

const users = new Map([
  ['demo', { username: 'demo', salt: demoSalt, passwordHash: demoPasswordHash }]
]);

// --- In-memory session store ---
// sessionId -> { username, expiresAt }
const sessions = new Map();

function getSession(req) {
  const sid = req.cookies?.[SESSION_COOKIE_NAME];
  if (!sid) return null;
  const s = sessions.get(sid);
  if (!s) return null;
  if (Date.now() > s.expiresAt) {
    sessions.delete(sid);
    return null;
  }
  return { id: sid, ...s };
}

function setSessionCookie(res, sid) {
  res.cookie(SESSION_COOKIE_NAME, sid, {
    httpOnly: true,
    secure: IS_PROD, // requires HTTPS in production
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS
  });
}

function clearSessionCookie(res) {
  res.cookie(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
}

// --- Brute force mitigation (demo) ---
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;
// key -> { fails, lockedUntil }
const lockouts = new Map();

function lockoutKey(req, username) {
  // Demo: keyed by username (trimmed + lowercased) + IP
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  return `${String(username).toLowerCase()}|${ip}`;
}

function getLockoutState(key) {
  const state = lockouts.get(key);
  if (!state) return { fails: 0, lockedUntil: 0 };
  if (state.lockedUntil && Date.now() > state.lockedUntil) {
    lockouts.delete(key);
    return { fails: 0, lockedUntil: 0 };
  }
  return state;
}

function recordFailedAttempt(key) {
  const state = getLockoutState(key);
  const fails = (state.fails || 0) + 1;
  const lockedUntil = fails >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCKOUT_SECONDS * 1000 : 0;
  lockouts.set(key, { fails, lockedUntil });
  return lockouts.get(key);
}

function clearFailedAttempts(key) {
  lockouts.delete(key);
}

// --- Routes ---
app.get('/api/session', (req, res) => {
  setNoStore(res);
  const s = getSession(req);
  if (!s) return res.status(200).json({ authenticated: false });
  return res.status(200).json({ authenticated: true, username: s.username });
});

app.post('/api/login', (req, res) => {
  setNoStore(res);

  const usernameRaw = req.body?.username;
  const password = req.body?.password;

  const username = typeof usernameRaw === 'string' ? usernameRaw.trim() : '';

  const fieldErrors = {};
  if (!username) fieldErrors.username = 'Username is required.';
  else if (username.length > 64) fieldErrors.username = 'Username must be 64 characters or fewer.';

  if (typeof password !== 'string' || !password) fieldErrors.password = 'Password is required.';
  else if (password.length > 128) fieldErrors.password = 'Password must be 128 characters or fewer.';

  if (Object.keys(fieldErrors).length) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please check the highlighted fields.',
        fieldErrors
      }
    });
  }

  const key = lockoutKey(req, username);
  const state = getLockoutState(key);
  if (state.lockedUntil) {
    const retryAfterSeconds = Math.max(1, Math.ceil((state.lockedUntil - Date.now()) / 1000));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    return res.status(423).json({
      error: {
        code: 'ACCOUNT_LOCKED',
        message: 'Too many failed attempts. Please try again later.',
        retryAfterSeconds
      }
    });
  }

  const user = users.get(username);

  // Generic invalid creds response to prevent enumeration
  const invalid = () => {
    recordFailedAttempt(key);
    return res.status(401).json({
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' }
    });
  };

  if (!user) return invalid();

  const computed = pbkdf2Hash(password, user.salt);
  const ok = timingSafeEqualHex(computed, user.passwordHash);
  if (!ok) return invalid();

  // success
  clearFailedAttempts(key);
  const sid = createSessionId();
  sessions.set(sid, { username: user.username, expiresAt: Date.now() + SESSION_TTL_MS });
  setSessionCookie(res, sid);

  return res.status(200).json({ authenticated: true, username: user.username });
});

app.post('/api/logout', (req, res) => {
  setNoStore(res);
  const sid = req.cookies?.[SESSION_COOKIE_NAME];
  if (sid) sessions.delete(sid);
  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
});

// SPA-ish fallback: serve index.html for unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
