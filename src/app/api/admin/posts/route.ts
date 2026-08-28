import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
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

type StatusFilter = "ALL" | "DRAFT" | "PUBLISHED";

function parsePageSize(raw: string | null): 50 | 100 {
  return raw === "100" ? 100 : 50;
}

// Full CRUD for the admin Posts table — unlike the public /api/posts, this
// includes DRAFT posts and never strips fullContent (the editor needs it).
export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const db = drizzle(ctx.env.DB);

  // Slim published titles for the related-post picker — not the paginated table.
  if (searchParams.get("picker") === "1") {
    const rows = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        status: posts.status,
        category: posts.category,
      })
      .from(posts)
      .where(eq(posts.status, "PUBLISHED"))
      .orderBy(asc(posts.title))
      .limit(500)
      .all();
    return NextResponse.json({ ok: true, posts: rows });
  }

  const q = searchParams.get("q")?.trim();
  const pillar = searchParams.get("pillar");
  const statusParam = searchParams.get("status");
  const status: StatusFilter =
    statusParam === "DRAFT" || statusParam === "PUBLISHED" ? statusParam : "ALL";
  const sort = searchParams.get("sort") || "updatedAt";
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = parsePageSize(searchParams.get("pageSize"));

  const baseConditions = [];
  if (pillar && pillar !== "ALL") baseConditions.push(eq(posts.pillar, pillar));
  if (q) baseConditions.push(or(like(posts.title, `%${q}%`), like(posts.summarySnippet, `%${q}%`))!);

  const listConditions = [...baseConditions];
  if (status !== "ALL") listConditions.push(eq(posts.status, status));

  const bookmarkCount = sql<number>`(select count(*) from ${bookmarks} where ${bookmarks.postId} = ${posts.id})`.as(
    "bookmarkCount"
  );

  const sortColumn =
    sort === "views"
      ? posts.views
      : sort === "clicks"
        ? posts.clicks
        : sort === "shares"
          ? posts.shares
          : sort === "title"
            ? posts.title
            : sort === "bookmarkCount"
              ? bookmarkCount
              : sort === "createdAt"
                ? posts.createdAt
                : posts.updatedAt;

  const countRows = await db
    .select({
      status: posts.status,
      n: sql<number>`count(*)`,
    })
    .from(posts)
    .where(baseConditions.length ? and(...baseConditions) : undefined)
    .groupBy(posts.status)
    .all();

  const counts = { ALL: 0, DRAFT: 0, PUBLISHED: 0 };
  for (const row of countRows) {
    const n = Number(row.n) || 0;
    counts.ALL += n;
    if (row.status === "DRAFT") counts.DRAFT = n;
    if (row.status === "PUBLISHED") counts.PUBLISHED = n;
  }

  const total =
    status === "DRAFT" ? counts.DRAFT : status === "PUBLISHED" ? counts.PUBLISHED : counts.ALL;

  const rows = await db
    .select({
      post: posts,
      bookmarkCount,
    })
    .from(posts)
    .where(listConditions.length ? and(...listConditions) : undefined)
    .orderBy(dir === "asc" ? asc(sortColumn) : desc(sortColumn))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all();

  const relatedIdsByPost = await loadRelatedPostIdMap(db);
  const result = rows.map((r) => ({
    ...rowToPost(r.post),
    relatedPostIds: relatedIdsByPost.get(r.post.id) ?? [],
    bookmarkCount: r.bookmarkCount,
  }));
  return NextResponse.json({
    ok: true,
    posts: result,
    total,
    page,
    pageSize,
    counts,
  });
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
