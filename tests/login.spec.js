// @ts-check
import { test, expect } from '@playwright/test';

const VALID_USER = 'demo';
const VALID_PASS = 'C0dem!e@Secure#24';
const BASE      = 'http://localhost:3000';

test.beforeEach(async ({ page }) => {
  // Clear session before each test
  await page.context().clearCookies();
  await page.goto(BASE);
});

// ---------------------------------------------------------------------------
// AC1 — Login page display
// ---------------------------------------------------------------------------

test.describe('AC1 – Login page display', () => {
  test('shows login page on first load', async ({ page }) => {
    await expect(page.locator('#loginPage')).toBeVisible();
    await expect(page.locator('#homePage')).toBeHidden();
  });

  test('has username field', async ({ page }) => {
    await expect(page.locator('#username')).toBeVisible();
  });

  test('has password field', async ({ page }) => {
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
  });

  test('has Login button', async ({ page }) => {
    await expect(page.locator('#loginBtn')).toBeVisible();
  });

  test('has Reset button', async ({ page }) => {
    await expect(page.locator('#resetBtn')).toBeVisible();
  });

  test('username field has focus on page load', async ({ page }) => {
    await expect(page.locator('#username')).toBeFocused();
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

test.describe('Validation', () => {
  test('shows error when both fields are empty', async ({ page }) => {
    await page.locator('#loginBtn').click();
    await expect(page.locator('#usernameErr')).toContainText('required');
    await expect(page.locator('#passwordErr')).toContainText('required');
  });

  test('shows error when username is empty', async ({ page }) => {
    await page.locator('#password').fill('somepass');
    await page.locator('#loginBtn').click();
    await expect(page.locator('#usernameErr')).toContainText('required');
    await expect(page.locator('#passwordErr')).toBeEmpty();
  });

  test('shows error when password is empty', async ({ page }) => {
    await page.locator('#username').fill('demo');
    await page.locator('#loginBtn').click();
    await expect(page.locator('#passwordErr')).toContainText('required');
    await expect(page.locator('#usernameErr')).toBeEmpty();
  });

  test('sets aria-invalid on empty username', async ({ page }) => {
    await page.locator('#loginBtn').click();
    await expect(page.locator('#username')).toHaveAttribute('aria-invalid', 'true');
  });

  test('sets aria-invalid on empty password', async ({ page }) => {
    await page.locator('#username').fill('demo');
    await page.locator('#loginBtn').click();
    await expect(page.locator('#password')).toHaveAttribute('aria-invalid', 'true');
  });

  test('clears validation errors on Reset', async ({ page }) => {
    await page.locator('#loginBtn').click();
    await expect(page.locator('#usernameErr')).toContainText('required');
    await page.locator('#resetBtn').click();
    await expect(page.locator('#usernameErr')).toBeEmpty();
    await expect(page.locator('#passwordErr')).toBeEmpty();
  });
});

// ---------------------------------------------------------------------------
// Reset button
// ---------------------------------------------------------------------------

test.describe('Reset button', () => {
  test('clears username and password fields', async ({ page }) => {
    await page.locator('#username').fill('demo');
    await page.locator('#password').fill('somepass');
    await page.locator('#resetBtn').click();
    await expect(page.locator('#username')).toHaveValue('');
    await expect(page.locator('#password')).toHaveValue('');
  });

  test('returns focus to username after reset', async ({ page }) => {
    await page.locator('#username').fill('demo');
    await page.locator('#resetBtn').click();
    await expect(page.locator('#username')).toBeFocused();
  });
});

// ---------------------------------------------------------------------------
// Successful login
// ---------------------------------------------------------------------------

test.describe('Successful login', () => {
  test('navigates to home page on valid credentials', async ({ page }) => {
    await page.locator('#username').fill(VALID_USER);
    await page.locator('#password').fill(VALID_PASS);
    await page.locator('#loginBtn').click();
    await expect(page.locator('#homePage')).toBeVisible();
    await expect(page.locator('#loginPage')).toBeHidden();
  });

  test('shows welcome message with username', async ({ page }) => {
    await page.locator('#username').fill(VALID_USER);
    await page.locator('#password').fill(VALID_PASS);
    await page.locator('#loginBtn').click();
    await expect(page.locator('#welcomeMsg')).toContainText(VALID_USER);
  });

  test('password field is cleared after login', async ({ page }) => {
    await page.locator('#username').fill(VALID_USER);
    await page.locator('#password').fill(VALID_PASS);
    await page.locator('#loginBtn').click();
    await expect(page.locator('#homePage')).toBeVisible();
    // Navigate back — password must be empty
    await page.locator('#logoutBtn').click();
    await expect(page.locator('#password')).toHaveValue('');
  });

  test('home page has Logout button', async ({ page }) => {
    await page.locator('#username').fill(VALID_USER);
    await page.locator('#password').fill(VALID_PASS);
    await page.locator('#loginBtn').click();
    await expect(page.locator('#logoutBtn')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Invalid credentials
// ---------------------------------------------------------------------------

test.describe('Invalid credentials', () => {
  test('shows generic error on wrong password', async ({ page }) => {
    await page.locator('#username').fill(VALID_USER);
    await page.locator('#password').fill('WrongPass99!');
    await page.locator('#loginBtn').click();
    await expect(page.locator('#status')).toContainText('Invalid');
    await expect(page.locator('#loginPage')).toBeVisible();
  });

  test('shows generic error on unknown username', async ({ page }) => {
    await page.locator('#username').fill('unknownuser');
    await page.locator('#password').fill('SomePass1!');
    await page.locator('#loginBtn').click();
    await expect(page.locator('#status')).toContainText('Invalid');
  });

  test('does not reveal whether username exists', async ({ page }) => {
    await page.locator('#username').fill('unknownuser');
    await page.locator('#password').fill('WrongPass99!');
    await page.locator('#loginBtn').click();
    const msg = await page.locator('#status').textContent();
    expect(msg).not.toContain('username');
    expect(msg).not.toContain('not found');
    expect(msg).not.toContain('does not exist');
  });

  test('clears password field after failed login', async ({ page }) => {
    await page.locator('#username').fill(VALID_USER);
    await page.locator('#password').fill('WrongPass99!');
    await page.locator('#loginBtn').click();
    await expect(page.locator('#status')).toContainText('Invalid');
    await expect(page.locator('#password')).toHaveValue('');
  });
});

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

test.describe('Logout', () => {
  test('returns to login page after logout', async ({ page }) => {
    await page.locator('#username').fill(VALID_USER);
    await page.locator('#password').fill(VALID_PASS);
    await page.locator('#loginBtn').click();
    await expect(page.locator('#homePage')).toBeVisible();
    await page.locator('#logoutBtn').click();
    await expect(page.locator('#loginPage')).toBeVisible();
    await expect(page.locator('#homePage')).toBeHidden();
  });

  test('focuses username field after logout', async ({ page }) => {
    await page.locator('#username').fill(VALID_USER);
    await page.locator('#password').fill(VALID_PASS);
    await page.locator('#loginBtn').click();
    await page.locator('#logoutBtn').click();
    await expect(page.locator('#username')).toBeFocused();
  });

  test('session is invalidated after logout', async ({ page }) => {
    await page.locator('#username').fill(VALID_USER);
    await page.locator('#password').fill(VALID_PASS);
    await page.locator('#loginBtn').click();
    await page.locator('#logoutBtn').click();
    // Reload — should stay on login (session gone)
    await page.reload();
    await expect(page.locator('#loginPage')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Session persistence
// ---------------------------------------------------------------------------

test.describe('Session persistence', () => {
  test('restores home page on reload when session is active', async ({ page }) => {
    await page.locator('#username').fill(VALID_USER);
    await page.locator('#password').fill(VALID_PASS);
    await page.locator('#loginBtn').click();
    await expect(page.locator('#homePage')).toBeVisible();
    await page.reload();
    await expect(page.locator('#homePage')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

test.describe('Accessibility', () => {
  test('username input has a visible label', async ({ page }) => {
    const label = page.locator('label[for="username"]');
    await expect(label).toBeVisible();
  });

  test('password input has a visible label', async ({ page }) => {
    const label = page.locator('label[for="password"]');
    await expect(label).toBeVisible();
  });

  test('status region has aria-live attribute', async ({ page }) => {
    await expect(page.locator('#status')).toHaveAttribute('aria-live', 'polite');
  });

  test('username error linked via aria-describedby', async ({ page }) => {
    await expect(page.locator('#username')).toHaveAttribute('aria-describedby', 'usernameErr');
  });

  test('password error linked via aria-describedby', async ({ page }) => {
    await expect(page.locator('#password')).toHaveAttribute('aria-describedby', 'passwordErr');
  });

  test('can submit login form with Enter key', async ({ page }) => {
    await page.locator('#username').fill(VALID_USER);
    await page.locator('#password').fill(VALID_PASS);
    await page.locator('#password').press('Enter');
    await expect(page.locator('#homePage')).toBeVisible();
  });
});
