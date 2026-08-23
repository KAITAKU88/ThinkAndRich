import type { SpineFiller } from "@/lib/algorithms/skyline-packer";

const MARKS = ["§", "∴", "—", "†", "‡"] as const;

/**
 * A thin 1-column filler for the rare gaps the skyline packer can't close
 * with a square card (see skyline-packer.ts). Styled as a library index-card
 * "spine" rather than hidden — it's the visual admission that not every
 * column lines up perfectly, dressed as a deliberate detail instead of a bug.
 */
export function SkylineSpine({ filler }: { filler: SpineFiller }) {
  const mark = MARKS[(filler.col + filler.row) % MARKS.length];

  return (
    <div
      aria-hidden="true"
      style={{
        gridColumn: `${filler.col + 1} / span 1`,
        gridRow: `${filler.row + 1} / span ${filler.height}`,
      }}
      className="relative flex items-center justify-center rounded-2xl border border-border/60 bg-secondary/40 overflow-hidden select-none"
    >
      <span className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-border/50 to-transparent" />
      <span
        className="font-display text-muted-foreground/40 text-lg"
        style={{ writingMode: "vertical-rl" }}
      >
        {mark}
      </span>
      <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-border/50 to-transparent" />
    </div>
  );
}
