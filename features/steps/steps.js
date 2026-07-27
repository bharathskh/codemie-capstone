// @ts-check
import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

const VALID_PASS = 'C0dem!e@Secure#24';

// ── State shared within a single scenario (reset between tests via closure) ──
let capturedLoginRequest = null;
let capturedLoginResponse = null;
let alertFired = false;

// ── Given ────────────────────────────────────────────────────────────────────

Given('I am on the login page', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/');
});

Given('I am logged in as {string}', async ({ page }, username) => {
  await page.context().clearCookies();
  await page.goto('/');
  await page.fill('#username', username);
  await page.fill('#password', VALID_PASS);
  await page.click('#loginBtn');
  await expect(page.locator('#homePage')).toBeVisible();
});

Given('I fill {string} with {string}', async ({ page }, selector, value) => {
  await page.fill(selector, value);
});


Given('the login API will respond with status {int}', async ({ page }, status) => {
  await page.route('/api/login', route =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'LOCKOUT', message: 'Too many failed attempts.' } }),
    })
  );
});

Given('the session API returns username {string}', async ({ page }, username) => {
  alertFired = false;
  page.on('dialog', async dialog => {
    alertFired = true;
    await dialog.dismiss();
  });
  await page.route('/api/session', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ authenticated: true, username }),
    })
  );
  // Reload so the mocked session takes effect
  await page.goto('/');
  // Wait for the page to settle — any onerror XSS would fire here
  await expect(page.locator('#homePage')).toBeVisible();
});

Given('I capture the next login request', async ({ page }) => {
  capturedLoginRequest = null;
  capturedLoginResponse = null;
  await page.route('/api/login', async route => {
    capturedLoginRequest = {
      method: route.request().method(),
      url: route.request().url(),
      body: route.request().postData(),
    };
    const response = await route.fetch();
    capturedLoginResponse = response;
    await route.fulfill({ response });
  });
});

// ── When ─────────────────────────────────────────────────────────────────────

When('I click the {string} button', async ({ page }, buttonName) => {
  await page.getByRole('button', { name: buttonName }).click();
});

When('I reload the page', async ({ page }) => {
  await page.reload();
});

When('I press {string} in the {string} field', async ({ page }, key, selector) => {
  await page.locator(selector).press(key);
});

When('I press Tab {int} times starting from {string}', async ({ page }, count, selector) => {
  await page.focus(selector);
  for (let i = 0; i < count; i++) {
    await page.keyboard.press('Tab');
  }
});

When('{string} receives focus', async ({ page }, selector) => {
  await page.focus(selector);
});


// ── Then ─────────────────────────────────────────────────────────────────────

Then('{string} is visible', async ({ page }, selector) => {
  await expect(page.locator(selector)).toBeVisible();
});

Then('{string} is hidden', async ({ page }, selector) => {
  await expect(page.locator(selector)).toBeHidden();
});

Then('{string} contains {string}', async ({ page }, selector, text) => {
  await expect(page.locator(selector)).toContainText(text);
});

Then('{string} does not contain {string}', async ({ page }, selector, text) => {
  await expect(page.locator(selector)).not.toContainText(text);
});

Then('{string} has value {string}', async ({ page }, selector, value) => {
  await expect(page.locator(selector)).toHaveValue(value);
});

Then('{string} has attribute {string} equal to {string}', async ({ page }, selector, attr, value) => {
  await expect(page.locator(selector)).toHaveAttribute(attr, value);
});

Then('{string} has focus', async ({ page }, selector) => {
  await expect(page.locator(selector)).toBeFocused();
});

Then('{string} is empty text', async ({ page }, selector) => {
  const text = await page.locator(selector).textContent();
  expect(text?.trim() ?? '').toBe('');
});

Then('the page contains text {string}', async ({ page }, text) => {
  await expect(page.getByText(text, { exact: false })).toBeVisible();
});

Then('a label with for {string} is visible', async ({ page }, forValue) => {
  await expect(page.locator(`label[for="${forValue}"]`)).toBeVisible();
});

Then('{string} has a non-zero outline', async ({ page }, selector) => {
  const outlineWidth = await page.evaluate(
    sel => getComputedStyle(document.querySelector(sel)).outlineWidth,
    selector
  );
  expect(outlineWidth).not.toBe('0px');
});

// Security — XSS
Then('no script alert was triggered', async ({}) => {
  expect(alertFired).toBe(false);
});

Then('{string} renders as plain text without child elements', async ({ page }, selector) => {
  // No child DOM elements should exist (an <img> injected by XSS would appear here)
  const childCount = await page.locator(`${selector} *`).count();
  expect(childCount).toBe(0);
  // The raw payload string should appear as text content
  const text = await page.locator(selector).textContent();
  expect(text).toContain('<');
});

// Security — HttpOnly cookie
Then('"document.cookie" does not expose the session token', async ({ page }) => {
  const cookieString = await page.evaluate(() => document.cookie);
  expect(cookieString).not.toContain('session');
});

// Security — request capture
Then('the captured request used method {string}', async ({}, expectedMethod) => {
  expect(capturedLoginRequest).not.toBeNull();
  expect(capturedLoginRequest.method).toBe(expectedMethod);
});

Then('the captured request URL does not contain {string}', async ({}, text) => {
  expect(capturedLoginRequest).not.toBeNull();
  expect(capturedLoginRequest.url).not.toContain(text);
});

// Security — Cache-Control
Then('the login response has {string} header containing {string}', async ({ page }, header, value) => {
  let loginResponse = null;
  page.on('response', res => {
    if (res.url().includes('/api/login')) loginResponse = res;
  });
  // Wait a tick to ensure the response listener was registered
  // (response already happened — check via a fresh request instead)
  const response = await page.request.post('/api/login', {
    data: { username: 'demo', password: VALID_PASS },
  });
  const headerValue = response.headers()[header.toLowerCase()];
  expect(headerValue).toContain(value);
});
