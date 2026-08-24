import { test, expect } from "@playwright/test";

test.describe("OPEN content tier", () => {
  test("an OPEN post is fully readable while logged out", async ({ page }) => {
    await page.goto("/post/first-principles-thinking");
    await expect(page.getByText("ĐỌC TỰ DO")).toBeVisible();
    // The paywall CTA must NOT appear for an OPEN post.
    await expect(page.getByText("Đăng nhập để đọc toàn bộ")).toBeHidden();
    // Full article body actually rendered, not just the teaser.
    await expect(page.getByText(/Socratic/)).toBeVisible();
  });

  test("a FREE post is paywalled behind login while logged out", async ({ page }) => {
    await page.goto("/post/unit-economics-saas");
    await expect(page.getByText("Đăng nhập để đọc toàn bộ")).toBeVisible();
  });
});
