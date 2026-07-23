const el = (id) => document.getElementById(id);

const loginForm = el('loginForm');
const usernameInput = el('username');
const passwordInput = el('password');
const loginBtn = el('loginBtn');
const resetBtn = el('resetBtn');
const logoutBtn = el('logoutBtn');

const statusEl = el('status');
const loadingEl = el('loading');

const usernameErrorEl = el('usernameError');
const passwordErrorEl = el('passwordError');

const homeSection = el('home');
const welcomeEl = el('welcome');

const REQUEST_TIMEOUT_MS = 10000;

function setStatus(message) {
  statusEl.textContent = message || '';
}

function setLoading(isLoading) {
  loadingEl.style.display = isLoading ? 'flex' : 'none';
  loadingEl.setAttribute('aria-hidden', isLoading ? 'false' : 'true');
  loginBtn.disabled = isLoading;
  resetBtn.disabled = isLoading;
  usernameInput.disabled = isLoading;
  passwordInput.disabled = isLoading;
}

function clearFieldErrors() {
  usernameErrorEl.textContent = '';
  passwordErrorEl.textContent = '';
  usernameInput.removeAttribute('aria-invalid');
  passwordInput.removeAttribute('aria-invalid');
}

function setFieldError(field, message) {
  if (field === 'username') {
    usernameErrorEl.textContent = message;
    usernameInput.setAttribute('aria-invalid', 'true');
  }
  if (field === 'password') {
    passwordErrorEl.textContent = message;
    passwordInput.setAttribute('aria-invalid', 'true');
  }
}

function validate() {
  clearFieldErrors();
  setStatus('');

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  const errors = {};

  if (!username) errors.username = 'Username is required.';
  else if (username.length > 64) errors.username = 'Username must be 64 characters or fewer.';

  if (!password) errors.password = 'Password is required.';
  else if (password.length > 128) errors.password = 'Password must be 128 characters or fewer.';

  if (Object.keys(errors).length) {
    for (const [k, v] of Object.entries(errors)) setFieldError(k, v);

    const first = errors.username ? usernameInput : passwordInput;
    first.focus();
    setStatus('Please check the highlighted fields.');
    return { ok: false };
  }

  return { ok: true, username, password };
}

async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(path, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      credentials: 'include'
    });

    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const body = isJson ? await res.json() : null;

    return { res, body };
  } finally {
    clearTimeout(t);
  }
}

function showHome(username) {
  loginForm.hidden = true;
  homeSection.hidden = false;
  // Prevent XSS by setting textContent
  welcomeEl.textContent = `Welcome, ${username}`;
  setStatus('');
}

function showLogin() {
  homeSection.hidden = true;
  loginForm.hidden = false;
  passwordInput.value = '';
  clearFieldErrors();
  setStatus('');
  usernameInput.focus();
}

async function checkSession() {
  try {
    const { res, body } = await apiFetch('/api/session', { method: 'GET' });
    if (res.ok && body?.authenticated) {
      showHome(body.username);
    } else {
      showLogin();
    }
  } catch {
    // If API is not running, default to login UI but show a helpful status.
    showLogin();
    setStatus('Unable to reach server. Please start the server and try again.');
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const v = validate();
  if (!v.ok) return;

  setLoading(true);

  try {
    const { res, body } = await apiFetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username: v.username, password: v.password })
    });

    if (res.ok && body?.authenticated) {
      // Clear sensitive field
      passwordInput.value = '';
      showHome(body.username);
      return;
    }

    // Error handling per api-contract.md
    const err = body?.error;

    if (res.status === 400 && err?.code === 'VALIDATION_ERROR' && err.fieldErrors) {
      clearFieldErrors();
      for (const [field, msg] of Object.entries(err.fieldErrors)) {
        setFieldError(field, msg);
      }
      setStatus(err.message || 'Please check the highlighted fields.');
      (err.fieldErrors.username ? usernameInput : passwordInput).focus();
      return;
    }

    if (res.status === 423 && err?.code === 'ACCOUNT_LOCKED') {
      setStatus(err.message || 'Too many failed attempts. Please try again later.');
      return;
    }

    if (res.status === 429 && err?.code === 'RATE_LIMITED') {
      setStatus(err.message || 'Too many requests. Please try again later.');
      return;
    }

    // 401 or other errors
    setStatus(err?.message || 'Invalid username or password.');
  } catch (e2) {
    if (e2?.name === 'AbortError') {
      setStatus('Login request timed out. Please try again.');
    } else {
      setStatus('Network/server unavailable. Please try again.');
    }
  } finally {
    setLoading(false);
  }
});

resetBtn.addEventListener('click', () => {
  usernameInput.value = '';
  passwordInput.value = '';
  clearFieldErrors();
  setStatus('');
  usernameInput.focus();
});

logoutBtn.addEventListener('click', async () => {
  setStatus('Signing out…');
  try {
    await apiFetch('/api/logout', { method: 'POST' });
  } catch {
    // best-effort
  }
  showLogin();
});

// Initial focus management + session check
window.addEventListener('DOMContentLoaded', () => {
  setLoading(false);
  checkSession();
});
