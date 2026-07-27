// @ts-check
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const VALID_USER = 'demo';
const VALID_PASS = 'C0dem!e@Secure#24';

test.describe('Network & timeout errors', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('network failure shows "Unable to connect. Please try again."', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Network Errors' },
      { type: 'story',   value: 'Network failure message' },
      { type: 'severity', value: 'critical' }
    );
    await page.goto(BASE);
    await page.route('/api/login', route => route.abort());

    await page.fill('#username', VALID_USER);
    await page.fill('#password', VALID_PASS);
    await page.click('#loginBtn');

    await expect(page.locator('#status')).toContainText('Unable to connect. Please try again.');
    await expect(page.locator('#loginPage')).toBeVisible();
  });

  test('request timeout shows "Request timed out. Please try again."', async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: 'feature', value: 'Network Errors' },
      { type: 'story',   value: 'AbortController 10 s timeout' },
      { type: 'severity', value: 'critical' }
    );
    // Route that never responds so the 10 s AbortController fires
    await page.route('/api/login', async route => {
      // Hold for 30 s real time — the fake clock tick will fire the AbortController first
      await new Promise(r => setTimeout(r, 30_000));
      route.abort();
    });

    await page.goto(BASE);

    // Install fake clock after page load (session check already completed with real timers)
    await page.clock.install();

    await page.fill('#username', VALID_USER);
    await page.fill('#password', VALID_PASS);
    await page.click('#loginBtn');

    // Advance fake time 11 s to trigger the 10 s AbortController in apiFetch
    await page.clock.fastForward(11_000);

    await expect(page.locator('#status')).toContainText('Request timed out. Please try again.');
  }, { timeout: 20_000 });
});
