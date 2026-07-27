// @ts-check
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'features/steps/**/*.js',
});

export default defineConfig({
  testDir,
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'bdd-html-report', open: 'never' }],
    ['allure-playwright', { resultsDir: 'allure-results-bdd', suiteTitle: false }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'node src/server.js',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 10000,
  },
});
