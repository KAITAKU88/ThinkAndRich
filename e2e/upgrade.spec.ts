import { test, expect } from "@playwright/test";
import { signInAsReader } from "./helpers/auth";

test.setTimeout(120_000);

test.describe("Credit packages", () => {
  test("pricing page lists the three credit packages", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: "1.500 credit" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "4.500 credit" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "10.000 credit" })).toBeVisible();
    await expect(page.getByText("Mô phỏng IP")).toHaveCount(0);
    await expect(page.getByText("Chim Mồi")).toHaveCount(0);
    await expect(page.getByText("Decoy Effect")).toHaveCount(0);
    await expect(page.getByText("Cơ chế Khóa Tiền tệ")).toHaveCount(0);
    await expect(page.getByText("Bảng giá Toàn cầu")).toHaveCount(0);
  });

  test("login page has no blueprint/mock copy", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Blueprint")).toHaveCount(0);
    await expect(page.getByText("Magic link")).toHaveCount(0);
    await expect(page.getByText(/mã OTP/)).toBeVisible();
  });

  test("checkout success has no mock/dossier copy", async ({ page }) => {
    await page.goto("/checkout/success");
    await expect(page.getByText("(mock)")).toHaveCount(0);
    await expect(page.getByText("dossier")).toHaveCount(0);
    await expect(page.getByText("stripe")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Thanh toán thành công" })).toBeVisible();
  });

  test("FAQ describes credit packs, not FREE/PLUS/PRO", async ({ page }) => {
    await page.goto("/faq");
    await expect(page.getByText("FREE, PLUS")).toHaveCount(0);
    await expect(page.getByText("PRO ONLY")).toHaveCount(0);
    await expect(page.getByText("Credit dùng để làm gì")).toBeVisible();
  });

  test("upgrade endpoint is gone", async ({ page }) => {
    await signInAsReader(page, `e2e-credit-${Date.now()}@example.com`);
    const res = await page.request.get("/api/upgrade?country=VN");
    expect(res.status()).toBe(410);
  });
});
