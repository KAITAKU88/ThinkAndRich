import { notLike, type SQL } from "drizzle-orm";
import { posts } from "@/db/schema";

/** Slug prefix for grid-layout test posts — never shown on public surfaces. */
export const DEMO_POST_SLUG_PREFIX = "dummy-post-";

export function isDemoPostSlug(slug: string): boolean {
  return slug.startsWith(DEMO_POST_SLUG_PREFIX);
}

/** Exclude grid-test seed rows that may still exist in D1 from older seeds. */
export function excludeDemoPostsCondition(): SQL {
  return notLike(posts.slug, `${DEMO_POST_SLUG_PREFIX}%`);
}
