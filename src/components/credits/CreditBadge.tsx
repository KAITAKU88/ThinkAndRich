import { cn } from "@/lib/utils";
import type { CreditCost } from "@/lib/types";
import { CREDIT_COST_BADGE } from "@/lib/credit-cost";
import { CreditCoin } from "@/components/credits/CreditCoin";

export function CreditBadge({
  cost,
  className,
}: {
  cost: CreditCost;
  className?: string;
}) {
  if (cost === 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-xs select-none",
          CREDIT_COST_BADGE[0],
          className
        )}
      >
        Open
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold tabular-nums tracking-wider px-2 py-0.5 rounded-full border shadow-xs select-none",
        CREDIT_COST_BADGE[cost],
        className
      )}
    >
      {cost}
      <CreditCoin className="h-3 w-3" />
    </span>
  );
}
