import { PLANS } from "@/lib/data";
import { delay } from "@/lib/access";
import type { SubscriptionTier } from "@/lib/types";

export type PaymentGateway = "STRIPE" | "SEPAY";

export async function createCheckoutSession(input: {
  plan: "PREMIUM" | "SUPER";
  gateway: PaymentGateway;
  userId: string;
}) {
  await delay(400);
  const plan = PLANS.find((p) => p.id === input.plan)!;
  return {
    id: `txn_${Date.now()}`,
    amount: plan.priceVnd,
    currency: "VND",
    gateway: input.gateway,
    status: "PENDING" as const,
    plan: input.plan as SubscriptionTier,
    userId: input.userId,
  };
}

export async function confirmCheckout(sessionId: string) {
  await delay(300);
  return {
    id: sessionId,
    status: "SUCCESS" as const,
  };
}
