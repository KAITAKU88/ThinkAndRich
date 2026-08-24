import { test, expect } from "@playwright/test";
import { readOtpFromLocalKv } from "./helpers/otp";

test.describe("Email OTP login", () => {
  test("full login → reload persists session → logout", async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;

    await page.goto("/");
    await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.getByLabel("Địa chỉ Email của bạn").fill(email);
    await page.getByRole("button", { name: "Nhận mã xác thực OTP" }).click();

    await expect(page.getByLabel("Mã xác thực OTP (6 chữ số)")).toBeVisible();
    const code = readOtpFromLocalKv(email);
    await page.getByLabel("Mã xác thực OTP (6 chữ số)").fill(code);
    await page.getByRole("button", { name: /Xác nhận/ }).click();

    // Dialog closes and the anonymous "Đăng nhập" CTA disappears once
    // `user` is set (src/components/layout/Header.tsx renders it only
    // when !user).
    await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeHidden();

    // Session must survive a reload via the httpOnly cookie (restoreSession
    // in SiteShell.tsx), not just in-memory state.
    await page.reload();
    await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeHidden();

    // Logout, from the profile page (src/components/profile/ProfilePage.tsx).
    await page.goto("/profile");
    await page.getByRole("button", { name: "Đăng xuất thiết bị này" }).click();
    await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeVisible();
  });

  test("wrong OTP code is rejected with an error toast", async ({ page }) => {
    const email = `e2e-wrong-${Date.now()}@example.com`;
    await page.goto("/");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.getByLabel("Địa chỉ Email của bạn").fill(email);
    await page.getByRole("button", { name: "Nhận mã xác thực OTP" }).click();
    await expect(page.getByLabel("Mã xác thực OTP (6 chữ số)")).toBeVisible();

    await page.getByLabel("Mã xác thực OTP (6 chữ số)").fill("000000");
    await page.getByRole("button", { name: /Xác nhận/ }).click();

    await expect(page.getByText(/Mã OTP không chính xác/)).toBeVisible();
    // Still logged out.
    await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeVisible();
  });
});
