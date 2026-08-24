import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { and, eq } from "drizzle-orm";
import { posts, reactions } from "@/db/schema";
import { requireSession } from "@/lib/api-auth";

// Toggle like/dislike: same cancel/switch/new delta logic the store used
// to do in-memory, now against `reactions` (join table, source of truth
// for "what did I react") + `posts.likes`/`dislikes` (denormalized totals,
// kept as columns rather than COUNT() since they're read on every card).
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await requireSession(request);
  if (!ctx) {
    return NextResponse.json({ ok: false, message: "Vui lòng xác thực Email OTP để đánh giá bài viết." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { type?: "like" | "dislike" } | null;
  if (body?.type !== "like" && body?.type !== "dislike") {
    return NextResponse.json({ ok: false, message: "Loại đánh giá không hợp lệ." }, { status: 400 });
  }
  const type = body.type;

  const db = drizzle(ctx.env.DB);
  const post = await db.select().from(posts).where(eq(posts.slug, slug)).get();
  if (!post) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy bài viết." }, { status: 404 });
  }

  const existing = await db
    .select()
    .from(reactions)
    .where(and(eq(reactions.userId, ctx.session.sub), eq(reactions.postId, post.id)))
    .get();

  let likeDelta = 0;
  let dislikeDelta = 0;
  let nextReaction: "like" | "dislike" | null;

  if (existing?.type === type) {
    if (type === "like") likeDelta = -1;
    else dislikeDelta = -1;
    nextReaction = null;
  } else if (existing) {
    if (type === "like") {
      likeDelta = 1;
      dislikeDelta = -1;
    } else {
      likeDelta = -1;
      dislikeDelta = 1;
    }
    nextReaction = type;
  } else {
    if (type === "like") likeDelta = 1;
    else dislikeDelta = 1;
    nextReaction = type;
  }

  const now = new Date().toISOString();
  const updatePostCounts = db
    .update(posts)
    .set({
      likes: Math.max(0, post.likes + likeDelta),
      dislikes: Math.max(0, post.dislikes + dislikeDelta),
    })
    .where(eq(posts.id, post.id));

  if (nextReaction === null) {
    await db.batch([
      updatePostCounts,
      db.delete(reactions).where(and(eq(reactions.userId, ctx.session.sub), eq(reactions.postId, post.id))),
    ]);
  } else if (existing) {
    await db.batch([
      updatePostCounts,
      db
        .update(reactions)
        .set({ type: nextReaction, createdAt: now })
        .where(and(eq(reactions.userId, ctx.session.sub), eq(reactions.postId, post.id))),
    ]);
  } else {
    await db.batch([
      updatePostCounts,
      db.insert(reactions).values({ userId: ctx.session.sub, postId: post.id, type: nextReaction, createdAt: now }),
    ]);
  }

  return NextResponse.json({
    ok: true,
    reaction: nextReaction,
    likes: Math.max(0, post.likes + likeDelta),
    dislikes: Math.max(0, post.dislikes + dislikeDelta),
  });
}
