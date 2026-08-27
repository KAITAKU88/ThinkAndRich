import { expect, test } from "@playwright/test";

test("Explore renders its initial cards without a client-side loading gap", async ({ page, request }) => {
  const response = await request.get("/api/posts?pageSize=1");
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as { posts?: Array<{ id: string }> };
  test.skip(!body.posts?.length, "no published posts in this environment");

  let clientListRequests = 0;
  page.on("request", (req) => {
    if (new URL(req.url()).pathname === "/api/posts") clientListRequests += 1;
  });

  await page.goto("/explore", { waitUntil: "domcontentloaded" });

  await expect(page.locator('main a[href^="/post/"]').first()).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBe(dimensions.viewport);
  expect(clientListRequests).toBe(0);
});
