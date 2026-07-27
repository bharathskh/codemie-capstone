// @ts-check
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const VALID_USER = 'demo';
const VALID_PASS = 'C0dem!e@Secure#24';

test.describe('Loading state & double-submit prevention', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(BASE);
  });

  test('Login button label changes to "Signing in…" during in-flight request', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Loading State' },
      { type: 'story',   value: 'Button label during request' },
      { type: 'severity', value: 'normal' }
    );
    let releaseRequest;
    await page.route('/api/login', async route => {
      await new Promise(resolve => { releaseRequest = resolve; });
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ authenticated: true, username: 'demo' }) });
    });

    await page.fill('#username', VALID_USER);
    await page.fill('#password', VALID_PASS);
    await page.click('#loginBtn');

    await expect(page.locator('#loginBtn')).toHaveText('Signing in…');

    releaseRequest();
    await expect(page.locator('#homePage')).toBeVisible();
  });

  test('all form controls are disabled while a login request is in flight', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Loading State' },
      { type: 'story',   value: 'Double-submit prevention' },
      { type: 'severity', value: 'critical' }
    );
    let releaseRequest;
    await page.route('/api/login', async route => {
      await new Promise(resolve => { releaseRequest = resolve; });
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ authenticated: true, username: 'demo' }) });
    });

    await page.fill('#username', VALID_USER);
    await page.fill('#password', VALID_PASS);
    await page.click('#loginBtn');

    await expect(page.locator('#loginBtn')).toBeDisabled();
    await expect(page.locator('#resetBtn')).toBeDisabled();
    await expect(page.locator('#username')).toBeDisabled();
    await expect(page.locator('#password')).toBeDisabled();

    releaseRequest();
    await expect(page.locator('#homePage')).toBeVisible();
  });

  test('form controls are re-enabled and button text restored after a failed login', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Loading State' },
      { type: 'story',   value: 'Controls re-enabled after failure' }
    );
    await page.fill('#username', VALID_USER);
    await page.fill('#password', 'WrongPass99!');
    await page.click('#loginBtn');

    await expect(page.locator('#status')).toContainText('Invalid');
    await expect(page.locator('#loginBtn')).toBeEnabled();
    await expect(page.locator('#loginBtn')).toHaveText('Login');
    await expect(page.locator('#username')).toBeEnabled();
    await expect(page.locator('#password')).toBeEnabled();
    await expect(page.locator('#resetBtn')).toBeEnabled();
  });

  test('HTTP 423 lockout response shows rate-limit message', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Loading State' },
      { type: 'story',   value: 'Brute-force lockout message' },
      { type: 'severity', value: 'critical' }
    );
    await page.route('/api/login', route =>
      route.fulfill({
        status: 423,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'LOCKOUT', message: 'Too many failed attempts.' } }),
      })
    );

    await page.fill('#username', VALID_USER);
    await page.fill('#password', 'WrongPass99!');
    await page.click('#loginBtn');

    await expect(page.locator('#status')).toContainText('Too many failed attempts. Please try again later.');
  });
});
