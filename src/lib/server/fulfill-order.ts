import { eq, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { orders, promotionRedemptions, promotions, users } from "@/db/schema";
import { packageById } from "@/lib/credit-packages";
import { grantPurchasedCredits } from "@/lib/server/grant-credits";
import { sendPurchaseWelcomeEmail } from "@/lib/server/send-purchase-email";
import type { CreditPackageId } from "@/lib/types";

type OrderRow = typeof orders.$inferSelect;

export async function fulfillPaidOrder(
  db: DrizzleD1Database,
  env: CloudflareEnv,
  order: OrderRow,
  now: Date = new Date()
): Promise<void> {
  await grantPurchasedCredits(db, order.userId, order.packageId as CreditPackageId, now);

  if (order.promotionId) {
    await db
      .update(promotions)
      .set({ usedCount: sql`${promotions.usedCount} + 1` })
      .where(eq(promotions.id, order.promotionId));

    await db.insert(promotionRedemptions).values({
      id: crypto.randomUUID(),
      promotionId: order.promotionId,
      userId: order.userId,
      orderId: order.id,
      redeemedAt: now.toISOString(),
    });
  }

  const user = await db.select().from(users).where(eq(users.id, order.userId)).get();
  if (!user) return;

  const pack = packageById(order.packageId as CreditPackageId);
  await sendPurchaseWelcomeEmail(env, {
    userName: user.name,
    userEmail: user.email,
    packageId: order.packageId as CreditPackageId,
    creditsGranted: pack.credits,
    source: order.gateway === "admin" ? "admin_grant" : "purchase",
  });
}
