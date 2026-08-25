import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc } from "drizzle-orm";
import { posts, readLogs } from "@/db/schema";
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
  // Joined to the post so each row carries its access level: the store meters
  // today's usage from these rows and has to apply the same per-level rule the
  // server applies (src/lib/quota.ts), or the number on screen disagrees with
  // the one actually enforced.
  const rows = await db
    .select({ log: readLogs, accessLevel: posts.accessLevel })
    .from(readLogs)
    .innerJoin(posts, eq(posts.id, readLogs.postId))
    .where(eq(readLogs.userId, ctx.session.sub))
    .orderBy(desc(readLogs.readAt))
    .all();

  const result: (ReadLog & { accessLevel: string })[] = rows.map(({ log, accessLevel }) => ({
    id: log.id,
    userId: log.userId,
    userEmail: log.userEmail,
    userName: log.userName,
    postId: log.postId,
    postTitle: log.postTitle,
    pillar: (log.pillar as ReadLog["pillar"]) ?? undefined,
    postCategory: log.postCategory ?? undefined,
    readAt: log.readAt,
    reaction: (log.reaction as ReadLog["reaction"]) ?? undefined,
    accessLevel,
  }));

  return NextResponse.json({ ok: true, readLogs: result });
}
