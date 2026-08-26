import { test, expect } from "@playwright/test";
import { readOtpFromLocalKv, resetOtpThrottle } from "./helpers/otp";

test.describe("Email OTP login", () => {
  test("full login → reload persists session → logout", async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    // The per-IP OTP limit is shared by every local test run — see
    // resetOtpThrottle.
    resetOtpThrottle(email);

    await page.goto("/");
    await expect(page.getByTestId("login-cta")).toBeVisible();

    await page.getByTestId("login-cta").click();
    await page.locator("#auth-email").fill(email);
    await page.getByTestId("auth-send-otp").click();

    await expect(page.locator("#auth-otp")).toBeVisible();
    const code = readOtpFromLocalKv(email);
    await page.locator("#auth-otp").fill(code);
    await page.getByTestId("auth-verify-otp").click();

    // Dialog closes and the anonymous login CTA disappears once
    // `user` is set (src/components/layout/Header.tsx renders it only
    // when !user).
    await expect(page.getByTestId("login-cta")).toBeHidden();

    // Session must survive a reload via the httpOnly cookie (restoreSession
    // in SiteShell.tsx), not just in-memory state.
    await page.reload();
    await expect(page.getByTestId("login-cta")).toBeHidden();

    // Logout, from the profile page (src/components/profile/ProfilePage.tsx).
    // It lives on the account tab, which is not the one the page opens on.
    await page.goto("/profile");
    await page.getByTestId("profile-tab-account").click();
    await page.getByTestId("logout-btn").click();
    await expect(page.getByTestId("login-cta")).toBeVisible();
  });

  test("wrong OTP code is rejected with an error toast", async ({ page }) => {
    const email = `e2e-wrong-${Date.now()}@example.com`;
    resetOtpThrottle(email);
    await page.goto("/");
    await page.getByTestId("login-cta").click();
    await page.locator("#auth-email").fill(email);
    await page.getByTestId("auth-send-otp").click();
    await expect(page.locator("#auth-otp")).toBeVisible();

    await page.locator("#auth-otp").fill("000000");
    await page.getByTestId("auth-verify-otp").click();

    await expect(page.getByText(/Mã OTP không chính xác/)).toBeVisible();
    // Still logged out.
    await expect(page.getByTestId("login-cta")).toBeVisible();
  });
});
