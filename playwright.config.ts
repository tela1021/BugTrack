import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://[::1]:3009';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev:bugtrack',
    url: `${baseURL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
