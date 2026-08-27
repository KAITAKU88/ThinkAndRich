import { drizzle } from "drizzle-orm/d1";
import { asc, eq, inArray } from "drizzle-orm";
import { postRelations, posts } from "@/db/schema";
import { rowToPost } from "@/lib/server/post-row";
import type { Post } from "@/lib/types";

type Database = ReturnType<typeof drizzle>;

export async function loadRelatedPostIdMap(db: Database): Promise<Map<string, string[]>> {
  const rows = await db
    .select()
    .from(postRelations)
    .orderBy(asc(postRelations.sourcePostId), asc(postRelations.position))
    .all();

  const bySource = new Map<string, string[]>();
  for (const row of rows) {
    const current = bySource.get(row.sourcePostId) ?? [];
    current.push(row.relatedPostId);
    bySource.set(row.sourcePostId, current);
  }
  return bySource;
}

export async function findUnavailableRelatedPostIds(db: Database, ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];

  const rows = await db
    .select({ id: posts.id, status: posts.status })
    .from(posts)
    .where(inArray(posts.id, ids))
    .all();
  const published = new Set(rows.filter((row) => row.status === "PUBLISHED").map((row) => row.id));
  return ids.filter((id) => !published.has(id));
}

export function relationRows(sourcePostId: string, relatedPostIds: string[], createdAt: string) {
  return relatedPostIds.map((relatedPostId, position) => ({
    sourcePostId,
    relatedPostId,
    position,
    createdAt,
  }));
}

export async function loadPublishedRelatedPosts(db: Database, sourcePostId: string): Promise<Post[]> {
  const rows = await db
    .select({ post: posts })
    .from(postRelations)
    .innerJoin(posts, eq(postRelations.relatedPostId, posts.id))
    .where(eq(postRelations.sourcePostId, sourcePostId))
    .orderBy(asc(postRelations.position))
    .all();

  return rows
    .filter(({ post }) => post.status === "PUBLISHED")
    .map(({ post }) => ({ ...rowToPost(post), fullContent: "" }));
}
