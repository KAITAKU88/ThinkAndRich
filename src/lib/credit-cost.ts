import type { CreditCost } from "@/lib/types";

export const CREDIT_COSTS = [0, 1, 2, 3, 4, 5] as const;

export function isCreditCost(value: unknown): value is CreditCost {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 5;
}

export function parseCreditCost(value: unknown, fallback: CreditCost = 1): CreditCost {
  const n = typeof value === "string" ? Number(value) : value;
  return isCreditCost(n) ? n : fallback;
}

/** Step 3 — earthy accent classes for Neo-Brutalist badges. */
export const CREDIT_COST_ACCENT: Record<CreditCost, string> = {
  0: "neo-cost--0",
  1: "neo-cost--1",
  2: "neo-cost--2",
  3: "neo-cost--3",
  4: "neo-cost--4",
  5: "neo-cost--5",
};

/** Decorative border classes removed — cards use unified neo-shadow. */
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
