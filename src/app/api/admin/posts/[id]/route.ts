import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { posts, bookmarks, reactions, readLogs, shareLogs } from "@/db/schema";
import { rowToPost } from "@/lib/server/post-row";
import { requireAdmin } from "@/lib/api-auth";
import type { Post } from "@/lib/types";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Partial<Post> | null;
  if (!body) return NextResponse.json({ ok: false, message: "Payload không hợp lệ." }, { status: 400 });

  const db = drizzle(ctx.env.DB);
  const existing = await db.select().from(posts).where(eq(posts.id, id)).get();
  if (!existing) return NextResponse.json({ ok: false, message: "Không tìm thấy bài viết." }, { status: 404 });

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { updatedAt: now };
  const fields: (keyof Post)[] = [
    "title", "pillar", "category", "displaySize", "summarySnippet", "fullContent",
    "accessLevel", "readingTimeMinutes", "readingTemplate", "status", "author",
  ];
  for (const f of fields) {
    if (body[f] !== undefined) update[f] = body[f];
  }
  if (body.tags !== undefined) update.tags = JSON.stringify(body.tags);

  await db.update(posts).set(update).where(eq(posts.id, id));
  const row = await db.select().from(posts).where(eq(posts.id, id)).get();
  return NextResponse.json({ ok: true, post: rowToPost(row!) });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const db = drizzle(ctx.env.DB);

  // Explicit cleanup rather than relying on D1's FK cascade pragma (its
  // enforcement under drizzle-orm/d1 hasn't been verified in this repo).
  await db.batch([
    db.delete(bookmarks).where(eq(bookmarks.postId, id)),
    db.delete(reactions).where(eq(reactions.postId, id)),
    db.delete(readLogs).where(eq(readLogs.postId, id)),
    db.delete(shareLogs).where(eq(shareLogs.postId, id)),
    db.delete(posts).where(eq(posts.id, id)),
  ]);

  return NextResponse.json({ ok: true });
}
