const express      = require('express');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');
const crypto       = require('crypto');
const path         = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const PROD = process.env.NODE_ENV === 'production';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname)));

// --- Demo user (username: demo / password: C0dem!e@Secure#24) ---
const SALT          = crypto.randomBytes(16).toString('hex');
const PASSWORD_HASH = crypto.pbkdf2Sync('C0dem!e@Secure#24', SALT, 100000, 32, 'sha256').toString('hex');

function verifyPassword(input) {
  const hash = crypto.pbkdf2Sync(input, SALT, 100000, 32, 'sha256').toString('hex');
  return hash.length === PASSWORD_HASH.length &&
    crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(PASSWORD_HASH));
}

// --- Sessions (in-memory) ---
const sessions = new Map();

function createSession(username) {
  const id = crypto.randomBytes(32).toString('hex');
  sessions.set(id, { username, expiresAt: Date.now() + 30 * 60 * 1000 });
  return id;
}

function getSession(req) {
  const id = req.cookies?.session;
  const s  = id && sessions.get(id);
  if (!s || Date.now() > s.expiresAt) { sessions.delete(id); return null; }
  return s;
}

function sessionCookie(res, id) {
  res.cookie('session', id, { httpOnly: true, secure: PROD, sameSite: 'lax', path: '/', maxAge: 1800000 });
}

function noStore(res) { res.setHeader('Cache-Control', 'no-store'); }

// --- Routes ---

app.get('/api/session', (req, res) => {
  noStore(res);
  const s = getSession(req);
  res.json(s ? { authenticated: true, username: s.username } : { authenticated: false });
});

app.post('/api/login', (req, res) => {
  noStore(res);
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Username and password are required.' } });
  }

  if (username.trim() !== 'demo' || !verifyPassword(password)) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' } });
  }

  const id = createSession('demo');
  sessionCookie(res, id);
  res.json({ authenticated: true, username: 'demo' });
});

app.post('/api/logout', (req, res) => {
  noStore(res);
  sessions.delete(req.cookies?.session);
  res.clearCookie('session');
  res.json({ ok: true });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`Running at http://localhost:${PORT}  (demo: demo / Password123!)`));
