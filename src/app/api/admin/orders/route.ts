import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { desc, eq } from "drizzle-orm";
import { orders, users } from "@/db/schema";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const db = drizzle(ctx.env.DB);
  const rows = await db
    .select({ order: orders, userEmail: users.email, userName: users.name })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(status && status !== "ALL" ? eq(orders.status, status as "PENDING" | "PAID" | "FAILED" | "CANCELED") : undefined)
    .orderBy(desc(orders.createdAt))
    .all();

  const result = rows.map((r) => ({ ...r.order, userEmail: r.userEmail, userName: r.userName }));
  return NextResponse.json({ ok: true, orders: result });
}
