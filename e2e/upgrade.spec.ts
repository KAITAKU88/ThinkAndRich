import { test, expect } from "@playwright/test";
import { signInAsReader } from "./helpers/auth";

test.setTimeout(120_000);

test.describe("Credit packages", () => {
  test("pricing page lists the three credit packages", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: "1.500 credit" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "4.500 credit" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "10.000 credit" })).toBeVisible();
  });

  test("upgrade endpoint is gone", async ({ page }) => {
    await signInAsReader(page, `e2e-credit-${Date.now()}@example.com`);
    const res = await page.request.get("/api/upgrade?country=VN");
    expect(res.status()).toBe(410);
  });
});
