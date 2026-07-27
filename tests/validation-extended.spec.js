// @ts-check
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const VALID_PASS = 'C0dem!e@Secure#24';

test.describe('Validation (extended)', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(BASE);
  });

  test('whitespace-only username is treated as empty and shows required error', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Validation' },
      { type: 'story',   value: 'Username whitespace trimming' }
    );
    await page.fill('#username', '   ');
    await page.fill('#password', VALID_PASS);
    await page.click('#loginBtn');
    await expect(page.locator('#usernameErr')).toContainText('Username is required.');
    await expect(page.locator('#loginPage')).toBeVisible();
  });

  test('aria-invalid on username is absent after valid re-submission', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Validation' },
      { type: 'story',   value: 'aria-invalid cleared on correction' }
    );
    // Trigger validation error
    await page.click('#loginBtn');
    await expect(page.locator('#username')).toHaveAttribute('aria-invalid', 'true');

    // Correct the field and re-submit (validate() calls clearErrors() first)
    await page.fill('#username', 'demo');
    await page.fill('#password', VALID_PASS);
    await page.click('#loginBtn');

    await expect(page.locator('#homePage')).toBeVisible();
    await expect(page.locator('#username')).not.toHaveAttribute('aria-invalid');
  });

  test('focus moves to username field when both fields are empty on submit', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Validation' },
      { type: 'story',   value: 'Focus management — first invalid field' }
    );
    await page.click('#loginBtn');
    await expect(page.locator('#username')).toBeFocused();
  });

  test('focus moves to password field when only password is empty on submit', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Validation' },
      { type: 'story',   value: 'Focus management — password field' }
    );
    await page.fill('#username', 'demo');
    await page.click('#loginBtn');
    await expect(page.locator('#password')).toBeFocused();
  });

  test('username is trimmed before being sent to the server', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Validation' },
      { type: 'story',   value: 'Username trimming in POST body' },
      { type: 'severity', value: 'normal' }
    );
    let capturedBody;
    await page.route('/api/login', async route => {
      capturedBody = JSON.parse(route.request().postData() || '{}');
      await route.continue();
    });

    await page.fill('#username', '  demo  ');
    await page.fill('#password', VALID_PASS);
    await page.click('#loginBtn');

    await expect(page.locator('#homePage')).toBeVisible();
    expect(capturedBody.username).toBe('demo');
  });

  test('password field is NOT trimmed — leading/trailing spaces preserved', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Validation' },
      { type: 'story',   value: 'Password not trimmed' }
    );
    let capturedBody;
    await page.route('/api/login', async route => {
      capturedBody = JSON.parse(route.request().postData() || '{}');
      // Reject — we only care about the sent body
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Invalid username or password.' } }) });
    });

    const passwordWithSpaces = '  padded  ';
    await page.fill('#username', 'demo');
    await page.fill('#password', passwordWithSpaces);
    await page.click('#loginBtn');

    await expect(page.locator('#status')).toContainText('Invalid');
    expect(capturedBody.password).toBe(passwordWithSpaces);
  });
});
