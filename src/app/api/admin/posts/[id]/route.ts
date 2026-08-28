import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { posts, postRelations } from "@/db/schema";
import { rowToPost } from "@/lib/server/post-row";
import { deletePostCascade } from "@/lib/server/delete-post";
import { requireAdmin } from "@/lib/api-auth";
import type { Post } from "@/lib/types";
import { parseCreditCost } from "@/lib/credit-cost";
import { validateRelatedPostIds } from "@/lib/related-posts";
import {
  findUnavailableRelatedPostIds,
  loadRelatedPostIdMap,
  relationRows,
} from "@/lib/server/related-posts";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Partial<Post> | null;
  if (!body) {
    return NextResponse.json(
      { ok: false, code: "INVALID_POST", message: "Payload không hợp lệ." },
      { status: 400 }
    );
  }

  const db = drizzle(ctx.env.DB);
  const existing = await db.select().from(posts).where(eq(posts.id, id)).get();
  if (!existing) {
    return NextResponse.json(
      { ok: false, code: "POST_NOT_FOUND", message: "Không tìm thấy bài viết." },
      { status: 404 }
    );
  }

  const relationValidation = body.relatedPostIds === undefined
    ? null
    : validateRelatedPostIds(body.relatedPostIds, id);
  if (relationValidation && !relationValidation.ok) {
    return NextResponse.json(
      { ok: false, code: relationValidation.code, message: relationValidation.message },
      { status: 400 }
    );
  }
  if (relationValidation?.ok) {
    const unavailableIds = await findUnavailableRelatedPostIds(db, relationValidation.ids);
    if (unavailableIds.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          code: "RELATED_POST_UNAVAILABLE",
          message: "Bài viết liên quan phải tồn tại và đã được xuất bản.",
          relatedPostIds: unavailableIds,
        },
        { status: 400 }
      );
    }
  }

  if (body.status !== undefined && body.status !== "DRAFT" && body.status !== "PUBLISHED") {
    return NextResponse.json(
      { ok: false, message: "Trạng thái không hợp lệ." },
      { status: 400 }
    );
  }

  const nextStatus = body.status ?? existing.status;
  if (body.creditCost !== undefined) {
    const nextCost = parseCreditCost(body.creditCost, 0);
    const currentCost = parseCreditCost(existing.creditCost, 0);
    const publishedAndStayingPublished = existing.status === "PUBLISHED" && nextStatus === "PUBLISHED";
    if (publishedAndStayingPublished && nextCost !== currentCost) {
      return NextResponse.json(
        { ok: false, message: "Bài đã xuất bản. Chuyển về nháp rồi mới đổi credit." },
        { status: 400 }
      );
    }
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { updatedAt: now };
  const fields: (keyof Post)[] = [
    "title", "pillar", "category", "displaySize", "summarySnippet", "fullContent",
    "readingTimeMinutes", "readingTemplate", "status", "author",
  ];
  for (const f of fields) {
    if (body[f] !== undefined) update[f] = body[f];
  }
  if (body.creditCost !== undefined) {
    update.creditCost = parseCreditCost(body.creditCost, 0);
  }
  if (body.tags !== undefined) update.tags = JSON.stringify(body.tags);

  const updatePost = db.update(posts).set(update).where(eq(posts.id, id));
  if (relationValidation?.ok) {
    const relations = relationRows(id, relationValidation.ids, now);
    const clearRelations = db.delete(postRelations).where(eq(postRelations.sourcePostId, id));
    if (relations.length > 0) {
      // D1 batch is transactional: article fields and the ordered editorial
      // selection either update together or remain at their previous values.
      await db.batch([updatePost, clearRelations, db.insert(postRelations).values(relations)]);
    } else {
      await db.batch([updatePost, clearRelations]);
    }
  } else {
    await updatePost;
  }
  const row = await db.select().from(posts).where(eq(posts.id, id)).get();
  const relatedPostIds = relationValidation?.ok
    ? relationValidation.ids
    : (await loadRelatedPostIdMap(db)).get(id) ?? [];
  return NextResponse.json({
    ok: true,
    post: {
      ...rowToPost(row!),
      relatedPostIds,
    },
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const db = drizzle(ctx.env.DB);

  await deletePostCascade(db, id);

  return NextResponse.json({ ok: true });
}
