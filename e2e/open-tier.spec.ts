import { test, expect } from "@playwright/test";
import { signInAsReader } from "./helpers/auth";
import { wrangler } from "./helpers/otp";

const ACCESS_POSTS = {
  FREE: "unit-economics-saas",
  PLUS: "7-powers-economic-moats",
  PRO: "game-theory-nash-equilibrium",
} as const;

async function mockDailyLimit(
  page: import("@playwright/test").Page,
  slug: string,
  tier: "FREE" | "PLUS",
  limit: number
) {
  await page.route(`**/api/posts/${slug}`, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        post: {
          id: slug,
          slug,
          title: `Daily limit ${tier}`,
          pillar: "MENTAL_MODEL",
          category: "Mô hình Tư duy",
          displaySize: "SQUARE_SM",
          summarySnippet: "Nội dung dùng để kiểm tra thông báo hạn mức đọc.",
          fullContent: "<p>Phần xem trước của bài viết đang bị giới hạn.</p>",
          accessLevel: tier === "FREE" ? "FREE" : "MEMBER_PLUS",
          readingTimeMinutes: 3,
          status: "PUBLISHED",
          views: 0,
          clicks: 0,
          shares: 0,
          likes: 0,
          dislikes: 0,
          author: "Think & Rich",
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        access: {
          allowed: false,
          reason: "DAILY_LIMIT_REACHED",
          tier,
          limit,
          currentReads: limit,
        },
      }),
    });
  });
}

async function signInWithTier(page: import("@playwright/test").Page, tier: "FREE" | "PLUS") {
  const email = `e2e-access-${tier.toLowerCase()}-${Date.now()}@example.com`;
  await signInAsReader(page, email);
  if (tier === "FREE") return;

  const me = (await (await page.request.get("/api/auth/me")).json()) as { user: { id: string } };
  wrangler([
    "d1", "execute", "thinkandrich-db", "--local", "--command",
    `UPDATE users SET tier='PLUS' WHERE id='${me.user.id}';`,
  ]);
  await page.request.post("/api/auth/logout");
  await signInAsReader(page, email);
}

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
    await page.goto(`/post/${ACCESS_POSTS.FREE}`);
    await expect(page.getByRole("heading", { name: "Xác thực Email OTP để mở khóa bài viết" })).toBeVisible();
    await page.getByRole("button", { name: "Đăng nhập nhận mã OTP" }).click();
    await expect(page.getByRole("heading", { name: "Đăng nhập Think & Rich" })).toBeVisible();
  });

  for (const level of ["PLUS", "PRO"] as const) {
    test(`a ${level} post asks a logged-out reader to sign in before discussing plans`, async ({ page }) => {
      await page.goto(`/post/${ACCESS_POSTS[level]}`);
      await expect(page.getByRole("heading", { name: "Xác thực Email OTP để mở khóa bài viết" })).toBeVisible();
      await expect(page.getByText(/Nâng cấp lên Gói (Plus|Pro)/)).toBeHidden();
    });
  }

  test("a FREE reader sees the exact PLUS requirement and a compact plans link", async ({ page }) => {
    await signInWithTier(page, "FREE");
    await page.goto(`/post/${ACCESS_POSTS.PLUS}`);

    await expect(page.getByText("Bài viết dành cho Thành viên Plus")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nâng cấp lên Gói Plus" })).toBeVisible();
    const plansLink = page.getByRole("link", { name: "Xem Gói Plus và Pro" });
    await expect(plansLink).toHaveAttribute("href", "/pricing#plans");
    const ctaBox = await plansLink.boundingBox();
    expect(ctaBox).not.toBeNull();
    expect(ctaBox!.height).toBeLessThanOrEqual(40);
    expect(ctaBox!.width).toBeLessThan(240);
  });

  test("a FREE reader sees the exact PRO requirement", async ({ page }) => {
    await signInWithTier(page, "FREE");
    await page.goto(`/post/${ACCESS_POSTS.PRO}`);

    await expect(page.getByText("Bài viết dành cho Thành viên Pro")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nâng cấp lên Gói Pro" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Xem Gói Pro" })).toHaveAttribute("href", "/pricing#plans");
  });

  test("a PLUS reader is asked only for PRO on a PRO article", async ({ page }) => {
    await signInWithTier(page, "PLUS");
    await page.goto(`/post/${ACCESS_POSTS.PRO}`);

    await expect(page.getByRole("heading", { name: "Nâng cấp lên Gói Pro" })).toBeVisible();
    await expect(page.getByText("Nâng cấp lên Gói Plus")).toBeHidden();
  });

  test("a FREE daily-limit prompt offers Plus or Pro", async ({ page }) => {
    await mockDailyLimit(page, "mock-free-limit", "FREE", 5);
    await page.goto("/post/mock-free-limit");

    await expect(page.getByText(/Gói Plus hoặc Pro mở khóa bài Free không giới hạn/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Xem Gói Plus và Pro" })).toHaveAttribute("href", "/pricing#plans");
  });

  test("a PLUS daily-limit prompt offers only Pro", async ({ page }) => {
    await mockDailyLimit(page, "mock-plus-limit", "PLUS", 10);
    await page.goto("/post/mock-plus-limit");

    await expect(page.getByText(/Nâng cấp Gói Pro để đọc KHÔNG GIỚI HẠN/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Nâng cấp Gói Pro Không giới hạn" })).toHaveAttribute(
      "href",
      "/pricing#plans"
    );
  });

  test("the login prompt stays compact and inside a 390px mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/post/${ACCESS_POSTS.PRO}`);

    const loginButton = page.getByRole("button", { name: "Đăng nhập nhận mã OTP" });
    await expect(loginButton).toBeVisible();
    const buttonBox = await loginButton.boundingBox();
    expect(buttonBox).not.toBeNull();
    expect(buttonBox!.height).toBeLessThanOrEqual(40);
    expect(buttonBox!.x).toBeGreaterThanOrEqual(16);
    expect(buttonBox!.x + buttonBox!.width).toBeLessThanOrEqual(374);

    const viewport = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(viewport.scrollWidth).toBe(viewport.clientWidth);
  });
});
