import { test, expect } from "@playwright/test";
import { readConfiguredAdminEmail, readOtpFromLocalKv, resetOtpThrottle } from "./helpers/otp";
import { clearPaymentSettings, seedPaymentSettings } from "./helpers/settings";

test.setTimeout(180_000);

// Whatever this spec leaves behind, the next one must not depend on — put
// the configured details back so specs stay order-independent.
test.afterAll(() => seedPaymentSettings());

async function signInAsAdmin(page: import("@playwright/test").Page) {
  const email = readConfiguredAdminEmail();
  resetOtpThrottle(email);
  await page.goto("/admin");
  await page.getByLabel("Email quản trị viên").fill(email);
  await page.getByRole("button", { name: "Đăng nhập bằng Email OTP" }).click();
  await page.getByLabel("Mã xác thực OTP (6 chữ số)").fill(readOtpFromLocalKv(email));
  await page.getByRole("button", { name: /Xác nhận/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe("payment settings", () => {
  test("an unconfigured site shows no QR instead of a wrong one", async ({ page }) => {
    clearPaymentSettings();

    // Reaching checkout needs an account, but not an admin one.
    const email = `e2e-pay-${Date.now()}@example.com`;
    resetOtpThrottle(email);
    await page.goto("/");
    await page.getByTestId("login-cta").click();
    await page.locator("#auth-email").fill(email);
    await page.getByTestId("auth-send-otp").click();
    await expect(page.locator("#auth-otp")).toBeVisible();
    await page.locator("#auth-otp").fill(readOtpFromLocalKv(email));
    await page.getByTestId("auth-verify-otp").click();
    await expect(page.getByTestId("login-cta")).toBeHidden();

    await page.goto("/checkout?plan=PLUS&country=VN");
    await expect(page.getByTestId("payment-not-configured")).toBeVisible();
    // The whole point: a half-configured site must not draw a scannable code.
    await expect(page.locator('img[alt="VietQR SePay Transfer"]')).toHaveCount(0);
  });

  test("what an admin saves is what the QR is built from", async ({ page }) => {
    clearPaymentSettings();
    await signInAsAdmin(page);

    // The sidebar only collapses below lg, and these run at the default
    // desktop viewport, so the tab is reachable directly.
    await page.getByRole("button", { name: "Cấu hình Thanh toán" }).click();

    await page.locator("#bankCode").fill("VCB");
    await page.locator("#bankName").fill("Vietcombank");
    await page.locator("#bankAccountNumber").fill("1234567890");
    await page.locator("#bankAccountHolder").fill("THINK AND RICH CO LTD");
    await page.getByTestId("save-payment-settings").click();
    await expect(page.getByText("Đã lưu cấu hình thanh toán.")).toBeVisible();

    // The public endpoint the checkout page reads reflects it immediately —
    // no deploy, which is the entire reason this moved out of the source.
    const settings = await (await page.request.get("/api/settings/payment")).json();
    expect(settings).toMatchObject({
      ok: true,
      configured: true,
      payment: { bankCode: "VCB", bankAccountNumber: "1234567890" },
    });

    await page.goto("/checkout?plan=PLUS&country=VN");
    await expect(page.getByTestId("payment-not-configured")).toHaveCount(0);
    await expect(page.locator('img[alt="VietQR SePay Transfer"]')).toHaveAttribute(
      "src",
      /img\.vietqr\.io\/image\/VCB-1234567890-compact2\.png/
    );
  });

  test("refuses details that would produce a broken transfer screen", async ({ page }) => {
    await signInAsAdmin(page);

    const bad = await page.request.put("/api/admin/settings", {
      data: { payment: { bankAccountHolder: "NGUYỄN VĂN A" } },
    });
    expect(bad.status()).toBe(400);

    const alsoBad = await page.request.put("/api/admin/settings", {
      data: { payment: { bankAccountNumber: "not-a-number" } },
    });
    expect(alsoBad.status()).toBe(400);
  });

  test("is not editable by a reader", async ({ page }) => {
    const email = `e2e-pay-reader-${Date.now()}@example.com`;
    resetOtpThrottle(email);
    await page.goto("/");
    await page.getByTestId("login-cta").click();
    await page.locator("#auth-email").fill(email);
    await page.getByTestId("auth-send-otp").click();
    await expect(page.locator("#auth-otp")).toBeVisible();
    await page.locator("#auth-otp").fill(readOtpFromLocalKv(email));
    await page.getByTestId("auth-verify-otp").click();
    await expect(page.getByTestId("login-cta")).toBeHidden();

    expect((await page.request.get("/api/admin/settings")).status()).toBe(403);
    expect(
      (await page.request.put("/api/admin/settings", { data: { payment: { bankCode: "XX" } } })).status()
    ).toBe(403);
  });
});
