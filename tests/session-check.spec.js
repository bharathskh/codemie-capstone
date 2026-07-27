// @ts-check
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const VALID_USER = 'demo';
const VALID_PASS = 'C0dem!e@Secure#24';

test.describe('Session check on load', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('shows home page when an active session cookie exists', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Session' },
      { type: 'story',   value: 'Active session restored on load' },
      { type: 'severity', value: 'critical' }
    );
    // Create a real session first
    await page.goto(BASE);
    await page.fill('#username', VALID_USER);
    await page.fill('#password', VALID_PASS);
    await page.click('#loginBtn');
    await expect(page.locator('#homePage')).toBeVisible();

    // Reload — session should be restored
    await page.reload();
    await expect(page.locator('#homePage')).toBeVisible();
    await expect(page.locator('#loginPage')).toBeHidden();
  });

  test('shows login page when /api/session returns unauthenticated', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Session' },
      { type: 'story',   value: 'Unauthenticated session shows login' }
    );
    await page.route('/api/session', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: false }),
      })
    );
    await page.goto(BASE);
    await expect(page.locator('#loginPage')).toBeVisible();
    await expect(page.locator('#homePage')).toBeHidden();
  });

  test('falls back to login page when /api/session throws a network error', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Session' },
      { type: 'story',   value: 'Network error falls back to login' }
    );
    await page.route('/api/session', route => route.abort());
    await page.goto(BASE);
    await expect(page.locator('#loginPage')).toBeVisible();
  });
});
