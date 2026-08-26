import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "./helpers/auth";

test.setTimeout(180_000);

/**
 * Click Lưu and wait for the save to land.
 *
 * Saving is a PATCH followed by a refetch of the list, and navigating back
 * before both finish means the list — and so the post reopened from it — is
 * still the version from before the save. The database was always right;
 * only the test was reading the page too early.
 */
async function saveAndWait(page: import("@playwright/test").Page) {
  // A first save creates (POST /api/admin/posts); later ones update
  // (PATCH /api/admin/posts/{id}). Both end in the same refetch.
  const written = page.waitForResponse(
    (res) =>
      res.url().includes("/api/admin/posts") &&
      ["POST", "PATCH"].includes(res.request().method())
  );
  const relisted = page.waitForResponse(
    (res) => /\/api\/admin\/posts\?/.test(res.url()) && res.request().method() === "GET"
  );
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await written;
  await relisted;
}

/**
 * Type a tag and commit it.
 *
 * fill() sets the DOM value and moves on, so a following press("Enter") can
 * land before React has taken the change into state — the field reads empty,
 * the tag is refused as blank, and the test fails only sometimes. Asserting
 * the value first is what makes the two steps ordered.
 */
async function addTag(page: import("@playwright/test").Page, tag: string) {
  const input = page.getByTestId("tag-input");
  await input.click();
  await input.fill(tag);
  await expect(input).toHaveValue(tag);
  await input.press("Enter");
}

test.describe("article tags in the console", () => {
  test("a post written by hand can carry tags, and the reader sees them", async ({ page }) => {
    await signInAsAdmin(page);
    await page.getByRole("button", { name: "Quản lý Bài viết" }).click();
    await page.getByRole("button", { name: "Viết bài mới" }).click();

    const title = `E2E tag post ${Date.now()}`;
    await page.getByLabel("Tiêu đề").fill(title);
    await page.getByLabel("Tóm tắt ngắn").fill("Bài kiểm thử nhãn từ khóa.");
    await page.locator(".ProseMirror").fill("Nội dung đủ dài để tính thời gian đọc cho bài kiểm thử nhãn.");

    // Enter commits, and so does a comma — both are what fingers reach for.
    await addTag(page, "Aristotle");

    // A comma commits too — the other key fingers reach for.
    const input = page.getByTestId("tag-input");
    await input.click();
    await input.fill("Ra quyết định");
    await expect(input).toHaveValue("Ra quyết định");
    await input.press(",");
    await expect(page.getByTestId("tag-chip")).toHaveCount(2);

    // The rule the module exists for: a differently-cased repeat is the
    // same tag, and must not become a second one.
    await input.fill("  ARISTOTLE ");
    await expect(input).toHaveValue("  ARISTOTLE ");
    await input.press("Enter");
    await expect(page.getByTestId("tag-chip")).toHaveCount(2);
    await expect(page.getByText("Nhãn này đã có trong bài.")).toBeVisible();

    await page.getByRole("button", { name: "Xuất bản" }).click();
    await expect(page.getByText("Nháp", { exact: true })).toBeHidden();

    // What the reader gets is the whole point — tags were already rendered
    // on the article page; only the writing side was missing.
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const reader = await page.context().newPage();
    await reader.goto(`/post/${slug}`);
    await expect(reader.getByText("Aristotle")).toBeVisible();
    await expect(reader.getByText("Ra quyết định")).toBeVisible();
    await reader.close();
  });

  test("tags survive a round trip through the editor", async ({ page }) => {
    await signInAsAdmin(page);
    await page.getByRole("button", { name: "Quản lý Bài viết" }).click();
    await page.getByRole("button", { name: "Viết bài mới" }).click();

    // The test creates the post it inspects. Reaching for whatever happens
    // to be first in the list makes the result depend on what other tests
    // published, which is how this asserted against its own leftovers.
    const title = `E2E tag roundtrip ${Date.now()}`;
    await page.getByLabel("Tiêu đề").fill(title);
    await page.getByLabel("Tóm tắt ngắn").fill("Kiểm thử nhãn tồn tại qua vòng lưu.");
    await page.locator(".ProseMirror").fill("Nội dung kiểm thử cho vòng lưu và mở lại bài viết.");

    for (const tag of ["Aristotle", "Ra quyết định"]) {
      await addTag(page, tag);
    }
    await expect(page.getByTestId("tag-chip")).toHaveCount(2);

    await saveAndWait(page);
    await page.getByRole("button", { name: "Quay lại danh sách" }).click();

    // Reopen the same post by name and check the tags came back — the
    // editor used to show none, whatever the row held.
    await page.getByRole("row", { name: new RegExp(title) }).getByRole("button", { name: "Sửa" }).click();
    await expect(page.getByLabel("Tiêu đề")).toHaveValue(title);
    await expect(page.getByTestId("tag-chip")).toHaveCount(2);
    await expect(page.getByText("Aristotle")).toBeVisible();

    // And an edit to the tags is saved like any other field.
    await addTag(page, "Vật lý học");
    await expect(page.getByTestId("tag-chip")).toHaveCount(3);
    await saveAndWait(page);
    await page.getByRole("button", { name: "Quay lại danh sách" }).click();
    await page.getByRole("row", { name: new RegExp(title) }).getByRole("button", { name: "Sửa" }).click();
    await expect(page.getByTestId("tag-chip")).toHaveCount(3);
  });

  test("suggests tags already in use instead of letting near-duplicates in", async ({ page }) => {
    await signInAsAdmin(page);
    await page.getByRole("button", { name: "Quản lý Bài viết" }).click();
    await page.getByRole("button", { name: "Viết bài mới" }).click();

    await page.getByTestId("tag-input").click();
    await page.getByTestId("tag-input").fill("quyết");

    const suggestions = page.getByTestId("tag-suggestions");
    await expect(suggestions).toBeVisible();
    await suggestions.getByRole("button").first().click();
    await expect(page.getByTestId("tag-chip")).toHaveCount(1);
  });
});
