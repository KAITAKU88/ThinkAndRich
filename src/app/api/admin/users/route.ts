import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { desc, asc, like, sql } from "drizzle-orm";
import { users, bookmarks, shareLogs, readLogs } from "@/db/schema";
import { requireAdmin } from "@/lib/api-auth";

// Users list with computed columns (saved-post count, share count,
// read count) via subquery COUNTs rather than denormalized columns —
// admin-only traffic, no need to optimize away the join.
export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const sort = searchParams.get("sort") || "createdAt";
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";

  const db = drizzle(ctx.env.DB);

  const savedCount = sql<number>`(select count(*) from ${bookmarks} where ${bookmarks.userId} = ${users.id})`.as("savedCount");
  const shareCount = sql<number>`(select count(*) from ${shareLogs} where ${shareLogs.userId} = ${users.id})`.as("shareCount");
  const readCount = sql<number>`(select count(distinct ${readLogs.postId}) from ${readLogs} where ${readLogs.userId} = ${users.id})`.as("readCount");

  const sortColumn =
    sort === "name" ? users.name :
    sort === "lastLoginAt" ? users.lastLoginAt :
    sort === "savedCount" ? savedCount :
    sort === "shareCount" ? shareCount :
    sort === "readCount" ? readCount :
    users.createdAt;

  const rows = await db
    .select({ user: users, savedCount, shareCount, readCount })
    .from(users)
    .where(q ? like(users.email, `%${q}%`) : undefined)
    .orderBy(dir === "asc" ? asc(sortColumn) : desc(sortColumn))
    .all();

  const result = rows.map((r) => ({
    id: r.user.id,
    email: r.user.email,
    name: r.user.name,
    role: r.user.role,
    paidCreditBalance: r.user.paidCreditBalance,
    paidCreditExpiresAt: r.user.paidCreditExpiresAt,
    giftCreditBalance: r.user.giftCreditBalance,
    createdAt: r.user.createdAt,
    lastLoginAt: r.user.lastLoginAt,
    savedCount: r.savedCount,
    shareCount: r.shareCount,
    readCount: r.readCount,
  }));

  return NextResponse.json({ ok: true, users: result });
}
