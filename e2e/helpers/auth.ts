import { expect, type Page } from "@playwright/test";
import { readConfiguredAdminEmail, readOtpFromLocalKv, resetOtpThrottle } from "./otp";

/**
 * Sign in through the real console login, OTP and all.
 *
 * Extracted because three specs had their own copy, and each copy carried
 * the same race: the OTP was read out of the local KV simulator as an
 * *argument* to fill(), so it ran the instant the send button was clicked
 * rather than once the code existed. Usually the shell-out to wrangler took
 * long enough to hide it; on a cold route compile it did not, and the test
 * failed with an empty KV listing that looked like a throttling problem.
 *
 * Waiting for the OTP field is the fix: the form only renders it after
 * /api/auth/request-otp has come back.
 */
export async function signInAsAdmin(page: Page): Promise<string> {
  const email = readConfiguredAdminEmail();
  resetOtpThrottle(email);

  await page.goto("/admin");
  await page.getByLabel("Email quản trị viên").fill(email);
  await page.getByRole("button", { name: "Đăng nhập bằng Email OTP" }).click();

  const otpField = page.getByLabel("Mã xác thực OTP (6 chữ số)");
  await expect(otpField).toBeVisible();
  await otpField.fill(readOtpFromLocalKv(email));
  await page.getByRole("button", { name: /Xác nhận/ }).click();
  await expect(page).toHaveURL(/\/admin$/);

  return email;
}

/** The same, for a plain reader signing in through the public dialog. */
export async function signInAsReader(page: Page, email: string): Promise<void> {
  resetOtpThrottle(email);

  await page.goto("/");
  await page.getByTestId("login-cta").click();
  await page.locator("#auth-email").fill(email);
  await page.getByTestId("auth-send-otp").click();

  const otpField = page.locator("#auth-otp");
  await expect(otpField).toBeVisible();
  await otpField.fill(readOtpFromLocalKv(email));
  await page.getByTestId("auth-verify-otp").click();
  await expect(page.getByTestId("login-cta")).toBeHidden();
}
