import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration for Bid System frontend.
 *
 * - Automatically starts the Vite dev server before tests
 * - Tests run against http://localhost:3000
 * - Uses Chromium only (can add Firefox/WebKit later)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        /* Slow down actions so you can observe (only in headed mode) */
        launchOptions: {
          slowMo: process.env.SLOW ? Number(process.env.SLOW) : undefined,
        },
      },
    },
  ],

  /* Start the Vite dev server before running tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
