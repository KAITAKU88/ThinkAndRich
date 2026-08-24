import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { and, desc, eq } from "drizzle-orm";
import { readLogs } from "@/db/schema";
import { requireAdmin } from "@/lib/api-auth";

// Backs "readers of this post" (?postId=) and "history for this user"
// (?userId=) lookups in the admin UI.
export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  const userId = searchParams.get("userId");

  const conditions = [];
  if (postId) conditions.push(eq(readLogs.postId, postId));
  if (userId) conditions.push(eq(readLogs.userId, userId));

  const db = drizzle(ctx.env.DB);
  const rows = await db
    .select()
    .from(readLogs)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(readLogs.readAt))
    .limit(200)
    .all();

  return NextResponse.json({ ok: true, readLogs: rows });
}
