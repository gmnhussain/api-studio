import { defineConfig, devices } from "@playwright/test";

/** Port of the production server the suite runs against. */
const E2E_PORT = 3200;
const isContinuousIntegration = Boolean(process.env.CI);

/**
 * End-to-end tests (docs/development/testing.md#e2e-journeys-v01) against a production build, so
 * budgets and behaviour are measured on what ships. Chromium always runs; Firefox and WebKit
 * join when PLAYWRIGHT_ALL_BROWSERS is set (CI on main and develop).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isContinuousIntegration,
  retries: isContinuousIntegration ? 2 : 0,
  reporter: isContinuousIntegration ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${String(E2E_PORT)}`,
    trace: "retain-on-failure",
    colorScheme: "dark",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    ...(process.env.PLAYWRIGHT_ALL_BROWSERS
      ? [
          {
            name: "firefox",
            use: { ...devices["Desktop Firefox"], viewport: { width: 1440, height: 900 } },
          },
          {
            name: "webkit",
            use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 900 } },
          },
        ]
      : []),
  ],
  webServer: {
    // Turborepo builds the app before test:e2e (turbo.json); this only starts it.
    command: `pnpm exec next start --port ${String(E2E_PORT)}`,
    url: `http://localhost:${String(E2E_PORT)}/settings/about`,
    reuseExistingServer: !isContinuousIntegration,
    timeout: 120_000,
  },
});
