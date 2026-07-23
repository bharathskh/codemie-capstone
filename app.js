/*
  Minimal login implementation (client-side + demo serverless auth).
  NOTE: This repo currently has no backend. This file includes a secure-ish demo
  approach using Web Crypto for salted password hashing and in-memory session.

  Replace the authenticate() function with a real API call once a backend exists.
*/

const MAX_USERNAME = 64;
const MAX_PASSWORD = 128;

const form = document.getElementById('loginForm');
const usernameEl = document.getElementById('username');
const passwordEl = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const resetBtn = document.getElementById('resetBtn');
const loadingEl = document.getElementById('loading');
const formErrorEl = document.getElementById('formError');
const liveRegionEl = document.getElementById('liveRegion');

const usernameErrorEl = document.getElementById('usernameError');
const passwordErrorEl = document.getElementById('passwordError');

const homeSection = document.getElementById('home');
const welcomeEl = document.getElementById('welcome');
const logoutBtn = document.getElementById('logoutBtn');

// Demo user store (username: "demo", password: "Password123!")
// Password is stored as salted PBKDF2 hash (not plaintext).
const demoUser = {
  username: 'demo',
  saltB64: 'x5gX6+g8wB4mQbUe2mQ3bA==',
  iterations: 150000,
  hashB64: 't3b1w8rQ0jBvV8FJ/9w3XfWwJ8qGk8Z5b6nQqQHk2m0=',
};

function setLoading(isLoading) {
  loadingEl.hidden = !isLoading;
  loginBtn.disabled = isLoading;
  resetBtn.disabled = isLoading;
  usernameEl.disabled = isLoading;
  passwordEl.disabled = isLoading;
}

function announce(msg) {
  // Clear first so SR will re-announce identical text
  liveRegionEl.textContent = '';
  window.setTimeout(() => {
    liveRegionEl.textContent = msg;
  }, 0);
}

function escapeText(text) {
  // Output encoding (avoid XSS). We only set textContent anyway.
  const div = document.createElement('div');
  div.textContent = text;
  return div.textContent;
}

function clearErrors() {
  formErrorEl.textContent = '';
  usernameErrorEl.textContent = '';
  passwordErrorEl.textContent = '';
  usernameEl.removeAttribute('aria-invalid');
  passwordEl.removeAttribute('aria-invalid');
}

function validate() {
  clearErrors();

  const rawUsername = usernameEl.value;
  const rawPassword = passwordEl.value;

  const username = rawUsername.trim();
  const password = rawPassword; // do not trim passwords

  let ok = true;

  if (!username) {
    usernameErrorEl.textContent = 'Username is required.';
    usernameEl.setAttribute('aria-invalid', 'true');
    ok = false;
  } else if (username.length > MAX_USERNAME) {
    usernameErrorEl.textContent = `Username must be at most ${MAX_USERNAME} characters.`;
    usernameEl.setAttribute('aria-invalid', 'true');
    ok = false;
  }

  if (!password) {
    passwordErrorEl.textContent = 'Password is required.';
    passwordEl.setAttribute('aria-invalid', 'true');
    ok = false;
  } else if (password.length > MAX_PASSWORD) {
    passwordErrorEl.textContent = `Password must be at most ${MAX_PASSWORD} characters.`;
    passwordEl.setAttribute('aria-invalid', 'true');
    ok = false;
  }

  // If trimming would change username, normalize field to trimmed to avoid surprises
  if (ok && username !== rawUsername) {
    usernameEl.value = username;
  }

  if (!ok) {
    // Focus first invalid field
    if (usernameEl.getAttribute('aria-invalid') === 'true') usernameEl.focus();
    else if (passwordEl.getAttribute('aria-invalid') === 'true') passwordEl.focus();

    announce('Please correct the errors in the form.');
  }

  return ok;
}

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function b64ToBuf(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function pbkdf2Hash(password, saltB64, iterations) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const salt = b64ToBuf(saltB64);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return bufToB64(bits);
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return res === 0;
}

// Basic client-side lockout (demo). Real lockout must be server-side.
const lockState = {
  failures: 0,
  lockedUntil: 0,
};

function isLocked() {
  return Date.now() < lockState.lockedUntil;
}

function registerFailure() {
  lockState.failures += 1;
  if (lockState.failures >= 5) {
    lockState.lockedUntil = Date.now() + 60_000; // 1 minute
  }
}

function resetFailures() {
  lockState.failures = 0;
  lockState.lockedUntil = 0;
}

async function authenticate(username, password) {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 450));

  // Generic error messaging (no username enumeration)
  if (isLocked()) {
    return {
      ok: false,
      code: 'LOCKED',
      message: 'Too many attempts. Please wait a moment and try again.',
    };
  }

  // In a real app, send HTTPS POST to /api/auth/login
  // Here we validate against a single demo user.
  const normalizedUsername = username; // case sensitivity unspecified; keep as entered

  const hashB64 = await pbkdf2Hash(password, demoUser.saltB64, demoUser.iterations);

  const userMatch = normalizedUsername === demoUser.username;
  const passMatch = constantTimeEqual(hashB64, demoUser.hashB64);

  if (!userMatch || !passMatch) {
    registerFailure();
    const remainingLock = isLocked();
    return {
      ok: false,
      code: remainingLock ? 'LOCKED' : 'INVALID_CREDENTIALS',
      message: remainingLock
        ? 'Too many attempts. Please wait a moment and try again.'
        : 'Invalid username or password.',
    };
  }

  resetFailures();

  // Create session (demo): store a boolean in sessionStorage
  sessionStorage.setItem('isAuthed', 'true');
  sessionStorage.setItem('username', normalizedUsername);

  return { ok: true, user: { username: normalizedUsername } };
}

function showHome() {
  form.hidden = true;
  homeSection.hidden = false;

  const username = sessionStorage.getItem('username') || '';
  welcomeEl.textContent = `Welcome, ${escapeText(username)}.`;
  logoutBtn.focus();
}

function showLogin() {
  homeSection.hidden = true;
  form.hidden = false;
  clearErrors();
  passwordEl.value = '';
  usernameEl.focus();
}

function restoreSession() {
  const isAuthed = sessionStorage.getItem('isAuthed') === 'true';
  if (isAuthed) showHome();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (loginBtn.disabled) return; // double-submit prevention

  if (!validate()) return;

  setLoading(true);
  clearErrors();

  try {
    const username = usernameEl.value.trim();
    const password = passwordEl.value;

    // Timeout behavior
    const timeoutMs = 8000;
    const res = await Promise.race([
      authenticate(username, password),
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error('TIMEOUT')), timeoutMs)
      ),
    ]);

    if (!res.ok) {
      formErrorEl.textContent = res.message;
      announce(res.message);
      setLoading(false);
      passwordEl.focus();
      return;
    }

    setLoading(false);
    showHome();
  } catch (err) {
    setLoading(false);

    const msg =
      err && err.message === 'TIMEOUT'
        ? 'Login is taking longer than expected. Please try again.'
        : 'Unable to reach the server. Please check your connection and try again.';

    formErrorEl.textContent = msg;
    announce(msg);
  }
});

form.addEventListener('reset', () => {
  // Reset: clear values + errors + focus username
  window.setTimeout(() => {
    clearErrors();
    formErrorEl.textContent = '';
    usernameEl.focus();
  }, 0);
});

logoutBtn.addEventListener('click', () => {
  // In a real app call /api/auth/logout to invalidate server session
  sessionStorage.removeItem('isAuthed');
  sessionStorage.removeItem('username');

  // Prevent back navigation to protected content in this simple app
  showLogin();
  history.pushState(null, '', location.pathname);
});

// Prevent showing Home via back button after logout (best-effort for this demo)
window.addEventListener('popstate', () => {
  const isAuthed = sessionStorage.getItem('isAuthed') === 'true';
  if (!isAuthed) showLogin();
});

// UX: focus username on page load
window.addEventListener('DOMContentLoaded', () => {
  usernameEl.focus();
  restoreSession();
});
