"use client";

import { useEffect, useRef, useState } from "react";
import type { Post } from "@/lib/types";
import type { Slot } from "@/lib/algorithms/skyline-packer";
import { InteractiveSquareCard } from "@/components/ideas/InteractiveSquareCard";
import { cn } from "@/lib/utils";

/** Preload cards ~2–3 rows outside the viewport before mounting heavy card UI. */
const LAZY_ROOT_MARGIN = "900px 0px";

interface LazySkylineCardProps {
  post: Post;
  slot: Slot;
  priorityIndex: number;
}

export function LazySkylineCard({ post, slot, priorityIndex }: LazySkylineCardProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(priorityIndex < 18);

  useEffect(() => {
    if (visible) return;
    const el = hostRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin: LAZY_ROOT_MARGIN, threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  const gridStyle: React.CSSProperties = {
    gridColumn: `${slot.col + 1} / span ${slot.size}`,
    gridRow: `${slot.row + 1} / span ${slot.size}`,
  };

  if (!visible) {
    return (
      <div
        ref={hostRef}
        style={gridStyle}
        className={cn(
          "skyline-card-container rounded-2xl border border-border/60 bg-muted/30 animate-pulse",
          slot.size >= 4 ? "min-h-[280px]" : slot.size === 3 ? "min-h-[220px]" : "min-h-[160px]"
        )}
        aria-hidden="true"
      />
    );
  }

  return (
    <div ref={hostRef} style={gridStyle} className="skyline-card-container min-h-0">
      <InteractiveSquareCard post={post} priorityIndex={priorityIndex} />
    </div>
  );
}
