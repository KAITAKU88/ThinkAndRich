import { and, asc, count, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { posts } from "@/db/schema";
import { rowToPost } from "@/lib/server/post-row";
import { excludeDemoPostsCondition } from "@/lib/server/demo-posts";
import { publicPostSearchCondition } from "@/lib/server/public-search";
import type { PillarType, Post } from "@/lib/types";

export interface PublicPostStats {
  totalPublished: number;
  byPillar: Record<PillarType, number>;
}

/** First paint on Explore — keep small for fast SSR; more load client-side. */
export const EXPLORE_INITIAL_PAGE_SIZE = 48;
export const EXPLORE_BACKGROUND_PAGE_SIZE = 60;

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
  const conditions = [eq(posts.status, "PUBLISHED"), excludeDemoPostsCondition()];

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

const PILLAR_TYPES: PillarType[] = ["MENTAL_MODEL", "BUSINESS_STRATEGY", "STARTUP_IDEA"];

export async function getPublicPostStats(dbBinding: D1Database): Promise<PublicPostStats> {
  const db = drizzle(dbBinding);
  const base = and(eq(posts.status, "PUBLISHED"), excludeDemoPostsCondition());

  const [totalRow, pillarRows] = await Promise.all([
    db.select({ total: count() }).from(posts).where(base).get(),
    db
      .select({ pillar: posts.pillar, total: count() })
      .from(posts)
      .where(base)
      .groupBy(posts.pillar)
      .all(),
  ]);

  const byPillar: Record<PillarType, number> = {
    MENTAL_MODEL: 0,
    BUSINESS_STRATEGY: 0,
    STARTUP_IDEA: 0,
  };
  for (const row of pillarRows) {
    if (row.pillar in byPillar) {
      byPillar[row.pillar as PillarType] = Number(row.total);
    }
  }

  return {
    totalPublished: Number(totalRow?.total ?? 0),
    byPillar,
  };
}
