import { expect, test, type Page } from "@playwright/test";
import { signInAsAdmin } from "./helpers/auth";

test.setTimeout(240_000);

async function createPublishedPost(page: Page, title: string, summary: string) {
  await page.getByRole("button", { name: "Viết bài mới" }).click();
  await page.getByLabel("Tiêu đề").fill(title);
  await page.getByLabel("Tóm tắt ngắn").fill(summary);
  await page.locator(".ProseMirror").fill(`Nội dung kiểm thử cho ${title}.`);
  const responsePromise = page.waitForResponse(
    (response) => response.url().endsWith("/api/admin/posts") && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Xuất bản" }).click();
  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as { post: { id: string; slug: string } };
  await page.getByRole("button", { name: "Quay lại danh sách" }).click();
  return body.post;
}

test.describe("article linking in the admin editor", () => {
  test("inline @ links and the separate related-post picker stay independent", async ({ page }) => {
    await signInAsAdmin(page);
    await page.getByRole("button", { name: "Quản lý Bài viết" }).click();

    const stamp = Date.now();
    const inlineTitle = `E2E bài được nhúng ${stamp}`;
    const relatedTitle = `E2E bài liên quan ${stamp}`;
    const sourceTitle = `E2E bài nguồn ${stamp}`;
    const inline = await createPublishedPost(page, inlineTitle, "Bài đích cho liên kết nằm trong nội dung.");
    const related = await createPublishedPost(page, relatedTitle, "Bài đích cho danh sách nằm ngoài nội dung.");

    await page.getByRole("button", { name: "Viết bài mới" }).click();
    await page.getByLabel("Tiêu đề").fill(sourceTitle);
    await page.getByLabel("Tóm tắt ngắn").fill("Kiểm tra hai kiểu liên kết bài viết độc lập.");

    const editor = page.locator(".ProseMirror");
    await editor.click();
    await editor.pressSequentially(`Đọc tiếp @${inlineTitle}`, { delay: 5 });
    const mentionMenu = page.getByTestId("article-mention-menu");
    await expect(mentionMenu).toBeVisible();
    await mentionMenu.getByRole("button", { name: new RegExp(inlineTitle) }).click();
    await expect(editor.locator(`a[href="/post/${inline.slug}"]`)).toHaveText(inlineTitle);

    // This is the second, independent control outside the article body.
    // Selecting a card here must not insert its title into TipTap, and the
    // inline @ target must not appear as selected by implication.
    await page.getByRole("button", { name: "Thêm bài liên quan" }).click();
    await page.getByTestId("related-post-search").fill(relatedTitle);
    await page
      .getByTestId("related-post-options")
      .getByRole("button", { name: new RegExp(relatedTitle) })
      .click();
    const selected = page.getByTestId("selected-related-posts");
    await expect(selected).toContainText(relatedTitle);
    await expect(selected).not.toContainText(inlineTitle);
    await expect(editor).not.toContainText(relatedTitle);

    const createResponsePromise = page.waitForResponse(
      (response) => response.url().endsWith("/api/admin/posts") && response.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Xuất bản" }).click();
    const createResponse = await createResponsePromise;
    expect(createResponse.ok()).toBeTruthy();
    const created = (await createResponse.json()) as { post: { id: string; slug: string } };

    const detailResponse = await page.request.get(`/api/posts/${created.post.slug}`);
    expect(detailResponse.ok()).toBeTruthy();
    const detail = (await detailResponse.json()) as {
      post: { fullContent: string };
      relatedPosts: Array<{ id: string; title: string }>;
    };
    expect(detail.post.fullContent).toContain(`/post/${inline.slug}`);
    expect(detail.post.fullContent).not.toContain(relatedTitle);
    expect(detail.relatedPosts.map((post) => post.id)).toEqual([related.id]);

    // Replaying the same selection is idempotent: it replaces the ordered
    // relation set and cannot create duplicate cards.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const patchResponse = await page.request.patch(`/api/admin/posts/${created.post.id}`, {
        data: { relatedPostIds: [related.id] },
      });
      expect(patchResponse.ok()).toBeTruthy();
    }
    const afterRetry = await page.request.get(`/api/posts/${created.post.slug}`);
    const afterRetryBody = (await afterRetry.json()) as { relatedPosts: Array<{ id: string }> };
    expect(afterRetryBody.relatedPosts.map((post) => post.id)).toEqual([related.id]);

    const reader = await page.context().newPage();
    await reader.goto(`/post/${created.post.slug}`);
    await expect(reader.getByRole("link", { name: inlineTitle })).toHaveAttribute("href", `/post/${inline.slug}`);
    const relatedSection = reader
      .getByRole("heading", { name: "Bài viết liên quan" })
      .locator("..")
      .locator("..");
    await expect(relatedSection).toContainText(relatedTitle);
    await reader.close();
  });

  test("the API rejects more than three related posts with an explicit code", async ({ page }) => {
    await signInAsAdmin(page);
    const response = await page.request.patch("/api/admin/posts/does-not-matter", {
      data: { relatedPostIds: ["one", "two", "three", "four"] },
    });
    // The route checks existence before the payload today, so use POST where
    // structural validation is intentionally performed before any write.
    expect(response.status()).toBe(404);

    const createResponse = await page.request.post("/api/admin/posts", {
      data: {
        title: `E2E invalid related ${Date.now()}`,
        summarySnippet: "Payload này không được phép tạo bản ghi.",
        relatedPostIds: ["one", "two", "three", "four"],
      },
    });
    expect(createResponse.status()).toBe(400);
    await expect(createResponse.json()).resolves.toMatchObject({
      ok: false,
      code: "TOO_MANY_RELATED_POSTS",
    });
  });
});
