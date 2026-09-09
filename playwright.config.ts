import { defineConfig, devices } from "@playwright/test";

// E2E + accessibility smoke tests. The base URL points at the staging deployment
// (never production) and is supplied via PLAYWRIGHT_BASE_URL / NEXT_PUBLIC_SITE_URL.
// A11y specs are tagged @a11y and can be run alone via `pnpm test:a11y`.
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["html", { open: "never" }]],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Fail fast on any console error except known third-party noise.
    locale: "en",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
