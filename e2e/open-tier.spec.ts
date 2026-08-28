import { test, expect } from "@playwright/test";
import { signInAsReader } from "./helpers/auth";

test.describe("Open vs paid articles", () => {
  test("an Open post is fully readable while logged out", async ({ page }) => {
    await page.goto("/post/first-principles-thinking");
    await expect(page.getByText("Open", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Mở khóa" })).toHaveCount(0);
    await expect(page.getByText(/Socratic/)).toBeVisible();
  });

  test("a paid post is curtained while logged out", async ({ page }) => {
    await page.goto("/post/inversion-principle");
    await expect(page.getByRole("heading", { name: "Đăng nhập để mở khóa" })).toBeVisible();
    await expect(
      page.getByText("Thay vì cố gắng tìm cách thành công xuất chúng", { exact: false })
    ).toBeVisible();
    await expect(page.getByText("Carl Jacobi", { exact: false })).toBeVisible();
  });

  test("a logged-in reader unlocks a 1C article with gift credits", async ({ page }) => {
    await signInAsReader(page, `e2e-unlock-${Date.now()}@example.com`);
    await page.goto("/post/inversion-principle");
    const unlock = page.getByRole("button", { name: "Mở khóa" });
    await expect(unlock).toBeVisible();
    await unlock.click();
    await expect(page.getByRole("button", { name: "Mở khóa" })).toHaveCount(0);
    await page.goto("/profile#account");
    const giftRow = page.locator("div.flex").filter({ hasText: "Credit tặng còn lại hôm nay" }).first();
    await expect(giftRow.getByText("4", { exact: true })).toBeVisible();
  });
});
