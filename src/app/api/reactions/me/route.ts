import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { and, eq } from "drizzle-orm";
import { reactions, posts } from "@/db/schema";
import { rowToPost } from "@/lib/server/post-row";
import { requireSession } from "@/lib/api-auth";

// Default: {reactions: Record<postId, "like"|"dislike">} — hydrates the
// store's userReactions cache on login/restore.
// ?expand=post&type=like — full liked/disliked Post[] list, for
// ProfilePage's "favorites" tab.
export async function GET(request: NextRequest) {
  const ctx = await requireSession(request);
  if (!ctx) {
    return NextResponse.json({ ok: false, message: "Chưa đăng nhập." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const expand = searchParams.get("expand");
  const type = searchParams.get("type") as "like" | "dislike" | null;

  const db = drizzle(ctx.env.DB);

  if (expand === "post") {
    const conditions = [eq(reactions.userId, ctx.session.sub)];
    if (type) conditions.push(eq(reactions.type, type));
    const rows = await db
      .select({ post: posts })
      .from(reactions)
      .innerJoin(posts, eq(reactions.postId, posts.id))
      .where(and(...conditions))
      .all();
    return NextResponse.json({ ok: true, posts: rows.map((r) => ({ ...rowToPost(r.post), fullContent: "" })) });
  }

  const rows = await db
    .select({ postId: reactions.postId, type: reactions.type })
    .from(reactions)
    .where(eq(reactions.userId, ctx.session.sub))
    .all();

  const result: Record<string, "like" | "dislike"> = {};
  for (const r of rows) result[r.postId] = r.type as "like" | "dislike";

  return NextResponse.json({ ok: true, reactions: result });
}
