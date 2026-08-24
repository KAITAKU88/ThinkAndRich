import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc } from "drizzle-orm";
import { readLogs } from "@/db/schema";
import { requireSession } from "@/lib/api-auth";
import type { ReadLog } from "@/lib/types";

// The caller's read history — backs ProfilePage's history tab, and the
// store hydrates `readPostIds`/`todayReadCount` from this on login/restore
// (client derives distinct-posts-today from the raw rows, same rule as
// the server's getTodayReadCount in src/lib/server/access-control.ts).
export async function GET(request: NextRequest) {
  const ctx = await requireSession(request);
  if (!ctx) {
    return NextResponse.json({ ok: false, message: "Chưa đăng nhập." }, { status: 401 });
  }

  const db = drizzle(ctx.env.DB);
  const rows = await db
    .select()
    .from(readLogs)
    .where(eq(readLogs.userId, ctx.session.sub))
    .orderBy(desc(readLogs.readAt))
    .all();

  const result: ReadLog[] = rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userEmail: r.userEmail,
    userName: r.userName,
    postId: r.postId,
    postTitle: r.postTitle,
    pillar: (r.pillar as ReadLog["pillar"]) ?? undefined,
    postCategory: r.postCategory ?? undefined,
    readAt: r.readAt,
    reaction: (r.reaction as ReadLog["reaction"]) ?? undefined,
  }));

  return NextResponse.json({ ok: true, readLogs: result });
}
