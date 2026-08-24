import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq, sql } from "drizzle-orm";
import { orders } from "@/db/schema";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const db = drizzle(ctx.env.DB);

  const revenueByCurrency = await db
    .select({ currency: orders.currency, total: sql<number>`sum(${orders.amount})`, count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.status, "PAID"))
    .groupBy(orders.currency)
    .all();

  const countByStatus = await db
    .select({ status: orders.status, count: sql<number>`count(*)` })
    .from(orders)
    .groupBy(orders.status)
    .all();

  const paidByTier = await db
    .select({ tier: orders.tier, count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.status, "PAID"))
    .groupBy(orders.tier)
    .all();

  return NextResponse.json({ ok: true, revenueByCurrency, countByStatus, paidByTier });
}
