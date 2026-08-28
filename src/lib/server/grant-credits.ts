import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { users } from "@/db/schema";
import { applyPurchase, walletFromUserRow, walletToUserPatch } from "@/lib/credits";
import { packageById } from "@/lib/credit-packages";
import type { CreditPackageId } from "@/lib/types";

export async function grantPurchasedCredits(
  db: DrizzleD1Database,
  userId: string,
  packageId: CreditPackageId,
  now: Date = new Date()
) {
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) return;
  const pack = packageById(packageId);
  const next = applyPurchase(walletFromUserRow(user), pack.credits, now);
  await db.update(users).set(walletToUserPatch(next)).where(eq(users.id, userId));
}
