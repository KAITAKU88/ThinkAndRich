import { describe, it, expect } from "vitest";
import { formatFormula, formatViews, timeAgo } from "./utils";

describe("formatFormula", () => {
  it("strips \\text{} grouping", () => {
    expect(formatFormula("\\text{Margin} = 10")).toBe("Margin = 10");
  });

  it("converts \\frac{a}{b} to (a)/(b)", () => {
    expect(formatFormula("\\frac{a}{b}")).toBe("(a)/(b)");
  });

  it("resolves nested grouping commands inward-out", () => {
    expect(formatFormula("\\tau_{\\text{net}}")).toBe("τ_net");
  });

  it("converts known symbol commands", () => {
    expect(formatFormula("\\sum \\implies \\ge")).toBe("Σ ⟹ ≥");
  });

  it("applies the thousands-separator trick", () => {
    expect(formatFormula("45{,}000")).toBe("45,000");
  });

  it("degrades unrecognized commands to bare words instead of visible LaTeX", () => {
    expect(formatFormula("\\omega \\unknowncmd")).toBe("ω unknowncmd");
  });

  it("collapses whitespace and trims", () => {
    expect(formatFormula("  a   \\quad  b  ")).toBe("a b");
  });
});

describe("formatViews", () => {
  it("formats using Vietnamese thousands separators", () => {
    expect(formatViews(1234567)).toBe((1234567).toLocaleString("vi-VN"));
  });

  it("handles zero", () => {
    expect(formatViews(0)).toBe("0");
  });
});

describe("timeAgo", () => {
  it("returns 'Hôm nay' for today", () => {
    expect(timeAgo(new Date().toISOString())).toBe("Hôm nay");
  });

  it("returns singular day phrasing for 1 day ago", () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(yesterday)).toBe("1 ngày trước");
  });

  it("returns week phrasing past 7 days", () => {
    const twoWeeksAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(twoWeeksAgo)).toBe("2 tuần trước");
  });
});
