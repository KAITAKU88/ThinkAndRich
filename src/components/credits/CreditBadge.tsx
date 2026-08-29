import type { CreditCost } from "@/lib/types";
import { CreditCoin } from "@/components/credits/CreditCoin";

export function CreditBadge({ cost }: { cost: CreditCost; className?: string }) {
  if (cost === 0) {
    return <span>Open</span>;
  }
  return (
    <span>
      {cost} <CreditCoin />
    </span>
  );
}
