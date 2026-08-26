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
  // Several specs shell out to `npx wrangler` two or three times each — to
  // read the OTP back out of the local KV simulator, clear its throttling
  // counters, or set up a subscription term — and each invocation costs
  // seconds of process startup before `next dev` has even been asked for a
  // page. Add a cold route compile or two on top and the 30s default is not
  // a budget, it is a coin toss.
  timeout: 120_000,
  // Nearly every assertion in this suite is waiting on a `next dev` round
  // trip — an OTP verify, a logout, a route being compiled on first hit —
  // and those routinely run past Playwright's 5s default. Raising it once
  // here beats scattering per-assertion overrides, which is what this suite
  // had started to accumulate and which only ever moves the next flake
  // somewhere else.
  expect: { timeout: 20_000 },
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
