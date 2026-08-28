import { like, or } from "drizzle-orm";
import { posts } from "@/db/schema";

/** Columns searched by the public listing (Header Ctrl+K and Explore). */
export const PUBLIC_SEARCH_COLUMNS = [
  "title",
  "summarySnippet",
  "tags",
  "fullContent",
  "category",
] as const;

export function publicPostSearchCondition(q: string) {
  const pattern = `%${q}%`;
  return or(
    like(posts.title, pattern),
    like(posts.summarySnippet, pattern),
    like(posts.tags, pattern),
    like(posts.fullContent, pattern),
    like(posts.category, pattern)
  )!;
}
