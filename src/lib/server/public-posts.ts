import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { posts } from "@/db/schema";
import { rowToPost } from "@/lib/server/post-row";
import { publicPostSearchCondition } from "@/lib/server/public-search";
import type { Post } from "@/lib/types";

export interface PublicPostFilters {
  pillar?: string | null;
  q?: string | null;
  sort?: string | null;
  page?: number;
  pageSize?: number;
}

export async function getPublicPosts(dbBinding: D1Database, filters: PublicPostFilters = {}): Promise<Post[]> {
  const db = drizzle(dbBinding);
  const q = filters.q?.trim();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(Math.max(1, filters.pageSize ?? 200), 500);
  const conditions = [eq(posts.status, "PUBLISHED")];

  if (filters.pillar && filters.pillar !== "ALL") {
    conditions.push(eq(posts.pillar, filters.pillar));
  }
  if (q) {
    conditions.push(publicPostSearchCondition(q));
  }

  const orderBy =
    filters.sort === "VIEWS_DESC"
      ? desc(posts.views)
      : filters.sort === "LIKES_DESC"
        ? desc(posts.likes)
        : filters.sort === "DATE_ASC"
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

  return rows.map((row) => ({ ...rowToPost(row), fullContent: "" }));
}
