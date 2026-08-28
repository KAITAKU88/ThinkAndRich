import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { and, eq, gte, sql } from "drizzle-orm";
import { userUnlocks } from "@/db/schema";
import { requireSession } from "@/lib/api-auth";
import { loadUserCredits } from "@/lib/server/access-control";
import { currentTermStartedAt, daysUntilExpiry, GIFT_MONTHLY_CAP } from "@/lib/credits";

export async function GET(request: NextRequest) {
  const ctx = await requireSession(request);
  if (!ctx) {
    return NextResponse.json({ ok: false, message: "Chưa đăng nhập." }, { status: 401 });
  }

  const db = drizzle(ctx.env.DB);
  const now = new Date();
  const wallet = await loadUserCredits(db, ctx.session.sub, now);
  if (!wallet) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy tài khoản." }, { status: 401 });
  }

  const termStart = currentTermStartedAt(wallet, now);
  let creditsSpentThisTerm = 0;
  let unlockedCount = 0;

  if (termStart) {
    const spent = await db
      .select({
        total: sql<number>`coalesce(sum(${userUnlocks.creditsSpent}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(userUnlocks)
      .where(
        and(eq(userUnlocks.userId, ctx.session.sub), gte(userUnlocks.unlockedAt, termStart.toISOString()))
      )
      .get();
    creditsSpentThisTerm = Number(spent?.total ?? 0);
    unlockedCount = Number(spent?.count ?? 0);
  } else {
    const count = await db
      .select({ count: sql<number>`count(*)` })
      .from(userUnlocks)
      .where(eq(userUnlocks.userId, ctx.session.sub))
      .get();
    unlockedCount = Number(count?.count ?? 0);
  }

  return NextResponse.json({
    ok: true,
    usage: {
      paidBalance: wallet.paidCreditBalance,
      paidExpiresAt: wallet.paidCreditExpiresAt,
      daysRemaining: daysUntilExpiry(wallet, now),
      giftRemainingToday: wallet.giftCreditBalance,
      giftGrantedThisMonth: wallet.giftGrantedThisMonth,
      giftMonthlyCap: GIFT_MONTHLY_CAP,
      creditsSpentThisTerm,
      unlockedCount,
    },
  });
}
