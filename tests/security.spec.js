// @ts-check
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const VALID_USER = 'demo';
const VALID_PASS = 'C0dem!e@Secure#24';

test.describe('Security (client-side)', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('XSS payload in username is rendered as text, not executed HTML', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Security' },
      { type: 'story',   value: 'XSS via textContent' },
      { type: 'severity', value: 'blocker' }
    );
    const xssPayload = '<img src=x onerror=alert(1)>';

    let alertFired = false;
    page.on('dialog', async dialog => {
      alertFired = true;
      await dialog.dismiss();
    });

    // Mock the session so the app lands on the Home page with an XSS username
    await page.route('/api/session', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: true, username: xssPayload }),
      })
    );

    await page.goto(BASE);
    await expect(page.locator('#homePage')).toBeVisible();

    // No alert should have fired
    expect(alertFired).toBe(false);

    // The raw string should appear as text content (not parsed as HTML)
    const welcomeText = await page.locator('#welcomeMsg').textContent();
    expect(welcomeText).toContain(xssPayload);

    // The img tag must NOT exist as a DOM element
    const imgCount = await page.locator('#welcomeMsg img').count();
    expect(imgCount).toBe(0);
  });

  test('session cookie is not accessible via document.cookie (HttpOnly)', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Security' },
      { type: 'story',   value: 'HttpOnly session cookie' },
      { type: 'severity', value: 'blocker' }
    );
    await page.goto(BASE);
    await page.fill('#username', VALID_USER);
    await page.fill('#password', VALID_PASS);
    await page.click('#loginBtn');
    await expect(page.locator('#homePage')).toBeVisible();

    // document.cookie must not expose the session cookie set with HttpOnly
    const cookieString = await page.evaluate(() => document.cookie);
    expect(cookieString).not.toContain('session');
  });

  test('login credentials are sent as JSON, not in the URL query string', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Security' },
      { type: 'story',   value: 'Credentials not in URL' },
      { type: 'severity', value: 'critical' }
    );
    let loginRequest;
    await page.route('/api/login', async route => {
      loginRequest = route.request();
      await route.continue();
    });

    await page.goto(BASE);
    await page.fill('#username', VALID_USER);
    await page.fill('#password', VALID_PASS);
    await page.click('#loginBtn');
    await expect(page.locator('#homePage')).toBeVisible();

    // Method must be POST, not GET
    expect(loginRequest.method()).toBe('POST');

    // URL must not contain credentials
    expect(loginRequest.url()).not.toContain(VALID_USER);
    expect(loginRequest.url()).not.toContain(VALID_PASS);

    // Content-Type must be application/json
    expect(loginRequest.headers()['content-type']).toContain('application/json');
  });

  test('Cache-Control: no-store is set on /api/login response', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Security' },
      { type: 'story',   value: 'Auth response not cached' },
      { type: 'severity', value: 'critical' }
    );
    let loginResponse;
    page.on('response', response => {
      if (response.url().includes('/api/login')) loginResponse = response;
    });

    await page.goto(BASE);
    await page.fill('#username', VALID_USER);
    await page.fill('#password', VALID_PASS);
    await page.click('#loginBtn');
    await expect(page.locator('#homePage')).toBeVisible();

    expect(loginResponse).toBeDefined();
    const cacheControl = loginResponse.headers()['cache-control'];
    expect(cacheControl).toContain('no-store');
  });
});
