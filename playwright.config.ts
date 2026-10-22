import { defineConfig, devices } from "@playwright/test";

const chrome = {
  ...devices["Desktop Chrome"],
  channel: "chrome" as const,
  launchOptions: {
    args: ["--autoplay-policy=no-user-gesture-required"],
  },
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? "github" : "line",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    ...chrome,
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "smoke", testMatch: /smoke\.spec\.ts/ },
    {
      name: "desktop",
      testMatch: /desktop\.spec\.ts/,
      use: { ...chrome, viewport: { width: 1280, height: 900 } },
    },
    {
      name: "mobile",
      testMatch: /mobile\.spec\.ts/,
      use: {
        ...chrome,
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
