import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc } from "drizzle-orm";
import { bookmarks, posts } from "@/db/schema";
import { rowToPost } from "@/lib/server/post-row";
import { requireSession } from "@/lib/api-auth";

// The caller's bookmarked posts (full Post objects, minus fullContent —
// same list-response convention as GET /api/posts). Backs ProfilePage's
// "saved" tab and hydrates the store's `bookmarks` id-array cache on
// login/restore.
export async function GET(request: NextRequest) {
  const ctx = await requireSession(request);
  if (!ctx) {
    return NextResponse.json({ ok: false, message: "Chưa đăng nhập." }, { status: 401 });
  }

  const db = drizzle(ctx.env.DB);
  const rows = await db
    .select({ post: posts, savedAt: bookmarks.createdAt })
    .from(bookmarks)
    .innerJoin(posts, eq(bookmarks.postId, posts.id))
    .where(eq(bookmarks.userId, ctx.session.sub))
    .orderBy(desc(bookmarks.createdAt))
    .all();

  const result = rows.map((r) => ({ ...rowToPost(r.post), fullContent: "" }));
  return NextResponse.json({ ok: true, posts: result });
}
