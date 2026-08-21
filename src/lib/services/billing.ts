import { delay } from "@/lib/access";

export type PaymentGateway = "STRIPE" | "SEPAY";

export async function createCheckoutSession(input: {
  plan: string;
  gateway: PaymentGateway;
  userId: string;
}) {
  await delay(300);
  return {
    id: `txn_${Date.now()}`,
    amount: 0,
    currency: "VND",
    gateway: input.gateway,
    status: "SUCCESS" as const,
    userId: input.userId,
  };
}

export async function confirmCheckout(sessionId: string) {
  await delay(200);
  return {
    id: sessionId,
    status: "SUCCESS" as const,
  };
}

