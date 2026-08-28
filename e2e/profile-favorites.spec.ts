import { expect, test } from "@playwright/test";
import { signInAsReader } from "./helpers/auth";
import type { PillarType } from "@/lib/types";

const PILLARS: PillarType[] = ["MENTAL_MODEL", "BUSINESS_STRATEGY", "STARTUP_IDEA"];

test.describe("profile favorites", () => {
  test("keeps every pillar filter visible when the selected pillar is empty", async ({ page }) => {
    await signInAsReader(page, `e2e-favorites-${Date.now()}@example.com`);

    const listing = await page.request.get("/api/posts?pageSize=200");
    expect(listing.ok()).toBeTruthy();
    const data = (await listing.json()) as {
      posts?: Array<{ slug: string; pillar: PillarType }>;
    };
    const likedPost = data.posts?.find((post) => PILLARS.includes(post.pillar));
    expect(likedPost).toBeTruthy();

    const emptyPillar = PILLARS.find((pillar) => pillar !== likedPost?.pillar);
    expect(emptyPillar).toBeTruthy();

    const reaction = await page.request.post(`/api/posts/${likedPost?.slug}/react`, {
      data: { type: "like" },
    });
    expect(reaction.ok()).toBeTruthy();

    await page.goto("/profile");
    await page.getByTestId("profile-tab-favorites").click();

    await expect(page.getByTestId("profile-favorites-filter-ALL")).toBeVisible();
    await page.getByTestId(`profile-favorites-filter-${emptyPillar}`).click();

    for (const pillar of PILLARS) {
      await expect(page.getByTestId(`profile-favorites-filter-${pillar}`)).toBeVisible();
    }
    await expect(page.getByTestId("profile-favorites-filter-ALL")).toContainText("(1)");
  });
});
