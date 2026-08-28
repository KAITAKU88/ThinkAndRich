import type { Post } from "@/lib/types";

export interface Slot {
  id: string;
  size: 2 | 3 | 4;
  col: number;  // 0-indexed column start
  row: number;  // 0-indexed row start
}

export interface SlottedPost {
  post: Post;
  slot: Slot;
}

// A 1-column-wide "spine" filler. See generateSkylineSlots() for why this
// exists: it is the deliberate replacement for what used to be a silent
// rendering hole in the grid.
export interface SpineFiller {
  id: string;
  col: number;
  row: number;
  height: number; // rows tall, always >= 1
}

export interface SkylineLayout {
  slots: Slot[];
  fillers: SpineFiller[];
}

/** Column count for the skyline bento grid — must stay in sync with ExplorePage. */
export function readSkylineNumCols(viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0): number {
  if (viewportWidth < 640) return 4;
  if (viewportWidth < 1024) return 8;
  return 12;
}

export function skylineGapPx(numCols: number): number {
  if (numCols >= 12) return 14;
  if (numCols >= 8) return 12;
  return 10;
}

// ─────────────────────────────────────────────────────────────────────────────
// Seeded PRNG — deterministic so layout never flickers on re-render
// ─────────────────────────────────────────────────────────────────────────────
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BƯỚC 1: Continuous Skyline Tiling — ZERO GAP + SIZE VARIETY guarantee
//
// TWO CORE RULES:
//
// 1. REMAINDER RULE: When placing a block of size N into a flat span W,
//    the remainder R = W − N must be 0 or ≥ 2. R === 1 is FORBIDDEN.
//    → Guarantees no 1-column orphan strips.
//
// 2. VARIETY RULE: Prefer a size different from the last placed slot AND
//    from the horizontal left-neighbor. Avoid 3+ consecutive same sizes.
//    → Produces organic, visually varied bento layouts.
// ─────────────────────────────────────────────────────────────────────────────
export function generateSkylineSlots(
  targetCount: number,
  numCols: number = 12
): SkylineLayout {
  const heights = new Array(numCols).fill(0);
  const slots: Slot[] = [];
  const fillers: SpineFiller[] = [];
  let slotId = 0;
  let fillerId = 0;
  let safetyCounter = 0;
  const maxIterations = targetCount * 40;

  const rand = seededRandom(targetCount * 31 + numCols * 17 + 42);

  // Available block sizes for this grid width
  const allSizes: (2 | 3 | 4)[] =
    numCols >= 8 ? [4, 3, 2] : [4, 2];

  // ── Variety tracking state ──
  let lastPlacedSize = 0;
  let secondLastSize = 0;
  // Per-column: the size of the last slot that touched each column
  const colLastSize = new Array(numCols).fill(0);

  while (slots.length < targetCount && safetyCounter++ < maxIterations) {
    // 1. Find the column with the lowest height (leftmost if tied)
    const minHeight = Math.min(...heights);
    const minCol = heights.indexOf(minHeight);

    // 2. Measure contiguous flat span at minHeight starting from minCol
    let spanWidth = 0;
    while (
      minCol + spanWidth < numCols &&
      heights[minCol + spanWidth] === minHeight
    ) {
      spanWidth++;
    }

    // 3. REMAINDER RULE: collect valid sizes
    const validSizes = allSizes.filter((s) => {
      if (s > spanWidth) return false;
      if (minCol + s > numCols) return false;
      const remainder = spanWidth - s;
      return remainder === 0 || remainder >= 2;
    });

    if (validSizes.length === 0) {
      // No square block can legally start at (minCol, minHeight): either
      // spanWidth is 1 (a lone column with no neighbor at the same height),
      // or spanWidth is small enough that every available size would leave
      // a forbidden remainder of 1 (e.g. spanWidth 3 when only {2, 4} are
      // in play on a narrow mobile grid).
      //
      // The previous fix here tried to "catch up" to a neighboring column's
      // height. That's wrong whenever spanWidth >= 2: heights[minCol + 1]
      // is NOT a taller neighbor to reach — it's part of the *same* flat
      // span, already sitting at minHeight. neighborMin then equals
      // minHeight itself, the column's height never changes, and the loop
      // spins on the same (minCol, minHeight) forever, burning the entire
      // iteration budget while emitting thousands of zero-height fillers
      // and returning far fewer post slots than targetCount (confirmed via
      // fuzzing: numCols=5 produced 1 slot instead of 992, with 40M+
      // fillers, before this fix).
      //
      // Fix: always make guaranteed forward progress by raising just the
      // leftmost column of the span by the smallest available block size.
      // That's the coarsest step that's still meaningful, it's independent
      // of any neighbor lookup, and it strictly increases heights[minCol]
      // every time — so the loop always terminates. The 1-column gap this
      // opens up is filled with an explicit spine filler instead of being
      // left as a silent hole in the grid.
      const step = Math.min(...allSizes);

      fillers.push({
        id: `filler_${fillerId++}`,
        col: minCol,
        row: minHeight,
        height: step,
      });

      heights[minCol] = minHeight + step;
      continue;
    }

    // 4. VARIETY RULE: prefer sizes different from recent neighbors
    const avoidSet = new Set<number>();
    // Avoid repeating the last placed size
    if (lastPlacedSize > 0) avoidSet.add(lastPlacedSize);
    // Avoid matching the left horizontal neighbor
    const leftNeighborSize = minCol > 0 ? colLastSize[minCol - 1] : 0;
    if (leftNeighborSize > 0) avoidSet.add(leftNeighborSize);
    // Extra penalty: if the last 2 were the same, strongly avoid that size
    if (lastPlacedSize === secondLastSize && lastPlacedSize > 0) {
      avoidSet.add(lastPlacedSize);
    }

    // Preferred = valid sizes NOT in the avoid set
    const preferred = validSizes.filter((s) => !avoidSet.has(s));
    const candidates = preferred.length > 0 ? preferred : validSizes;

    // Weighted selection among candidates
    let chosenSize: 2 | 3 | 4;
    const r = rand();

    if (candidates.length === 1) {
      chosenSize = candidates[0];
    } else if (candidates.includes(4) && r < 0.15) {
      chosenSize = 4;
    } else if (candidates.includes(3) && r < 0.50) {
      chosenSize = 3;
    } else if (candidates.includes(2)) {
      chosenSize = 2;
    } else {
      chosenSize = candidates[candidates.length - 1];
    }

    // 5. Place the slot and update all tracking state
    slots.push({
      id: `slot_${slotId++}`,
      size: chosenSize,
      col: minCol,
      row: minHeight,
    });

    for (let c = 0; c < chosenSize; c++) {
      heights[minCol + c] = minHeight + chosenSize;
      colLastSize[minCol + c] = chosenSize;
    }

    secondLastSize = lastPlacedSize;
    lastPlacedSize = chosenSize;
  }

  return { slots, fillers };
}

// ─────────────────────────────────────────────────────────────────────────────
// BƯỚC 2: Elastic Dispatcher — assign posts to slots by title–size fit
// ─────────────────────────────────────────────────────────────────────────────
export function assignPostsToSkylineSlots(
  posts: Post[],
  slots: Slot[]
): SlottedPost[] {
  if (posts.length === 0 || slots.length === 0) return [];

  // Classify posts by title length
  const long  = posts.filter((p) => (p.title || "").length > 60);
  const mid   = posts.filter((p) => {
    const len = (p.title || "").length;
    return len >= 26 && len <= 60;
  });
  const short = posts.filter((p) => (p.title || "").length < 26);

  const slotted: SlottedPost[] = [];
  const used = new Set<string>();

  function pick(...groups: Post[][]): Post | undefined {
    for (const g of groups) {
      const found = g.find((p) => !used.has(p.id));
      if (found) return found;
    }
    return undefined;
  }

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    let selected: Post | undefined;

    if (slot.size >= 4) {
      selected = pick(long, mid, short);
    } else if (slot.size === 3) {
      selected = pick(mid, long, short);
    } else {
      selected = pick(short, mid, long);
    }

    if (!selected) {
      selected = posts.find((p) => !used.has(p.id)) || posts[i % posts.length];
    }

    used.add(selected.id);
    slotted.push({ post: selected, slot });
  }

  return slotted;
}

// ─────────────────────────────────────────────────────────────────────────────
// BƯỚC 3: Row-accurate pagination — cut the skyline only where its bottom
// edge is flat, never mid-block.
//
// A row `r` is a valid cut line only if no slot or filler *straddles* it —
// i.e. no block's vertical span (row, row + size) contains r in its
// interior. Cutting anywhere else would slice a 3×3/4×4 card in half
// visually (the ragged, staggered-bottom look).
// ─────────────────────────────────────────────────────────────────────────────
export function findFlatRowBoundaries(slots: Slot[], fillers: SpineFiller[]): number[] {
  const spans = [
    ...slots.map((s) => ({ row: s.row, size: s.size })),
    ...fillers.map((f) => ({ row: f.row, size: f.height })),
  ];
  if (spans.length === 0) return [0];

  let maxRow = 0;
  const blocked = new Set<number>();
  for (const span of spans) {
    maxRow = Math.max(maxRow, span.row + span.size);
    for (let r = span.row + 1; r < span.row + span.size; r++) {
      blocked.add(r);
    }
  }

  const boundaries: number[] = [];
  for (let r = 0; r <= maxRow; r++) {
    if (!blocked.has(r)) boundaries.push(r);
  }
  return boundaries;
}

// Groups flat boundaries into page breaks, each page holding at least
// `minCardsPerPage` cards (except possibly the last). Returns the ordered
// list of row cut-lines: page N spans [cuts[N-1], cuts[N]).
/**
 * Cards a page must accumulate before the paginator is allowed to cut at a
 * flat skyline boundary.
 *
 * It lives here, next to the algorithm it governs, so a test can assert on it
 * — it was previously a bare constant inside the Khám phá component, where
 * being raised from 10 to 50 during an unrelated rework silently switched
 * pagination off: at a 63-post catalogue on a 12-column desktop grid, no flat
 * boundary is reached before the end of the grid, so the whole catalogue
 * collapsed into a single page and the controls hid themselves.
 */
export const MIN_CARDS_PER_PAGE = 20;

export function paginateSkylineRows(
  slots: Slot[],
  fillers: SpineFiller[],
  minCardsPerPage: number
): number[] {
  const boundaries = findFlatRowBoundaries(slots, fillers);
  if (boundaries.length <= 1) return boundaries;

  const cuts: number[] = [boundaries[0]];
  let pageStart = boundaries[0];

  for (let i = 1; i < boundaries.length; i++) {
    const candidate = boundaries[i];
    const isLastBoundary = i === boundaries.length - 1;
    const cardsInRange = slots.filter((s) => s.row >= pageStart && s.row < candidate).length;

    if (cardsInRange >= minCardsPerPage || isLastBoundary) {
      cuts.push(candidate);
      pageStart = candidate;
    }
  }

  return cuts;
}
