import type { CreditCost } from "@/lib/types";

export const CREDIT_COSTS = [0, 1, 2, 3, 4, 5] as const;

export function isCreditCost(value: unknown): value is CreditCost {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 5;
}

export function parseCreditCost(value: unknown, fallback: CreditCost = 1): CreditCost {
  const n = typeof value === "string" ? Number(value) : value;
  return isCreditCost(n) ? n : fallback;
}

/** Step 1 teardown — accent tokens removed until Step 3. */
export const CREDIT_COST_ACCENT: Record<CreditCost, string> = {
  0: "",
  1: "",
  2: "",
  3: "",
  4: "",
  5: "",
};

/** Step 1 teardown — no decorative utility classes until Step 3. */
export const CREDIT_COST_BORDER: Record<CreditCost, string> = {
  0: "",
  1: "",
  2: "",
  3: "",
  4: "",
  5: "",
};

export const CREDIT_COST_BADGE: Record<CreditCost, string> = {
  0: "",
  1: "",
  2: "",
  3: "",
  4: "",
  5: "",
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
