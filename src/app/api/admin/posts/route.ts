import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { posts, bookmarks, postRelations } from "@/db/schema";
import { rowToPost } from "@/lib/server/post-row";
import { createPost, type CreatePostInput } from "@/lib/server/create-post";
import { requireAdmin } from "@/lib/api-auth";
import type { Post } from "@/lib/types";
import { validateRelatedPostIds } from "@/lib/related-posts";
import {
  findUnavailableRelatedPostIds,
  loadRelatedPostIdMap,
  relationRows,
} from "@/lib/server/related-posts";

// Full CRUD for the admin Posts table — unlike the public /api/posts, this
// includes DRAFT posts and never strips fullContent (the editor needs it).
export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const pillar = searchParams.get("pillar");
  const sort = searchParams.get("sort") || "createdAt";
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";

  const db = drizzle(ctx.env.DB);
  const conditions = [];
  if (pillar && pillar !== "ALL") conditions.push(eq(posts.pillar, pillar));
  if (q) conditions.push(or(like(posts.title, `%${q}%`), like(posts.summarySnippet, `%${q}%`))!);

  const sortColumn =
    sort === "views" ? posts.views :
    sort === "clicks" ? posts.clicks :
    sort === "shares" ? posts.shares :
    sort === "title" ? posts.title :
    posts.createdAt;

  const rows = await db
    .select({
      post: posts,
      bookmarkCount: sql<number>`(select count(*) from ${bookmarks} where ${bookmarks.postId} = ${posts.id})`,
    })
    .from(posts)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(dir === "asc" ? sortColumn : desc(sortColumn))
    .all();

  const relatedIdsByPost = await loadRelatedPostIdMap(db);
  const result = rows.map((r) => ({
    ...rowToPost(r.post),
    relatedPostIds: relatedIdsByPost.get(r.post.id) ?? [],
    bookmarkCount: r.bookmarkCount,
  }));
  return NextResponse.json({ ok: true, posts: result });
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as Partial<Post> | null;
  if (!body?.title?.trim() || !body.summarySnippet?.trim()) {
    return NextResponse.json(
      { ok: false, code: "INVALID_POST", message: "Thiếu tiêu đề hoặc tóm tắt." },
      { status: 400 }
    );
  }

  const db = drizzle(ctx.env.DB);
  const relationValidation = validateRelatedPostIds(body.relatedPostIds ?? []);
  if (!relationValidation.ok) {
    return NextResponse.json(
      { ok: false, code: relationValidation.code, message: relationValidation.message },
      { status: 400 }
    );
  }
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
  // status:"PUBLISHED" only takes effect when the caller explicitly asks
  // for it (the admin form's "Xuất bản" button) — createPost defaults to
  // DRAFT for anything else, including the MCP authoring tools.
  const newPost = await createPost(db, body as CreatePostInput);
  const relations = relationRows(newPost.id, relationValidation.ids, newPost.createdAt);
  if (relations.length > 0) await db.insert(postRelations).values(relations);

  return NextResponse.json({ ok: true, post: { ...newPost, relatedPostIds: relationValidation.ids } });
}
