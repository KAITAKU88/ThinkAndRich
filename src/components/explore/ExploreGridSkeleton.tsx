"use client";

import { Brain } from "lucide-react";

/** Step 1: plain loading placeholders — no skyline grid skeleton. */
export function ExploreGridSkeleton() {
  return (
    <div>
      <p>Đang tải thư viện…</p>
      <p className="sr-only">
        <Brain />
        Đang tải thư viện
      </p>
    </div>
  );
}
