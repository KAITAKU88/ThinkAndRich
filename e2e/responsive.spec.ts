import { expect, test, type Page } from "@playwright/test";
import { signInAsAdmin } from "./helpers/auth";

// 390 is a modern iPhone; 320 is the narrowest screen still in real use
// (iPhone SE 1st gen, a folded Galaxy Fold) and the width that actually
// exercises the `min-[375px]:` branches the mobile pass introduced.
const MOBILE_WIDTHS = [320, 390];

const PUBLIC_ROUTES = [
  "/",
  "/explore",
  "/pricing",
  "/checkout?plan=PLUS",
  "/checkout?plan=PRO",
  "/checkout/success",
  "/profile",
  "/login",
  "/faq",
  "/terms",
  "/privacy",
  "/admin/login",
];

type Overflow = { viewport: number; content: number; clipped: string[] };

// Two different failures look the same to a reader and neither is caught by
// the other check: the page itself scrolling sideways, and an element that
// spills past a parent which does fit — the parent clips it, the page stays
// put, and content just silently disappears off the card's edge.
async function measure(page: Page): Promise<Overflow> {
  return page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const clipped: string[] = [];

    for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
      const box = el.getBoundingClientRect();
      if (box.width === 0 || (box.right <= viewport + 1 && box.left >= -1)) continue;
      // Parked entirely off-screen — a closed drawer, an offstage slide.
      // Only something partly on screen can be clipped mid-content.
      if (box.right <= 0 || box.left >= viewport) continue;

      // Skip anything sitting inside a container that already decides what
      // happens to overflow: one made to scroll sideways (wide tables, tab
      // strips, the editor toolbar), or one that clips (`truncate`, which is
      // overflow:hidden plus an ellipsis — the text is cut on purpose and the
      // reader is shown that it was). What is left is the case worth
      // reporting: content spilling out of a container that made no such
      // decision. An inline box reports its full layout rect even when an
      // ancestor is clipping it, so without this a truncated title looks
      // identical to a genuine overflow.
      let handled = false;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const overflowX = getComputedStyle(p).overflowX;
        if (overflowX === "auto" || overflowX === "scroll" || overflowX === "hidden") handled = true;
      }
      if (handled) continue;

      const parent = el.parentElement?.getBoundingClientRect();
      if (parent && (parent.right > viewport + 1 || parent.left < -1)) continue;

      clipped.push(
        `<${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 80)}"> ` +
          `left=${Math.round(box.left)} right=${Math.round(box.right)}`
      );
    }

    return { viewport, content: document.documentElement.scrollWidth, clipped: clipped.slice(0, 5) };
  });
}

function expectNoOverflow(route: string, m: Overflow) {
  expect(
    `${route} scrollWidth=${m.content} viewport=${m.viewport}\n${m.clipped.join("\n")}`
  ).toBe(`${route} scrollWidth=${m.viewport} viewport=${m.viewport}\n`);
}

for (const width of MOBILE_WIDTHS) {
  test.describe(`mobile responsive layout @${width}px`, () => {
    test.use({ viewport: { width, height: 844 } });

    for (const route of PUBLIC_ROUTES) {
      test(`${route} stays within the mobile viewport`, async ({ page }) => {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        // The bento grid on /explore sizes its cells from a ResizeObserver,
        // so the first paint is not the final layout.
        await page.waitForTimeout(700);
        expectNoOverflow(route, await measure(page));
      });
    }

    test("an article page stays within the mobile viewport", async ({ page }) => {
      const id = await firstPostId(page);
      test.skip(!id, "no published posts in this environment");
      await page.goto(`/post/${id}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(900);
      expectNoOverflow(`/post/${id}`, await measure(page));
    });

    test("the auth dialog fits the screen", async ({ page }) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.getByTestId("mobile-nav").getByRole("button").last().click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      const box = (await dialog.boundingBox())!;
      expect(box.width).toBeLessThanOrEqual(width);
      expect(box.height).toBeLessThanOrEqual(844);
    });
  });
}

test.describe("mobile navigation", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile navigation replaces the desktop navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("desktop-nav")).toBeHidden();
    await expect(page.getByTestId("mobile-nav")).toBeVisible();
  });

  // The bottom nav is fixed; without the shell reserving its height the last
  // element of every page would sit permanently underneath it.
  test("the bottom nav does not cover the end of the page", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);

    const gap = await page.evaluate(() => {
      const nav = document.querySelector("nav[class*='fixed']")!.getBoundingClientRect();
      const footer = document.querySelector("footer")!.getBoundingClientRect();
      return nav.top - footer.bottom;
    });
    expect(gap).toBeGreaterThanOrEqual(0);
  });
});

test.describe("desktop layout is unchanged", () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test("desktop navigation remains visible and the bottom nav stays hidden", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("desktop-nav")).toBeVisible();
    await expect(page.getByTestId("mobile-nav")).toBeHidden();
  });

  for (const route of ["/", "/explore", "/pricing", "/profile"]) {
    test(`${route} still lays out full width`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(700);
      expectNoOverflow(route, await measure(page));
    });
  }
});

async function firstPostId(page: Page): Promise<string | undefined> {
  const res = await page.request.get("/api/posts?pageSize=5");
  if (!res.ok()) return undefined;
  const body = await res.json();
  const list = Array.isArray(body) ? body : body.posts ?? body.data ?? [];
  return list[0]?.id;
}

// The admin console got the largest share of the mobile pass — every one of
// its tables was given a min width inside a scrolling wrapper, and its
// toolbars were made to wrap — and none of it was covered by anything.
test.describe("admin console on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  // The console's sidebar labels, verbatim (src/components/admin/AdminPage.tsx).
  const TABS = [
    "Tổng quan",
    "Quản lý Bài viết",
    "Quản lý Người dùng",
    "Đơn hàng & Doanh thu",
    "MCP Connector",
    "Thanh toán & giá",
    "Cấu hình",
  ];

  test("every console tab stays within the mobile viewport", async ({ page }) => {
    await signInAsAdmin(page);

    // The sidebar collapses into a drawer below lg, and picking a tab closes
    // it again, so every tab is reached through the hamburger.
    for (const label of TABS) {
      await page.getByRole("button", { name: "Mở menu quản trị" }).click();
      await page.getByRole("button", { name: label }).click();
      await page.waitForTimeout(600);
      expectNoOverflow(`/admin (${label})`, await measure(page));
    }
  });

  test("the post editor stays within the mobile viewport", async ({ page }) => {
    await signInAsAdmin(page);

    await page.getByRole("button", { name: "Mở menu quản trị" }).click();
    await page.getByRole("button", { name: "Quản lý Bài viết" }).click();
    await page.getByRole("button", { name: "Viết bài mới" }).click();
    await expect(page.getByLabel("Tiêu đề")).toBeVisible();
    await page.waitForTimeout(600);

    expectNoOverflow("/admin (soạn bài)", await measure(page));
  });
});
