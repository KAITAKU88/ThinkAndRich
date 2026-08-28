import { describe, it, expect } from "vitest";
import { generateSkylineSlots, paginateSkylineRows, MIN_CARDS_PER_PAGE, applySkylineGridMetrics } from "./skyline-packer";

// Pagination has to actually paginate.
//
// MIN_CARDS_PER_PAGE was once raised from 10 to 50 inside an unrelated rework
// of the Khám phá filters. At the site's real catalogue size that switched
// pagination off outright on desktop: with 63 posts on a 12-column grid no
// flat skyline boundary is reached before the end of the grid, so every post
// landed on one page and the controls hid themselves. Nothing threw, no test
// failed, and the regression sat there until someone noticed the page numbers
// were gone.
//
// These cases pin the behaviour at sizes the catalogue actually passes
// through, across the three breakpoints ExplorePage switches between.

const COLUMN_COUNTS = [4, 8, 12];

function pageSizes(total: number, cols: number): number[] {
  const { slots, fillers } = generateSkylineSlots(total, cols);
  const cuts = paginateSkylineRows(slots, fillers, MIN_CARDS_PER_PAGE);
  const pages = Math.max(1, cuts.length - 1);
  return Array.from({ length: pages }, (_, i) => {
    const from = cuts[i] ?? 0;
    const to = cuts[i + 1] ?? Infinity;
    return slots.filter((s) => s.row >= from && s.row < to).length;
  });
}

describe("paginateSkylineRows at realistic catalogue sizes", () => {
  it.each(COLUMN_COUNTS)("splits today's 63-post catalogue across pages at %i columns", (cols) => {
    const sizes = pageSizes(63, cols);
    expect(sizes.length, `pages: [${sizes.join(", ")}]`).toBeGreaterThan(1);
  });

  it.each(COLUMN_COUNTS)("keeps splitting as the catalogue grows, at %i columns", (cols) => {
    const sizes = pageSizes(200, cols);
    expect(sizes.length, `pages: [${sizes.join(", ")}]`).toBeGreaterThanOrEqual(4);
  });

  it("leaves a catalogue smaller than one page unpaginated", () => {
    expect(pageSizes(8, 12)).toHaveLength(1);
  });

  it.each(COLUMN_COUNTS)("never leaves a page holding a single card at %i columns", (cols) => {
    // A page with one card on it reads as a bug to a reader, even though the
    // algorithm is entitled to cut there.
    for (const total of [63, 97, 150, 200]) {
      const sizes = pageSizes(total, cols);
      expect(Math.min(...sizes), `total=${total} -> [${sizes.join(", ")}]`).toBeGreaterThan(1);
    }
  });
});

describe("applySkylineGridMetrics", () => {
  it("writes --cols matching the packing column count", () => {
    const props: Record<string, string> = {};
    const el = {
      clientWidth: 1200,
      style: {
        setProperty: (key: string, value: string) => {
          props[key] = value;
        },
      },
    } as unknown as HTMLElement;
    applySkylineGridMetrics(el, 12);
    expect(props["--cols"]).toBe("12");
    expect(props["--gap"]).toBe("14px");
    expect(parseFloat(props["--cell"])).toBeCloseTo((1200 - 14 * 11) / 12);
  });
});
