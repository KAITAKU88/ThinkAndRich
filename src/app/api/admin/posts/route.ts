import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { posts, bookmarks } from "@/db/schema";
import { rowToPost } from "@/lib/server/post-row";
import { createPost, type CreatePostInput } from "@/lib/server/create-post";
import { requireAdmin } from "@/lib/api-auth";
import type { Post } from "@/lib/types";

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

  const result = rows.map((r) => ({ ...rowToPost(r.post), bookmarkCount: r.bookmarkCount }));
  return NextResponse.json({ ok: true, posts: result });
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as Partial<Post> | null;
  if (!body?.title?.trim() || !body.summarySnippet?.trim()) {
    return NextResponse.json({ ok: false, message: "Thiếu tiêu đề hoặc tóm tắt." }, { status: 400 });
  }

  const db = drizzle(ctx.env.DB);
  // status:"PUBLISHED" only takes effect when the caller explicitly asks
  // for it (the admin form's "Xuất bản" button) — createPost defaults to
  // DRAFT for anything else, including the MCP authoring tools.
  const newPost = await createPost(db, body as CreatePostInput);

  return NextResponse.json({ ok: true, post: newPost });
}
