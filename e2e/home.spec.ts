import { test, expect } from "@playwright/test";

test("homepage renders cards with access-level badges", async ({ page }) => {
  await page.goto("/");
  // "Think & Rich" also appears in body copy and the footer — the header
  // logo link is the one that identifies the page has actually loaded.
  await expect(page.getByRole("link", { name: /Think & Rich/ }).first()).toBeVisible();
  // At least one card badge from InteractiveSquareCard.tsx should render
  // (real posts, fetched from D1 via GET /api/posts).
  await expect(page.getByText(/FREE|OPEN|PLUS|PRO/).first()).toBeVisible();
});

test("Explore page filters render without a logged-in session", async ({ page }) => {
  await page.goto("/explore");
  await expect(page.getByRole("button", { name: "Tất cả", exact: true })).toBeVisible();
});
