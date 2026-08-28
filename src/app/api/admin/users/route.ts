import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { desc, asc, and, like, ne, sql } from "drizzle-orm";
import { users, bookmarks, shareLogs, readLogs, orders, userUnlocks } from "@/db/schema";
import { requireAdmin } from "@/lib/api-auth";
import { PAID_TERM_DAYS } from "@/lib/credits";

// Readers only. Admin identity lives under Cấu hình, not this table.
export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const sort = searchParams.get("sort") || "lastLoginAt";
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";

  const db = drizzle(ctx.env.DB);

  const savedCount = sql<number>`(select count(*) from ${bookmarks} where ${bookmarks.userId} = ${users.id})`.as(
    "savedCount"
  );
  const shareCount = sql<number>`(select count(*) from ${shareLogs} where ${shareLogs.userId} = ${users.id})`.as(
    "shareCount"
  );
  const readCount = sql<number>`(select count(distinct ${readLogs.postId}) from ${readLogs} where ${readLogs.userId} = ${users.id})`.as(
    "readCount"
  );
  const remainingCredits = sql<number>`
    (case
      when ${users.paidCreditExpiresAt} is not null and datetime(${users.paidCreditExpiresAt}) > datetime('now')
        then ${users.paidCreditBalance}
      else 0
    end) + ${users.giftCreditBalance}
  `.as("remainingCredits");
  const periodPaidSpent = sql<number>`
    coalesce((
      select sum(${userUnlocks.paidSpent}) from ${userUnlocks}
      where ${userUnlocks.userId} = ${users.id}
        and ${users.paidCreditExpiresAt} is not null
        and ${userUnlocks.unlockedAt} >= datetime(${users.paidCreditExpiresAt}, ${"-" + PAID_TERM_DAYS + " days"})
    ), 0)
  `.as("periodPaidSpent");
  const paidCount = sql<number>`
    (select count(*) from ${orders} where ${orders.userId} = ${users.id} and ${orders.status} = 'PAID')
  `.as("paidCount");
  const revenueVnd = sql<number>`
    coalesce((
      select sum(${orders.amount}) from ${orders}
      where ${orders.userId} = ${users.id} and ${orders.status} = 'PAID' and ${orders.currency} = 'VND'
    ), 0)
  `.as("revenueVnd");
  const userKind = sql<number>`
    case when (
      select count(*) from ${orders} where ${orders.userId} = ${users.id} and ${orders.status} = 'PAID'
    ) > 0 then 1 else 0 end
  `.as("userKind");

  const sortColumn =
    sort === "name"
      ? users.name
      : sort === "lastLoginAt"
        ? users.lastLoginAt
        : sort === "savedCount"
          ? savedCount
          : sort === "shareCount"
            ? shareCount
            : sort === "readCount"
              ? readCount
              : sort === "remainingCredits"
                ? remainingCredits
                : sort === "periodPaidSpent"
                  ? periodPaidSpent
                  : sort === "paidCount"
                    ? paidCount
                    : sort === "revenue"
                      ? revenueVnd
                      : sort === "userKind"
                        ? userKind
                        : users.createdAt;

  const readerOnly = ne(users.role, "ADMIN");
  const rows = await db
    .select({
      user: users,
      savedCount,
      shareCount,
      readCount,
      remainingCredits,
      periodPaidSpent,
      paidCount,
      revenueVnd,
      userKind,
    })
    .from(users)
    .where(q ? and(readerOnly, like(users.email, `%${q}%`)) : readerOnly)
    .orderBy(dir === "asc" ? asc(sortColumn) : desc(sortColumn))
    .all();

  const result = rows.map((r) => ({
    id: r.user.id,
    email: r.user.email,
    name: r.user.name,
    remainingCredits: Number(r.remainingCredits) || 0,
    periodPaidSpent: Number(r.periodPaidSpent) || 0,
    userKind: Number(r.userKind) > 0 ? "Paid" : "Free",
    paidCount: Number(r.paidCount) || 0,
    revenueVnd: Number(r.revenueVnd) || 0,
    createdAt: r.user.createdAt,
    lastLoginAt: r.user.lastLoginAt,
    savedCount: r.savedCount,
    shareCount: r.shareCount,
    readCount: r.readCount,
  }));

  return NextResponse.json({ ok: true, users: result });
}
