import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // tests share one D1/KV backend; avoid cross-test races
  workers: 1, // fullyParallel:false only serializes within a file — multiple spec files still ran concurrently against the same D1/KV without this
  // 1 retry: `next dev` occasionally drops the session cookie on a full
  // page reload (~1-in-5, reproduced with a raw Playwright script outside
  // the test runner too) — a next-dev-specific timing issue, not present
  // when hitting the same routes with curl. Unrelated to app logic; a
  // production Workers build wouldn't have this dev-only reload path.
  retries: 1,
  // The admin tests shell out to `npx wrangler` two or three times each to
  // read the OTP back out of the local KV simulator and clear its throttling
  // counters, and process startup alone eats a large part of the 30s default.
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: "pipe",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
