import type { CreditCost } from "@/lib/types";

export const CREDIT_COSTS = [0, 1, 2, 3, 4, 5] as const;

export function isCreditCost(value: unknown): value is CreditCost {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 5;
}

export function parseCreditCost(value: unknown, fallback: CreditCost = 1): CreditCost {
  const n = typeof value === "string" ? Number(value) : value;
  return isCreditCost(n) ? n : fallback;
}

/** Card / badge border colour per CREDIT_PRICING_MODEL.md. */
export const CREDIT_COST_BORDER: Record<CreditCost, string> = {
  0: "border-white dark:border-white/80",
  1: "border-emerald-500",
  2: "border-blue-500",
  3: "border-violet-500",
  4: "border-amber-400",
  5: "border-red-500",
};

export const CREDIT_COST_BADGE: Record<CreditCost, string> = {
  0: "bg-white text-foreground border-white dark:bg-white/10 dark:text-white dark:border-white/40",
  1: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40",
  2: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40",
  3: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/40",
  4: "bg-amber-400/15 text-amber-800 dark:text-amber-300 border-amber-400/40",
  5: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40",
};

/** Map a legacy access-level string onto a credit cost (seed / one-shot migration). */
export function legacyAccessToCreditCost(level: string | null | undefined): CreditCost {
  switch (level) {
    case "OPEN":
      return 0;
    case "FREE":
      return 1;
    case "MEMBER_PLUS":
      return 3;
    case "MEMBER_PRO":
      return 5;
    default:
      return 1;
  }
}
