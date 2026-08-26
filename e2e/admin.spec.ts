import { test, expect } from "@playwright/test";
import { readConfiguredAdminEmail, readOtpFromLocalKv, resetOtpThrottle } from "./helpers/otp";

test.describe("Admin gate", () => {
  test("redirects /admin to a dedicated login page while logged out", async ({ page }) => {
    await page.goto("/admin");
    // Server-side middleware gate (src/middleware.ts), not just a
    // client-side check — anonymous visitors never see admin UI at all.
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole("heading", { name: "Đăng nhập Quản trị" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Đăng nhập bằng Email OTP" })).toBeVisible();
  });

  test("a non-admin account is denied and stays on the login page", async ({ page }) => {
    // Must not contain the substring "admin" — src/app/api/auth/verify-otp
    // grants ADMIN role to any email containing it, which "notadmin" would.
    const email = `e2e-regular-user-${Date.now()}@example.com`;
    resetOtpThrottle(email);
    await page.goto("/admin");
    await page.getByLabel("Email quản trị viên").fill(email);
    await page.getByRole("button", { name: "Đăng nhập bằng Email OTP" }).click();
    // The form only renders the OTP field once /api/auth/request-otp has
    // answered, so this is what says the code exists to be read.
    await expect(page.getByLabel("Mã xác thực OTP (6 chữ số)")).toBeVisible();
    const code = readOtpFromLocalKv(email);
    await page.getByLabel("Mã xác thực OTP (6 chữ số)").fill(code);
    await page.getByRole("button", { name: /Xác nhận/ }).click();

    await expect(page.getByText("Tài khoản này không có quyền quản trị.")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("an allowlisted admin gets real ADMIN access and reaches the console", async ({ page }) => {
    const email = readConfiguredAdminEmail();
    resetOtpThrottle(email);

    await page.goto("/admin");
    await page.getByLabel("Email quản trị viên").fill(email);
    await page.getByRole("button", { name: "Đăng nhập bằng Email OTP" }).click();
    // The form only renders the OTP field once /api/auth/request-otp has
    // answered, so this is what says the code exists to be read.
    await expect(page.getByLabel("Mã xác thực OTP (6 chữ số)")).toBeVisible();
    const code = readOtpFromLocalKv(email);
    await page.getByLabel("Mã xác thực OTP (6 chữ số)").fill(code);
    await page.getByRole("button", { name: /Xác nhận/ }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("button", { name: "Quản lý Bài viết" })).toBeVisible();
    // The admin console must not carry the public site's header/footer.
    await expect(page.getByText("Khai phóng tư duy")).toBeHidden();
  });
});

test.describe("Admin content management", () => {
  test("a published post shows up on the real public site immediately", async ({ page }) => {
    const email = readConfiguredAdminEmail();
    resetOtpThrottle(email);
    await page.goto("/admin");
    await page.getByLabel("Email quản trị viên").fill(email);
    await page.getByRole("button", { name: "Đăng nhập bằng Email OTP" }).click();
    // The form only renders the OTP field once /api/auth/request-otp has
    // answered, so this is what says the code exists to be read.
    await expect(page.getByLabel("Mã xác thực OTP (6 chữ số)")).toBeVisible();
    const code = readOtpFromLocalKv(email);
    await page.getByLabel("Mã xác thực OTP (6 chữ số)").fill(code);
    await page.getByRole("button", { name: /Xác nhận/ }).click();
    await expect(page).toHaveURL(/\/admin$/);

    await page.getByRole("button", { name: "Quản lý Bài viết" }).click();
    await page.getByRole("button", { name: "Viết bài mới" }).click();

    const title = `E2E admin post ${Date.now()}`;
    await page.getByLabel("Tiêu đề").fill(title);
    await page.getByLabel("Tóm tắt ngắn").fill("Tóm tắt kiểm thử tự động cho bài viết demo.");
    await page.locator(".ProseMirror").fill("Nội dung kiểm thử đủ dài để tính thời gian đọc hợp lý cho bài viết demo này.");
    await page.getByRole("button", { name: "Xuất bản" }).click();
    await expect(page.getByText("Nháp", { exact: true })).toBeHidden();

    await page.getByRole("button", { name: "Quay lại danh sách" }).click();
    await expect(page.getByText(title)).toBeVisible();

    const publicPage = await page.context().newPage();
    await publicPage.goto("/explore");
    await expect(publicPage.getByText(title)).toBeVisible();
    await publicPage.close();
  });
});
