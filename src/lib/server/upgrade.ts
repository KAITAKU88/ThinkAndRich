import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { users } from "@/db/schema";
import { getPppPricing } from "@/lib/geo-pricing";
import { calculateUpgradeTopUp, type UpgradeQuote } from "@/lib/upgrade-pricing";
import type { CountryCode } from "@/lib/types";

/**
 * Server-side quote for a PLUS → PRO upgrade.
 *
 * Kept apart from the route handler because two endpoints need the identical
 * number: the modal that shows the member what they will pay, and the one
 * that creates the order they pay it with. A quote computed twice from two
 * copies of the rules is a quote that can disagree with itself.
 *
 * The amount is always derived here from the member's own record and the
 * server's pricing table — never accepted from the client, same rule as
 * src/app/api/checkout/route.ts.
 */

export type UpgradeRefusal =
  | "NOT_A_MEMBER"
  | "ALREADY_PRO"
  | "GATEWAY_UNSUPPORTED";

export interface UpgradeOffer {
  quote: UpgradeQuote;
  gateway: "sepay" | "lemonsqueezy";
  countryCode: CountryCode;
  pricePlus: number;
  pricePro: number;
  currencySymbol: string;
  /** True when the term start had to be assumed rather than read. */
  creditedFromRecordedTerm: boolean;
}

export async function buildUpgradeOffer(
  db: DrizzleD1Database<Record<string, never>>,
  userId: string,
  countryCode: CountryCode,
  now: Date = new Date()
): Promise<{ ok: true; offer: UpgradeOffer } | { ok: false; reason: UpgradeRefusal }> {
  const user = await db.select().from(users).where(eq(users.id, userId)).get();

  if (!user || user.tier === "FREE") return { ok: false, reason: "NOT_A_MEMBER" };
  if (user.tier === "PRO") return { ok: false, reason: "ALREADY_PRO" };

  const ppp = getPppPricing(countryCode);

  // Only SePay can charge the prorated figure. A Lemon Squeezy checkout bills
  // whatever its configured variant costs, so putting an upgrade through it
  // would quietly charge the full PRO price instead of the top-up. Charging
  // the wrong amount is worse than not offering the upgrade, so the gateway
  // says no until it can carry a custom price (LS supports one only on a
  // variant configured for it, which is a dashboard decision).
  if (ppp.gateway !== "sepay") return { ok: false, reason: "GATEWAY_UNSUPPORTED" };

  // A member whose term start was never recorded — granted PLUS by hand, or
  // by the admin allowlist — has no term to credit. Falling back to their
  // signup date would invent credit out of a purchase that never happened,
  // so they are quoted the full PRO price and told why.
  const creditedFromRecordedTerm = Boolean(user.planStartedAt);
  const termStart = user.planStartedAt ?? now.toISOString();

  const quote = calculateUpgradeTopUp(
    ppp.plans.PLUS.price,
    ppp.plans.PRO.price,
    termStart,
    now,
    ppp.currency
  );

  return {
    ok: true,
    offer: {
      quote: creditedFromRecordedTerm
        ? quote
        : { ...quote, spentValue: ppp.plans.PLUS.price, remainingCredit: 0, topUpAmount: ppp.plans.PRO.price },
      gateway: ppp.gateway,
      countryCode: ppp.countryCode,
      pricePlus: ppp.plans.PLUS.price,
      pricePro: ppp.plans.PRO.price,
      currencySymbol: ppp.currencySymbol,
      creditedFromRecordedTerm,
    },
  };
}

export const UPGRADE_REFUSAL_MESSAGES: Record<UpgradeRefusal, string> = {
  NOT_A_MEMBER: "Chỉ hội viên PLUS mới có thể nâng cấp lên PRO.",
  ALREADY_PRO: "Bạn đã là hội viên PRO.",
  GATEWAY_UNSUPPORTED:
    "Nâng cấp giữa kỳ hiện chỉ khả dụng với thanh toán trong nước. Vui lòng liên hệ hỗ trợ để được xử lý thủ công.",
};
