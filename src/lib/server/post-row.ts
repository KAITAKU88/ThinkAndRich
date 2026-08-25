import type { posts } from "@/db/schema";
import type { Post } from "@/lib/types";

export type PostRow = typeof posts.$inferSelect;

// D1/Drizzle has no native array type — tags/keyTakeaways are stored as
// JSON text. This is the single place that (de)serializes a DB row into
// the Post shape the rest of the app already knows.
export function rowToPost(row: PostRow): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    pillar: row.pillar as Post["pillar"],
    category: row.category,
    displaySize: row.displaySize as Post["displaySize"],
    academicFormula: row.academicFormula ?? undefined,
    summarySnippet: row.summarySnippet,
    fullContent: row.fullContent,
    schematicSvg: row.schematicSvg ?? undefined,
    keyTakeaways: row.keyTakeaways ? (JSON.parse(row.keyTakeaways) as string[]) : undefined,
    accessLevel: row.accessLevel as Post["accessLevel"],
    readingTimeMinutes: row.readingTimeMinutes,
    readingTemplate: row.readingTemplate ?? null,
    status: row.status as Post["status"],
    views: row.views,
    clicks: row.clicks,
    shares: row.shares,
    likes: row.likes,
    dislikes: row.dislikes,
    author: row.author,
    tags: row.tags ? (JSON.parse(row.tags) as string[]) : [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function postToInsertRow(
  post: Post
): typeof posts.$inferInsert {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    pillar: post.pillar,
    category: post.category,
    displaySize: post.displaySize,
    academicFormula: post.academicFormula ?? null,
    summarySnippet: post.summarySnippet,
    fullContent: post.fullContent,
    schematicSvg: post.schematicSvg ?? null,
    keyTakeaways: post.keyTakeaways ? JSON.stringify(post.keyTakeaways) : null,
    accessLevel: post.accessLevel,
    readingTimeMinutes: post.readingTimeMinutes,
    readingTemplate: post.readingTemplate ?? null,
    status: post.status,
    views: post.views,
    clicks: post.clicks,
    shares: post.shares,
    likes: post.likes,
    dislikes: post.dislikes,
    author: post.author,
    tags: JSON.stringify(post.tags ?? []),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}
