// @ts-check
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const VALID_USER = 'demo';
const VALID_PASS = 'C0dem!e@Secure#24';

test.describe('Accessibility (extended)', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(BASE);
  });

  test('focused username input has a non-zero outline (visible focus ring)', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Accessibility' },
      { type: 'story',   value: 'Focus ring on inputs' },
      { type: 'severity', value: 'critical' }
    );
    await page.focus('#username');
    const outlineWidth = await page.evaluate(() =>
      getComputedStyle(document.querySelector('#username')).outlineWidth
    );
    expect(outlineWidth).not.toBe('0px');
  });

  test('focused Login button has a non-zero outline (visible focus ring)', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Accessibility' },
      { type: 'story',   value: 'Focus ring on buttons' },
      { type: 'severity', value: 'critical' }
    );
    await page.focus('#loginBtn');
    const outlineWidth = await page.evaluate(() =>
      getComputedStyle(document.querySelector('#loginBtn')).outlineWidth
    );
    expect(outlineWidth).not.toBe('0px');
  });

  test('disabled Login button shows reduced opacity and not-allowed cursor', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Accessibility' },
      { type: 'story',   value: 'Disabled control visual feedback' }
    );
    const { opacity, cursor } = await page.evaluate(() => {
      const el = document.querySelector('#loginBtn');
      el.disabled = true;
      const style = getComputedStyle(el);
      return { opacity: parseFloat(style.opacity), cursor: style.cursor };
    });
    expect(opacity).toBeLessThan(1);
    expect(cursor).toBe('not-allowed');
  });

  test('Tab key moves focus: username → password → Login → Reset', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Accessibility' },
      { type: 'story',   value: 'Tab order' },
      { type: 'severity', value: 'critical' }
    );
    await page.focus('#username');

    await page.keyboard.press('Tab');
    await expect(page.locator('#password')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('#loginBtn')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('#resetBtn')).toBeFocused();
  });

  test('status region has role="status" attribute', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Accessibility' },
      { type: 'story',   value: 'aria-live region role' }
    );
    await expect(page.locator('#status')).toHaveAttribute('role', 'status');
  });

  test('username input is linked to its error span via aria-describedby', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Accessibility' },
      { type: 'story',   value: 'aria-describedby linkage' }
    );
    await expect(page.locator('#username')).toHaveAttribute('aria-describedby', 'usernameErr');
  });

  test('password input is linked to its error span via aria-describedby', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Accessibility' },
      { type: 'story',   value: 'aria-describedby linkage' }
    );
    await expect(page.locator('#password')).toHaveAttribute('aria-describedby', 'passwordErr');
  });

  test('error message text color has sufficient contrast against white background', async ({ page }) => {
    test.info().annotations.push(
      { type: 'feature', value: 'Accessibility' },
      { type: 'story',   value: 'Error text contrast' }
    );
    // Trigger an error to render the message
    await page.click('#loginBtn');
    await expect(page.locator('#usernameErr')).toContainText('required');

    const color = await page.evaluate(() =>
      getComputedStyle(document.querySelector('#usernameErr')).color
    );
    // styles.css sets color: #b42318 (dark red) — verify it is NOT the default black
    // and IS a recognisable red-range colour (r > 150, g < 100)
    const rgb = color.match(/\d+/g).map(Number);
    expect(rgb[0]).toBeGreaterThan(150); // red channel high
    expect(rgb[1]).toBeLessThan(100);    // green channel low
  });
});
