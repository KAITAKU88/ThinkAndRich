import { describe, it, expect } from "vitest";
import { PUBLIC_SEARCH_COLUMNS } from "./public-search";

describe("PUBLIC_SEARCH_COLUMNS", () => {
  it("covers title, summary, tags, full body, and category", () => {
    expect(PUBLIC_SEARCH_COLUMNS).toEqual([
      "title",
      "summarySnippet",
      "tags",
      "fullContent",
      "category",
    ]);
  });
});
