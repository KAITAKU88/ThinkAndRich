import { describe, expect, it } from "vitest";
import { MAX_RELATED_POSTS, validateRelatedPostIds } from "@/lib/related-posts";

describe("validateRelatedPostIds", () => {
  it("preserves a valid editorial order", () => {
    expect(validateRelatedPostIds(["post-c", "post-a", "post-b"], "current")).toEqual({
      ok: true,
      ids: ["post-c", "post-a", "post-b"],
    });
  });

  it("accepts an empty list", () => {
    expect(validateRelatedPostIds([], "current")).toEqual({ ok: true, ids: [] });
  });

  it("rejects malformed input", () => {
    expect(validateRelatedPostIds("post-a").ok).toBe(false);
    expect(validateRelatedPostIds([""]).ok).toBe(false);
    expect(validateRelatedPostIds([1]).ok).toBe(false);
  });

  it("rejects more than the configured maximum", () => {
    const result = validateRelatedPostIds(
      Array.from({ length: MAX_RELATED_POSTS + 1 }, (_, index) => `post-${index}`)
    );
    expect(result).toMatchObject({ ok: false, code: "TOO_MANY_RELATED_POSTS" });
  });

  it("rejects duplicates after trimming", () => {
    expect(validateRelatedPostIds(["post-a", " post-a "])).toMatchObject({
      ok: false,
      code: "DUPLICATE_RELATED_POST",
    });
  });

  it("rejects a self-reference", () => {
    expect(validateRelatedPostIds(["current"], "current")).toMatchObject({
      ok: false,
      code: "SELF_RELATED_POST",
    });
  });
});
