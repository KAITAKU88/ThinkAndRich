import { drizzle } from "drizzle-orm/d1";
import { eq, or } from "drizzle-orm";
import {
  posts,
  bookmarks,
  reactions,
  readLogs,
  shareLogs,
  postRelations,
  postTranslations,
} from "@/db/schema";

// Shared by the admin Posts API (src/app/api/admin/posts/[id]/route.ts) and
// the MCP delete_draft_post tool (src/lib/mcp/server.ts) — one place that
// knows every table keyed by a post id, so a new one can't be forgotten in
// only half the callers.
//
// Explicit cleanup rather than relying on D1's FK cascade pragma (its
// enforcement under drizzle-orm/d1 hasn't been verified in this repo). D1
// batch is transactional: the article and its dependent rows go together.
export async function deletePostCascade(db: ReturnType<typeof drizzle>, id: string): Promise<void> {
  await db.batch([
    db.delete(bookmarks).where(eq(bookmarks.postId, id)),
    db.delete(reactions).where(eq(reactions.postId, id)),
    db.delete(readLogs).where(eq(readLogs.postId, id)),
    db.delete(shareLogs).where(eq(shareLogs.postId, id)),
    db.delete(postTranslations).where(eq(postTranslations.postId, id)),
    db.delete(postRelations).where(
      or(eq(postRelations.sourcePostId, id), eq(postRelations.relatedPostId, id))
    ),
    db.delete(posts).where(eq(posts.id, id)),
  ]);
}
