import type { CreditCost } from "@/lib/types";
import { CreditCoin } from "@/components/credits/CreditCoin";
import { CREDIT_COST_ACCENT } from "@/lib/credit-cost";

export function CreditBadge({ cost }: { cost: CreditCost; className?: string }) {
  if (cost === 0) {
    return <span className={`neo-badge ${CREDIT_COST_ACCENT[0]}`}>Open</span>;
  }
  return (
    <span className={`neo-badge ${CREDIT_COST_ACCENT[cost]}`}>
      {cost} <CreditCoin />
    </span>
  );
}
