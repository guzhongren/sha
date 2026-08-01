import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);
const e2ePort = Number(process.env.E2E_PORT ?? 4322);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${e2ePort}`,
    trace: "on-first-retry",
    permissions: ["clipboard-read", "clipboard-write"],
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 5"],
      },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: `pnpm preview --port ${e2ePort}`,
    url: `http://127.0.0.1:${e2ePort}`,
    // Never reuse a foreign server: an unrelated process may already be
    // listening on the port and would silently serve wrong content.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
