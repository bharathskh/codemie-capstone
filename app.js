const loginPage   = document.getElementById('loginPage');
const homePage    = document.getElementById('homePage');
const loginForm   = document.getElementById('loginForm');
const usernameEl  = document.getElementById('username');
const passwordEl  = document.getElementById('password');
const loginBtn    = document.getElementById('loginBtn');
const resetBtn    = document.getElementById('resetBtn');
const logoutBtn   = document.getElementById('logoutBtn');
const statusEl    = document.getElementById('status');
const welcomeMsg  = document.getElementById('welcomeMsg');
const usernameErr = document.getElementById('usernameErr');
const passwordErr = document.getElementById('passwordErr');

// --- Helpers ---

function showLogin() {
  homePage.hidden = true;
  loginPage.hidden = false;
  passwordEl.value = '';
  clearErrors();
  statusEl.textContent = '';
  usernameEl.focus();
}

function showHome(username) {
  loginPage.hidden = true;
  homePage.hidden = false;
  welcomeMsg.textContent = `Welcome, ${username}`;
}

function clearErrors() {
  usernameErr.textContent = '';
  passwordErr.textContent = '';
  usernameEl.removeAttribute('aria-invalid');
  passwordEl.removeAttribute('aria-invalid');
}

function setError(field, msg) {
  if (field === 'username') {
    usernameErr.textContent = msg;
    usernameEl.setAttribute('aria-invalid', 'true');
  } else {
    passwordErr.textContent = msg;
    passwordEl.setAttribute('aria-invalid', 'true');
  }
}

function setLoading(on) {
  loginBtn.disabled = on;
  resetBtn.disabled = on;
  usernameEl.disabled = on;
  passwordEl.disabled = on;
  loginBtn.textContent = on ? 'Signing in…' : 'Login';
}

function validate() {
  clearErrors();
  statusEl.textContent = '';

  const username = usernameEl.value.trim();
  const password = passwordEl.value;
  let valid = true;

  if (!username) { setError('username', 'Username is required.'); valid = false; }
  if (!password) { setError('password', 'Password is required.'); valid = false; }

  if (!valid) {
    (usernameEl.getAttribute('aria-invalid') ? usernameEl : passwordEl).focus();
  }
  return valid ? { username, password } : null;
}

// --- API ---

async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(path, {
      ...options,
      signal: controller.signal,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    const body = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, body };
  } finally {
    clearTimeout(timer);
  }
}

// --- Handlers ---

async function checkSession() {
  try {
    const { ok, body } = await apiFetch('/api/session');
    if (ok && body?.authenticated) {
      showHome(body.username);
    } else {
      showLogin();
    }
  } catch {
    showLogin();
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fields = validate();
  if (!fields) return;

  setLoading(true);
  try {
    const { ok, status, body } = await apiFetch('/api/login', {
      method: 'POST',
      body: JSON.stringify(fields)
    });

    if (ok && body?.authenticated) {
      showHome(body.username);
      return;
    }

    if (status === 423) {
      statusEl.textContent = 'Too many failed attempts. Please try again later.';
    } else {
      statusEl.textContent = body?.error?.message || 'Invalid username or password.';
    }
  } catch (err) {
    statusEl.textContent = err?.name === 'AbortError'
      ? 'Request timed out. Please try again.'
      : 'Unable to connect. Please try again.';
  } finally {
    passwordEl.value = '';
    setLoading(false);
  }
});

resetBtn.addEventListener('click', () => {
  usernameEl.value = '';
  passwordEl.value = '';
  clearErrors();
  statusEl.textContent = '';
  usernameEl.focus();
});

logoutBtn.addEventListener('click', async () => {
  await apiFetch('/api/logout', { method: 'POST' }).catch(() => {});
  showLogin();
});

// Init
checkSession();
