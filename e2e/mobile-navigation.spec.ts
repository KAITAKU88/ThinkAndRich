import { expect, test } from "@playwright/test";

test.describe("mobile header and navigation", () => {
  test.use({ viewport: { width: 320, height: 844 } });

  test("shows the brand and keeps the anonymous login CTA only in bottom navigation", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("banner").getByRole("link", { name: "Think & Rich" })).toBeVisible();
    await expect(page.getByTestId("login-cta")).toBeHidden();
    await expect(page.getByTestId("mobile-nav-item-profile")).toBeVisible();
  });

  test("expands only the current destination label", async ({ page }) => {
    await page.goto("/");

    const home = page.getByTestId("mobile-nav-item-home");
    const explore = page.getByTestId("mobile-nav-item-explore");
    await expect(home).toHaveAttribute("aria-current", "page");
    await expect(home.getByText("Trang chủ")).toBeVisible();
    await expect(explore.getByText("Khám phá")).toBeHidden();

    await explore.click();
    await expect(page).toHaveURL(/\/explore$/);
    await expect(explore).toHaveAttribute("aria-current", "page");
    await expect(explore.getByText("Khám phá")).toBeVisible();
    await expect(home.getByText("Trang chủ")).toBeHidden();
  });

  test("distinguishes the saved and account destinations on the profile page", async ({ page }) => {
    await page.goto("/profile#saved");
    const saved = page.getByTestId("mobile-nav-item-bookmarks");
    const account = page.getByTestId("mobile-nav-item-profile");

    await expect(saved).toHaveAttribute("aria-current", "page");
    await expect(account).not.toHaveAttribute("aria-current", "page");
  });
});
