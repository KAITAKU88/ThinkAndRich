"use client";

import { Brain } from "lucide-react";

/** Skeleton grid shown while Explore hydrates search params or first paint. */
export function ExploreGridSkeleton() {
  return (
    <div className="container mx-auto max-w-[1650px] px-2.5 sm:px-4 md:px-6 py-4 sm:py-6">
      <div className="h-9 w-48 rounded-lg bg-muted/40 animate-pulse mb-6" />
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-muted/30 animate-pulse" />
        ))}
      </div>
      <div className="skyline-grid pb-4" style={{ ["--cols" as string]: 4, ["--cell" as string]: "72px" }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-muted/25 animate-pulse aspect-square"
            style={{
              gridColumn: `${(i % 4) + 1} / span 2`,
              gridRow: `${Math.floor(i / 4) * 2 + 1} / span 2`,
            }}
          />
        ))}
      </div>
      <p className="sr-only">
        <Brain className="w-4 h-4" />
        Đang tải thư viện
      </p>
    </div>
  );
}
