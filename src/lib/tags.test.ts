import { describe, it, expect } from "vitest";
import {
  MAX_TAGS_PER_POST,
  MAX_TAG_LENGTH,
  addTag,
  cleanTag,
  normalizeTag,
  parseTagList,
  removeTag,
  suggestTags,
} from "./tags";

describe("normalizeTag", () => {
  it("ignores case and surrounding or repeated spaces", () => {
    expect(normalizeTag("  Ra   Quyết Định ")).toBe(normalizeTag("ra quyết định"));
  });

  // Stripping tone marks would merge words that genuinely differ in
  // Vietnamese, so diacritics stay part of a tag's identity.
  it("keeps Vietnamese diacritics significant", () => {
    expect(normalizeTag("Ra quyết định")).not.toBe(normalizeTag("Ra quyet dinh"));
  });
});

describe("cleanTag", () => {
  it("trims and collapses inner spacing", () => {
    expect(cleanTag("  Charlie   Munger ")).toBe("Charlie Munger");
  });

  it("preserves the letter case someone chose", () => {
    expect(cleanTag("Elon Musk")).toBe("Elon Musk");
  });

  it("caps the length", () => {
    expect(cleanTag("x".repeat(200))).toHaveLength(MAX_TAG_LENGTH);
  });
});

describe("addTag", () => {
  it("adds a tag", () => {
    expect(addTag([], "Vật lý học").tags).toEqual(["Vật lý học"]);
  });

  // The whole reason this is a module and not three lines in a component.
  it("refuses a tag that is the same as one already there", () => {
    const result = addTag(["Ra quyết định"], "  RA QUYẾT ĐỊNH  ");
    expect(result.rejected).toBe("DUPLICATE");
    expect(result.tags).toEqual(["Ra quyết định"]);
  });

  it("refuses an empty tag", () => {
    expect(addTag([], "   ").rejected).toBe("EMPTY");
  });

  it("refuses to go past the limit", () => {
    const full = Array.from({ length: MAX_TAGS_PER_POST }, (_, i) => `tag-${i}`);
    const result = addTag(full, "một cái nữa");
    expect(result.rejected).toBe("TOO_MANY");
    expect(result.tags).toHaveLength(MAX_TAGS_PER_POST);
  });

  it("never mutates what it was given", () => {
    const original = ["Aristotle"];
    addTag(original, "Elon Musk");
    expect(original).toEqual(["Aristotle"]);
  });
});

describe("removeTag", () => {
  it("removes by position, keeping duplicates of the label distinct", () => {
    expect(removeTag(["a", "b", "c"], 1)).toEqual(["a", "c"]);
  });

  it("ignores a position that is not there", () => {
    expect(removeTag(["a"], 5)).toEqual(["a"]);
  });
});

describe("parseTagList", () => {
  it("splits what people actually paste", () => {
    expect(parseTagList("Aristotle, Elon Musk; Vật lý học\nRa quyết định")).toEqual([
      "Aristotle",
      "Elon Musk",
      "Vật lý học",
      "Ra quyết định",
    ]);
  });

  it("drops the empties a trailing separator leaves behind", () => {
    expect(parseTagList("Aristotle,,  ,")).toEqual(["Aristotle"]);
  });
});

describe("suggestTags", () => {
  const ALL = ["Aristotle", "Charlie Munger", "Ra quyết định", "Quản trị rủi ro", "Vật lý học"];

  it("offers everything when nothing has been typed", () => {
    expect(suggestTags(ALL, "", [])).toHaveLength(ALL.length);
  });

  it("matches anywhere in the tag, ignoring case", () => {
    expect(suggestTags(ALL, "munger", [])).toEqual(["Charlie Munger"]);
    expect(suggestTags(ALL, "QUYẾT", [])).toEqual(["Ra quyết định"]);
  });

  it("puts what you are typing the start of first", () => {
    const suggestions = suggestTags(["Rủi ro thị trường", "Quản trị rủi ro"], "quản", []);
    expect(suggestions[0]).toBe("Quản trị rủi ro");
  });

  it("hides tags the post already carries", () => {
    expect(suggestTags(ALL, "", ["aristotle"])).not.toContain("Aristotle");
  });

  it("stays within the limit", () => {
    expect(suggestTags(ALL, "", [], 2)).toHaveLength(2);
  });
});
