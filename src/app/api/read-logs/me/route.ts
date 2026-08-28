import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc } from "drizzle-orm";
import { readLogs } from "@/db/schema";
import { requireSession } from "@/lib/api-auth";
import type { ReadLog } from "@/lib/types";

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

  const result: ReadLog[] = rows.map((log) => ({
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
  }));

  return NextResponse.json({ ok: true, readLogs: result });
}
