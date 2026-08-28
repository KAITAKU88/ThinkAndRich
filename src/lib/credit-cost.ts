import type { CreditCost } from "@/lib/types";

export const CREDIT_COSTS = [0, 1, 2, 3, 4, 5] as const;

export function isCreditCost(value: unknown): value is CreditCost {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 5;
}

export function parseCreditCost(value: unknown, fallback: CreditCost = 1): CreditCost {
  const n = typeof value === "string" ? Number(value) : value;
  return isCreditCost(n) ? n : fallback;
}

/** Inline accent colour — tokens live in globals.css (`--credit-cost-*`). */
export const CREDIT_COST_ACCENT: Record<CreditCost, string> = {
  0: "var(--credit-cost-0)",
  1: "var(--credit-cost-1)",
  2: "var(--credit-cost-2)",
  3: "var(--credit-cost-3)",
  4: "var(--credit-cost-4)",
  5: "var(--credit-cost-5)",
};

/** Border utility class per cost — see `.credit-border-*` in globals.css. */
export const CREDIT_COST_BORDER: Record<CreditCost, string> = {
  0: "credit-border-0",
  1: "credit-border-1",
  2: "credit-border-2",
  3: "credit-border-3",
  4: "credit-border-4",
  5: "credit-border-5",
};

/** Badge utility class per cost — see `.credit-badge-*` in globals.css. */
export const CREDIT_COST_BADGE: Record<CreditCost, string> = {
  0: "credit-badge-0",
  1: "credit-badge-1",
  2: "credit-badge-2",
  3: "credit-badge-3",
  4: "credit-badge-4",
  5: "credit-badge-5",
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
