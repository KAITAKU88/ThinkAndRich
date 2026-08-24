import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { and, eq } from "drizzle-orm";
import { posts, bookmarks } from "@/db/schema";
import { requireSession } from "@/lib/api-auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await requireSession(request);
  if (!ctx) {
    return NextResponse.json({ ok: false, message: "Vui lòng xác thực Email OTP để lưu bài viết." }, { status: 401 });
  }

  const db = drizzle(ctx.env.DB);
  const post = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).get();
  if (!post) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy bài viết." }, { status: 404 });
  }

  const existing = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, ctx.session.sub), eq(bookmarks.postId, post.id)))
    .get();

  if (existing) {
    await db.delete(bookmarks).where(and(eq(bookmarks.userId, ctx.session.sub), eq(bookmarks.postId, post.id)));
    return NextResponse.json({ ok: true, bookmarked: false });
  }

  await db.insert(bookmarks).values({
    userId: ctx.session.sub,
    postId: post.id,
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true, bookmarked: true });
}
