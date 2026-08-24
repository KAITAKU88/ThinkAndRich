"use client";

import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  activeSort: string;
  dir: "asc" | "desc";
  onSort: (key: string) => void;
  align?: "left" | "right" | "center";
}

export function SortableHeader({ label, sortKey, activeSort, dir, onSort, align = "left" }: SortableHeaderProps) {
  const active = activeSort === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        "inline-flex items-center gap-1 hover:text-foreground transition-colors font-semibold",
        active ? "text-foreground" : "text-muted-foreground",
        align === "right" && "flex-row-reverse",
        align === "center" && "justify-center"
      )}
    >
      <span>{label}</span>
      {active ? (
        dir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      )}
    </button>
  );
}
