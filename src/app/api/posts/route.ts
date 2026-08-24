import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { and, desc, asc, eq, like, or } from "drizzle-orm";
import { posts } from "@/db/schema";
import { rowToPost } from "@/lib/server/post-row";
import type { Post } from "@/lib/types";

// Public post listing — Home/Explore fetch from here instead of a mock
// array. Never returns `fullContent` (list cards only need the summary)
// and always forces status=PUBLISHED for these unauthenticated-safe
// results; drafts are only visible via /api/admin/posts.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pillar = searchParams.get("pillar");
  const q = searchParams.get("q")?.trim();
  const sort = searchParams.get("sort") ?? "DATE_DESC";
  const pageSize = Math.min(Number(searchParams.get("pageSize")) || 200, 500);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const { env } = getCloudflareContext();
  const db = drizzle(env.DB);

  const conditions = [eq(posts.status, "PUBLISHED")];
  if (pillar && pillar !== "ALL") conditions.push(eq(posts.pillar, pillar));
  if (q) {
    conditions.push(
      or(like(posts.title, `%${q}%`), like(posts.summarySnippet, `%${q}%`), like(posts.tags, `%${q}%`))!
    );
  }

  const orderBy =
    sort === "VIEWS_DESC"
      ? desc(posts.views)
      : sort === "LIKES_DESC"
        ? desc(posts.likes)
        : sort === "DATE_ASC"
          ? asc(posts.createdAt)
          : desc(posts.createdAt);

  const rows = await db
    .select()
    .from(posts)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all();

  const result: Post[] = rows.map((row) => {
    const post = rowToPost(row);
    return { ...post, fullContent: "" };
  });

  return NextResponse.json({ ok: true, posts: result, page, pageSize });
}
