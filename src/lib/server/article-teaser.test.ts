import { describe, expect, it } from "vitest";
import { truncateHtmlTeaser } from "@/lib/server/access-control";

describe("truncateHtmlTeaser", () => {
  it("returns the leading section heading plus the first two paragraphs", () => {
    const html = `
      <h2>1. Mở đầu</h2>
      <p>Đoạn một đủ dài để đọc thử.</p>
      <p>Đoạn hai tiếp theo.</p>
      <p>Đoạn ba phải bị cắt.</p>
    `;
    const teaser = truncateHtmlTeaser(html);
    expect(teaser).toContain("<h2>1. Mở đầu</h2>");
    expect(teaser).toContain("Đoạn một");
    expect(teaser).toContain("Đoạn hai");
    expect(teaser).not.toContain("Đoạn ba");
  });

  it("falls back to a short ratio slice when there are no paragraphs", () => {
    const html = "<ul><li>Chỉ có list</li></ul>".repeat(20);
    const teaser = truncateHtmlTeaser(html);
    expect(teaser.length).toBeLessThan(html.length);
  });
});
