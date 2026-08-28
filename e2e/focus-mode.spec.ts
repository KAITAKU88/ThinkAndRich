import { expect, test, type Page } from "@playwright/test";

async function firstPostId(page: Page): Promise<string | undefined> {
  const res = await page.request.get("/api/posts?pageSize=100");
  if (!res.ok()) return undefined;
  const body = await res.json();
  const list = (Array.isArray(body) ? body : body.posts ?? body.data ?? []) as Array<{
    id?: string;
    slug?: string;
    creditCost?: number;
  }>;
  const openPost = list.find((post) => post.creditCost === 0);
  return openPost?.slug ?? openPost?.id;
}

for (const viewport of [
  { width: 390, height: 844, name: "mobile" },
  { width: 1280, height: 900, name: "desktop" },
]) {
  test.describe(`focus mode ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("keeps the reading sheet clear while dimming surrounding chrome", async ({ page }) => {
      const id = await firstPostId(page);
      test.skip(!id, "no published posts in this environment");

      await page.goto(`/post/${id}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(900);

      await page.getByTestId("focus-mode-toggle").click();
      await expect(page.getByTestId("focus-mode-exit")).toBeVisible();

      await expect.poll(async () => {
        return page.evaluate(() => document.body.classList.contains("focus-mode-active"));
      }).toBe(true);

      await expect.poll(async () => {
        return page.evaluate(() => {
          const header = document.querySelector("header");
          return header instanceof HTMLElement ? Number(getComputedStyle(header).opacity) : 1;
        });
      }).toBeLessThan(0.3);

      const focusState = await page.evaluate(() => {
        const header = document.querySelector("header");
        const sheet = document.querySelector(".reading-sheet");
        if (!(header instanceof HTMLElement) || !(sheet instanceof HTMLElement)) {
          return null;
        }

        return {
          headerFilter: getComputedStyle(header).filter,
          headerOpacity: getComputedStyle(header).opacity,
          sheetFilter: getComputedStyle(sheet).filter,
          sheetOpacity: getComputedStyle(sheet).opacity,
        };
      });

      expect(focusState).not.toBeNull();
      expect(focusState?.headerFilter).not.toBe("none");
      expect(Number(focusState?.headerOpacity ?? "1")).toBeLessThan(0.3);
      expect(focusState?.sheetFilter).toBe("none");
      expect(focusState?.sheetOpacity).toBe("1");

      await page.getByTestId("focus-mode-exit").click();
      await expect.poll(async () => {
        return page.evaluate(() => document.body.classList.contains("focus-mode-active"));
      }).toBe(false);
    });
  });
}
